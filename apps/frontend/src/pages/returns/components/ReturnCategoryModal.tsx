import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReturnReasonCategory } from '../../../services/returnService';

interface ReturnCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory: ReturnReasonCategory | null;
  categoryName: string;
  setCategoryName: (val: string) => void;
  defaultRole: 'CUSTOMER' | 'STORE' | 'SHIPPING' | 'OTHER';
  setDefaultRole: (val: 'CUSTOMER' | 'STORE' | 'SHIPPING' | 'OTHER') => void;
  onSave: (e: React.FormEvent) => Promise<void>;
}

export const ReturnCategoryModal: React.FC<ReturnCategoryModalProps> = ({
  isOpen,
  onClose,
  editingCategory,
  categoryName,
  setCategoryName,
  defaultRole,
  setDefaultRole,
  onSave,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4">
      <div className="bg-card rounded-lg w-full max-w-md p-6 border border-border dark:border-border shadow-xl">
        <h3 className="text-lg font-bold mb-4 text-foreground">
          {editingCategory ? t('returns.k_109') : t('returns.k_110')}
        </h3>
        <form onSubmit={onSave}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('returns.k_182')}
              </label>
              <input
                type="text"
                required
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full border-border bg-card text-foreground rounded-lg shadow-xs focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('returns.k_183')}
              </label>
              <select
                value={defaultRole}
                onChange={(e) => setDefaultRole(e.target.value as any)}
                className="w-full border-border bg-card text-foreground rounded-lg shadow-xs focus:border-primary focus:ring-primary"
              >
                <option value="CUSTOMER">{t('returns.k_184')}</option>
                <option value="STORE">{t('returns.k_111')}</option>
                <option value="SHIPPING">{t('returns.k_185')}</option>
                <option value="OTHER">{t('returns.k_112')}</option>
              </select>
            </div>
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
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors"
            >
              {t('returns.k_186')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
