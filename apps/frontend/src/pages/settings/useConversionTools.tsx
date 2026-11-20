import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { normalizeMarketplaceAppSettings } from "../../config/marketplaceAppSettings";
import { useAuth } from "../../hooks/useAuthSimple";
import { apiClient } from "../../services/apiClient";
import {
  type ManagedMarketplaceAppSlug,
  STORE_CONVERSION_APP_LABELS,
  type StoreConversionToolConfig,
  type StoreConversionToolFieldConfig,
} from "./storeConversionSettingsConfig";

export type JsonRecord = Record<string, unknown>;

export type CompanyMarketplaceApp = {
  id: string;
  status?: string | null;
  settings?: Record<string, unknown> | null;
  app?: {
    slug?: string | null;
    name?: string | null;
  };
};

export type ManagedAppState = {
  app: CompanyMarketplaceApp | null;
  settings: JsonRecord;
};

const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const getDeepValue = (source: JsonRecord, path: string[]): unknown =>
  path.reduce<unknown>((currentValue, key) => {
    if (!isRecord(currentValue)) {
      return undefined;
    }
    return currentValue[key];
  }, source);

export const setDeepValue = (
  source: JsonRecord,
  path: string[],
  value: unknown,
): JsonRecord => {
  if (path.length === 0) {
    return source;
  }

  const [head, ...rest] = path;
  if (!head) {
    return source;
  }

  const raw = source[head];
  const current = isRecord(raw) ? raw : {};

  return {
    ...source,
    [head]: rest.length === 0 ? value : setDeepValue(current, rest, value),
  };
};

export const isAppOperational = (app: CompanyMarketplaceApp | null) => {
  const status = String(app?.status || "").trim().toUpperCase();
  return Boolean(app) && !["DISABLED", "INACTIVE", "CANCELLED", "EXPIRED"].includes(status);
};

export const ToggleSwitch = ({
  label,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-label={label}
    aria-checked={checked}
    aria-disabled={disabled}
    disabled={disabled}
    onClick={onToggle}
    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
      checked
        ? "bg-emerald-600 dark:bg-success"
        : "bg-gray-300 dark:bg-muted"
    } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
  >
    <span
      className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
        checked ? "-translate-x-1" : "translate-x-1"
      }`}
    />
  </button>
);

export type ToolAvailability = { available: boolean; note: string };

export function useConversionTools(appSlugs: ManagedMarketplaceAppSlug[]) {
  const { t } = useTranslation();
  const { isLoading: isAuthLoading, isAuthenticated, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingToolKey, setSavingToolKey] = useState<string | null>(null);
  const [managedApps, setManagedApps] = useState<
    Record<ManagedMarketplaceAppSlug, ManagedAppState>
  >({} as Record<ManagedMarketplaceAppSlug, ManagedAppState>);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const appSlugsKey = appSlugs.join("|");

  const loadManagedApps = useCallback(async () => {
    if (!isAuthenticated || !user?.companyId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = (await apiClient.get("/my-apps", { _skipErrorToast: true })) as {
        data?: { data?: unknown };
      };
      const installedApps = Array.isArray(response?.data?.data)
        ? (response.data.data as CompanyMarketplaceApp[])
        : [];

      const slugs = appSlugsKey
        .split("|")
        .filter(Boolean) as ManagedMarketplaceAppSlug[];
      const nextManagedApps = slugs.reduce<
        Record<ManagedMarketplaceAppSlug, ManagedAppState>
      >((accumulator, appSlug) => {
        const matchedApp =
          installedApps.find((entry) => entry?.app?.slug === appSlug) || null;

        accumulator[appSlug] = {
          app: matchedApp,
          settings: normalizeMarketplaceAppSettings(appSlug, matchedApp?.settings || {}),
        };

        return accumulator;
      }, {} as Record<ManagedMarketplaceAppSlug, ManagedAppState>);

      setManagedApps(nextManagedApps);
    } catch (error) {
      console.error("Error loading conversion tools:", error);
      toast.error(t("storeConversionSettings.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [appSlugsKey, isAuthenticated, t, user?.companyId]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    void loadManagedApps();
  }, [isAuthLoading, loadManagedApps]);

  const ensureAppOperational = useCallback(
    async (
      appSlug: ManagedMarketplaceAppSlug,
    ): Promise<{ app: CompanyMarketplaceApp | null; errorMessage?: string }> => {
      const current = managedApps[appSlug]?.app;
      if (current && isAppOperational(current)) {
        return { app: current };
      }

      let installErrorMessage: string | undefined;
      try {
        await apiClient.post(`/marketplace/apps/${appSlug}/install`, {});
      } catch (installErr: any) {
        console.warn("Auto-install attempt result:", installErr);
        installErrorMessage =
          installErr?.response?.data?.message || installErr?.message;
      }

      try {
        const response = (await apiClient.get("/my-apps", { _skipErrorToast: true })) as {
          data?: { data?: unknown };
        };
        const installedApps = Array.isArray(response?.data?.data)
          ? (response.data.data as CompanyMarketplaceApp[])
          : [];
        const matchedApp = installedApps.find((entry) => entry?.app?.slug === appSlug) || null;
        if (matchedApp && isAppOperational(matchedApp)) {
          const normalizedSettings = normalizeMarketplaceAppSettings(
            appSlug,
            matchedApp.settings || {},
          );
          setManagedApps((prev) => ({
            ...prev,
            [appSlug]: {
              app: matchedApp,
              settings: normalizedSettings,
            },
          }));
          return { app: matchedApp };
        } else if (matchedApp && !isAppOperational(matchedApp)) {
          return {
            app: null,
            errorMessage: t("storeConversionSettings.appDisabledError"),
          };
        }
      } catch (fetchErr) {
        console.error("Error refreshing my-apps after install:", fetchErr);
      }

      return { app: null, errorMessage: installErrorMessage };
    },
    [managedApps, t],
  );

  const getAppStatusLabel = useCallback(
    (app: CompanyMarketplaceApp | null) => {
      if (!app) {
        return t("storeConversionSettings.notInstalled");
      }

      return isAppOperational(app)
        ? t("storeConversionSettings.ready")
        : t("storeConversionSettings.disabled");
    },
    [t],
  );

  const getToolAvailability = useCallback(
    (_tool: StoreConversionToolConfig): ToolAvailability => {
      // Conversion tools are always available to activate and configure.
      // When enabled, the parent marketplace app is automatically installed in the background if not present.
      return { available: true, note: "" };
    },
    [],
  );

  const getToolEnabled = useCallback(
    (tool: StoreConversionToolConfig) => {
      const appState = managedApps[tool.appSlug];
      if (!appState?.app || !isAppOperational(appState.app)) {
        return false;
      }

      return tool.readPaths.every((path) =>
        Boolean(getDeepValue(appState.settings, path.split("."))),
      );
    },
    [managedApps],
  );

  const handleToolToggle = useCallback(
    async (tool: StoreConversionToolConfig, nextValue: boolean) => {
      let targetApp = managedApps[tool.appSlug]?.app || null;

      if (!targetApp || !isAppOperational(targetApp)) {
        if (!nextValue) {
          return;
        }
        setSavingToolKey(tool.key);
        const { app: operationalApp, errorMessage } = await ensureAppOperational(tool.appSlug);
        if (!operationalApp) {
          setSavingToolKey(null);
          toast.error(errorMessage || t("storeConversionSettings.saveFailed"));
          return;
        }
        targetApp = operationalApp;
      }

      const currentSettings = normalizeMarketplaceAppSettings(
        tool.appSlug,
        targetApp.settings || managedApps[tool.appSlug]?.settings || {},
      );

      const writePaths = nextValue
        ? tool.writePathsOn || tool.readPaths
        : tool.writePathsOff || tool.readPaths;

      let nextSettings = currentSettings;
      writePaths.forEach((path) => {
        nextSettings = setDeepValue(nextSettings, path.split("."), nextValue);
      });

      const normalizedSettings = normalizeMarketplaceAppSettings(
        tool.appSlug,
        nextSettings,
      );

      setSavingToolKey(tool.key);
      setManagedApps((currentState) => ({
        ...currentState,
        [tool.appSlug]: {
          app: targetApp,
          settings: normalizedSettings,
        },
      }));

      try {
        await apiClient.put(`/my-apps/${targetApp.id}/settings`, {
          settings: normalizedSettings,
        });
        setLastSavedAt(Date.now());
      } catch (error) {
        console.error("Error saving conversion tool:", error);
        toast.error(t("storeConversionSettings.saveFailed"));
        await loadManagedApps();
      } finally {
        setSavingToolKey(null);
      }
    },
    [ensureAppOperational, loadManagedApps, managedApps, t],
  );

  const handleToolFieldSave = useCallback(
    async (
      tool: StoreConversionToolConfig,
      field: StoreConversionToolFieldConfig,
      rawValue: string,
    ) => {
      let targetApp = managedApps[tool.appSlug]?.app || null;

      if (!targetApp || !isAppOperational(targetApp)) {
        const savingKey = `${tool.key}:${field.key}`;
        setSavingToolKey(savingKey);
        const { app: operationalApp, errorMessage } = await ensureAppOperational(tool.appSlug);
        if (!operationalApp) {
          setSavingToolKey(null);
          toast.error(errorMessage || t("storeConversionSettings.saveFieldFailed"));
          return;
        }
        targetApp = operationalApp;
      }

      const currentSettings = normalizeMarketplaceAppSettings(
        tool.appSlug,
        targetApp.settings || managedApps[tool.appSlug]?.settings || {},
      );

      const currentValue = getDeepValue(currentSettings, field.path.split("."));
      let nextValue: unknown;

      if (field.type === "number") {
        const nextNumber = Math.max(
          field.min ?? 0,
          Number.isFinite(Number(rawValue)) ? Number(rawValue) : 0,
        );
        if (Number(currentValue || 0) === nextNumber) {
          return;
        }
        nextValue = nextNumber;
      } else {
        const nextString = String(rawValue ?? "").trim();
        if (String(currentValue ?? "").trim() === nextString) {
          return;
        }
        nextValue = nextString;
      }

      const nextSettings = setDeepValue(
        currentSettings,
        field.path.split("."),
        nextValue,
      );
      const normalizedSettings = normalizeMarketplaceAppSettings(
        tool.appSlug,
        nextSettings,
      );
      const savingKey = `${tool.key}:${field.key}`;

      setSavingToolKey(savingKey);
      setManagedApps((currentState) => ({
        ...currentState,
        [tool.appSlug]: {
          app: targetApp,
          settings: normalizedSettings,
        },
      }));

      try {
        await apiClient.put(`/my-apps/${targetApp.id}/settings`, {
          settings: normalizedSettings,
        });
        setLastSavedAt(Date.now());
      } catch (error) {
        console.error("Error saving conversion tool field:", error);
        toast.error(t("storeConversionSettings.saveFieldFailed"));
        await loadManagedApps();
      } finally {
        setSavingToolKey(null);
      }
    },
    [ensureAppOperational, loadManagedApps, managedApps, t],
  );

  return {
    loading,
    isAuthLoading,
    savingToolKey,
    lastSavedAt,
    managedApps,
    reload: loadManagedApps,
    getAppStatusLabel,
    getToolAvailability,
    getToolEnabled,
    handleToolToggle,
    handleToolFieldSave,
  };
}
