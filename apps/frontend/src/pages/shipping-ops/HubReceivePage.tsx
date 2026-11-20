import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScanLine,
  Building2,
  Scale,
  Printer,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingUp,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ShippingBranch,
  getStatusBadge,
  printShipmentLabel,
  formatCurrency,
  formatDate,
} from './shippingOpsShared';

interface ReceivedLogItem {
  id: string;
  trackingNumber: string;
  barcode?: string;
  recipientName: string;
  destinationGovernorate: string;
  actualWeight: number;
  previousWeight?: number;
  priceAdjustment: number;
  receivedAt: Date;
}

export const HubReceivePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const [barcodeInput, setBarcodeInput] = useState('');
  const [actualWeightInput, setActualWeightInput] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branches, setBranches] = useState<ShippingBranch[]>([]);

  const [loading, setLoading] = useState(false);
  const [lastReceived, setLastReceived] = useState<any | null>(null);
  const [lastAdjustment, setLastAdjustment] = useState<number | null>(null);
  const [historyLog, setHistoryLog] = useState<ReceivedLogItem[]>([]);
  const [branchCustodyCount, setBranchCustodyCount] = useState<number | null>(null);

  const token = localStorage.getItem('token');
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetchBranchCustodyCount = useCallback((bId: string) => {
    if (!bId) {
      setBranchCustodyCount(null);
      return;
    }
    fetch(`/api/v1/shipping-portal/branches/${bId}/summary`, { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.summary) {
          setBranchCustodyCount(data.summary.totalShipments);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      fetchBranchCustodyCount(selectedBranchId);
    }
  }, [selectedBranchId, fetchBranchCustodyCount]);

  // Fetch branches on mount
  useEffect(() => {
    fetch('/api/v1/shipping-portal/branches', { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.branches?.length > 0) {
          setBranches(data.branches);
          setSelectedBranchId(data.branches[0].id);
        }
      })
      .catch((e) => console.warn('Branches fetch error:', e));

    barcodeInputRef.current?.focus();
  }, []);

  const handleReceive = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) {
      toast.error('يرجى مسح أو إدخال كود الشحنة أو الباركود');
      barcodeInputRef.current?.focus();
      return;
    }

    setLoading(true);
    try {
      const payload: any = {};
      if (selectedBranchId) payload.branchId = selectedBranchId;
      if (actualWeightInput && !isNaN(parseFloat(actualWeightInput))) {
        payload.actualWeight = parseFloat(actualWeightInput);
      }

      const res = await fetch(`/api/v1/shipping-portal/shipments/${encodeURIComponent(query)}/receive`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.shipment) {
        toast.success(`تم استلام الشحنة ${data.shipment.trackingNumber} في الهاَب وإضافتها لعهدة الفرع بنجاح`);
        if (selectedBranchId) {
          fetchBranchCustodyCount(selectedBranchId);
        }
        setLastReceived(data.shipment);
        setLastAdjustment(data.priceAdjustment || 0);

        // Add to in-session history
        setHistoryLog((prev) => [
          {
            id: data.shipment.id,
            trackingNumber: data.shipment.trackingNumber,
            barcode: data.shipment.barcode,
            recipientName: data.shipment.recipientName || '—',
            destinationGovernorate: data.shipment.destinationGovernorate || '—',
            actualWeight: data.shipment.actualWeight || payload.actualWeight || data.shipment.weight || 1,
            previousWeight: data.shipment.weight,
            priceAdjustment: data.priceAdjustment || 0,
            receivedAt: new Date(),
          },
          ...prev,
        ]);

        // Clear inputs for next scan
        setBarcodeInput('');
        setActualWeightInput('');
        barcodeInputRef.current?.focus();
      } else {
        toast.error(data.error || 'الشحنة غير موجودة أو تعذر استلامها');
      }
    } catch {
      toast.error('حدث خطأ بالاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleReceive();
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1800px] mx-auto text-foreground dark:text-muted-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border dark:border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {isEn ? 'Hub Inward & Sorting Bench' : 'استلام وفرز في الهاَب (Hub Inward)'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isEn
              ? 'Scan barcode (keyboard wedge supported) to record arrival and adjust parcel weight'
              : 'مسح الباركود واستلام الشحنات وتدقيق الوزن الفعلي واحتساب فروق الأسعار آلياً'}
          </p>
        </div>
      </div>

      {/* Main Scanner Bench Card */}
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 sm:p-6 shadow-sm space-y-5">
        <form onSubmit={handleReceive} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-end">
            {/* Barcode Input with Keyboard Wedge Support */}
            <div className="lg:col-span-6 space-y-1">
              <label className="block text-xs font-semibold text-foreground dark:text-muted-foreground">
                {isEn ? 'Barcode / Waybill / Tracking # *' : 'رقم الباركود / رقم البوليصة / التتبع (مسح فوري) *'}
              </label>
              <div className="relative">
                <ScanLine className="w-5 h-5 absolute top-3 rtl:right-3 ltr:left-3 text-blue-600" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  required
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isEn ? 'Scan barcode or enter tracking # and press Enter...' : 'امسح الباركود بالمسدس أو اكتب واضغط Enter...'}
                  className="w-full rtl:pe-10 ltr:ps-10 py-2.5 text-base sm:text-lg font-mono font-bold bg-muted dark:bg-muted border-2 border-blue-200 dark:border-blue-900/60 rounded-xl focus:border-blue-600 dark:focus:border-blue-500 outline-none transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Actual Weight Input */}
            <div className="lg:col-span-3 space-y-1">
              <label className="block text-xs font-semibold text-foreground dark:text-muted-foreground">
                {isEn ? 'Actual Weight (Kg)' : 'الوزن الفعلي (كجم)'}
              </label>
              <div className="relative">
                <Scale className="w-4 h-4 absolute top-3.5 rtl:right-3 ltr:left-3 text-muted-foreground" />
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  value={actualWeightInput}
                  onChange={(e) => setActualWeightInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="مثال: 3.2"
                  className="w-full rtl:pe-9 ltr:ps-9 py-2.5 text-sm font-semibold bg-muted dark:bg-muted border border-border dark:border-border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
                />
              </div>
            </div>

            {/* Receiving Branch Selector */}
            <div className="lg:col-span-3 space-y-1">
              <label className="block text-xs font-semibold text-foreground dark:text-muted-foreground">
                {isEn ? 'Hub / Branch' : 'فرع الاستلام / الهاَب'}
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute top-3.5 rtl:right-3 ltr:left-3 text-muted-foreground" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full rtl:pe-9 ltr:ps-9 py-2.5 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-xl outline-none font-medium"
                >
                  <option value="">{isEn ? 'Auto Main Hub' : 'الهاَب المركزي الرئيسي'}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
              {branchCustodyCount !== null && (
                <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                  <Package className="w-3.5 h-3.5" />
                  <span>عهدة الفرع الحالية: <strong className="font-mono">{branchCustodyCount}</strong> شحنة</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>قارئ الباركود مدعوم تلقائياً (Keyboard wedge) عبر مفتاح Enter</span>
            </span>

            <button
              type="submit"
              disabled={loading || !barcodeInput.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition active:scale-95 disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري الاستلام...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>استلام الطرد وتدقيق الوزن</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Scan Confirmation Banner */}
        {lastReceived && (
          <div className="p-4 bg-success/10 dark:bg-success/40 border border-success dark:border-success rounded-xl space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success text-white rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-success dark:text-success">
                      {lastReceived.trackingNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-success text-success border border-success">
                      تم الاستلام في الهاَب
                    </span>
                  </div>
                  <div className="text-xs text-success dark:text-success mt-0.5">
                    المستلم: {lastReceived.recipientName} ({lastReceived.destinationGovernorate})
                  </div>
                </div>
              </div>

              {/* Price adjustment chip */}
              <div className="flex items-center gap-3">
                {lastAdjustment !== null && lastAdjustment !== 0 && (
                  <div className="px-3 py-1.5 bg-warning dark:bg-warning/40 border border-warning dark:border-warning text-warning dark:text-warning rounded-lg text-xs font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    <span>تعديل السعر: {lastAdjustment > 0 ? `+${lastAdjustment}` : lastAdjustment} ج.م</span>
                  </div>
                )}

                <button
                  onClick={() => printShipmentLabel(lastReceived.id, lastReceived.trackingNumber)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success hover:bg-success text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة البوليصة</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History of Parcels Received this session */}
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl overflow-hidden shadow-sm space-y-2">
        <div className="p-4 border-b border-border dark:border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-bold text-sm sm:text-base">
              {isEn ? 'Recent Inward Parcels (Session)' : 'سجل استلام الشحنات خلال هذه الجلسة'}
            </h2>
            <span className="text-xs font-mono font-bold bg-muted dark:bg-muted px-2 py-0.5 rounded-full">
              {historyLog.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-muted text-xs text-muted-foreground font-semibold border-b border-border dark:border-border">
              <tr>
                <th className="px-4 py-2.5">رقم التتبع</th>
                <th className="px-4 py-2.5">المستلم والمحافظة</th>
                <th className="px-4 py-2.5 text-center">الوزن الفعلي</th>
                <th className="px-4 py-2.5 text-center">فرق السعر</th>
                <th className="px-4 py-2.5">وقت الاستلام</th>
                <th className="px-4 py-2.5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {historyLog.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    لم يتم استلام شحنات بعد في هذه الجلسة. ابدأ بمسح الباركود أعلاه.
                  </td>
                </tr>
              ) : (
                historyLog.map((item, idx) => (
                  <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-muted">
                    <td className="px-4 py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {item.trackingNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground dark:text-muted-foreground">{item.recipientName}</div>
                      <div className="text-[11px] text-muted-foreground">{item.destinationGovernorate}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold tabular-nums">
                      {item.actualWeight} كجم
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      {item.priceAdjustment !== 0 ? (
                        <span className="font-bold text-warning dark:text-warning">
                          {item.priceAdjustment > 0 ? `+${item.priceAdjustment}` : item.priceAdjustment} ج.م
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {item.receivedAt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => printShipmentLabel(item.id, item.trackingNumber)}
                        className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition"
                        title="طباعة البوليصة"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HubReceivePage;
