import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import api from "../../../services/api";
import { apiClient } from "../../../services/apiClient";
import { useAuth } from "../../../hooks/useAuthSimple";
import { saveDefaultPagePreference } from "../../../utils/postAuthRouting";
import {
  Employee,
  CustodyAsset,
  WarningRecord,
  ProfileFormData,
  MerchantUserExtras,
} from "./types";
import { getApiErrorMessage } from "./helpers";

const initialFormData: ProfileFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
  maritalStatus: "",
  gender: "",
  dateOfBirth: "",
  nationalId: "",
  emergencyContactName: "",
  emergencyContactRelation: "",
  emergencyContactPhone: "",
  timezone: "",
};

// Legacy tab ids stay valid: old links and bookmarks land on the merged tab.
const TAB_ALIASES: Record<string, string> = {
  job: "work",
  custody: "work",
  documents: "work",
  warnings: "work",
  events: "work",
  "api-keys": "security",
};
const normalizeTab = (tab?: string | null) => {
  const value = (tab || "overview").trim();
  return TAB_ALIASES[value] || value;
};

export const useProfileData = () => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState(normalizeTab(searchParams.get("tab")));
  const [myCustody, setMyCustody] = useState<CustodyAsset[]>([]);
  const [warnings, setWarnings] = useState<WarningRecord[]>([]);
  const [defaultPage, setDefaultPage] = useState("/apps");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedOnceRef = useRef(false);
  const editSnapshotRef = useRef<ProfileFormData | null>(null);

  // Cancelling an edit restores the values the user started from; saving keeps them.
  const toggleEditing = useCallback(
    (value: boolean) => {
      if (value) {
        editSnapshotRef.current = formData;
        setIsEditing(true);
        return;
      }
      if (editSnapshotRef.current) {
        setFormData(editSnapshotRef.current);
        editSnapshotRef.current = null;
      }
      setIsEditing(false);
    },
    [formData]
  );

  const isMerchantUser = user?.role === "MERCHANT";
  const isAffiliateUser = user?.role === "AFFILIATE";
  const activeApps: string[] = (user as any)?.company?.activeApps ?? [];
  const hasAffiliatePro = activeApps.some((a) => a.toLowerCase() === "affiliate-pro");
  const hasHrBasic = activeApps.some((a) => a.toLowerCase() === "hr-basic");

  const isDirty = useMemo(
    () =>
      Boolean(editSnapshotRef.current) &&
      JSON.stringify(formData) !== JSON.stringify(editSnapshotRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formData, isEditing]
  );

  useEffect(() => {
    if (!isDirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [isDirty]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(normalizeTab(tab));
  }, [searchParams]);

  // Keep the active tab in the URL so refreshes and shared links land on the same tab.
  const changeTab = useCallback(
    (next: string) => {
      const tab = normalizeTab(next);
      setActiveTab(tab);
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set("tab", tab);
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const fetchMyCustody = useCallback(async (employeeId: string) => {
    try {
      const response = await api.get(`/hr/assets?assignedTo=${employeeId}`);
      setMyCustody((response.data as any)?.assets || []);
    } catch {
      // Optional HR widgets should not block the profile shell.
    }
  }, []);

  const fetchMyWarnings = useCallback(async () => {
    try {
      const response = await api.get("/hr/warnings/my-history");
      setWarnings((response.data as any)?.warnings || []);
    } catch {
      // Optional HR widgets should not block the profile shell.
    }
  }, []);

  const fetchProfileData = useCallback(async () => {
    try {
      if (!loadedOnceRef.current) setLoading(true);
      if (user?.role === "MERCHANT" || user?.role === "AFFILIATE") {
        const merchantUser = user as typeof user & MerchantUserExtras;
        setEmployee(null);
        setFormData((prev) => ({
          ...prev,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: merchantUser?.phone || "",
          timezone: (user as any)?.timezone || "Africa/Cairo",
        }));
        return;
      }
      try {
        const response = await api.get("/hr/employees/me");
        const empData = (response.data as any)?.employee;
        if (!empData) return;
        setEmployee(empData);
        setFormData({
          firstName: empData.firstName || user?.firstName || "",
          lastName: empData.lastName || user?.lastName || "",
          email: empData.email || user?.email || "",
          phone: empData.phone || "",
          address: empData.address || "",
          city: empData.city || "",
          country: empData.country || "",
          maritalStatus: empData.maritalStatus || "",
          gender: empData.gender || "",
          dateOfBirth: empData.dateOfBirth ? empData.dateOfBirth.split("T")[0] : "",
          nationalId: empData.nationalId || "",
          emergencyContactName: empData.emergencyContactName || "",
          emergencyContactRelation: empData.emergencyContactRelation || "",
          emergencyContactPhone: empData.emergencyContactPhone || "",
          timezone: (user as any)?.timezone || "Africa/Cairo",
        });
        if (empData.id) {
          fetchMyCustody(empData.id);
          fetchMyWarnings();
        }
      } catch {
        setFormData((prev) => ({
          ...prev,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          email: user?.email || "",
        }));
      }
    } finally {
      loadedOnceRef.current = true;
      setLoading(false);
    }
  }, [fetchMyCustody, fetchMyWarnings, user]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    fetchProfileData();
    return () => clearTimeout(timer);
  }, [fetchProfileData]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setSettingsLoading(true);
        const res = await apiClient.get<any>("/user/settings", { _skipErrorToast: true } as Record<string, unknown>);
        const data = res.data;
        if (data?.success && data?.data?.defaultPage) {
          setDefaultPage(data.data.defaultPage);
        }
      } catch {
        // silent
      } finally {
        setSettingsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleDefaultPageChange = async (page: string) => {
    setDefaultPage(page);
    saveDefaultPagePreference(user, page);
    try {
      await apiClient.put("/user/settings", { settings: { defaultPage: page } });
    } catch {
      // silent
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Merchant / affiliate accounts have no HR employee record — their profile
      // lives on the User row, so they save through the self-service endpoint.
      if (isMerchantUser || isAffiliateUser) {
        const response = await api.put("/auth/me", {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          timezone: formData.timezone || undefined,
        });
        if ((response.data as any)?.success) {
          toast.success(t("employee.profile.saveSuccess"));
          editSnapshotRef.current = null;
          setIsEditing(false);
          await refreshUser();
        }
        return;
      }

      // `timezone` lives on the User row (not the HR employee record), so it is
      // stripped from the employee payload and saved through the account endpoint.
      const { timezone, ...employeePayload } = formData;
      const response = await api.put("/hr/employees/me", employeePayload);
      if ((response.data as any)?.success) {
        if (timezone && timezone !== ((user as any)?.timezone || "")) {
          await api.put("/auth/me", { timezone });
          await refreshUser();
        }
        toast.success(t("employee.profile.saveSuccess"));
        editSnapshotRef.current = null;
        setIsEditing(false);
        fetchProfileData();
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("employee.profile.saveError")));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("employee.profile.invalidImage"));
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post("/user/image-gallery/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data as any;
      if (data?.success) {
        const avatarUrl = data.image?.url;
        if (avatarUrl && employee?.id) {
          await api.put(`/hr/employees/${employee.id}`, { avatar: avatarUrl });
        } else if (avatarUrl) {
          // No employee record (merchant / affiliate): persist on the user account.
          await api.put("/auth/me", { avatar: avatarUrl });
        }
        await refreshUser();
        toast.success(t("employee.profile.avatarUpdated"));
        fetchProfileData();
      }
    } catch {
      toast.error(t("employee.profile.avatarFailed"));
    } finally {
      setUploading(false);
    }
  };

  const field = (key: keyof ProfileFormData) => ({
    value: formData[key],
    onChange: (v: string) => setFormData((p) => ({ ...p, [key]: v })),
  });

  return {
    t,
    user,
    employee,
    formData,
    setFormData,
    loading,
    saving,
    uploading,
    isEditing,
    setIsEditing: toggleEditing,
    isDirty,
    activeTab,
    setActiveTab: changeTab,
    myCustody,
    warnings,
    defaultPage,
    settingsLoading,
    fileInputRef,
    isMerchantUser,
    isAffiliateUser,
    hasAffiliatePro,
    hasHrBasic,
    handleSave,
    handleAvatarClick,
    handleFileChange,
    handleDefaultPageChange,
    fetchMyWarnings,
    fetchProfileData,
    field,
  };
};
