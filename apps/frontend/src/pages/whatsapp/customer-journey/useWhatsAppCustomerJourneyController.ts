import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiClient } from "../../../services/apiClient";
import { useAuth } from "../../../hooks/useAuthSimple";
import { useCopilotShortcut } from "../components/journey/CopilotDrawer";
import {
  DeleteTarget,
  Flow,
  isNotFoundError,
  Journey,
  JourneyStageKey,
  JourneyViewMode,
  NoticeState,
  NoticeTone,
  Step,
  UnifiedOverviewData,
} from "./types";

const adminRoles = new Set(["SUPER_ADMIN", "OWNER", "COMPANY_ADMIN"]);

export function useWhatsAppCustomerJourneyController() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRtl = i18n.dir() === "rtl";
  const isAdmin = user?.role ? adminRoles.has(user.role) : false;

  const copilot = useCopilotShortcut();

  const [flows, setFlows] = useState<Flow[]>([]);
  const [unifiedOverview, setUnifiedOverview] =
    useState<UnifiedOverviewData | null>(null);
  const [viewMode, setViewMode] = useState<JourneyViewMode>("canvas");
  const [activeStage, setActiveStage] = useState<JourneyStageKey>("all");
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [pausingOccasionId, setPausingOccasionId] = useState<string | null>(
    null,
  );
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const [flowDialogOpen, setFlowDialogOpen] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<Partial<Flow>>({
    name: "",
    isEnabled: true,
    channels: ["WHATSAPP", "FACEBOOK"],
  });

  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Partial<Step>>({
    delayDays: 1,
    content: "",
    stepOrder: 1,
  });

  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);

  const selectedFlowIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedFlowIdRef.current = selectedFlow?.id || null;
  }, [selectedFlow?.id]);

  const showNotice = useCallback(
    (message: string, tone: NoticeTone = "success") => {
      setNotice({ message, tone });
    },
    [],
  );

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const fetchSteps = useCallback(
    async (flowId: string) => {
      try {
        setStepsLoading(true);
        const response = await apiClient.get(
          `/whatsapp/automation/flows/${flowId}/steps`,
        );
        setSteps((response.data as { data?: Step[] }).data ?? []);
      } catch (error) {
        setSteps([]);
        if (!isNotFoundError(error)) {
          showNotice(t("common.error"), "error");
        }
      } finally {
        setStepsLoading(false);
      }
    },
    [showNotice, t],
  );

  const fetchFlows = useCallback(async () => {
    try {
      const response = await apiClient.get("/whatsapp/automation/flows");
      const nextFlows = (response.data as { data?: Flow[] }).data ?? [];
      setFlows(nextFlows);

      const nextSelected =
        nextFlows.find((flow: Flow) => flow.id === selectedFlowIdRef.current) ??
        nextFlows[0] ??
        null;

      setSelectedFlow(nextSelected);

      if (nextSelected) {
        await fetchSteps(nextSelected.id);
      } else {
        setSteps([]);
      }
    } catch (error) {
      setFlows([]);
      setSelectedFlow(null);
      setSteps([]);
      if (!isNotFoundError(error)) {
        showNotice(t("common.error"), "error");
      }
    }
  }, [fetchSteps, showNotice, t]);

  const fetchUnifiedOverview = useCallback(async () => {
    try {
      const response = await apiClient.get(
        "/whatsapp/automation/unified-overview",
      );
      const payload = (response.data as { data?: UnifiedOverviewData })?.data;
      setUnifiedOverview(
        payload && !Array.isArray(payload) && Array.isArray(payload.engines)
          ? payload
          : null,
      );
    } catch {
      // Optional enrichment: keep workspace functional if unavailable
    }
  }, []);

  const fetchJourneys = useCallback(async () => {
    try {
      const response = await apiClient.get("/whatsapp/automation/journeys");
      setJourneys((response.data as { data?: Journey[] }).data ?? []);
    } catch (error) {
      setJourneys([]);
      if (!isNotFoundError(error)) {
        showNotice(t("common.error"), "error");
      }
    }
  }, [showNotice, t]);

  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        if (isMounted) setLoading(true);
        await Promise.all([
          fetchFlows(),
          fetchJourneys(),
          fetchUnifiedOverview(),
        ]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void loadInitialData();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefreshWorkspace = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchFlows(),
        fetchJourneys(),
        fetchUnifiedOverview(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFlowClick = (flow: Flow) => {
    setSelectedFlow(flow);
    void fetchSteps(flow.id);
  };

  const openCreateFlowDialog = () => {
    setCurrentFlow({ name: "", isEnabled: true, channels: ["WHATSAPP", "FACEBOOK"] });
    setFlowDialogOpen(true);
  };

  const openEditFlowDialog = (flow: Flow) => {
    setCurrentFlow(flow);
    setFlowDialogOpen(true);
  };

  const openCreateStepDialog = () => {
    if (!selectedFlow) return;
    setCurrentStep({
      flowId: selectedFlow.id,
      delayDays: 1,
      content: "",
      stepOrder: steps.length + 1,
    });
    setStepDialogOpen(true);
  };

  const openEditStepDialog = (step: Step) => {
    setCurrentStep(step);
    setStepDialogOpen(true);
  };

  const handleSaveFlow = async () => {
    if (!currentFlow.name?.trim()) return;
    try {
      setSubmitting(true);
      if (currentFlow.id) {
        await apiClient.put(
          `/whatsapp/automation/flows/${currentFlow.id}`,
          currentFlow,
        );
      } else {
        await apiClient.post("/whatsapp/automation/flows", currentFlow);
      }
      showNotice(t("whatsappJourney.actions.saveSuccess"));
      setFlowDialogOpen(false);
      await fetchFlows();
    } catch {
      showNotice(t("whatsappJourney.actions.saveError"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStep = async () => {
    if (!selectedFlow || !currentStep.content?.trim()) return;
    try {
      setSubmitting(true);
      await apiClient.post(
        `/whatsapp/automation/flows/${selectedFlow.id}/steps`,
        {
          ...currentStep,
          flowId: selectedFlow.id,
          stepOrder: currentStep.stepOrder ?? steps.length + 1,
        },
      );
      showNotice(t("whatsappJourney.actions.saveSuccess"));
      setStepDialogOpen(false);
      await Promise.all([
        fetchSteps(selectedFlow.id),
        fetchUnifiedOverview(),
      ]);
    } catch {
      showNotice(t("whatsappJourney.actions.saveError"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEngine = async (engineKey: string, nextEnabled: boolean) => {
    try {
      setTogglingKey(engineKey);
      await apiClient.post(
        `/whatsapp/automation/engines/${engineKey}/toggle`,
        { isEnabled: nextEnabled },
      );
      showNotice(
        nextEnabled ? "تم تفعيل المحرك بنجاح" : "تم إيقاف المحرك بنجاح",
      );
      await fetchUnifiedOverview();
    } catch {
      showNotice(t("common.error"), "error");
    } finally {
      setTogglingKey(null);
    }
  };

  const handlePauseOccasion = async (occasionId: string) => {
    try {
      setPausingOccasionId(occasionId);
      await apiClient.post(
        `/customers/whatsapp-notify/occasions/${occasionId}/pause`,
      );
      showNotice("تم إيقاف جدولة المناسبة مؤقتاً");
      await fetchUnifiedOverview();
    } catch {
      showNotice(t("common.error"), "error");
    } finally {
      setPausingOccasionId(null);
    }
  };

  const handleSendTest = async (payload: {
    recipientPhone: string;
    templateId?: string;
    eventType?: string;
    content?: string;
  }) => {
    try {
      const res = await apiClient.post("/whatsapp/automation/test-send", payload);
      const body = res.data as { success?: boolean; message?: string };
      return {
        success: Boolean(body?.success),
        message: body?.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message || err?.message || "فشل الإرسال",
      };
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      if (deleteTarget.type === "flow") {
        await apiClient.delete(`/whatsapp/automation/flows/${deleteTarget.id}`);
        showNotice(t("whatsappJourney.actions.deleteSuccess"));
        await fetchFlows();
      } else {
        await apiClient.delete(`/whatsapp/automation/steps/${deleteTarget.id}`);
        showNotice(t("whatsappJourney.actions.deleteSuccess"));
        if (selectedFlow) {
          await fetchSteps(selectedFlow.id);
        }
      }
      setDeleteTarget(null);
    } catch {
      showNotice(t("whatsappJourney.actions.deleteError"), "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredFlows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return flows;
    return flows.filter((flow) => flow.name.toLowerCase().includes(query));
  }, [flows, searchTerm]);

  return {
    t,
    i18n,
    isRtl,
    isAdmin,
    copilot,
    flows,
    filteredFlows,
    unifiedOverview,
    viewMode,
    setViewMode,
    activeStage,
    setActiveStage,
    togglingKey,
    pausingOccasionId,
    testModalOpen,
    setTestModalOpen,
    selectedFlow,
    steps,
    setSteps,
    journeys,
    loading,
    refreshing,
    stepsLoading,
    submitting,
    deleteLoading,
    searchTerm,
    setSearchTerm,
    notice,
    deleteTarget,
    setDeleteTarget,
    flowDialogOpen,
    setFlowDialogOpen,
    currentFlow,
    setCurrentFlow,
    stepDialogOpen,
    setStepDialogOpen,
    currentStep,
    setCurrentStep,
    selectedJourney,
    setSelectedJourney,
    metaModalOpen,
    setMetaModalOpen,
    timelineOpen,
    setTimelineOpen,
    handleRefreshWorkspace,
    handleFlowClick,
    openCreateFlowDialog,
    openEditFlowDialog,
    openCreateStepDialog,
    openEditStepDialog,
    handleSaveFlow,
    handleSaveStep,
    handleConfirmDelete,
    handleToggleEngine,
    handlePauseOccasion,
    handleSendTest,
  };
}
