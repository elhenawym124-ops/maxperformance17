import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ReturnType,
  ReturnTypeCode,
  ReturnTypeCostModel,
  ReturnShippingCompany,
} from '../../../services/returnService';

interface ReturnShippingTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingType: ReturnType | null;
  typeName: string;
  setTypeName: (val: string) => void;
  typeShippingCompanyId: string;
  setTypeShippingCompanyId: (val: string) => void;
  typeCode: ReturnTypeCode;
  setTypeCode: (val: ReturnTypeCode) => void;
  typeCostModel: ReturnTypeCostModel;
  setTypeCostModel: (val: ReturnTypeCostModel) => void;
  typeFixedAmount: string;
  setTypeFixedAmount: (val: string) => void;
  savingType: boolean;
  shippingCompanies: ReturnShippingCompany[];
  onSave: (e: React.FormEvent) => Promise<void>;
}

export const ReturnShippingTypeModal: React.FC<ReturnShippingTypeModalProps> = ({
  isOpen,
  onClose,
  editingType,
  typeName,
  setTypeName,
  typeShippingCompanyId,
  setTypeShippingCompanyId,
  typeCode,
  setTypeCode,
  typeCostModel,
  setTypeCostModel,
  typeFixedAmount,
  setTypeFixedAmount,
  savingType,
  shippingCompanies,
  onSave,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4">
      <div className="bg-card rounded-lg w-full max-w-md p-6 border border-border dark:border-border shadow-xl">
        <h3 className="text-lg font-bold mb-4 text-foreground">
          {editingType ? t('returns.k_235') : t('returns.k_234')}
        </h3>
        <form onSubmit={onSave}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('returns.k_236')} *
              </label>
              <input
                type="text"
                required
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                className="w-full border-border bg-card text-foreground rounded-lg shadow-xs focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('returns.k_254')} *
              </label>
              <select
                required
                value={typeShippingCompanyId}
                onChange={(e) => setTypeShippingCompanyId(e.target.value)}
                className="w-full border-border bg-card text-foreground rounded-lg shadow-xs focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">{t('returns.k_115')}</option>
                {shippingCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('returns.k_237')} *
              </label>
              <select
                required
                value={typeCode}
                onChange={(e) => setTypeCode(e.target.value as ReturnTypeCode)}
                className="w-full border-border bg-card text-foreground rounded-lg shadow-xs focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="SENDER_PAYS">{t('returns.k_241')}</option>
                <option value="RECIPIENT_PAYS">{t('returns.k_242')}</option>
                <option value="CANCELLED">{t('returns.k_243')}</option>
                <option value="CUSTOM">{t('returns.k_244')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('returns.k_238')} *
              </label>
              <select
                required
                value={typeCostModel}
                onChange={(e) => setTypeCostModel(e.target.value as ReturnTypeCostModel)}
                className="w-full border-border bg-card text-foreground rounded-lg shadow-xs focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="FULL">{t('returns.k_245')}</option>
                <option value="NONE">{t('returns.k_246')}</option>
                <option value="FIXED">{t('returns.k_247')}</option>
              </select>
            </div>
            {typeCostModel === 'FIXED' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t('returns.k_239')} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={typeFixedAmount}
                  onChange={(e) => setTypeFixedAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border-border bg-card text-foreground rounded-lg shadow-xs focus:border-blue-500 focus:ring-blue-500 tabular-nums font-mono"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
            >
              {t('returns.k_158')}
            </button>
            <button
              type="submit"
              disabled={savingType}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {savingType ? t('returns.k_105') : t('returns.k_186')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
