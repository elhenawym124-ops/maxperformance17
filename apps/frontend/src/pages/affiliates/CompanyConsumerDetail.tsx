import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
    BuildingStorefrontIcon,
    CurrencyDollarIcon,
    ShoppingBagIcon,
    ArrowPathIcon,
    BanknotesIcon,
    ClockIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { tToast } from "../../utils/i18n-toast";
import tokenManager from "../../utils/tokenManager";

interface AffiliateData {
    id: string;
    totalEarnings: number;
    paidEarnings: number;
    pendingEarnings: number;
    minPayout: number;
    status: string;
    commissionRate: number;
    commissionType: string;
}

interface ProviderInfo {
    id: string;
    name: string;
    logo: string;
    email: string;
}

interface OrderItem {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
    sourceType: string;
}

interface CommissionItem {
    id: string;
    amount: number;
    status: string;
    type: string;
    rate: number | null;
    orderTotal: number;
    createdAt: string;
    orderNumber: string;
    orderStatus: string;
}

interface PayoutItem {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
    notes: string;
    transactionId: string;
    proofFileUrl: string;
    processedAt: string;
    createdAt: string;
}

type TabType = "orders" | "commissions" | "payouts";

const CompanyConsumerDetail: React.FC = () => {
    const { connectionId } = useParams<{ connectionId: string }>();
    const [loading, setLoading] = useState(true);
    const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
    const [provider, setProvider] = useState<ProviderInfo | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>("orders");

    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [ordersTotal, setOrdersTotal] = useState(0);
    const [ordersPage, setOrdersPage] = useState(1);
    const [ordersPages, setOrdersPages] = useState(0);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const [commissions, setCommissions] = useState<CommissionItem[]>([]);
    const [commissionsTotal, setCommissionsTotal] = useState(0);
    const [commissionsPage, setCommissionsPage] = useState(1);
    const [commissionsPages, setCommissionsPages] = useState(0);
    const [commissionsSummary, setCommissionsSummary] = useState({ totalCommissions: 0, paidCommissions: 0, pendingCommissions: 0 });
    const [loadingCommissions, setLoadingCommissions] = useState(false);

    const [payouts, setPayouts] = useState<PayoutItem[]>([]);
    const [payoutsTotal, setPayoutsTotal] = useState(0);
    const [payoutsPage, setPayoutsPage] = useState(1);
    const [payoutsPages, setPayoutsPages] = useState(0);
    const [loadingPayouts, setLoadingPayouts] = useState(false);

    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [paymentDetails, setPaymentDetails] = useState("");
    const [submittingPayout, setSubmittingPayout] = useState(false);

    const loadAffiliate = useCallback(async () => {
        try {
            const resp = await fetch(`/api/v1/company-connections/${connectionId}/consumer/affiliate`, {
                headers: tokenManager.createAuthHeaders()
            });
            const result = await resp.json();
            if (result.success && result.data) {
                setAffiliate(result.data.affiliate);
                setProvider(result.data.provider);
            }
        } catch {
            tToast.error("CompanyConsumerDetail.failed_load_23e0");
        } finally {
            setLoading(false);
        }
    }, [connectionId]);

    const loadOrders = useCallback(async (page: number) => {
        setLoadingOrders(true);
        try {
            const resp = await fetch(`/api/v1/company-connections/${connectionId}/consumer/orders?page=${page}&limit=20`, {
                headers: tokenManager.createAuthHeaders()
            });
            const result = await resp.json();
            if (result.success) {
                setOrders(result.data.orders);
                setOrdersTotal(result.data.total);
                setOrdersPages(result.data.totalPages);
                setOrdersPage(result.data.page);
            }
        } catch {
            tToast.error("CompanyConsumerDetail.failed_load_7101");
        } finally {
            setLoadingOrders(false);
        }
    }, [connectionId]);

    const loadCommissions = useCallback(async (page: number) => {
        setLoadingCommissions(true);
        try {
            const resp = await fetch(`/api/v1/company-connections/${connectionId}/consumer/commissions?page=${page}&limit=20`, {
                headers: tokenManager.createAuthHeaders()
            });
            const result = await resp.json();
            if (result.success) {
                setCommissions(result.data.commissions);
                setCommissionsTotal(result.data.total);
                setCommissionsPages(result.data.totalPages);
                setCommissionsPage(result.data.page);
                setCommissionsSummary(result.data.summary);
            }
        } catch {
            tToast.error("CompanyConsumerDetail.failed_load_569e");
        } finally {
            setLoadingCommissions(false);
        }
    }, [connectionId]);

    const loadPayouts = useCallback(async (page: number) => {
        setLoadingPayouts(true);
        try {
            const resp = await fetch(`/api/v1/company-connections/${connectionId}/consumer/payouts?page=${page}&limit=20`, {
                headers: tokenManager.createAuthHeaders()
            });
            const result = await resp.json();
            if (result.success) {
                setPayouts(result.data.payouts);
                setPayoutsTotal(result.data.total);
                setPayoutsPages(result.data.totalPages);
                setPayoutsPage(result.data.page);
            }
        } catch {
            tToast.error("CompanyConsumerDetail.failed_load_8127");
        } finally {
            setLoadingPayouts(false);
        }
    }, [connectionId]);

    useEffect(() => { loadAffiliate(); }, [loadAffiliate]);
    useEffect(() => { if (activeTab === "orders") loadOrders(1); }, [activeTab, loadOrders]);
    useEffect(() => { if (activeTab === "commissions") loadCommissions(1); }, [activeTab, loadCommissions]);
    useEffect(() => { if (activeTab === "payouts") loadPayouts(1); }, [activeTab, loadPayouts]);

    const handleRequestPayout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentMethod) {
            tToast.error("CompanyConsumerDetail.msg_1641");
            return;
        }
        setSubmittingPayout(true);
        try {
            const resp = await fetch(`/api/v1/company-connections/${connectionId}/consumer/payout-request`, {
                method: "POST",
                headers: tokenManager.createAuthHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({ paymentMethod, paymentDetails })
            });
            const result = await resp.json();
            if (result.success) {
                tToast.success("CompanyConsumerDetail.success_send_161a");
                setShowPayoutModal(false);
                setPaymentMethod("");
                setPaymentDetails("");
                loadAffiliate();
                loadPayouts(1);
                setActiveTab("payouts");
            } else {
                toast.error(result.message || "فشل طلب السحب");
            }
        } catch {
            tToast.error("CompanyConsumerDetail.error_error_9b4a");
        } finally {
            setSubmittingPayout(false);
        }
    };

    const formatPrice = (value: number) => `${value.toLocaleString("ar-EG")} ج.م`;
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("ar-EG");
    const getStatusColor = (status: string) => {
        switch (status) {
            case "CONFIRMED": case "PROCESSED": return "text-green-600 bg-success dark:bg-success/30 dark:text-success";
            case "PENDING": return "text-yellow-600 bg-warning dark:bg-warning/30 dark:text-warning";
            case "PAID": return "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400";
            case "CANCELLED": return "text-red-600 bg-destructive dark:bg-destructive/30 dark:text-destructive";
            default: return "text-gray-600 bg-muted dark:bg-muted dark:text-muted-foreground";
        }
    };
    const getStatusText = (s: string) => {
        switch (s) {
            case "CONFIRMED": return "مؤكدة";
            case "PENDING": return "قيد الانتظار";
            case "PROCESSED": case "PAID": return "تم الدفع";
            case "CANCELLED": return "ملغية";
            case "PROCESSING": return "قيد المعالجة";
            default: return s;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <ArrowPathIcon className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    const canWithdraw = affiliate && affiliate.status === "ACTIVE" && affiliate.pendingEarnings >= (affiliate.minPayout || 100);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="bg-card rounded-xl shadow-sm border border-border dark:border-border p-6">
                <div className="flex items-center justify-between mb-4">
                    <Link to="/company-affiliates" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground">
                        <ArrowLeftIcon className="w-4 h-4" />
                        العودة للشركات المرتبطة
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    {provider?.logo ? (
                        <img src={provider.logo} alt={provider.name} className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-primary dark:bg-primary/40 flex items-center justify-center">
                            <BuildingStorefrontIcon className="w-8 h-8 text-primary" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground">{provider?.name || "المورّد"}</h1>
                        <p className="text-sm text-muted-foreground">{provider?.email}</p>
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-muted-foreground">رصيدك القابل للسحب</p>
                        <p className="text-2xl font-bold text-success">{formatPrice(affiliate?.pendingEarnings || 0)}</p>
                    </div>
                </div>
                {affiliate && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                            <p className="text-xs text-blue-600 dark:text-blue-400">إجمالي الأرباح</p>
                            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatPrice(affiliate.totalEarnings)}</p>
                        </div>
                        <div className="p-3 bg-success/10 dark:bg-success/20 rounded-lg text-center">
                            <p className="text-xs text-success dark:text-success">تم صرفه</p>
                            <p className="text-lg font-bold text-success dark:text-success">{formatPrice(affiliate.paidEarnings)}</p>
                        </div>
                        <div className="p-3 bg-warning/10 dark:bg-warning/20 rounded-lg text-center">
                            <p className="text-xs text-warning dark:text-warning">معلق</p>
                            <p className="text-lg font-bold text-warning dark:text-warning">{formatPrice(affiliate.pendingEarnings)}</p>
                        </div>
                        <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg text-center">
                            <p className="text-xs text-primary dark:text-primary">نسبة العمولة</p>
                            <p className="text-lg font-bold text-primary dark:text-primary">{affiliate.commissionRate}%</p>
                        </div>
                    </div>
                )}
                {canWithdraw && (
                    <button
                        onClick={() => setShowPayoutModal(true)}
                        className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-success hover:bg-success text-white rounded-xl text-sm font-semibold transition"
                    >
                        <BanknotesIcon className="w-5 h-5" />
                        طلب سحب الرصيد
                    </button>
                )}
                {affiliate && affiliate.status !== "ACTIVE" && (
                    <p className="mt-3 text-sm text-warning">حساب المسوق غير نشط. لا يمكن طلب السحب حاليًا.</p>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-muted dark:bg-muted p-1 rounded-xl w-fit">
                {([{ k: "orders", l: "الطلبات", icon: ShoppingBagIcon },
                    { k: "commissions", l: "العمولات", icon: CurrencyDollarIcon },
                    { k: "payouts", l: "طلبات السحب", icon: BanknotesIcon },
                ] as const).map(({ k, l, icon: Icon }) => (
                    <button
                        key={k}
                        onClick={() => setActiveTab(k as TabType)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === k ? "bg-card text-foreground shadow-sm" : "text-gray-500 hover:text-foreground dark:hover:text-muted-foreground"}`}
                    >
                        <Icon className="w-4 h-4" />
                        {l}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-card rounded-xl shadow-sm border border-border dark:border-border">
                {/* Orders Tab */}
                {activeTab === "orders" && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-foreground">الطلبات المرسلة إلى {provider?.name}</h3>
                            <span className="text-sm text-muted-foreground">الإجمالي: {ordersTotal} طلب</span>
                        </div>
                        {loadingOrders ? (
                            <div className="py-12 text-center"><ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>
                        ) : orders.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">لا توجد طلبات</div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right text-sm">
                                        <thead>
                                            <tr className="border-b border-border dark:border-border text-muted-foreground">
                                                <th className="p-3">رقم الطلب</th>
                                                <th className="p-3">الحالة</th>
                                                <th className="p-3">الإجمالي</th>
                                                <th className="p-3">التاريخ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((o) => (
                                                <tr key={o.id} className="border-b border-border dark:border-border hover:bg-muted/50/30">
                                                    <td className="p-3 font-mono text-blue-600 dark:text-blue-400">{o.orderNumber}</td>
                                                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(o.status)}`}>{getStatusText(o.status)}</span></td>
                                                    <td className="p-3 font-bold">{formatPrice(o.total)}</td>
                                                    <td className="p-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {ordersPages > 1 && (
                                    <div className="flex justify-center gap-2 mt-4">
                                        {Array.from({ length: ordersPages }, (_, i) => i + 1).map(p => (
                                            <button key={p} onClick={() => loadOrders(p)} className={`px-3 py-1 rounded-md text-sm ${p === ordersPage ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"}`}>{p}</button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Commissions Tab */}
                {activeTab === "commissions" && (
                    <div className="p-6">
                        {commissionsSummary.totalCommissions > 0 && (
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                                    <p className="text-xs text-blue-600 dark:text-blue-400">الإجمالي</p>
                                    <p className="text-lg font-bold text-blue-600">{formatPrice(commissionsSummary.totalCommissions)}</p>
                                </div>
                                <div className="p-3 bg-success/10 dark:bg-success/20 rounded-lg text-center">
                                    <p className="text-xs text-success dark:text-success">مدفوع</p>
                                    <p className="text-lg font-bold text-success">{formatPrice(commissionsSummary.paidCommissions)}</p>
                                </div>
                                <div className="p-3 bg-warning/10 dark:bg-warning/20 rounded-lg text-center">
                                    <p className="text-xs text-warning dark:text-warning">معلق</p>
                                    <p className="text-lg font-bold text-warning">{formatPrice(commissionsSummary.pendingCommissions)}</p>
                                </div>
                            </div>
                        )}
                        {loadingCommissions ? (
                            <div className="py-12 text-center"><ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>
                        ) : commissions.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">لا توجد عمولات مسجلة</div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right text-sm">
                                        <thead>
                                            <tr className="border-b border-border dark:border-border text-muted-foreground">
                                                <th className="p-3">رقم الطلب</th>
                                                <th className="p-3">قيمة الطلب</th>
                                                <th className="p-3">العمولة</th>
                                                <th className="p-3">الحالة</th>
                                                <th className="p-3">التاريخ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {commissions.map((c) => (
                                                <tr key={c.id} className="border-b border-border dark:border-border hover:bg-muted/50/30">
                                                    <td className="p-3 font-mono text-blue-600 dark:text-blue-400">{c.orderNumber || "—"}</td>
                                                    <td className="p-3">{c.orderTotal ? formatPrice(c.orderTotal) : "—"}</td>
                                                    <td className="p-3 font-bold text-success">+{formatPrice(c.amount)}</td>
                                                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(c.status)}`}>{getStatusText(c.status)}</span></td>
                                                    <td className="p-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {commissionsPages > 1 && (
                                    <div className="flex justify-center gap-2 mt-4">
                                        {Array.from({ length: commissionsPages }, (_, i) => i + 1).map(p => (
                                            <button key={p} onClick={() => loadCommissions(p)} className={`px-3 py-1 rounded-md text-sm ${p === commissionsPage ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"}`}>{p}</button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Payouts Tab */}
                {activeTab === "payouts" && (
                    <div className="p-6">
                        <h3 className="font-bold text-foreground mb-4">سجل طلبات السحب</h3>
                        {loadingPayouts ? (
                            <div className="py-12 text-center"><ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div>
                        ) : payouts.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">لا توجد عمليات سحب سابقة</div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right text-sm">
                                        <thead>
                                            <tr className="border-b border-border dark:border-border text-muted-foreground">
                                                <th className="p-3">التاريخ</th>
                                                <th className="p-3">المبلغ</th>
                                                <th className="p-3">طريقة الدفع</th>
                                                <th className="p-3">الحالة</th>
                                                <th className="p-3">ملاحظات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payouts.map((p) => (
                                                <tr key={p.id} className="border-b border-border dark:border-border hover:bg-muted/50/30">
                                                    <td className="p-3 text-muted-foreground">{formatDate(p.createdAt)}</td>
                                                    <td className="p-3 font-bold">{formatPrice(p.amount)}</td>
                                                    <td className="p-3">{p.paymentMethod || "—"}</td>
                                                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(p.status)}`}>{getStatusText(p.status)}</span></td>
                                                    <td className="p-3 text-muted-foreground text-xs">{p.notes || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {payoutsPages > 1 && (
                                    <div className="flex justify-center gap-2 mt-4">
                                        {Array.from({ length: payoutsPages }, (_, i) => i + 1).map(p => (
                                            <button key={p} onClick={() => loadPayouts(p)} className={`px-3 py-1 rounded-md text-sm ${p === payoutsPage ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"}`}>{p}</button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Payout Modal */}
            {showPayoutModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
                    <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-xl dark:bg-muted sm:rounded-xl">
                        <div className="border-b border-border p-4 dark:border-border sm:p-6">
                            <h3 className="text-lg font-bold text-foreground">طلب سحب رصيد من {provider?.name}</h3>
                        </div>
                        <form onSubmit={handleRequestPayout} className="space-y-4 p-4 sm:p-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">المبلغ</label>
                                <input type="text" value={formatPrice(affiliate?.pendingEarnings || 0)} readOnly className="min-h-11 w-full rounded-xl border border-border bg-muted px-4 py-2 text-foreground dark:border-border dark:bg-muted dark:text-white" />
                                <p className="mt-1 text-xs text-muted-foreground">سيتم سحب كامل الرصيد المتاح ({formatPrice(affiliate?.pendingEarnings || 0)})</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">طريقة الدفع</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} required className="min-h-11 w-full rounded-xl border border-border bg-white px-4 py-2 text-foreground dark:border-border dark:bg-muted dark:text-white">
                                    <option value="">اختر طريقة الدفع</option>
                                    <option value="VODAFONE_CASH">فودافون كاش</option>
                                    <option value="INSTAPAY">إنستاباي</option>
                                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                                    <option value="CASH">كاش / أخرى</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">بيانات التحويل</label>
                                <textarea value={paymentDetails} onChange={(e) => setPaymentDetails(e.target.value)} rows={3} required className="w-full rounded-xl border border-border bg-white px-4 py-2 text-foreground dark:border-border dark:bg-muted dark:text-white" placeholder="رقم المحفظة / الحساب" />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowPayoutModal(false)} className="flex-1 rounded-xl bg-muted px-4 py-2 text-foreground hover:bg-muted dark:bg-muted dark:text-muted-foreground">إلغاء</button>
                                <button type="submit" disabled={submittingPayout} className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">
                                    {submittingPayout ? <ArrowPathIcon className="w-5 h-5 animate-spin mx-auto" /> : "تأكيد الطلب"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyConsumerDetail;
