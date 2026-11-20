import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  DollarSign,
  ArrowRightLeft,
  Plus,
  Wallet,
  Landmark,
  Banknote,
  Briefcase,
  Layers,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  Edit2,
  Download,
  Calendar,
  Receipt,
  ArrowUpDown,
} from "lucide-react";
import {
  TreasuryAccount,
  ExpenseCategory,
  CapitalStats,
  TreasuryTransaction,
  fetchCapitalStats,
  fetchLedger,
  formatMoney,
  exportToCsv,
} from "./shared";
import {
  DepositCapitalModal,
  TransferModal,
  CreateAccountModal,
  EditAccountModal,
} from "./TreasuryModals";
import ExpenseModal from "./ExpenseModal";
import { DateInput } from '../../components/ui/DateInput';

interface TreasuryCapitalTabProps {
  accounts: TreasuryAccount[];
  categories?: ExpenseCategory[];
  onAccountsUpdated: () => void;
  onCategoriesUpdated?: () => void;
}

export default function TreasuryCapitalTab({
  accounts,
  categories = [],
  onAccountsUpdated,
  onCategoriesUpdated,
}: TreasuryCapitalTabProps) {
  const [stats, setStats] = useState<CapitalStats | null>(null);
  const [ledger, setLedger] = useState<TreasuryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Ledger filters
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [datePreset, setDatePreset] = useState<"all" | "today" | "this_week" | "this_month" | "custom">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals state
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TreasuryAccount | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedAccountForExpense, setSelectedAccountForExpense] = useState("");

  const handlePresetChange = (preset: "all" | "today" | "this_week" | "this_month" | "custom") => {
    setDatePreset(preset);
    setPage(1);
    const now = new Date();
    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const todayStr = now.toISOString().split("T")[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "this_week") {
      const d = new Date(now);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      setStartDate(monday.toISOString().split("T")[0]);
      setEndDate(new Date().toISOString().split("T")[0]);
    } else if (preset === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(new Date().toISOString().split("T")[0]);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, ledgerRes] = await Promise.all([
        fetchCapitalStats(),
        fetchLedger({
          treasuryAccountId: selectedAccountId || undefined,
          type: typeFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          sortOrder,
          page,
          limit: 25,
        }),
      ]);

      setStats(statsRes);
      setLedger(ledgerRes.transactions);
      setTotalPages(ledgerRes.totalPages);
      setTotalCount(ledgerRes.totalCount);
    } catch (err) {
      console.error("Failed to load treasury data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, typeFilter, startDate, endDate, sortOrder, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleActionSuccess = () => {
    loadData();
    onAccountsUpdated();
  };

  const handleExportCsv = () => {
    if (ledger.length === 0) return;
    const typeLabel = (t: string) => {
      switch (t) {
        case "DEPOSIT":
          return "إيداع رأس مال";
        case "EXPENSE":
          return "سحب نفقة";
        case "TRANSFER_IN":
          return "تحويل وارد";
        case "TRANSFER_OUT":
          return "تحويل صادر";
        default:
          return t;
      }
    };
    const rows = ledger.map((tx) => ({
      date: tx.date ? new Date(tx.date).toLocaleDateString("ar-EG") : "",
      account: tx.treasuryAccount?.name || "الخزينة",
      type: typeLabel(tx.type),
      description: tx.description || "",
      amount: tx.amount,
      runningBalance: tx.runningBalance,
    }));
    exportToCsv("كشف_حساب_الخزينة_الموحد", rows, [
      { key: "date", label: "التاريخ والوقت" },
      { key: "account", label: "الخزينة / الحساب" },
      { key: "type", label: "نوع الحركة" },
      { key: "description", label: "البيان والتفاصيل" },
      { key: "amount", label: "مبلغ الحركة" },
      { key: "runningBalance", label: "الرصيد بعد الحركة" },
    ]);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "BANK":
        return <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case "WALLET":
        return <Wallet className="w-5 h-5 text-primary dark:text-primary" />;
      case "CUSTODY":
        return <Briefcase className="w-5 h-5 text-warning dark:text-warning" />;
      default:
        return <Banknote className="w-5 h-5 text-success dark:text-success" />;
    }
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Top Telemetry Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Liquid Cash */}
        <div
          className={`bg-white dark:bg-muted border rounded-xl p-3.5 shadow-sm ${
            (stats?.totalLiquidCash || 0) < 0
              ? "border-red-300 dark:border-destructive/60"
              : "border-zinc-200 dark:border-border"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground mb-1">
            <span className="text-xs font-medium">السيولة النقدية الحالية</span>
            <Banknote
              className={`w-4 h-4 ${
                (stats?.totalLiquidCash || 0) < 0 ? "text-red-500" : "text-emerald-600"
              }`}
            />
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold font-mono tabular-nums ${
              (stats?.totalLiquidCash || 0) < 0
                ? "text-red-600 dark:text-destructive"
                : "text-emerald-600 dark:text-success"
            }`}
          >
            {formatMoney(stats?.totalLiquidCash || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {(stats?.totalLiquidCash || 0) < 0
              ? "يوجد عجز في السيولة النقدية (رصيد سالب)"
              : "المجموع الفعلي المتاح في كافة الخزائن والبنوك"}
          </p>
        </div>

        {/* Total Injected Capital */}
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground mb-1">
            <span className="text-xs font-medium">إجمالي رأس المال المودع</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-foreground dark:text-muted-foreground tabular-nums">
            {formatMoney(stats?.totalInjectedCapital || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">{stats?.depositsCount || 0} دفعات تمويل وضخ سيولة</p>
        </div>

        {/* Assets Value (CAPEX) */}
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground mb-1">
            <span className="text-xs font-medium">قيمة الأصول والمعدات</span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-primary dark:text-primary tabular-nums">
            {formatMoney(stats?.totalCapexAssets || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">أجهزة ومعدات ولابتوبات (أصل ثابت)</p>
        </div>

        {/* Total Net Equity */}
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground mb-1">
            <span className="text-xs font-medium">صافي القيمة التشغيلية والأصول</span>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-foreground dark:text-muted-foreground tabular-nums">
            {formatMoney(stats?.netEquityValue || 0)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">السيولة النقدية + الأصول الثابتة المقتناة</p>
        </div>
      </div>

      {/* Section 1: Accounts & Vaults Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground dark:text-muted-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              الخزائن والحسابات البنكية والمحافظ ({accounts.length})
            </h3>
            <p className="text-xs text-muted-foreground">حسابات الشركة المنفصلة وحركات السيولة النقدية اللحظية</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCreateAccountOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border dark:border-border bg-white dark:bg-muted hover:bg-muted dark:hover:bg-muted rounded-xl transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة خزينة / حساب</span>
            </button>
            <button
              onClick={() => setIsTransferOpen(true)}
              disabled={accounts.length < 2}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors disabled:opacity-50"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>تحويل بين الخزائن</span>
            </button>
            <button
              onClick={() => setIsDepositOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-success hover:bg-success rounded-xl shadow-sm transition-all active:scale-[0.97]"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>إيداع رأس مال / تمويل</span>
            </button>
            <button
              onClick={() => {
                setSelectedAccountForExpense(accounts[0]?.id || "");
                setIsExpenseModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-destructive hover:bg-destructive rounded-xl shadow-sm transition-all active:scale-[0.97]"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>تسجيل نفقة / صرف</span>
            </button>
          </div>
        </div>

        {/* Vault Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((acc) => {
            const bal = Number(acc.balance || 0);
            const isNegative = bal < 0;
            return (
              <div
                key={acc.id}
                className={`bg-white dark:bg-muted border rounded-xl p-4 shadow-sm transition-all ${
                  isNegative
                    ? "border-red-300 dark:border-destructive/70 bg-destructive/10 hover:border-destructive dark:hover:border-destructive"
                    : "border-zinc-200/90 dark:border-border hover:border-border dark:hover:border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-muted dark:bg-muted border border-border dark:border-border">
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground dark:text-muted-foreground flex items-center gap-1.5">
                        {acc.name}
                        {acc.isDefault && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted dark:bg-muted text-foreground dark:text-muted-foreground font-normal">
                            الرئيسية
                          </span>
                        )}
                      </h4>
                      <span className="text-[11px] text-muted-foreground">
                        {acc.type === "BANK"
                          ? `بنك ${acc.bankName || "رسمي"}`
                          : acc.type === "WALLET"
                          ? "محفظة إلكترونية"
                          : acc.type === "CUSTODY"
                          ? "عهدة نقدية"
                          : "خزينة كاش"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedAccountForExpense(acc.id);
                        setIsExpenseModalOpen(true);
                      }}
                      title="تسجيل صرف نفقة من هذه الخزينة"
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-destructive dark:text-destructive bg-destructive/10 dark:bg-destructive/40 hover:bg-destructive dark:hover:bg-destructive/40 rounded-lg transition-colors border border-destructive/60 dark:border-destructive/40"
                    >
                      <Receipt className="w-3 h-3" />
                      <span>صرف</span>
                    </button>
                    <button
                      onClick={() => setEditingAccount(acc)}
                      title="تعديل بيانات الحساب"
                      className="p-1.5 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {acc.accountNumber && (
                  <div className="text-[11px] font-mono text-muted-foreground dark:text-muted-foreground mb-3 bg-muted dark:bg-muted px-2 py-1 rounded-lg">
                    رقم الحساب: {acc.accountNumber}
                  </div>
                )}

                <div className="flex items-baseline justify-between pt-2 border-t border-border dark:border-border">
                  <span className="text-xs text-muted-foreground">الرصيد الفعلي:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-lg font-bold font-mono tabular-nums ${
                        isNegative
                          ? "text-red-600 dark:text-destructive"
                          : "text-zinc-900 dark:text-muted-foreground"
                      }`}
                    >
                      {formatMoney(acc.balance, acc.currency)}
                    </span>
                    {isNegative && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-destructive text-destructive dark:bg-destructive/60 dark:text-destructive">
                        سالب / مكشوف
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Audit Ledger & Running Balance */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground dark:text-muted-foreground">
              كشف حساب الخزينة الموحد (Audit Ledger)
            </h3>
            <p className="text-xs text-muted-foreground">سجل تراكمي لحظي لكل حركة مالية (إيداع، سحب، تحويل) مع الرصيد بعد الحركة</p>
          </div>

          {/* Ledger Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedAccountId}
              onChange={(e) => {
                setSelectedAccountId(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-muted border border-border dark:border-border rounded-xl focus:outline-none"
            >
              <option value="">جميع الخزائن</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-white dark:bg-muted border border-border dark:border-border rounded-xl focus:outline-none"
            >
              <option value="">كافة أنواع الحركات</option>
              <option value="DEPOSIT">إيداعات وتغذية</option>
              <option value="EXPENSE">سحب نفقات</option>
              <option value="TRANSFER_IN">تحويلات واردة</option>
              <option value="TRANSFER_OUT">تحويلات صادرة</option>
            </select>

            {/* Date Preset Filter */}
            <div className="inline-flex p-0.5 bg-muted dark:bg-muted rounded-xl border border-border dark:border-border text-xs">
              <button
                type="button"
                onClick={() => handlePresetChange("all")}
                className={`px-2 py-1 rounded-lg transition-all ${
                  datePreset === "all"
                    ? "bg-white dark:bg-muted font-semibold text-foreground dark:text-muted-foreground shadow-sm"
                    : "text-zinc-500 hover:text-foreground dark:hover:text-muted-foreground"
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange("today")}
                className={`px-2 py-1 rounded-lg transition-all ${
                  datePreset === "today"
                    ? "bg-white dark:bg-muted font-semibold text-foreground dark:text-muted-foreground shadow-sm"
                    : "text-zinc-500 hover:text-foreground dark:hover:text-muted-foreground"
                }`}
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange("this_month")}
                className={`px-2 py-1 rounded-lg transition-all ${
                  datePreset === "this_month"
                    ? "bg-white dark:bg-muted font-semibold text-foreground dark:text-muted-foreground shadow-sm"
                    : "text-zinc-500 hover:text-foreground dark:hover:text-muted-foreground"
                }`}
              >
                هذا الشهر
              </button>
              <button
                type="button"
                onClick={() => handlePresetChange("custom")}
                className={`px-2 py-1 rounded-lg transition-all ${
                  datePreset === "custom"
                    ? "bg-white dark:bg-muted font-semibold text-foreground dark:text-muted-foreground shadow-sm"
                    : "text-zinc-500 hover:text-foreground dark:hover:text-muted-foreground"
                }`}
              >
                مخصص
              </button>
            </div>

            {/* Custom Dates if selected */}
            {datePreset === "custom" && (
              <div className="flex items-center gap-1">
                <DateInput
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-2 py-1 text-xs bg-white dark:bg-muted border border-border dark:border-border rounded-xl"
                />
                <span className="text-zinc-400 text-xs">-</span>
                <DateInput
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-2 py-1 text-xs bg-white dark:bg-muted border border-border dark:border-border rounded-xl"
                />
              </div>
            )}

            {/* Sort Direction Toggle */}
            <button
              type="button"
              onClick={() => {
                setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
                setPage(1);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted text-xs font-medium text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition-colors shadow-xs"
              title={
                sortOrder === "desc"
                  ? "الترتيب حالياً: من الأحدث للأقدم (اضغط للتبديل للأقدم أولاً)"
                  : "الترتيب حالياً: من الأقدم للأحدث (اضغط للتبديل للأحدث أولاً)"
              }
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{sortOrder === "desc" ? "الأحدث أولاً" : "الأقدم أولاً"}</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={ledger.length === 0}
              title="تصدير كشف الحساب إلى ملف CSV"
              className="flex items-center gap-1 px-2.5 py-1.5 border border-border dark:border-border rounded-xl text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition-colors text-xs disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span>تصدير CSV</span>
            </button>

            <button
              onClick={loadData}
              title="تحديث كشف الحساب"
              className="p-1.5 border border-border dark:border-border rounded-xl text-muted-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-border dark:border-border bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground font-medium">
                  <th className="py-3 px-4">التاريخ والوقت</th>
                  <th className="py-3 px-4">الخزينة</th>
                  <th className="py-3 px-4">نوع الحركة</th>
                  <th className="py-3 px-4">البيان والتفاصيل</th>
                  <th className="py-3 px-4 text-left">مبلغ الحركة</th>
                  <th className="py-3 px-4 text-left">الرصيد بعد الحركة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border">
                {loading && ledger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                      جاري تحميل كشف الحساب...
                    </td>
                  </tr>
                ) : ledger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                      لا توجد حركات نقدية مسجلة في هذه الفترة
                    </td>
                  </tr>
                ) : (
                  ledger.map((tx) => {
                    const isPositive = Number(tx.amount) > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-zinc-50/70 dark:hover:bg-muted transition-colors">
                        <td className="py-3 px-4 font-mono text-muted-foreground dark:text-muted-foreground text-[11px]">
                          {tx.date
                            ? new Date(tx.date).toLocaleDateString("ar-EG", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="py-3 px-4 font-semibold text-foreground dark:text-muted-foreground">
                          {tx.treasuryAccount?.name || "الخزينة"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                              tx.type === "DEPOSIT"
                                ? "bg-emerald-100 text-success dark:bg-success/60 dark:text-success"
                                : tx.type === "EXPENSE"
                                ? "bg-red-100 text-destructive dark:bg-destructive/60 dark:text-destructive"
                                : tx.type === "TRANSFER_IN"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                : "bg-amber-100 text-warning dark:bg-warning/60 dark:text-warning"
                            }`}
                          >
                            {tx.type === "DEPOSIT"
                              ? "إيداع تمويل +"
                              : tx.type === "EXPENSE"
                              ? "سحب نفقة -"
                              : tx.type === "TRANSFER_IN"
                              ? "تحويل وارد +"
                              : "تحويل صادر -"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-foreground dark:text-muted-foreground max-w-xs truncate">
                          {tx.description}
                        </td>
                        <td
                          className={`py-3 px-4 text-left font-mono font-bold tabular-nums text-xs ${
                            isPositive
                              ? "text-emerald-600 dark:text-success"
                              : "text-red-600 dark:text-destructive"
                          }`}
                        >
                          {isPositive ? `+${formatMoney(tx.amount)}` : formatMoney(tx.amount)}
                        </td>
                        <td
                          className={`py-3 px-4 text-left font-mono font-bold tabular-nums text-xs ${
                            Number(tx.runningBalance) < 0
                              ? "text-red-600 dark:text-destructive font-extrabold"
                              : "text-zinc-900 dark:text-muted-foreground"
                          }`}
                        >
                          {formatMoney(tx.runningBalance)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-border dark:border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>إجمالي الحركات: {totalCount}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2 py-1 rounded border border-border dark:border-border disabled:opacity-40"
                >
                  السابق
                </button>
                <span className="px-2 font-mono">
                  صفحة {page} من {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 py-1 rounded border border-border dark:border-border disabled:opacity-40"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DepositCapitalModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSuccess={handleActionSuccess}
        accounts={accounts}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onSuccess={handleActionSuccess}
        accounts={accounts}
      />

      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
        onSuccess={handleActionSuccess}
      />

      <EditAccountModal
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        onSuccess={handleActionSuccess}
        account={editingAccount}
      />

      {isExpenseModalOpen && (
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSuccess={handleActionSuccess}
          accounts={accounts}
          categories={categories}
          defaultTreasuryAccountId={selectedAccountForExpense}
          onCategoryCreated={onCategoriesUpdated}
        />
      )}
    </div>
  );
}
