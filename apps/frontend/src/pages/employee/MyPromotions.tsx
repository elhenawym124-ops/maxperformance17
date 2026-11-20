import React, { useState, useEffect } from "react";
import {
    TrendingUp,
    Calendar,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Info,
    Loader2,
    Award,
    ArrowRight,
    DollarSign,
    Briefcase
} from "lucide-react";
import api from "../../services/api";
import { useTranslation } from "react-i18next";

interface Promotion {
    id: string;
    fromPositionId?: string;
    toPositionId: string;
    fromPositionName?: string;
    toPositionName: string;
    fromSalary?: number;
    toSalary?: number;
    promotionDate: string;
    effectiveDate: string;
    reason: string;
    status: string;
    notes?: string;
    createdAt: string;
    fromPosition?: { title: string };
    toPosition?: { title: string };
}

const PROMOTION_STATUS = {
    PENDING: {
        labelKey: "employee.promotions.pendingStatus",
        color: "bg-yellow-100 text-warning dark:bg-warning/30 dark:text-warning",
        icon: Clock,
    },
    APPROVED: {
        labelKey: "employee.promotions.approvedStatus",
        color: "bg-green-100 text-success dark:bg-success/30 dark:text-success",
        icon: CheckCircle,
    },
    REJECTED: {
        labelKey: "employee.promotions.rejectedStatus",
        color: "bg-red-100 text-destructive dark:bg-destructive/30 dark:text-destructive",
        icon: XCircle,
    }
};

const MyPromotions: React.FC = () => {
    const { t } = useTranslation();
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/hr/my-promotions");
            if (res.data.success) {
                setPromotions(res.data.promotions);
            }
        } catch (error) {
            console.error("Error loading promotions:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount?: number) => {
        if (amount === undefined || amount === null) return "—";
        return new Intl.NumberFormat("ar-EG", {
            style: "currency",
            currency: "EGP",
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ar-EG");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center">
                        <Award className="h-8 w-8 text-primary ms-3" />
                        {t("employee.promotions.title")}
                    </h1>
                    <p className="text-gray-600 dark:text-muted-foreground mt-1">
                        {t("employee.promotions.subtitle")}
                    </p>
                </div>
            </div>

            {/* Promotions List */}
            <div className="space-y-4">
                {promotions.length === 0 ? (
                    <div className="bg-card rounded-xl shadow-sm border border-border dark:border-border p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary mb-4">
                            <TrendingUp className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">
                            {t("employee.promotions.noPromotions")}
                        </h3>
                        <p className="text-gray-600 dark:text-muted-foreground max-w-sm mx-auto">
                            {t("employee.promotions.noPromotionsDesc")}
                        </p>
                    </div>
                ) : (
                    promotions.map((promotion) => {
                        const status = (PROMOTION_STATUS as any)[promotion.status] || PROMOTION_STATUS.PENDING;
                        const StatusIcon = status.icon;

                        return (
                            <div
                                key={promotion.id}
                                className="bg-card rounded-xl shadow-sm border border-border dark:border-border overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                    <StatusIcon className="h-3 w-3 ms-1" />
                                                    {t(status.labelKey)}
                                                </span>
                                                <span className="text-sm text-muted-foreground flex items-center">
                                                    <Clock className="h-4 w-4 ms-1" />
                                                    {t("employee.promotions.promotedOn", { date: formatDate(promotion.promotionDate) })}
                                                </span>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:items-center gap-4 py-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">{t("employee.promotions.previousPosition")}</p>
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center ms-2">
                                                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <span className="text-lg font-semibold text-muted-foreground line-through">
                                                            {promotion.fromPositionName || promotion.fromPosition?.title || t("employee.promotions.noPreviousPosition")}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-center md:rotate-0 rotate-90 my-2 md:my-0">
                                                    <ArrowRight className="h-6 w-6 text-primary" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-primary dark:text-primary mb-1 uppercase tracking-wider">{t("employee.promotions.newPosition")}</p>
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/30 flex items-center justify-center ms-2 font-bold text-primary">
                                                            <Award className="h-4 w-4" />
                                                        </div>
                                                        <span className="text-lg font-bold text-foreground">
                                                            {promotion.toPositionName || promotion.toPosition?.title}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-6 text-sm">
                                                <div className="flex items-center text-foreground dark:text-muted-foreground">
                                                    <DollarSign className="h-4 w-4 ms-1 text-success" />
                                                    <span>{t("employee.promotions.newSalary")}</span>
                                                    <span className="font-bold text-foreground me-1">
                                                        {formatCurrency(promotion.toSalary)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-foreground dark:text-muted-foreground">
                                                    <Calendar className="h-4 w-4 ms-1 text-primary" />
                                                    <span>{t("employee.promotions.effectiveDate")}</span>
                                                    <span className="font-medium me-1">{formatDate(promotion.effectiveDate)}</span>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 dark:bg-muted rounded-lg p-3">
                                                <p className="text-sm text-muted-foreground">
                                                    <span className="font-semibold ms-1">{t("employee.promotions.reason")}</span>
                                                    {promotion.reason}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="lg:border-r lg:pe-6 border-border dark:border-border flex flex-col items-stretch">
                                            <button
                                                onClick={() => {
                                                    setSelectedPromotion(promotion);
                                                    setShowDetailsModal(true);
                                                }}
                                                className="px-4 py-2 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                {t("employee.promotions.viewDetails")}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedPromotion && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-border dark:border-border flex items-center justify-between">
                            <h2 className="text-xl font-bold text-foreground flex items-center">
                                <Info className="h-6 w-6 text-primary ms-2" />
                                {t("employee.promotions.detailsTitle")}
                            </h2>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <XCircle className="h-6 w-6 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{t("employee.promotions.newPosition")}</p>
                                    <p className="text-lg font-bold text-foreground">
                                        {selectedPromotion.toPositionName || selectedPromotion.toPosition?.title}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{t("employee.promotions.previousPosition")}</p>
                                    <p className="text-lg font-medium text-muted-foreground line-through">
                                        {selectedPromotion.fromPositionName || selectedPromotion.fromPosition?.title || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{t("employee.promotions.newSalary")}</p>
                                    <p className="text-lg font-bold text-success dark:text-success">
                                        {formatCurrency(selectedPromotion.toSalary)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{t("employee.promotions.previousSalary")}</p>
                                    <p className="text-lg font-medium text-muted-foreground">
                                        {formatCurrency(selectedPromotion.fromSalary)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{t("employee.promotions.promotionDate")}</p>
                                    <p className="font-medium">{formatDate(selectedPromotion.promotionDate)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{t("employee.promotions.effectiveDateLabel")}</p>
                                    <p className="font-medium text-primary">
                                        {formatDate(selectedPromotion.effectiveDate)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-muted dark:bg-muted rounded-xl">
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-bold">{t("employee.promotions.reason")}</p>
                                    <p className="text-foreground leading-relaxed">
                                        {selectedPromotion.reason}
                                    </p>
                                </div>

                                {selectedPromotion.notes && (
                                    <div className="p-4 bg-primary/50 dark:bg-primary/10 border border-primary dark:border-primary/30 rounded-xl">
                                        <p className="text-xs text-primary dark:text-primary uppercase tracking-widest mb-2 font-bold">{t("employee.promotions.notes")}</p>
                                        <p className="text-foreground leading-relaxed italic">
                                            {selectedPromotion.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-muted dark:bg-muted border-t border-border dark:border-border flex justify-end">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors shadow-xs font-semibold"
                            >
                                {t("employee.common.close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPromotions;
