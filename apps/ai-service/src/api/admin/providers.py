from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Literal

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.admin.auth import verify_admin_jwt
from src.db.models.provider import Provider
from src.db.models.usage import AiUsageEvent
from src.db.session import get_session
from src.llm.opencode import OpenCodeService, sanitize_error_text
from src.llm.provider_catalog import (
    ProviderSpec,
    get_provider_spec,
    list_provider_specs,
)
from src.llm.provider_secrets import resolve_provider_secret

logger = structlog.get_logger(__name__)
router = APIRouter()

SessionDep = Annotated[AsyncSession, Depends(get_session)]
AdminDep = Annotated[dict | None, Depends(verify_admin_jwt)]


class ProviderModelRead(BaseModel):
    id: str
    display_name: str
    max_tokens: int
    temperature: float
    timeout_seconds: int
    input_price_per_mtok: float
    output_price_per_mtok: float
    cached_input_price_per_mtok: float


class ProviderFallbackRead(BaseModel):
    provider: str | None
    model: str | None


class ServiceProviderRead(BaseModel):
    id: str
    name: str
    base_url: str
    auth_type: str
    status: Literal["enabled", "disabled"]
    is_active: bool
    default_model: str
    models: list[ProviderModelRead]
    fallback: ProviderFallbackRead
    key_source: str | None
    key_configured: bool
    configured_in_db: bool


class ProviderSettingsUpdate(BaseModel):
    enabled: bool | None = None
    default_model: str | None = None


class ProviderHealthRead(BaseModel):
    provider: str
    ok: bool
    status: Literal["ok", "fail", "disabled"]
    latency_ms: int
    http_status: int | None = None
    error_code: str | None = None
    error: str | None = None
    key_source: str | None = None
    checked_at: str


class ProviderSmokeRequest(BaseModel):
    model: str | None = None
    prompt: str = Field(default="Reply with exactly: OPENCODE_OK", min_length=1, max_length=2000)
    max_tokens: int | None = Field(default=None, ge=1, le=8192)
    temperature: float | None = Field(default=None, ge=0, le=2)
    timeout_seconds: float | None = Field(default=None, ge=1, le=120)
    allow_fallback: bool = False
    company_id: str | None = None


class ProviderSmokeResponse(BaseModel):
    ok: bool
    provider: str
    model: str
    reply: str | None = None
    latency_ms: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float | None = None
    cost_source: str | None = None
    key_source: str | None = None
    fallback_used: bool = False
    fallback_provider: str | None = None
    fallback_reason: str | None = None
    fallback_attempted: bool = False
    fallback_error_code: str | None = None
    fallback_user_message: str | None = None
    primary_error_code: str | None = None
    primary_user_message: str | None = None
    request_id: str = ""
    usage_id: str | None = None
    error_code: str | None = None
    user_message: str | None = None
    http_status: int | None = None
    retry_after_s: float | None = None


class UsageEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    request_id: str
    provider: str
    model: str
    key_source: str | None
    status: str
    error_code: str | None
    input_tokens: int
    output_tokens: int
    total_tokens: int
    cost_usd: float | None
    cost_source: str | None
    latency_ms: int
    fallback_used: bool
    fallback_reason: str | None
    company_id: str | None
    created_at: datetime


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _model_view(spec: ProviderSpec) -> list[ProviderModelRead]:
    return [
        ProviderModelRead(
            id=model.id,
            display_name=model.display_name,
            max_tokens=model.max_tokens,
            temperature=model.temperature,
            timeout_seconds=model.timeout_seconds,
            input_price_per_mtok=model.input_price_per_mtok,
            output_price_per_mtok=model.output_price_per_mtok,
            cached_input_price_per_mtok=model.cached_input_price_per_mtok,
        )
        for model in spec.models
    ]


def _provider_view(spec: ProviderSpec, row: Provider | None) -> ServiceProviderRead:
    is_active = bool(row.is_active) if row is not None else spec.enabled
    secret = resolve_provider_secret(spec.id)
    default_model = (row.default_model if row is not None else None) or spec.default_model
    if not spec.has_model(default_model):
        default_model = spec.default_model
    return ServiceProviderRead(
        id=spec.id,
        name=spec.name,
        base_url=spec.base_url,
        auth_type=spec.auth_type,
        status="enabled" if is_active else "disabled",
        is_active=is_active,
        default_model=default_model,
        models=_model_view(spec),
        fallback=ProviderFallbackRead(
            provider=spec.fallback_provider, model=spec.fallback_model
        ),
        key_source=secret.source if secret else None,
        key_configured=secret is not None,
        configured_in_db=row is not None,
    )


async def _load_provider_rows(session: AsyncSession) -> dict[str, Provider]:
    try:
        result = await session.execute(select(Provider))
        return {p.name: p for p in result.scalars().all()}
    except Exception as exc:
        logger.warning("provider_registry_db_unavailable", error=sanitize_error_text(exc))
        return {}


async def _get_provider_row(session: AsyncSession, provider_id: str) -> Provider | None:
    try:
        return await session.get(Provider, provider_id)
    except Exception as exc:
        logger.warning(
            "provider_registry_row_lookup_failed",
            provider=provider_id,
            error=sanitize_error_text(exc),
        )
        return None


def _require_spec(provider_id: str) -> ProviderSpec:
    spec = get_provider_spec(provider_id)
    if spec is None:
        raise HTTPException(status_code=404, detail=f"Unknown service provider: {provider_id}")
    return spec


@router.get("/providers/registry", response_model=list[ServiceProviderRead])
async def list_service_providers(
    session: SessionDep,
    admin: AdminDep,
) -> list[ServiceProviderRead]:
    rows = await _load_provider_rows(session)
    return [_provider_view(spec, rows.get(spec.id)) for spec in list_provider_specs()]


@router.patch("/providers/{provider_id}", response_model=ServiceProviderRead)
async def update_service_provider(
    provider_id: str,
    payload: ProviderSettingsUpdate,
    session: SessionDep,
    admin: AdminDep,
) -> ServiceProviderRead:
    spec = _require_spec(provider_id)
    if payload.default_model is not None and not spec.has_model(payload.default_model):
        allowed = ", ".join(model.id for model in spec.models)
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported model '{payload.default_model}'. Allowed: {allowed}",
        )

    row = await _get_provider_row(session, spec.id)
    if row is None:
        row = Provider(
            name=spec.id,
            display_name=spec.name,
            adapter_type="openai_compat",
            base_url=spec.base_url,
            default_model=spec.default_model,
            is_active=spec.enabled,
            config={
                "authType": spec.auth_type,
                "keySource": "env_or_vault",
                "fallback": {
                    "provider": spec.fallback_provider,
                    "model": spec.fallback_model,
                },
            },
        )
        session.add(row)

    if payload.enabled is not None:
        row.is_active = payload.enabled
    if payload.default_model is not None:
        row.default_model = payload.default_model

    try:
        await session.commit()
        await session.refresh(row)
    except Exception as exc:
        try:
            await session.rollback()
        except Exception:
            pass
        logger.warning(
            "provider_settings_update_failed",
            provider=spec.id,
            error=sanitize_error_text(exc),
        )
        raise HTTPException(
            status_code=503,
            detail="تعذّر حفظ إعدادات المزوّد الآن. تحقّق من قاعدة البيانات.",
        ) from exc

    logger.info(
        "provider_settings_updated",
        provider=spec.id,
        enabled=row.is_active,
        default_model=row.default_model,
    )
    return _provider_view(spec, row)


@router.get("/providers/health", response_model=list[ProviderHealthRead])
async def service_providers_health(
    session: SessionDep,
    admin: AdminDep,
    provider: str | None = Query(default=None),
) -> list[ProviderHealthRead]:
    specs = [_require_spec(provider)] if provider else list_provider_specs()
    rows = await _load_provider_rows(session)
    results: list[ProviderHealthRead] = []

    for spec in specs:
        row = rows.get(spec.id)
        if row is not None and not row.is_active:
            results.append(
                ProviderHealthRead(
                    provider=spec.id,
                    ok=False,
                    status="disabled",
                    latency_ms=0,
                    error_code="provider_disabled",
                    error="مزوّد OpenCode معطّل من الإدارة. فعّله أولًا.",
                    key_source=None,
                    checked_at=_now_iso(),
                )
            )
            continue

        result = await OpenCodeService(spec=spec).health()
        results.append(
            ProviderHealthRead(
                provider=spec.id,
                ok=bool(result.get("ok")),
                status="ok" if result.get("ok") else "fail",
                latency_ms=int(result.get("latency_ms") or 0),
                http_status=result.get("http_status"),
                error_code=result.get("error_code"),
                error=result.get("error"),
                key_source=result.get("key_source"),
                checked_at=str(result.get("checked_at") or _now_iso()),
            )
        )
    return results


@router.post("/providers/opencode/smoke", response_model=ProviderSmokeResponse)
async def opencode_smoke(
    payload: ProviderSmokeRequest,
    session: SessionDep,
    admin: AdminDep,
) -> ProviderSmokeResponse:
    spec = _require_spec("OPENCODE")
    try:
        model = spec.model(payload.model)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    row = await _get_provider_row(session, spec.id)
    if row is not None and not row.is_active:
        return ProviderSmokeResponse(
            ok=False,
            provider=spec.id,
            model=model.id,
            error_code="provider_disabled",
            user_message="مزوّد OpenCode معطّل من الإدارة. فعّله أولًا.",
            request_id="",
        )

    try:
        result = await OpenCodeService(spec=spec).smoke(
            prompt=payload.prompt,
            model_id=model.id,
            max_tokens=payload.max_tokens,
            temperature=payload.temperature,
            timeout_seconds=payload.timeout_seconds,
            allow_fallback=payload.allow_fallback,
            session=session,
            company_id=payload.company_id,
        )
    except Exception as exc:
        logger.warning(
            "opencode_smoke_unhandled_error",
            provider=spec.id,
            error=sanitize_error_text(exc),
        )
        return ProviderSmokeResponse(
            ok=False,
            provider=spec.id,
            model=model.id,
            error_code="internal_error",
            user_message="حدث خطأ غير متوقع أثناء اختبار المزوّد.",
        )

    return ProviderSmokeResponse(**result)


@router.get("/providers/{provider_id}/usage", response_model=list[UsageEventRead])
async def service_provider_usage(
    provider_id: str,
    session: SessionDep,
    admin: AdminDep,
    limit: int = Query(default=20, ge=1, le=200),
) -> list[UsageEventRead]:
    spec = _require_spec(provider_id)
    try:
        result = await session.execute(
            select(AiUsageEvent)
            .where(AiUsageEvent.provider == spec.id)
            .order_by(AiUsageEvent.created_at.desc())
            .limit(limit)
        )
        rows = list(result.scalars().all())
    except Exception as exc:
        logger.warning(
            "provider_usage_query_failed",
            provider=spec.id,
            error=sanitize_error_text(exc),
        )
        return []

    return [
        UsageEventRead(
            id=str(row.id),
            request_id=row.request_id,
            provider=row.provider,
            model=row.model,
            key_source=row.key_source,
            status=row.status,
            error_code=row.error_code,
            input_tokens=row.input_tokens,
            output_tokens=row.output_tokens,
            total_tokens=row.total_tokens,
            cost_usd=float(row.cost_usd) if row.cost_usd is not None else None,
            cost_source=row.cost_source,
            latency_ms=row.latency_ms,
            fallback_used=row.fallback_used,
            fallback_reason=row.fallback_reason,
            company_id=row.company_id,
            created_at=row.created_at,
        )
        for row in rows
    ]
