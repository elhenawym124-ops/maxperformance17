"""OpenCode Console provider adapter (OpenAI-compatible chat completions).

The adapter is deliberately isolated from the legacy LLM client: it reads its
own env/vault credential, maps provider failures to explicit codes/messages,
and returns token + cost telemetry. Nothing here mutates existing providers.
"""

from __future__ import annotations

import asyncio
import re
import time
import uuid
from dataclasses import dataclass
from typing import Any, Awaitable, Callable

import httpx
import structlog

from src.llm.provider_catalog import (
    ModelSpec,
    ProviderSpec,
    estimate_cost,
    get_provider_spec,
)
from src.llm.provider_secrets import ProviderSecret, resolve_provider_secret

logger = structlog.get_logger(__name__)

_ERROR_MESSAGES: dict[str, str] = {
    "key_missing": (
        "مفتاح OpenCode غير مُعدّ. اضبط OPENCODE_API_KEY أو ملف الخزنة ثم أعد المحاولة."
    ),
    "unauthorized": "مفتاح OpenCode غير صالح أو منتهي (HTTP 401). حدّث المفتاح في الخزنة.",
    "forbidden": (
        "OpenCode رفض الطلب (HTTP 403). تحقّق من صلاحية المفتاح أو أن الموديل متاح لحسابك."
    ),
    "rate_limited": "تم تجاوز حد الطلبات لدى OpenCode (HTTP 429).",
    "timeout": "انتهت مهلة انتظار OpenCode.",
    "bad_request": "الطلب غير صالح أو الموديل غير متاح لدى OpenCode.",
    "server_error": "خدمة OpenCode أعادت خطأ مؤقتًا.",
    "provider_error": "تعذّر إكمال الطلب عبر OpenCode.",
    "empty_response": "أعاد OpenCode ردًا فارغًا.",
    "fallback_unavailable": "المسار البديل غير متاح (لا يوجد مفتاح DeepSeek فعّال).",
    "fallback_failed": "فشل المسار البديل أيضًا.",
    "provider_disabled": "مزوّد OpenCode معطّل من الإدارة. فعّله أولًا.",
    "internal_error": "حدث خطأ غير متوقع أثناء تنفيذ طلب المزوّد.",
}

_SECRET_PATTERNS = (
    re.compile(r"(?i)bearer\s+[^\s,;]+"),
    re.compile(r"sk-[A-Za-z0-9_\-]{4,}"),
)


def sanitize_error_text(text: Any, secret: str | None = None) -> str:
    """Strip credentials from any provider/error text before logging or returning."""
    cleaned = str(text or "")
    if secret:
        cleaned = cleaned.replace(secret, "***")
    for pattern in _SECRET_PATTERNS:
        cleaned = pattern.sub("***", cleaned)
    return cleaned[:300]


class OpenCodeError(Exception):
    def __init__(
        self,
        code: str,
        *,
        http_status: int | None = None,
        retry_after_s: float | None = None,
        provider_message: str = "",
        latency_ms: int | None = None,
        timeout_seconds: float | None = None,
        secret: str | None = None,
    ) -> None:
        self.code = code
        self.http_status = http_status
        self.retry_after_s = retry_after_s
        self.provider_message = sanitize_error_text(provider_message, secret)
        self.latency_ms = latency_ms
        self.timeout_seconds = timeout_seconds
        self.user_message = self._build_message()
        super().__init__(self.user_message)

    def _build_message(self) -> str:
        base = _ERROR_MESSAGES.get(self.code, _ERROR_MESSAGES["provider_error"])
        if self.code == "rate_limited" and self.retry_after_s:
            base = f"{base} أعد المحاولة بعد {int(self.retry_after_s)} ثانية."
        elif self.code == "timeout" and self.timeout_seconds:
            base = f"{base} (المهلة {int(self.timeout_seconds)} ثانية)."
        elif self.http_status and self.code in {"bad_request", "server_error"}:
            base = f"{base} (HTTP {self.http_status})."
        return base

    def to_dict(self) -> dict[str, Any]:
        return {
            "error_code": self.code,
            "user_message": self.user_message,
            "http_status": self.http_status,
            "retry_after_s": self.retry_after_s,
        }


@dataclass
class ChatResult:
    text: str
    model: str
    provider: str = "OPENCODE"
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    cached_input_tokens: int = 0
    cost_usd: float | None = None
    cost_source: str | None = None
    latency_ms: int = 0
    usage: dict[str, Any] | None = None
    fallback_used: bool = False
    fallback_provider: str | None = None
    fallback_reason: str | None = None


class OpenCodeClient:
    def __init__(
        self,
        api_key: str,
        *,
        spec: ProviderSpec | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
        base_url: str | None = None,
    ) -> None:
        self._api_key = (api_key or "").strip()
        self.spec = spec or get_provider_spec("OPENCODE")
        if self.spec is None:
            raise ValueError("OPENCODE provider spec is not registered")
        self._base_url = (base_url or self.spec.base_url).rstrip("/")
        self._transport = transport

    # ------------------------------------------------------------------
    # HTTP plumbing
    # ------------------------------------------------------------------
    async def _request(
        self,
        method: str,
        url: str,
        *,
        payload: dict[str, Any] | None = None,
        timeout_seconds: float,
    ) -> tuple[dict[str, Any], int, int]:
        if not self._api_key:
            raise OpenCodeError("key_missing")

        started = time.perf_counter()
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(timeout_seconds, connect=min(10.0, timeout_seconds)),
                transport=self._transport,
                trust_env=False,
            ) as client:
                response = await asyncio.wait_for(
                    client.request(method, url, json=payload, headers=headers),
                    timeout=timeout_seconds,
                )
        except (TimeoutError, httpx.TimeoutException) as exc:
            raise OpenCodeError(
                "timeout",
                latency_ms=_elapsed_ms(started),
                timeout_seconds=timeout_seconds,
                secret=self._api_key,
            ) from exc
        except httpx.RequestError as exc:
            raise OpenCodeError(
                "provider_error",
                latency_ms=_elapsed_ms(started),
                provider_message=str(exc),
                secret=self._api_key,
            ) from exc

        latency_ms = _elapsed_ms(started)
        data: dict[str, Any] = {}
        try:
            parsed = response.json() if response.content else {}
            if isinstance(parsed, dict):
                data = parsed
        except ValueError:
            data = {}

        if 200 <= response.status_code < 300:
            return data, response.status_code, latency_ms

        raise self._status_error(
            response.status_code,
            data,
            response.headers,
            latency_ms=latency_ms,
        )

    def _status_error(
        self,
        status_code: int,
        data: dict[str, Any],
        headers: httpx.Headers,
        *,
        latency_ms: int,
    ) -> OpenCodeError:
        error_obj = data.get("error") if isinstance(data.get("error"), dict) else {}
        provider_message = str(
            error_obj.get("message") or data.get("message") or data.get("detail") or ""
        )
        retry_after: float | None = None
        raw_retry = headers.get("retry-after")
        if raw_retry:
            try:
                retry_after = float(raw_retry)
            except ValueError:
                retry_after = None

        if status_code == 401:
            code = "unauthorized"
        elif status_code == 403:
            code = "forbidden"
        elif status_code == 429:
            code = "rate_limited"
        elif 400 <= status_code < 500:
            code = "bad_request"
        elif 500 <= status_code < 600:
            code = "server_error"
        else:
            code = "provider_error"

        return OpenCodeError(
            code,
            http_status=status_code,
            retry_after_s=retry_after,
            provider_message=provider_message,
            latency_ms=latency_ms,
            secret=self._api_key,
        )

    # ------------------------------------------------------------------
    # Public operations
    # ------------------------------------------------------------------
    async def chat(
        self,
        messages: list[dict[str, Any]],
        *,
        model_id: str | None = None,
        max_tokens: int | None = None,
        temperature: float | None = None,
        timeout_seconds: float | None = None,
    ) -> ChatResult:
        model = self.spec.model(model_id)
        timeout = float(timeout_seconds or model.timeout_seconds)
        payload = {
            "model": model.id,
            "messages": messages,
            "max_tokens": int(max_tokens or model.max_tokens),
            "temperature": float(model.temperature if temperature is None else temperature),
        }

        data, _status, latency_ms = await self._request(
            "POST",
            f"{self._base_url}/chat/completions",
            payload=payload,
            timeout_seconds=timeout,
        )

        choices = data.get("choices")
        if not isinstance(choices, list) or not choices:
            raise OpenCodeError("empty_response", latency_ms=latency_ms)

        first = choices[0] if isinstance(choices[0], dict) else {}
        message = first.get("message") if isinstance(first.get("message"), dict) else {}
        text = str(message.get("content") or "")

        usage = data.get("usage") if isinstance(data.get("usage"), dict) else {}
        opencode_usage = usage.get("opencode") if isinstance(usage.get("opencode"), dict) else {}
        token_details = (
            opencode_usage.get("tokens")
            if isinstance(opencode_usage.get("tokens"), dict)
            else {}
        )

        input_tokens = int(usage.get("prompt_tokens") or token_details.get("input") or 0)
        output_tokens = int(usage.get("completion_tokens") or token_details.get("output") or 0)
        cached_tokens = int(token_details.get("cache_read") or 0)
        total_tokens = int(
            usage.get("total_tokens") or max(input_tokens + output_tokens, 0)
        )

        raw_cost = usage.get("cost")
        if isinstance(raw_cost, (int, float)) and not isinstance(raw_cost, bool):
            cost_usd = round(float(raw_cost), 8)
            cost_source = "provider"
        else:
            cost_usd = estimate_cost(
                model,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                cached_input_tokens=cached_tokens,
            )
            cost_source = "estimated"

        return ChatResult(
            text=text,
            model=str(data.get("model") or model.id),
            provider="OPENCODE",
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens,
            cached_input_tokens=cached_tokens,
            cost_usd=cost_usd,
            cost_source=cost_source,
            latency_ms=latency_ms,
            usage=usage,
        )

    async def health(self, *, timeout_seconds: float = 8.0) -> dict[str, Any]:
        if not self._api_key:
            return _health_failure("key_missing", latency_ms=0)

        try:
            data, status_code, latency_ms = await self._request(
                "GET",
                self.spec.models_url,
                timeout_seconds=timeout_seconds,
            )
        except OpenCodeError as exc:
            return _health_failure(
                exc.code,
                latency_ms=exc.latency_ms or 0,
                http_status=exc.http_status,
                error=exc.user_message,
            )
        except Exception as exc:  # pragma: no cover - defensive, never crash health
            logger.warning(
                "opencode_health_failed",
                error=sanitize_error_text(exc, self._api_key),
            )
            return _health_failure("provider_error", latency_ms=0)

        models = data.get("data")
        return {
            "ok": True,
            "status": "ok",
            "latency_ms": latency_ms,
            "http_status": status_code,
            "error_code": None,
            "error": None,
            "models_count": len(models) if isinstance(models, list) else None,
        }


def _elapsed_ms(started: float) -> int:
    return int((time.perf_counter() - started) * 1000)


def _health_failure(
    code: str,
    *,
    latency_ms: int,
    http_status: int | None = None,
    error: str | None = None,
) -> dict[str, Any]:
    message = error or _ERROR_MESSAGES.get(code, _ERROR_MESSAGES["provider_error"])
    return {
        "ok": False,
        "status": "fail",
        "latency_ms": latency_ms,
        "http_status": http_status,
        "error_code": code,
        "error": message,
        "models_count": None,
    }


FallbackRunner = Callable[..., Awaitable[ChatResult]]


class OpenCodeService:
    """Smoke/health/usage orchestration around :class:`OpenCodeClient`."""

    def __init__(
        self,
        *,
        spec: ProviderSpec | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
        fallback_runner: FallbackRunner | None = None,
    ) -> None:
        self.spec = spec or get_provider_spec("OPENCODE")
        if self.spec is None:
            raise ValueError("OPENCODE provider spec is not registered")
        self._transport = transport
        self._fallback_runner = fallback_runner

    def secret(self) -> ProviderSecret | None:
        return resolve_provider_secret(self.spec.id)

    async def health(self) -> dict[str, Any]:
        started = time.perf_counter()
        secret = self.secret()
        if secret is None:
            return {
                **_health_failure("key_missing", latency_ms=0),
                "key_source": None,
                "checked_at": _utc_now(),
            }
        client = OpenCodeClient(secret.value, spec=self.spec, transport=self._transport)
        result = await client.health()
        result["key_source"] = secret.source
        result["checked_at"] = _utc_now()
        result["latency_ms"] = int((time.perf_counter() - started) * 1000)
        return result

    async def smoke(
        self,
        *,
        prompt: str,
        model_id: str | None = None,
        max_tokens: int | None = None,
        temperature: float | None = None,
        timeout_seconds: float | None = None,
        allow_fallback: bool = False,
        session: Any | None = None,
        company_id: str | None = None,
    ) -> dict[str, Any]:
        model = self.spec.model(model_id)
        request_id = f"oc_{uuid.uuid4().hex[:20]}"
        messages = [{"role": "user", "content": prompt}]
        started = time.perf_counter()
        secret = self.secret()

        if secret is None:
            error = OpenCodeError("key_missing")
            await self._record(
                session,
                request_id=request_id,
                provider=self.spec.id,
                model=model.id,
                status="failed",
                error_code=error.code,
                latency_ms=0,
                fallback_used=False,
                fallback_reason=None,
                company_id=company_id,
                key_source=None,
            )
            return await self._failure_payload(
                request_id=request_id,
                model=model.id,
                error=error,
                latency_ms=_elapsed_ms(started),
                key_source=None,
                allow_fallback=allow_fallback,
                session=session,
                company_id=company_id,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                timeout_seconds=timeout_seconds,
            )

        client = OpenCodeClient(secret.value, spec=self.spec, transport=self._transport)
        try:
            result = await client.chat(
                messages,
                model_id=model.id,
                max_tokens=max_tokens,
                temperature=temperature,
                timeout_seconds=timeout_seconds,
            )
        except OpenCodeError as exc:
            logger.warning(
                "opencode_call_failed",
                provider=self.spec.id,
                model=model.id,
                error_code=exc.code,
                http_status=exc.http_status,
                latency_ms=exc.latency_ms,
            )
            await self._record(
                session,
                request_id=request_id,
                provider=self.spec.id,
                model=model.id,
                status="failed",
                error_code=exc.code,
                latency_ms=exc.latency_ms or _elapsed_ms(started),
                fallback_used=False,
                fallback_reason=None,
                company_id=company_id,
                key_source=secret.source,
            )
            return await self._failure_payload(
                request_id=request_id,
                model=model.id,
                error=exc,
                latency_ms=_elapsed_ms(started),
                key_source=secret.source,
                allow_fallback=allow_fallback,
                session=session,
                company_id=company_id,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                timeout_seconds=timeout_seconds,
            )

        usage_id = await self._record(
            session,
            request_id=request_id,
            provider=result.provider,
            model=result.model,
            status="success",
            error_code=None,
            latency_ms=result.latency_ms,
            fallback_used=False,
            fallback_reason=None,
            company_id=company_id,
            key_source=secret.source,
            input_tokens=result.input_tokens,
            output_tokens=result.output_tokens,
            total_tokens=result.total_tokens,
            cost_usd=result.cost_usd,
            cost_source=result.cost_source,
        )
        return self._success_payload(
            result,
            request_id=request_id,
            key_source=secret.source,
            usage_id=usage_id,
            latency_ms=_elapsed_ms(started),
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    async def _failure_payload(
        self,
        *,
        request_id: str,
        model: str,
        error: OpenCodeError,
        latency_ms: int,
        key_source: str | None,
        allow_fallback: bool,
        session: Any | None,
        company_id: str | None,
        messages: list[dict[str, Any]],
        max_tokens: int | None,
        temperature: float | None,
        timeout_seconds: float | None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "ok": False,
            "provider": self.spec.id,
            "model": model,
            "reply": None,
            "latency_ms": latency_ms,
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "cost_usd": None,
            "cost_source": None,
            "key_source": key_source,
            "fallback_used": False,
            "fallback_provider": None,
            "fallback_reason": None,
            "request_id": request_id,
            "usage_id": None,
            "error_code": error.code,
            "user_message": error.user_message,
            "http_status": error.http_status,
            "retry_after_s": error.retry_after_s,
        }
        if not allow_fallback or not self.spec.fallback_provider:
            return payload

        try:
            fallback_result = await self._run_fallback(
                messages,
                max_tokens=max_tokens,
                temperature=temperature,
                timeout_seconds=timeout_seconds,
            )
        except OpenCodeError as fallback_error:
            payload["fallback_attempted"] = True
            payload["fallback_error_code"] = fallback_error.code
            payload["fallback_user_message"] = fallback_error.user_message
            return payload

        fallback_usage_id = await self._record(
            session,
            request_id=request_id,
            provider=fallback_result.provider,
            model=fallback_result.model,
            status="success",
            error_code=None,
            latency_ms=fallback_result.latency_ms,
            fallback_used=True,
            fallback_reason=error.code,
            company_id=company_id,
            key_source=f"db:{fallback_result.provider}",
            input_tokens=fallback_result.input_tokens,
            output_tokens=fallback_result.output_tokens,
            total_tokens=fallback_result.total_tokens,
            cost_usd=fallback_result.cost_usd,
            cost_source=fallback_result.cost_source,
        )
        success = self._success_payload(
            fallback_result,
            request_id=request_id,
            key_source=f"db:{fallback_result.provider}",
            usage_id=fallback_usage_id,
            latency_ms=latency_ms + fallback_result.latency_ms,
        )
        success["fallback_used"] = True
        success["fallback_provider"] = fallback_result.provider
        success["fallback_reason"] = error.code
        success["fallback_attempted"] = True
        success["primary_error_code"] = error.code
        success["primary_user_message"] = error.user_message
        return success

    async def _run_fallback(
        self,
        messages: list[dict[str, Any]],
        *,
        max_tokens: int | None,
        temperature: float | None,
        timeout_seconds: float | None,
    ) -> ChatResult:
        if self._fallback_runner is not None:
            return await self._fallback_runner(
                messages,
                model=self.spec.fallback_model,
                max_tokens=max_tokens,
                temperature=temperature,
                timeout_seconds=timeout_seconds,
            )

        from src.llm.client import LLMClient
        from src.llm.key_resolver import get_active_key

        provider = self.spec.fallback_provider
        if not provider:
            raise OpenCodeError("fallback_unavailable")
        api_key = await get_active_key(provider)
        if not api_key:
            raise OpenCodeError("fallback_unavailable")

        model = self.spec.fallback_model or self.spec.default_model
        timeout = float(timeout_seconds or self.spec.default_model_spec().timeout_seconds)
        started = time.perf_counter()
        try:
            client = LLMClient(provider=provider, model=model, api_key=api_key)
            response = await asyncio.wait_for(
                client.generate(
                    messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                ),
                timeout=timeout,
            )
        except TimeoutError as exc:
            raise OpenCodeError(
                "timeout",
                timeout_seconds=timeout,
                latency_ms=_elapsed_ms(started),
            ) from exc
        except Exception as exc:
            raise OpenCodeError(
                "fallback_failed",
                provider_message=str(exc),
                latency_ms=_elapsed_ms(started),
                secret=api_key,
            ) from exc

        usage = response.usage or {}
        input_tokens = int(usage.get("prompt_tokens") or usage.get("input_tokens") or 0)
        output_tokens = int(usage.get("completion_tokens") or usage.get("output_tokens") or 0)
        return ChatResult(
            text=str(response.text or ""),
            model=str(response.model or model),
            provider=provider,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=int(usage.get("total_tokens") or input_tokens + output_tokens),
            cost_usd=None,
            cost_source=None,
            latency_ms=_elapsed_ms(started),
            usage=usage,
        )

    def _success_payload(
        self,
        result: ChatResult,
        *,
        request_id: str,
        key_source: str | None,
        usage_id: str | None,
        latency_ms: int,
    ) -> dict[str, Any]:
        return {
            "ok": True,
            "provider": result.provider,
            "model": result.model,
            "reply": result.text,
            "latency_ms": latency_ms,
            "input_tokens": result.input_tokens,
            "output_tokens": result.output_tokens,
            "total_tokens": result.total_tokens,
            "cost_usd": result.cost_usd,
            "cost_source": result.cost_source,
            "key_source": key_source,
            "fallback_used": result.fallback_used,
            "fallback_provider": result.fallback_provider,
            "fallback_reason": result.fallback_reason,
            "request_id": request_id,
            "usage_id": usage_id,
            "error_code": None,
            "user_message": None,
            "http_status": None,
        }

    async def _record(
        self,
        session: Any | None,
        *,
        request_id: str,
        provider: str,
        model: str,
        status: str,
        error_code: str | None,
        latency_ms: int,
        fallback_used: bool,
        fallback_reason: str | None,
        company_id: str | None,
        key_source: str | None,
        input_tokens: int = 0,
        output_tokens: int = 0,
        total_tokens: int = 0,
        cost_usd: float | None = None,
        cost_source: str | None = None,
    ) -> str | None:
        if session is None:
            return None
        try:
            from src.db.models.usage import AiUsageEvent

            event = AiUsageEvent(
                id=uuid.uuid4(),
                request_id=request_id,
                provider=provider,
                model=model,
                key_source=key_source,
                status=status,
                error_code=error_code,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=total_tokens,
                cost_usd=cost_usd,
                cost_source=cost_source,
                latency_ms=latency_ms,
                fallback_used=fallback_used,
                fallback_reason=fallback_reason,
                company_id=company_id,
            )
            session.add(event)
            await session.commit()
            return str(event.id)
        except Exception as exc:
            try:
                await session.rollback()
            except Exception:
                pass
            logger.warning(
                "provider_usage_record_failed",
                provider=provider,
                error=sanitize_error_text(exc),
            )
            return None


def _utc_now() -> str:
    from datetime import UTC, datetime

    return datetime.now(UTC).isoformat()
