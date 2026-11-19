// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SchemaAppSettingsTab, JSONSchema } from '../components/settings/SchemaAppSettingsTab';

afterEach(() => cleanup());

describe('SchemaAppSettingsTab Component', () => {
  const sampleSchema: JSONSchema = {
    type: 'object',
    title: 'إعدادات أداة Hello App التجريبية',
    description: 'تم توليد هذه الصفحة تلقائياً من المانيفست',
    properties: {
      welcomeMessage: {
        type: 'string',
        title: 'رسالة الترحيب',
        description: 'الرسالة التي ستظهر للمستخدم',
        default: 'أهلاً بك'
      },
      enableAutoSync: {
        type: 'boolean',
        title: 'تفعيل المزامنة التلقائية',
        description: 'مزامنة كل ساعة',
        default: false
      },
      syncIntervalMinutes: {
        type: 'number',
        title: 'فترة المزامنة بالدقائق',
        default: 15,
        minimum: 1,
        maximum: 60
      },
      logLevel: {
        type: 'string',
        title: 'مستوى السجلات',
        enum: ['info', 'warn', 'error'],
        default: 'info'
      }
    },
    required: ['welcomeMessage']
  };

  it('renders all fields from schema and never produces an empty page', () => {
    const onChangeMock = vi.fn();
    const onSaveMock = vi.fn();

    render(
      <SchemaAppSettingsTab
        schema={sampleSchema}
        settings={{}}
        onChange={onChangeMock}
        onSave={onSaveMock}
        saving={false}
        appName="Hello App"
      />
    );

    // Title and description check
    expect(screen.getByText('إعدادات أداة Hello App التجريبية')).toBeInTheDocument();
    expect(screen.getByText('تم توليد هذه الصفحة تلقائياً من المانيفست')).toBeInTheDocument();

    // Check string field
    expect(screen.getByText('رسالة الترحيب')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('رسالة الترحيب')).toBeInTheDocument();

    // Check boolean field
    expect(screen.getByText('تفعيل المزامنة التلقائية')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();

    // Check number field
    expect(screen.getByText('فترة المزامنة بالدقائق')).toBeInTheDocument();

    // Check enum select
    expect(screen.getByText('مستوى السجلات')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    // Check save button
    expect(screen.getByText('حفظ الإعدادات')).toBeInTheDocument();
  });

  it('handles field changes and calls onChange with correct key and value', () => {
    const onChangeMock = vi.fn();
    const onSaveMock = vi.fn();

    render(
      <SchemaAppSettingsTab
        schema={sampleSchema}
        settings={{ welcomeMessage: 'مرحباً بكم' }}
        onChange={onChangeMock}
        onSave={onSaveMock}
        saving={false}
        appName="Hello App"
      />
    );

    // Toggle switch
    const toggleBtn = screen.getByRole('switch');
    fireEvent.click(toggleBtn);
    expect(onChangeMock).toHaveBeenCalledWith('enableAutoSync', true);

    // Change input
    const input = screen.getByPlaceholderText('رسالة الترحيب');
    fireEvent.change(input, { target: { value: 'نص جديد' } });
    expect(onChangeMock).toHaveBeenCalledWith('welcomeMessage', 'نص جديد');

    // Click Save
    const saveBtn = screen.getByText('حفظ الإعدادات');
    fireEvent.click(saveBtn);
    expect(onSaveMock).toHaveBeenCalled();
  });
});
