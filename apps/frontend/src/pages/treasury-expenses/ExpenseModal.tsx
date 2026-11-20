import React, { useState, useEffect, useRef } from "react";
import {
  X,
  AlertTriangle,
  Calendar,
  Building2,
  Tag,
  FileText,
  CheckCircle2,
  Repeat,
  Upload,
  Plus,
  Loader2,
  Image as ImageIcon,
  Clock,
} from "lucide-react";
import {
  TreasuryAccount,
  ExpenseCategory,
  CompanyExpense,
  createExpense,
  updateExpense,
  formatMoney,
} from "./shared";
import CategoryModal from "./CategoryModal";
import uploadService from "../../services/uploadService";
import { toast } from "sonner";
import { DateInput } from '../../components/ui/DateInput';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: TreasuryAccount[];
  categories: ExpenseCategory[];
  expense?: CompanyExpense | null;
  onCategoryCreated?: (newCat?: ExpenseCategory) => void;
  defaultTreasuryAccountId?: string;
}

export default function ExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  categories,
  expense,
  onCategoryCreated,
  defaultTreasuryAccountId,
}: ExpenseModalProps) {
  const isEdit = Boolean(expense);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [treasuryAccountId, setTreasuryAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"OPEX" | "CAPEX">("OPEX");
  const [beneficiary, setBeneficiary] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState<"PAID" | "PENDING">("PAID");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<"MONTHLY" | "WEEKLY" | "YEARLY">("MONTHLY");
  const [notes, setNotes] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (expense) {
      // Edit mode
      setTitle(expense.title || "");
      setAmount(String(expense.amount || ""));
      setTreasuryAccountId(expense.treasuryAccountId || (accounts[0]?.id ?? ""));
      setCategoryId(expense.categoryId || "");
      setType((expense.type as "OPEX" | "CAPEX") || "OPEX");
      setBeneficiary(expense.beneficiary || "");
      setInvoiceNumber(expense.invoiceNumber || "");
      setPaymentDate(
        expense.paymentDate ? new Date(expense.paymentDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
      );
      setStatus((expense.status as "PAID" | "PENDING") || "PAID");
      setIsRecurring(Boolean(expense.isRecurring));
      setRecurringInterval((expense.recurringInterval as any) || "MONTHLY");
      setNotes(expense.notes || "");
      setReceiptUrl(expense.receiptUrl || null);
    } else {
      // Create mode
      setTitle("");
      setAmount("");
      const defaultAcc =
        (defaultTreasuryAccountId ? accounts.find((a) => a.id === defaultTreasuryAccountId) : null) ||
        accounts.find((a) => a.isDefault) ||
        accounts[0];
      setTreasuryAccountId(defaultAcc?.id || "");
      setCategoryId("");
      setType("OPEX");
      setBeneficiary("");
      setInvoiceNumber("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setStatus("PAID");
      setIsRecurring(false);
      setRecurringInterval("MONTHLY");
      setNotes("");
      setReceiptUrl(null);
    }
    setError(null);
  }, [isOpen, expense, accounts, defaultTreasuryAccountId]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setCategoryId(selectedId);
    const cat = categories.find((c) => c.id === selectedId);
    if (cat) {
      setType(cat.type);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      const res = await uploadService.uploadProductImage(file);
      const url = res?.data?.fullUrl || res?.data?.url || (res as any)?.url;
      if (url) {
        setReceiptUrl(url);
        toast.success("تم رفع صورة الإيصال بنجاح");
      } else {
        toast.error("فشل رفع المرفق");
      }
    } catch (err: any) {
      toast.error(err?.message || "فشل رفع الملف");
    } finally {
      setUploadingReceipt(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  const selectedAccount = accounts.find((a) => a.id === treasuryAccountId);
  const parsedAmount = parseFloat(amount) || 0;
  const currentBalance = selectedAccount ? Number(selectedAccount.balance) : 0;
  const isOverdraft = status === "PAID" && parsedAmount > currentBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || parsedAmount <= 0 || !treasuryAccountId) {
      setError("يرجى إدخال اسم النفقة والمبلغ واختيار الخزينة المصروف منها");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        amount: parsedAmount,
        treasuryAccountId,
        categoryId: categoryId || undefined,
        type,
        beneficiary: beneficiary.trim() || undefined,
        invoiceNumber: invoiceNumber.trim() || undefined,
        receiptUrl: receiptUrl || undefined,
        paymentDate: paymentDate || undefined,
        status,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
        notes: notes.trim() || undefined,
      };

      if (isEdit && expense) {
        await updateExpense(expense.id, payload);
        toast.success("تم تحديث بيانات النفقة بنجاح");
      } else {
        await createExpense(payload);
        toast.success("تم تسجيل النفقة بنجاح");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "فشل حفظ النفقة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto" dir="rtl">
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl w-full max-w-xl shadow-2xl overflow-hidden transition-all my-6">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-border bg-muted dark:bg-muted">
            <div>
              <h3 className="text-base font-semibold text-foreground dark:text-muted-foreground flex items-center gap-2">
                <span>{isEdit ? `تعديل النفقة [${expense?.expenseNumber}]` : "تسجيل نفقة / مصروف جديد"}</span>
              </h3>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
                {isEdit ? "تحديث تفاصيل النفقة ومطابقتها مع الحسابات" : "خصم فوري مباشر من الخزينة مع توثيق القيد المالي"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-destructive/10 dark:bg-destructive/40 border border-destructive dark:border-destructive/60 rounded-xl text-xs text-destructive dark:text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Title & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-foreground dark:text-muted-foreground">اسم النفقة / البيان *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء المقر، راتب أحمد، لابتوب..."
                  className="w-full px-3 py-2 text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-border dark:focus:ring-border focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground dark:text-muted-foreground">المبلغ (ج.م) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm font-mono font-medium bg-muted dark:bg-muted border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-border dark:focus:ring-border focus:outline-none"
                />
              </div>
            </div>

            {/* Treasury Account Selection & Overdraft Guard */}
            <div className="p-3.5 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground dark:text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  الخزينة المصروف منها *
                </label>
                {selectedAccount && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-mono font-medium ${
                      currentBalance < 0
                        ? "bg-red-100 text-destructive dark:bg-destructive/60 dark:text-destructive"
                        : isOverdraft
                        ? "bg-amber-100 text-warning dark:bg-warning/60 dark:text-warning"
                        : "bg-emerald-100 text-success dark:bg-success/60 dark:text-success"
                    }`}
                  >
                    الرصيد: {formatMoney(currentBalance, selectedAccount.currency)} {currentBalance < 0 ? "(مكشوف بالسالب)" : ""}
                  </span>
                )}
              </div>

              <select
                value={treasuryAccountId}
                onChange={(e) => setTreasuryAccountId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-muted border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-border dark:focus:ring-border focus:outline-none"
              >
                {accounts.map((acc) => {
                  const bal = Number(acc.balance);
                  return (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — رصيد: {formatMoney(bal, acc.currency)} {bal < 0 ? "(سالب)" : ""}
                    </option>
                  );
                })}
              </select>

              {isOverdraft && (
                <div className="p-2.5 rounded-xl bg-warning/10 dark:bg-warning/30 border border-warning dark:border-warning/60 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning dark:text-warning shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs text-warning dark:text-warning">
                    <p className="font-semibold">تنبيه: سيتم احتساب رصيد الخزينة بالسالب</p>
                    <p className="text-[11px] text-warning dark:text-warning">
                      المبلغ المطلوب ({formatMoney(parsedAmount)}) يتجاوز رصيد الخزينة الحالي ({formatMoney(currentBalance, selectedAccount?.currency)}).
                      سيتم تسجيل النفقة بشكل طبيعي وتحويل الرصيد إلى:{" "}
                      <span className="font-mono font-bold text-destructive dark:text-destructive tabular-nums">
                        {formatMoney(currentBalance - parsedAmount, selectedAccount?.currency)}
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Category with "+ إضافة تصنيف" button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground dark:text-muted-foreground flex items-center gap-1">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    التصنيف
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="text-[11px] text-primary dark:text-primary hover:underline flex items-center gap-0.5 font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>تصنيف جديد</span>
                  </button>
                </div>
                <select
                  value={categoryId}
                  onChange={handleCategoryChange}
                  className="w-full px-3 py-2 text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-border dark:focus:ring-border focus:outline-none"
                >
                  <option value="">بدون تصنيف (عام)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.type === "CAPEX" ? "أصل رأسمالي" : "تشغيلي"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground dark:text-muted-foreground">النوع المحاسبي</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("OPEX")}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all text-center ${
                      type === "OPEX"
                        ? "bg-zinc-900 text-white dark:bg-muted dark:text-foreground border-transparent shadow-sm"
                        : "bg-zinc-50 dark:bg-muted border-border dark:border-border text-foreground dark:text-muted-foreground"
                    }`}
                  >
                    تشغيلي (OPEX)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("CAPEX")}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all text-center ${
                      type === "CAPEX"
                        ? "bg-purple-600 text-white border-transparent shadow-sm"
                        : "bg-zinc-50 dark:bg-muted border-border dark:border-border text-foreground dark:text-muted-foreground"
                    }`}
                  >
                    أصل رأسمالي (CAPEX)
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Status (PAID vs PENDING) */}
            <div className="p-3 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl space-y-1.5">
              <label className="text-xs font-medium text-foreground dark:text-muted-foreground">حالة الصرف والخصم</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus("PAID")}
                  className={`py-1.5 px-2 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    status === "PAID"
                      ? "bg-emerald-50 text-success border-success dark:bg-success/50 dark:text-success dark:border-success shadow-xs"
                      : "bg-white dark:bg-muted border-border dark:border-border text-muted-foreground"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم الصرف والخصم (PAID)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("PENDING")}
                  className={`py-1.5 px-2 text-xs font-medium rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    status === "PENDING"
                      ? "bg-amber-50 text-warning border-warning dark:bg-warning/50 dark:text-warning dark:border-warning shadow-xs"
                      : "bg-white dark:bg-muted border-border dark:border-border text-muted-foreground"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>مستحق ولم يصرف بعد (PENDING)</span>
                </button>
              </div>
              {status === "PENDING" && (
                <p className="text-[10px] text-warning dark:text-warning">
                  ملاحظة: النفقات المعلقة تُسجل في الدفاتر المحاسبية ولا تُخصم من رصيد الخزينة حتى يتم تحويلها إلى مدفوعة.
                </p>
              )}
            </div>

            {/* Beneficiary, Invoice & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground dark:text-muted-foreground">الجهة / المستفيد</label>
                <input
                  type="text"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  placeholder="اسم الموظف أو الشركة"
                  className="w-full px-3 py-2 text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-border dark:focus:ring-border focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground dark:text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3 text-muted-foreground" />
                  رقم الفاتورة / الإيصال
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-12345"
                  className="w-full px-3 py-2 text-sm font-mono bg-muted dark:bg-muted border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-border dark:focus:ring-border focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground dark:text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  تاريخ الصرف
                </label>
                <DateInput
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-border dark:focus:ring-border focus:outline-none"
                />
              </div>
            </div>

            {/* Receipt Upload Zone */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground dark:text-muted-foreground flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                صورة الإيصال أو الفاتورة المرفقة (اختياري)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              {receiptUrl ? (
                <div className="flex items-center justify-between p-2.5 bg-success/10 dark:bg-success/30 border border-success dark:border-success/60 rounded-xl">
                  <div className="flex items-center gap-2">
                    <img
                      src={receiptUrl}
                      alt="Receipt preview"
                      className="w-10 h-10 object-cover rounded-lg border border-success"
                      onError={(e: any) => { e.target.style.display = 'none'; }}
                    />
                    <span className="text-xs font-medium text-success dark:text-success">تم إرفاق الإيصال بنجاح</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReceiptUrl(null)}
                    className="text-xs text-destructive dark:text-destructive hover:underline px-2 py-1"
                  >
                    إزالة المرفق
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingReceipt}
                  className="w-full py-3 px-4 border border-dashed border-border dark:border-border hover:border-border rounded-xl text-xs text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground flex items-center justify-center gap-2 bg-muted dark:bg-muted transition-colors"
                >
                  {uploadingReceipt ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span>جاري رفع صورة الإيصال...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>انقر لرفع صورة الفاتورة أو الإيصال (PNG, JPG, PDF)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Recurring Expense Checkbox */}
            <div className="p-3 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-border text-foreground focus:ring-border w-4 h-4"
                />
                <span className="text-xs font-medium text-foreground dark:text-muted-foreground flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-muted-foreground" />
                  هذه نفقة دورية متكررة (مثل إيجار، مرتبات، اشتراك سنوي)
                </span>
              </label>

              {isRecurring && (
                <div className="mt-2.5 pt-2 border-t border-border dark:border-border flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">التكرار:</span>
                  <select
                    value={recurringInterval}
                    onChange={(e: any) => setRecurringInterval(e.target.value)}
                    className="px-2 py-1 text-xs bg-white dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none"
                  >
                    <option value="MONTHLY">شهرياً (Monthly)</option>
                    <option value="WEEKLY">أسبوعياً (Weekly)</option>
                    <option value="YEARLY">سنوياً (Yearly)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground dark:text-muted-foreground">ملاحظات إضافية (اختياري)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أية تفاصيل إضافية عن الغرض من الصرف أو شروط السداد..."
                className="w-full px-3 py-2 text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-border dark:focus:ring-border focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border dark:border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading || parsedAmount <= 0}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-muted hover:bg-muted dark:bg-muted dark:text-foreground dark:hover:bg-white rounded-xl shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>جاري الحفظ...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isEdit ? "حفظ التعديلات" : "تأكيد الصرف والخصم"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Creation Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={(newCat) => {
          if (newCat) {
            setCategoryId(newCat.id);
            setType(newCat.type);
            onCategoryCreated?.(newCat);
          }
        }}
      />
    </>
  );
}
