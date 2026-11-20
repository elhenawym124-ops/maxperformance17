import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDateFormat } from "@/hooks/useDateFormat";
import {
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  CalendarIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { CustomerDetailsData } from "./types";
import { apiClient } from "@/services/apiClient";
import { toast } from "sonner";

interface CustomerFollowUpsTabProps {
  customer: CustomerDetailsData["customer"];
  onReload: () => void;
}

export const CustomerFollowUpsTab: React.FC<CustomerFollowUpsTabProps> = ({
  customer,
  onReload,
}) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [type, setType] = useState("CALL");
  const [outcome, setOutcome] = useState("ANSWERED");
  const [details, setDetails] = useState("");
  const [nextDate, setNextDate] = useState("");

  const followUpLogs = customer.followUpLog || [];

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) {
      toast.error("يرجى كتابة تفاصيل التواصل أو المتابعة");
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.put(`/customers/${customer.id}`, {
        newFollowUpEntry: {
          type,
          outcome,
          details: details.trim(),
          nextFollowUpDate: nextDate || null,
        },
        nextFollowUpDate: nextDate || customer.nextFollowUpDate || undefined,
      });

      toast.success("تم تسجيل عملية التواصل بنجاح");
      setDetails("");
      setNextDate("");
      setShowAddForm(false);
      onReload();
    } catch (err: any) {
      console.error("Error adding follow-up log:", err);
      toast.error(err.response?.data?.message || "فشل في تسجيل المتابعة");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (tName: string) => {
    switch (tName) {
      case "CALL":
        return <PhoneIcon className="h-4 w-4 text-primary" />;
      case "WHATSAPP":
        return <ChatBubbleLeftRightIcon className="h-4 w-4 text-success" />;
      case "VISIT":
        return <UserGroupIcon className="h-4 w-4 text-primary" />;
      case "OFFER":
        return <DocumentTextIcon className="h-4 w-4 text-warning" />;
      case "EMAIL":
        return <EnvelopeIcon className="h-4 w-4 text-destructive" />;
      default:
        return <ClockIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (tName: string) => {
    switch (tName) {
      case "CALL":
        return "اتصال هاتفي";
      case "WHATSAPP":
        return "محادثة واتساب";
      case "VISIT":
        return "اجتماع / زيارة";
      case "OFFER":
        return "تقديم عرض سعر";
      case "EMAIL":
        return "بريد إلكتروني";
      default:
        return "متابعة عامة";
    }
  };

  const getOutcomeBadge = (oName: string) => {
    switch (oName) {
      case "ANSWERED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-success/10 text-success dark:text-success border border-success/20">
            تم الرد والاتفاق
          </span>
        );
      case "FOLLOW_UP":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary dark:text-primary border border-primary/20">
            طلب متابعة لاحقة
          </span>
        );
      case "NO_ANSWER":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-warning/10 text-warning dark:text-warning border border-warning/20">
            لم يرد
          </span>
        );
      case "BUSY":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-warning/10 text-warning dark:text-warning border border-warning/20">
            مشغول
          </span>
        );
      case "NOT_INTERESTED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-destructive/10 text-destructive dark:text-destructive border border-destructive/20">
            غير مهتم
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-muted dark:bg-muted text-foreground dark:text-muted-foreground">
            {oName}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Scheduled Follow-Up */}
        <div className="p-4 rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground text-xs">
            <span>المتابعة القادمة المجدولة</span>
            <CalendarIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm font-bold text-foreground dark:text-muted-foreground font-mono">
            {customer.nextFollowUpDate
              ? new Date(customer.nextFollowUpDate).toLocaleString("ar-EG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })
              : "لا توجد متابعة مجدولة"}
          </div>
          <span className="text-[10px] text-muted-foreground block">
            {customer.nextFollowUpDate ? "محدد موعد للتواصل القادم" : "يمكنك تحديد موعد عبر تسجيل متابعة جديدة"}
          </span>
        </div>

        {/* Preferred Contact Method */}
        <div className="p-4 rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground text-xs">
            <span>طريقة التواصل المفضلة</span>
            <ChatBubbleLeftRightIcon className="h-4 w-4 text-success" />
          </div>
          <div className="text-sm font-bold text-foreground dark:text-muted-foreground">
            {customer.preferredContactMethod === "WHATSAPP" && "رسائل واتساب"}
            {customer.preferredContactMethod === "CALL" && "اتصال هاتفي"}
            {customer.preferredContactMethod === "EMAIL" && "بريد إلكتروني"}
            {!customer.preferredContactMethod && "واتساب"}
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            {customer.whatsappPhone && (
              <a
                href={`https://wa.me/${customer.whatsappPhone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-success dark:text-success hover:underline font-medium"
              >
                محادثة واتساب سريعة
              </a>
            )}
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="text-[10px] text-primary dark:text-primary hover:underline font-medium"
              >
                اتصال الآن
              </a>
            )}
          </div>
        </div>

        {/* Total Interactions Count */}
        <div className="p-4 rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground dark:text-muted-foreground text-xs">
            <span>إجمالي المتابعات والتواصل</span>
            <CheckCircleIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground dark:text-muted-foreground font-mono tabular-nums">
            {followUpLogs.length}
          </div>
          <span className="text-[10px] text-muted-foreground block">
            سجل تواصل موثق مع العميل
          </span>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground dark:text-muted-foreground">
            سجل التواصل والمتابعة التاريخي
          </h3>
          <p className="text-xs text-muted-foreground">
            توثيق جميع المكالمات والرسائل ومواعيد المتابعة مع العميل
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-muted dark:bg-muted text-white dark:text-foreground rounded-lg text-xs font-semibold hover:bg-muted dark:hover:bg-muted transition-all shadow-xs"
        >
          <PlusIcon className="h-4 w-4" />
          <span>{showAddForm ? "إلغاء" : "تسجيل تواصل / متابعة جديدة"}</span>
        </button>
      </div>

      {/* Add Follow-Up Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddFollowUp}
          className="p-5 rounded-xl border border-border dark:border-border bg-muted dark:bg-muted shadow-xs space-y-4"
        >
          <div className="text-xs font-bold text-foreground dark:text-muted-foreground flex items-center gap-1.5 pb-2 border-b border-border dark:border-border">
            <SparklesIcon className="h-4 w-4 text-warning" />
            <span>تسجيل تفاصيل تواصل جديد مع العميل</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 text-xs font-medium text-foreground dark:text-muted-foreground">
                نوع وسيلة التواصل
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-xs text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="CALL">اتصال هاتفي</option>
                <option value="WHATSAPP">محادثة واتساب</option>
                <option value="VISIT">اجتماع / زيارة</option>
                <option value="OFFER">تقديم عرض أسعار</option>
                <option value="EMAIL">بريد إلكتروني</option>
                <option value="NOTE">ملاحظة متابعة</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-foreground dark:text-muted-foreground">
                نتيجة التواصل
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-xs text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ANSWERED">تم الرد والاتفاق</option>
                <option value="FOLLOW_UP">طلب مهلة / متابعة لاحقة</option>
                <option value="NO_ANSWER">لم يرد</option>
                <option value="BUSY">الرقم مشغول</option>
                <option value="NOT_INTERESTED">غير مهتم حالياً</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-foreground dark:text-muted-foreground">
                تحديد موعد المتابعة القادمة (اختياري)
              </label>
              <input
                type="datetime-local"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-primary/40 bg-white dark:bg-muted text-xs text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium text-foreground dark:text-muted-foreground">
              تفاصيل ما تم في التواصل واستفسارات العميل *
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              required
              placeholder="اكتب هنا ما دار في المكالمة أو المحادثة، الأسئلة التي طرحها العميل، وما تم الاتفاق عليه..."
              className="w-full px-3.5 py-2 rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-xs text-foreground dark:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-1.5 rounded-lg border border-border dark:border-border text-xs font-medium hover:bg-muted dark:hover:bg-muted transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !details.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <span>حفظ وتثبيت المتابعة</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Follow-Up History Timeline */}
      {followUpLogs.length > 0 ? (
        <div className="space-y-3">
          {followUpLogs.map((item, index) => (
            <div
              key={item.id || index}
              className="p-4 rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-2xs space-y-2 hover:border-border dark:hover:border-border transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border dark:border-border pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground dark:text-muted-foreground">
                    {getTypeIcon(item.type)}
                    <span>{getTypeLabel(item.type)}</span>
                  </div>
                  {getOutcomeBadge(item.outcome)}
                </div>

                <div className="text-[11px] text-muted-foreground font-mono tabular-nums flex items-center gap-2">
                  {item.author && (
                    <span className="font-sans font-medium text-foreground dark:text-muted-foreground">
                      بواسطة: {item.author}
                    </span>
                  )}
                  <span>•</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-foreground dark:text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {item.details}
              </p>

              {item.nextFollowUpDate && (
                <div className="flex items-center gap-1.5 text-[11px] text-primary dark:text-primary font-medium pt-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>
                    موعد المتابعة التالية:{" "}
                    {new Date(item.nextFollowUpDate).toLocaleString("ar-EG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center rounded-xl border border-dashed border-border dark:border-border bg-muted dark:bg-muted space-y-3">
          <ClockIcon className="h-8 w-8 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground dark:text-muted-foreground">
              لا توجد عمليات تواصل أو متابعة مسجلة حتى الآن
            </h4>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              قم بتوثيق أول مكالمة أو محادثة واتساب مع العميل لتنظيم سجل المبيعات والمتابعة
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span>تسجيل أول متابعة للعميل</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomerFollowUpsTab;
