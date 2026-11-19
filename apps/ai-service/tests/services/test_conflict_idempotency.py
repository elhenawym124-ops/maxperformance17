import pytest
from unittest.mock import AsyncMock, MagicMock
from src.services.conflict_detector import _persist_conflicts_and_notify


@pytest.mark.asyncio
async def test_conflict_persistence_idempotency_and_single_notification():
    """Verify that asking the same question 3 times results in exactly 1 persisted row

    and exactly 1 WhatsApp notification.
    """
    conflict_payload = [{
        "id": "cfl_test_001",
        "company_id": "cmu5iix000aa6juwmmqcrls8i",
        "surface": "skill",
        "source_row_id": "skill_shipping_01",
        "conflict_key": "shipping_cost",
        "written_value": "50",
        "live_value": "30",
        "live_source": "shipping_zones (red line)",
        "conversation_id": "conv_idempotent_1",
        "status": "OPEN",
    }]

    mock_session = AsyncMock()
    mock_notify = AsyncMock()

    # Call 1: Conflict does not exist in DB yet
    mock_session.execute.side_effect = [
        MagicMock(first=lambda: None),  # check_stmt -> not found
        MagicMock(rowcount=1),          # insert_stmt -> 1 inserted
    ]

    import src.services.conflict_detector as cd_module
    old_notify = cd_module._notify_merchant_whatsapp
    cd_module._notify_merchant_whatsapp = mock_notify

    try:
        # First execution -> inserts and notifies
        await _persist_conflicts_and_notify("cmu5iix000aa6juwmmqcrls8i", conflict_payload, session=mock_session)
        assert mock_notify.call_count == 1

        # Second execution (same conflict already OPEN in DB)
        mock_session.execute.side_effect = [
            MagicMock(first=lambda: ("existing_cfl_id",)),  # check_stmt -> already found!
        ]
        await _persist_conflicts_and_notify("cmu5iix000aa6juwmmqcrls8i", conflict_payload, session=mock_session)
        # Notification count should remain 1 (no duplicate notification)
        assert mock_notify.call_count == 1

        # Third execution
        mock_session.execute.side_effect = [
            MagicMock(first=lambda: ("existing_cfl_id",)),
        ]
        await _persist_conflicts_and_notify("cmu5iix000aa6juwmmqcrls8i", conflict_payload, session=mock_session)
        assert mock_notify.call_count == 1

    finally:
        cd_module._notify_merchant_whatsapp = old_notify
