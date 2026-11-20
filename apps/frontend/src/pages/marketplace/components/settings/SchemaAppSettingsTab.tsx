import React from 'react';
import { Save, CheckCircle2, Sliders, Info } from 'lucide-react';

export interface JSONSchemaProperty {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  title?: string;
  description?: string;
  default?: any;
  enum?: string[];
  minimum?: number;
  maximum?: number;
}

export interface JSONSchema {
  type?: string;
  title?: string;
  description?: string;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
}

interface SchemaAppSettingsTabProps {
  schema: JSONSchema;
  settings: Record<string, any>;
  onChange: (path: string, value: any) => void;
  onSave: () => Promise<void> | void;
  saving: boolean;
  appName?: string;
}

export const SchemaAppSettingsTab: React.FC<SchemaAppSettingsTabProps> = ({
  schema,
  settings = {},
  onChange,
  onSave,
  saving,
  appName = 'الأداة'
}) => {
  const effectiveSchema: JSONSchema = React.useMemo(() => {
    if (typeof schema === 'string') {
      try { return JSON.parse(schema); } catch { return {}; }
    }
    return schema || {};
  }, [schema]);

  const properties = effectiveSchema?.properties || {};
  const propertyKeys = Object.keys(properties);
  const requiredFields = new Set(effectiveSchema?.required || []);

  const getValue = (key: string, fallback: any) => {
    if (settings && settings[key] !== undefined && settings[key] !== null) {
      return settings[key];
    }
    return fallback;
  };

  const renderField = (key: string, prop: JSONSchemaProperty) => {
    const isRequired = requiredFields.has(key);
    const currentValue = getValue(key, prop.default);

    switch (prop.type) {
      case 'boolean':
        return (
          <div
            key={key}
            className="flex items-center justify-between rounded-xl border border-border dark:border-border bg-card p-4 shadow-sm hover:border-primary/50 transition-colors"
          >
            <div className="space-y-1 pe-2">
              <label htmlFor={`field-${key}`} className="text-sm font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
                {prop.title || key}
                {isRequired && <span className="text-red-500">*</span>}
              </label>
              {prop.description && (
                <p className="text-xs text-muted-foreground">
                  {prop.description}
                </p>
              )}
            </div>
            <button
              id={`field-${key}`}
              type="button"
              role="switch"
              aria-checked={Boolean(currentValue)}
              onClick={() => onChange(key, !currentValue)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                currentValue ? 'bg-blue-600' : 'bg-gray-200 dark:bg-muted'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  currentValue ? '-translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        );

      case 'string':
        if (Array.isArray(prop.enum) && prop.enum.length > 0) {
          return (
            <div key={key} className="space-y-1.5 rounded-xl border border-border dark:border-border bg-card p-4 shadow-sm">
              <label htmlFor={`field-${key}`} className="block text-sm font-semibold text-foreground">
                {prop.title || key}
                {isRequired && <span className="text-red-500 me-1">*</span>}
              </label>
              {prop.description && (
                <p className="text-xs text-muted-foreground mb-2">
                  {prop.description}
                </p>
              )}
              <select
                id={`field-${key}`}
                value={currentValue ?? ''}
                onChange={(e) => onChange(key, e.target.value)}
                className="w-full rounded-lg border border-border bg-muted dark:bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {prop.enum.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return (
          <div key={key} className="space-y-1.5 rounded-xl border border-border dark:border-border bg-card p-4 shadow-sm">
            <label htmlFor={`field-${key}`} className="block text-sm font-semibold text-foreground">
              {prop.title || key}
              {isRequired && <span className="text-red-500 me-1">*</span>}
            </label>
            {prop.description && (
              <p className="text-xs text-muted-foreground mb-2">
                {prop.description}
              </p>
            )}
            <input
              id={`field-${key}`}
              type="text"
              value={currentValue ?? ''}
              onChange={(e) => onChange(key, e.target.value)}
              placeholder={prop.title || ''}
              className="w-full rounded-lg border border-border bg-muted dark:bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        );

      case 'number':
      case 'integer':
        return (
          <div key={key} className="space-y-1.5 rounded-xl border border-border dark:border-border bg-card p-4 shadow-sm">
            <label htmlFor={`field-${key}`} className="block text-sm font-semibold text-foreground">
              {prop.title || key}
              {isRequired && <span className="text-red-500 me-1">*</span>}
            </label>
            {prop.description && (
              <p className="text-xs text-muted-foreground mb-2">
                {prop.description}
              </p>
            )}
            <input
              id={`field-${key}`}
              type="number"
              min={prop.minimum}
              max={prop.maximum}
              value={currentValue ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : Number(e.target.value);
                onChange(key, val);
              }}
              className="w-full rounded-lg border border-border bg-muted dark:bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        );

      default:
        return (
          <div key={key} className="space-y-1.5 rounded-xl border border-border dark:border-border bg-card p-4 shadow-sm">
            <label htmlFor={`field-${key}`} className="block text-sm font-semibold text-foreground">
              {prop.title || key}
            </label>
            <input
              id={`field-${key}`}
              type="text"
              value={typeof currentValue === 'object' ? JSON.stringify(currentValue) : String(currentValue ?? '')}
              onChange={(e) => onChange(key, e.target.value)}
              className="w-full rounded-lg border border-border bg-muted dark:bg-muted px-3 py-2 text-sm text-foreground"
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Schema Header Card */}
      <div className="rounded-xl border border-primary bg-primary/60 p-5 dark:border-primary/40 dark:bg-primary/20">
        <div className="flex items-start gap-3">
          <Sliders className="mt-0.5 text-primary dark:text-primary shrink-0" size={20} />
          <div>
            <h2 className="text-base font-bold text-foreground">
              {schema?.title || `إعدادات ${appName}`}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {schema?.description || 'تم توليد هذه الصفحة تلقائياً بالكامل بناءً على مواصفات المانيفست (JSON Schema).'}
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Fields Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {propertyKeys.map((key) => renderField(key, properties[key]))}
      </div>

      {/* Save Action Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-border">
        <button
          type="button"
          onClick={() => onSave()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>حفظ الإعدادات</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
