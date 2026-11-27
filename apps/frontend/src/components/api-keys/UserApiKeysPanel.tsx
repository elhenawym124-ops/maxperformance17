import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  Copy,
  KeyRound,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
} from "lucide-react";
import { getApiUrl } from "@/config/environment";
import tokenManager from "@/utils/tokenManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface UserApiKeyRecord {
  id: string;
  name: string;
  userId: string;
  keyPrefix: string;
  maskedKey: string;
  permissionMode: "INHERIT_ALL" | "SCOPED";
  scopes: string[];
  rateLimitPerMin: number;
  allowedIps: string[];
  isActive: boolean;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  expiresAt: string | null;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  requestCount: number;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    roleName?: string;
  };
}

interface ManageableUserOption {
  id: string;
  name: string;
  email: string;
  role: string;
  roleName?: string;
}

interface CapabilityPermission {
  key: string;
  name: string;
  domain: string;
}

interface CapabilityModule {
  id: string;
  labelAr: string;
  labelEn: string;
  isAppActive: boolean;
  permissions: CapabilityPermission[];
}

interface UnavailableModule {
  id: string;
  labelAr: string;
  labelEn: string;
  permissionCount: number;
}

interface UserCapabilitiesData {
  targetUserId: string;
  targetRole: string;
  isCompanyInActiveTrial: boolean;
  activeApps: Array<{ slug: string; name: string; status: string }>;
  modules: CapabilityModule[];
  unavailableModules: UnavailableModule[];
  totalAvailablePermissions: number;
}

interface UserApiKeysPanelProps {
  mode: "self" | "user" | "company";
  targetUserId?: string;
  targetUserName?: string;
  compact?: boolean;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = tokenManager.createAuthHeaders({
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  });
  const res = await fetch(`${getApiUrl()}/user-api-keys${path}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || `HTTP ${res.status}`);
  }
  return data as T;
}

const formatShortDate = (value: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit" });
};

export const UserApiKeysPanel: React.FC<UserApiKeysPanelProps> = ({
  mode,
  targetUserId,
  targetUserName,
  compact = false,
}) => {
  const [keys, setKeys] = useState<UserApiKeyRecord[]>([]);
  const [users, setUsers] = useState<ManageableUserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<UserApiKeyRecord | null>(null);
  const [keyName, setKeyName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(targetUserId || "");
  const [permissionMode, setPermissionMode] = useState<"INHERIT_ALL" | "SCOPED">("INHERIT_ALL");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [rateLimitPerMin, setRateLimitPerMin] = useState("60");
  const [expiresInDays, setExpiresInDays] = useState("");
  const [allowedIpsInput, setAllowedIpsInput] = useState("");
  const [saving, setSaving] = useState(false);

  const [capabilities, setCapabilities] = useState<UserCapabilitiesData | null>(null);
  const [capsLoading, setCapsLoading] = useState(false);
  const [permQuery, setPermQuery] = useState("");

  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(!compact);
  const [snippetTab, setSnippetTab] = useState<"curl" | "node" | "python">("curl");
  const [busyId, setBusyId] = useState<string | null>(null);

  const apiBaseUrl = (() => {
    const raw = getApiUrl();
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    if (typeof window !== "undefined") return `${window.location.origin}${raw}`;
    return raw;
  })();

  const copySnippet = async (tag: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(tag);
      setTimeout(() => setCopiedId((prev) => (prev === tag ? null : prev)), 2000);
    } catch {
      /* ignore clipboard error */
    }
  };

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const endpoint =
        mode === "company"
          ? "?scope=company&includeRevoked=true"
          : mode === "user" && targetUserId
            ? `/users/${encodeURIComponent(targetUserId)}?includeRevoked=true`
            : "/me?includeRevoked=true";
      const res = await apiRequest<{ success: boolean; data: UserApiKeyRecord[] }>(endpoint);
      setKeys(Array.isArray(res.data) ? res.data : []);

      if (mode === "company") {
        const uRes = await apiRequest<{ success: boolean; data: ManageableUserOption[] }>(
          "/manageable-users",
        );
        const list = Array.isArray(uRes.data) ? uRes.data : [];
        setUsers(list);
        if (list.length > 0 && !selectedUserId) {
          setSelectedUserId(list[0].id);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "فشل تحميل المفاتيح";
      if (msg.includes("صلاحية") || msg.includes("403")) {
        setForbidden(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [mode, targetUserId]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const effectiveTargetUserId = useMemo(() => {
    if (editingKey) return editingKey.userId;
    if (mode === "user" && targetUserId) return targetUserId;
    if (mode === "company" && selectedUserId) return selectedUserId;
    return "";
  }, [editingKey, mode, targetUserId, selectedUserId]);

  const loadCapabilities = useCallback(async (uid: string) => {
    setCapsLoading(true);
    try {
      const qs = uid ? `?userId=${encodeURIComponent(uid)}` : "";
      const res = await apiRequest<{ success: boolean; data: UserCapabilitiesData }>(
        `/capabilities${qs}`,
      );
      setCapabilities(res.data || null);
    } catch {
      setCapabilities(null);
    } finally {
      setCapsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (formOpen) {
      void loadCapabilities(effectiveTargetUserId);
    }
  }, [formOpen, effectiveTargetUserId, loadCapabilities]);

  const openCreateModal = () => {
    setError(null);
    setEditingKey(null);
    setKeyName("");
    setPermissionMode("INHERIT_ALL");
    setSelectedScopes([]);
    setRateLimitPerMin("60");
    setExpiresInDays("");
    setAllowedIpsInput("");
    setPermQuery("");
    setFormOpen(true);
  };

  const openEditModal = (item: UserApiKeyRecord) => {
    setError(null);
    setEditingKey(item);
    setKeyName(item.name);
    setSelectedUserId(item.userId);
    setPermissionMode(item.permissionMode || "INHERIT_ALL");
    setSelectedScopes(Array.isArray(item.scopes) ? item.scopes : []);
    setRateLimitPerMin(String(item.rateLimitPerMin || 60));
    setExpiresInDays("");
    setAllowedIpsInput((item.allowedIps || []).join(", "));
    setPermQuery("");
    setFormOpen(true);
  };

  const toggleScope = (key: string, checked: boolean) => {
    setSelectedScopes((prev) =>
      checked ? [...new Set([...prev, key])] : prev.filter((k) => k !== key),
    );
  };

  const toggleModuleAll = (mod: CapabilityModule, selectAll: boolean) => {
    const keysInMod = mod.permissions.map((p) => p.key);
    setSelectedScopes((prev) => {
      if (selectAll) return [...new Set([...prev, ...keysInMod])];
      const modSet = new Set(keysInMod);
      return prev.filter((k) => !modSet.has(k));
    });
  };

  const filteredModules = useMemo(() => {
    const modules = capabilities?.modules || [];
    const q = permQuery.trim().toLowerCase();
    if (!q) return modules;
    return modules
      .map((mod) => ({
        ...mod,
        permissions: mod.permissions.filter(
          (p) =>
            p.key.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            mod.labelAr.toLowerCase().includes(q) ||
            mod.labelEn.toLowerCase().includes(q),
        ),
      }))
      .filter((mod) => mod.permissions.length > 0);
  }, [capabilities, permQuery]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    if (permissionMode === "SCOPED" && selectedScopes.length === 0) {
      setError("يرجى اختيار صلاحية واحدة على الأقل عند تحديد صلاحيات مخصّصة");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: keyName.trim(),
        permissionMode,
        scopes: permissionMode === "SCOPED" ? selectedScopes : [],
        rateLimitPerMin: Number(rateLimitPerMin) || 60,
        allowedIps: allowedIpsInput
          .split(/[\n,]+/)
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (expiresInDays.trim()) {
        payload.expiresInDays = Number(expiresInDays);
      }

      if (editingKey) {
        await apiRequest(`/${encodeURIComponent(editingKey.id)}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setFormOpen(false);
        setEditingKey(null);
      } else {
        if (mode === "user" && targetUserId) {
          payload.userId = targetUserId;
        } else if (mode === "company" && selectedUserId) {
          payload.userId = selectedUserId;
        }
        const res = await apiRequest<{
          success: boolean;
          data: UserApiKeyRecord;
          secret?: { apiKey?: string };
        }>("", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setFormOpen(false);
        if (res.secret?.apiKey) {
          setRevealedKey(res.secret.apiKey);
          setCopiedId(null);
        }
      }
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل حفظ المفتاح");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await apiRequest(`/${encodeURIComponent(id)}/revoke`, { method: "POST", body: "{}" });
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إيقاف المفتاح");
    } finally {
      setBusyId(null);
    }
  };

  const handleReactivate = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await apiRequest(`/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: true }),
      });
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تفعيل المفتاح");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    setError(null);
    try {
      await apiRequest(`/${encodeURIComponent(id)}`, { method: "DELETE" });
      await loadKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل حذف المفتاح");
    } finally {
      setBusyId(null);
    }
  };

  if (forbidden) {
    return null;
  }

  const exampleKey = revealedKey || "mxp_usr_YOUR_KEY";
  const snippetMap: Record<"curl" | "node" | "python", string> = {
    curl: `curl -H "Authorization: Bearer ${exampleKey}" \\\n  "${apiBaseUrl}/user-api-keys/whoami"`,
    node: `const res = await fetch("${apiBaseUrl}/orders?limit=10", {\n  headers: { Authorization: "Bearer ${exampleKey}" },\n});\nconst data = await res.json();`,
    python: `import requests\nres = requests.get(\n    "${apiBaseUrl}/user-api-keys/whoami",\n    headers={"x-api-key": "${exampleKey}"},\n)\nprint(res.json())`,
  };

  return (
    <div dir="rtl" className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {mode === "company"
              ? "مفاتيح API الموظفين"
              : targetUserName
                ? `مفاتيح API — ${targetUserName}`
                : "مفاتيح API الشخصية"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setGuideOpen((v) => !v)}
          >
            <BookOpen className="me-1.5 size-4" />
            {guideOpen ? "إخفاء الإرشادات" : "إرشادات الاستخدام"}
          </Button>
          <Button type="button" size="sm" onClick={openCreateModal}>
            <Plus className="me-1.5 size-4" />
            إنشاء مفتاح
          </Button>
        </div>
      </div>

      {guideOpen && (
        <div className="divide-y divide-border/70 border-y border-border/70 bg-muted/30 text-xs">
          <div className="grid gap-3 p-3 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="font-semibold text-foreground">الصلاحيات الحية</p>
              <p className="text-muted-foreground">
                المفتاح يرث صلاحيات الموظف الحية أو مجموعة مختارة منها ضمن التطبيقات المفعّلة للشركة.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">طريقة الإرسال</p>
              <p className="text-muted-foreground">
                مرّر المفتاح في هيدر <code dir="ltr" className="font-mono text-foreground">Authorization: Bearer</code> أو{" "}
                <code dir="ltr" className="font-mono text-foreground">x-api-key</code>.
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground">نقاط البداية للـ Agent</p>
              <div className="flex flex-col gap-1 font-mono text-[11px] text-foreground" dir="ltr">
                <span>GET /api/v1/user-api-keys/whoami</span>
                <span>GET /api/v1/auth/me</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {(["curl", "node", "python"] as const).map((lang) => (
                  <Button
                    key={lang}
                    type="button"
                    size="sm"
                    variant={snippetTab === lang ? "default" : "ghost"}
                    className="h-7 px-2.5 text-[11px] font-mono"
                    onClick={() => setSnippetTab(lang)}
                  >
                    {lang === "curl" ? "cURL" : lang === "node" ? "Node.js" : "Python"}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-[11px]"
                onClick={() => copySnippet(`guide-${snippetTab}`, snippetMap[snippetTab])}
              >
                {copiedId === `guide-${snippetTab}` ? (
                  <Check className="me-1 size-3.5" />
                ) : (
                  <Copy className="me-1 size-3.5" />
                )}
                {copiedId === `guide-${snippetTab}` ? "تم النسخ" : "نسخ المثال"}
              </Button>
            </div>
            <pre
              dir="ltr"
              className="overflow-x-auto rounded-md border border-border/70 bg-card p-2.5 font-mono text-[11px] text-foreground"
            >
              {snippetMap[snippetTab]}
            </pre>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-6 text-center text-xs text-muted-foreground">جاري التحميل...</div>
      ) : keys.length === 0 ? (
        <div className="border-t border-border/70 py-6 text-center text-xs text-muted-foreground">
          لا توجد مفاتيح API بعد
        </div>
      ) : (
        <div className="divide-y divide-border/70 border-y border-border/70">
          {keys.map((item) => {
            const isActive = item.status === "ACTIVE";
            const isRevoked = item.status === "REVOKED";
            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                    <Badge variant={isActive ? "default" : "secondary"} className="text-[11px]">
                      {item.status === "ACTIVE"
                        ? "نشط"
                        : item.status === "EXPIRED"
                          ? "منتهي"
                          : "موقوف"}
                    </Badge>
                    <Badge variant="outline" className="text-[11px]">
                      {item.permissionMode === "SCOPED"
                        ? `مقيّد (${item.scopes?.length || 0})`
                        : "كل الصلاحيات"}
                    </Badge>
                    {mode === "company" && item.user && (
                      <span className="text-xs text-muted-foreground">
                        {item.user.name} ({item.user.roleName || item.user.role})
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <code dir="ltr" className="font-mono tabular-nums text-foreground">
                      {item.maskedKey}
                    </code>
                    <span className="tabular-nums">{item.rateLimitPerMin || 60} طلب/د</span>
                    <span className="tabular-nums">الطلبات: {item.requestCount}</span>
                    <span>
                      آخر استخدام:{" "}
                      <span className="font-mono tabular-nums">
                        {formatShortDate(item.lastUsedAt)}
                      </span>
                    </span>
                    {item.expiresAt && (
                      <span>
                        ينتهي:{" "}
                        <span className="font-mono tabular-nums">
                          {formatShortDate(item.expiresAt)}
                        </span>
                      </span>
                    )}
                    {item.allowedIps && item.allowedIps.length > 0 && (
                      <span className="font-mono tabular-nums">
                        IPs: {item.allowedIps.length}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => openEditModal(item)}
                  >
                    <Pencil className="me-1 size-3.5" />
                    تعديل
                  </Button>
                  {isActive ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyId === item.id}
                      onClick={() => handleRevoke(item.id)}
                    >
                      <ShieldOff className="me-1 size-3.5" />
                      إيقاف
                    </Button>
                  ) : isRevoked ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyId === item.id}
                      onClick={() => handleReactivate(item.id)}
                    >
                      <ShieldCheck className="me-1 size-3.5" />
                      تفعيل
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={busyId === item.id}
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Key Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingKey ? `تعديل مفتاح API — ${editingKey.name}` : "إنشاء مفتاح API بصلاحيات الموظف"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {mode === "company" && !editingKey && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">الموظف</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                    setSelectedScopes([]);
                  }}
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.roleName || u.role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">اسم المفتاح</label>
              <Input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="مثال: وكيل المبيعات / Agent Bot"
                required
                minLength={2}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">نطاق الصلاحيات</label>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPermissionMode("INHERIT_ALL")}
                  className={`rounded-lg border p-3 text-start text-xs transition-colors ${
                    permissionMode === "INHERIT_ALL"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border/70 bg-card text-muted-foreground"
                  }`}
                >
                  <div className="font-semibold text-foreground">كل صلاحيات الموظف الحية</div>
                  <div className="mt-0.5 text-[11px]">
                    يرث تلقائياً {capabilities?.totalAvailablePermissions ?? "جميع"} صلاحية متاحة ضمن تطبيقات الشركة وأي صلاحية تُفتح مستقبلاً.
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPermissionMode("SCOPED")}
                  className={`rounded-lg border p-3 text-start text-xs transition-colors ${
                    permissionMode === "SCOPED"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border/70 bg-card text-muted-foreground"
                  }`}
                >
                  <div className="font-semibold text-foreground">صلاحيات محددة فقط</div>
                  <div className="mt-0.5 text-[11px]">
                    تقييد المفتاح بأقسام أو إجراءات معينة من صلاحيات الموظف وتطبيقات الشركة المفعّلة.
                  </div>
                </button>
              </div>
            </div>

            {permissionMode === "SCOPED" && (
              <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="pointer-events-none absolute inset-y-0 start-2.5 my-auto size-3.5 text-muted-foreground" />
                    <Input
                      value={permQuery}
                      onChange={(e) => setPermQuery(e.target.value)}
                      placeholder="بحث في الصلاحيات المفعّلة..."
                      className="h-8 ps-8 text-xs"
                    />
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
                    المحدد: {selectedScopes.length}
                  </span>
                </div>

                {capsLoading ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    جاري تحميل تطبيقات الشركة وصلاحيات الموظف...
                  </div>
                ) : filteredModules.length === 0 ? (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    لا توجد صلاحيات مطابقة للبحث
                  </div>
                ) : (
                  <div className="max-h-64 space-y-2.5 overflow-y-auto pe-1">
                    {filteredModules.map((mod) => {
                      const modKeys = mod.permissions.map((p) => p.key);
                      const selectedInMod = modKeys.filter((k) => selectedScopes.includes(k)).length;
                      const allSelected = modKeys.length > 0 && selectedInMod === modKeys.length;
                      return (
                        <div key={mod.id} className="rounded-md border border-border/70 bg-card p-2.5">
                          <div className="mb-2 flex items-center justify-between gap-2 border-b border-border/50 pb-1.5">
                            <span className="text-xs font-semibold text-foreground">
                              {mod.labelAr}{" "}
                              <span className="font-mono text-[10px] text-muted-foreground">
                                ({selectedInMod}/{modKeys.length})
                              </span>
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[11px]"
                              onClick={() => toggleModuleAll(mod, !allSelected)}
                            >
                              {allSelected ? "إلغاء الكل" : "تحديد الكل"}
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                            {mod.permissions.map((perm) => (
                              <label
                                key={perm.key}
                                className="flex cursor-pointer items-center gap-2 text-xs text-foreground"
                              >
                                <Checkbox
                                  checked={selectedScopes.includes(perm.key)}
                                  onCheckedChange={(checked) =>
                                    toggleScope(perm.key, checked === true)
                                  }
                                />
                                <span className="truncate" title={perm.key}>
                                  {perm.name}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {capabilities && capabilities.unavailableModules.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    تم إخفاء {capabilities.unavailableModules.length} أقسام لأن تطبيقاتها غير مفعّلة في هذه الشركة:{" "}
                    {capabilities.unavailableModules.map((m) => m.labelAr).join("، ")}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">حد الطلبات (طلب/دقيقة)</label>
                <Input
                  type="number"
                  min={10}
                  max={600}
                  value={rateLimitPerMin}
                  onChange={(e) => setRateLimitPerMin(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  مدة الصلاحية (أيام، اختياري)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={3650}
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  placeholder="اتركه فارغاً لعدم الانتهاء"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  عناوين IP المسموحة (اختياري)
                </label>
                <Input
                  dir="ltr"
                  value={allowedIpsInput}
                  onChange={(e) => setAllowedIpsInput(e.target.value)}
                  placeholder="1.2.3.4, 5.6.7.8"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving || !keyName.trim()}>
                {saving ? "جاري الحفظ..." : editingKey ? "حفظ التعديلات" : "إنشاء"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* One-Time Key Reveal Dialog */}
      <Dialog open={Boolean(revealedKey)} onOpenChange={(open) => !open && setRevealedKey(null)}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>احفظ المفتاح الآن — لن يظهر مرة أخرى</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted p-3">
              <code
                dir="ltr"
                className="flex-1 break-all font-mono text-xs text-foreground select-all"
              >
                {revealedKey}
              </code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => revealedKey && copySnippet("reveal-key", revealedKey)}
              >
                {copiedId === "reveal-key" ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <div className="space-y-1.5 rounded-lg border border-border/70 bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-muted-foreground">
                  أمر اختبار الصلاحيات والهوية للـ Agent
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => copySnippet("reveal-curl", snippetMap.curl)}
                >
                  {copiedId === "reveal-curl" ? (
                    <Check className="me-1 size-3" />
                  ) : (
                    <Copy className="me-1 size-3" />
                  )}
                  نسخ
                </Button>
              </div>
              <pre
                dir="ltr"
                className="overflow-x-auto font-mono text-[11px] text-foreground"
              >
                {snippetMap.curl}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setRevealedKey(null)}>
              تم الحفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserApiKeysPanel;
