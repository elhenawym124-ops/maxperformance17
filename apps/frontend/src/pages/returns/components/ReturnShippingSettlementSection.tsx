import React from 'react';
import { Truck } from 'lucide-react';
import type {
  ReturnRequest,
  ReturnShippingCompany,
  ReturnType,
} from '../../../services/returnService';

export interface ReturnShippingSettlementSectionProps {
  request: ReturnRequest;
  shippingCompanyId: string;
  handleShippingCompanyChange: (val: string) => void;
  shippingCompanies: ReturnShippingCompany[];
  returnTypeId: string;
  handleReturnTypeChange: (val: string) => void;
  returnTypes: ReturnType[];
  getSuggestedCost: (type: ReturnType | undefined) => number;
  shippingReturnCost: string;
  setShippingReturnCost: (val: string) => void;
  settlementAmount: string;
  setSettlementAmount: (val: string) => void;
  t: (key: string) => string;
}

export const ReturnShippingSettlementSection: React.FC<ReturnShippingSettlementSectionProps> = ({
  request,
  shippingCompanyId,
  handleShippingCompanyChange,
  shippingCompanies,
  returnTypeId,
  handleReturnTypeChange,
  returnTypes,
  getSuggestedCost,
  shippingReturnCost,
  setShippingReturnCost,
  settlementAmount,
  setSettlementAmount,
  t,
}) => {
  const selectedReturnType =
    returnTypes.find((x) => x.id === returnTypeId) ||
    shippingCompanies.flatMap((c) => c.returnTypes || []).find((x) => x.id === returnTypeId);

  const suggestedCost = selectedReturnType ? getSuggestedCost(selectedReturnType) : null;
  const currency = request.order?.currency || t('returns.k_22') || 'EGP';

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            {t('returns.k_254')}
          </label>
          <select
            value={shippingCompanyId}
            onChange={(e) => handleShippingCompanyChange(e.target.value)}
            className="w-full text-sm border-border dark:bg-muted dark:text-white rounded-md"
          >
            <option value="">{t('returns.k_264') || '-- اختر شركة الشحن --'}</option>
            {shippingCompanies.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            {t('returns.k_255')}
          </label>
          <select
            value={returnTypeId}
            onChange={(e) => handleReturnTypeChange(e.target.value)}
            disabled={returnTypes.length === 0}
            className="w-full text-sm border-border dark:bg-muted dark:text-white rounded-md disabled:opacity-50"
          >
            <option value="">{t('returns.k_265') || '-- اختر نوع المرتجع --'}</option>
            {returnTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {suggestedCost !== null && (
        <p className="text-xs text-primary dark:text-primary flex items-center gap-1.5 font-medium bg-primary/80 dark:bg-primary/20 p-2.5 rounded-md border border-primary dark:border-primary/40">
          <Truck size={14} className="shrink-0 text-primary dark:text-primary" />
          <span>
            {t('returns.k_256')}:{' '}
            <strong className="font-bold text-primary dark:text-primary underline decoration-primary tabular-nums font-mono">
              {suggestedCost} {currency}
            </strong>
          </span>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            {t('returns.k_228')}
          </label>
          <input
            type="number"
            step="0.01"
            value={shippingReturnCost}
            onChange={(e) => setShippingReturnCost(e.target.value)}
            placeholder="0.00"
            className="w-full text-sm border-border dark:bg-muted dark:text-white rounded-md tabular-nums font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            {t('returns.k_229')}
          </label>
          <input
            type="number"
            step="0.01"
            value={settlementAmount}
            onChange={(e) => setSettlementAmount(e.target.value)}
            placeholder="0.00"
            className="w-full text-sm border-border dark:bg-muted dark:text-white rounded-md tabular-nums font-mono"
          />
        </div>
      </div>
    </>
  );
};
