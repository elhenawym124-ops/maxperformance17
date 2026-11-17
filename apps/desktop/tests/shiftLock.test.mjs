import test from 'node:test';
import assert from 'node:assert/strict';
import { computeShiftLock } from '../src/shared/shiftLock.ts';

test('ShiftLock Test Suite', async (t) => {
  await t.test('1. OFFICE device is NEVER locked, regardless of shift end or manual state', () => {
    // Office device after shift end
    const res1 = computeShiftLock({
      deviceType: 'OFFICE',
      nowIso: '2026-11-16T18:00:00.000Z',
      scheduledEndAtIso: '2026-11-16T17:00:00.000Z',
    });
    assert.deepEqual(res1, { locked: false, reason: 'OFFICE' });

    // Office device with manualShiftEnded: true
    const res2 = computeShiftLock({
      deviceType: 'OFFICE',
      nowIso: '2026-11-16T15:00:00.000Z',
      scheduledEndAtIso: '2026-11-16T17:00:00.000Z',
      manualShiftEnded: true,
    });
    assert.deepEqual(res2, { locked: false, reason: 'OFFICE' });
  });

  await t.test('2. PERSONAL device before scheduled shift end is unlocked', () => {
    const res = computeShiftLock({
      deviceType: 'PERSONAL',
      nowIso: '2026-11-16T14:30:00.000Z',
      scheduledEndAtIso: '2026-11-16T15:00:00.000Z',
    });
    assert.deepEqual(res, { locked: false, reason: 'BEFORE_END' });
  });

  await t.test('3. PERSONAL device at or after scheduled shift end is locked', () => {
    // Exactly at end time
    const resExact = computeShiftLock({
      deviceType: 'PERSONAL',
      nowIso: '2026-11-16T15:00:00.000Z',
      scheduledEndAtIso: '2026-11-16T15:00:00.000Z',
    });
    assert.deepEqual(resExact, { locked: true, reason: 'AFTER_END' });

    // After end time
    const resAfter = computeShiftLock({
      deviceType: 'PERSONAL',
      nowIso: '2026-11-16T15:05:00.000Z',
      scheduledEndAtIso: '2026-11-16T15:00:00.000Z',
    });
    assert.deepEqual(resAfter, { locked: true, reason: 'AFTER_END' });
  });

  await t.test('4. PERSONAL device with no schedule (null or undefined) is unlocked with NO_SCHEDULE', () => {
    const resNull = computeShiftLock({
      deviceType: 'PERSONAL',
      nowIso: '2026-11-16T15:00:00.000Z',
      scheduledEndAtIso: null,
    });
    assert.deepEqual(resNull, { locked: false, reason: 'NO_SCHEDULE' });

    const resUndefined = computeShiftLock({
      deviceType: 'PERSONAL',
      nowIso: '2026-11-16T15:00:00.000Z',
      scheduledEndAtIso: undefined,
    });
    assert.deepEqual(resUndefined, { locked: false, reason: 'NO_SCHEDULE' });
  });

  await t.test('5. PERSONAL device with active overtime remains unlocked even past shift end', () => {
    const res = computeShiftLock({
      deviceType: 'PERSONAL',
      nowIso: '2026-11-16T18:00:00.000Z',
      scheduledEndAtIso: '2026-11-16T15:00:00.000Z',
      isOvertimeActive: true,
    });
    assert.deepEqual(res, { locked: false, reason: 'OVERTIME' });
  });

  await t.test('6. PERSONAL device with manualShiftEnded: true is locked', () => {
    const res = computeShiftLock({
      deviceType: 'PERSONAL',
      nowIso: '2026-11-16T12:00:00.000Z',
      scheduledEndAtIso: '2026-11-16T15:00:00.000Z',
      manualShiftEnded: true,
    });
    assert.deepEqual(res, { locked: true, reason: 'MANUAL_ENDED' });
  });

  await t.test('7. Night shift spanning across midnight locks at scheduled end on the following day', () => {
    // Night shift ending at 04:00 UTC on 2026-11-17
    const nightShiftEnd = '2026-11-17T04:00:00.000Z';

    // 03:30 UTC -> Before end (unlocked)
    const resBefore = computeShiftLock({
      deviceType: 'PERSONAL',
      nowIso: '2026-11-17T03:30:00.000Z',
      scheduledEndAtIso: nightShiftEnd,
    });
    assert.deepEqual(resBefore, { locked: false, reason: 'BEFORE_END' });

    // 04:00 UTC -> Exact end (locked)
    const resExact = computeShiftLock({
      deviceType: 'PERSONAL',
      nowIso: '2026-11-17T04:00:00.000Z',
      scheduledEndAtIso: nightShiftEnd,
    });
    assert.deepEqual(resExact, { locked: true, reason: 'AFTER_END' });

    // 04:30 UTC -> After end (locked)
    const resAfter = computeShiftLock({
      deviceType: 'PERSONAL',
      nowIso: '2026-11-17T04:30:00.000Z',
      scheduledEndAtIso: nightShiftEnd,
    });
    assert.deepEqual(resAfter, { locked: true, reason: 'AFTER_END' });
  });

  await t.test('8. Bad or corrupted input fails safe (unlocked with BAD_INPUT)', () => {
    // null input
    assert.deepEqual(computeShiftLock(null), { locked: false, reason: 'BAD_INPUT' });

    // undefined input
    assert.deepEqual(computeShiftLock(undefined), { locked: false, reason: 'BAD_INPUT' });

    // invalid deviceType
    assert.deepEqual(computeShiftLock({ deviceType: 'TABLET', nowIso: '2026-11-16T10:00:00Z', scheduledEndAtIso: '2026-11-16T12:00:00Z' }), {
      locked: false,
      reason: 'BAD_INPUT',
    });

    // invalid nowIso string
    assert.deepEqual(computeShiftLock({ deviceType: 'PERSONAL', nowIso: 'not-a-date', scheduledEndAtIso: '2026-11-16T12:00:00Z' }), {
      locked: false,
      reason: 'BAD_INPUT',
    });

    // invalid scheduledEndAtIso string
    assert.deepEqual(computeShiftLock({ deviceType: 'PERSONAL', nowIso: '2026-11-16T10:00:00Z', scheduledEndAtIso: 'invalid-end-date' }), {
      locked: false,
      reason: 'BAD_INPUT',
    });
  });
});
