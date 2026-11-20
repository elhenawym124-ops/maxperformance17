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
            className="w-full border-border rounded-md text-sm dark:dark:bg-muted dark:dark:text-muted-foreground"
          />
        ) : (
          <p className="text-foreground">
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
              className={`w-full rounded-md text-sm dark:dark:bg-muted dark:dark:text-muted-foreground ${
                phoneErrors.main
                  ? "border-destructive dark:border-destructive focus:ring-destructive focus:border-destructive"
                  : "border-border focus:ring-primary focus:border-primary"
              }`}
              dir="ltr"
              placeholder="01xxxxxxxxx"
            />
            {phoneErrors.main && (
              <div className="flex items-center gap-1 text-destructive dark:text-destructive text-xs mt-1">
                <ExclamationCircleIcon className="w-3 h-3" />
                <span>{phoneErrors.main}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between text-foreground">
            <div className="flex items-center min-w-0">
              <PhoneIcon className="w-4 h-4 text-muted-foreground/80 ms-0 me-2 shrink-0" />
              {order.customerPhone ? (
                <span dir="ltr" className="font-mono tabular-nums font-medium">
                  {toStandardDigits(order.customerPhone)}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm">
                  {t("orders.notSpecified")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {order.customerPhone && (
                <OrderCallButton
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  customerName={order.customerName}
                  customerPhone={order.customerPhone}
                  compact
                />
              )}
              {order.customerPhone && getWhatsAppChatUrl(order.customerPhone) && (
                <Link
                  to={getWhatsAppChatUrl(order.customerPhone)!}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-success dark:text-success bg-success/10 dark:bg-success/40 border border-success dark:border-success hover:bg-success dark:hover:bg-success/50 transition active:scale-97 shrink-0 shadow-xs"
                  title="فتح محادثة العميل على واتساب المنصة"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 text-success dark:text-success shrink-0" />
                  <span>محادثة واتساب</span>
                </Link>
              )}
            </div>
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
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm ${
                phoneErrors.alternative
                  ? "border-destructive focus:border-destructive focus:ring-destructive"
                  : "border-border"
              }`}
              dir="ltr"
              placeholder={t("orderDetails.additionalPhone").toString()}
            />
            {phoneErrors.alternative && (
              <div className="flex items-center gap-1 text-destructive dark:text-destructive text-xs mt-1">
                <ExclamationCircleIcon className="w-3 h-3" />
                <span>{phoneErrors.alternative}</span>
              </div>
            )}
          </div>
        ) : order.alternativePhone ? (
          <div className="flex items-center justify-between text-foreground">
            <div className="flex items-center min-w-0">
              <PhoneIcon className="w-4 h-4 text-muted-foreground/80 ms-0 me-2 shrink-0" />
              <span dir="ltr" className="font-mono tabular-nums font-medium">
                {toStandardDigits(order.alternativePhone)}
              </span>
            </div>
            {getWhatsAppChatUrl(order.alternativePhone) && (
              <Link
                to={getWhatsAppChatUrl(order.alternativePhone)!}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-success dark:text-success bg-success/10 dark:bg-success/40 border border-success dark:border-success hover:bg-success dark:hover:bg-success/50 transition active:scale-97 shrink-0 shadow-xs"
                title="فتح محادثة الهاتف البديل على واتساب المنصة"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-success dark:text-success shrink-0" />
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
