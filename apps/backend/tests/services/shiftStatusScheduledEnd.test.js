const mockPrisma = {
  $executeRawUnsafe: jest.fn().mockResolvedValue(1),
  attendance: {
    findFirst: jest.fn(),
  },
  overtimeSession: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  shiftHandover: {
    findFirst: jest.fn(),
  },
  company: {
    findUnique: jest.fn(),
  },
  shiftAssignment: {
    findFirst: jest.fn(),
  },
};

jest.mock('../../services/sharedDatabase', () => ({
  getSharedPrismaClient: jest.fn(() => mockPrisma),
  mockPrisma,
}));

jest.mock('../../services/socketService', () => ({
  emitToCompany: jest.fn(),
  emitToUser: jest.fn(),
}));

const shiftService = require('../../services/shiftService');
const { getDateStringInTimezone } = require('../../utils/dateUtils');

describe('ShiftService.getTodayShiftStatus - scheduledEndAt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    shiftService.prisma = mockPrisma;
    shiftService.tablesEnsured = true;

    mockPrisma.attendance.findFirst.mockResolvedValue(null);
    mockPrisma.overtimeSession.findFirst.mockResolvedValue(null);
    mockPrisma.shiftHandover.findFirst.mockResolvedValue(null);
    mockPrisma.overtimeSession.findMany.mockResolvedValue([]);
    mockPrisma.company.findUnique.mockResolvedValue({ timezone: 'Africa/Cairo' });
  });

  test('(1) Regular shift 09:00 -> 17:00 returns scheduledEndAt at 17:00 in company timezone', async () => {
    mockPrisma.shiftAssignment.findFirst.mockResolvedValue({
      id: 'assign-1',
      companyId: 'comp-1',
      userId: 'user-1',
      shift: {
        id: 'shift-day',
        name: 'الوردية الصباحية',
        startTime: '09:00',
        endTime: '17:00',
      },
    });

    const res = await shiftService.getTodayShiftStatus({ companyId: 'comp-1', userId: 'user-1' });

    expect(res).toBeDefined();
    expect(res.timezone).toBe('Africa/Cairo');
    expect(res.scheduledShift).toEqual({
      id: 'shift-day',
      name: 'الوردية الصباحية',
      startTime: '09:00',
      endTime: '17:00',
    });
    expect(res.scheduledEndAt).toBeTruthy();

    const endDate = new Date(res.scheduledEndAt);
    const tz = 'Africa/Cairo';
    const endHourMin = endDate.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    expect(endHourMin).toBe('17:00');

    // End date should be today's date in company timezone
    const todayStr = getDateStringInTimezone(new Date(), tz);
    const endDayStr = getDateStringInTimezone(endDate, tz);
    expect(endDayStr).toBe(todayStr);
  });

  test('(2) Night shift 22:00 -> 06:00 (endTime <= startTime) returns scheduledEndAt on the following day', async () => {
    mockPrisma.shiftAssignment.findFirst.mockResolvedValue({
      id: 'assign-2',
      companyId: 'comp-1',
      userId: 'user-1',
      shift: {
        id: 'shift-night',
        name: 'الوردية الليلية',
        startTime: '22:00',
        endTime: '06:00',
      },
    });

    const res = await shiftService.getTodayShiftStatus({ companyId: 'comp-1', userId: 'user-1' });

    expect(res).toBeDefined();
    expect(res.scheduledShift).toEqual({
      id: 'shift-night',
      name: 'الوردية الليلية',
      startTime: '22:00',
      endTime: '06:00',
    });
    expect(res.scheduledEndAt).toBeTruthy();

    const endDate = new Date(res.scheduledEndAt);
    const tz = 'Africa/Cairo';
    const endHourMin = endDate.toLocaleTimeString('en-US', {
      timeZone: tz,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    expect(endHourMin).toBe('06:00');

    // End date should be tomorrow's date relative to today in company timezone
    const now = new Date();
    const todayStr = getDateStringInTimezone(now, tz);
    const [y, m, d] = todayStr.split('-').map(Number);
    const expectedTomorrowStr = getDateStringInTimezone(new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0)), tz);
    const endDayStr = getDateStringInTimezone(endDate, tz);
    expect(endDayStr).toBe(expectedTomorrowStr);
  });

  test('(3) No shift assignment returns null for scheduledShift and scheduledEndAt without throwing', async () => {
    mockPrisma.shiftAssignment.findFirst.mockResolvedValue(null);

    const res = await shiftService.getTodayShiftStatus({ companyId: 'comp-1', userId: 'user-1' });

    expect(res).toBeDefined();
    expect(res.scheduledShift).toBeNull();
    expect(res.scheduledEndAt).toBeNull();
    expect(res.timezone).toBe('Africa/Cairo');
  });
});
