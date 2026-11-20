import React from "react";
import { useTranslation } from "react-i18next";
import { useDateFormat } from "@/hooks/useDateFormat";
import {
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  DocumentTextIcon,
  TagIcon,
  XMarkIcon,
  PlusIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { CustomerDetailsData } from "./types";
import { DateInput } from '../../../../components/ui/DateInput';

interface CustomerInfoTabProps {
  customer: CustomerDetailsData["customer"];
  customerTags: string[];
  newTag: string;
  onNewTagChange: (val: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  editingBirthday: boolean;
  onEditingBirthdayChange: (val: boolean) => void;
  tempBirthday: string;
  onTempBirthdayChange: (val: string) => void;
  onSaveBirthday: () => void;
}

export const CustomerInfoTab: React.FC<CustomerInfoTabProps> = ({
  customer,
  customerTags,
  newTag,
  onNewTagChange,
  onAddTag,
  onRemoveTag,
  editingBirthday,
  onEditingBirthdayChange,
  tempBirthday,
  onTempBirthdayChange,
  onSaveBirthday,
}) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Contact Info */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground dark:text-white">
          {t("customers.contactInfo")}
        </h3>
        <div className="space-y-3">
          {customer.phone && (
            <div className="flex items-center justify-between text-foreground dark:text-muted-foreground text-sm">
              <div className="flex items-center gap-3">
                <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono tabular-nums">{customer.phone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${customer.phone}`}
                  className="px-2 py-0.5 text-[11px] rounded bg-muted dark:bg-muted text-foreground dark:text-muted-foreground hover:bg-muted"
                >
                  اتصال
                </a>
                <a
                  href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 text-[11px] rounded bg-success/10 text-success dark:text-success hover:bg-success/20"
                >
                  واتساب
                </a>
              </div>
            </div>
          )}

          {customer.whatsappPhone && customer.whatsappPhone !== customer.phone && (
            <div className="flex items-center justify-between text-foreground dark:text-muted-foreground text-sm">
              <div className="flex items-center gap-3">
                <PhoneIcon className="h-4 w-4 text-success" />
                <div>
                  <span className="font-mono tabular-nums">{customer.whatsappPhone}</span>
                  <span className="text-[10px] text-success dark:text-success me-2 font-medium">(رقم الواتساب)</span>
                </div>
              </div>
              <a
                href={`https://wa.me/${customer.whatsappPhone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 text-[11px] rounded bg-success/10 text-success dark:text-success hover:bg-success/20"
              >
                محادثة واتساب
              </a>
            </div>
          )}

          {customer.phone2 && (
            <div className="flex items-center justify-between text-foreground dark:text-muted-foreground text-sm">
              <div className="flex items-center gap-3">
                <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-mono tabular-nums">{customer.phone2}</span>
                  <span className="text-[10px] text-muted-foreground me-2">(رقم بديل)</span>
                </div>
              </div>
              <a
                href={`tel:${customer.phone2}`}
                className="px-2 py-0.5 text-[11px] rounded bg-muted dark:bg-muted text-foreground dark:text-muted-foreground hover:bg-muted"
              >
                اتصال
              </a>
            </div>
          )}

          {customer.email && (
            <div className="flex items-center gap-3 text-foreground dark:text-muted-foreground text-sm">
              <EnvelopeIcon className="h-4 w-4 text-muted-foreground" />
              <span>{customer.email}</span>
            </div>
          )}

          {(customer.address || customer.city || customer.country) && (
            <div className="flex items-center gap-3 text-foreground dark:text-muted-foreground text-sm">
              <MapPinIcon className="h-4 w-4 text-muted-foreground" />
              <span>
                {[customer.address, customer.city, customer.country]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}

          {/* Birthday Inline Editor */}
          <div className="flex items-center gap-3 text-foreground dark:text-muted-foreground text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            {editingBirthday ? (
              <div className="flex gap-2 w-full max-w-xs items-center">
                <DateInput
                  value={tempBirthday}
                  onChange={(e) => onTempBirthdayChange(e.target.value)}
                  className="flex-1 px-3 py-1 border border-border dark:border-border rounded-lg text-xs dark:bg-muted text-foreground dark:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={onSaveBirthday}
                  className="px-3 py-1 bg-muted dark:bg-muted text-white dark:text-foreground rounded-lg text-xs font-medium"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={() => onEditingBirthdayChange(false)}
                  className="px-3 py-1 bg-muted dark:bg-muted text-foreground dark:text-muted-foreground rounded-lg text-xs font-medium"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span>
                  {customer.birthday
                    ? customer.birthday.split("T")[0].split("-").length === 3
                      ? `${customer.birthday.split("T")[0].split("-")[2]}/${customer.birthday.split("T")[0].split("-")[1]}/${customer.birthday.split("T")[0].split("-")[0]}`
                      : customer.birthday
                    : "تاريخ الميلاد غير مسجل"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onTempBirthdayChange(customer.birthday || "");
                    onEditingBirthdayChange(true);
                  }}
                  className="text-zinc-400 hover:text-foreground dark:hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  title="إضافة / تعديل تاريخ الميلاد"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {customer.customerRating && customer.customerRating !== "UNKNOWN" && (
            <div className="flex items-center gap-3 text-foreground dark:text-muted-foreground text-sm">
              <StarIcon className="h-4 w-4 text-warning" />
              <span>التقييم: {customer.customerRating}</span>
            </div>
          )}

          {customer.createdAt && (
            <div className="flex items-center gap-3 text-foreground dark:text-muted-foreground text-sm font-mono tabular-nums">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>عميل منذ {formatDate(customer.createdAt)}</span>
            </div>
          )}

          {customer.updatedAt && (
            <div className="flex items-center gap-3 text-foreground dark:text-muted-foreground text-sm font-mono tabular-nums">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>آخر تحديث {formatDate(customer.updatedAt)}</span>
            </div>
          )}

          {customer.notes ? (
            <div className="flex items-start gap-3 text-foreground dark:text-muted-foreground text-sm">
              <DocumentTextIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span>{customer.notes}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Tags Management */}
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-foreground dark:text-white">
          {t("customers.tagsLabel")}
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {customerTags.length > 0 ? (
            customerTags.map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted dark:bg-muted text-foreground dark:text-muted-foreground rounded-lg text-xs font-medium border border-border dark:border-border group"
              >
                <TagIcon className="h-3 w-3 text-muted-foreground" />
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="ms-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))
          ) : (
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              {t("customers.noTags")}
            </p>
          )}
        </div>

        {/* Add new tag */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => onNewTagChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddTag()}
            placeholder={t("customers.addTagPlaceholder")}
            className="flex-1 px-3 py-2 border border-border dark:border-border rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-border dark:bg-muted text-foreground dark:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onAddTag}
            disabled={!newTag.trim()}
            className="inline-flex items-center px-3 py-2 bg-muted dark:bg-muted text-white dark:text-foreground rounded-lg hover:bg-muted dark:hover:bg-muted disabled:opacity-50 text-xs sm:text-sm font-medium transition-all"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Section: Customer Interests & Work Inquiries — سطح واحد بفواصل (بدون بوكس داخل بوكس) */}
      <div className="md:col-span-2 space-y-4">
        <div className="flex items-center justify-between border-b border-border dark:border-border pb-2">
          <h3 className="text-sm sm:text-base font-semibold text-foreground dark:text-white flex items-center gap-2">
            <span>اهتمامات واستفسارات العميل عن الشغل</span>
          </h3>
          <span className="text-[11px] text-muted-foreground">تفاصيل متطلبات واحتياجات العميل</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Customer Job / Field */}
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground dark:text-muted-foreground block">طبيعة عمل العميل / مجاله:</span>
            <span className="font-semibold text-foreground dark:text-muted-foreground">
              {customer.customerJob || "غير مسجل"}
            </span>
          </div>

          {/* Interests */}
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground dark:text-muted-foreground block">الخدمات والمنتجات المطلوبة:</span>
            <span className="font-semibold text-foreground dark:text-muted-foreground">
              {customer.customerInterests || "غير محدد"}
            </span>
          </div>

          {/* Expected Budget */}
          <div className="space-y-0.5">
            <span className="text-[11px] text-muted-foreground dark:text-muted-foreground block">الميزانية المتوقعة / حجم الطلب:</span>
            <span className="font-semibold text-success dark:text-success tabular-nums">
              {customer.expectedBudget || "غير محدد"}
            </span>
          </div>
        </div>

        {/* Detailed Inquiries */}
        {customer.inquiryDetails ? (
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground dark:text-muted-foreground block">تفاصيل الاستفسار وكل ما سأل عنه العميل:</span>
            <p className="text-zinc-800 dark:text-muted-foreground text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
              {customer.inquiryDetails}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            لا توجد تفاصيل استفسارات مسجلة. يمكنك إضافتها عبر تعديل العميل أو تسجيلها في سجل التواصل.
          </p>
        )}
      </div>

      {/* Section: Pipeline & Follow-Up Quick Summary — سطح واحد بفواصل */}
      <div className="md:col-span-2 space-y-3">
        <div className="flex items-center justify-between border-b border-border dark:border-border pb-2">
          <h3 className="text-sm sm:text-base font-semibold text-foreground dark:text-white">
            مسار المبيعات وموعد المتابعة القادمة
          </h3>
          <span className="text-[11px] text-muted-foreground">حالة المتابعة والجدول الزمني</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground dark:text-muted-foreground block">مرحلة المتابعة:</span>
            <span className="font-semibold text-primary dark:text-primary">
              {customer.leadStage === "NEW_LEAD" && "عميل محتمل جديد"}
              {customer.leadStage === "CONTACTED" && "تم التواصل المبدئي"}
              {customer.leadStage === "INTERESTED" && "مهتم واستفسر عن الخدمات"}
              {customer.leadStage === "FOLLOW_UP_SCHEDULED" && "محدد موعد متابعة"}
              {customer.leadStage === "PROPOSAL_SENT" && "تم إرسال عرض السعر"}
              {customer.leadStage === "NEGOTIATION" && "جاري التفاوض"}
              {customer.leadStage === "CONVERTED" && "تم الاتفاق / عميل مؤكد"}
              {customer.leadStage === "NOT_INTERESTED" && "غير مهتم حالياً"}
              {customer.leadStage === "LOST" && "ملغي / مفقود"}
              {!customer.leadStage && "عميل محتمل (Lead)"}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground dark:text-muted-foreground block">أولوية العميل:</span>
            <span className="font-semibold">
              {customer.leadPriority === "HOT" && "🔥 ساخن (مهتم جداً)"}
              {customer.leadPriority === "WARM" && "⚡ دافئ (متوسط)"}
              {customer.leadPriority === "COLD" && "❄️ بارد (استفسار)"}
              {!customer.leadPriority && "⚡ متوسط"}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground dark:text-muted-foreground block">مصدر العميل:</span>
            <span className="font-semibold text-foreground dark:text-muted-foreground">
              {customer.leadSource === "WHATSAPP" && "واتساب"}
              {customer.leadSource === "FACEBOOK" && "فيسبوك ومسنجر"}
              {customer.leadSource === "INSTAGRAM" && "إنستغرام"}
              {customer.leadSource === "TIKTOK" && "تيك توك"}
              {customer.leadSource === "CALL" && "اتصال هاتفي"}
              {customer.leadSource === "WEBSITE" && "الموقع / المتجر"}
              {customer.leadSource === "REFERRAL" && "ترشيح من عميل"}
              {customer.leadSource === "WALK_IN" && "زيارة مباشرة"}
              {(!customer.leadSource || customer.leadSource === "OTHER") && "أخرى"}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground dark:text-muted-foreground block">المتابعة القادمة:</span>
            <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
              {customer.nextFollowUpDate
                ? new Date(customer.nextFollowUpDate).toLocaleString("ar-EG", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "غير محدد"}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground dark:text-muted-foreground block">قيمة الصفقة:</span>
            <span className="font-semibold text-success dark:text-success tabular-nums">
              {customer.dealValue != null && Number(customer.dealValue) > 0
                ? `${Number(customer.dealValue).toLocaleString("en-US")} ج.م`
                : "غير محددة"}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground dark:text-muted-foreground block">الإغلاق المتوقع:</span>
            <span className="font-semibold text-foreground dark:text-muted-foreground tabular-nums">
              {customer.expectedCloseDate
                ? new Date(customer.expectedCloseDate).toLocaleDateString("ar-EG", {
                    dateStyle: "medium",
                  })
                : "غير محدد"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
