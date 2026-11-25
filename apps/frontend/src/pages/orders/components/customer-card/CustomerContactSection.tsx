import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  PhoneIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
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
        <label className="text-sm font-medium text-muted-foreground block mb-1">
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
          <p className="text-foreground break-words">
            {order.customerName || t("orders.notSpecified")}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-1">
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
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch 2xl:flex-row 2xl:items-center text-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <PhoneIcon className="w-4 h-4 text-muted-foreground/80 shrink-0" />
              {order.customerPhone ? (
                <span
                  dir="ltr"
                  className="font-mono tabular-nums font-semibold text-sm sm:text-base whitespace-nowrap text-foreground"
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
              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center sm:gap-1.5 sm:shrink-0 lg:grid lg:grid-cols-2 lg:w-full 2xl:flex 2xl:w-auto">
                <OrderCallButton
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  customerName={order.customerName}
                  customerPhone={order.customerPhone}
                  compact
                  className="w-full sm:w-auto lg:w-full 2xl:w-auto"
                  buttonClassName="w-full min-h-10 sm:min-h-0 lg:min-h-9 2xl:min-h-0 py-2 sm:py-1.5 px-3 sm:px-2.5"
                />
                {getWhatsAppChatUrl(order.customerPhone) && (
                  <Link
                    to={getWhatsAppChatUrl(order.customerPhone)!}
                    className="inline-flex w-full sm:w-auto lg:w-full 2xl:w-auto items-center justify-center gap-1.5 px-3 py-2 sm:px-2.5 sm:py-1.5 min-h-10 sm:min-h-0 lg:min-h-9 2xl:min-h-0 rounded-lg text-xs font-semibold text-success bg-success/10 dark:bg-success/15 border border-success/35 hover:bg-success hover:text-success-foreground transition active:scale-97 shrink-0 shadow-xs whitespace-nowrap"
                    title="فتح محادثة العميل على واتساب المنصة"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>محادثة واتساب</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground block mb-1">
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
        ) : order.alternativePhone ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch 2xl:flex-row 2xl:items-center text-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <PhoneIcon className="w-4 h-4 text-muted-foreground/80 shrink-0" />
              <span
                dir="ltr"
                className="font-mono tabular-nums font-semibold text-sm sm:text-base whitespace-nowrap text-foreground"
              >
                {toStandardDigits(order.alternativePhone)}
              </span>
            </div>
            {getWhatsAppChatUrl(order.alternativePhone) && (
              <Link
                to={getWhatsAppChatUrl(order.alternativePhone)!}
                className="inline-flex w-full sm:w-auto lg:w-full 2xl:w-auto items-center justify-center gap-1.5 px-3 py-2 sm:px-2.5 sm:py-1.5 min-h-10 sm:min-h-0 lg:min-h-9 2xl:min-h-0 rounded-lg text-xs font-semibold text-success bg-success/10 dark:bg-success/15 border border-success/35 hover:bg-success hover:text-success-foreground transition active:scale-97 shrink-0 shadow-xs whitespace-nowrap"
                title="فتح محادثة الهاتف البديل على واتساب المنصة"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 shrink-0" />
                <span>محادثة واتساب</span>
              </Link>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground/80 text-sm">
            {t("orders.notSpecified")}
          </p>
        )}
      </div>
    </>
  );
};
