from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class AiUsageEvent(Base):
    """Per-call billing telemetry for service providers.

    Deliberately contains no prompt text and no credential material.
    """

    __tablename__ = "ai_usage_events"
    __table_args__ = {"schema": "ai"}  # noqa: RUF012

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    request_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(200), nullable=False)
    key_source: Mapped[str | None] = mapped_column(String(200), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    error_code: Mapped[str | None] = mapped_column(String(40), nullable=True)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cost_usd: Mapped[float | None] = mapped_column(Numeric(12, 6), nullable=True)
    cost_source: Mapped[str | None] = mapped_column(String(20), nullable=True)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fallback_used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    fallback_reason: Mapped[str | None] = mapped_column(String(40), nullable=True)
    company_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=datetime.now, index=True
    )
    event_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
