jest.mock('../../services/sharedDatabase', () => ({
  getSharedPrismaClient: jest.fn(() => ({})),
  safeQuery: (fn) => fn(),
}));

jest.mock('../../services/whatsapp/WhatsAppManager', () => ({
  getCompanySessions: jest.fn(() => []),
  getSession: jest.fn(() => null),
}));

jest.mock('../../services/whatsapp/WhatsAppMessageHandler', () => ({
  sendTemplateMessage: jest.fn(),
  sendText: jest.fn(),
}));

const {
  getModuleSettingKey,
  isEventEnabledForSettings,
} = require('../../services/whatsapp/WhatsAppNotificationService');

describe('WhatsAppNotificationService abandoned cart module gate', () => {
  test('routes CART_ABANDONED_* events to abandonedCartEnabled instead of marketingNotificationsEnabled', () => {
    expect(getModuleSettingKey('CART_ABANDONED_1H')).toBe('abandonedCartEnabled');
    expect(getModuleSettingKey('CART_ABANDONED_24H')).toBe('abandonedCartEnabled');
    expect(getModuleSettingKey('CART_ABANDONED_72H')).toBe('abandonedCartEnabled');
    expect(getModuleSettingKey('CART_ABANDONED_WITH_DISCOUNT')).toBe('abandonedCartEnabled');
    expect(getModuleSettingKey('INCOMPLETE_CART_FIRST_APPEARANCE')).toBeNull();
    expect(getModuleSettingKey('PROMOTIONAL')).toBe('marketingNotificationsEnabled');
  });

  test('allows CART_ABANDONED_* when abandonedCartEnabled is true even if marketingNotificationsEnabled is false', () => {
    const settings = {
      isEnabled: true,
      abandonedCartEnabled: true,
      marketingNotificationsEnabled: false,
    };

    expect(isEventEnabledForSettings(settings, 'CART_ABANDONED_1H')).toEqual({
      enabled: true,
      reason: null,
      settingKey: 'cartAbandoned_1hEnabled',
    });
    expect(isEventEnabledForSettings(settings, 'CART_ABANDONED_24H').enabled).toBe(true);
    expect(isEventEnabledForSettings(settings, 'CART_ABANDONED_72H').enabled).toBe(true);
    expect(isEventEnabledForSettings(settings, 'CART_ABANDONED_WITH_DISCOUNT').enabled).toBe(true);
    expect(isEventEnabledForSettings(settings, 'PROMOTIONAL')).toEqual({
      enabled: false,
      reason: 'module_disabled',
      settingKey: 'marketingNotificationsEnabled',
    });
  });

  test('blocks CART_ABANDONED_* when abandonedCartEnabled is false', () => {
    const settings = {
      isEnabled: true,
      abandonedCartEnabled: false,
      marketingNotificationsEnabled: true,
    };

    expect(isEventEnabledForSettings(settings, 'CART_ABANDONED_1H')).toEqual({
      enabled: false,
      reason: 'module_disabled',
      settingKey: 'abandonedCartEnabled',
    });
  });
});
