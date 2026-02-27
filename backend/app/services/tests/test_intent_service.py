import pytest

from app.services.intent_service import IntentService


def test_parse_llm_response_valid_json():
    svc = IntentService()

    resp = '{"risk_score": 75, "reason": "Phishing indicators", "tactics": ["Urgency"], "authority": 20, "urgency": 80, "financial_pressure": 10}'

    parsed = svc.parse_llm_response(resp)

    assert parsed["risk_score"] == 75
    assert parsed["authority"] == 20
    assert parsed["urgency"] == 80
    assert isinstance(parsed["tactics"], list)


def test_parse_llm_response_with_markdown_codeblock():
    svc = IntentService()

    resp = "```json\n{\n  \"risk_score\": 10,\n  \"reason\": \"No issues\",\n  \"tactics\": [],\n  \"authority\": 0,\n  \"urgency\": 0,\n  \"financial_pressure\": 0\n}\n```"

    parsed = svc.parse_llm_response(resp)

    assert parsed["risk_score"] == 10
    assert parsed["reason"] == "No issues"


def test_parse_llm_response_malformed_returns_safe_default():
    svc = IntentService()

    resp = "This is not JSON"

    parsed = svc.parse_llm_response(resp)

    assert parsed["risk_score"] == 0
    assert parsed["tactics"] == []


# additional tests for new behavior

def test_model_env_override(monkeypatch):
    svc = IntentService()
    monkeypatch.setenv("OLLAMA_MODEL", "test-model")
    svc2 = IntentService()
    assert svc2.model == "test-model"
