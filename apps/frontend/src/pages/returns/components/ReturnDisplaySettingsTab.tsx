import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2, Eye, EyeOff, Package, Calendar, Save } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ReviewDisplayConfig } from '../../../services/returnService';
import { DateInput } from '../../../components/ui/DateInput';

interface ReturnDisplaySettingsTabProps {
  settingsLoading: boolean;
  displayConfig: ReviewDisplayConfig;
  setDisplayConfig: React.Dispatch<React.SetStateAction<ReviewDisplayConfig>>;
  toggleDisplayField: (key: keyof ReviewDisplayConfig) => void;
  DISPLAY_FIELDS: {
    key: keyof ReviewDisplayConfig;
    label: string;
    description: string;
    section: 'columns' | 'controls';
  }[];
  ORDER_STATUS_FIELDS: {
    code: string;
    label: string;
  }[];
  isOrderStatusVisible: (code: string) => boolean;
  toggleOrderStatusField: (code: string) => void;
  handleSaveDisplayConfig: () => Promise<void>;
  saving: boolean;
}

export const ReturnDisplaySettingsTab: React.FC<ReturnDisplaySettingsTabProps> = ({
  settingsLoading,
  displayConfig,
  setDisplayConfig,
  toggleDisplayField,
  DISPLAY_FIELDS,
  ORDER_STATUS_FIELDS,
  isOrderStatusVisible,
  toggleOrderStatusField,
  handleSaveDisplayConfig,
  saving,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Columns Section */}
      <div className="bg-card rounded-lg shadow border border-border dark:border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary">
            <Settings2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground dark:text-white">
              {t('returns.k_164')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('returns.k_165')}
            </p>
          </div>
        </div>

        {settingsLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('returns.k_144')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DISPLAY_FIELDS.filter((f) => f.section === 'columns').map((field) => (
              <div
                key={field.key}
                className="flex items-center justify-between p-4 rounded-xl border border-border dark:border-border bg-muted dark:bg-muted hover:bg-muted/50/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      displayConfig[field.key]
                        ? 'bg-green-50 dark:bg-success/20 text-success dark:text-success'
                        : 'bg-muted text-muted-foreground/80'
                    }`}
                  >
                    {displayConfig[field.key] ? (
                      <Eye size={18} />
                    ) : (
                      <EyeOff size={18} />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground dark:text-white">
                      {field.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {field.description}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={displayConfig[field.key]}
                  onCheckedChange={() => toggleDisplayField(field.key)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controls Section */}
      <div className="bg-card rounded-lg shadow border border-border dark:border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary">
            <Settings2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground dark:text-white">
              {t('returns.k_166')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('returns.k_167')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DISPLAY_FIELDS.filter((f) => f.section === 'controls').map((field) => (
            <div
              key={field.key}
              className="flex items-center justify-between p-4 rounded-xl border border-border dark:border-border bg-muted dark:bg-muted hover:bg-muted/50/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    displayConfig[field.key]
                      ? 'bg-green-50 dark:bg-success/20 text-success dark:text-success'
                      : 'bg-muted text-muted-foreground/80'
                  }`}
                >
                  {displayConfig[field.key] ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground dark:text-white">
                    {field.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {field.description}
                  </div>
                </div>
              </div>
              <Switch
                checked={displayConfig[field.key]}
                onCheckedChange={() => toggleDisplayField(field.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Filter Statuses Section */}
      <div className="bg-card rounded-lg shadow border border-border dark:border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-success/10 dark:bg-success/20 text-success dark:text-success">
            <Package size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground dark:text-white">
              {t('returns.k_170')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('returns.k_171')}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ORDER_STATUS_FIELDS.map((field) => (
            <div
              key={field.code}
              className="flex items-center justify-between p-4 rounded-xl border border-border dark:border-border bg-muted dark:bg-muted hover:bg-muted/50/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isOrderStatusVisible(field.code)
                      ? 'bg-green-50 dark:bg-success/20 text-success dark:text-success'
                      : 'bg-muted text-muted-foreground/80'
                  }`}
                >
                  {isOrderStatusVisible(field.code) ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground dark:text-white">
                    {field.label}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {field.code}
                  </div>
                </div>
              </div>
              <Switch
                checked={isOrderStatusVisible(field.code)}
                onCheckedChange={() => toggleOrderStatusField(field.code)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Start Date Filter Section */}
      <div className="bg-card rounded-lg shadow border border-border dark:border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-warning/10 dark:bg-warning/20 text-warning dark:text-warning">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground dark:text-white">
              تاريخ بدء ظهور الطلبات والمرتجعات
            </h2>
            <p className="text-sm text-muted-foreground">
              تحديد تاريخ بداية الشغل على النظام بحيث تظهر فقط الطلبات والمرتجعات المنشأة من هذا التاريخ وما بعده
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-md">
          <DateInput
            value={displayConfig.ordersStartDate ? displayConfig.ordersStartDate.split('T')[0] : ''}
            onChange={(e) =>
              setDisplayConfig((prev) => ({
                ...prev,
                ordersStartDate: e.target.value || undefined,
              }))
            }
            className="px-4 py-2 border border-border rounded-lg bg-card text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary tabular-nums font-mono"
          />
          {displayConfig.ordersStartDate && (
            <button
              type="button"
              onClick={() =>
                setDisplayConfig((prev) => ({
                  ...prev,
                  ordersStartDate: undefined,
                }))
              }
              className="text-xs text-destructive hover:text-destructive dark:hover:text-destructive underline font-medium"
            >
              إلغاء تاريخ البدء (عرض جميع البيانات القديمة)
            </button>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveDisplayConfig}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary transition-colors disabled:opacity-50 font-medium shadow-xs"
        >
          <Save size={18} />
          {saving ? t('returns.k_105') : t('returns.k_106')}
        </button>
      </div>
    </div>
  );
};
