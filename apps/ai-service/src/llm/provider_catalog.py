"""Additive service-provider catalog.

Only providers that need settings/call wiring beyond the legacy ``ai.providers``
rows live here. Existing providers keep using their current code paths.
"""

from __future__ import annotations

from dataclasses import dataclass

OPENCODE_BASE_URL = "https://opencode.ai/inference/openai/v1"
OPENCODE_MODELS_URL = "https://opencode.ai/inference/v1/models"


@dataclass(frozen=True)
class ModelSpec:
    """Default invocation settings + list price for one model.

    ``max_tokens`` is the default output cap (not the context window), and the
    prices are USD per 1M tokens, used only when the provider response does not
    report ``usage.cost`` itself.
    """

    id: str
    display_name: str
    max_tokens: int
    temperature: float
    timeout_seconds: int
    input_price_per_mtok: float
    output_price_per_mtok: float
    cached_input_price_per_mtok: float = 0.0


@dataclass(frozen=True)
class ProviderSpec:
    id: str
    name: str
    base_url: str
    auth_type: str
    models: tuple[ModelSpec, ...]
    default_model: str
    fallback_provider: str | None = None
    fallback_model: str | None = None
    env_key_names: tuple[str, ...] = ()
    models_url: str = ""
    enabled: bool = True

    def model(self, model_id: str | None = None) -> ModelSpec:
        target = (model_id or self.default_model).strip()
        for spec in self.models:
            if spec.id == target:
                return spec
        raise ValueError(f"Unsupported model for {self.id}: {target}")

    def has_model(self, model_id: str | None) -> bool:
        if not model_id:
            return False
        return any(spec.id == model_id.strip() for spec in self.models)

    def default_model_spec(self) -> ModelSpec:
        return self.model(self.default_model)


OPENCODE = ProviderSpec(
    id="OPENCODE",
    name="OpenCode Console",
    base_url=OPENCODE_BASE_URL,
    auth_type="bearer",
    models=(
        ModelSpec(
            id="deepseek-v4.1-flash",
            display_name="DeepSeek V4.1 Flash",
            max_tokens=2048,
            temperature=0.3,
            timeout_seconds=30,
            input_price_per_mtok=0.30,
            output_price_per_mtok=1.20,
            cached_input_price_per_mtok=0.006,
        ),
        ModelSpec(
            id="deepseek-v4-pro",
            display_name="DeepSeek V4 Pro",
            max_tokens=4096,
            temperature=0.3,
            timeout_seconds=60,
            input_price_per_mtok=1.74,
            output_price_per_mtok=3.48,
            cached_input_price_per_mtok=0.145,
        ),
    ),
    default_model="deepseek-v4.1-flash",
    fallback_provider="DEEPSEEK",
    fallback_model="deepseek-flash",
    env_key_names=("OPENCODE_API_KEY", "OPENCODE_ZEN_API_KEY"),
    models_url=OPENCODE_MODELS_URL,
    enabled=True,
)

PROVIDER_CATALOG: dict[str, ProviderSpec] = {OPENCODE.id: OPENCODE}


def get_provider_spec(provider_id: str) -> ProviderSpec | None:
    return PROVIDER_CATALOG.get(str(provider_id or "").strip().upper())


def list_provider_specs() -> list[ProviderSpec]:
    return list(PROVIDER_CATALOG.values())


def estimate_cost(
    model: ModelSpec,
    *,
    input_tokens: int,
    output_tokens: int,
    cached_input_tokens: int = 0,
) -> float:
    """Return an estimated USD cost rounded to 8 decimals (never negative)."""
    billable_input = max(int(input_tokens or 0) - int(cached_input_tokens or 0), 0)
    total = (
        billable_input * model.input_price_per_mtok
        + max(int(output_tokens or 0), 0) * model.output_price_per_mtok
        + max(int(cached_input_tokens or 0), 0) * model.cached_input_price_per_mtok
    ) / 1_000_000
    return round(total, 8)
