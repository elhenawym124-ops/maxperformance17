import React from 'react';
import {
  Phone,
  BarChart2,
  Key,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { formatCurrency } from './shippingOpsShared';

export interface ClientAccount {
  userId: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface ClientMetrics {
  totalShipments: number;
  monthShipments: number;
  deliveredCount: number;
  returnedCount: number;
  pendingCount: number;
  pendingCodAmount: number;
}

export interface ShippingClient {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  commissionRate: number;
  expectedMonthlyOrders?: number | null;
  coverageMode?: string | null;
  preferredCities?: string | null;
  currentPackage?: {
    id: string;
    name: string;
    pricingMode: string;
    monthlyVolumeTo?: number | null;
    perShipmentPrice?: number | null;
    flatMonthlyPrice?: number | null;
  } | null;
  hasAccount: boolean;
  account?: ClientAccount | null;
  metrics: ClientMetrics;
}

interface ClientTableRowProps {
  client: ShippingClient;
  isEn: boolean;
  onOpenSummary: (client: ShippingClient) => void;
  onOpenReset: (client: ShippingClient) => void;
  onToggleStatus: (client: ShippingClient) => void;
}

export const ClientTableRow: React.FC<ClientTableRowProps> = ({
  client,
  isEn,
  onOpenSummary,
  onOpenReset,
  onToggleStatus,
}) => {
  const hasAcc = client.hasAccount && client.account;
  const isAccActive = hasAcc ? client.account?.isActive : false;

  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-muted transition-colors">
      <td className="px-4 py-3">
        <div className="font-semibold text-foreground dark:text-white">{client.name}</div>
        {client.phone && (
          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3" />
            <span className="tabular-nums" dir="ltr">{client.phone}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-foreground dark:text-muted-foreground">
        {client.email}
      </td>
      <td className="px-4 py-3 text-center">
        {!hasAcc ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">
            <AlertTriangle className="w-3 h-3 text-warning" />
            <span>{isEn ? 'No Portal' : 'بدون حساب'}</span>
          </span>
        ) : isAccActive ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success dark:bg-success/40 dark:text-success dark:border-success">
            <ShieldCheck className="w-3 h-3" />
            <span>{isEn ? 'Active' : 'مفعّل'}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive dark:bg-destructive/40 dark:text-destructive dark:border-destructive">
            <ShieldAlert className="w-3 h-3" />
            <span>{isEn ? 'Disabled' : 'معطّل'}</span>
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center font-medium tabular-nums text-foreground dark:text-muted-foreground">
        {client.expectedMonthlyOrders ? (
          <span className="inline-flex items-center gap-1">
            <span>{client.expectedMonthlyOrders}</span>
            <span className="text-[11px] text-muted-foreground">{isEn ? '/mo' : 'ش/ش'}</span>
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {client.currentPackage ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
            <Package className="w-3 h-3 text-blue-500" />
            <span className="truncate max-w-[110px]">{client.currentPackage.name}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{isEn ? 'No Package' : 'بدون باقة'}</span>
        )}
      </td>
      <td className="px-4 py-3 text-center font-medium tabular-nums text-foreground dark:text-white">
        {client.metrics?.monthShipments || 0}
      </td>
      <td className="px-4 py-3 text-center font-medium tabular-nums text-warning dark:text-warning">
        {formatCurrency(client.metrics?.pendingCodAmount || 0)}
      </td>
      <td className="px-4 py-3 text-end">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onOpenSummary(client)}
            title={isEn ? 'Performance Summary' : 'ملخص الأداء'}
            className="p-1.5 hover:bg-muted dark:hover:bg-muted rounded text-foreground dark:text-muted-foreground transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenReset(client)}
            title={hasAcc ? (isEn ? 'Reset Password' : 'إعادة تعيين كلمة المرور') : (isEn ? 'Create Portal Account' : 'إنشاء حساب بوابة')}
            className="p-1.5 hover:bg-muted dark:hover:bg-muted rounded text-warning dark:text-warning transition-colors"
          >
            <Key className="w-4 h-4" />
          </button>
          {hasAcc && (
            <button
              onClick={() => onToggleStatus(client)}
              title={isAccActive ? (isEn ? 'Deactivate Account' : 'تعطيل الحساب') : (isEn ? 'Activate Account' : 'تفعيل الحساب')}
              className={`p-1.5 rounded transition-colors ${
                isAccActive
                  ? 'hover:bg-rose-50 text-destructive dark:hover:bg-destructive/40'
                  : 'hover:bg-emerald-50 text-success dark:hover:bg-success/40'
              }`}
            >
              {isAccActive ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
