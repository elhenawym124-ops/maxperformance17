from __future__ import annotations

import re
import uuid
from typing import Any
import structlog
from sqlalchemy import text

logger = structlog.get_logger(__name__)

ARABIC_INDIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

# Deterministic patterns for written text extraction
PRICE_PATTERNS = [
    re.compile(r"(?:سعر|سعره|بـ|ب|بقيمة|تكلفة|تكلفته|ثمن)\s*[:=]?\s*([٠-٩0-9]+(?:\.[٠-٩0-9]+)?)\s*(?:ج|جنيه|جنية|egp|le)?", re.IGNORECASE),
    re.compile(r"([٠-٩0-9]+(?:\.[٠-٩0-9]+)?)\s*(?:ج|جنيه|جنية|egp|le)", re.IGNORECASE),
]

SHIPPING_PATTERNS = [
    re.compile(r"(?:شحن|الشحن|توصيل|التوصيل|مصاريف الشحن)\s*[:=]?\s*([٠-٩0-9]+(?:\.[٠-٩0-9]+)?)\s*(?:ج|جنيه|جنية|egp|le)?", re.IGNORECASE),
    re.compile(r"(?:شحن|الشحن)\s*(?:بـ|ب)\s*([٠-٩0-9]+(?:\.[٠-٩0-9]+)?)", re.IGNORECASE),
]

RETURN_PATTERNS = [
    re.compile(r"(?:استرجاع|استبدال|مرتجع|الاسترجاع|الاستبدال|مهلة الاسترجاع|فترة الاسترجاع)\s*[:=]?\s*(?:خلال|في خلال|لمدة)?\s*([٠-٩0-9]+)\s*(?:يوم|أيام|ايام|days)", re.IGNORECASE),
    re.compile(r"([٠-٩0-9]+)\s*(?:يوم|أيام|ايام)\s*(?:للاسترجاع|للاستبدال|استرجاع|استبدال)", re.IGNORECASE),
]

DISCOUNT_PATTERNS = [
    re.compile(r"(?:خصم|تخفيض)\s*[:=]?\s*([٠-٩0-9]+(?:\.[٠-٩0-9]+)?)\s*(?:%|٪|بالمية|في المية|بالمئة)", re.IGNORECASE),
    re.compile(r"([٠-٩0-9]+(?:\.[٠-٩0-9]+)?)\s*(?:%|٪)\s*(?:خصم|تخفيض)?", re.IGNORECASE),
]

# Any percentage token; contextualised with DISCOUNT_CUES at extraction time.
DISCOUNT_PERCENT_RE = re.compile(r"([٠-٩0-9]+(?:\.[٠-٩0-9]+)?)\s*(?:%|٪|بالمية|في المية|بالمئة)", re.IGNORECASE)
DISCOUNT_CUES = re.compile(r"خصم|تخفيض|كوبون|كود\s*خصم|برومو|promo|coupon|discount", re.IGNORECASE)

MIN_ORDER_PATTERNS = [
    re.compile(r"(?:حد أدنى|الحد الأدنى|اقل طلب|أقل طلب|حد ادنى)\s*[:=]?\s*([٠-٩0-9]+(?:\.[٠-٩0-9]+)?)\s*(?:ج|جنيه|جنية|egp)?", re.IGNORECASE),
]

STOCK_PATTERNS = [
    re.compile(r"(?:مخزون|المخزون|الكمية|متوفر|متاح)\s*[:=]?\s*([٠-٩0-9]+)\s*(?:قطعة|قطع)?", re.IGNORECASE),
]


def normalize_number_str(s: str) -> str:
    """Normalize Arabic-indic and standard digits to float string format."""
    s = s.translate(ARABIC_INDIC_DIGITS).strip()
    try:
        val = float(s)
        if val.is_integer():
            return str(int(val))
        return f"{val:.2f}".rstrip("0").rstrip(".")
    except Exception:
        return s


def extract_numbers_by_key(text_content: str) -> dict[str, list[float]]:
    """Extract deterministic numeric values from text for named business keys."""
    if not text_content:
        return {}
    
    extracted: dict[str, list[float]] = {
        "shipping_cost": [],
        "product_price": [],
        "return_window_days": [],
        "discount_pct": [],
        "min_order": [],
        "stock_qty": [],
    }

    # Normalize digits in text
    normalized_text = text_content.translate(ARABIC_INDIC_DIGITS)
    # Collapse letter-spaced digits ("7 0 %" -> "70 %") — real tenant rows store text
    # with a space between every character, which otherwise reads as "0 %".
    normalized_text = re.sub(r"(?<=[0-9٠-٩])[ \u00a0]{1,3}(?=[0-9٠-٩])", "", normalized_text)

    for pat in SHIPPING_PATTERNS:
        for m in pat.finditer(normalized_text):
            try:
                extracted["shipping_cost"].append(float(m.group(1)))
            except Exception:
                pass

    for pat in RETURN_PATTERNS:
        for m in pat.finditer(normalized_text):
            try:
                extracted["return_window_days"].append(float(m.group(1)))
            except Exception:
                pass

    # Discount percentages: a bare "N%" is NOT a discount unless a discount word
    # sits next to it ("20% من الميزانية" is budget advice, not a store discount).
    for m in DISCOUNT_PERCENT_RE.finditer(normalized_text):
        window = normalized_text[max(0, m.start() - 25):m.end() + 25]
        if not DISCOUNT_CUES.search(window):
            continue
        try:
            extracted["discount_pct"].append(float(m.group(1)))
        except Exception:
            pass

    for pat in MIN_ORDER_PATTERNS:
        for m in pat.finditer(normalized_text):
            try:
                extracted["min_order"].append(float(m.group(1)))
            except Exception:
                pass

    for pat in STOCK_PATTERNS:
        for m in pat.finditer(normalized_text):
            try:
                extracted["stock_qty"].append(float(m.group(1)))
            except Exception:
                pass

    # Extract price only if not already matched as shipping/min_order
    for pat in PRICE_PATTERNS:
        for m in pat.finditer(normalized_text):
            try:
                val = float(m.group(1))
                if val not in extracted["shipping_cost"] and val not in extracted["min_order"]:
                    extracted["product_price"].append(val)
            except Exception:
                pass

    return {k: v for k, v in extracted.items() if v}


def extract_live_values_from_tools(executed_tools: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Extract live transactional numbers from executed tools with source name.
    
    Returns:
        dict mapping conflict_key -> {
            "value": float,
            "display": str,
            "source": str,
        }
    """
    live: dict[str, dict[str, Any]] = {}

    for item in executed_tools:
        if item.get("status") not in ("success", "EXECUTED", None) and "result" not in item:
            continue
        tool_name = item.get("tool") or item.get("name") or ""
        res = item.get("result") or {}
        if not isinstance(res, dict):
            continue

        # 1. Shipping rates
        if tool_name in ("shipping_rates", "shipping_calculate", "shipping_zone_get"):
            price = res.get("price")
            if price is not None:
                try:
                    num_val = float(price)
                    live["shipping_cost"] = {
                        "value": num_val,
                        "display": str(price),
                        "source": res.get("_source_name") or "shipping_rates (shipping_zones)",
                    }
                except Exception:
                    pass

        # 2. Product search / get / pricing
        if tool_name in ("product_search", "product_get", "inventory_check"):
            # Check single product price or inventory price
            p_price = res.get("price")
            if isinstance(p_price, dict):
                amt = p_price.get("amount") or p_price.get("price")
                if amt is not None:
                    try:
                        live["product_price"] = {
                            "value": float(amt),
                            "display": str(amt),
                            "source": res.get("_source_name") or f"{tool_name} (public.products)",
                        }
                    except Exception:
                        pass
            elif p_price is not None:
                try:
                    live["product_price"] = {
                        "value": float(p_price),
                        "display": str(p_price),
                        "source": res.get("_source_name") or f"{tool_name} (public.products)",
                    }
                except Exception:
                    pass

            # Results list
            results = res.get("results") or res.get("products") or []
            if isinstance(results, list) and len(results) > 0:
                first = results[0]
                if isinstance(first, dict):
                    f_price = first.get("price")
                    if isinstance(f_price, (int, float, str)):
                        try:
                            live["product_price"] = {
                                "value": float(f_price),
                                "display": str(f_price),
                                "source": res.get("_source_name") or f"{tool_name} (public.products)",
                            }
                        except Exception:
                            pass
                    f_stock = first.get("stock")
                    if f_stock is not None:
                        try:
                            live["stock_qty"] = {
                                "value": float(f_stock),
                                "display": str(f_stock),
                                "source": res.get("_source_name") or f"{tool_name} (public.products)",
                            }
                        except Exception:
                            pass

            # Inventory stock
            stock = res.get("stock")
            if stock is not None:
                try:
                    live["stock_qty"] = {
                        "value": float(stock),
                        "display": str(stock),
                        "source": res.get("_source_name") or f"{tool_name} (public.products)",
                    }
                except Exception:
                    pass

        # 3. Coupons & Discounts
        if tool_name in ("coupon_validate", "discount_validate"):
            val = res.get("value") or res.get("discountAmount")
            dtype = res.get("type") or ""
            if val is not None:
                try:
                    n_val = float(val)
                    if "%" in str(dtype) or "PERCENT" in str(dtype).upper() or n_val <= 100:
                        live["discount_pct"] = {
                            "value": n_val,
                            "display": f"{val}%",
                            "source": res.get("_source_name") or "coupon_validate (public.coupons)",
                        }
                except Exception:
                    pass

        # 4. Orders
        if tool_name in ("order_lookup", "order_status", "order_get"):
            order_data = res.get("order") if isinstance(res.get("order"), dict) else res
            ship = order_data.get("shippingCost") or order_data.get("shipping")
            if ship is not None:
                try:
                    live["shipping_cost"] = {
                        "value": float(ship),
                        "display": str(ship),
                        "source": res.get("_source_name") or "order_lookup (public.orders)",
                    }
                except Exception:
                    pass

    return live


async def detect_and_record_conflicts(
    company_id: str,
    surface: str,
    source_row_id: str | None,
    written_text: str,
    live_values: dict[str, dict[str, Any]],
    conversation_id: str | None = None,
    session: Any = None,
) -> list[dict[str, Any]]:
    """Compares written text against live values purely with deterministic rule matching.
    
    Zero LLM usage.
    Returns list of detected conflict records.
    """
    if not company_id or not written_text or not live_values:
        return []

    extracted_written = extract_numbers_by_key(written_text)
    if not extracted_written:
        return []

    detected_conflicts: list[dict[str, Any]] = []

    for key, live_info in live_values.items():
        if key not in extracted_written:
            continue
        
        live_num = live_info["value"]
        written_nums = extracted_written[key]

        # Check if any written number contradicts live_num
        # Tolerance of 0.01 for floating precision
        contradictions = [w for w in written_nums if abs(w - live_num) > 0.01]
        if not contradictions:
            continue

        written_val_str = ", ".join(normalize_number_str(str(w)) for w in contradictions)
        live_val_str = normalize_number_str(str(live_info["display"]))
        live_source = str(live_info.get("source") or "tool_live_data")

        conflict_record = {
            "id": f"cfl_{uuid.uuid4().hex[:16]}",
            "company_id": company_id,
            "surface": surface,
            "source_row_id": source_row_id or "system",
            "conflict_key": key,
            "written_value": written_val_str,
            "live_value": live_val_str,
            "live_source": live_source,
            "conversation_id": conversation_id,
            "status": "OPEN",
        }
        detected_conflicts.append(conflict_record)

    if not detected_conflicts:
        return []

    # Persist idempotently into DB and send WhatsApp notification if new
    await _persist_conflicts_and_notify(company_id, detected_conflicts, session)

    return detected_conflicts


async def _persist_conflicts_and_notify(
    company_id: str,
    conflicts: list[dict[str, Any]],
    session: Any = None,
) -> None:
    """Idempotently insert conflicts into agent_data_conflicts.
    
    If conflict is newly inserted (not duplicate), dispatch WhatsApp notification once.
    """
    try:
        from src.db.session import async_session
        from src.tools.backend_client import get_backend_client

        async def _do_persist(sess: Any):
            newly_inserted = []
            for c in conflicts:
                # Check for existing OPEN conflict
                check_stmt = text("""
                    SELECT id FROM public.agent_data_conflicts
                    WHERE "companyId" = :cid
                      AND surface = :surface
                      AND "sourceRowId" = :src_id
                      AND "conflictKey" = :key
                      AND status = 'OPEN'
                    LIMIT 1
                """)
                existing = (await sess.execute(check_stmt, {
                    "cid": c["company_id"],
                    "surface": c["surface"],
                    "src_id": c["source_row_id"],
                    "key": c["conflict_key"],
                })).first()

                if existing:
                    logger.info("conflict_already_exists_open", conflict_key=c["conflict_key"], company_id=c["company_id"])
                    continue

                insert_stmt = text("""
                    INSERT INTO public.agent_data_conflicts
                    (id, "companyId", surface, "sourceRowId", "conflictKey", "writtenValue", "liveValue", "liveSource", "conversationId", status, "createdAt", "updatedAt")
                    VALUES
                    (:id, :cid, :surface, :src_id, :key, :w_val, :l_val, :l_src, :conv_id, :status, NOW(), NOW())
                    ON CONFLICT DO NOTHING
                """)
                res = await sess.execute(insert_stmt, {
                    "id": c["id"],
                    "cid": c["company_id"],
                    "surface": c["surface"],
                    "src_id": c["source_row_id"],
                    "key": c["conflict_key"],
                    "w_val": c["written_value"],
                    "l_val": c["live_value"],
                    "l_src": c["live_source"],
                    "conv_id": c["conversation_id"],
                    "status": "OPEN",
                })
                if res.rowcount and res.rowcount > 0:
                    newly_inserted.append(c)

            await sess.commit()

            # Dispatch notification for brand new conflicts only (once per conflict)
            if newly_inserted:
                await _notify_merchant_whatsapp(company_id, newly_inserted, sess)

        if session is not None:
            await _do_persist(session)
        elif async_session:
            async with async_session() as new_sess:
                await _do_persist(new_sess)

    except Exception as exc:
        logger.warning("persist_conflicts_failed", company_id=company_id, error=str(exc))


async def _notify_merchant_whatsapp(
    company_id: str,
    new_conflicts: list[dict[str, Any]],
    session: Any,
) -> None:
    """Send exactly one WhatsApp notification for newly discovered conflicts."""
    try:
        from src.tools.backend_client import get_backend_client

        # Fetch merchant phone from public.companies or public.users
        res = await session.execute(text("""
            SELECT phone FROM public.companies WHERE id = :cid LIMIT 1
        """), {"cid": company_id})
        row = res.first()
        phone = row[0] if row and row[0] else None

        if not phone:
            res_user = await session.execute(text("""
                SELECT phone FROM public.users WHERE "companyId" = :cid AND role IN ('OWNER', 'SUPER_ADMIN', 'COMPANY_ADMIN') AND phone IS NOT NULL LIMIT 1
            """), {"cid": company_id})
            user_row = res_user.first()
            phone = user_row[0] if user_row and user_row[0] else None

        if not phone:
            logger.info("no_merchant_phone_for_conflict_notification", company_id=company_id)
            return

        lines = [
            "⚠️ تنبيه تعارض بيانات الوكيل الذكي (MaxP):",
            f"تم رصد اختلاف بين ما هو مكتوب في المهارات/التعليمات وبين البيانات الحيّة على متجرك:",
        ]
        for c in new_conflicts:
            lines.append(f"• البند ({c['conflict_key']}): المكتوب ({c['written_value']}) مقابل الحيّ ({c['live_value']}) من {c['live_source']}.")

        lines.append("تم اعتماد الرقم الحيّ تلقائياً في رد الوكيل للعميل. يمكنك حسم التعارض من لوحة التحكم > مهارات الوكيل.")
        msg = "\n".join(lines)

        client = get_backend_client()
        await client.send_whatsapp_message(company_id, phone, msg)
        logger.info("conflict_whatsapp_notification_sent", company_id=company_id, phone=phone, count=len(new_conflicts))
    except Exception as exc:
        logger.warning("conflict_whatsapp_notification_failed", company_id=company_id, error=str(exc))
