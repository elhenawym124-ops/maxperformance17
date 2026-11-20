import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReturnReason, ReturnReasonCategory } from '../../../services/returnService';

interface ReturnReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingReason: ReturnReason | null;
  reasonText: string;
  setReasonText: (val: string) => void;
  reasonDesc: string;
  setReasonDesc: (val: string) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (val: string) => void;
  categories: ReturnReasonCategory[];
  onSave: (e: React.FormEvent) => Promise<void>;
}

export const ReturnReasonModal: React.FC<ReturnReasonModalProps> = ({
  isOpen,
  onClose,
  editingReason,
  reasonText,
  setReasonText,
  reasonDesc,
  setReasonDesc,
  selectedCategoryId,
  setSelectedCategoryId,
  categories,
  onSave,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4">
      <div className="bg-card rounded-lg w-full max-w-md p-6 border border-border dark:border-border shadow-xl">
        <h3 className="text-lg font-bold mb-4 text-foreground">
          {editingReason ? t('returns.k_113') : t('returns.k_114')}
        </h3>
        <form onSubmit={onSave}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('returns.k_187')}
              </label>
              <input
                type="text"
                required
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                className="w-full border-border bg-card text-foreground rounded-lg shadow-xs focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('returns.k_178')}
              </label>
              <select
                required
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full border-border bg-card text-foreground rounded-lg shadow-xs focus:border-primary focus:ring-primary"
              >
                <option value="">{t('returns.k_115')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t('returns.k_188')}
              </label>
              <textarea
                value={reasonDesc}
                onChange={(e) => setReasonDesc(e.target.value)}
                className="w-full border-border bg-card text-foreground rounded-lg shadow-xs focus:border-primary focus:ring-primary"
                rows={3}
              />
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
