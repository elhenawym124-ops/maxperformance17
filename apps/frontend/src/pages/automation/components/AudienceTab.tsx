import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  UsersIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  botAutomationService,
  type SegmentRule,
} from "../../../services/botAutomationService";

const SEGMENT_FIELDS = [
  { key: "firstName", label: "FirstName" },
  { key: "lastName", label: "LastName" },
  { key: "phone", label: "Phone" },
  { key: "totalOrdersCount", label: "TotalOrders" },
  { key: "successScore", label: "SuccessScore" },
  { key: "status", label: "Status" },
];

const OPS = [
  { key: "eq", label: "=" },
  { key: "contains", label: "contains" },
  { key: "gte", label: "≥" },
  { key: "lte", label: "≤" },
] as const;

const AudienceTab: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<{ id: string; name: string; key: string }[]>([]);
  const [newField, setNewField] = useState("");
  const [segments, setSegments] = useState<{ id: string; name: string; rules: SegmentRule[] }[]>([]);
  const [unsubs, setUnsubs] = useState<{
    id: string;
    customerId: string;
    channel: string;
    customerName: string;
    phone: string | null;
    unsubscribedAt: string;
  }[]>([]);
  const [previews, setPreviews] = useState<Record<string, number>>({});
  const [segmentDialog, setSegmentDialog] = useState(false);
  const [editingSegment, setEditingSegment] = useState<{ id?: string; name: string; rules: SegmentRule[] }>({ name: "", rules: [] });
  const [newRuleField, setNewRuleField] = useState("firstName");
  const [newRuleOp, setNewRuleOp] = useState<SegmentRule["op"]>("eq");
  const [newRuleValue, setNewRuleValue] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [f, s, u] = await Promise.all([
        botAutomationService.listCustomFields(),
        botAutomationService.listSegments(),
        botAutomationService.listUnsubscribers(),
      ]);
      setFields(f);
      setSegments(s);
      setUnsubs(u);
      setPreviews({});
    } catch (e) {
      toast.error(String(t("botStudio.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const addField = async () => {
    if (!newField.trim()) return;
    try {
      await botAutomationService.createCustomField(newField.trim());
      toast.success(String(t("botStudio.saved")));
      setNewField("");
      load();
    } catch (e) {
      toast.error(String(t("botStudio.saveFailed")));
    }
  };

  const addRule = () => {
    if (!newRuleValue.trim()) return;
    setEditingSegment({
      ...editingSegment,
      rules: [...editingSegment.rules, { field: newRuleField, op: newRuleOp, value: newRuleValue.trim() }],
    });
    setNewRuleValue("");
  };

  const saveSegment = async () => {
    if (!editingSegment.name.trim()) return;
    try {
      if (editingSegment.id) {
        await botAutomationService.updateSegment(editingSegment.id, editingSegment.name, editingSegment.rules);
      } else {
        await botAutomationService.createSegment(editingSegment.name, editingSegment.rules);
      }
      toast.success(String(t("botStudio.saved")));
      setSegmentDialog(false);
      load();
    } catch (e) {
      toast.error(String(t("botStudio.saveFailed")));
    }
  };

  const preview = async (id: string) => {
    try {
      const result = await botAutomationService.previewSegment(id);
      setPreviews((prev) => ({ ...prev, [id]: result.count }));
      toast.success(String(t("botStudio.segmentCount", { count: result.count })));
    } catch (e) {
      toast.error(String(t("botStudio.saveFailed")));
    }
  };

  const resubscribe = async (customerId: string, channel: string) => {
    try {
      await botAutomationService.resubscribe(customerId, channel);
      toast.success(String(t("botStudio.saved")));
      load();
    } catch (e) {
      toast.error(String(t("botStudio.saveFailed")));
    }
  };

  const allSegmentFields = [...SEGMENT_FIELDS, ...fields.map((f) => ({ key: f.key, label: f.name }))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary dark:border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-card rounded-xl shadow-sm border border-border dark:border-border overflow-hidden">
        <div className="p-4 border-b border-border dark:border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{t("botStudio.customFields")}</h3>
        </div>
        <div className="p-4">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
              placeholder={String(t("botStudio.customFieldPlaceholder"))}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
            />
            <button onClick={addField} className="px-3 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm">
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {fields.map((f) => (
              <span key={f.id} className="inline-flex items-center gap-2 px-3 py-1 bg-muted text-foreground rounded-full text-sm">
                {f.name} <code className="text-xs">{f.key}</code>
                <button onClick={() => botAutomationService.deleteCustomField(f.id).then(load)} className="hover:text-red-500">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border dark:border-border overflow-hidden">
        <div className="p-4 border-b border-border dark:border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{t("botStudio.segments")}</h3>
          <button
            onClick={() => { setEditingSegment({ name: "", rules: [] }); setSegmentDialog(true); }}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm"
          >
            <PlusIcon className="h-4 w-4" /> {t("botStudio.addSegment")}
          </button>
        </div>
        <div className="divide-y divide-border dark:divide-border">
          {segments.length === 0 && (
            <div className="p-8 text-center">
              <UsersIcon className="h-10 w-10 text-muted-foreground dark:text-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{t("botStudio.noSegments")}</p>
            </div>
          )}
          {segments.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground">{s.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {s.rules.length} {t("botStudio.rulesCount")}
                  {previews[s.id] !== undefined && ` · ${previews[s.id]} ${t("botStudio.customers")}`}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => preview(s.id)}
                  className="p-2 text-muted-foreground hover:text-primary"
                  title={String(t("botStudio.segmentPreview"))}
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setEditingSegment({ id: s.id, name: s.name, rules: s.rules }); setSegmentDialog(true); }}
                  className="p-2 text-muted-foreground hover:text-primary"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => botAutomationService.deleteSegment(s.id).then(load)}
                  className="p-2 text-muted-foreground hover:text-destructive"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border dark:border-border overflow-hidden">
        <div className="p-4 border-b border-border dark:border-border">
          <h3 className="font-semibold text-foreground">{t("botStudio.unsubscribers")}</h3>
          <p className="text-sm text-foreground dark:text-muted-foreground mt-0.5">{t("botStudio.unsubscribersDesc")}</p>
        </div>
        <div className="divide-y divide-border dark:divide-border">
          {unsubs.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">{t("botStudio.noUnsubscribers")}</div>
          )}
          {unsubs.map((u) => (
            <div key={u.id} className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{u.customerName || u.customerId}</p>
                <p className="text-xs text-muted-foreground">
                  {u.channel} · {u.phone || "—"} · {new Date(u.unsubscribedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => resubscribe(u.customerId, u.channel)}
                className="px-3 py-1.5 bg-muted dark:bg-muted text-foreground rounded-lg text-xs hover:bg-muted dark:hover:bg-muted shrink-0"
              >
                {t("botStudio.resubscribe")}
              </button>
            </div>
          ))}
        </div>
      </div>

      {segmentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-5 border-b border-border dark:border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {editingSegment.id ? t("botStudio.editSegment") : t("botStudio.addSegment")}
              </h2>
              <button onClick={() => setSegmentDialog(false)} className="text-gray-500 hover:text-foreground">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <input
                type="text"
                value={editingSegment.name}
                onChange={(e) => setEditingSegment({ ...editingSegment, name: e.target.value })}
                placeholder={String(t("botStudio.segmentNamePlaceholder"))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
              />
              <div className="space-y-2">
                {editingSegment.rules.map((r, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="text-sm text-foreground flex-1">
                      {r.field} {r.op} {r.value}
                    </span>
                    <button
                      onClick={() =>
                        setEditingSegment({ ...editingSegment, rules: editingSegment.rules.filter((_, i) => i !== idx) })
                      }
                      className="text-gray-500 hover:text-destructive"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <select
                    value={newRuleField}
                    onChange={(e) => setNewRuleField(e.target.value)}
                    className="flex-1 px-2 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
                  >
                    {allSegmentFields.map((f) => (
                      <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                  </select>
                  <select
                    value={newRuleOp}
                    onChange={(e) => setNewRuleOp(e.target.value as SegmentRule["op"])}
                    className="px-2 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
                  >
                    {OPS.map((o) => (
                      <option key={o.key} value={o.key}>{o.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newRuleValue}
                    onChange={(e) => setNewRuleValue(e.target.value)}
                    placeholder={String(t("botStudio.ruleValue"))}
                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
                  />
                  <button onClick={addRule} className="px-3 py-2 bg-muted dark:bg-muted rounded-lg hover:bg-muted dark:hover:bg-muted">
                    <PlusIcon className="h-4 w-4 text-foreground" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-border dark:border-border flex justify-end gap-2">
              <button onClick={() => setSegmentDialog(false)} className="px-4 py-2 bg-muted dark:bg-muted text-foreground rounded-lg text-sm">
                {t("botStudio.cancel")}
              </button>
              <button onClick={saveSegment} className="flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm">
                <CheckIcon className="h-4 w-4" /> {t("botStudio.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudienceTab;
