export type DeviceType = 'OFFICE' | 'PERSONAL';

export interface ShiftLockInput {
  deviceType: DeviceType;
  nowIso: string;
  scheduledEndAtIso: string | null;
  isOvertimeActive?: boolean;
  manualShiftEnded?: boolean;
}

export interface ShiftLockResult {
  locked: boolean;
  reason: 'OFFICE' | 'NO_SCHEDULE' | 'BEFORE_END' | 'OVERTIME' | 'MANUAL_ENDED' | 'AFTER_END' | 'BAD_INPUT';
}

export function computeShiftLock(i: ShiftLockInput): ShiftLockResult {
  if (!i || typeof i !== 'object') {
    return { locked: false, reason: 'BAD_INPUT' };
  }

  if (i.deviceType !== 'OFFICE' && i.deviceType !== 'PERSONAL') {
    return { locked: false, reason: 'BAD_INPUT' };
  }

  // OFFICE devices are never auto-locked by shift schedule
  if (i.deviceType === 'OFFICE') {
    return { locked: false, reason: 'OFFICE' };
  }

  // PERSONAL device logic:
  // 1. Manual shift ended takes precedence
  if (i.manualShiftEnded === true) {
    return { locked: true, reason: 'MANUAL_ENDED' };
  }

  // 2. Active approved overtime keeps the device unlocked
  if (i.isOvertimeActive === true) {
    return { locked: false, reason: 'OVERTIME' };
  }

  // 3. Validate nowIso
  if (typeof i.nowIso !== 'string' || !i.nowIso.trim()) {
    return { locked: false, reason: 'BAD_INPUT' };
  }

  const nowTime = Date.parse(i.nowIso);
  if (isNaN(nowTime)) {
    return { locked: false, reason: 'BAD_INPUT' };
  }

  // 4. Missing schedule (null / undefined)
  if (i.scheduledEndAtIso === null || i.scheduledEndAtIso === undefined) {
    return { locked: false, reason: 'NO_SCHEDULE' };
  }

  if (typeof i.scheduledEndAtIso !== 'string' || !i.scheduledEndAtIso.trim()) {
    return { locked: false, reason: 'BAD_INPUT' };
  }

  const endTime = Date.parse(i.scheduledEndAtIso);
  if (isNaN(endTime)) {
    return { locked: false, reason: 'BAD_INPUT' };
  }

  // 5. Check if current time has reached or passed scheduled shift end
  if (nowTime >= endTime) {
    return { locked: true, reason: 'AFTER_END' };
  }

  return { locked: false, reason: 'BEFORE_END' };
}
