import React, { useState, useEffect } from "react";
import {
  Cog6ToothIcon,
  ClockIcon,
  BellIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { broadcastService } from "../../services/broadcastService";

interface BroadcastSettings {
  // General Settings
  defaultSendTime: string;
  timezone: string;
  maxRecipientsPerCampaign: number;
  maxCampaignsPerDay: number;

  // Delivery Settings
  enableDeliveryReports: boolean;
  enableOpenTracking: boolean;
  enableClickTracking: boolean;
  enableUnsubscribeTracking: boolean;

  // Notification Settings
  notifyOnCampaignSent: boolean;
  notifyOnHighUnsubscribeRate: boolean;
  notifyOnLowDeliveryRate: boolean;
  adminEmail: string;

  // Security Settings
  requireApprovalForHighVolume: boolean;
  highVolumeThreshold: number;
  enableContentFiltering: boolean;
  blockedWords: string[];

  // Rate Limiting
  messagesPerMinute: number;
  messagesPerHour: number;
  messagesPerDay: number;

  // Templates
  defaultFooter: string;
  unsubscribeText: string;
  companyName: string;
  companyAddress: string;
}

const BroadcastSettings: React.FC = () => {
  const [settings, setSettings] = useState<BroadcastSettings>({
    // General Settings
    defaultSendTime: "10:00",
    timezone: "Asia/Riyadh",
    maxRecipientsPerCampaign: 5000,
    maxCampaignsPerDay: 10,

    // Delivery Settings
    enableDeliveryReports: true,
    enableOpenTracking: true,
    enableClickTracking: true,
    enableUnsubscribeTracking: true,

    // Notification Settings
    notifyOnCampaignSent: true,
    notifyOnHighUnsubscribeRate: true,
    notifyOnLowDeliveryRate: true,
    adminEmail: "admin@company.com",

    // Security Settings
    requireApprovalForHighVolume: true,
    highVolumeThreshold: 1000,
    enableContentFiltering: true,
    blockedWords: ["spam", "fake", "scam"],

    // Rate Limiting
    messagesPerMinute: 100,
    messagesPerHour: 1000,
    messagesPerDay: 10000,

    // Templates
    defaultFooter: "شكراً لك على اشتراكك في خدماتنا",
    unsubscribeText: "لإلغاء الاشتراك، اضغط هنا",
    companyName: "شركة التواصل",
    companyAddress: "الرياض، المملكة العربية السعودية",
  });

  const [activeSection, setActiveSection] = useState<
    "general" | "delivery" | "notifications" | "security" | "templates"
  >("general");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBlockedWord, setNewBlockedWord] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log("⚙️ Loading broadcast settings...");
      const response = await broadcastService.getSettings();
      console.log("⚙️ Settings response:", response);

      // Handle different response formats
      let settingsData = null;
      if (response && typeof response === "object") {
        if ("data" in response) {
          settingsData = (response as any).data;
        } else if ("success" in response && "data" in response) {
          settingsData = (response as any).data;
        } else {
          settingsData = response;
        }
      }

      if (settingsData) {
        setSettings(settingsData);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      // Keep default settings if loading fails
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setSettings((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setSettings((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addBlockedWord = () => {
    if (
      newBlockedWord.trim() &&
      !settings.blockedWords.includes(newBlockedWord.trim())
    ) {
      setSettings((prev) => ({
        ...prev,
        blockedWords: [...prev.blockedWords, newBlockedWord.trim()],
      }));
      setNewBlockedWord("");
    }
  };

  const removeBlockedWord = (word: string) => {
    setSettings((prev) => ({
      ...prev,
      blockedWords: prev.blockedWords.filter((w) => w !== word),
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("💾 Saving broadcast settings:", settings);
      const updatedSettings = await broadcastService.updateSettings(settings);
      console.log("✅ Settings saved successfully:", updatedSettings);

      // Update local state with server response
      if (updatedSettings) {
        setSettings(updatedSettings);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("❌ Error saving settings:", err);
      setError(err.message || "فشل في حفظ الإعدادات. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: "general", name: "الإعدادات العامة", icon: Cog6ToothIcon },
    { id: "delivery", name: "إعدادات التسليم", icon: EnvelopeIcon },
    { id: "notifications", name: "التنبيهات", icon: BellIcon },
    { id: "security", name: "الأمان", icon: ShieldCheckIcon },
    { id: "templates", name: "القوالب", icon: ChartBarIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg leading-6 font-medium text-foreground">
            إعدادات البرودكاست
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            إدارة إعدادات نظام الإرسال الجماعي والتحكم في سلوك النظام
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <ClockIcon className="h-4 w-4 ms-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-4 w-4 ms-2" />
              حفظ الإعدادات
            </>
          )}
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-success rounded-md p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-success" />
            <div className="me-3">
              <p className="text-sm text-success">تم حفظ الإعدادات بنجاح!</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-destructive rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-destructive" />
            <div className="me-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card shadow sm:rounded-lg">
        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-muted dark:bg-muted rounded-r-lg">
            <nav className="p-4 space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as any)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeSection === section.id
                        ? "bg-indigo-100 text-primary dark:bg-primary dark:text-primary"
                        : "text-gray-600 hover:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-5 w-5 ms-3" />
                    {section.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {activeSection === "general" && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-foreground">
                  الإعدادات العامة
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      وقت الإرسال الافتراضي
                    </label>
                    <input
                      type="time"
                      name="defaultSendTime"
                      value={settings.defaultSendTime}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      المنطقة الزمنية
                    </label>
                    <select
                      name="timezone"
                      value={settings.timezone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    >
                      <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                      <option value="Asia/Dubai">دبي (GMT+4)</option>
                      <option value="Africa/Cairo">القاهرة (GMT+2)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      الحد الأقصى للمستلمين لكل حملة
                    </label>
                    <input
                      type="number"
                      name="maxRecipientsPerCampaign"
                      value={settings.maxRecipientsPerCampaign}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      الحد الأقصى للحملات يومياً
                    </label>
                    <input
                      type="number"
                      name="maxCampaignsPerDay"
                      value={settings.maxCampaignsPerDay}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "delivery" && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-foreground">
                  إعدادات التسليم
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="enableDeliveryReports"
                      name="enableDeliveryReports"
                      type="checkbox"
                      checked={settings.enableDeliveryReports}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                    <label
                      htmlFor="enableDeliveryReports"
                      className="me-2 block text-sm text-foreground dark:text-muted-foreground"
                    >
                      تفعيل تقارير التسليم
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="enableOpenTracking"
                      name="enableOpenTracking"
                      type="checkbox"
                      checked={settings.enableOpenTracking}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                    <label
                      htmlFor="enableOpenTracking"
                      className="me-2 block text-sm text-foreground dark:text-muted-foreground"
                    >
                      تتبع فتح الرسائل
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="enableClickTracking"
                      name="enableClickTracking"
                      type="checkbox"
                      checked={settings.enableClickTracking}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                    <label
                      htmlFor="enableClickTracking"
                      className="me-2 block text-sm text-foreground dark:text-muted-foreground"
                    >
                      تتبع النقرات
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="enableUnsubscribeTracking"
                      name="enableUnsubscribeTracking"
                      type="checkbox"
                      checked={settings.enableUnsubscribeTracking}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                    <label
                      htmlFor="enableUnsubscribeTracking"
                      className="me-2 block text-sm text-foreground dark:text-muted-foreground"
                    >
                      تتبع إلغاء الاشتراك
                    </label>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h5 className="text-md font-medium text-foreground mb-4">
                    حدود معدل الإرسال
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        رسائل في الدقيقة
                      </label>
                      <input
                        type="number"
                        name="messagesPerMinute"
                        value={settings.messagesPerMinute}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        رسائل في الساعة
                      </label>
                      <input
                        type="number"
                        name="messagesPerHour"
                        value={settings.messagesPerHour}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        رسائل في اليوم
                      </label>
                      <input
                        type="number"
                        name="messagesPerDay"
                        value={settings.messagesPerDay}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-foreground">
                  إعدادات التنبيهات
                </h4>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    البريد الإلكتروني للمدير
                  </label>
                  <input
                    type="email"
                    name="adminEmail"
                    value={settings.adminEmail}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="notifyOnCampaignSent"
                      name="notifyOnCampaignSent"
                      type="checkbox"
                      checked={settings.notifyOnCampaignSent}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                    <label
                      htmlFor="notifyOnCampaignSent"
                      className="me-2 block text-sm text-foreground dark:text-muted-foreground"
                    >
                      إشعار عند إرسال الحملة
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="notifyOnHighUnsubscribeRate"
                      name="notifyOnHighUnsubscribeRate"
                      type="checkbox"
                      checked={settings.notifyOnHighUnsubscribeRate}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                    <label
                      htmlFor="notifyOnHighUnsubscribeRate"
                      className="me-2 block text-sm text-foreground dark:text-muted-foreground"
                    >
                      إشعار عند ارتفاع معدل إلغاء الاشتراك
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="notifyOnLowDeliveryRate"
                      name="notifyOnLowDeliveryRate"
                      type="checkbox"
                      checked={settings.notifyOnLowDeliveryRate}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                    <label
                      htmlFor="notifyOnLowDeliveryRate"
                      className="me-2 block text-sm text-foreground dark:text-muted-foreground"
                    >
                      إشعار عند انخفاض معدل التسليم
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "security" && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-foreground">
                  إعدادات الأمان
                </h4>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="requireApprovalForHighVolume"
                      name="requireApprovalForHighVolume"
                      type="checkbox"
                      checked={settings.requireApprovalForHighVolume}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                    <label
                      htmlFor="requireApprovalForHighVolume"
                      className="me-2 block text-sm text-foreground dark:text-muted-foreground"
                    >
                      طلب موافقة للحملات عالية الحجم
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      حد الحجم العالي (عدد المستلمين)
                    </label>
                    <input
                      type="number"
                      name="highVolumeThreshold"
                      value={settings.highVolumeThreshold}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      id="enableContentFiltering"
                      name="enableContentFiltering"
                      type="checkbox"
                      checked={settings.enableContentFiltering}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                    />
                    <label
                      htmlFor="enableContentFiltering"
                      className="me-2 block text-sm text-foreground dark:text-muted-foreground"
                    >
                      تفعيل تصفية المحتوى
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      الكلمات المحظورة
                    </label>
                    <div className="mt-1 flex items-center space-x-2 space-x-reverse">
                      <input
                        type="text"
                        value={newBlockedWord}
                        onChange={(e) => setNewBlockedWord(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(), addBlockedWord())
                        }
                        className="flex-1 border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                        placeholder="أضف كلمة محظورة"
                      />
                      <button
                        type="button"
                        onClick={addBlockedWord}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                      >
                        إضافة
                      </button>
                    </div>
                    {settings.blockedWords.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {settings.blockedWords.map((word, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive text-destructive"
                          >
                            {word}
                            <button
                              type="button"
                              onClick={() => removeBlockedWord(word)}
                              className="me-1 h-3 w-3 text-destructive hover:text-destructive"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "templates" && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-foreground">
                  قوالب الرسائل
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      اسم الشركة
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={settings.companyName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      عنوان الشركة
                    </label>
                    <input
                      type="text"
                      name="companyAddress"
                      value={settings.companyAddress}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      التذييل الافتراضي
                    </label>
                    <textarea
                      name="defaultFooter"
                      rows={3}
                      value={settings.defaultFooter}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      نص إلغاء الاشتراك
                    </label>
                    <input
                      type="text"
                      name="unsubscribeText"
                      value={settings.unsubscribeText}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastSettings;
