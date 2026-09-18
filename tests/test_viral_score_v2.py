"""Tests for Viral Potential Ranking Score Engine v2."""
import pytest
from clip_selection import compute_viral_score_v2, trim_to_best
import gemini_worker


def test_base_score_weights_and_quality_factor():
    """Verify that viral score v2 computes the exact weighted formula."""
    clip_perfect = {
        "hook_score": 100,
        "retention_score": 100,
        "payoff_score": 100,
        "curiosity_score": 100,
        "emotion_score": 100,
        "surprise_score": 100,
        "relatability_score": 100,
        "conflict_score": 100,
        "shareability_score": 100,
        "standalone_score": 100,
        "clipability_score": 100,
        "context_dependency": 0,
    }
    score = compute_viral_score_v2(clip_perfect)
    assert score == 100

    clip_zero = {
        "hook_score": 0,
        "retention_score": 0,
        "payoff_score": 0,
        "curiosity_score": 0,
        "emotion_score": 0,
        "surprise_score": 0,
        "relatability_score": 0,
        "conflict_score": 0,
        "shareability_score": 0,
        "standalone_score": 0,
        "clipability_score": 0,
        "context_dependency": 100,
    }
    assert compute_viral_score_v2(clip_zero) == 0


def test_hook_retention_payoff_journey():
    """Verify that a high hook with poor retention and payoff is outranked by a balanced high-retention clip.

    "A clip with Hook=90, Retention=45, Payoff=30 is INFERIOR to
     a clip with Hook=82, Retention=91, Payoff=94."
    """
    clip_clickbait = {
        "hook_score": 90,
        "retention_score": 45,
        "payoff_score": 30,
        "curiosity_score": 50,
        "emotion_score": 40,
        "surprise_score": 30,
        "relatability_score": 30,
        "conflict_score": 40,
        "shareability_score": 30,
        "standalone_score": 60,
        "clipability_score": 60,
        "context_dependency": 50,
    }
    clip_narrative_mastery = {
        "hook_score": 82,
        "retention_score": 91,
        "payoff_score": 94,
        "curiosity_score": 85,
        "emotion_score": 80,
        "surprise_score": 70,
        "relatability_score": 75,
        "conflict_score": 60,
        "shareability_score": 85,
        "standalone_score": 95,
        "clipability_score": 90,
        "context_dependency": 5,
    }

    score_clickbait = compute_viral_score_v2(clip_clickbait)
    score_mastery = compute_viral_score_v2(clip_narrative_mastery)

    assert score_mastery > score_clickbait
    assert score_mastery >= 80
    assert score_clickbait < 60


def test_context_dependency_penalty():
    """A clip with high context dependency must receive a substantial penalty."""
    clean_standalone = {
        "hook_score": 80,
        "retention_score": 80,
        "payoff_score": 80,
        "standalone_score": 95,
        "clipability_score": 90,
        "context_dependency": 0,
    }
    dependent_clip = {
        "hook_score": 80,
        "retention_score": 80,
        "payoff_score": 80,
        "standalone_score": 40,
        "clipability_score": 50,
        "context_dependency": 80,
    }

    score_standalone = compute_viral_score_v2(clean_standalone)
    score_dependent = compute_viral_score_v2(dependent_clip)

    assert score_standalone > score_dependent
    assert (score_standalone - score_dependent) >= 20


def test_legacy_predicted_score_fallback():
    """If component scores are missing, fall back to legacy predicted_score."""
    legacy_clip = {
        "predicted_score": 78,
        "title": "Legacy Clip",
    }
    assert compute_viral_score_v2(legacy_clip) == 78

    empty_clip = {}
    assert compute_viral_score_v2(empty_clip) == 0


def test_trim_to_best_overlap_suppression():
    """trim_to_best must suppress heavily overlapping candidates in favor of the higher-ranked clip."""
    shorts = [
        {"id": 1, "start": 10.0, "end": 40.0, "predicted_score": 75, "payoff_score": 70, "retention_score": 70, "standalone_score": 70},
        {"id": 2, "start": 12.0, "end": 42.0, "predicted_score": 90, "payoff_score": 92, "retention_score": 88, "standalone_score": 90},
        {"id": 3, "start": 100.0, "end": 130.0, "predicted_score": 82, "payoff_score": 80, "retention_score": 80, "standalone_score": 80},
    ]

    trimmed = trim_to_best(shorts, max_clips=2, overlap_threshold=0.35)

    ids = [c["id"] for c in trimmed]
    assert 2 in ids
    assert 3 in ids
    assert 1 not in ids
    assert trimmed[0]["id"] == 2
    assert trimmed[1]["id"] == 3


def test_trim_to_best_tie_breaker():
    """When predicted_score is equal, trim_to_best uses payoff_score, retention, standalone."""
    shorts = [
        {"id": 1, "start": 10.0, "end": 30.0, "predicted_score": 80, "payoff_score": 60, "retention_score": 70, "standalone_score": 70},
        {"id": 2, "start": 50.0, "end": 70.0, "predicted_score": 80, "payoff_score": 90, "retention_score": 70, "standalone_score": 70},
    ]
    trimmed = trim_to_best(shorts, max_clips=1)
    assert len(trimmed) == 1
    assert trimmed[0]["id"] == 2


def test_pydantic_schemas():
    """Verify gemini_worker Pydantic schemas handle alias fields and v2 signals."""
    scout_data = {
        "id": 1,
        "score": 85,
        "hook_promise": "Reveals the secret to compounding",
        "events": [
            {"event_summary": "Speaker explains 1% rule", "event_start": 12.5, "event_end": 30.0, "signal_type": "insight"}
        ],
    }
    scout_obj = gemini_worker.ScoutWindowModel.model_validate(scout_data)
    assert scout_obj.window_score == 85
    assert len(scout_obj.events) == 1
    assert scout_obj.events[0].event_start == 12.5

    detail_clip_data = {
        "start_time": 15.0,
        "end_time": 45.0,
        "predicted_score": 88,
        "hook_type": "open_question",
        "hook_score": 85,
        "retention_score": 90,
        "retention_risk": "low",
        "payoff_score": 88,
        "payoff_type": "revelation",
        "curiosity_score": 80,
        "emotion_score": 75,
        "dominant_emotion": "curiosity",
        "surprise_score": 65,
        "relatability_score": 70,
        "conflict_score": 40,
        "shareability_score": 80,
        "standalone_score": 90,
        "clipability_score": 85,
        "context_dependency": 10,
        "hook_rewrite_potential": True,
        "editorial_hook_suggestion": "Satu kebiasaan ini bikin kamu 37x lebih produktif.",
        "content_type": "educational_insight",
        "video_title_for_youtube_short": "Rahasia 1% Setiap Hari",
        "video_description_for_tiktok": "Coba cara ini sekarang #shorts",
    }
    clip_obj = gemini_worker.DetailClipModel.model_validate(detail_clip_data)
    assert clip_obj.start == 15.0
    assert clip_obj.end == 45.0
    assert clip_obj.hook_rewrite_potential is True
    assert "produktif" in clip_obj.editorial_hook_suggestion

    response_data = {
        "candidates": [detail_clip_data]
    }
    resp_obj = gemini_worker.DetailResponse.model_validate(response_data)
    assert len(resp_obj.shorts) == 1
    assert resp_obj.shorts[0].start == 15.0
