const appKillSwitchService = require('../../services/appContract/appKillSwitchService');

describe('App Kill Switch Service', () => {
  beforeEach(() => {
    appKillSwitchService.clearAll();
  });

  afterEach(() => {
    appKillSwitchService.clearAll();
  });

  it('defaults to inactive for any app slug', () => {
    expect(appKillSwitchService.isKillSwitchActive('hello-app')).toBe(false);
    expect(appKillSwitchService.isKillSwitchActive('random-app')).toBe(false);
  });

  it('activates emergency kill switch instantly and retains metadata', async () => {
    await appKillSwitchService.setKillSwitch('hello-app', true, {
      reason: 'Critical security audit flaw identified',
      updatedBy: 'SEC_ADMIN'
    });

    expect(appKillSwitchService.isKillSwitchActive('hello-app')).toBe(true);

    const status = appKillSwitchService.getKillSwitchStatus('hello-app');
    expect(status.active).toBe(true);
    expect(status.reason).toBe('Critical security audit flaw identified');
    expect(status.updatedBy).toBe('SEC_ADMIN');
    expect(status.activatedAt).toBeDefined();

    // Check that other apps remain untouched (zero impact on others)
    expect(appKillSwitchService.isKillSwitchActive('other-tool')).toBe(false);
  });

  it('deactivates kill switch immediately restoring tool access', async () => {
    await appKillSwitchService.setKillSwitch('hello-app', true, { reason: 'Test' });
    expect(appKillSwitchService.isKillSwitchActive('hello-app')).toBe(true);

    await appKillSwitchService.setKillSwitch('hello-app', false);
    expect(appKillSwitchService.isKillSwitchActive('hello-app')).toBe(false);
  });

  it('lists all active kill switches', async () => {
    await appKillSwitchService.setKillSwitch('tool-a', true);
    await appKillSwitchService.setKillSwitch('tool-b', true);
    await appKillSwitchService.setKillSwitch('tool-c', false);

    const all = appKillSwitchService.getAllActive();
    expect(Object.keys(all)).toEqual(['tool-a', 'tool-b']);
  });
});
