import React, { useRef } from "react";
import {
  Bolt as BoltIcon,
  Clock as ClockIcon,
  Plus as PlusIcon,
  Trash2 as TrashIcon,
} from "lucide-react";
import i18n from "../../../i18n";
import { SettingsData, DevTeamMember, AutomationRule } from "./types";

interface DevTaskEscalationRulesProps {
  settings: SettingsData;
  setSettings: React.Dispatch<React.SetStateAction<SettingsData | null>>;
  teamMembers: DevTeamMember[];
}

export const DevTaskEscalationRules: React.FC<DevTaskEscalationRulesProps> = ({
  settings,
  setSettings,
  teamMembers,
}) => {
  const ruleThresholdRef = useRef<HTMLInputElement>(null);
  const ruleUnitRef = useRef<HTMLSelectElement>(null);
  const ruleScopeRef = useRef<HTMLSelectElement>(null);
  const ruleTargetRef = useRef<HTMLSelectElement>(null);

  const handleAddEscalationRule = () => {
    const threshold = parseInt(ruleThresholdRef.current?.value || "0") || 0;
    const unit = (ruleUnitRef.current?.value || "hours") as "hours" | "days";
    const scope = ruleScopeRef.current?.value || "all";
    const targetId = ruleTargetRef.current?.value || "";

    if (threshold > 0 && targetId) {
      const newRule: AutomationRule = {
        threshold,
        unit,
        scope,
        action: "assign",
        targetId,
      };
      const currentRules = settings.automationSettings?.rules || [];
      setSettings({
        ...settings,
        automationSettings: {
          ...settings.automationSettings,
          rules: [...currentRules, newRule],
        },
      });
    } else {
      alert(i18n.t("DevTaskSettings.msg_fdf4"));
    }
  };

  const handleRemoveEscalationRule = (idx: number) => {
    const newRules = (settings.automationSettings?.rules || []).filter(
      (_, i) => i !== idx,
    );
    setSettings({
      ...settings,
      automationSettings: {
        ...settings.automationSettings,
        rules: newRules,
      },
    });
  };

  return (
    <div className="pt-8 border-t border-border dark:border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          تصعيد المهام المتأخرة (Escalation Rules)
        </h3>
        <a
          href="/super-admin/dev/escalations"
          className="text-sm text-primary hover:text-primary flex items-center gap-1 font-medium"
        >
          <ClockIcon className="h-4 w-4" /> سجل التصعيدات
        </a>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        حدد قواعد لنقل المهام تلقائياً إلى موظف آخر في حال تأخر إنجازها.
      </p>

      {/* Add Rule Form */}
      <div className="bg-gray-50 dark:bg-muted p-4 rounded-lg border border-border dark:border-border mb-6">
        <h4 className="text-sm font-medium text-foreground mb-3">
          إضافة قاعدة جديدة
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="lg:col-span-1">
            <label className="text-xs text-muted-foreground mb-1 block">
              تأخير لمدة
            </label>
            <div className="flex">
              <input
                id="escalation-threshold"
                name="escalationThreshold"
                aria-label="مدة التأخير قبل التصعيد"
                ref={ruleThresholdRef}
                type="number"
                min="1"
                defaultValue="24"
                className="w-full rounded-r border-l-0 border-border dark:bg-muted dark:border-border px-2 py-2 text-sm"
              />
              <select
                id="escalation-unit"
                name="escalationUnit"
                aria-label="وحدة مدة التأخير"
                ref={ruleUnitRef}
                className="rounded-l border-border dark:bg-muted dark:border-border px-2 py-2 text-sm bg-muted dark:bg-muted"
              >
                <option value="hours">ساعة</option>
                <option value="days">يوم</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-1">
            <label className="text-xs text-muted-foreground mb-1 block">
              النطاق (لمن؟)
            </label>
            <select
              id="escalation-scope"
              name="escalationScope"
              aria-label="نطاق التصعيد"
              ref={ruleScopeRef}
              className="w-full rounded border-border dark:bg-muted dark:border-border px-2 py-2 text-sm"
            >
              <option value="all">جميع الموظفين</option>
              {teamMembers.map((m) => (
                <option key={`scope-${m.id}`} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <label className="text-xs text-muted-foreground mb-1 block">
              الإجراء
            </label>
            <input
              value="نقل المهمة إلى"
              disabled
              className="w-full rounded border-border bg-muted dark:bg-muted px-2 py-2 text-sm text-muted-foreground"
            />
          </div>

          <div className="lg:col-span-1">
            <label className="text-xs text-muted-foreground mb-1 block">
              الهدف (إلى من؟)
            </label>
            <select
              id="escalation-target"
              name="escalationTarget"
              aria-label="المسؤول المستهدف للتصعيد"
              ref={ruleTargetRef}
              className="w-full rounded border-border dark:bg-muted dark:border-border px-2 py-2 text-sm"
            >
              <option value="">اختر المسؤول...</option>
              {teamMembers.map((m) => (
                <option key={`target-${m.id}`} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1">
            <button
              onClick={handleAddEscalationRule}
              className="w-full bg-primary hover:bg-primary/90 text-white rounded px-3 py-2 text-sm flex items-center justify-center gap-1 font-medium transition-colors"
            >
              <PlusIcon className="h-4 w-4" /> إضافة
            </button>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {(settings.automationSettings?.rules || []).length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">
            لا توجد قواعد تصعيد معرفة حالياً
          </p>
        ) : (
          settings.automationSettings?.rules.map((rule, idx) => {
            const scopeName =
              rule.scope === "all"
                ? "جميع الموظفين"
                : teamMembers.find((m) => m.id === rule.scope)?.name ||
                  "Unknown";
            const targetName =
              teamMembers.find((m) => m.id === rule.targetId)?.name ||
              "Unknown";

            return (
              <div
                key={idx}
                className="flex items-center justify-between bg-card p-4 rounded-lg border border-border shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-warning dark:bg-warning/20 text-warning rounded-full">
                    <BoltIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      عند التأخر لمدة{" "}
                      <span className="text-indigo-600 font-mono">
                        {rule.threshold}{" "}
                        {rule.unit === "hours" ? "ساعات" : "أيام"}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      لـ: {scopeName} ➞ تصعيد إلى:{" "}
                      <span className="text-green-600 font-medium">
                        {targetName}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveEscalationRule(idx)}
                  className="text-red-500 hover:bg-destructive/10 dark:hover:bg-destructive/20 p-2 rounded-full transition-colors"
                  aria-label="حذف قاعدة التصعيد"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
