from __future__ import annotations

from datetime import datetime
from typing import ClassVar

from sqlalchemy import Column, DateTime, Index, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class AgentDataConflict(Base):
    __tablename__ = "agent_data_conflicts"
    __table_args__: ClassVar[tuple] = (
        UniqueConstraint(
            "company_id", "surface", "source_row_id", "conflict_key", "status",
            name="uq_open_conflict_per_source_key"
        ),
        Index("idx_conflicts_company_status", "company_id", "status"),
        {"schema": "public"},
    )

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    company_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    surface: Mapped[str] = mapped_column(String(50), nullable=False)
    source_row_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    conflict_key: Mapped[str] = mapped_column(String(100), nullable=False)
    written_value: Mapped[str] = mapped_column(Text, nullable=False)
    live_value: Mapped[str] = mapped_column(Text, nullable=False)
    live_source: Mapped[str] = mapped_column(String(200), nullable=False)
    conversation_id: Mapped[str | None] = mapped_column(String(150), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="OPEN")
    resolved_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    resolution_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )
