import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreditTopupPanel } from '../CreditTopupPanel';
import { aiCreditsService } from '../../../../services/aiCreditsService';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const PACKAGES = [
  {
    id: 'starter',
    nameAr: 'باقة البداية',
    nameEn: 'Starter',
    priceEgp: 100,
    credits: 2000,
    bonusCredits: 0,
    validityDays: 365,
    isPopular: false,
    isActive: true,
  },
  {
    id: 'growth',
    nameAr: 'باقة النمو',
    nameEn: 'Growth',
    priceEgp: 450,
    credits: 9000,
    bonusCredits: 1000,
    validityDays: 365,
    isPopular: true,
    isActive: true,
  },
];

describe('CreditTopupPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders packages and lets merchant switch between all 3 top-up methods', async () => {
    const getWalletsSpy = vi
      .spyOn(aiCreditsService, 'getWalletNumbers')
      .mockResolvedValue([
        { id: 'wn-1', name: 'Vodafone Cash', number: '01000000000', isActive: true },
      ]);
    const walletTopupSpy = vi
      .spyOn(aiCreditsService, 'topupFromWallet')
      .mockResolvedValue({ success: true, message: 'ok' });

    const onSuccess = vi.fn();
    render(
      <CreditTopupPanel
        packages={PACKAGES}
        companyWalletBalance={1200}
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText('باقة البداية')).toBeTruthy();
    expect(screen.getByText('باقة النمو')).toBeTruthy();
    expect(screen.getByText('محفظة الشركة')).toBeTruthy();
    expect(screen.getByText('دفع أونلاين (كاشير)')).toBeTruthy();
    expect(screen.getByText('تحويل يدوي + إيصال')).toBeTruthy();

    // Default method is wallet — trigger instant top-up
    fireEvent.click(screen.getByText('تأكيد الشحن الفوري'));
    await waitFor(() => expect(walletTopupSpy).toHaveBeenCalledWith('growth'));
    expect(onSuccess).toHaveBeenCalled();

    // Switch to manual receipt method — loads wallet numbers
    fireEvent.click(screen.getByText('تحويل يدوي + إيصال'));
    await waitFor(() => expect(getWalletsSpy).toHaveBeenCalled());
    expect(screen.getByText('Vodafone Cash')).toBeTruthy();
  });
});
