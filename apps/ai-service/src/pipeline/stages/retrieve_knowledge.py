from __future__ import annotations

import logging

from src.pipeline.context import DISABLE_EXTERNAL_EMBEDDING_RETRIEVAL, PipelineContext
from src.rag.knowledge_evidence import get_knowledge_evidence


logger = logging.getLogger(__name__)

EMBEDDING_FREE_SOURCE_ORDER = ["FAQ_DB", "POLICY_DB", "PRODUCT_DB"]

NO_KNOWLEDGE_SENTINEL = "No specific internal knowledge found for this query."


async def retrieve_knowledge(ctx: PipelineContext) -> PipelineContext:
    """Inject the company's stored knowledge (FAQ / policies / embeddings) into
    the prompt as <company_knowledge>.

    Runs before the skills pipeline so the merchant's answered knowledge
    questions actually reach the system prompt instead of being reachable only
    through an optional `knowledge_search` tool call.
    Retrieval failures must never break the conversation — the turn simply
    continues without knowledge evidence.
    """
    if not ctx.session or not (ctx.message or "").strip():
        return ctx

    options = None
    if (ctx.external_memory_context or {}).get(DISABLE_EXTERNAL_EMBEDDING_RETRIEVAL):
        options = {
            "disableVectorStore": True,
            "sourceOrder": EMBEDDING_FREE_SOURCE_ORDER,
        }

    try:
        evidence = await get_knowledge_evidence(
            session=ctx.session,
            company_id=ctx.company_id,
            message=ctx.message,
            options=options,
        )
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning("retrieve_knowledge.failed", error=str(exc))
        return ctx

    # A miss returns a sentinel sentence; injecting it only adds prompt noise.
    if not evidence or evidence.strip() == NO_KNOWLEDGE_SENTINEL:
        return ctx

    # SOTA 2026: store RAG evidence in ctx.rag_evidence (not ctx.tool_context)
    # This keeps tool execution context separate from RAG context
    ctx.rag_evidence = evidence if not ctx.rag_evidence else f"{ctx.rag_evidence}\n{evidence}"

    return ctx
