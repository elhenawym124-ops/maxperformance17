import React, { useCallback, useState } from "react";
import { ChevronDown, Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import {
  getSettings,
  updateSettings,
  type YouTubePrivacyStatus,
  type YouTubeSettings,
} from "../../services/youtubePublishService";

const inputClass =
  "w-full rounded-md border border-border/80 bg-background px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const labelClass = "mb-1 block text-xs font-medium text-foreground";

const PRIVACY_OPTIONS: { value: YouTubePrivacyStatus; label: string }[] = [
  { value: "private", label: "خاص" },
  { value: "unlisted", label: "غير مدرج" },
  { value: "public", label: "علني" },
];

function resolveRedirectUri(configured?: string | null): string {
  const fallback = `${window.location.origin}/api/v1/youtube/auth/callback`;
  const value = String(configured || "").trim();
  if (!value || /127\.0\.0\.1|localhost/i.test(value)) return fallback;
  return value;
}

function extractError(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as {
      response?: { data?: { error?: string | { message?: string }; message?: string } };
      message?: string;
    };
    const errField = e.response?.data?.error;
    if (typeof errField === "string") return errField;
    if (errField && typeof errField === "object" && errField.message) return errField.message;
    if (e.response?.data?.message) return e.response.data.message;
    if (e.message) return e.message;
  }
  return "حدث خطأ غير متوقع";
}

export default function YoutubeSettingsPanel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<YouTubeSettings | null>(null);

  const [isEnabled, setIsEnabled] = useState(true);
  const [maxUploadsPerDay, setMaxUploadsPerDay] = useState("10");
  const [defaultPrivacy, setDefaultPrivacy] = useState<YouTubePrivacyStatus>("private");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSettings();
      setSettings(data);
      setIsEnabled(data.isEnabled);
      setMaxUploadsPerDay(String(data.maxUploadsPerDay));
      setDefaultPrivacy((data.defaultPrivacy as YouTubePrivacyStatus) || "private");
      setRedirectUri(resolveRedirectUri(data.redirectUri));
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !settings) load();
  };

  const handleSave = async () => {
    const max = Number(maxUploadsPerDay);
    if (!Number.isInteger(max) || max < 1) {
      toast.error("الحد اليومي غير صالح");
      return;
    }

    setSaving(true);
    try {
      const data = await updateSettings({
        isEnabled,
        maxUploadsPerDay: max,
        defaultPrivacy,
        ...(clientId.trim() ? { clientId: clientId.trim() } : {}),
        ...(clientSecret.trim() ? { clientSecret: clientSecret.trim() } : {}),
        ...(redirectUri.trim() ? { redirectUri: redirectUri.trim() } : {}),
      });
      setSettings(data);
      setClientId("");
      setClientSecret("");
      toast.success("تم حفظ الإعدادات");
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-border/70 bg-card">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-start transition-colors hover:bg-muted/40 active:scale-[0.99]"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Settings2 className="h-4 w-4 text-primary" />
          إعدادات YouTube
          {settings && !loading ? (
            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {settings.remainingToday}/{settings.maxUploadsPerDay}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="border-t border-border/70 px-4 py-3">
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري التحميل...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>حالة النشر</label>
                  <button
                    type="button"
                    onClick={() => setIsEnabled((v) => !v)}
                    className={`w-full rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isEnabled
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/70 bg-background text-muted-foreground"
                    }`}
                  >
                    {isEnabled ? "مفعّل" : "معطّل"}
                  </button>
                </div>

                <div>
                  <label className={labelClass}>الحد اليومي للرفع</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={maxUploadsPerDay}
                    onChange={(e) => setMaxUploadsPerDay(e.target.value)}
                    className={`${inputClass} font-mono tabular-nums`}
                  />
                </div>

                <div>
                  <label className={labelClass}>الخصوصية الافتراضية</label>
                  <div className="grid grid-cols-3 gap-1">
                    {PRIVACY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDefaultPrivacy(opt.value)}
                        className={`rounded-md border px-1 py-1.5 text-[11px] font-medium transition-colors ${
                          defaultPrivacy === opt.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/70 bg-background text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Client ID</label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder={settings?.clientIdHint || "xxxxxxxx.apps.googleusercontent.com"}
                    className={`${inputClass} font-mono`}
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className={labelClass}>Client Secret</label>
                  <input
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder={settings?.hasCredentials ? "••••••••" : "Client Secret"}
                    className={`${inputClass} font-mono`}
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Redirect URI</label>
                <input
                  type="text"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                  className={`${inputClass} font-mono`}
                  dir="ltr"
                />
              </div>

              <div className="flex flex-col items-stretch gap-2 border-t border-border/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {settings ? `${settings.usedToday} مرفوع اليوم` : "—"}
                </span>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 active:scale-[0.97] disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  حفظ الإعدادات
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
