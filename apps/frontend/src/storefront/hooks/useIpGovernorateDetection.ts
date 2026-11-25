import { useEffect, useRef } from "react";
import { useCheckoutStore } from "../store/useCheckoutStore";
import { detectGovernorateByIp } from "../utils/ipGovernorate";

/**
 * Pre-selects the customer's governorate from their IP as soon as the
 * storefront boots. Only fills the field when it is still empty so a value the
 * buyer already chose (or one they start typing) is never overwritten.
 */
export const useIpGovernorateDetection = (
  options?: { deferUntilIdle?: boolean },
): void => {
  // Guard against double-invocation in StrictMode / repeated mounts.
  const ran = useRef(false);
  const deferUntilIdle = options?.deferUntilIdle === true;

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const { formData } = useCheckoutStore.getState();
    const isManuallySelected =
      typeof window !== "undefined" &&
      window.sessionStorage?.getItem("sf-gov-manual-selection") === "true";
    if (formData?.governorate?.trim() && isManuallySelected) return;

    let active = true;
    let idleId: number | null = null;
    let timerId: number | null = null;

    const runDetection = () => {
      if (!active) return;
      void detectGovernorateByIp().then(({ governorate, city }) => {
        if (!active || !governorate) return;

        const current = useCheckoutStore.getState().formData;
        const isManuallySelected =
          typeof window !== "undefined" &&
          window.sessionStorage?.getItem("sf-gov-manual-selection") === "true";

        const isCairoDefault =
          current.governorate === "Cairo" ||
          current.governorate === "القاهرة";
        const isDifferentThanTarget =
          governorate !== current.governorate &&
          (governorate !== "Cairo" && governorate !== "القاهرة");

        if (
          !current.governorate?.trim() ||
          (!isManuallySelected && isCairoDefault && isDifferentThanTarget)
        ) {
          useCheckoutStore.getState().updateFormData({
            governorate,
            ...(city ? { city } : {}),
          });
        }
      });
    };

    if (deferUntilIdle && typeof window !== "undefined") {
      const idleWindow = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      };
      if (typeof idleWindow.requestIdleCallback === "function") {
        idleId = idleWindow.requestIdleCallback(runDetection, { timeout: 2500 });
      } else {
        timerId = window.setTimeout(runDetection, 1500);
      }
    } else {
      // Run detection immediately so governorate is pre-selected when user views the checkout form
      runDetection();
    }

    return () => {
      active = false;
      if (idleId !== null && typeof window !== "undefined") {
        (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(idleId);
      }
      if (timerId !== null && typeof window !== "undefined") {
        window.clearTimeout(timerId);
      }
    };
  }, [deferUntilIdle]);
};
