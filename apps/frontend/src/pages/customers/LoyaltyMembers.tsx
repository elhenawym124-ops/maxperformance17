import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../services/apiClient";
import {
  Users,
  Search,
  Filter,
  Star,
  Crown,
  Medal,
  Gem,
  Trophy,
  Award,
  Eye,
  Edit,
  RefreshCw,
  Gift,
  DollarSign,
  Plus,
  Send,
} from "lucide-react";
import { customerService, Customer } from "../../services/customerService";

interface CustomerLoyaltyProgram {
  id: string;
  name: string;
  nameAr?: string;
  type: "POINTS" | "TIER" | "CASHBACK" | "REFERRAL";
}

interface CustomerLoyaltyTier {
  id: string;
  name: string;
  nameAr?: string;
  color: string;
  icon: string;
}

interface CustomerLoyaltyRecord {
  id: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  program: CustomerLoyaltyProgram;
  currentPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  tier?: CustomerLoyaltyTier;
  joinDate: string;
  lastActivity: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

const LoyaltyMembers: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerLoyaltyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<CustomerLoyaltyRecord | null>(null);
  const [adjustmentPoints, setAdjustmentPoints] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enroll Modal state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [availablePrograms, setAvailablePrograms] = useState<CustomerLoyaltyProgram[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [initialPoints, setInitialPoints] = useState<number>(0);
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [sendingCardId, setSendingCardId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await apiClient.get("/hr/customer-loyalty/programs");
      // filter only active points/tier programs
      const activePrograms = (res.data.data || []).filter((p: any) => p.status === 'ACTIVE' && (p.type === 'POINTS' || p.type === 'TIER'));
      setAvailablePrograms(activePrograms);
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  const loadCustomers = async (
    targetPage: number,
    targetSearch: string,
    targetPageSize: number = pageSize,
  ) => {
    try {
      setIsLoading(true);
      const res = await apiClient.get("/hr/customer-loyalty/customers", {
        params: {
          page: targetPage,
          pageSize: targetPageSize,
          ...(targetSearch.trim() ? { search: targetSearch.trim() } : {}),
        },
      });
      const data = res.data.data;
      if (data && Array.isArray(data.records)) {
        setCustomers(data.records);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        // Backward compatible with the legacy array shape
        setCustomers(data);
        setTotal(data.length);
        setTotalPages(1);
      } else {
        setCustomers([]);
        setTotal(0);
        setTotalPages(1);
      }
      setPage(targetPage);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced server-side search (resets to first page)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers(1, searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCustomers = () => loadCustomers(page, searchQuery);

  // Search customers for enrollment
  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (customerSearch.trim().length >= 2) {
        setIsSearching(true);
        try {
          // You could use searchCustomers if supported, or getCustomers with search filter
          const res = await customerService.getCustomers({ search: customerSearch, limit: 10 });
          setSearchResults(res.data || []);
        } catch (error) {
          console.error("Error searching customers:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [customerSearch]);

  const handleEnrollCustomer = async () => {
    if (!selectedCustomerId || !selectedProgramId) return;

    try {
      setIsEnrolling(true);
      await apiClient.post("/hr/customer-loyalty/enroll", {
        customerId: selectedCustomerId,
        programId: selectedProgramId,
        initialPoints: initialPoints || 0
      });

      // Cleanup & Refresh
      setIsEnrollModalOpen(false);
      setSelectedCustomerId("");
      setSelectedProgramId("");
      setInitialPoints(0);
      setCustomerSearch("");
      setSearchResults([]);
      fetchCustomers();
    } catch (error: any) {
      console.error("Error enrolling customer:", error);
      alert(error?.response?.data?.error || "فشل تسجيل العميل. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleSendCard = async (record: CustomerLoyaltyRecord) => {
    if (!record?.customer?.id) return;
    setSendingCardId(record.id);
    try {
      const res = await apiClient.post<{
        data?: { send?: { success?: boolean; reason?: string } };
      }>(
        `/hr/customer-loyalty/customers/${record.customer.id}/card/send`,
        {},
        { params: { programId: record.program.id } },
      );
      const send = res.data?.data?.send;
      if (send?.success) {
        alert("تم إرسال كارت العضوية للعميل على واتساب 🎖️");
      } else {
        alert(
          send?.reason === "no_baileys_session"
            ? "لا توجد جلسة واتساب متصلة لإرسال الصورة"
            : "تعذر إرسال الكارت — تحقق من رقم الهاتف وجلسة الواتساب",
        );
      }
    } catch (error) {
      console.error("Error sending card:", error);
      const err = error as { response?: { data?: { error?: string } } };
      alert(err?.response?.data?.error || "فشل إرسال كارت العضوية");
    } finally {
      setSendingCardId(null);
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedRecord || adjustmentPoints === 0) return;

    try {
      setIsSubmitting(true);
      await apiClient.post("/hr/customer-loyalty/adjust-points", {
        customerId: selectedRecord.customer.id,
        programId: selectedRecord.program.id,
        points: adjustmentPoints,
        reason: adjustmentReason,
      });

      // Success
      setIsAdjustModalOpen(false);
      setAdjustmentPoints(0);
      setAdjustmentReason("");
      fetchCustomers(); // Refresh list
    } catch (error: any) {
      console.error("Error adjusting points:", error);
      alert(error?.response?.data?.error || "فشل تعديل النقاط. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgramIcon = (type: string) => {
    switch (type) {
      case "POINTS":
        return <Star className="w-4 h-4" />;
      case "TIER":
        return <Crown className="w-4 h-4" />;
      case "CASHBACK":
        return <DollarSign className="w-4 h-4" />;
      case "REFERRAL":
        return <Users className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getTierIcon = (iconName: string) => {
    switch (iconName) {
      case "crown":
        return <Crown className="w-4 h-4" />;
      case "medal":
        return <Medal className="w-4 h-4" />;
      case "gem":
        return <Gem className="w-4 h-4" />;
      case "trophy":
        return <Trophy className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-success dark:bg-success/30 dark:text-success";
      case "INACTIVE":
        return "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground";
      case "SUSPENDED":
        return "bg-red-100 text-destructive dark:bg-destructive/30 dark:text-destructive";
      default:
        return "bg-gray-100 text-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            أعضاء الولاء
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            قائمة العملاء المشتركين في برامج النقاط والمكافآت
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            إضافة عضو
          </button>
          <button
            onClick={fetchCustomers}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted/50"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="البحث باسم العميل، البريد، أو الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pe-10 ps-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 bg-card shadow-sm">
          <Filter className="w-4 h-4" />
          فلترة متقدمة
        </button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border dark:border-border overflow-hidden shadow-sm">
        {customers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              لا يوجد عملاء
            </h3>
            <p className="text-muted-foreground">
              لا توجد نتائج تطابق بحثك
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border dark:divide-border">
              <thead className="bg-gray-50 dark:bg-muted">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    العميل
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    البرنامج
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    النقاط
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    المستوى
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    آخر نشاط
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border dark:divide-border">
                {customers.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-muted/50/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div>
                        <div className="font-medium text-foreground">
                          {record.customer.firstName} {record.customer.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {record.customer.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-sm text-foreground">
                          {record.program.nameAr || record.program.name}
                        </span>
                        <span className="p-1 rounded bg-muted">
                          {getProgramIcon(record.program.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="font-bold text-foreground">
                          {record.currentPoints.toLocaleString()}
                        </span>
                        <Star className="w-4 h-4 text-warning fill-warning" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {record.tier ? (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-sm font-medium text-foreground">
                            {record.tier.nameAr || record.tier.name}
                          </span>
                          <span style={{ color: record.tier.color }}>
                            {getTierIcon(record.tier.icon)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(record.status)}`}
                      >
                        {record.status === "ACTIVE"
                          ? "نشط"
                          : record.status === "INACTIVE"
                            ? "غير نشط"
                            : "معلق"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-muted-foreground">
                      {new Date(record.lastActivity).toLocaleDateString(
                        "ar-EG",
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex gap-3 justify-end">
                        <Link
                          to={`/customers/${record.customer.id}`}
                          className="text-gray-400 hover:text-primary transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setIsAdjustModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-primary transition-colors"
                          title="تعديل الرصيد"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {record.tier ? (
                          <button
                            onClick={() => handleSendCard(record)}
                            disabled={sendingCardId === record.id}
                            className="text-gray-400 hover:text-success transition-colors disabled:opacity-50 disabled:cursor-wait"
                            title="إرسال كارت العضوية"
                          >
                            <Send className={`w-4 h-4 ${sendingCardId === record.id ? "animate-pulse" : ""}`} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-border dark:border-border bg-muted dark:bg-muted">
          <div className="text-sm text-muted-foreground">
            عرض{" "}
            <span className="font-semibold text-foreground">
              {customers.length.toLocaleString()}
            </span>{" "}
            من{" "}
            <span className="font-semibold text-foreground">
              {total.toLocaleString()}
            </span>{" "}
            عميل
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => {
                const nextSize = Number(e.target.value);
                setPageSize(nextSize);
                loadCustomers(1, searchQuery, nextSize);
              }}
              className="px-2 py-1.5 border border-border rounded-lg bg-card text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              {[10, 25, 50, 100].map((s) => (
                <option key={s} value={s}>
                  {s} / صفحة
                </option>
              ))}
            </select>
            <button
              onClick={() => loadCustomers(page - 1, searchQuery)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm font-medium text-foreground border border-border rounded-lg bg-card hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              السابق
            </button>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              صفحة {page} من {Math.max(totalPages, 1)}
            </span>
            <button
              onClick={() => loadCustomers(page + 1, searchQuery)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm font-medium text-foreground border border-border rounded-lg bg-card hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              التالي
            </button>
          </div>
        </div>
      </div>

      {/* Adjustment Modal */}
      {isAdjustModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md border border-border dark:border-border overflow-hidden">
            <div className="p-6 border-b border-border dark:border-border bg-muted dark:bg-muted">
              <h3 className="text-lg font-bold text-foreground text-right">
                تعديل نقاط العميل
              </h3>
              <p className="text-sm text-muted-foreground text-right mt-1">
                العميل: <span className="font-semibold text-foreground">{selectedRecord.customer.firstName} {selectedRecord.customer.lastName}</span>
              </p>
              <p className="text-sm text-muted-foreground text-right mt-1">
                البرنامج: <span className="font-semibold text-foreground">{selectedRecord.program.nameAr || selectedRecord.program.name}</span>
              </p>
              <div className="mt-4 flex items-center justify-between p-3 bg-white dark:bg-muted rounded-lg border border-border dark:border-border">
                <span className="text-sm font-medium text-foreground dark:text-muted-foreground">الرصيد الحالي:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-foreground">
                    {selectedRecord.currentPoints.toLocaleString()}
                  </span>
                  <Star className="w-5 h-5 text-warning fill-warning" />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground text-right mb-2">
                  مقدار النقاط للتعديل
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAdjustmentPoints(prev => Math.abs(prev) * -1)}
                    className={`flex-1 flex justify-center items-center py-2.5 rounded-lg border transition-all ${adjustmentPoints < 0 
                      ? 'bg-red-50 border-destructive text-destructive dark:bg-destructive/30' 
                      : 'border-gray-300 text-foreground hover:bg-muted dark:border-border dark:text-muted-foreground dark:hover:bg-muted'}`}
                  >
                    خصم نقاط
                  </button>
                  <button
                    onClick={() => setAdjustmentPoints(prev => Math.abs(prev))}
                    className={`flex-1 flex justify-center items-center py-2.5 rounded-lg border transition-all ${adjustmentPoints >= 0 
                      ? 'bg-green-50 border-success text-success dark:bg-success/30' 
                      : 'border-gray-300 text-foreground hover:bg-muted dark:border-border dark:text-muted-foreground dark:hover:bg-muted'}`}
                  >
                    إضافة نقاط
                  </button>
                </div>
                
                <div className="mt-3">
                  <input
                    type="number"
                    min="0"
                    placeholder="أدخل عدد النقاط..."
                    value={Math.abs(adjustmentPoints) || ''}
                    onChange={(e) => {
                      const val = Math.abs(Number(e.target.value));
                      setAdjustmentPoints(adjustmentPoints < 0 ? -val : val);
                    }}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-white dark:bg-muted text-foreground text-right focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium"
                  />
                  {adjustmentPoints < 0 && Math.abs(adjustmentPoints) > selectedRecord.currentPoints && (
                    <p className="mt-1.5 text-xs text-destructive text-right">
                      تنبيه: لا يمكن خصم نقاط أكثر من الرصيد الحالي للعميل!
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground text-right mb-1">
                  سبب التعديل (إلزامي)
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-white dark:bg-muted text-foreground text-right focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none min-h-[100px]"
                  placeholder="الرجاء كتابة سبب التعديل بوضوح..."
                />
              </div>
            </div>

            <div className="p-6 bg-muted dark:bg-muted flex justify-between items-center rounded-b-xl border-t border-border dark:border-border">
              <div className="text-sm font-medium">
                 صافي الرصيد بعد العملية: 
                 <span className={`me-2 font-bold ${(selectedRecord.currentPoints + adjustmentPoints) < 0 ? 'text-red-500' : 'text-primary'}`}>
                   {(selectedRecord.currentPoints + (adjustmentPoints || 0)).toLocaleString()}
                 </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsAdjustModalOpen(false);
                    setAdjustmentPoints(0);
                    setAdjustmentReason("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors border border-border"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleAdjustPoints}
                  disabled={isSubmitting || adjustmentPoints === 0 || !adjustmentReason.trim() || (adjustmentPoints < 0 && Math.abs(adjustmentPoints) > selectedRecord.currentPoints)}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all shadow-sm"
                >
                  {isSubmitting ? "جاري الحفظ..." : "تأكيد التعديل"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Enroll Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md border border-border dark:border-border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border dark:border-border bg-muted dark:bg-muted">
              <h3 className="text-lg font-bold text-foreground text-right">
                إضافة عضو جديد للولاء
              </h3>
              <p className="text-sm text-muted-foreground text-right mt-1">
                ابحث عن العميل وسجله في أحد برامج النقاط أو المستويات النشطة
              </p>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Customer Search */}
              <div>
                <label className="block text-sm font-medium text-foreground text-right mb-2">
                  العميل
                </label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setSelectedCustomerId("");
                    }}
                    placeholder="ابحث بالاسم أو الهاتف..."
                    className="w-full pe-10 ps-4 py-2.5 border border-border rounded-lg bg-white dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                  />
                  {/* Search Results Dropdown */}
                  {customerSearch.trim().length >= 2 && !selectedCustomerId && (
                    <div className="absolute z-10 w-full mt-1 bg-card border border-border dark:border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">جاري البحث...</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setCustomerSearch(`${c.firstName} ${c.lastName}`);
                              setSearchResults([]);
                            }}
                            className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border dark:border-border last:border-0 text-right"
                          >
                            <div className="font-medium text-foreground">{c.firstName} {c.lastName}</div>
                            <div className="text-xs text-muted-foreground">{c.phone || c.email}</div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">لا يوجد نتائج</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Program Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground text-right mb-2">
                  برنامج الولاء
                </label>
                <select
                  value={selectedProgramId}
                  onChange={(e) => setSelectedProgramId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-white dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-right"
                  dir="rtl"
                >
                  <option value="">-- اختر البرنامج --</option>
                  {availablePrograms.map(p => (
                    <option key={p.id} value={p.id}>{p.nameAr || p.name}</option>
                  ))}
                </select>
              </div>

              {/* Initial Points */}
              <div>
                <label className="block text-sm font-medium text-foreground text-right mb-2">
                  رصيد افتتاحي (اختياري)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={initialPoints || ''}
                    onChange={(e) => setInitialPoints(Number(e.target.value))}
                    className="w-full pe-4 ps-10 py-2.5 border border-border rounded-lg bg-white dark:bg-muted text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-right font-medium"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Star className="w-5 h-5 text-warning fill-warning opacity-50" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-muted dark:bg-muted flex justify-end items-center rounded-b-xl border-t border-border dark:border-border gap-3">
              <button
                onClick={() => {
                  setIsEnrollModalOpen(false);
                  setSelectedCustomerId("");
                  setSelectedProgramId("");
                  setInitialPoints(0);
                  setCustomerSearch("");
                }}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors border border-border"
              >
                إلغاء
              </button>
              <button
                onClick={handleEnrollCustomer}
                disabled={isEnrolling || !selectedCustomerId || !selectedProgramId}
                className="px-5 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all shadow-sm"
              >
                {isEnrolling ? "جاري التسجيل..." : "تأكيد التسجيل"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyMembers;
