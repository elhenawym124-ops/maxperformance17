import pytest
from unittest.mock import AsyncMock, MagicMock
from src.services.conflict_detector import (
    extract_numbers_by_key,
    extract_live_values_from_tools,
    detect_and_record_conflicts,
    normalize_number_str,
)
from src.services.single_number_enforcer import enforce_single_authoritative_number


def test_extract_numbers_by_key_shipping_and_price():
    arabic_text = "الشحن ٥٠ جنيه، وتكلفة الشحن للإسكندرية 50 ج، وسعر القطعة 250 ج"
    extracted = extract_numbers_by_key(arabic_text)
    
    assert "shipping_cost" in extracted
    assert 50.0 in extracted["shipping_cost"]
    assert "product_price" in extracted
    assert 250.0 in extracted["product_price"]


def test_extract_live_values_from_tools():
    mock_executed = [
        {
            "tool": "shipping_rates",
            "status": "success",
            "result": {
                "found": True,
                "price": "30",
                "deliveryTime": "2-3 أيام",
                "_source_name": "shipping_zones (الإسكندرية)",
            },
        },
        {
            "tool": "product_search",
            "status": "success",
            "result": {
                "results": [
                    {"name": "قميص", "price": 200.0, "stock": 15}
                ],
                "_source_name": "product_search (public.products)",
            },
        },
    ]

    live_map = extract_live_values_from_tools(mock_executed)
    assert "shipping_cost" in live_map
    assert live_map["shipping_cost"]["value"] == 30.0
    assert live_map["shipping_cost"]["display"] == "30"
    assert "shipping_zones" in live_map["shipping_cost"]["source"]

    assert "product_price" in live_map
    assert live_map["product_price"]["value"] == 200.0
    assert "stock_qty" in live_map
    assert live_map["stock_qty"]["value"] == 15.0


@pytest.mark.asyncio
async def test_conflict_detector_identifies_discrepancy(monkeypatch):
    written_skill = "مصاريف الشحن 50 ج لجميع المحافظات واسترجاع خلال 14 يوم"
    live_values = {
        "shipping_cost": {
            "value": 30.0,
            "display": "30",
            "source": "shipping_zones (القاهرة)",
        }
    }

    mock_persist = AsyncMock()
    monkeypatch.setattr("src.services.conflict_detector._persist_conflicts_and_notify", mock_persist)

    conflicts = await detect_and_record_conflicts(
        company_id="cmu5iix000aa6juwmmqcrls8i",
        surface="skill",
        source_row_id="skill_shipping_01",
        written_text=written_skill,
        live_values=live_values,
        conversation_id="conv_test_123",
        session=None,
    )

    assert len(conflicts) == 1
    c = conflicts[0]
    assert c["conflict_key"] == "shipping_cost"
    assert c["written_value"] == "50"
    assert c["live_value"] == "30"
    assert c["status"] == "OPEN"
    mock_persist.assert_awaited_once()


def test_zero_false_positives_when_values_match():
    written_text = "الشحن 30 ج والتوصيل سريع"
    live_values = {
        "shipping_cost": {
            "value": 30.0,
            "display": "30",
            "source": "shipping_zones",
        }
    }
    extracted = extract_numbers_by_key(written_text)
    assert 30.0 in extracted["shipping_cost"]
    # Same value => zero contradiction
    contradictions = [w for w in extracted["shipping_cost"] if abs(w - live_values["shipping_cost"]["value"]) > 0.01]
    assert len(contradictions) == 0


def test_enforce_single_authoritative_number_cleans_composite_reply():
    reply_with_conflict = "تكلفة الشحن 50 أو 30 جنيه يا فندم"
    live_map = {
        "shipping_cost": {
            "value": 30.0,
            "display": "30",
            "source": "shipping_zones",
        }
    }
    cleaned = enforce_single_authoritative_number(reply_with_conflict, live_map)
    assert "الشحن 30 ج" in cleaned
    assert "50 أو 30" not in cleaned


def test_letter_spaced_digits_do_not_become_zero_percent():
    """Production rows store text as "خ ص ص 7 0 %" — must read 70, never 0."""
    spaced = "خ ص ص   7 0 % +  م ن   ا ل م ي ز ا ن ي ة"
    extracted = extract_numbers_by_key(spaced)
    # No discount cue next to the number => nothing extracted at all
    assert not extracted.get("discount_pct")


def test_budget_percentage_is_not_a_discount():
    """'20% من الميزانية' is budget advice, not a store discount."""
    text = "ارفع الميزانية بنسبة 20% كل 48 ساعة وخصص 70% من الميزانية"
    extracted = extract_numbers_by_key(text)
    assert not extracted.get("discount_pct")

    with_cue = "خصم 20% على كل الأوردرات"
    assert 20.0 in extract_numbers_by_key(with_cue)["discount_pct"]
