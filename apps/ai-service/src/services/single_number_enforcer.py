from __future__ import annotations

import re
from typing import Any
import structlog

logger = structlog.get_logger(__name__)

ARABIC_INDIC_DIGITS = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")

# Pattern detecting dual/conflicting numbers mentioned in reply for shipping, e.g. "الشحن 50 أو 30" or "50 ج وبـ 30"
DUAL_SHIPPING_PATTERN = re.compile(
    r"(?:شحن|الشحن|توصيل|التوصيل)\s*[:=]?\s*([٠-٩0-9]+(?:\.[٠-٩0-9]+)?)\s*(?:ج|جنيه|جنية|egp)?\s*(?:أو|او|أم|ام|بدل|عوضاً عن|وليس|مش)\s*([٠-٩0-9]+(?:\.[٠-٩0-9]+)?)\s*(?:ج|جنيه|جنية|egp)?",
    re.IGNORECASE
)

DUAL_PRICE_PATTERN = re.compile(
    r"(?:سعر|سعره|بـ|ب)\s*([٠-٩0-9]+(?:\.[٠-٩0-9]+)?)\s*(?:ج|جنيه|جنية)?\s*(?:أو|او|أم|ام|بدل|مش)\s*([٠-٩0-9]+(?:\.[٠-٩0-9]+)?)\s*(?:ج|جنيه|جنية)?",
    re.IGNORECASE
)


def enforce_single_authoritative_number(reply: str, live_values: dict[str, dict[str, Any]]) -> str:
    """Enforce requirement 8: Customer receives exactly ONE authoritative number.
    
    If the text accidentally quotes multiple conflicting numbers or a composite number
    for a transaction item (like shipping or price), replace it with the live tool value.
    """
    if not reply or not live_values:
        return reply

    sanitized = reply

    # 1. Enforce live shipping cost if tool ran
    if "shipping_cost" in live_values:
        live_ship = str(live_values["shipping_cost"]["display"])
        # Check if reply has dual shipping numbers
        match = DUAL_SHIPPING_PATTERN.search(sanitized)
        if match:
            # Replace dual shipping with the single live value
            span = match.span()
            clean_sub = f"الشحن {live_ship} ج"
            sanitized = sanitized[:span[0]] + clean_sub + sanitized[span[1]:]

    # 2. Enforce live product price if tool ran
    if "product_price" in live_values:
        live_price = str(live_values["product_price"]["display"])
        match_p = DUAL_PRICE_PATTERN.search(sanitized)
        if match_p:
            span_p = match_p.span()
            clean_p = f"السعر {live_price} ج"
            sanitized = sanitized[:span_p[0]] + clean_p + sanitized[span_p[1]:]

    return sanitized
