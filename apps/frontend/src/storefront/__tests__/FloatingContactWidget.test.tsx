// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import FloatingContactWidget from '../components/FloatingContactWidget';
import FloatingContactSettingsEditor from '../../components/store/FloatingContactSettingsEditor';

describe('FloatingContactWidget', () => {
  it('renders nothing when disabled or no channels configured', () => {
    const { container } = render(
      <FloatingContactWidget
        designTokens={{ floatingContact: { enabled: false } }}
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

  it('renders expandable multi-channel menu when 2+ channels are enabled', () => {
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
          },
        }}
      />,
    );

    const toggleBtn = screen.getByRole('button', { name: 'تواصل معنا' });
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.click(toggleBtn);
    expect(screen.getByRole('menu')).toBeTruthy();

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
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(5);
    items.forEach((item) => {
      expect(item.textContent?.trim()).toBe('');
    });
    expect(screen.getByRole('menuitem', { name: 'تيليجرام' }).getAttribute('href')).toBe(
      'https://t.me/mystore_tg',
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
