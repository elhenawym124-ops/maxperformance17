import { useMemo } from "react";
import type { ConfirmationOrder } from "./types";

export interface ConfirmationRowDerivedState {
  isCancelled: boolean;
  callAttempts: number;
  deposit: number;
  shipping: number;
  amountDue: number;
  callsLimitReached: boolean;
  lastCallAt: Date | null;
  nextCallAllowedAt: Date | null;
  waitingForNextCall: boolean;
  callBlocked: boolean;
  isPaid: boolean;
  isPrepaid: boolean;
  paymentBadge: {
    label: string;
    className: string;
  };
}

export function useConfirmationRowDerivedState(
  order: ConfirmationOrder,
  maxCallsNoAnswer: number,
  intervalMinutes: number
): ConfirmationRowDerivedState {
  return useMemo(() => {
    const isCancelled = String(order.status || "").toUpperCase() === "CANCELLED";
    const callAttempts = order.callAttempts || 0;
    const deposit = Number(order.codDepositAmount) || 0;
    const shipping = Number(order.shipping) || 0;
    const amountDue = (Number(order.total) || 0) + shipping - deposit;
    const callsLimitReached = maxCallsNoAnswer > 0 && callAttempts >= maxCallsNoAnswer;
    const lastCallAt = order.lastCallAttemptAt ? new Date(order.lastCallAttemptAt) : null;
    const nextCallAllowedAt =
      lastCallAt && intervalMinutes > 0
        ? new Date(lastCallAt.getTime() + intervalMinutes * 60 * 1000)
        : null;
    const waitingForNextCall = Boolean(
      nextCallAllowedAt && nextCallAllowedAt.getTime() > Date.now()
    );
    const callBlocked = callsLimitReached || waitingForNextCall;

    const paymentMethodUpper = String(order.paymentMethod || "").toUpperCase();
    const paymentStatusUpper = String(order.paymentStatus || "").toUpperCase();
    const isPaid = paymentStatusUpper === "COMPLETED" || paymentStatusUpper === "PAID";
    const isPrepaid =
      isPaid ||
      [
        "CREDIT_CARD",
        "WALLET",
        "INSTAPAY",
        "VISA",
        "MASTERCARD",
        "VODAFONE_CASH",
      ].includes(paymentMethodUpper);

    let paymentBadge = {
      label: "دفع عند الاستلام",
      className: "bg-muted text-muted-foreground border-border/70",
    };

    if (paymentMethodUpper.includes("WALLET") || paymentMethodUpper.includes("VODAFONE")) {
      paymentBadge = {
        label: isPaid ? "محفظة إلكترونية — مدفوع" : "محفظة إلكترونية — مراجعة الدفع",
        className: isPaid
          ? "bg-success/10 text-success border-success dark:bg-success/40 dark:text-success dark:border-success"
          : "bg-warning/10 text-warning border-warning dark:bg-warning/40 dark:text-warning dark:border-warning",
      };
    } else if (paymentMethodUpper.includes("INSTAPAY")) {
      paymentBadge = {
        label: isPaid ? "إنستاباي — مدفوع" : "إنستاباي — مراجعة الدفع",
        className: isPaid
          ? "bg-primary/10 text-primary border-primary dark:bg-primary/40 dark:text-primary dark:border-primary"
          : "bg-warning/10 text-warning border-warning dark:bg-warning/40 dark:text-warning dark:border-warning",
      };
    } else if (
      paymentMethodUpper.includes("CARD") ||
      paymentMethodUpper.includes("VISA") ||
      paymentMethodUpper.includes("MASTERCARD")
    ) {
      paymentBadge = {
        label: isPaid ? "بطاقة بنكية — مدفوع أونلاين" : "بطاقة بنكية — مراجعة الدفع",
        className: isPaid
          ? "bg-success/10 text-success border-success dark:bg-success/40 dark:text-success dark:border-success"
          : "bg-primary/10 text-primary border-primary dark:bg-primary/40 dark:text-primary dark:border-primary",
      };
    } else if (isPaid) {
      paymentBadge = {
        label: "مدفوع مسبقاً",
        className:
          "bg-success/10 text-success border-success dark:bg-success/40 dark:text-success dark:border-success",
      };
    }

    return {
      isCancelled,
      callAttempts,
      deposit,
      shipping,
      amountDue,
      callsLimitReached,
      lastCallAt,
      nextCallAllowedAt,
      waitingForNextCall,
      callBlocked,
      isPaid,
      isPrepaid,
      paymentBadge,
    };
  }, [order, maxCallsNoAnswer, intervalMinutes]);
}
