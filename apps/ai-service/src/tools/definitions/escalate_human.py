from __future__ import annotations

from typing import Any

import structlog
from agent_framework import FunctionTool
from pydantic import BaseModel, Field

from src.tools.backend_client import get_backend_client

logger = structlog.get_logger(__name__)

# Human escalation targets are NOT AI agent roles: they are people/teams that
# receive the flagged conversation in the dashboard inbox. Registering them here
# lets the LLM pass a validated target_role instead of an arbitrary name.
HUMAN_ESCALATION_ROLES: dict[str, str] = {
    "human_hr_manager": "مدير الموارد البشرية",
    "human_finance_manager": "المدير المالي",
    "human_store_manager": "مدير المتجر",
}
DEFAULT_HUMAN_ESCALATION_ROLE = "human_hr_manager"


class EscalateToHumanInput(BaseModel):
    target_role: str = Field(
        default=DEFAULT_HUMAN_ESCALATION_ROLE,
        description=(
            "Registered human role to escalate to: human_hr_manager (default), "
            "human_finance_manager, or human_store_manager."
        ),
    )
    reason: str = Field(..., description="Short reason why a human teammate must follow up (complaint, refund request, unknown info the customer insists on, management confirmation).")
    customer_request: str | None = Field(default=None, description="What the customer asked for, in one short sentence.")
    conversation_id: str | None = Field(default=None, description="Conversation/thread ID (auto-injected when available)")
    company_id: str | None = Field(default=None, description="Tenant ID (auto-injected)")


async def escalate_to_human(input_data: EscalateToHumanInput) -> dict[str, Any]:
    """Flags the conversation for human follow-up so a teammate sees it in the inbox."""
    company_id = input_data.company_id or ""
    conversation_id = input_data.conversation_id or ""
    if not company_id or not conversation_id:
        return {"status": "error", "message": "company_id and conversation_id are required"}

    target_role = input_data.target_role.strip().lower()
    target_label = HUMAN_ESCALATION_ROLES.get(target_role)
    if not target_label:
        return {
            "status": "error",
            "target_role": target_role,
            "message": (
                f"الدور البشري '{input_data.target_role}' غير مسجل. "
                f"الأدوار المتاحة: {', '.join(sorted(HUMAN_ESCALATION_ROLES))}"
            ),
        }

    client = get_backend_client()
    try:
        result = await client.flag_conversation_for_human(
            company_id=company_id,
            conversation_id=conversation_id,
            reason=f"[{target_role}] {input_data.reason}"[:200],
        )
        logger.info(
            "escalate_to_human_flagged",
            company_id=company_id,
            conversation_id=conversation_id,
            target_role=target_role,
            reason=input_data.reason[:100],
        )
        return {
            "status": "success",
            "target_role": target_role,
            "target_label": target_label,
            "flagged": bool(result.get("flagged", True)),
            "message": (
                f"المحادثة اتعلّمت لـ{target_label} بمراجعة — قولي للشخص: "
                "«حد من فريقنا هيكلم حضرتك قريب»"
            ),
        }
    except Exception as exc:
        logger.error("escalate_to_human_failed", error=str(exc), target_role=target_role)
        return {"status": "error", "target_role": target_role, "message": f"تعذر وضع علامة المتابعة: {str(exc)[:150]}"}


escalate_to_human_tool = FunctionTool(
    name="escalate_to_human",
    description=(
        "Flag the current conversation for HUMAN teammate follow-up. Use ONLY when you cannot "
        "resolve the customer's request yourself: complaints or angry customers, refunds/payments, "
        "management approval the customer insists on, or any request outside your center's programs. "
        "Pass target_role from the registered human roles (default human_hr_manager). "
        "Do NOT use for normal questions you can answer. After flagging, tell the customer a teammate "
        "will follow up shortly."
    ),
    func=escalate_to_human,
    input_model=EscalateToHumanInput,
)

__all_tools__ = [escalate_to_human_tool]
