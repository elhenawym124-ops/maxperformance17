import React, { useEffect, useState } from 'react';
import { Building2, Check, Copy, CreditCard, Loader2, Upload, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/button';
import {
  AiCreditPackage,
  aiCreditsService,
  WalletNumberOption,
} from '../../../services/aiCreditsService';

export type TopupMethod = 'wallet' | 'kashier' | 'receipt';

interface Props {
  packages: AiCreditPackage[];
  companyWalletBalance: number | null;
  onSuccess: () => void;
}

export const CreditTopupPanel: React.FC<Props> = ({ packages, companyWalletBalance, onSuccess }) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(
    packages.find((p) => p.isPopular)?.id || packages[0]?.id || ''
  );
  const [method, setMethod] = useState<TopupMethod>('wallet');
  const [walletNumbers, setWalletNumbers] = useState<WalletNumberOption[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedPkgId && packages.length > 0) {
      setSelectedPkgId(packages.find((p) => p.isPopular)?.id || packages[0].id);
    }
  }, [packages, selectedPkgId]);

  useEffect(() => {
    if (method === 'receipt' && walletNumbers.length === 0) {
      aiCreditsService
        .getWalletNumbers()
        .then((list) => {
          setWalletNumbers(list);
          if (list[0]?.id) setSelectedWalletId(list[0].id);
        })
        .catch(() => {});
    }
  }, [method, walletNumbers.length]);

  const selectedPkg = packages.find((p) => p.id === selectedPkgId) || packages[0];

  const handleConfirm = async () => {
    if (!selectedPkg) {
      toast.error('اختر باقة أولاً');
      return;
    }

    setSubmitting(true);
    try {
      if (method === 'wallet') {
        const res = await aiCreditsService.topupFromWallet(selectedPkg.id);
        toast.success(res.message || 'تم شحن الكريدت من محفظة الشركة');
        onSuccess();
      } else if (method === 'kashier') {
        const session = await aiCreditsService.createKashierTopupSession(selectedPkg.id);
        if (session?.sessionUrl) {
          window.location.href = session.sessionUrl;
        } else {
          toast.error('تعذر بدء جلسة كاشير');
        }
      } else if (method === 'receipt') {
        if (!selectedWalletId) {
          toast.error('اختر رقم المحفظة المحوّل إليها');
          setSubmitting(false);
          return;
        }
        if (!receiptFile) {
          toast.error('ارفع صورة إيصال التحويل');
          setSubmitting(false);
          return;
        }
        const res = await aiCreditsService.submitReceiptTopup(
          selectedPkg.id,
          selectedWalletId,
          receiptFile
        );
        toast.success(res.message || 'تم إرسال الإيصال للمراجعة');
        setReceiptFile(null);
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'تعذر إتمام طلب الشحن');
    } finally {
      setSubmitting(false);
    }
  };

  const copyNum = (numStr: string, label: string) => {
    navigator.clipboard.writeText(numStr).then(() => toast.success(`تم نسخ رقم ${label}`));
  };

  return (
    <div className="space-y-5">
      {/* 1. Package Selection */}
      <div>
        <div className="mb-2.5 text-xs font-semibold text-foreground">1. اختر باقة الكريدت</div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => {
            const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
            const active = selectedPkg?.id === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setSelectedPkgId(pkg.id)}
                className={`flex flex-col justify-between rounded-lg border p-3.5 text-start transition-all active:scale-[0.99] ${
                  active
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border/70 bg-background hover:border-border'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground">{pkg.nameAr}</span>
                    {pkg.isPopular && (
                      <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        الأكثر طلباً
                      </span>
                    )}
                  </div>
                  <div className="mt-2 font-mono text-lg font-bold tabular-nums text-primary">
                    {totalCredits.toLocaleString('en-US')} <span className="text-xs font-normal">Cr</span>
                  </div>
                  {pkg.bonusCredits > 0 && (
                    <div className="mt-0.5 font-mono text-[11px] tabular-nums text-success">
                      +{pkg.bonusCredits.toLocaleString('en-US')} بونص
                    </div>
                  )}
                </div>
                <div className="mt-3 border-t border-border/50 pt-2 font-mono text-sm font-bold tabular-nums text-foreground">
                  {pkg.priceEgp.toLocaleString('en-US')} ج.م
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top-up Payment Method Selector */}
      <div className="border-t border-border/60 pt-4">
        <div className="mb-2.5 text-xs font-semibold text-foreground">2. اختر طريقة الشحن</div>
        <div className="grid gap-2.5 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setMethod('wallet')}
            className={`flex items-start gap-2.5 rounded-lg border p-3 text-start text-xs transition-all ${
              method === 'wallet'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border/70 bg-background hover:border-border'
            }`}
          >
            <Wallet className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <div className="font-semibold text-foreground">محفظة الشركة</div>
              <div className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                المتاح: {companyWalletBalance !== null ? `${companyWalletBalance.toLocaleString('en-US')} ج.م` : '—'}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMethod('kashier')}
            className={`flex items-start gap-2.5 rounded-lg border p-3 text-start text-xs transition-all ${
              method === 'kashier'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border/70 bg-background hover:border-border'
            }`}
          >
            <CreditCard className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <div className="font-semibold text-foreground">دفع أونلاين (كاشير)</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">فيزا / ميزة / محفظة فورية</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMethod('receipt')}
            className={`flex items-start gap-2.5 rounded-lg border p-3 text-start text-xs transition-all ${
              method === 'receipt'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border/70 bg-background hover:border-border'
            }`}
          >
            <Building2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <div className="font-semibold text-foreground">تحويل يدوي + إيصال</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">إنستاباي / فودافون كاش</div>
            </div>
          </button>
        </div>

        {/* Manual Receipt Sub-Panel */}
        {method === 'receipt' && (
          <div className="mt-3 space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs">
            {walletNumbers.length === 0 ? (
              <div className="text-muted-foreground">لا توجد أرقام محافظ مفعلة حالياً من الإدارة</div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {walletNumbers.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWalletId(w.id)}
                    className={`flex cursor-pointer items-center justify-between rounded-md border p-2.5 ${
                      selectedWalletId === w.id ? 'border-primary bg-card' : 'border-border/70 bg-background'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-foreground">{w.name}</div>
                      <div className="font-mono text-xs tabular-nums text-muted-foreground" dir="ltr">
                        {w.number}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyNum(w.number, w.name);
                      }}
                      className="rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label="نسخ الرقم"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border/80 bg-background p-3 text-xs hover:border-primary">
              <Upload className="size-4 text-primary" />
              <span>{receiptFile ? receiptFile.name : 'اختر صورة إيصال التحويل (حد أقصى 5MB)'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        )}
      </div>

      {/* 3. Confirm Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
        <div className="text-xs text-muted-foreground">
          {selectedPkg && (
            <>
              الإجمالي:{' '}
              <span className="font-mono font-bold tabular-nums text-foreground">
                {selectedPkg.priceEgp.toLocaleString('en-US')} ج.م
              </span>{' '}
              مقابل{' '}
              <span className="font-mono font-bold tabular-nums text-primary">
                {(selectedPkg.credits + (selectedPkg.bonusCredits || 0)).toLocaleString('en-US')} Credit
              </span>
            </>
          )}
        </div>
        <Button type="button" disabled={submitting || !selectedPkg} onClick={() => void handleConfirm()} className="gap-1.5">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          <span>
            {method === 'kashier'
              ? 'الانتقال لبوابة الدفع'
              : method === 'receipt'
                ? 'إرسال إيصال التحويل'
                : 'تأكيد الشحن الفوري'}
          </span>
        </Button>
      </div>
    </div>
  );
};
