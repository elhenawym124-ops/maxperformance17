import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  PhoneIcon,
  ExclamationCircleIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { WhatsAppIcon } from "../../../../components/icons/brands";
import { OrderCallButton } from "../../../../components/telephony/OrderCallButton";
import { validateEgyptianPhone, toStandardDigits } from "../../../../utils/validation";
import { OrderDetailsType } from "../types";

interface CustomerContactSectionProps {
  order: OrderDetailsType;
  isEditing: boolean;
  editForm: any;
  setEditForm: (form: any) => void;
}

export const CustomerContactSection: React.FC<CustomerContactSectionProps> = ({
  order,
  isEditing,
  editForm,
  setEditForm,
}) => {
  const { t } = useTranslation();
  const [phoneErrors, setPhoneErrors] = useState<{
    main?: string;
    alternative?: string;
  }>({});
  const [copiedPhoneKey, setCopiedPhoneKey] = useState<"main" | "alt" | null>(null);

  const handleCopyPhone = (rawPhone: string, key: "main" | "alt") => {
    const clean = toStandardDigits(rawPhone);
    if (!clean) return;
    navigator.clipboard?.writeText(clean);
    setCopiedPhoneKey(key);
    toast.success("تم نسخ رقم الهاتف");
    setTimeout(() => setCopiedPhoneKey(null), 1800);
  };

  const handlePhoneChange = (
    field: "customerPhone" | "alternativePhone",
    value: string,
  ) => {
    setEditForm({ ...editForm, [field]: value });

    if (value.trim() !== "") {
      const validation = validateEgyptianPhone(value);
      if (!validation.isValid) {
        setPhoneErrors((prev) => ({
          ...prev,
          [field === "customerPhone" ? "main" : "alternative"]:
            validation.error,
        }));
      } else {
        setPhoneErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field === "customerPhone" ? "main" : "alternative"];
          return newErrors;
        });
      }
    } else {
      setPhoneErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field === "customerPhone" ? "main" : "alternative"];
        return newErrors;
      });
    }
  };

  const getWhatsAppChatUrl = (phone?: string | null) => {
    if (!phone) return null;
    let cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.startsWith("01") && cleanPhone.length === 11) {
      cleanPhone = "2" + cleanPhone;
    }
    const params = new URLSearchParams();
    params.set("phone", cleanPhone);
    if (order.customerName) {
      params.set("name", order.customerName);
    }
    if (order.orderNumber) {
      params.set("orderNumber", order.orderNumber);
    }
    if (order.conversationId) {
      params.set("conversationId", order.conversationId);
    }
    return `/whatsapp?${params.toString()}`;
  };

  return (
    <>
      <div>
        <label className={isEditing ? "text-xs font-medium text-muted-foreground block mb-1" : "sr-only"}>
          {t("orderDetails.nameLabel")}
        </label>
        {isEditing ? (
          <input
            type="text"
            value={editForm.customerName}
            onChange={(e) =>
              setEditForm({ ...editForm, customerName: e.target.value })
            }
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base sm:text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
          />
        ) : (
          <p className="text-sm sm:text-base font-semibold text-foreground break-words">
            {order.customerName || t("orders.notSpecified")}
          </p>
        )}
      </div>

      <div>
        <label className={isEditing ? "text-xs font-medium text-muted-foreground block mb-1" : "sr-only"}>
          {t("orderDetails.phoneLabel")}
        </label>
        {isEditing ? (
          <div>
            <input
              type="text"
              value={editForm.customerPhone}
              onChange={(e) =>
                handlePhoneChange("customerPhone", e.target.value)
              }
              className={`w-full rounded-lg border bg-background px-3 py-2 text-base sm:text-sm text-foreground ${
                phoneErrors.main
                  ? "border-destructive focus:ring-destructive focus:border-destructive"
                  : "border-border focus:ring-primary focus:border-primary"
              }`}
              dir="ltr"
              placeholder="01xxxxxxxxx"
            />
            {phoneErrors.main && (
              <div className="flex items-center gap-1 text-destructive text-xs mt-1">
                <ExclamationCircleIcon className="w-3 h-3 shrink-0" />
                <span>{phoneErrors.main}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 text-foreground">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <PhoneIcon className="w-4 h-4 text-muted-foreground/80 shrink-0" />
              {order.customerPhone ? (
                <span
                  dir="ltr"
                  className="font-mono tabular-nums font-semibold text-sm sm:text-base lg:text-sm 2xl:text-base whitespace-nowrap text-foreground"
                >
                  {toStandardDigits(order.customerPhone)}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">
                  {t("orders.notSpecified")}
                </span>
              )}
            </div>
            {order.customerPhone && (
              <div className="flex items-center gap-1.5 shrink-0">
                <OrderCallButton
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  customerName={order.customerName}
                  customerPhone={order.customerPhone}
                  compact
                  iconOnly
                  buttonClassName="h-9 w-9 sm:h-9 sm:w-9 min-h-9 rounded-lg"
                />
                {getWhatsAppChatUrl(order.customerPhone) && (
                  <Link
                    to={getWhatsAppChatUrl(order.customerPhone)!}
                    aria-label="محادثة واتساب"
                    title="فتح محادثة العميل على واتساب المنصة"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-success bg-success/10 dark:bg-success/15 border border-success/35 hover:bg-success hover:text-success-foreground transition active:scale-97 shrink-0 shadow-xs whitespace-nowrap min-h-9"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                    <span className="sr-only">محادثة واتساب</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => handleCopyPhone(order.customerPhone!, "main")}
                  aria-label="نسخ رقم الهاتف"
                  title="نسخ رقم الهاتف"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition active:scale-95 shrink-0"
                >
                  {copiedPhoneKey === "main" ? (
                    <CheckIcon className="w-4 h-4 text-success" />
                  ) : (
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {(isEditing || order.alternativePhone) && (
        <div>
          <label className={isEditing ? "text-xs font-medium text-muted-foreground block mb-1" : "sr-only"}>
            {t("orderDetails.alternativePhone")}
          </label>
          {isEditing ? (
            <div>
              <input
                type="text"
                value={editForm.alternativePhone}
                onChange={(e) =>
                  handlePhoneChange("alternativePhone", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-lg bg-background text-foreground shadow-sm focus:ring-primary focus:border-primary text-base sm:text-sm ${
                  phoneErrors.alternative
                    ? "border-destructive focus:border-destructive focus:ring-destructive"
                    : "border-border"
                }`}
                dir="ltr"
                placeholder={t("orderDetails.additionalPhone").toString()}
              />
              {phoneErrors.alternative && (
                <div className="flex items-center gap-1 text-destructive text-xs mt-1">
                  <ExclamationCircleIcon className="w-3 h-3 shrink-0" />
                  <span>{phoneErrors.alternative}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 text-foreground">
              <div className="flex items-center gap-2 min-w-0">
                <PhoneIcon className="w-4 h-4 text-muted-foreground/80 shrink-0" />
                <span
                  dir="ltr"
                  className="font-mono tabular-nums font-semibold text-sm sm:text-base whitespace-nowrap text-foreground"
                >
                  {toStandardDigits(order.alternativePhone)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {getWhatsAppChatUrl(order.alternativePhone) && (
                  <Link
                    to={getWhatsAppChatUrl(order.alternativePhone)!}
                    aria-label="محادثة واتساب للهاتف البديل"
                    title="فتح محادثة الهاتف البديل على واتساب المنصة"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-success bg-success/10 dark:bg-success/15 border border-success/35 hover:bg-success hover:text-success-foreground transition active:scale-97 shrink-0 shadow-xs whitespace-nowrap"
                  >
                    <WhatsAppIcon className="w-4 h-4 shrink-0" />
                    <span className="sr-only">محادثة واتساب</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => handleCopyPhone(order.alternativePhone!, "alt")}
                  aria-label="نسخ رقم الهاتف البديل"
                  title="نسخ رقم الهاتف البديل"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted transition active:scale-95 shrink-0"
                >
                  {copiedPhoneKey === "alt" ? (
                    <CheckIcon className="w-4 h-4 text-success" />
                  ) : (
                    <ClipboardDocumentIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};
