from __future__ import annotations

import httpx
import pytest
import respx
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.admin.auth import verify_admin_jwt
from src.api.admin.providers import router
from src.db.models.provider import Provider
from src.db.models.usage import AiUsageEvent
from src.db.session import get_session

BASE = "https://opencode.ai/inference/openai/v1"
MODELS = "https://opencode.ai/inference/v1/models"
SECRET = "sk-test-admin-secret-9999"


class FakeScalars:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return list(self._rows)


class FakeResult:
    def __init__(self, rows):
        self._rows = rows

    def scalars(self):
        return FakeScalars(self._rows)


class FakeAsyncSession:
    def __init__(self, rows=None, events=None, fail_execute=False, fail_commit=False):
        self.rows = list(rows or [])
        self.events = list(events or [])
        self.fail_execute = fail_execute
        self.fail_commit = fail_commit
        self.added: list[object] = []

    async def execute(self, stmt):
        if self.fail_execute:
            raise RuntimeError("db down")
        entity = getattr(stmt, "column_descriptions", [{}])[0].get("entity")
        if entity is AiUsageEvent:
            return FakeResult(self.events)
        return FakeResult(self.rows)

    async def get(self, model, key):
        for row in self.rows:
            if getattr(row, "name", None) == key:
                return row
        return None

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        if self.fail_commit:
            raise RuntimeError("commit failed")
        for obj in self.added:
            if isinstance(obj, Provider) and obj not in self.rows:
                self.rows.append(obj)

    async def refresh(self, obj):
        return None

    async def rollback(self):
        return None


@pytest.fixture(autouse=True)
def _clear_secret(monkeypatch):
    for name in ("OPENCODE_API_KEY", "OPENCODE_ZEN_API_KEY", "OPENCODE_API_KEY_FILE"):
        monkeypatch.delenv(name, raising=False)
    yield


def build_client(session: FakeAsyncSession, admin: dict | None = None) -> TestClient:
    app = FastAPI()
    app.include_router(router, prefix="/admin")
    app.dependency_overrides[verify_admin_jwt] = lambda: admin or {"sub": "tester"}

    async def override_session():
        yield session

    app.dependency_overrides[get_session] = override_session
    return TestClient(app)


def test_registry_lists_opencode_even_before_db_row_exists():
    client = build_client(FakeAsyncSession())
    response = client.get("/admin/providers/registry")
    assert response.status_code == 200
    providers = response.json()
    assert len(providers) == 1
    opencode = providers[0]
    assert opencode["id"] == "OPENCODE"
    assert opencode["base_url"] == BASE
    assert opencode["auth_type"] == "bearer"
    assert opencode["status"] == "enabled"
    assert opencode["default_model"] == "deepseek-v4.1-flash"
    assert opencode["configured_in_db"] is False
    assert opencode["key_configured"] is False
    model_ids = {model["id"] for model in opencode["models"]}
    assert "deepseek-v4.1-flash" in model_ids
    assert all(model["max_tokens"] > 0 for model in opencode["models"])
    assert opencode["fallback"]["provider"] == "DEEPSEEK"


def test_registry_reports_key_source_without_secret(monkeypatch):
    monkeypatch.setenv("OPENCODE_API_KEY", SECRET)
    client = build_client(FakeAsyncSession())
    response = client.get("/admin/providers/registry")
    opencode = response.json()[0]
    assert opencode["key_configured"] is True
    assert opencode["key_source"] == "env:OPENCODE_API_KEY"
    assert SECRET not in response.text


def test_patch_provider_toggles_and_selects_default_model():
    row = Provider(
        name="OPENCODE",
        display_name="OpenCode Console",
        adapter_type="openai_compat",
        base_url=BASE,
        default_model="deepseek-v4.1-flash",
        is_active=True,
        config={},
    )
    session = FakeAsyncSession(rows=[row])
    client = build_client(session)

    response = client.patch(
        "/admin/providers/OPENCODE",
        json={"enabled": False, "default_model": "deepseek-v4-pro"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "disabled"
    assert body["is_active"] is False
    assert body["default_model"] == "deepseek-v4-pro"
    assert row.is_active is False
    assert row.default_model == "deepseek-v4-pro"


def test_patch_provider_rejects_unknown_model():
    client = build_client(FakeAsyncSession())
    response = client.patch(
        "/admin/providers/OPENCODE", json={"default_model": "gpt-4o-mini"}
    )
    assert response.status_code == 400
    assert "deepseek-v4.1-flash" in response.json()["detail"]


def test_health_reports_disabled_without_network():
    row = Provider(
        name="OPENCODE",
        display_name="OpenCode Console",
        adapter_type="openai_compat",
        base_url=BASE,
        default_model="deepseek-v4.1-flash",
        is_active=False,
        config={},
    )
    client = build_client(FakeAsyncSession(rows=[row]))
    response = client.get("/admin/providers/health")
    assert response.status_code == 200
    health = response.json()[0]
    assert health["ok"] is False
    assert health["status"] == "disabled"
    assert health["error_code"] == "provider_disabled"


def test_health_without_key_reports_fail():
    client = build_client(FakeAsyncSession())
    response = client.get("/admin/providers/health")
    health = response.json()[0]
    assert health["ok"] is False
    assert health["status"] == "fail"
    assert health["error_code"] == "key_missing"
    assert health["latency_ms"] == 0


@respx.mock
def test_health_reports_ok_and_latency(monkeypatch):
    monkeypatch.setenv("OPENCODE_API_KEY", SECRET)
    respx.get(MODELS).mock(return_value=httpx.Response(200, json={"data": []}))
    client = build_client(FakeAsyncSession())
    response = client.get("/admin/providers/health")
    health = response.json()[0]
    assert health["ok"] is True
    assert health["status"] == "ok"
    assert health["latency_ms"] >= 0
    assert health["key_source"] == "env:OPENCODE_API_KEY"


@respx.mock
def test_smoke_returns_real_shape_and_records_usage(monkeypatch):
    monkeypatch.setenv("OPENCODE_API_KEY", SECRET)
    respx.post(f"{BASE}/chat/completions").mock(
        return_value=httpx.Response(
            200,
            json={
                "model": "deepseek-v4.1-flash",
                "choices": [{"message": {"content": "OPENCODE_OK"}}],
                "usage": {
                    "prompt_tokens": 20,
                    "completion_tokens": 4,
                    "total_tokens": 24,
                    "cost": 0.00003,
                },
            },
        )
    )
    session = FakeAsyncSession()
    client = build_client(session)

    response = client.post(
        "/admin/providers/opencode/smoke", json={"prompt": "ping"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["reply"] == "OPENCODE_OK"
    assert body["model"] == "deepseek-v4.1-flash"
    assert body["latency_ms"] >= 0
    assert body["input_tokens"] == 20
    assert body["output_tokens"] == 4
    assert body["cost_usd"] == 0.00003
    assert body["usage_id"]
    assert len(session.added) == 1
    assert session.added[0].total_tokens == 24


@respx.mock
def test_smoke_401_returns_clear_message_and_no_crash(monkeypatch):
    monkeypatch.setenv("OPENCODE_API_KEY", SECRET)
    respx.post(f"{BASE}/chat/completions").mock(
        return_value=httpx.Response(401, json={"error": {"message": "Invalid credential"}})
    )
    client = build_client(FakeAsyncSession())

    response = client.post("/admin/providers/opencode/smoke", json={"prompt": "ping"})

    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is False
    assert body["error_code"] == "unauthorized"
    assert "401" in body["user_message"]
    assert SECRET not in response.text


@respx.mock
def test_smoke_429_timeout_and_5xx_are_structured(monkeypatch):
    monkeypatch.setenv("OPENCODE_API_KEY", SECRET)
    client = build_client(FakeAsyncSession())

    respx.post(f"{BASE}/chat/completions").mock(
        return_value=httpx.Response(429, headers={"Retry-After": "3"}, json={})
    )
    body = client.post("/admin/providers/opencode/smoke", json={"prompt": "ping"}).json()
    assert body["error_code"] == "rate_limited"
    assert body["retry_after_s"] == 3.0

    respx.post(f"{BASE}/chat/completions").mock(side_effect=httpx.ReadTimeout("slow"))
    body = client.post(
        "/admin/providers/opencode/smoke", json={"prompt": "ping", "timeout_seconds": 1}
    ).json()
    assert body["error_code"] == "timeout"
    assert body["user_message"]

    respx.post(f"{BASE}/chat/completions").mock(return_value=httpx.Response(503, json={}))
    body = client.post("/admin/providers/opencode/smoke", json={"prompt": "ping"}).json()
    assert body["error_code"] == "server_error"
    assert body["http_status"] == 503


def test_smoke_disabled_provider_is_blocked():
    row = Provider(
        name="OPENCODE",
        display_name="OpenCode Console",
        adapter_type="openai_compat",
        base_url=BASE,
        default_model="deepseek-v4.1-flash",
        is_active=False,
        config={},
    )
    client = build_client(FakeAsyncSession(rows=[row]))
    body = client.post("/admin/providers/opencode/smoke", json={"prompt": "ping"}).json()
    assert body["ok"] is False
    assert body["error_code"] == "provider_disabled"


def test_usage_endpoint_lists_recorded_events():
    import uuid
    from datetime import UTC, datetime

    event = AiUsageEvent(
        id=uuid.uuid4(),
        request_id="oc_test",
        provider="OPENCODE",
        model="deepseek-v4.1-flash",
        key_source="env:OPENCODE_API_KEY",
        status="success",
        error_code=None,
        input_tokens=10,
        output_tokens=2,
        total_tokens=12,
        cost_usd=0.0001,
        cost_source="provider",
        latency_ms=321,
        fallback_used=False,
        fallback_reason=None,
        company_id=None,
        created_at=datetime.now(UTC),
    )
    client = build_client(FakeAsyncSession(events=[event]))
    response = client.get("/admin/providers/OPENCODE/usage")
    assert response.status_code == 200
    rows = response.json()
    assert len(rows) == 1
    assert rows[0]["total_tokens"] == 12
    assert rows[0]["cost_usd"] == 0.0001
    assert rows[0]["latency_ms"] == 321


def test_registry_survives_database_failure():
    client = build_client(FakeAsyncSession(fail_execute=True))
    response = client.get("/admin/providers/registry")
    assert response.status_code == 200
    assert response.json()[0]["configured_in_db"] is False
