// @vitest-environment jsdom
/**
 * Shipping Client — Shipments List (SHIP-W2C)
 * Scoped shipments table with filters and search
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shippingClientApi } from './useShippingClientApi';

const STATUS_FILTERS = [
  { value: 'ALL', label: 'جميع الحالات' },
  { value: 'PENDING', label: 'قيد المراجعة' },
  { value: 'ACCEPTED', label: 'تم القبول' },
  { value: 'OUT_FOR_DELIVERY', label: 'خرج للتوصيل' },
  { value: 'DELIVERED', label: 'تم التسليم' },
  { value: 'RETURNED', label: 'مرتجع' },
  { value: 'CANCELLED', label: 'ملغي' },
];

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'قيد المراجعة', className: 'bg-amber-50 text-warning border-warning' },
  ACCEPTED: { label: 'تم القبول', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  OUT_FOR_DELIVERY: { label: 'خرج للتوصيل', className: 'bg-indigo-50 text-primary border-primary' },
  DELIVERED: { label: 'تم التسليم', className: 'bg-emerald-50 text-success border-success' },
  RETURNED: { label: 'مرتجع', className: 'bg-rose-50 text-destructive border-destructive' },
  CANCELLED: { label: 'ملغي', className: 'bg-gray-100 text-foreground border-border' },
};

export default function ClientShipmentsPage() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchShipments = (page = 1) => {
    setLoading(true);
    const params: Record<string, string> = {
      page: String(page),
      limit: '20',
    };
    if (status !== 'ALL') params.status = status;
    if (search.trim()) params.search = search.trim();
    if (from) params.from = from;
    if (to) params.to = to;

    shippingClientApi
      .getShipments(params)
      .then((res) => {
        setShipments(res.data || []);
        if (res.pagination) setPagination(res.pagination);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'فشل في جلب قائمة الشحنات');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchShipments(1);
  }, [status, from, to]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchShipments(1);
  };

  return (
    <div className="space-y-4 w-full max-w-[1800px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border">
        <div>
          <h1 className="text-lg font-bold text-foreground">سجل الشحنات</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            عرض ومتابعة كافة الطرود المسجلة الخاصة بك
          </p>
        </div>
        <button
          onClick={() => navigate('/client-portal/shipping/new')}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-sm transition-colors self-start sm:self-auto"
        >
          + شحنة جديدة
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg border border-border p-3 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث برقم البوليصة، اسم المستلم، أو الهاتف..."
              className="w-full text-xs px-3 py-1.5 border border-border rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs px-3 py-1.5 border border-border rounded bg-white text-foreground"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Date from */}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-border rounded text-foreground"
            title="من تاريخ"
          />

          {/* Date to */}
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-border rounded text-foreground"
            title="إلى تاريخ"
          />

          <button
            type="submit"
            className="px-3 py-1.5 bg-muted hover:bg-muted text-white text-xs font-medium rounded transition-colors"
          >
            بحث
          </button>
        </form>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded text-destructive text-xs">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground">جاري تحميل الشحنات...</div>
        ) : shipments.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground">
            لم يتم العثور على أي شحنات مطابقة
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-2.5 font-medium">رقم البوليصة</th>
                  <th className="px-4 py-2.5 font-medium">المستلم</th>
                  <th className="px-4 py-2.5 font-medium">الهاتف</th>
                  <th className="px-4 py-2.5 font-medium">المحافظة والعنوان</th>
                  <th className="px-4 py-2.5 font-medium">COD (ج.م)</th>
                  <th className="px-4 py-2.5 font-medium">التكلفة</th>
                  <th className="px-4 py-2.5 font-medium">الحالة</th>
                  <th className="px-4 py-2.5 font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shipments.map((s) => {
                  const statusInfo = STATUS_STYLES[s.status] || {
                    label: s.status,
                    className: 'bg-gray-50 text-foreground border-border',
                  };
                  return (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/client-portal/shipping/shipments/${s.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-medium text-blue-600">
                        {s.trackingNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{s.recipientName}</td>
                      <td className="px-4 py-3 font-mono text-foreground">{s.recipientPhone}</td>
                      <td className="px-4 py-3 text-foreground truncate max-w-[200px]">
                        {s.destinationGovernorate} — {s.destinationAddress}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-foreground">
                        {s.codAmount ? `${s.codAmount.toLocaleString('en-US')}` : '0'}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-foreground">
                        {s.cost} {s.currency || 'EGP'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-foreground">
            <span>
              إجمالي {pagination.total} شحنة — صفحة {pagination.page} من {pagination.totalPages}
            </span>
            <div className="flex gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchShipments(pagination.page - 1)}
                className="px-2.5 py-1 border border-border rounded disabled:opacity-40 hover:bg-muted"
              >
                السابق
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchShipments(pagination.page + 1)}
                className="px-2.5 py-1 border border-border rounded disabled:opacity-40 hover:bg-muted"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
