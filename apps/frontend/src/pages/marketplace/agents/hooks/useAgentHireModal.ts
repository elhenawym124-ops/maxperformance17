import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "../../../../services/apiClient";
import { AgentListing } from "../agentMarketplaceData";
import { handleInsufficientWalletBalance } from "../../../../utils/marketplaceWalletHelper";

export interface UseAgentHireModalProps {
  agent: AgentListing | null;
  open: boolean;
  initialWalletBalance?: number | null;
  onClose: () => void;
  onHired: (agentSlug: string, agentName: string) => void;
}

export function useAgentHireModal({
  agent,
  open,
  initialWalletBalance = null,
  onClose,
  onHired,
}: UseAgentHireModalProps) {
  const navigate = useNavigate();
  const [customName, setCustomName] = useState<string>(agent?.name || "");
  const [department, setDepartment] = useState<string>(agent?.department || "operations");
  const [safetyMode, setSafetyMode] = useState<"draft" | "autonomous">("draft");
  const [loading, setLoading] = useState<boolean>(false);

  const [walletBalance, setWalletBalance] = useState<number | null>(initialWalletBalance);
  const [walletLoading, setWalletLoading] = useState<boolean>(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    if (agent) {
      setCustomName(agent.name);
      setDepartment(agent.department || "operations");
      setSafetyMode(agent.governance === "autonomous" ? "autonomous" : "draft");
    }
  }, [agent]);

  const fetchWalletBalance = useCallback(async () => {
    setWalletLoading(true);
    setWalletError(null);
    try {
      const res = await apiClient.get("/wallet/balance");
      const bal =
        res.data?.data?.balance ?? res.data?.balance ?? res.data?.wallet?.balance;
      if (typeof bal === "number" && Number.isFinite(bal)) {
        setWalletBalance(bal);
      } else if (typeof bal === "string" && !Number.isNaN(parseFloat(bal))) {
        setWalletBalance(parseFloat(bal));
      } else {
        setWalletBalance(null);
        setWalletError("تعذر قراءة رصيد المحفظة من الخادم.");
      }
    } catch {
      setWalletBalance(null);
      setWalletError("تعذر التحقق من رصيد المحفظة حالياً.");
    } finally {
      setWalletLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      if (typeof initialWalletBalance === "number") {
        setWalletBalance(initialWalletBalance);
      }
      fetchWalletBalance();
    }
  }, [open, initialWalletBalance, fetchWalletBalance]);

  const isPro = agent?.tier === "pro" && Number(agent?.priceMonthly || 0) > 0;
  const requiredAmount = isPro ? Number(agent?.priceMonthly || 0) : 0;
  const hasEnoughBalance =
    !isPro || (walletBalance !== null && walletBalance >= requiredAmount);

  const navigateToRecharge = (serverPayload?: {
    requiredAmount?: number;
    currentBalance?: number;
    message?: string;
  }) => {
    if (!agent) return;
    handleInsufficientWalletBalance(
      {
        response: {
          status: 402,
          data: {
            code: "INSUFFICIENT_WALLET_BALANCE",
            requiredAmount: serverPayload?.requiredAmount ?? requiredAmount,
            currentBalance: serverPayload?.currentBalance ?? walletBalance ?? 0,
            currency: "EGP",
            message:
              serverPayload?.message ||
              `رصيد المحفظة غير كافٍ. المطلوب: ${requiredAmount} ${agent.currency || "ج.م"}، المتوفر: ${walletBalance ?? 0} ${agent.currency || "ج.م"}`,
          },
        },
      },
      navigate,
      {
        returnUrl: window.location.pathname + window.location.search,
        appName: agent.name,
        itemType: "agent",
      }
    );
    onClose();
  };

  const handleConfirmHire = async () => {
    if (!agent) return;

    if (isPro && walletError) {
      toast.error("يرجى إعادة التحقق من رصيد المحفظة أولاً.");
      return;
    }

    if (isPro && !hasEnoughBalance) {
      navigateToRecharge();
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/agent-manager/hire", {
        templateSlug: agent.slug,
        name: customName.trim() || agent.name,
        description: agent.position,
        department,
        safetyMode,
      });

      if (res.data?.success || res.status === 200 || res.status === 201) {
        const finalName = customName.trim() || agent.name;
        toast.success(
          agent.kind === "squad"
            ? `تم تفعيل الفريق «${finalName}» بنجاح في حساب شركتك.`
            : `تم توظيف الوكيل «${finalName}» بنجاح في فريق عملك.`
        );
        onHired(agent.slug, finalName);
        onClose();
      } else {
        toast.error(res.data?.error || res.data?.message || "تعذر إتمام التوظيف.");
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 402 || data?.code === "INSUFFICIENT_WALLET_BALANCE") {
        navigateToRecharge({
          requiredAmount: data?.requiredAmount,
          currentBalance: data?.currentBalance,
          message: data?.error || data?.message,
        });
        return;
      }
      const errorMsg =
        data?.error ||
        data?.message ||
        data?.detail ||
        err?.message ||
        "تعذر توظيف الوكيل حالياً.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    customName,
    setCustomName,
    department,
    setDepartment,
    safetyMode,
    setSafetyMode,
    loading,
    walletBalance,
    walletLoading,
    walletError,
    fetchWalletBalance,
    isPro,
    requiredAmount,
    hasEnoughBalance,
    navigateToRecharge,
    handleConfirmHire,
  };
}
