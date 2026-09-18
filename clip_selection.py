"""
Pure helpers for the Gemini clip-selection pipeline.

Standard-library only so both main.py and gemini_worker.py can import it and
the logic stays unit-testable without the heavy video dependencies.
"""

# USD per 1M tokens (input, output incl. thinking), from ai.google.dev pricing.
MODEL_PRICES = {
    "gemini-3.5-flash": (1.50, 9.00),
    "gemini-3.1-flash-lite": (0.25, 1.50),
    "gemini-3-flash-preview": (0.50, 3.00),
    "gemini-2.5-flash-lite": (0.10, 0.40),
    "gemini-2.5-flash": (0.30, 2.50),
    "gemini-2.0-flash": (0.10, 0.40),  # deprecated (shut down 2026-06-01)
}


def lookup_model_prices(model_name):
    """Longest-prefix match against MODEL_PRICES; None if unknown."""
    name = str(model_name or "").lower()
    best_key = None
    for key in MODEL_PRICES:
        if name.startswith(key) and (best_key is None or len(key) > len(best_key)):
            best_key = key
    return MODEL_PRICES[best_key] if best_key else None


def clip_count_targets(n_windows):
    """How many clips to ask the detail pass for, given the shortlist size.

    Measured on prod 3-ago-2026: 408 of 429 jobs (95%) delivered 3 clips or
    fewer, the mode being ONE, while the prompt was free to return one per
    shortlisted window. Users who received 1-3 clips came back a second day
    0.4% of the time; those who received 4-9 came back 16.1% — so the clip
    count, not the clip quality, is what the retention curve hangs on.

    The old prompt biased hard the other way ("prefer one great clip per
    candidate window") and handed the model two unbounded licences to drop
    clips (the 2-second rule and STANDS ALONE both end in "or skip it"), with
    no floor to stop it collapsing to a single clip. This puts a floor and a
    realistic ceiling on it instead.

    ``CLIP_TARGET_MIN`` / ``CLIP_TARGET_MAX`` override both for A/B runs
    without a deploy (the reframe-testing harness drives them).
    """
    import os

    n = max(1, int(n_windows or 1))
    # Floor grows with the material: 3 windows -> 3, 5 -> 4, 10+ -> 6.
    low = max(2, min(6, n // 2 + 2))
    # Ceiling allows a rich window to yield more than one without inviting padding.
    high = min(12, max(4, n * 2))
    low = min(low, high)

    def _override(name, current):
        raw = os.environ.get(name)
        if not raw:
            return current
        try:
            return max(1, int(raw))
        except ValueError:
            return current

    low = _override("CLIP_TARGET_MIN", low)
    high = _override("CLIP_TARGET_MAX", high)
    return low, max(low, high)


def compute_viral_score_v2(clip_dict: dict) -> int:
    """Computes the Viral Potential Ranking Score (v2) from 12 multi-dimensional signals.

    Base Score Weights:
      Hook Strength:        20%
      Retention Potential:  20%
      Payoff Quality:       15%
      Curiosity Gap:        15%
      Emotional Intensity:  10%
      Surprise / Novelty:    5%
      Relatability:          5%
      Conflict / Tension:    5%
      Shareability:          5%

    Quality Modifiers:
      Standalone Clarity:   positive impact
      Clipability:          positive impact
      Context Dependency:   negative penalty

    Quality factor formula:
      QF = 0.50 + 0.30 * (standalone / 100) + 0.20 * (clipability / 100) - 0.30 * (context_dep / 100)
      bounded between [0.25, 1.05]

    FINAL SCORE = clamp(round(Base Score * Quality Factor), 0, 100)
    """
    def _val(k, default=None):
        v = clip_dict.get(k)
        if v is None:
            return default
        try:
            return max(0.0, min(100.0, float(v)))
        except (TypeError, ValueError):
            return default

    hook = _val("hook_score")
    retention = _val("retention_score")
    payoff = _val("payoff_score")
    curiosity = _val("curiosity_score")
    emotion = _val("emotion_score")
    surprise = _val("surprise_score")
    relatability = _val("relatability_score")
    conflict = _val("conflict_score")
    shareability = _val("shareability_score")

    # If all component scores are missing, fallback to existing predicted_score
    components = [hook, retention, payoff, curiosity, emotion, surprise, relatability, conflict, shareability]
    if all(c is None for c in components):
        raw = clip_dict.get("predicted_score")
        if raw is None:
            return 0
        try:
            return int(round(max(0.0, min(100.0, float(raw)))))
        except (TypeError, ValueError):
            return 0

    # Fill default for any individually missing component
    h = hook if hook is not None else 50.0
    r = retention if retention is not None else 50.0
    p = payoff if payoff is not None else 50.0
    c = curiosity if curiosity is not None else 50.0
    e = emotion if emotion is not None else 40.0
    s = surprise if surprise is not None else 40.0
    rel = relatability if relatability is not None else 50.0
    conf = conflict if conflict is not None else 30.0
    sh = shareability if shareability is not None else 40.0

    base_score = (
        0.20 * h +
        0.20 * r +
        0.15 * p +
        0.15 * c +
        0.10 * e +
        0.05 * s +
        0.05 * rel +
        0.05 * conf +
        0.05 * sh
    )

    standalone = _val("standalone_score", default=75.0)
    clipability = _val("clipability_score", default=75.0)
    context_dep = _val("context_dependency", default=20.0)

    quality_factor = (
        0.50 +
        0.30 * (standalone / 100.0) +
        0.20 * (clipability / 100.0) -
        0.30 * (context_dep / 100.0)
    )
    quality_factor = max(0.25, min(1.05, quality_factor))

    final_score = int(round(max(0.0, min(100.0, base_score * quality_factor))))
    return final_score


def trim_to_best(shorts, max_clips, overlap_threshold=0.35):
    """Cut an over-long detail-pass result down to ``max_clips`` BY SCORE and DIVERSITY.

    Applies:
      1. Multi-signal ranking key (predicted_score, payoff_score, retention_score, standalone_score)
      2. Overlap suppression: if two clips overlap significantly in time (> overlap_threshold),
         suppresses the lower-ranked duplicate.
      3. Topic / content diversity: ensures candidates do not all come from the same repetitive pattern.
      4. Transcript order preservation: returns survivors sorted by chronological start time.
    """
    max_clips = max(1, int(max_clips or 1))
    if not shorts:
        return []

    # Helper for clip score calculation and ranking
    def _rank_key(item):
        idx, c = item
        try:
            score = float(c.get("predicted_score") if c.get("predicted_score") is not None else 0.0)
        except (TypeError, ValueError, AttributeError):
            score = 0.0
        payoff = float(c.get("payoff_score") or 0.0)
        retention = float(c.get("retention_score") or 0.0)
        standalone = float(c.get("standalone_score") or 0.0)
        # Negative idx keeps ties in transcript order
        return (score, payoff, retention, standalone, -idx)

    def _overlap(c1, c2):
        s1, e1 = float(c1.get("start", 0)), float(c1.get("end", 0))
        s2, e2 = float(c2.get("start", 0)), float(c2.get("end", 0))
        dur1 = max(0.1, e1 - s1)
        dur2 = max(0.1, e2 - s2)
        inter = max(0.0, min(e1, e2) - max(s1, s2))
        return inter / min(dur1, dur2)

    # Sort all candidates by rank key descending
    indexed = list(enumerate(shorts))
    ranked = sorted(indexed, key=_rank_key, reverse=True)

    # If the candidate count already fits and there are no severe overlaps, keep them
    if len(shorts) <= max_clips:
        has_severe_dupe = False
        for i in range(len(shorts)):
            for j in range(i + 1, len(shorts)):
                if _overlap(shorts[i], shorts[j]) > 0.70:
                    has_severe_dupe = True
                    break
            if has_severe_dupe:
                break
        if not has_severe_dupe:
            return list(shorts)

    # Greedy selection with overlap suppression and diversity preference
    selected = []
    content_type_counts = {}

    for idx, cand in ranked:
        if len(selected) >= max_clips:
            break

        # Check overlap against already selected clips
        is_overlapping = False
        for sel in selected:
            ov = _overlap(cand, sel)
            if ov > overlap_threshold:
                # If they overlap, check if candidate has distinct story/payoff
                # If overlap is very high (> 0.50), always suppress
                if ov > 0.50 or cand.get("content_type") == sel.get("content_type"):
                    is_overlapping = True
                    break

        if is_overlapping:
            continue

        # Check excessive content type repetition (diversity)
        ctype = cand.get("content_type") or "general"
        if content_type_counts.get(ctype, 0) >= 2 and len(ranked) > max_clips:
            continue

        selected.append(cand)
        content_type_counts[ctype] = content_type_counts.get(ctype, 0) + 1

    # If overlap suppression was too strict and we need more clips to reach max_clips,
    # fill from remaining ranked candidates
    if len(selected) < max_clips:
        for idx, cand in ranked:
            if cand not in selected:
                if not any(_overlap(cand, sel) > 0.75 for sel in selected):
                    selected.append(cand)
                    if len(selected) >= max_clips:
                        break

    # If still below 1 (e.g. max_clips >= 1 but empty), ensure at least highest ranked is in
    if not selected and ranked:
        selected.append(ranked[0][1])

    # Re-sort by original chronological start time
    return sorted(selected, key=lambda c: float(c.get("start", 0)))


def clip_duration_bounds():
    """The clip length band (seconds) the selection prompts and word-snapping
    enforce. ``CLIP_MIN_SECONDS`` / ``CLIP_MAX_SECONDS`` override the classic
    15-60 — set per job by /api/process when the user asks for a specific
    length, or by hand for A/B runs. Values are clamped to platform-sane
    limits and re-ordered so bad input degrades instead of breaking the job.
    """
    import os

    def _read(name, default):
        try:
            return float(os.environ.get(name, ""))
        except ValueError:
            return default

    lo = _read("CLIP_MIN_SECONDS", 15.0)
    hi = _read("CLIP_MAX_SECONDS", 60.0)
    lo = min(max(lo, 5.0), 175.0)
    hi = min(max(hi, 10.0), 180.0)
    if hi < lo + 5.0:  # keep a real band: degenerate ranges starve the model
        hi = min(180.0, lo + 5.0)
    return round(lo, 3), round(hi, 3)


def compact_words(words, precision=2):
    """Round word timestamps for prompts — full float precision wastes tokens."""
    return [
        {
            "w": w.get("w", ""),
            "s": round(float(w.get("s", 0)), precision),
            "e": round(float(w.get("e", 0)), precision),
        }
        for w in words
    ]


def build_transcript_windows(transcript_result, video_duration,
                             window_seconds=90, overlap_seconds=30):
    """
    Build scoring windows aligned to Whisper segment boundaries, so a sentence
    (and usually a viral moment) is never cut in half mid-window. Windows grow
    segment by segment to roughly window_seconds (up to 1.25x for the closing
    segment) and the next window starts ~overlap_seconds before the previous
    end, also snapped to a segment start.
    """
    segments = []
    for segment in transcript_result.get("segments", []):
        text = str(segment.get("text") or "").strip()
        if not text:
            continue
        segments.append((float(segment.get("start", 0)), float(segment.get("end", 0)), text))

    windows = []
    window_index = 1
    i = 0
    n = len(segments)
    while i < n:
        w_start = segments[i][0]
        j = i
        # Extend while the NEXT segment still fits within a tolerant cap, so the
        # window closes on a segment boundary near window_seconds.
        while j + 1 < n and segments[j + 1][1] - w_start <= window_seconds * 1.25:
            j += 1
            if segments[j][1] - w_start >= window_seconds:
                break
        w_end = segments[j][1]
        windows.append({
            "id": f"window_{window_index:03d}",
            "start": round(w_start, 3),
            "end": round(w_end, 3),
            "text": " ".join(seg[2] for seg in segments[i:j + 1]),
        })
        window_index += 1

        if j >= n - 1:
            break
        # Next window starts at the first segment beginning after (end - overlap),
        # but always makes progress.
        target = w_end - overlap_seconds
        k = i + 1
        while k <= j and segments[k][0] < target:
            k += 1
        i = max(k, i + 1)

    if not windows:
        windows.append({
            "id": "window_001",
            "start": 0.0,
            "end": round(float(video_duration), 3),
            "text": str(transcript_result.get("text", "") or ""),
        })
    return windows


def snap_clip_to_words(start, end, words, video_duration,
                       min_duration=15.0, max_duration=60.0,
                       search_window=1.5, max_lead=0.35, max_tail=0.45):
    """
    Snap Gemini-proposed clip boundaries onto real word boundaries plus a bit
    of the surrounding silence. LLMs are bad at millisecond arithmetic; the
    word-level timestamps are ground truth, so cuts land in pauses instead of
    mid-word.

    words: [{'w','s','e'}, ...] for the whole video, sorted by start.
    Returns (start, end); falls back to the input if no words are nearby or
    snapping cannot satisfy the duration bounds.
    """
    original = (round(float(start), 3), round(float(end), 3))
    if not words:
        return original

    starts = [float(w.get("s", 0)) for w in words]
    ends = [float(w.get("e", 0)) for w in words]

    # START: snap to the nearest word start, then lead into the silence before it.
    new_start = float(start)
    candidates = [s for s in starts if abs(s - new_start) <= search_window]
    if candidates:
        word_start = min(candidates, key=lambda s: abs(s - new_start))
        prev_ends = [e for e in ends if e <= word_start]
        if prev_ends:
            gap = max(0.0, word_start - max(prev_ends))
            lead = min(max_lead, gap / 2)
        else:
            lead = max_lead
        new_start = max(0.0, word_start - lead)

    # END: snap to the nearest word end, then trail into the silence after it.
    new_end = float(end)
    candidates = [e for e in ends if abs(e - new_end) <= search_window]
    if candidates:
        word_end = min(candidates, key=lambda e: abs(e - new_end))
        next_starts = [s for s in starts if s >= word_end]
        if next_starts:
            gap = max(0.0, min(next_starts) - word_end)
            tail = min(max_tail, gap / 2)
        else:
            tail = max_tail
        new_end = min(float(video_duration), word_end + tail)

    # Repair duration bounds while staying on word boundaries.
    if new_end - new_start < min_duration:
        target = new_start + min_duration
        later = sorted(e for e in ends if e >= target)
        if later and later[0] - new_start <= max_duration:
            new_end = min(float(video_duration), later[0] + 0.2)
        else:
            return original
    if new_end - new_start > max_duration:
        target = new_start + max_duration
        earlier = [e for e in ends if new_start < e <= target]
        new_end = (max(earlier) + 0.2) if earlier else target
        new_end = min(new_end, new_start + max_duration, float(video_duration))

    if new_end <= new_start or new_end - new_start < min_duration:
        return original
    return (round(new_start, 3), round(new_end, 3))
