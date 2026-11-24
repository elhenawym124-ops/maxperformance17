from __future__ import annotations

import asyncio
import sys
import unittest
from unittest.mock import AsyncMock, MagicMock

# Mock sqlalchemy and agent_framework if not installed in local host python
if "sqlalchemy" not in sys.modules:
    mock_sa = MagicMock()
    mock_sa.text = lambda s: s
    sys.modules["sqlalchemy"] = mock_sa
    mock_ext = MagicMock()
    sys.modules["sqlalchemy.ext"] = mock_ext
    mock_asyncio = MagicMock()
    sys.modules["sqlalchemy.ext.asyncio"] = mock_asyncio
    mock_pool = MagicMock()
    sys.modules["sqlalchemy.pool"] = mock_pool
    mock_orm = MagicMock()
    sys.modules["sqlalchemy.orm"] = mock_orm

if "agent_framework" not in sys.modules:
    mock_af = MagicMock()
    mock_af.FunctionTool = MagicMock
    sys.modules["agent_framework"] = mock_af

if "fastapi" not in sys.modules:
    mock_fastapi = MagicMock()
    sys.modules["fastapi"] = mock_fastapi

if "pydantic_settings" not in sys.modules:
    mock_ps = MagicMock()
    mock_ps.BaseSettings = MagicMock
    mock_ps.SettingsConfigDict = dict
    sys.modules["pydantic_settings"] = mock_ps

from src.tools.repositories.order_repository import OrderRepository


class _MockRow:
    def __init__(self, mapping: dict):
        self._mapping = mapping
        for k, v in mapping.items():
            setattr(self, k, v)


class _MockResult:
    def __init__(self, rows: list):
        self._rows = rows

    def first(self):
        return self._rows[0] if self._rows else None

    def mappings(self):
        return self

    def __iter__(self):
        return iter(self._rows)


class TestIncompleteOrdersReporting(unittest.TestCase):

    def setUp(self):
        self.session = MagicMock()

    def test_order_summary_includes_incomplete_carts(self):
        async def run_test():
            async def mock_execute(sql, params):
                sql_str = str(sql)
                if "COALESCE(SUM(total) FILTER" in sql_str:
                    return _MockResult([_MockRow({
                        "total_orders": 10,
                        "paid_revenue": 5000.0,
                        "paid_count": 8,
                        "avg_value": 625.0
                    })])
                elif "SELECT status, COUNT(*)::int AS cnt" in sql_str:
                    return _MockResult([
                        _MockRow({"status": "DELIVERED", "cnt": 8}),
                        _MockRow({"status": "CANCELLED", "cnt": 2}),
                    ])
                elif "FROM guest_carts" in sql_str:
                    return _MockResult([_MockRow({
                        "cnt": 5,
                        "val": 2250.0
                    })])
                return _MockResult([])

            self.session.execute = AsyncMock(side_effect=mock_execute)
            repo = OrderRepository(self.session)
            res = await repo.get_order_summary("comp_123", "today")

            # Verify backward compatibility
            self.assertEqual(res["totalOrders"], 10)
            self.assertEqual(res["paidOrdersCount"], 8)
            self.assertEqual(res["paidRevenue"], "5000.0")
            self.assertEqual(res["byStatus"]["delivered"], 8)
            self.assertEqual(res["byStatus"]["cancelled"], 2)

            # Verify new incomplete orders data
            self.assertEqual(res["incompleteOrdersCount"], 5)
            self.assertEqual(res["incompleteOrdersValue"], "2250.0")
            self.assertEqual(res["totalWithIncomplete"], 15)
            self.assertEqual(res["byStatus"]["incomplete"], 5)
            self.assertEqual(res["byStatus"]["متروك"], 5)

        asyncio.run(run_test())

    def test_order_summary_resilient_to_guest_cart_error(self):
        async def run_test():
            async def mock_execute(sql, params):
                sql_str = str(sql)
                if "COALESCE(SUM(total) FILTER" in sql_str:
                    return _MockResult([_MockRow({
                        "total_orders": 3,
                        "paid_revenue": 1500.0,
                        "paid_count": 3,
                        "avg_value": 500.0
                    })])
                elif "SELECT status, COUNT(*)::int AS cnt" in sql_str:
                    return _MockResult([_MockRow({"status": "DELIVERED", "cnt": 3})])
                elif "FROM guest_carts" in sql_str:
                    raise RuntimeError("DB connection error")
                return _MockResult([])

            self.session.execute = AsyncMock(side_effect=mock_execute)
            repo = OrderRepository(self.session)
            # Should NOT raise, but cleanly fall back to 0
            res = await repo.get_order_summary("comp_123", "today")
            self.assertEqual(res["totalOrders"], 3)
            self.assertEqual(res["incompleteOrdersCount"], 0)
            self.assertEqual(res["incompleteOrdersValue"], "0.0")
            self.assertEqual(res["totalWithIncomplete"], 3)

        asyncio.run(run_test())

    def test_get_recent_orders_status_incomplete(self):
        async def run_test():
            async def mock_execute(sql, params):
                sql_str = str(sql)
                if "FROM guest_carts" in sql_str:
                    if "COUNT(*)" in sql_str:
                        return _MockResult([_MockRow({"cnt": 1})])
                    return _MockResult([_MockRow({
                        "id": "cuid_cart_1",
                        "cartId": "cart_998877",
                        "total": 450.0,
                        "checkoutData": '{"fullName": "أحمد محمود", "phone": "01012345678", "city": "الرمل", "governorate": "الإسكندرية"}',
                        "date": "2026-11-24 10:00:00"
                    })])
                return _MockResult([])

            self.session.execute = AsyncMock(side_effect=mock_execute)
            repo = OrderRepository(self.session)
            orders = await repo.get_recent_orders("comp_123", limit=10, status="INCOMPLETE")

            self.assertEqual(len(orders), 1)
            first_cart = orders[0]
            self.assertEqual(first_cart["orderNumber"], "CART-998877")
            self.assertEqual(first_cart["customerName"], "أحمد محمود")
            self.assertEqual(first_cart["phone"], "01012345678")
            self.assertEqual(first_cart["status"], "INCOMPLETE")
            self.assertEqual(first_cart["total"], "450.0")
            self.assertEqual(first_cart["governorate"], "الإسكندرية")

        asyncio.run(run_test())

    def test_order_summary_tool_function(self):
        async def run_test():
            from src.tools.definitions.order import order_summary, OrderSummaryInput

            # Test with mock OrderRepository
            mock_repo = MagicMock()
            mock_repo.get_order_summary = AsyncMock(return_value={
                "period": "today",
                "totalOrders": 12,
                "paidRevenue": "6000",
                "paidOrdersCount": 10,
                "avgOrderValue": "600",
                "byStatus": {"delivered": 10, "incomplete": 4},
                "incompleteOrdersCount": 4,
                "incompleteOrdersValue": "1800.0",
                "totalWithIncomplete": 16
            })

            from unittest.mock import patch

            class _DummySessionContext:
                async def __aenter__(self):
                    return MagicMock()
                async def __aexit__(self, exc_type, exc, tb):
                    return False

            with patch("src.tools.definitions.order._db_mod.async_session", return_value=_DummySessionContext()):
                with patch("src.tools.definitions.order.OrderRepository", return_value=mock_repo):
                    res = await order_summary(OrderSummaryInput(company_id="comp_123", period="today"))
                    self.assertEqual(res["totalOrders"], 12)
                    self.assertEqual(res["incompleteOrdersCount"], 4)
                    self.assertEqual(res["totalWithIncomplete"], 16)
                    self.assertIn("4 سلة غير مكتملة", res["summary"])

        asyncio.run(run_test())


if __name__ == "__main__":
    unittest.main()
