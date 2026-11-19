from __future__ import annotations

from datetime import datetime
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text

from src.db.session import SessionDep

router = APIRouter(prefix="/admin/conflicts", tags=["admin-conflicts"])


class ResolveConflictRequest(BaseModel):
    decision: str  # "CORRECT_WRITTEN" | "DATA_IS_RIGHT" | "IGNORE"
    notes: str | None = None
    corrected_value: str | None = None


@router.get("")
async def list_conflicts(
    session: SessionDep,
    company_id: str = Query(..., description="Company ID"),
    status: str = Query("OPEN", description="Filter by status (OPEN, RESOLVED_CORRECTED, RESOLVED_DATA_CONFIRMED, all)"),
) -> dict[str, Any]:
    """List agent data conflicts for a company."""
    if not company_id:
        raise HTTPException(status_code=400, detail="company_id is required")

    params: dict[str, Any] = {"cid": company_id}
    status_filter = ""
    if status and status.upper() != "ALL":
        status_filter = 'AND status = :status'
        params["status"] = status.upper()

    query = f"""
        SELECT id, "companyId", surface, "sourceRowId", "conflictKey",
               "writtenValue", "liveValue", "liveSource", "conversationId",
               status, "resolvedBy", "resolvedAt", "resolutionNotes", "createdAt", "updatedAt"
        FROM public.agent_data_conflicts
        WHERE "companyId" = :cid {status_filter}
        ORDER BY "createdAt" DESC
    """
    rows = (await session.execute(text(query), params)).mappings().all()

    conflicts = [
        {
            "id": r["id"],
            "companyId": r["companyId"],
            "surface": r["surface"],
            "sourceRowId": r["sourceRowId"],
            "conflictKey": r["conflictKey"],
            "writtenValue": r["writtenValue"],
            "liveValue": r["liveValue"],
            "liveSource": r["liveSource"],
            "conversationId": r["conversationId"],
            "status": r["status"],
            "resolvedBy": r["resolvedBy"],
            "resolvedAt": r["resolvedAt"].isoformat() if r["resolvedAt"] else None,
            "resolutionNotes": r["resolutionNotes"],
            "createdAt": r["createdAt"].isoformat() if r["createdAt"] else None,
            "updatedAt": r["updatedAt"].isoformat() if r["updatedAt"] else None,
        }
        for r in rows
    ]

    return {
        "success": True,
        "conflicts": conflicts,
        "count": len(conflicts),
        "openCount": sum(1 for c in conflicts if c["status"] == "OPEN"),
    }


@router.post("/{conflict_id}/resolve")
async def resolve_conflict(
    conflict_id: str,
    body: ResolveConflictRequest,
    session: SessionDep,
    company_id: str = Query(..., description="Company ID"),
    resolved_by: str = Query("merchant", description="User or role resolving"),
) -> dict[str, Any]:
    """Resolve a data conflict with merchant decision:
    - "CORRECT_WRITTEN": Update the written skill/prompt to match the live value (or provided corrected value).
    - "DATA_IS_RIGHT": Confirm live data is authoritative without modifying source, closes conflict.
    """
    row = (await session.execute(text("""
        SELECT * FROM public.agent_data_conflicts
        WHERE id = :id AND "companyId" = :cid
        LIMIT 1
    """), {"id": conflict_id, "cid": company_id})).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="Conflict record not found")

    new_status = "RESOLVED_DATA_CONFIRMED"
    if body.decision == "CORRECT_WRITTEN":
        new_status = "RESOLVED_CORRECTED"
        target_value = body.corrected_value or row["liveValue"]
        
        # If conflict originated from a company_skill, update the written instructions
        if row["surface"] == "skill" and row["sourceRowId"]:
            try:
                # Update company_skills in public schema
                await session.execute(text("""
                    UPDATE public.company_skills
                    SET instructions = regexp_replace(instructions, :w_val, :t_val, 'g'),
                        "updatedAt" = NOW()
                    WHERE "companyId" = :cid AND (id = :src_id OR name = :src_id)
                """), {
                    "cid": company_id,
                    "src_id": row["sourceRowId"],
                    "w_val": row["writtenValue"],
                    "t_val": target_value,
                })
                # Invalidate tenant skills cache
                from src.skills.integration import invalidate_skill_caches
                invalidate_skill_caches()
            except Exception as e:
                pass

    elif body.decision == "IGNORE":
        new_status = "RESOLVED_IGNORED"

    await session.execute(text("""
        UPDATE public.agent_data_conflicts
        SET status = :status,
            "resolvedBy" = :by,
            "resolvedAt" = NOW(),
            "resolutionNotes" = :notes,
            "updatedAt" = NOW()
        WHERE id = :id AND "companyId" = :cid
    """), {
        "id": conflict_id,
        "cid": company_id,
        "status": new_status,
        "by": resolved_by,
        "notes": body.notes or body.decision,
    })
    await session.commit()

    return {
        "success": True,
        "conflictId": conflict_id,
        "status": new_status,
        "decision": body.decision,
    }
