import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SuperAdminAiPricingPage from '../SuperAdminAiPricingPage';
import { aiCreditsService } from '../../../../services/aiCreditsService';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SuperAdminAiPricingPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads settings, switches tabs, and saves updated pricing settings', async () => {
    vi.spyOn(aiCreditsService, 'getAdminSettings').mockResolvedValue({
      settings: {
        usdToEgp: 50,
        creditPriceEgp: 0.05,
        flashMarkupPercent: 80,
        proMarkupPercent: 40,
        minCreditsPerChat: 1,
        minCreditsPerAgentRun: 2,
        agentStepFeeCredits: 1,
        byokFreeTokens: true,
        enforcementMode: 'warn',
        trialBonusCredits: 200,
        defaultDailyCreditLimit: 5000,
        modelCostOverrides: {},
        packages: [
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
        ],
      },
      modelCatalog: [
        {
          modelName: 'deepseek-flash',
          inputPerM: 0.15,
          outputPerM: 0.6,
          tier: 'flash',
          multiplier: 1,
          enabled: true,
        },
      ],
    });

    vi.spyOn(aiCreditsService, 'simulateUsage').mockResolvedValue({
      modelName: 'deepseek-flash',
      tier: 'flash',
      inputTokens: 2500,
      outputTokens: 500,
      agentSteps: 2,
      costUsd: 0.0007,
      rawCostEgp: 0.0338,
      costEgp: 0.0608,
      markupPercent: 80,
      credits: 4,
      revenueEgp: 0.2,
      grossProfitEgp: 0.17,
    });

    const updateSpy = vi
      .spyOn(aiCreditsService, 'updateAdminSettings')
      .mockImplementation(async (patch) => ({
        settings: patch as any,
        modelCatalog: [
          {
            modelName: 'deepseek-flash',
            inputPerM: 0.15,
            outputPerM: 0.6,
            tier: 'flash',
            multiplier: 1,
            enabled: true,
          },
        ],
      }));

    render(<SuperAdminAiPricingPage />);

    await waitFor(() =>
      expect(screen.getByText('إدارة تسعير الوكلاء والتوكن والكريدت')).toBeTruthy()
    );

    // Edit USD to EGP field
    const fxInput = screen.getByLabelText('سعر الصرف (ج.م / $)') as HTMLInputElement;
    fireEvent.change(fxInput, { target: { value: '52' } });

    // Save button becomes enabled
    fireEvent.click(screen.getByText('حفظ التعديلات'));
    await waitFor(() => expect(updateSpy).toHaveBeenCalled());
    expect(updateSpy.mock.calls[0][0].usdToEgp).toBe(52);

    // Switch to packages tab
    fireEvent.click(screen.getByText('باقات الشحن'));
    expect(screen.getByDisplayValue('باقة البداية')).toBeTruthy();

    // Switch to models tab
    fireEvent.click(screen.getByText('أسعار الموديلات'));
    expect(screen.getByText('deepseek-flash')).toBeTruthy();
  });
});
