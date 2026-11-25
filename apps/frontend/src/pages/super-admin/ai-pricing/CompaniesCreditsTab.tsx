import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { aiCreditsService, CompanyCreditRow } from '../../../services/aiCreditsService';

export const CompaniesCreditsTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<CompanyCreditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<CompanyCreditRow | null>(null);
  const [delta, setDelta] = useState(500);
  const [reason, setReason] = useState('منحة رصيد من الإدارة');
  const [pricingMode, setPricingMode] = useState<'DEFAULT' | 'UNLIMITED' | 'BYOK_ONLY'>('DEFAULT');
  const [dailyLimit, setDailyLimit] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (q = search) => {
    setLoading(true);
    try {
      const data = await aiCreditsService.getAdminCompanies(q);
      setRows(data);
    } catch {
      toast.error('تعذر تحميل أرصدة الشركات');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openEdit = (row: CompanyCreditRow) => {
    setEditing(row);
    setDelta(0);
    setReason('');
    setPricingMode(row.pricingMode);
    setDailyLimit(row.dailyCreditLimit !== null ? String(row.dailyCreditLimit) : '');
  };

  const handleSaveAdjust = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await aiCreditsService.adjustCompanyCredits(editing.companyId, {
        creditsDelta: Number(delta) || 0,
        reason: reason.trim() || undefined,
        overrides: {
          pricingMode,
          dailyCreditLimit: dailyLimit.trim() === '' ? null : Number(dailyLimit),
        },
      });
      toast.success(`تم تحديث رصيد وإعدادات ${editing.name}`);
      setEditing(null);
      await load(search);
    } catch {
      toast.error('فشل حفظ التعديل');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="بحث باسم الشركة أو البريد..."
            className="h-8 ps-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load(search);
            }}
          />
        </div>
        <Button type="button" size="sm" variant="outline" className="h-8 gap-1" onClick={() => void load(search)}>
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>بحث</span>
        </Button>
      </div>

      {editing && (
        <div className="space-y-3 rounded-lg border border-primary/40 bg-muted/20 p-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">تعديل رصيد وحدود: {editing.name}</span>
            <button type="button" onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground">
              إلغاء
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] text-muted-foreground">تعديل الرصيد (+/- Cr)</label>
              <Input
                type="number"
                className="h-8 font-mono text-xs tabular-nums"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-muted-foreground">وضع الحساب</label>
              <select
                value={pricingMode}
                onChange={(e) => setPricingMode(e.target.value as 'DEFAULT' | 'UNLIMITED' | 'BYOK_ONLY')}
                className="h-8 w-full rounded-md border border-border/70 bg-background px-2 font-mono text-xs"
              >
                <option value="DEFAULT">DEFAULT</option>
                <option value="UNLIMITED">UNLIMITED</option>
                <option value="BYOK_ONLY">BYOK_ONLY</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-muted-foreground">سقف يومي مخصص (Cr)</label>
              <Input
                type="number"
                placeholder="افتراضي المنصة"
                className="h-8 font-mono text-xs tabular-nums"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-muted-foreground">السبب</label>
              <Input
                className="h-8 text-xs"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" size="sm" disabled={saving} onClick={handleSaveAdjust}>
              {saving ? 'جاري الحفظ...' : 'تطبيق التعديل'}
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border/70 text-muted-foreground">
              <th className="py-2 pe-3 text-start font-medium">الشركة</th>
              <th className="py-2 px-2 text-start font-medium">الرصيد المتاح</th>
              <th className="py-2 px-2 text-start font-medium">المستخدم</th>
              <th className="py-2 px-2 text-start font-medium">المفتاح</th>
              <th className="py-2 px-2 text-start font-medium">الوضع</th>
              <th className="py-2 ps-2 text-end font-medium">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {rows.map((r) => (
              <tr key={r.companyId} className="hover:bg-muted/20">
                <td className="py-2.5 pe-3">
                  <div className="font-medium text-foreground">{r.name}</div>
                  {r.email && <div className="font-mono text-[11px] text-muted-foreground">{r.email}</div>}
                </td>
                <td className="py-2.5 px-2 font-mono font-semibold tabular-nums text-primary">
                  {(r.balance + r.includedBalance).toLocaleString('en-US')} Cr
                </td>
                <td className="py-2.5 px-2 font-mono tabular-nums text-muted-foreground">
                  {r.totalUsed.toLocaleString('en-US')} Cr
                </td>
                <td className="py-2.5 px-2 font-mono text-[11px]">
                  {r.byokActive ? 'BYOK' : 'PLATFORM'}
                </td>
                <td className="py-2.5 px-2 font-mono text-[11px]">{r.pricingMode}</td>
                <td className="py-2.5 ps-2 text-end">
                  <Button type="button" size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => openEdit(r)}>
                    تعديل / شحن
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
