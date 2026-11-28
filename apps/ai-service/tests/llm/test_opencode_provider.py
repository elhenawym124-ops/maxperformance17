from __future__ import annotations

import json

import httpx
import pytest
import respx

from src.llm.opencode import (
    ChatResult,
    OpenCodeClient,
    OpenCodeError,
    OpenCodeService,
)
from src.llm.provider_catalog import estimate_cost, get_provider_spec

BASE = "https://opencode.ai/inference/openai/v1"
MODELS = "https://opencode.ai/inference/v1/models"
SECRET = "sk-test-secret-do-not-leak-0001"


class FakeSession:
    def __init__(self) -> None:
        self.added: list[object] = []
        self.commits = 0
        self.rollbacks = 0

    def add(self, obj: object) -> None:
        self.added.append(obj)

    async def commit(self) -> None:
        self.commits += 1

    async def rollback(self) -> None:
        self.rollbacks += 1


@pytest.fixture(autouse=True)
def _clear_secret(monkeypatch):
    for name in ("OPENCODE_API_KEY", "OPENCODE_ZEN_API_KEY", "OPENCODE_API_KEY_FILE"):
        monkeypatch.delenv(name, raising=False)
    yield


def test_catalog_registers_opencode_with_deepseek_wiring():
    spec = get_provider_spec("opencode")
    assert spec is not None
    assert spec.id == "OPENCODE"
    assert spec.base_url == BASE
    assert spec.auth_type == "bearer"
    assert spec.default_model == "deepseek-v4.1-flash"
    assert spec.fallback_provider == "DEEPSEEK"
    flash = spec.model("deepseek-v4.1-flash")
    assert flash.max_tokens > 0
    assert flash.temperature >= 0
    assert flash.timeout_seconds == 30
    assert spec.has_model("deepseek-v4-pro")
    assert not spec.has_model("not-a-model")


def test_estimate_cost_uses_split_pricing():
    model = get_provider_spec("OPENCODE").model("deepseek-v4.1-flash")
    # 1000 input * 0.30 + 500 output * 1.20 per 1M tokens
    assert estimate_cost(model, input_tokens=1000, output_tokens=500) == 0.0009
    assert estimate_cost(model, input_tokens=0, output_tokens=0) == 0.0


def test_secret_resolution_from_env(monkeypatch):
    from src.llm.provider_secrets import resolve_provider_secret

    monkeypatch.setenv("OPENCODE_API_KEY", SECRET)
    resolved = resolve_provider_secret("OPENCODE")
    assert resolved is not None
    assert resolved.value == SECRET
    assert resolved.source == "env:OPENCODE_API_KEY"


def test_secret_resolution_from_vault_file(tmp_path, monkeypatch):
    from src.llm.provider_secrets import resolve_provider_secret

    secret_file = tmp_path / "opencode_api_key"
    secret_file.write_text(SECRET + "\n", encoding="utf-8")
    monkeypatch.setenv("OPENCODE_API_KEY_FILE", str(secret_file))
    resolved = resolve_provider_secret("OPENCODE")
    assert resolved is not None
    assert resolved.value == SECRET
    assert resolved.source.startswith("vault:")


@pytest.mark.asyncio
@respx.mock
async def test_chat_success_parses_reply_tokens_and_provider_cost():
    route = respx.post(f"{BASE}/chat/completions").mock(
        return_value=httpx.Response(
            200,
            json={
                "model": "deepseek-v4.1-flash",
                "choices": [{"message": {"role": "assistant", "content": "OPENCODE_OK"}}],
                "usage": {
                    "prompt_tokens": 12,
                    "completion_tokens": 3,
                    "total_tokens": 15,
                    "cost": 0.00412,
                    "opencode": {"tokens": {"input": 12, "output": 3, "cache_read": 100}},
                },
            },
        )
    )

    result = await OpenCodeClient(SECRET).chat([{"role": "user", "content": "ping"}])

    assert result.text == "OPENCODE_OK"
    assert result.provider == "OPENCODE"
    assert result.input_tokens == 12
    assert result.output_tokens == 3
    assert result.total_tokens == 15
    assert result.cost_usd == 0.00412
    assert result.cost_source == "provider"
    assert result.latency_ms >= 0
    body = json.loads(route.calls[0].request.content)
    assert body["model"] == "deepseek-v4.1-flash"
    assert body["max_tokens"] == 2048
    assert body["temperature"] == 0.3


@pytest.mark.asyncio
@respx.mock
async def test_chat_401_maps_to_clear_unauthorized_error():
    respx.post(f"{BASE}/chat/completions").mock(
        return_value=httpx.Response(
            401, json={"error": {"type": "authentication_error", "message": "Invalid credential"}}
        )
    )

    with pytest.raises(OpenCodeError) as raised:
        await OpenCodeClient(SECRET).chat([{"role": "user", "content": "ping"}])

    error = raised.value
    assert error.code == "unauthorized"
    assert error.http_status == 401
    assert "401" in error.user_message
    assert SECRET not in error.user_message
    assert SECRET not in str(error)


@pytest.mark.asyncio
@respx.mock
async def test_chat_429_maps_rate_limit_with_retry_after():
    respx.post(f"{BASE}/chat/completions").mock(
        return_value=httpx.Response(
            429,
            headers={"Retry-After": "7"},
            json={"error": {"message": "rate limit exceeded"}},
        )
    )

    with pytest.raises(OpenCodeError) as raised:
        await OpenCodeClient(SECRET).chat([{"role": "user", "content": "ping"}])

    assert raised.value.code == "rate_limited"
    assert raised.value.retry_after_s == 7.0
    assert "7" in raised.value.user_message


@pytest.mark.asyncio
@respx.mock
async def test_chat_timeout_maps_to_timeout_error():
    respx.post(f"{BASE}/chat/completions").mock(side_effect=httpx.ReadTimeout("slow"))

    with pytest.raises(OpenCodeError) as raised:
        await OpenCodeClient(SECRET).chat(
            [{"role": "user", "content": "ping"}], timeout_seconds=1
        )

    assert raised.value.code == "timeout"
    assert raised.value.user_message


@pytest.mark.asyncio
@respx.mock
async def test_chat_5xx_maps_to_server_error_and_scrubs_secret():
    respx.post(f"{BASE}/chat/completions").mock(
        return_value=httpx.Response(503, text=f"upstream failed for Bearer {SECRET}")
    )

    with pytest.raises(OpenCodeError) as raised:
        await OpenCodeClient(SECRET).chat([{"role": "user", "content": "ping"}])

    assert raised.value.code == "server_error"
    assert raised.value.http_status == 503
    assert SECRET not in raised.value.user_message
    assert SECRET not in raised.value.provider_message


@pytest.mark.asyncio
@respx.mock
async def test_health_ok_reports_latency():
    respx.get(MODELS).mock(
        return_value=httpx.Response(200, json={"data": [{"id": "deepseek-v4.1-flash"}]})
    )
    result = await OpenCodeClient(SECRET).health()
    assert result["ok"] is True
    assert result["status"] == "ok"
    assert result["latency_ms"] >= 0
    assert result["models_count"] == 1


@pytest.mark.asyncio
async def test_health_without_secret_is_key_missing_without_network():
    service = OpenCodeService()
    result = await service.health()
    assert result["ok"] is False
    assert result["status"] == "fail"
    assert result["error_code"] == "key_missing"
    assert result["latency_ms"] == 0


@pytest.mark.asyncio
@respx.mock
async def test_smoke_success_records_usage(monkeypatch):
    monkeypatch.setenv("OPENCODE_API_KEY", SECRET)
    respx.post(f"{BASE}/chat/completions").mock(
        return_value=httpx.Response(
            200,
            json={
                "model": "deepseek-v4.1-flash",
                "choices": [{"message": {"content": "OPENCODE_OK"}}],
                "usage": {"prompt_tokens": 100, "completion_tokens": 5, "cost": 0.0005},
            },
        )
    )
    session = FakeSession()

    result = await OpenCodeService().smoke(prompt="ping", session=session)

    assert result["ok"] is True
    assert result["reply"] == "OPENCODE_OK"
    assert result["input_tokens"] == 100
    assert result["output_tokens"] == 5
    assert result["cost_usd"] == 0.0005
    assert result["cost_source"] == "provider"
    assert result["usage_id"]
    assert len(session.added) == 1
    event = session.added[0]
    assert event.provider == "OPENCODE"
    assert event.model == "deepseek-v4.1-flash"
    assert event.total_tokens == 105
    assert event.status == "success"
    assert SECRET not in json.dumps(result, default=str)


@pytest.mark.asyncio
@respx.mock
async def test_smoke_falls_back_to_deepseek_when_provider_rejects(monkeypatch):
    monkeypatch.setenv("OPENCODE_API_KEY", SECRET)
    respx.post(f"{BASE}/chat/completions").mock(
        return_value=httpx.Response(401, json={"error": {"message": "Invalid credential"}})
    )

    async def fallback(messages, **kwargs):
        assert messages[0]["content"] == "ping"
        return ChatResult(
            text="fallback reply",
            model="deepseek-flash",
            provider="DEEPSEEK",
            input_tokens=7,
            output_tokens=2,
            total_tokens=9,
            latency_ms=42,
        )

    session = FakeSession()
    result = await OpenCodeService(fallback_runner=fallback).smoke(
        prompt="ping", allow_fallback=True, session=session
    )

    assert result["ok"] is True
    assert result["reply"] == "fallback reply"
    assert result["fallback_used"] is True
    assert result["fallback_provider"] == "DEEPSEEK"
    assert result["fallback_reason"] == "unauthorized"
    assert result["primary_error_code"] == "unauthorized"
    assert len(session.added) == 2
    assert session.added[0].status == "failed"
    assert session.added[1].status == "success"
    assert session.added[1].provider == "DEEPSEEK"


@pytest.mark.asyncio
@respx.mock
async def test_smoke_fallback_unavailable_is_explicit(monkeypatch):
    monkeypatch.setenv("OPENCODE_API_KEY", SECRET)
    respx.post(f"{BASE}/chat/completions").mock(
        return_value=httpx.Response(401, json={"error": {"message": "Invalid credential"}})
    )

    async def fallback(messages, **kwargs):
        raise OpenCodeError("fallback_unavailable")

    result = await OpenCodeService(fallback_runner=fallback).smoke(
        prompt="ping", allow_fallback=True
    )

    assert result["ok"] is False
    assert result["error_code"] == "unauthorized"
    assert result["fallback_attempted"] is True
    assert result["fallback_error_code"] == "fallback_unavailable"


@pytest.mark.asyncio
async def test_smoke_without_secret_reports_key_missing(monkeypatch):
    monkeypatch.setenv("OPENCODE_API_KEY_FILE", "C:/definitely/missing/opencode_key")
    result = await OpenCodeService().smoke(prompt="ping")
    assert result["ok"] is False
    assert result["error_code"] == "key_missing"
    assert result["latency_ms"] >= 0
    assert SECRET not in json.dumps(result, default=str)
