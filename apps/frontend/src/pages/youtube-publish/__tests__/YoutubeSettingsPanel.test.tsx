import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../services/youtubePublishService', () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}));

import { getSettings, updateSettings } from '../../../services/youtubePublishService';
import YoutubeSettingsPanel from '../YoutubeSettingsPanel';

const baseSettings = {
  isEnabled: true,
  defaultPrivacy: 'private',
  defaultCategoryId: '22',
  maxUploadsPerDay: 10,
  usedToday: 2,
  remainingToday: 8,
  hasCredentials: true,
  clientIdHint: '••••qa.apps.googleusercontent.com',
  redirectUri: 'https://maxp.online/api/v1/youtube/auth/callback',
};

describe('YoutubeSettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('stays collapsed until expanded, then loads settings and saves the daily cap', async () => {
    (getSettings as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(baseSettings);
    (updateSettings as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (payload: Record<string, unknown>) => ({
      ...baseSettings,
      ...payload,
    }));

    render(<YoutubeSettingsPanel />);

    expect(screen.queryByText('حالة النشر')).toBeNull();
    expect(getSettings).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /إعدادات YouTube/ }));

    await waitFor(() => expect(getSettings).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('حالة النشر')).toBeTruthy();
    expect(screen.getByText('2 مرفوع اليوم')).toBeTruthy();

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /حفظ الإعدادات/ }));

    await waitFor(() =>
      expect(updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ isEnabled: true, maxUploadsPerDay: 3, defaultPrivacy: 'private' }),
      ),
    );
  });

  it('sends isEnabled=false when the publishing switch is turned off', async () => {
    (getSettings as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(baseSettings);
    (updateSettings as unknown as ReturnType<typeof vi.fn>).mockImplementation(async (payload: Record<string, unknown>) => ({
      ...baseSettings,
      ...payload,
    }));

    render(<YoutubeSettingsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /إعدادات YouTube/ }));

    const switchButton = await screen.findByRole('button', { name: 'مفعّل' });
    fireEvent.click(switchButton);
    fireEvent.click(screen.getByRole('button', { name: /حفظ الإعدادات/ }));

    await waitFor(() =>
      expect(updateSettings).toHaveBeenCalledWith(expect.objectContaining({ isEnabled: false })),
    );
  });
});
