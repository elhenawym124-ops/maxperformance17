// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import FloatingContactWidget from '../components/FloatingContactWidget';
import FloatingContactSettingsEditor from '../../components/store/FloatingContactSettingsEditor';

afterEach(() => {
  cleanup();
});

describe('FloatingContactWidget', () => {
  it('renders nothing when disabled or no channels configured', () => {
    const { container } = render(
      <FloatingContactWidget
        designTokens={{ floatingContact: { enabled: false } }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('auto-hides on checkout page', () => {
    const { container } = render(
      <FloatingContactWidget
        routePageKey="checkout"
        pathname="/checkout"
        designTokens={{
          whatsapp: { enabled: true, phoneNumber: '01001234567' },
        }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders single direct WhatsApp button from legacy designTokens.whatsapp', () => {
    render(
      <FloatingContactWidget
        designTokens={{
          whatsapp: {
            enabled: true,
            phoneNumber: '01001234567',
            message: 'مرحبا',
          },
        }}
      />,
    );

    const link = screen.getByRole('link', { name: 'واتساب' });
    expect(link.getAttribute('href')).toContain('https://wa.me/201001234567');
  });

  it('includes product title and URL in WhatsApp message on product pages (pdp)', () => {
    render(
      <div>
        <h1>حذاء رياضي جلد طبيعي</h1>
        <FloatingContactWidget
          routePageKey="pdp"
          pathname="/products/leather-sneaker"
          designTokens={{
            whatsapp: { enabled: true, phoneNumber: '01001234567' },
          }}
        />
      </div>,
    );

    const link = screen.getByRole('link', { name: 'واتساب' });
    const href = decodeURIComponent(link.getAttribute('href') || '');
    expect(href).toContain('https://wa.me/201001234567?text=');
    expect(href).toContain('حذاء رياضي جلد طبيعي');
    expect(href).toContain('http://localhost');
  });

  it('renders expandable icon-only multi-channel menu including TikTok without email', () => {
    render(
      <FloatingContactWidget
        designTokens={{
          floatingContact: {
            enabled: true,
            whatsapp: { enabled: true, phoneNumber: '01001234567' },
            phone: { enabled: true, number: '+201001234567' },
            messenger: { enabled: true, url: 'mystore' },
            instagram: { enabled: true, url: '@mystore' },
            telegram: { enabled: true, url: 'mystore_tg' },
            tiktok: { enabled: true, url: '@mystore_tt' },
          },
        }}
      />,
    );

    const toggleBtn = screen.getByRole('button', { name: 'تواصل معنا' });
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.click(toggleBtn);
    expect(screen.getByRole('menu')).toBeTruthy();

    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(6);
    items.forEach((item) => {
      expect(item.textContent?.trim()).toBe('');
    });

    expect(screen.getByRole('menuitem', { name: 'واتساب' }).getAttribute('href')).toContain(
      'https://wa.me/201001234567',
    );
    expect(screen.getByRole('menuitem', { name: 'اتصال هاتفي' }).getAttribute('href')).toBe(
      'tel:+201001234567',
    );
    expect(screen.getByRole('menuitem', { name: 'ماسنجر' }).getAttribute('href')).toBe(
      'https://m.me/mystore',
    );
    expect(screen.getByRole('menuitem', { name: 'إنستجرام' }).getAttribute('href')).toBe(
      'https://instagram.com/mystore',
    );
    expect(screen.getByRole('menuitem', { name: 'تيليجرام' }).getAttribute('href')).toBe(
      'https://t.me/mystore_tg',
    );
    expect(screen.getByRole('menuitem', { name: 'تيك توك' }).getAttribute('href')).toBe(
      'https://tiktok.com/@mystore_tt',
    );
  });
});

describe('FloatingContactSettingsEditor', () => {
  it('toggles master switch and updates floatingContact + legacy whatsapp tokens', () => {
    const onUpdate = vi.fn();
    render(
      <FloatingContactSettingsEditor
        designTokens={{}}
        onUpdateDesignTokens={onUpdate}
      />,
    );

    const masterCheckbox = screen.getByRole('checkbox');
    fireEvent.click(masterCheckbox);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const updated = onUpdate.mock.calls[0][0];
    expect(updated.floatingContact.enabled).toBe(true);
    expect(updated.whatsapp.enabled).toBe(true);
  });
});
