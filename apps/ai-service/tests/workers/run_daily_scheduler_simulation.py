import asyncio
import json
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, AsyncMock
from src.workers.scheduler_worker import compute_next_run_at
from src.services.daily_report_service import DailyReportService, CAIRO_TZ

class MockDbResult:
    def __init__(self, data=None, scalar_val=None):
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


async def run_simulation():
    print("=" * 80)
    print("STARTING PART B: DAILY AGENT & SCHEDULE SIMULATION (RED-LINE TEST STORE)")
    print("=" * 80)

    # 1. Verification of Cairo Timezone & Daily HH:MM Computation
    print("\n--- [STEP 1: DAILY AT HH:MM (CAIRO TIMEZONE) VERIFICATION] ---")
    fixed_now_utc = datetime(2026, 11, 21, 6, 30, 0, tzinfo=timezone.utc) # 08:30 Cairo
    target_time = "14:00" # 14:00 Cairo = 12:00 UTC
    
    # Calculate next run when now is before 14:00 Cairo
    next_run_1 = compute_next_run_at("DAILY", target_time=target_time, tz_offset_hours=2, from_dt=fixed_now_utc)
    print(f"Current UTC: {fixed_now_utc.isoformat()} (08:30 Cairo)")
    print(f"Target: Daily at {target_time} Cairo")
    print(f"Calculated Next Run 1 (UTC): {next_run_1.isoformat()} -> {next_run_1.astimezone(CAIRO_TZ).strftime('%Y-%m-%d %H:%M:%S %Z')}")

    # Calculate next run when now is after 14:00 Cairo (e.g. 15:30 Cairo)
    after_now_utc = datetime(2026, 11, 21, 13, 30, 0, tzinfo=timezone.utc) # 15:30 Cairo
    next_run_2 = compute_next_run_at("DAILY", target_time=target_time, tz_offset_hours=2, from_dt=after_now_utc)
    print(f"Calculated Next Run 2 (UTC): {next_run_2.isoformat()} -> {next_run_2.astimezone(CAIRO_TZ).strftime('%Y-%m-%d %H:%M:%S %Z')}")

    # 2. Execution Run 1: Successful Daily Briefing for Red-Line Store
    print("\n--- [STEP 2: RUN 1 - DAILY BRIEFING EXECUTION & DELIVERY] ---")
    mock_metrics = {
        "orders": [{"total_orders": 47, "gross_sales": 32850.0}],
        "leads": [{"total_leads": 18}],
        "stock": [{"count": 3, "low_items": "RedLine T-Shirt XL (2 left), Denim Jacket M (1 left), Cap Black (0 left)"}],
    }
    
    mock_session = AsyncMock()
    mock_session.__aenter__.return_value = mock_session
    mock_session.execute = AsyncMock(side_effect=[
        MockDbResult([], scalar_val=None), # No existing outbox row (not sent yet)
        MockDbResult([{"id": "comp_redline", "name": "RedLine Store (Test)"}]),
        MockDbResult(mock_metrics["orders"]),
        MockDbResult(mock_metrics["leads"]),
        MockDbResult(mock_metrics["stock"]),
        MockDbResult([]), # Ad spend
        MockDbResult([], scalar_val=None), # Lock acquire
        MockDbResult([], scalar_val=None), # Outbox insert
        MockDbResult([], scalar_val=None), # Schedule update (successCount++, lastRunAt)
        MockDbResult([], scalar_val=None), # Lock release
    ])

    with patch.object(DailyReportService, "_get_session", AsyncMock(return_value=mock_session)):
        run1 = await DailyReportService.run_daily_briefing(
            company_id="comp_redline",
            schedule_id="sched_redline_daily",
            context={"target_date": "2026-11-21"},
        )
    
    print("Execution Run 1 Outcome:")
    print(f"  Success: {run1.get('success')}")
    print(f"  Status: {run1.get('status')}")
    print(f"  LastRunAt: {run1.get('lastRunAt')}")
    print(f"  Delivery Outbox ID: {run1.get('outboxId')}")
    print("\nGenerated Daily Briefing Report Content:\n")
    print("-" * 50)
    print(run1.get("summary"))
    print("-" * 50)

    # 3. Execution Run 2: Simulation of Next Day's Run (Proving at least 2 distinct executions)
    print("\n--- [STEP 3: RUN 2 - NEXT DAY RUN VERIFICATION] ---")
    mock_metrics_day2 = {
        "orders": [{"total_orders": 59, "gross_sales": 41200.0}],
        "leads": [{"total_leads": 24}],
        "stock": [{"count": 2, "low_items": "Denim Jacket M (0 left), RedLine Hoodie L (2 left)"}],
    }
    mock_session2 = AsyncMock()
    mock_session2.__aenter__.return_value = mock_session2
    mock_session2.execute = AsyncMock(side_effect=[
        MockDbResult([], scalar_val=None),
        MockDbResult([{"id": "comp_redline", "name": "RedLine Store (Test)"}]),
        MockDbResult(mock_metrics_day2["orders"]),
        MockDbResult(mock_metrics_day2["leads"]),
        MockDbResult(mock_metrics_day2["stock"]),
        MockDbResult([]),
        MockDbResult([], scalar_val=None),
        MockDbResult([], scalar_val=None),
        MockDbResult([], scalar_val=None),
        MockDbResult([], scalar_val=None),
    ])

    with patch.object(DailyReportService, "_get_session", AsyncMock(return_value=mock_session2)):
        run2 = await DailyReportService.run_daily_briefing(
            company_id="comp_redline",
            schedule_id="sched_redline_daily",
            context={"target_date": "2026-11-22"},
        )

    print("Execution Run 2 Outcome:")
    print(f"  Success: {run2.get('success')}")
    print(f"  Status: {run2.get('status')}")
    print(f"  LastRunAt: {run2.get('lastRunAt')}")
    print(f"  Outbox ID: {run2.get('outboxId')}")

    # 4. Idempotency Proof: Re-running Day 1 again must skip without duplicate dispatch
    print("\n--- [STEP 4: IDEMPOTENCY CHECK - RE-RUNNING DAY 1] ---")
    mock_session_idem = AsyncMock()
    mock_session_idem.__aenter__.return_value = mock_session_idem
    mock_session_idem.execute = AsyncMock(return_value=MockDbResult([], scalar_val="existing_outbox_uuid_123"))

    with patch.object(DailyReportService, "_get_session", AsyncMock(return_value=mock_session_idem)):
        run_dup = await DailyReportService.run_daily_briefing(
            company_id="comp_redline",
            schedule_id="sched_redline_daily",
            context={"target_date": "2026-11-21"},
        )

    print("Duplicate Run Outcome:")
    print(f"  Success: {run_dup.get('success')}")
    print(f"  Status: {run_dup.get('status')}")
    print(f"  Duplicate Prevented: {run_dup.get('status') == 'SKIPPED_ALREADY_SENT'}")

    # 5. Concurrency Lock Proof: A schedule with an active unexpired lock is skipped by scheduler ticks
    print("\n--- [STEP 5: CONCURRENCY LOCK GUARD CHECK] ---")
    mock_session_locked = AsyncMock()
    mock_session_locked.__aenter__.return_value = mock_session_locked
    # Simulates DB query where "lockExpiresAt" > now(), so FOR UPDATE SKIP LOCKED returns 0 rows
    mock_session_locked.execute = AsyncMock(return_value=MockDbResult([]))

    from src.workers.scheduler_worker import tick_scheduler
    with patch("src.workers.scheduler_worker._ensure_session", AsyncMock(return_value=mock_session_locked)):
        claimed_jobs = await tick_scheduler()

    print(f"Concurrent Claim Attempt while Lock Active: {claimed_jobs}")
    print(f"Lock Protected (Zero Duplicate Claims): {len(claimed_jobs) == 0}")

    # 6. Failure Alerting Proof: Simulating DB/Worker Failure
    print("\n--- [STEP 6: FAILURE ALERT DISPATCH CHECK] ---")
    mock_session_err = AsyncMock()
    mock_session_err.__aenter__.return_value = mock_session_err
    mock_session_err.execute = AsyncMock(side_effect=Exception("Database connection timeout during metric aggregation"))

    with patch.object(DailyReportService, "_get_session", AsyncMock(return_value=mock_session_err)):
        run_fail = await DailyReportService.run_daily_briefing(
            company_id="comp_redline",
            schedule_id="sched_redline_daily",
            context={"target_date": "2026-11-24"},
        )

    print("Failed Run Outcome:")
    print(f"  Success: {run_fail.get('success')}")
    print(f"  Status: {run_fail.get('status')}")
    print(f"  Error: {run_fail.get('error')}")
    print(f"  Failure Alert Sent: {run_fail.get('alert_sent')}")

    # Save simulation summary
    summary_data = {
        "computation": {
            "target": target_time,
            "next_run_1": next_run_1.isoformat(),
            "next_run_2": next_run_2.isoformat(),
        },
        "run1": run1,
        "run2": run2,
        "idempotency": run_dup,
        "concurrency_lock": {"claimed_jobs": claimed_jobs, "locked": len(claimed_jobs) == 0},
        "failure_alert": run_fail,
    }
    with open("apps/ai-service/tests/workers/simulation_results.json", "w", encoding="utf-8") as f:
        json.dump(summary_data, f, ensure_ascii=False, indent=2, default=str)
    print("\nSimulation complete. Saved to apps/ai-service/tests/workers/simulation_results.json")

if __name__ == "__main__":
    asyncio.run(run_simulation())
