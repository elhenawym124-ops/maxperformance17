"""Register OpenCode as a service provider + per-call usage telemetry.

Additive only: inserts the ``OPENCODE`` provider row (no-op if it exists) and
creates ``ai.ai_usage_events`` for token/cost recording. Existing providers,
keys, and logs are untouched.

Revision ID: 0029
Revises: 0028
Create Date: 2026-11-17 00:00:00.000000
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0029"
down_revision: Union[str, None] = "0028"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

OPENCODE_CONFIG = (
    '{"authType":"bearer","keySource":"env_or_vault",'
    '"healthEndpoint":"https://opencode.ai/inference/v1/models",'
    '"fallback":{"provider":"DEEPSEEK","model":"deepseek-flash"}}'
)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "providers" in inspector.get_table_names(schema="ai"):
        op.execute(
            sa.text(
                """
                INSERT INTO ai.providers
                    (name, display_name, adapter_type, base_url, default_model,
                     is_active, config, created_at)
                VALUES
                    ('OPENCODE', 'OpenCode Console', 'openai_compat',
                     'https://opencode.ai/inference/openai/v1',
                     'deepseek-v4.1-flash', true,
                     CAST(:config AS jsonb), now())
                ON CONFLICT (name) DO NOTHING
                """
            ).bindparams(sa.bindparam("config", OPENCODE_CONFIG))
        )

    if "ai_usage_events" not in inspector.get_table_names(schema="ai"):
        op.create_table(
            "ai_usage_events",
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column("request_id", sa.String(length=64), nullable=False),
            sa.Column("provider", sa.String(length=50), nullable=False),
            sa.Column("model", sa.String(length=200), nullable=False),
            sa.Column("key_source", sa.String(length=200), nullable=True),
            sa.Column("status", sa.String(length=20), nullable=False),
            sa.Column("error_code", sa.String(length=40), nullable=True),
            sa.Column("input_tokens", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("output_tokens", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("total_tokens", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("cost_usd", sa.Numeric(precision=12, scale=6), nullable=True),
            sa.Column("cost_source", sa.String(length=20), nullable=True),
            sa.Column("latency_ms", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("fallback_used", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("fallback_reason", sa.String(length=40), nullable=True),
            sa.Column("company_id", sa.String(length=100), nullable=True),
            sa.Column(
                "created_at",
                postgresql.TIMESTAMP(timezone=True),
                nullable=False,
                server_default=sa.func.now(),
            ),
            sa.Column("metadata", postgresql.JSONB(), nullable=True),
            schema="ai",
        )
        op.create_index("ix_ai_usage_events_request_id", "ai_usage_events", ["request_id"], schema="ai")
        op.create_index("ix_ai_usage_events_provider", "ai_usage_events", ["provider"], schema="ai")
        op.create_index("ix_ai_usage_events_company_id", "ai_usage_events", ["company_id"], schema="ai")
        op.create_index("ix_ai_usage_events_created_at", "ai_usage_events", ["created_at"], schema="ai")


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "ai_usage_events" in inspector.get_table_names(schema="ai"):
        op.drop_index("ix_ai_usage_events_created_at", table_name="ai_usage_events", schema="ai")
        op.drop_index("ix_ai_usage_events_company_id", table_name="ai_usage_events", schema="ai")
        op.drop_index("ix_ai_usage_events_provider", table_name="ai_usage_events", schema="ai")
        op.drop_index("ix_ai_usage_events_request_id", table_name="ai_usage_events", schema="ai")
        op.drop_table("ai_usage_events", schema="ai")
    if "providers" in inspector.get_table_names(schema="ai"):
        op.execute(
            """
            DELETE FROM ai.providers p
            WHERE p.name = 'OPENCODE'
              AND NOT EXISTS (
                  SELECT 1 FROM public.ai_keys k WHERE k.provider = 'OPENCODE'
              )
            """
        )
