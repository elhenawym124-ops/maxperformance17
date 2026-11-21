from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any
import unittest
from unittest.mock import AsyncMock, MagicMock, patch

from src.workers.scheduler_worker import compute_next_run_at, tick_scheduler
from src.services.daily_report_service import DailyReportService, CAIRO_TZ


class MockDbResult:
    def __init__(self, data: list[dict[str, Any]] | None = None, scalar_val: Any = None):
        self._data = data or []
        self._scalar = scalar_val

    def scalar_one_or_none(self):
        return self._scalar

    def scalar(self):
        return self._scalar

    def mappings(self):
        return self

    def first(self):
        return self._data[0] if self._data else None

    def all(self):
        return self._data


class TestSchedulerWorker(unittest.IsolatedAsyncioTestCase):
    async def test_tick_scheduler_claims_and_enqueues(self):
        """Scheduler pass claims due schedules and enqueues them with deterministic dedupe_key."""
        now = datetime.now(timezone.utc)
        mock_schedule = {
            "id": "sched_1",
            "companyId": "comp_100",
            "agentId": "agent_200",
            "taskType": "SHIPPING",
            "intervalMinutes": 30,
            "nextRunAt": now,
            "lastRunAt": now,
            "context": {"priority": "high"},
        }

        mock_session = AsyncMock()
        mock_session.execute.return_value = MockDbResult([mock_schedule])

        with patch("src.workers.scheduler_worker._ensure_session", AsyncMock(return_value=mock_session)):
            with patch("src.workers.scheduler_worker.queue_service.enqueue", AsyncMock(return_value="job_123")) as mock_enqueue:
                enqueued = await tick_scheduler()

                self.assertEqual(len(enqueued), 1)
                self.assertEqual(enqueued[0], "sched_1")
                mock_enqueue.assert_awaited_once()
                call_kwargs = mock_enqueue.await_args.kwargs
                self.assertEqual(call_kwargs["queue_name"], "agent-tasks")
                self.assertEqual(call_kwargs["task_type"], "agent.scheduled_task")
                self.assertEqual(call_kwargs["company_id"], "comp_100")
                self.assertEqual(call_kwargs["agent_id"], "agent_200")
                self.assertTrue(call_kwargs["dedupe_key"].startswith("agent:comp_100:agent_200:sched_1:"))

    async def test_tick_scheduler_empty_when_no_due_jobs(self):
        """When no schedules are due, tick_scheduler returns empty list without calling enqueue."""
        mock_session = AsyncMock()
        mock_session.execute.return_value = MockDbResult([])

        with patch("src.workers.scheduler_worker._ensure_session", AsyncMock(return_value=mock_session)):
            with patch("src.workers.scheduler_worker.queue_service.enqueue", AsyncMock()) as mock_enqueue:
                enqueued = await tick_scheduler()
                self.assertEqual(len(enqueued), 0)
                mock_enqueue.assert_not_awaited()

    async def test_compute_next_run_at_daily_future(self):
        """Daily schedule targeting 14:00 Cairo when now is 10:00 Cairo targets today at 14:00."""
        now_utc = datetime(2026, 11, 21, 8, 0, 0, tzinfo=timezone.utc)
        next_run = compute_next_run_at(schedule_type="DAILY", target_time="14:00", tz_offset_hours=2, from_dt=now_utc)
        expected_utc = datetime(2026, 11, 21, 12, 0, 0, tzinfo=timezone.utc)
        self.assertEqual(next_run, expected_utc)

    async def test_compute_next_run_at_daily_past(self):
        """Daily schedule targeting 14:00 Cairo when now is 16:00 Cairo targets tomorrow at 14:00."""
        now_utc = datetime(2026, 11, 21, 14, 0, 0, tzinfo=timezone.utc)
        next_run = compute_next_run_at(schedule_type="DAILY", target_time="14:00", tz_offset_hours=2, from_dt=now_utc)
        expected_utc = datetime(2026, 11, 22, 12, 0, 0, tzinfo=timezone.utc)
        self.assertEqual(next_run, expected_utc)

    async def test_compute_next_run_at_interval(self):
        """Interval schedule adds interval_minutes to from_dt."""
        now_utc = datetime(2026, 11, 21, 10, 0, 0, tzinfo=timezone.utc)
        next_run = compute_next_run_at(schedule_type="INTERVAL", interval_minutes=45, from_dt=now_utc)
        expected_utc = datetime(2026, 11, 21, 10, 45, 0, tzinfo=timezone.utc)
        self.assertEqual(next_run, expected_utc)

    async def test_handle_scheduled_agent_task_tenant_isolation(self):
        """handle_scheduled_agent_task must fail closed (tenant_mismatch) if agent not owned by company."""
        from src.workers.agent_worker import handle_scheduled_agent_task

        job = {
            "id": "job_999",
            "type": "agent.scheduled_task",
            "payload": {
                "company_id": "company_A",
                "agent_id": "agent_owned_by_company_B",
                "task_id": "task_custom_1",
                "type": "SHIPPING",
            },
        }

        mock_session = AsyncMock()
        mock_repo = MagicMock()
        mock_repo.return_value.get_agent = AsyncMock(return_value=None)

        fake_logger = MagicMock()

        with patch("src.workers.agent_worker.async_session", return_value=mock_session), \
             patch("src.workers.agent_worker.AgentRepository", mock_repo), \
             patch("src.workers.agent_worker.logger", fake_logger):

            await handle_scheduled_agent_task(job)

            fake_logger.warning.assert_called_with(
                "tenant_mismatch",
                agent_id="agent_owned_by_company_B",
                company_id="company_A",
                job_id="job_999",
            )

    async def test_daily_briefing_idempotency(self):
        """DailyReportService prevents duplicate execution if already sent today."""
        from src.services.daily_report_service import _SENT_REPORTS
        _SENT_REPORTS.clear()

        mock_session = AsyncMock()
        mock_session.__aenter__.return_value = mock_session
        mock_session.execute = AsyncMock(return_value=MockDbResult([], scalar_val="existing_outbox_id"))

        with patch.object(DailyReportService, "_get_session", AsyncMock(return_value=mock_session)):
            res = await DailyReportService.run_daily_briefing(
                company_id="comp_redline",
                schedule_id="sched_daily_1",
            )
            self.assertTrue(res.get("success"))
            self.assertEqual(res.get("status"), "SKIPPED_ALREADY_SENT")

    async def test_daily_briefing_data_not_ready_guard(self):
        """DailyReportService skips run if database data has anomalies or errors."""
        from src.services.daily_report_service import _SENT_REPORTS
        _SENT_REPORTS.clear()

        mock_session = AsyncMock()
        mock_session.__aenter__.return_value = mock_session
        mock_session.execute = AsyncMock(side_effect=[
            MockDbResult([], scalar_val=None),
            MockDbResult([{"id": "comp_redline_2", "name": "RedLine Test Store"}]),
            MockDbResult([{"total_orders": -1, "gross_sales": -100}]),
            MockDbResult([]),
            MockDbResult([]),
            MockDbResult([]),
        ])

        with patch.object(DailyReportService, "_get_session", AsyncMock(return_value=mock_session)):
            res = await DailyReportService.run_daily_briefing(
                company_id="comp_redline_2",
                schedule_id="sched_daily_2",
            )
            self.assertFalse(res.get("success"))
            self.assertEqual(res.get("status"), "SKIPPED_DATA_NOT_READY")

    async def test_daily_briefing_failure_alert(self):
        """When an exception occurs during execution, failure is logged and alert dispatched."""
        from src.services.daily_report_service import _SENT_REPORTS
        _SENT_REPORTS.clear()

        mock_session = AsyncMock()
        mock_session.__aenter__.return_value = mock_session
        mock_session.execute = AsyncMock(side_effect=RuntimeError("Postgres connection timeout"))

        with patch.object(DailyReportService, "_get_session", AsyncMock(return_value=mock_session)):
            res = await DailyReportService.run_daily_briefing(
                company_id="comp_redline_3",
                schedule_id="sched_daily_3",
            )
            self.assertFalse(res.get("success"))
            self.assertEqual(res.get("status"), "FAILED")
            self.assertIn("Postgres connection timeout", res.get("error", ""))


if __name__ == "__main__":
    unittest.main()
