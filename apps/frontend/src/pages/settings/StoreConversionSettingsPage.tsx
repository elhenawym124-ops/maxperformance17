import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getDirection } from "../../i18n";
import { NavLink } from "react-router-dom";
import { STORE_CONVERSION_APP_LABELS, STORE_CONVERSION_PAGE_MAP, STORE_CONVERSION_PAGES, type StoreConversionPageId } from "./storeConversionSettingsConfig";
import {
  getDeepValue,
  ToggleSwitch,
  useConversionTools,
} from "./useConversionTools";

export default function StoreConversionSettingsPage({
  pageId,
}: {
  pageId: StoreConversionPageId;
}) {
  const { t } = useTranslation();
  const page = STORE_CONVERSION_PAGE_MAP[pageId];

  const {
    loading,
    savingToolKey,
    lastSavedAt,
    managedApps,
    getAppStatusLabel,
    getToolAvailability,
    getToolEnabled,
    handleToolToggle,
    handleToolFieldSave,
  } = useConversionTools(page.appSlugs);

  const sourceSummary = useMemo(
    () =>
      page.appSlugs
        .map((appSlug) => {
          const label = STORE_CONVERSION_APP_LABELS[appSlug];
          const appState = managedApps[appSlug];
          return `${label}: ${getAppStatusLabel(appState?.app || null)}`;
        })
        .join(" • "),
    [managedApps, page.appSlugs, getAppStatusLabel],
  );

  const headerStatusLabel = loading
    ? t("storeConversionSettings.loading")
    : savingToolKey
      ? t("storeConversionSettings.saving")
      : lastSavedAt
        ? t("storeConversionSettings.savedAuto")
        : t("storeConversionSettings.autoSaveLabel");

  return (
    <div className="max-w-5xl space-y-8" dir={getDirection()}>
      <header className="space-y-4 border-b border-border pb-6 dark:border-border">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-primary dark:text-primary">
            {t("storeConversionSettings.pageHeader") as string}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {t(page.title) as string}
          </h1>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          {t(page.description) as string}
        </p>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>{headerStatusLabel}</p>
          {!loading ? <p>{sourceSummary}</p> : null}
        </div>
      </header>

      <nav
        aria-label="Store conversion navigation"
        className="border-b border-border pb-4 dark:border-border"
      >
        <div className="flex gap-6 overflow-x-auto text-sm">
          {STORE_CONVERSION_PAGES.map((entry) => (
            <NavLink
              key={entry.id}
              to={entry.path}
              className={({ isActive }) =>
                `whitespace-nowrap border-b pb-2 font-bold transition-colors ${
                  isActive
                    ? "border-gray-900 text-foreground dark:border-white dark:text-white"
                    : "border-transparent text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-white"
                }`
              }
            >
              {t(entry.navLabel) as string}
            </NavLink>
          ))}
        </div>
      </nav>

      {page.sections.map((section) => (
        <section
          key={section.title}
          className="space-y-4 border-b border-border pb-8 dark:border-border"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-black text-foreground">
              {t(section.title) as string}
            </h2>
            {section.description ? (
              <p className="text-sm leading-7 text-muted-foreground">
                {t(section.description, { defaultValue: section.description })}
              </p>
            ) : null}
          </div>

          <div className="divide-y divide-border dark:divide-border">
            {section.tools.map((tool) => {
              const availability = getToolAvailability(tool);
              const enabled = getToolEnabled(tool);
              const saving = savingToolKey === tool.key;
              const isToolFieldSaving =
                typeof savingToolKey === "string" &&
                savingToolKey.startsWith(`${tool.key}:`);
              const toolLabel = t(`storeConversionSettings.tool.${tool.key}.label`, {
                defaultValue: tool.label,
              });
              const toolDescription = t(
                `storeConversionSettings.tool.${tool.key}.benefit`,
                { defaultValue: tool.description },
              );

              return (
                <div
                  key={tool.key}
                  className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">
                      {toolLabel}
                    </p>
                    <p className="text-xs leading-6 text-muted-foreground">
                      {toolDescription}
                    </p>
                    {!availability.available ? (
                      <p className="text-xs font-bold text-warning dark:text-warning">
                        {availability.note}
                      </p>
                    ) : null}
                    {tool.fields?.length ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {tool.fields.map((field) => {
                          const fieldValue = getDeepValue(
                            managedApps[tool.appSlug]?.settings || {},
                            field.path.split("."),
                          );
                          const fieldSaving =
                            savingToolKey === `${tool.key}:${field.key}`;

                          return (
                            <label
                              key={`${field.key}-${String(fieldValue)}`}
                              className="block rounded-lg border border-border bg-muted p-3 dark:border-border dark:bg-muted"
                            >
                              <span className="block text-xs font-black text-foreground dark:text-muted-foreground">
                                {t(`storeConversionSettings.field.${field.key}.label`, {
                                  defaultValue: field.label,
                                })}
                              </span>
                              {field.description ? (
                                <span className="mt-1 block text-[11px] leading-5 text-muted-foreground">
                                  {t(
                                    `storeConversionSettings.field.${field.key}.description`,
                                    { defaultValue: field.description },
                                  )}
                                </span>
                              ) : null}
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  type="number"
                                  min={field.min}
                                  defaultValue={Number(fieldValue || 0)}
                                  disabled={
                                    !availability.available ||
                                    loading ||
                                    saving ||
                                    isToolFieldSaving
                                  }
                                  onBlur={(event) =>
                                    void handleToolFieldSave(
                                      tool,
                                      field,
                                      event.currentTarget.value,
                                    )
                                  }
                                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-border dark:bg-muted dark:text-white"
                                />
                                {field.suffix ? (
                                  <span className="text-xs font-black text-muted-foreground">
                                    {field.suffix}
                                  </span>
                                ) : null}
                                {fieldSaving ? (
                                  <span className="text-[11px] font-bold text-primary dark:text-primary">
                                    {t("storeConversionSettings.savingField")}
                                  </span>
                                ) : null}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-black ${
                        saving
                          ? "text-indigo-700 dark:text-primary"
                          : isToolFieldSaving
                            ? "text-indigo-700 dark:text-primary"
                          : enabled
                            ? "text-emerald-700 dark:text-success"
                            : "text-muted-foreground/80"
                      }`}
                    >
                      {saving || isToolFieldSaving
                        ? t("storeConversionSettings.savingField")
                        : availability.available
                          ? enabled
                            ? t("storeConversionSettings.enabled")
                            : t("storeConversionSettings.disabledLabel")
                          : t("storeConversionSettings.notAvailable")}
                    </span>
                    <ToggleSwitch
                      label={toolLabel}
                      checked={enabled}
                      disabled={!availability.available || saving || isToolFieldSaving || loading}
                      onToggle={() => void handleToolToggle(tool, !enabled)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
