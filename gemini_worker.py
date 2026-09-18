import argparse
import json
import os
import sys
from typing import Any, List, Optional, Union

from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types
from pydantic import BaseModel, Field, model_validator

from clip_selection import (clip_count_targets, clip_duration_bounds,
                            lookup_model_prices)

load_dotenv()


# --- Structured output schemas (passed as response_schema so the API
# --- guarantees the format instead of us repairing free-form JSON). ---

class ScoutEventModel(BaseModel):
    event_id: Optional[str] = ""
    start_time: Optional[float] = 0.0
    end_time: Optional[float] = 0.0
    type: Optional[str] = ""
    hook_strength: Optional[int] = 0
    curiosity: Optional[int] = 0
    emotion: Optional[int] = 0
    surprise: Optional[int] = 0
    payoff_potential: Optional[int] = 0
    reason: Optional[str] = ""

    # Aliases
    event_summary: Optional[str] = None
    event_start: Optional[float] = None
    event_end: Optional[float] = None
    signal_type: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def handle_event_aliases(cls, values):
        if isinstance(values, dict):
            if "start_time" not in values and "event_start" in values:
                values["start_time"] = values["event_start"]
            if "end_time" not in values and "event_end" in values:
                values["end_time"] = values["event_end"]
            if "reason" not in values and "event_summary" in values:
                values["reason"] = values["event_summary"]
            if "type" not in values and "signal_type" in values:
                values["type"] = values["signal_type"]
        return values


class ScoutWindowModel(BaseModel):
    id: Union[str, int]
    start: Optional[float] = None
    end: Optional[float] = None
    window_score: int = Field(default=0)
    score: Optional[int] = None
    hook_promise: Optional[str] = ""
    events: Optional[List[ScoutEventModel]] = Field(default_factory=list)
    reason: Optional[str] = ""
    has_editorial_substance: Optional[bool] = True

    @model_validator(mode="before")
    @classmethod
    def handle_score_alias(cls, values):
        if isinstance(values, dict):
            if "window_score" not in values and "score" in values:
                values["window_score"] = values["score"]
            elif "score" not in values and "window_score" in values:
                values["score"] = values["window_score"]
        return values


# Backward-compatible alias
ScoredWindowModel = ScoutWindowModel


class ScoreResponse(BaseModel):
    windows: List[ScoutWindowModel] = Field(default_factory=list)


class DetailClipModel(BaseModel):
    start: Optional[float] = None
    end: Optional[float] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    source_window_id: Optional[str] = None
    predicted_score: int

    # V2 Multi-dimensional component scores
    hook_type: Optional[str] = None
    hook_score: Optional[int] = None

    retention_score: Optional[int] = None
    retention_risk: Optional[str] = "low"
    retention_drop_reason: Optional[str] = ""

    payoff_score: Optional[int] = None
    payoff_type: Optional[str] = None

    curiosity_score: Optional[int] = None
    emotion_score: Optional[int] = None
    dominant_emotion: Optional[str] = None

    surprise_score: Optional[int] = None
    relatability_score: Optional[int] = None
    conflict_score: Optional[int] = None
    shareability_score: Optional[int] = None
    share_reason: Optional[str] = ""

    standalone_score: Optional[int] = None
    clipability_score: Optional[int] = None
    context_dependency: Optional[int] = None

    hook_rewrite_potential: Optional[bool] = False
    editorial_hook_suggestion: Optional[str] = None

    content_type: Optional[str] = None
    reason: Optional[str] = None

    video_description_for_tiktok: Optional[str] = ""
    video_description_for_instagram: Optional[str] = ""
    video_title_for_youtube_short: Optional[str] = ""
    viral_hook_text: Optional[str] = ""

    @model_validator(mode="before")
    @classmethod
    def handle_time_aliases(cls, values):
        if isinstance(values, dict):
            if "start" not in values and "start_time" in values:
                values["start"] = values["start_time"]
            elif "start_time" not in values and "start" in values:
                values["start_time"] = values["start"]

            if "end" not in values and "end_time" in values:
                values["end"] = values["end_time"]
            elif "end_time" not in values and "end" in values:
                values["end_time"] = values["end"]
        return values


class DetailResponse(BaseModel):
    shorts: List[DetailClipModel] = Field(default_factory=list)
    candidates: Optional[List[DetailClipModel]] = None

    @model_validator(mode="before")
    @classmethod
    def handle_candidates_alias(cls, values):
        if isinstance(values, dict):
            if ("shorts" not in values or not values["shorts"]) and "candidates" in values:
                values["shorts"] = values["candidates"]
        return values


# Visual (no-transcript) clip selection: Gemini watches a silent video and
# picks moments from the imagery. Same output shape as DetailClipModel minus
# the transcript-only source_window_id.
class VisualClipModel(BaseModel):
    start: float
    end: float
    predicted_score: int
    video_description_for_tiktok: str
    video_description_for_instagram: str
    video_title_for_youtube_short: str
    viral_hook_text: str


class VisualResponse(BaseModel):
    shorts: List[VisualClipModel]


VISUAL_PROMPT_TEMPLATE = """
You are a senior short-form video editor. This video has NO speech/audio — judge
it purely by what you SEE. Watch the whole thing and pick the {min_clips}–{max_clips} MOST engaging
visual moments for TikTok / Reels / Shorts (action, reveals, transformations,
striking or funny shots, satisfying payoffs, dramatic movement).

TIME CONTRACT — STRICT:
- Timestamps in ABSOLUTE SECONDS from the start (usable with ffmpeg -ss/-to).
- Only numbers with up to 3 decimals (e.g. 0, 12.5, 47.250).
- 0 <= start < end <= {video_duration}.
- Each clip {min_secs:g} to {max_secs:g} seconds long. If the whole video is
  shorter than {min_secs:g}s, return one clip spanning the full video.
- Cut on visual scene changes, never mid-motion.

For each clip write catchy copy in {language} (a scroll-stopping hook, a TikTok
and an Instagram description, and a YouTube title ≤100 chars). Order clips best
to worst by how likely they are to stop a viewer scrolling.
"""


# Grounded rewrite of hook + title for a clip whose meaning lives on screen
# (SCREENCAST / WIDE / INSET stretches): the detail pass never saw a frame,
# so its hook summarises the topic instead of naming what is being shown.
class GroundedHook(BaseModel):
    on_screen: str
    viral_hook_text: str
    video_title_for_youtube_short: str


GROUNDED_HOOK_PROMPT = """
These frames come from ONE short clip (the whole clip, in order) and the
transcript below is exactly what is said during it. Most of this clip's
meaning is on the screen, not in the face.

1. `on_screen`: one line naming what is shown — the app, window, product,
   document, code, chart or on-screen text — as specifically as the frames
   allow (read visible titles and labels).
2. `viral_hook_text`: max 10 words, in TRANSCRIPT_LANGUAGE. It MUST mention
   the thing you named in `on_screen` (or the action being done to it: set
   up, connect, compare, fix, type) AND keep the strongest concrete fact of
   the clip: a number, a multiplier, a price, a name ("7x faster", "$136 a
   month", "3,400 stars") from the transcript or the current hook. Never a
   summary of the video's general topic, never a slogan that would fit any
   clip of this video, never drop a figure for a vaguer phrase.
3. `video_title_for_youtube_short`: max 100 chars, same rule, in
   TRANSCRIPT_LANGUAGE, no fake claims.

The current hook and title below were written WITHOUT seeing the frames and
are the kind of topic summary you must replace. Do not reuse their wording.

TRANSCRIPT_LANGUAGE: {language}
CURRENT_HOOK (to replace): {current_hook}
CURRENT_TITLE (to replace): {current_title}
TRANSCRIPT:
{transcript}

Return only:
{{"on_screen": "<one line>", "viral_hook_text": "<max 10 words>", "video_title_for_youtube_short": "<max 100 chars>"}}
"""


class LayoutChoice(BaseModel):
    layout: str
    confidence: float
    why: str


# Scored 94/92/96% over the 48-clip corpus against hand-checked labels, with
# 0-1 false positives out of the 28 clips that must not be touched. Do not
# reword casually: the wins come from the explicit "none is usually right"
# instruction and from naming the exact decorations (corner bugs, score
# counters, subtitles) that four earlier attempts kept mistaking for content.
LAYOUT_CHOICE_PROMPT = """
These frames are sampled at regular intervals from a single landscape video.
You are choosing how to re-frame that video into a vertical 9:16 clip.

Pick ONE layout:

- "none": crop to the speaker and fill the frame. This is the RIGHT answer for
  ordinary talking heads, interviews shot in close-up, b-roll, sport, action,
  music, and any footage whose meaning survives a centre crop. Corner logos,
  score bugs, subscriber counters, lower-thirds and burned-in subtitles do NOT
  change this: they are decoration, and losing them costs nothing.
- "screencast": keep the screen. ONLY when the video is built around a screen
  recording, slides, a spreadsheet, a chart or a map that the viewer must read
  to follow it. If you cannot read words or numbers off the screen that matter
  to the point being made, it is not this.
  (A "camera_inset" option was added here and removed on 31-jul-2026. Whether a
  webcam is composited into a corner of that screen is not something the model
  can see: on the five clips that have one it answered "screencast" every time,
  in both runs, while overall accuracy fell from 92% to 83-85%. camera_inset.py
  finds the same five geometrically with no false positives, so that question is
  answered downstream instead of being asked here.)
- "split": stack two people. ONLY when two people are visible IN THE SAME SHOT
  at the same time in most frames, talking to each other. Frames that alternate
  between one-person close-ups are NOT this, however many people appear.

"none" is by far the most common correct answer. Choose anything else only if
you would defend it to an editor. If you are unsure, answer "none".

confidence is 0..1. why is at most 12 words.
"""


class WideContentRangeModel(BaseModel):
    start: float
    end: float
    what: str
    width_fraction: float


class WideContentResponse(BaseModel):
    ranges: List[WideContentRangeModel]


WIDE_CONTENT_PROMPT_TEMPLATE = """
You are preparing a landscape video to be re-framed to a vertical 9:16 crop.
The crop keeps a tall centre strip and THROWS AWAY the left and right sides.

List every time range where on-screen content would be cut by that, and for each
one report HOW MUCH OF THE FRAME WIDTH the content spans.

width_fraction is the single most important field. Measure the content's own
horizontal extent, from its left edge to its right edge, as a fraction of the
full frame width:
- a spreadsheet, slide, screen recording or map filling the picture: 0.9 - 1.0
- a chart or diagram beside a speaker: 0.4 - 0.7
- a lower-third or headline strip across the bottom: 0.6 - 0.9
- a logo, channel bug, score counter or subscriber count in a corner: 0.1 - 0.2
- subtitles centred at the bottom: 0.3 - 0.5

Report what you actually see. Do NOT inflate the number to make a range seem
worth reporting, and do NOT leave out corner graphics — report them with their
true small width_fraction. A range reported honestly at 0.15 is useful; the same
range reported at 0.9 makes the video worse.

COUNT a range when the frame shows:
- a screen recording, slide, spreadsheet, chart, graph or map
- headlines, labels, statistics or comparison tables burned into the picture
- a side-by-side or split-screen layout
- any diagram or product shot where the edges carry the meaning

DO NOT count an ordinary talking head, even against a busy background, and do
not count b-roll, landscapes, crowds or action footage with no graphics.

TIME CONTRACT — STRICT:
- ABSOLUTE SECONDS from the start, numbers only, up to 3 decimals.
- 0 <= start < end <= {video_duration}.
- Merge ranges that are less than 1 second apart.
- Return an EMPTY list if the video never shows such content. An empty list is
  the correct, expected answer for most talking-head and b-roll videos — do not
  invent ranges to seem useful.

For "what", name the content in three words or fewer (e.g. "stock chart",
"spreadsheet", "corner ticker").
"""


def _configure_stdio() -> None:
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if not stream or not hasattr(stream, "reconfigure"):
            continue
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass


def _log(message: str) -> None:
    stream = sys.stdout
    text = str(message)
    try:
        stream.write(text + "\n")
    except UnicodeEncodeError:
        encoding = getattr(stream, "encoding", None) or "utf-8"
        safe_text = text.encode(encoding, errors="replace").decode(encoding, errors="replace")
        stream.write(safe_text + "\n")
    stream.flush()

SCORE_PROMPT_TEMPLATE = """
You are a senior short-form video content scout and viral strategist.
Scan the transcript windows below and identify high-potential EVENT regions inside each window.

EVENT DISCOVERY:
For each window, identify up to 5 candidate events. An event can be:
- personal story / confession / failure
- surprising statement / unusual fact / counterintuitive insight
- strong opinion / contrarian take / controversy
- funny moment / humor setup
- emotional moment / vulnerable reaction
- clear problem + solution (question + answer, setup + payoff)

For each event:
- Identify approximate `start_time` and `end_time` using actual timestamps from the transcript (NEVER invent timestamps).
- Rate `hook_strength`, `curiosity`, `emotion`, `surprise`, `payoff_potential` on a 0-100 scale.
- Provide a concise `reason`.

LOW-SIGNAL FILTER (STRICT DOWNGRADE):
Heavily penalize or reject windows containing:
- Greetings and housekeeping: "halo teman-teman", "selamat datang kembali", "welcome back"
- Podcast host pleasantries and guest introductions
- Sponsor messages and commercial advertisements
- Outros, subscription requests, "like, comment, and subscribe"
- Repetitive rambling, filler, and long pauses
- Unrecoverable context fragments: "seperti yang tadi saya bilang", "nah itu tadi", "seperti yang kita bahas sebelumnya"

Calculate `window_score` (0-100 integer) based on the overall viral potential of the events discovered.

AUDIENCE REPLAY SIGNALS:
If any window has `youtube_audience_replay_peak`, real YouTube viewers frequently rewound and replayed this exact part of the video. Strongly prioritize this window as a verified high-engagement moment.

TRANSCRIPT_LANGUAGE: {language}
VIDEO_DURATION_SECONDS: {video_duration}
WINDOWS_JSON:
{windows_json}

Return ONLY valid JSON matching this exact structure:
{{
  "windows": [
    {{
      "id": "<window id>",
      "start": <number>,
      "end": <number>,
      "window_score": <integer 0-100>,
      "events": [
        {{
          "event_id": "event_1",
          "start_time": <number>,
          "end_time": <number>,
          "type": "<story|opinion|insight|surprise|humor|emotion>",
          "hook_strength": <integer 0-100>,
          "curiosity": <integer 0-100>,
          "emotion": <integer 0-100>,
          "surprise": <integer 0-100>,
          "payoff_potential": <integer 0-100>,
          "reason": "<concise reason>"
        }}
      ]
    }}
  ]
}}
"""

DETAIL_PROMPT_TEMPLATE = """
You are a senior short-form video editor, narrative architect, and viral copywriter.
Extract the BEST short clips from these candidate windows and evaluate them using multi-dimensional viral potential signals.

CRITICAL PRINCIPLE:
Do NOT assume "stronger hook = automatically better clip".
A clip with Hook=90, Retention=45, Payoff=30 is INFERIOR to a clip with Hook=82, Retention=91, Payoff=94.
Your goal is to identify clips that succeed across the entire viewer journey:
SCROLL STOP (Hook) -> RETENTION (Sustained Attention) -> PAYOFF (Satisfying Resolution).
The AI does NOT guarantee virality; the scores represent estimated short-form content potential.

AUDIENCE REPLAY SIGNALS:
If any window includes `most_replayed_peak`, actual YouTube viewers replayed that exact segment repeatedly. Ensure this moment is preserved within the clip boundaries and serves as a major hook, turning point, or climax!

TIME CONTRACT:
- Absolute seconds from video start: 0 <= start_time < end_time <= {video_duration}.
- Duration: {min_secs:g} to {max_secs:g} seconds (PREFER 20–45 seconds when the narrative completes naturally).
- Never cut in the middle of a word or phrase.

STANDALONE TEST:
The clip MUST make complete sense to a cold viewer who has never seen the video or speaker before.
Penalize unexplained pronouns, references to earlier unshown discussion ("seperti tadi saya bilang", "makanya", "dia melakukan itu"), and missing setups/answers.
Reflect this in `standalone_score` (high=cleanly independent) and `context_dependency` (0=fully standalone, 100=unusable without prior context).

MULTI-SIGNAL EVALUATION (0-100 integer for each score):
1. `hook_type` & `hook_score`:
   Types: open_question, strong_opinion, contrarian_opinion, fact_shock, personal_confession, unexpected_result, story_opening, emotional_statement, curiosity_gap, direct_advice, humor_setup, conflict.
   Does the first 1-3 seconds stop scrolling without relying on full video context?
2. `retention_score`, `retention_risk` ("low"|"medium"|"high"), `retention_drop_reason`:
   Evaluate retention progression across 0-3s, 3-10s, 10-20s, 20s+, and ending.
3. `payoff_score` & `payoff_type`:
   Types: answer, revelation, twist, lesson, punchline, emotional_resolution, insight, reaction, none.
   Does the ending resolve the opening promise and justify the viewer's time?
4. `curiosity_score`:
   Does the opening create an unresolved question that keeps the viewer watching for the answer?
5. `emotion_score` & `dominant_emotion`:
   Emotions: humor, surprise, excitement, anger, sadness, fear, inspiration, curiosity, admiration, disbelief, nostalgia, embarrassment.
6. `surprise_score`:
   Unusual experience, counterintuitive fact, or unexpected outcome.
7. `relatability_score`:
   Can viewers see themselves or their peers in the situation (family, work, money, failure, daily life)?
8. `conflict_score`:
   Disagreement, internal debate, risk -> consequence, or tension. (Optional: peaceful insight can still score high).
9. `shareability_score` & `share_reason`:
   Would someone send this to a friend? ("Ini gue banget", shocking fact, life advice, relatable laugh).
10. `clipability_score`:
    Clean start/end, natural flow, clear speech, tight pacing.
11. `context_dependency` (0-100, where 0=independent, 100=depends completely on prior context).

HOOK REFRAMING:
If a clip has outstanding story/payoff but opens on a slow conversational lead-in (e.g. "Jadi waktu itu..."):
- Set `hook_rewrite_potential: true`
- Provide `editorial_hook_suggestion`: max 10 words editorial hook text overlay for visual text hook on screen (e.g. "Dia kehilangan Rp2 miliar karena satu keputusan.").

SCORE CALCULATION GUIDANCE:
Calculate `predicted_score` (0-100 integer):
- Base Score = (hook * 0.20) + (retention * 0.20) + (payoff * 0.15) + (curiosity * 0.15) + (emotion * 0.10) + (surprise * 0.05) + (relatability * 0.05) + (conflict * 0.05) + (shareability * 0.05)
- Quality Factor = 0.50 + 0.30*(standalone/100) + 0.20*(clipability/100) - 0.30*(context_dependency/100)
- `predicted_score` = clamp(round(Base Score * Quality Factor), 0, 100)

CATEGORIES:
90-100: Exceptional short-form potential | 80-89: Very strong potential | 70-79: Strong candidate | 60-69: Moderate candidate | Below 60: Weak candidate.

HOW MANY & DIVERSITY:
return {min_clips} to {max_clips} clips.
Never return duplicate clips that tell the same story or make the same point. Aim for variety in content types and emotions.

COPY RULES — All descriptions, title, and viral_hook_text in {language}:
- ABOUT THIS MOMENT, NOT THE VIDEO: the hook and the title name the concrete thing that happens inside this clip.
- Descriptions (TikTok + Instagram): 1-2 punchy sentences teasing the payoff + 3-5 relevant hashtags.
- `video_title_for_youtube_short`: max 100 chars, curiosity-driven.
- `viral_hook_text`: max 10 words text overlay.

TRANSCRIPT_LANGUAGE: {language}
VIDEO_DURATION_SECONDS: {video_duration}
CANDIDATE_WINDOWS_JSON:
{windows_json}

Return ONLY valid JSON matching this exact structure:
{{
  "shorts": [
    {{
      "start_time": <number>,
      "end_time": <number>,
      "source_window_id": "<window id>",
      "predicted_score": <integer 0-100>,
      "hook_type": "<type>",
      "hook_score": <integer 0-100>,
      "retention_score": <integer 0-100>,
      "retention_risk": "<low|medium|high>",
      "retention_drop_reason": "<reason or empty>",
      "payoff_score": <integer 0-100>,
      "payoff_type": "<type>",
      "curiosity_score": <integer 0-100>,
      "emotion_score": <integer 0-100>,
      "dominant_emotion": "<emotion>",
      "surprise_score": <integer 0-100>,
      "relatability_score": <integer 0-100>,
      "conflict_score": <integer 0-100>,
      "shareability_score": <integer 0-100>,
      "share_reason": "<reason>",
      "standalone_score": <integer 0-100>,
      "clipability_score": <integer 0-100>,
      "context_dependency": <integer 0-100>,
      "hook_rewrite_potential": <boolean>,
      "editorial_hook_suggestion": "<suggestion or null>",
      "content_type": "<personal_story|insight|controversy|fact|humor|reaction>",
      "reason": "<concise justification>",
      "video_description_for_tiktok": "<description + hashtags>",
      "video_description_for_instagram": "<description + hashtags>",
      "video_title_for_youtube_short": "<title max 100 chars>",
      "viral_hook_text": "<max 10 words>"
    }}
  ]
}}
"""


def _strip_code_fences(text: str) -> str:
    text = (text or "").strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines:
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def _extract_json_candidate(text: str) -> str:
    cleaned = _strip_code_fences(text)
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        return cleaned[start:end + 1]
    return cleaned


def _escape_invalid_unicode_escapes(text: str) -> str:
    chars = []
    i = 0
    while i < len(text):
        if text[i] == "\\" and i + 1 < len(text) and text[i + 1] == "u":
            hex_digits = text[i + 2:i + 6]
            if len(hex_digits) < 4 or any(ch not in "0123456789abcdefABCDEF" for ch in hex_digits):
                chars.append("\\\\u")
                i += 2
                continue
        chars.append(text[i])
        i += 1
    return "".join(chars)


def _parse_json_response_text(text: str) -> dict:
    if not text:
        raise ValueError("Gemini returned an empty response body.")
    candidate = _extract_json_candidate(text).replace("\x00", "").strip()
    if not candidate:
        raise ValueError("Gemini response did not contain a JSON object.")
    parse_attempts = [candidate]
    sanitized_candidate = _escape_invalid_unicode_escapes(candidate)
    if sanitized_candidate != candidate:
        parse_attempts.append(sanitized_candidate)
    last_error: Optional[Exception] = None
    for parse_candidate in parse_attempts:
        try:
            return json.loads(parse_candidate)
        except json.JSONDecodeError as e:
            last_error = e
    raise ValueError(f"Failed to parse Gemini JSON response: {last_error}")


class GeminiBlockedError(ValueError):
    """The API refused the request for content-policy reasons.

    Deterministic: the same payload is rejected every time (verified in prod,
    23-jul-2026 — a stand-up video came back PROHIBITED_CONTENT in ~300ms on
    every attempt), and BLOCK_NONE safety settings do NOT lift it. Retrying is
    pointless, so callers must fail fast with a message that tells the user the
    video's content is the problem, not the service."""


_BLOCKED_FINISH_REASONS = {"SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST",
                           "SPII", "IMAGE_SAFETY", "RECITATION"}


def raise_if_blocked(response):
    """Raise GeminiBlockedError when the API refused to answer on policy grounds."""
    pf = getattr(response, "prompt_feedback", None)
    reason = getattr(pf, "block_reason", None)
    if reason:
        name = getattr(reason, "name", None) or str(reason)
        raise GeminiBlockedError(
            f"Gemini blocked this video's content ({name}). The AI provider's "
            "usage policies reject this material, so it can't be analyzed.")
    for c in (getattr(response, "candidates", None) or []):
        fr = getattr(c, "finish_reason", None)
        name = (getattr(fr, "name", None) or str(fr or "")).upper()
        if name in _BLOCKED_FINISH_REASONS:
            raise GeminiBlockedError(
                f"Gemini blocked its answer for this video ({name}). The AI "
                "provider's usage policies reject this material, so it can't be analyzed.")


def _get_response_text(response) -> str:
    try:
        text = response.text
        if text:
            return text
    except Exception:
        pass

    parts = []
    for candidate in getattr(response, "candidates", []) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", []) or []:
            part_text = getattr(part, "text", None)
            if part_text:
                parts.append(part_text)
    return "\n".join(parts).strip()


def _calculate_cost_analysis(response, model_name: str) -> Optional[dict]:
    usage = getattr(response, "usage_metadata", None)
    if not usage:
        return None
    prices = lookup_model_prices(model_name)
    price_estimated = prices is None
    if prices is None:
        # Unknown model: conservative estimate so the UI shows something sane.
        prices = (0.50, 3.00)
    input_price_per_million, output_price_per_million = prices
    prompt_tokens = usage.prompt_token_count or 0
    output_tokens = usage.candidates_token_count or 0
    # Thinking tokens bill at the output rate even though they are invisible.
    thinking_tokens = getattr(usage, "thoughts_token_count", 0) or 0
    input_cost = (prompt_tokens / 1_000_000) * input_price_per_million
    output_cost = ((output_tokens + thinking_tokens) / 1_000_000) * output_price_per_million
    total_cost = input_cost + output_cost
    return {
        "input_tokens": prompt_tokens,
        "output_tokens": output_tokens,
        "thinking_tokens": thinking_tokens,
        "input_cost": input_cost,
        "output_cost": output_cost,
        "total_cost": total_cost,
        "model": model_name,
        "price_estimated": price_estimated,
    }


def _thinking_config_from_env(model_name: str):
    """GEMINI_THINKING_SCORE: off (default) | low | high | <token budget>.

    Applied only to the scoring stage. Gemini 3 models take thinking_level,
    Gemini 2.5 takes thinking_budget; returns None (= model default) if the
    setting is off or the SDK rejects the config."""
    raw = (os.getenv("GEMINI_THINKING_SCORE") or "off").strip().lower()
    if raw in ("", "off", "0", "none", "false"):
        return None
    try:
        if raw.isdigit():
            return genai_types.ThinkingConfig(thinking_budget=int(raw))
        if raw in ("low", "high"):
            if model_name.startswith("gemini-3"):
                return genai_types.ThinkingConfig(thinking_level=raw)
            return genai_types.ThinkingConfig(thinking_budget=2048 if raw == "low" else 8192)
    except Exception as e:
        _log(f"\u26a0\ufe0f Ignoring GEMINI_THINKING_SCORE={raw!r}: {e}")
    return None


def _config_for_strategy(strategy: str, mode: str, model_name: str) -> genai_types.GenerateContentConfig:
    # The detail stage writes creative copy (hooks/descriptions) — it gets a
    # high temperature; timestamps are validated and word-snapped afterwards.
    # The score stage stays precise. Fallback strategies get conservative.
    creative = mode == "detail"
    kwargs = {
        "response_mime_type": "application/json",
        "candidate_count": 1,
    }
    if strategy == "strict-json":
        kwargs["temperature"] = 0.7 if creative else 0.1
    elif strategy == "json-text-recovery":
        kwargs["temperature"] = 0.2 if creative else 0.0
    else:  # structured-schema: schema-enforced output, primary strategy
        kwargs["temperature"] = 0.9 if creative else 0.2
        kwargs["response_schema"] = DetailResponse if mode == "detail" else ScoreResponse
        if mode == "score":
            thinking = _thinking_config_from_env(model_name)
            if thinking is not None:
                kwargs["thinking_config"] = thinking
    return genai_types.GenerateContentConfig(**kwargs)


def main() -> int:
    _configure_stdio()

    parser = argparse.ArgumentParser(description="Run a single Gemini request for clip scoring/detailing.")
    parser.add_argument("--mode", choices=["score", "detail"], required=True)
    parser.add_argument("--input", dest="input_path", required=True)
    parser.add_argument("--output", dest="output_path", required=True)
    parser.add_argument("--strategy", default="structured-schema")
    parser.add_argument("--model", default="gemini-2.5-flash")
    args = parser.parse_args()

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit("Missing GEMINI_API_KEY.")

    with open(args.input_path, "r", encoding="utf-8") as f:
        payload = json.load(f)

    model_name = args.model
    client = genai.Client(api_key=api_key)
    config = _config_for_strategy(args.strategy, args.mode, model_name)
    language = str(payload.get("language") or "unknown")

    template = SCORE_PROMPT_TEMPLATE if args.mode == "score" else DETAIL_PROMPT_TEMPLATE
    fmt = {
        "video_duration": payload["video_duration"],
        "language": language,
        "windows_json": json.dumps(payload["windows"], ensure_ascii=False),
    }
    if args.mode != "score":
        # Score mode receives every window, not a shortlist, so a count target
        # derived from it would be meaningless — and the score template has no
        # placeholder for one anyway.
        fmt["min_clips"], fmt["max_clips"] = clip_count_targets(len(payload.get("windows") or []))
        fmt["min_secs"], fmt["max_secs"] = clip_duration_bounds()
    prompt = template.format(**fmt)

    _log(f"\U0001f916 Gemini worker request: mode={args.mode} strategy={args.strategy} model={model_name} items={len(payload.get('windows', []))}")
    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=config,
    )

    raw_text = _get_response_text(response)
    # With response_schema the SDK returns an already-validated object; fall
    # back to the text-repair path only when that is unavailable.
    parsed_obj = getattr(response, "parsed", None)
    if parsed_obj is not None:
        parsed = parsed_obj.model_dump() if hasattr(parsed_obj, "model_dump") else parsed_obj
    else:
        parsed = _parse_json_response_text(raw_text)
    result = {
        "mode": args.mode,
        "payload": parsed,
        "cost_analysis": _calculate_cost_analysis(response, model_name),
        "raw_text": raw_text,
    }
    with open(args.output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    _log(f"\u2705 Gemini worker success: mode={args.mode}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
