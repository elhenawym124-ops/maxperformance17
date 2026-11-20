import React from 'react';
import { DeliveryRun, DeliveryRunItem } from '../../../../services/courierService';

interface CourierMobileTopBarProps {
  run: DeliveryRun;
  allShipments: DeliveryRunItem[];
  deliveredShipments: DeliveryRunItem[];
  returnedShipments: DeliveryRunItem[];
  pendingShipments: DeliveryRunItem[];
  activeTab: 'pending' | 'delivered' | 'returned';
  setActiveTab: (tab: 'pending' | 'delivered' | 'returned') => void;
}

export const CourierMobileTopBar: React.FC<CourierMobileTopBarProps> = ({
  run,
  allShipments,
  deliveredShipments,
  returnedShipments,
  pendingShipments,
  activeTab,
  setActiveTab,
}) => {
  return (
    <div className="sticky top-0 z-30 bg-white dark:bg-muted border-b border-border dark:border-border px-4 py-3 shadow-xs">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] text-muted-foreground font-medium">مأمورية توصيل</div>
          <div className="font-mono font-bold text-sm text-foreground dark:text-muted-foreground">{run.runNumber}</div>
        </div>
        <div className="text-left">
          <div className="text-[11px] text-muted-foreground font-medium">كابتن التوصيل</div>
          <div className="font-semibold text-xs text-foreground dark:text-muted-foreground">{run.courier?.name}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
          <span>نسبة إنجاز المأمورية</span>
          <span className="tabular-nums font-mono font-semibold">
            {deliveredShipments.length} من {allShipments.length} طرد
          </span>
        </div>
        <div className="w-full bg-muted dark:bg-muted h-2 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${allShipments.length ? (deliveredShipments.length / allShipments.length) * 100 : 0}%` }}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-300"
            style={{ width: `${allShipments.length ? (returnedShipments.length / allShipments.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="grid grid-cols-3 gap-1 mt-3 p-1 bg-muted dark:bg-muted rounded-lg text-xs font-medium">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-1.5 rounded-md transition ${
            activeTab === 'pending'
              ? 'bg-white dark:bg-muted shadow-xs font-bold text-foreground dark:text-muted-foreground'
              : 'text-slate-500'
          }`}
        >
          المتبقي <span className="tabular-nums font-mono">({pendingShipments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('delivered')}
          className={`py-1.5 rounded-md transition ${
            activeTab === 'delivered'
              ? 'bg-white dark:bg-muted shadow-xs font-bold text-success dark:text-success'
              : 'text-slate-500'
          }`}
        >
          تم <span className="tabular-nums font-mono">({deliveredShipments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('returned')}
          className={`py-1.5 rounded-md transition ${
            activeTab === 'returned'
              ? 'bg-white dark:bg-muted shadow-xs font-bold text-destructive dark:text-destructive'
              : 'text-slate-500'
          }`}
        >
          مرتجع <span className="tabular-nums font-mono">({returnedShipments.length})</span>
        </button>
      </div>
    </div>
  );
};
