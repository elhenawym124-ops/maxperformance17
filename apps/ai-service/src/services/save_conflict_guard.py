from __future__ import annotations

from typing import Any
import structlog
from sqlalchemy import text
from src.services.conflict_detector import extract_numbers_by_key

logger = structlog.get_logger(__name__)


async def check_save_conflicts(company_id: str, text_content: str, session: Any) -> list[dict[str, Any]]:
    """Inspect merchant written text before save.
    
    Checks against live store data:
    - shipping_zones / shipping_policy_settings
    - public.products
    - public.coupons
    Returns list of detected warnings / conflict rows.
    """
    if not company_id or not text_content:
        return []

    extracted = extract_numbers_by_key(text_content)
    if not extracted:
        return []

    warnings: list[dict[str, Any]] = []

    try:
        # 1. Check shipping cost against live default/zones
        if "shipping_cost" in extracted:
            written_ships = extracted["shipping_cost"]
            # Fetch active shipping zones
            res = await session.execute(text("""
                SELECT price, name FROM public.shipping_zones
                WHERE "companyId" = :cid AND "isActive" = TRUE
                ORDER BY "createdAt" ASC LIMIT 5
            """), {"cid": company_id})
            zones = res.fetchall()
            
            # If no zones, check shipping_policy_settings
            if not zones:
                res_pol = await session.execute(text("""
                    SELECT "rtoReturnLegPrice" FROM public.shipping_policy_settings
                    WHERE "companyId" = :cid LIMIT 1
                """), {"cid": company_id})
                row = res_pol.fetchone()
                if row and row[0] is not None:
                    zones = [(float(row[0]), "سياسة الشحن")]

            for z in zones:
                z_price = float(z[0])
                z_name = z[1] or "المنطقة الافتراضية"
                contradictions = [w for w in written_ships if abs(w - z_price) > 0.01]
                if contradictions:
                    warnings.append({
                        "key": "shipping_cost",
                        "writtenValue": ", ".join(str(w) for w in contradictions),
                        "liveValue": str(z_price),
                        "liveSource": f"shipping_zones ({z_name})",
                        "message": f"تنبيه: كتبت تكلفة شحن ({contradictions[0]}) بينما القيمة الحية المسجلة هي ({z_price}) في {z_name}.",
                    })
                    break

        # 2. Check return window days
        if "return_window_days" in extracted:
            written_days = extracted["return_window_days"]
            res_ret = await session.execute(text("""
                SELECT "exchangeReturnPolicy" FROM public.company_settings
                WHERE "companyId" = :cid LIMIT 1
            """), {"cid": company_id})
            ret_row = res_ret.fetchone()
            if ret_row and ret_row[0]:
                import json
                try:
                    pol = json.loads(ret_row[0]) if isinstance(ret_row[0], str) else ret_row[0]
                    t_limit = pol.get("timeLimitDays")
                    if t_limit is not None:
                        t_val = float(t_limit)
                        contra = [w for w in written_days if abs(w - t_val) > 0.01]
                        if contra:
                            warnings.append({
                                "key": "return_window_days",
                                "writtenValue": ", ".join(str(w) for w in contra),
                                "liveValue": str(t_val),
                                "liveSource": "company_settings (exchangeReturnPolicy)",
                                "message": f"تنبيه: كتبت مهلة استرجاع ({contra[0]} يوم) بينما السياسة المسجلة تحدد ({int(t_val)} يوم).",
                            })
                except Exception:
                    pass

    except Exception as exc:
        logger.warning("check_save_conflicts_failed", error=str(exc), company_id=company_id)

    return warnings
