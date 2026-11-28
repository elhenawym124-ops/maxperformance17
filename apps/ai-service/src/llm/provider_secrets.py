"""Secret resolution for env/vault-only providers.

``OPENCODE`` must never be keyed from ``public.ai_keys`` or ``.env`` files: its
credential is read from the process environment or a mounted secret file. The
value is never returned in API payloads, logs, or error messages.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

import structlog

from src.llm.provider_catalog import ProviderSpec, get_provider_spec

logger = structlog.get_logger(__name__)

ENV_ONLY_PROVIDERS = frozenset({"OPENCODE"})


@dataclass(frozen=True)
class ProviderSecret:
    value: str
    source: str


def _candidate_files(spec: ProviderSpec) -> list[Path]:
    prefix = spec.id.upper()
    candidates: list[Path] = []

    explicit = os.environ.get(f"{prefix}_API_KEY_FILE") or os.environ.get(f"{prefix}_SECRET_FILE")
    if explicit and explicit.strip():
        candidates.append(Path(explicit.strip()))

    secrets_dir = (os.environ.get("MAXP_SECRETS_DIR") or "").strip()
    if secrets_dir:
        candidates.append(Path(secrets_dir) / f"{spec.id.lower()}_api_key")

    if spec.id == "OPENCODE":
        candidates.extend(
            [
                Path("/run/secrets/opencode_api_key"),
                Path("/run/secrets/opencode_api_key.txt"),
            ]
        )
    return candidates


def resolve_provider_secret(provider_id: str) -> ProviderSecret | None:
    """Return the configured secret + a non-sensitive source label, or ``None``."""
    spec = get_provider_spec(provider_id)
    if spec is None or spec.id not in ENV_ONLY_PROVIDERS:
        return None

    for name in spec.env_key_names:
        value = (os.environ.get(name) or "").strip()
        if value:
            return ProviderSecret(value=value, source=f"env:{name}")

    for path in _candidate_files(spec):
        try:
            value = path.read_text(encoding="utf-8").strip()
        except OSError:
            continue
        if value:
            return ProviderSecret(value=value, source=f"vault:{path}")

    logger.warning("provider_secret_missing", provider=spec.id)
    return None


def has_provider_secret(provider_id: str) -> bool:
    return resolve_provider_secret(provider_id) is not None
