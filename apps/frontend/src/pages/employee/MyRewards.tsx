import React, { useState, useEffect } from "react";
import {
    Trophy,
    Calendar,
    DollarSign,
    Gift,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    Filter,
    ArrowUpRight,
    TrendingUp,
    Award,
    Info
} from "lucide-react";
import api from "../../services/api";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

interface Reward {
    id: string;
    rewardName: string;
    rewardCategory: string;
    calculatedValue: number;
    periodStart: string;
    periodEnd: string;
    appliedMonth: number;
    appliedYear: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'APPLIED' | 'VOIDED' | 'REJECTED';
    createdAt: string;
    rewardType?: {
        name: string;
        category: string;
    };
}

const REWARD_STATUS: Record<string, { labelKey: string; color: string; icon: React.ElementType }> = {
    PENDING: {
        labelKey: "employee.rewards.pendingStatus",
        color: "bg-yellow-100 text-warning dark:bg-warning/30 dark:text-warning",
        icon: Clock,
    },
    APPROVED: {
        labelKey: "employee.rewards.approvedStatus",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        icon: CheckCircle,
    },
    APPLIED: {
        labelKey: "employee.rewards.paidStatus",
        color: "bg-green-100 text-success dark:bg-success/30 dark:text-success",
        icon: Award,
    },
    REJECTED: {
        labelKey: "employee.rewards.rejectedStatus",
        color: "bg-red-100 text-destructive dark:bg-destructive/30 dark:text-destructive",
        icon: XCircle,
    },
    VOIDED: {
        labelKey: "employee.rewards.cancelledStatus",
        color: "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground",
        icon: AlertCircle,
    }
};

const MyRewards: React.FC = () => {
    const { t } = useTranslation();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/hr/rewards/my-rewards");
            if (res.data.success) {
                setRewards(res.data.data);
            }
        } catch (error) {
            console.error("Error loading rewards:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("ar-EG", {
            style: "currency",
            currency: "EGP",
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("ar-EG");
    };

    const getMonthName = (month: number) => {
        const date = new Date(2024, month - 1, 1);
        return date.toLocaleDateString(i18n.language === "ar" ? "ar-EG" : "en-US", { month: "long" });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalRewards = rewards
        .filter(r => r.status === 'APPLIED' || r.status === 'APPROVED')
        .reduce((sum, r) => sum + r.calculatedValue, 0);

    return (
        <div className="space-y-6 w-full pb-8" dir="rtl">
            {/* Header & Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center">
                        <Trophy className="h-6 w-6 text-warning ms-2" />
                        {t("employee.rewards.title")}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("employee.rewards.subtitle")}
                    </p>
                </div>

                <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-xs text-foreground min-w-[260px]">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-muted-foreground text-xs font-semibold">{t("employee.rewards.totalApproved")}</span>
                            <Gift className="h-6 w-6 text-warning" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground">{formatCurrency(totalRewards)}</div>
                        <div className="mt-2 flex items-center text-muted-foreground text-xs">
                            <TrendingUp className="h-4 w-4 ms-1" />
                            <span>{t("employee.rewards.basedOnRecords")}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 gap-6">
                {rewards.length === 0 ? (
                    <Card className="bg-card border-dashed border-2 p-16 text-center">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-warning/10 dark:bg-warning/20 text-warning dark:text-warning mb-6">
                            <Trophy className="h-12 w-12" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                            {t("employee.rewards.noRewards")}
                        </h3>
                        <p className="text-gray-600 dark:text-muted-foreground max-w-md mx-auto text-lg leading-relaxed">
                            {t("employee.rewards.noRewardsDesc")}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {rewards.map((reward) => {
                            const status = REWARD_STATUS[reward.status] || REWARD_STATUS.PENDING;
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={reward.id}
                                    className="group bg-card rounded-xl shadow-sm border border-border dark:border-border overflow-hidden hover:shadow-xl hover:border-primary dark:hover:border-primary transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    <div className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                            <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1">
                                                <div className="flex-shrink-0">
                                                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary transition-colors">
                                                        <DollarSign className="h-8 w-8 text-primary group-hover:text-white" />
                                                    </div>
                                                </div>

                                                <div className="space-y-2 flex-1">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h3 className="text-xl font-bold text-foreground">
                                                            {reward.rewardName}
                                                        </h3>
                                                        <Badge className={`${status.color} border-none font-bold py-1 px-3`}>
                                                            <StatusIcon className="h-3.5 w-3.5 ms-1.5" />
                                                            {t(status.labelKey)}
                                                        </Badge>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                                        <div className="flex items-center">
                                                            <Calendar className="h-4 w-4 ms-1.5 text-primary" />
                                                            {getMonthName(reward.appliedMonth)} {reward.appliedYear}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <Clock className="h-4 w-4 ms-1.5 text-primary" />
                                                            {t("employee.rewards.date", { date: formatDate(reward.createdAt) })}
                                                        </div>
                                                        {reward.rewardCategory && (
                                                            <div className="flex items-center">
                                                                <Filter className="h-4 w-4 ms-1.5 text-primary" />
                                                                {t("employee.rewards.category", { category: reward.rewardCategory })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 border-t lg:border-t-0 lg:border-r border-border dark:border-border pt-4 lg:pt-0 lg:pe-8">
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-bold">{t("employee.rewards.value")}</p>
                                                    <p className="text-3xl font-black text-success dark:text-success">
                                                        {formatCurrency(reward.calculatedValue)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedReward(reward);
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-muted/40 text-foreground hover:bg-primary hover:text-primary-foreground rounded-xl text-xs font-semibold transition-colors border border-border/70"
                                                >
                                                    <Info className="h-4 w-4" />
                                                    {t("employee.rewards.details")}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {showDetailsModal && selectedReward && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-border dark:border-border bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                                    <Award className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-foreground">
                                        {t("employee.rewards.detailsTitle")}
                                    </h2>
                                    <p className="text-sm text-muted-foreground font-medium">#{selectedReward.id.slice(-8).toUpperCase()}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="p-3 hover:bg-destructive/10 hover:text-destructive text-muted-foreground dark:hover:bg-destructive/20 rounded-xl transition-all duration-200"
                            >
                                <XCircle className="h-7 w-7" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">{t("employee.rewards.rewardName")}</p>
                                    <p className="text-xl font-bold text-foreground">
                                        {selectedReward.rewardName}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">{t("employee.rewards.rewardValue")}</p>
                                    <p className="text-2xl font-black text-success dark:text-success">
                                        {formatCurrency(selectedReward.calculatedValue)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">{t("employee.rewards.period")}</p>
                                    <p className="text-lg font-bold text-foreground">
                                        {getMonthName(selectedReward.appliedMonth)} {selectedReward.appliedYear}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">{t("employee.rewards.recordDate")}</p>
                                    <p className="text-lg font-bold text-foreground">
                                        {formatDate(selectedReward.createdAt)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-6 bg-primary/50 dark:bg-primary/10 border border-primary dark:border-primary/30 rounded-xl">
                                    <p className="text-[10px] text-primary uppercase tracking-[0.2em] font-black mb-3">{t("employee.rewards.reason")}</p>
                                    <p className="text-foreground leading-relaxed text-lg italic">
                                        {selectedReward.reason || t("employee.rewards.noReason")}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center p-4 bg-muted dark:bg-muted rounded-xl border border-border dark:border-border">
                                        <Clock className="h-5 w-5 text-muted-foreground ms-3" />
                                        <span className="text-gray-500 ms-2">{t("employee.rewards.currentStatus")}</span>
                                        <span className="font-bold text-foreground">
                                            {t(REWARD_STATUS[selectedReward.status]?.labelKey || "employee.rewards.pendingStatus")}
                                        </span>
                                    </div>
                                    <div className="flex items-center p-4 bg-muted dark:bg-muted rounded-xl border border-border dark:border-border">
                                        <Filter className="h-5 w-5 text-muted-foreground ms-3" />
                                        <span className="text-gray-500 ms-2">{t("employee.rewards.categoryLabel")}</span>
                                        <span className="font-bold text-foreground">
                                            {selectedReward.rewardCategory}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-muted dark:bg-muted border-t border-border dark:border-border flex justify-end gap-4">
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

export default MyRewards;
