import React from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { apiClient } from "../../../services/apiClient";
import { toast } from "sonner";
import type { ShippingCompany, ShippingCompanyFormData, TestedProfile } from "../types";

export interface CarrierWizardsProps {
  formData: ShippingCompanyFormData;
  setFormData: React.Dispatch<React.SetStateAction<ShippingCompanyFormData>>;
  editingCompany: ShippingCompany | null;
  testedProfile: TestedProfile | null;
}

export const QpExpressWizard: React.FC<CarrierWizardsProps> = ({
  formData,
  setFormData,
  editingCompany,
  testedProfile,
}) => (
  <div className="space-y-3.5">
    <div className="p-3.5 bg-gradient-to-r from-primary/90 to-primary/60 dark:from-primary/40 dark:to-primary/20 rounded-xl border border-primary dark:border-primary/60 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-primary dark:text-primary">
            كيو بي إكسبريس (QP Express)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-success text-success dark:bg-success/60 dark:text-success font-bold">
            ربط مباشر حقيقي (LIVE)
          </span>
        </div>
        {(testedProfile?.customerId || formData.customerId) && (
          <span className="text-xs font-mono font-bold text-primary dark:text-primary bg-primary dark:bg-primary/60 px-2.5 py-0.5 rounded-md">
            كود العميل: #{testedProfile?.customerId || formData.customerId}
          </span>
        )}
      </div>

      <p className="text-xs text-primary dark:text-primary/90 leading-relaxed">
        <strong>متطلبات الربط:</strong> أدخل <strong>اسم المستخدم وكلمة المرور</strong> لحسابك في كيو بي إكسبريس. سيقوم النظام تلقائياً بالتحقق واستخراج كود العميل وبيانات متجرك وربطها بدون خطوات يدوية معقدة.
      </p>

      {(testedProfile?.customerName || (formData.customerId && editingCompany)) && (
        <div className="flex items-center gap-2 text-xs text-success dark:text-success bg-success/10 dark:bg-success/40 p-2.5 rounded-lg border border-success dark:border-success/50">
          <CheckCircleIcon className="h-4 w-4 shrink-0 text-success" />
          <span>
            تم التعرف على الحساب بنجاح: <strong>{testedProfile?.customerName || "حساب معتمد"}</strong> (كود العميل #{testedProfile?.customerId || formData.customerId})
          </span>
        </div>
      )}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold text-foreground dark:text-muted-foreground mb-1">
          اسم المستخدم أو البريد الإلكتروني *
        </label>
        <input
          type="text"
          required
          value={formData.username}
          onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
          placeholder="مثال: your-account@qpxpress.com"
          className="w-full px-3 py-2 text-xs sm:text-sm border border-border rounded-lg bg-white dark:bg-muted text-foreground font-mono focus:ring-2 focus:ring-primary"
        />
        <p className="text-[11px] text-muted-foreground mt-0.5">اسم الدخول لحسابك في موقع QP Express</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground dark:text-muted-foreground mb-1">
          كلمة المرور *
        </label>
        <input
          type="password"
          required={!editingCompany || !formData.username}
          value={formData.password}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          placeholder={editingCompany ? "•••••••• (اتركها للإبقاء على الحالية)" : "كلمة مرور حسابك في كيو بي"}
          className="w-full px-3 py-2 text-xs sm:text-sm border border-border rounded-lg bg-white dark:bg-muted text-foreground focus:ring-2 focus:ring-primary"
        />
        <p className="text-[11px] text-muted-foreground mt-0.5">كلمة مرور حسابك في موقع QP Express</p>
      </div>
    </div>

    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        ملاحظات المعاينة والتسليم الافتراضية للبوليصة (اختياري)
      </label>
      <input
        type="text"
        value={formData.defaultNotes}
        onChange={(e) => setFormData((prev) => ({ ...prev, defaultNotes: e.target.value }))}
        placeholder="مثال: المعاينة في وجود المندوب ولا يوجد استرجاع إلا في حالة عيوب الصناعة"
        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-white dark:bg-muted text-foreground"
      />
      <p className="text-[11px] text-muted-foreground mt-0.5">تطبع هذه الملاحظات تلقائياً على كل بوليصة شحن تصدرها لعملائك</p>
    </div>
  </div>
);

export const BostaWizard: React.FC<Pick<CarrierWizardsProps, "formData" | "setFormData">> = ({
  formData,
  setFormData,
}) => (
  <div className="space-y-3.5">
    <div className="p-3.5 bg-gradient-to-r from-warning/90 to-warning/60 dark:from-warning/40 dark:to-warning/20 rounded-xl border border-warning dark:border-warning/60 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-warning dark:text-warning">
          بوستا (Bosta Courier)
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success text-success dark:bg-success/60 dark:text-success font-bold">
          ربط مباشر حقيقي (LIVE)
        </span>
      </div>

      <p className="text-xs text-warning dark:text-warning/90 leading-relaxed">
        <strong>متطلبات الربط:</strong> مفتاح الـ API الخاص بحسابك في بوستا. يمكنك نسخه من لوحة تحكم بوستا (الإعدادات ⇦ مفاتيح الـ API).
      </p>
    </div>

    <div>
      <label className="block text-xs font-semibold text-foreground dark:text-muted-foreground mb-1">
        مفتاح الـ API (Bosta API Key) *
      </label>
      <input
        type="text"
        required
        value={formData.apiKey}
        onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
        placeholder="ألصق الـ API Key من لوحة تحكم حسابك في بوستا..."
        className="w-full px-3 py-2 text-xs sm:text-sm border border-border rounded-lg bg-white dark:bg-muted text-foreground font-mono focus:ring-2 focus:ring-warning"
      />
      <p className="text-[11px] text-muted-foreground mt-0.5">يمكنك نسخه من حسابك في بوستا: الإعدادات ⇦ مفاتيح API</p>
    </div>

    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        عنوان أو كود نقطة الاستلام (Pickup Hub) - اختياري
      </label>
      <input
        type="text"
        value={formData.pickupAddress}
        onChange={(e) => setFormData((prev) => ({ ...prev, pickupAddress: e.target.value }))}
        placeholder="اتركه فارغاً ليتم الاستلام من العنوان الافتراضي لحسابك"
        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-white dark:bg-muted text-foreground"
      />
    </div>
  </div>
);

export const TurboWizard: React.FC<Pick<CarrierWizardsProps, "formData" | "setFormData">> = ({
  formData,
  setFormData,
}) => (
  <div className="space-y-3.5">
    <div className="p-3.5 bg-gradient-to-r from-primary/90 to-primary/60 dark:from-primary/40 dark:to-primary/20 rounded-xl border border-primary dark:border-primary/60 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-primary dark:text-primary">
          تربو (Turbo Courier)
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success text-success dark:bg-success/60 dark:text-success font-bold">
          ربط مباشر حقيقي (LIVE)
        </span>
      </div>
      <p className="text-xs text-primary dark:text-primary/90 leading-relaxed">
        أدخل مفتاح الـ API الخاص بحسابك لدى شركة تربو.
      </p>
    </div>

    <div>
      <label className="block text-xs font-semibold text-foreground dark:text-muted-foreground mb-1">
        مفتاح الـ API (Turbo API Key) *
      </label>
      <input
        type="text"
        required
        value={formData.apiKey}
        onChange={(e) => setFormData((prev) => ({ ...prev, apiKey: e.target.value }))}
        placeholder="مفتاح الـ API الخاص بحساب تربو..."
        className="w-full px-3 py-2 text-xs sm:text-sm border border-border rounded-lg bg-white dark:bg-muted text-foreground font-mono focus:ring-2 focus:ring-primary"
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-foreground mb-1">
          كود العميل الرئيسي (اختياري)
        </label>
        <input
          type="text"
          value={formData.mainClientCode}
          onChange={(e) => setFormData((prev) => ({ ...prev, mainClientCode: e.target.value }))}
          placeholder="كود العميل في تربو..."
          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-white dark:bg-muted text-foreground font-mono"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-foreground mb-1">
          هاتف الراسل (اختياري)
        </label>
        <input
          type="text"
          value={formData.senderNumber}
          onChange={(e) => setFormData((prev) => ({ ...prev, senderNumber: e.target.value }))}
          placeholder="رقم الهاتف المسجل..."
          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-white dark:bg-muted text-foreground"
        />
      </div>
    </div>
  </div>
);

export const HashtagWizard: React.FC<Pick<CarrierWizardsProps, "formData" | "setFormData" | "editingCompany">> = ({
  formData,
  setFormData,
  editingCompany,
}) => (
  <div className="space-y-3.5">
    <div className="p-3.5 bg-gradient-to-r from-success/90 to-success/60 dark:from-success/40 dark:to-success/20 rounded-xl border border-success dark:border-success/60 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-success dark:text-success">
            هاشتاج إكسبريس (Hashtag Express)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-success text-success dark:bg-success/60 dark:text-success font-bold">
            ربط مباشر حقيقي (LIVE)
          </span>
        </div>
        {(formData.apiName || formData.username) ? (
          <span className="text-xs font-mono font-bold text-success dark:text-success bg-success dark:bg-success/60 px-2.5 py-0.5 rounded-md">
            الحساب: #{formData.apiName || formData.username}
          </span>
        ) : editingCompany?.hasApiCredentials ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-bold">
            بيانات الاعتماد محفوظة مشفرة
          </span>
        ) : null}
      </div>

      <p className="text-xs text-success dark:text-success/90 leading-relaxed">
        <strong>متطلبات الربط:</strong> أدخل <strong>API NAME</strong> و <strong>API PASSWORD</strong> المستلمين من إدارة شركة هاشتاج إكسبريس، لتوليد البوالص وإرسال الشحنات والتتبع اللحظي آلياً.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold text-foreground dark:text-muted-foreground mb-1">
          اسم الـ API أو كود الحساب (API NAME) *
        </label>
        <input
          type="text"
          required={!editingCompany?.hasApiCredentials}
          value={formData.apiName || formData.username}
          onChange={(e) => {
            const val = e.target.value;
            setFormData((prev) => ({ ...prev, apiName: val, username: val, apiKey: val }));
          }}
          placeholder={
            editingCompany?.hasApiCredentials
              ? "•••••••• (محفوظ مشفر — اتركه فارغاً للإبقاء على الحالي)"
              : "مثال: 429010599"
          }
          className="w-full px-3 py-2 text-xs sm:text-sm border border-border rounded-lg bg-white dark:bg-muted text-foreground font-mono focus:ring-2 focus:ring-success"
        />
        <p className="text-[11px] text-muted-foreground mt-0.5">كود أو اسم الـ API المعطى لك من هاشتاج</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground dark:text-muted-foreground mb-1">
          كلمة سر الـ API (API PASSWORD) *
        </label>
        <input
          type="password"
          required={!editingCompany || !editingCompany.hasApiCredentials}
          value={formData.apiPassword || formData.password}
          onChange={(e) => {
            const val = e.target.value;
            setFormData((prev) => ({ ...prev, apiPassword: val, password: val }));
          }}
          placeholder={editingCompany ? "•••••••• (اتركها للإبقاء على الحالية)" : "كلمة سر الـ API من هاشتاج"}
          className="w-full px-3 py-2 text-xs sm:text-sm border border-border rounded-lg bg-white dark:bg-muted text-foreground focus:ring-2 focus:ring-success"
        />
        <p className="text-[11px] text-muted-foreground mt-0.5">كلمة السر السرية الخاصة بالربط البرمجي</p>
      </div>
    </div>

    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        ملاحظات التسليم والمعاينة الافتراضية للبوليصة (اختياري)
      </label>
      <input
        type="text"
        value={formData.defaultNotes}
        onChange={(e) => setFormData((prev) => ({ ...prev, defaultNotes: e.target.value }))}
        placeholder="مثال: يسمح بالمعاينة مع المندوب قبل الاستلام"
        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-white dark:bg-muted text-foreground"
      />
      <p className="text-[11px] text-muted-foreground mt-0.5">تطبع هذه الملاحظات تلقائياً على كل بوليصة شحن تصدرها لعملائك</p>
    </div>
  </div>
);

export const LgWizard: React.FC<Pick<CarrierWizardsProps, "formData" | "setFormData" | "editingCompany">> = ({
  formData,
  setFormData,
  editingCompany,
}) => (
  <div className="space-y-3.5">
    <div className="p-3.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-xl border border-blue-200 dark:border-blue-800/60 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-blue-700 dark:text-blue-300">
            LG Express (Accurate Logistics)
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 font-bold">
            ربط GraphQL مباشر (LIVE)
          </span>
        </div>
        {(formData.username || formData.apiKey) && (
          <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2.5 py-0.5 rounded-md">
            الحساب: {formData.username || formData.apiKey}
          </span>
        )}
      </div>

      <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
        <strong>متطلبات الربط:</strong> أدخل <strong>اسم المستخدم (Username)</strong> و <strong>كلمة المرور (Password)</strong> المعطاة لك من Accurate Logistics للربط عبر GraphQL API وإصدار البوالص تلقائياً.
      </p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold text-foreground dark:text-muted-foreground mb-1">
          اسم المستخدم (Username) *
        </label>
        <input
          type="text"
          required
          value={formData.username || formData.apiName || formData.apiKey}
          onChange={(e) => {
            const val = e.target.value;
            setFormData((prev) => ({ ...prev, username: val, apiName: val, apiKey: val }));
          }}
          placeholder="مثال: client_user"
          className="w-full px-3 py-2 text-xs sm:text-sm border border-border rounded-lg bg-white dark:bg-muted text-foreground font-mono focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-[11px] text-muted-foreground mt-0.5">اسم المستخدم الخاص بحسابك في LG Express</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground dark:text-muted-foreground mb-1">
          كلمة المرور (Password) *
        </label>
        <input
          type="password"
          required={!editingCompany || (!formData.password && !formData.apiPassword)}
          value={formData.password || formData.apiPassword}
          onChange={(e) => {
            const val = e.target.value;
            setFormData((prev) => ({ ...prev, password: val, apiPassword: val }));
          }}
          placeholder={editingCompany ? "•••••••• (اتركها للإبقاء على الحالية)" : "كلمة المرور من LG Express"}
          className="w-full px-3 py-2 text-xs sm:text-sm border border-border rounded-lg bg-white dark:bg-muted text-foreground focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-[11px] text-muted-foreground mt-0.5">كلمة المرور الخاصة بحسابك</p>
      </div>
    </div>

    <div>
      <label className="block text-xs font-medium text-foreground mb-1">
        عنوان الـ API (GraphQL Endpoint)
      </label>
      <input
        type="text"
        value={formData.apiUrl || "https://a2x.lg.accuratess.com:8443/graphql"}
        onChange={(e) => setFormData((prev) => ({ ...prev, apiUrl: e.target.value }))}
        placeholder="https://a2x.lg.accuratess.com:8443/graphql"
        className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-white dark:bg-muted text-foreground font-mono"
      />
      <p className="text-[11px] text-muted-foreground mt-0.5">الرابط الافتراضي للـ GraphQL API الخاص بـ LG Express</p>
    </div>
  </div>
);

export const ManualFleetWizard: React.FC<Pick<CarrierWizardsProps, "formData" | "setFormData">> = ({
  formData,
  setFormData,
}) => (
  <div className="space-y-3">
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1">
        اسم شركة الشحن أو المندوب *
      </label>
      <input
        type="text"
        required
        value={formData.name}
        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
        placeholder="مثال: أسطول التوصيل الداخلي، مندوب الجيزة..."
        className="w-full px-3 py-2 text-xs sm:text-sm border border-border rounded-lg bg-white dark:bg-muted text-foreground focus:ring-2 focus:ring-primary"
      />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-medium text-foreground mb-1">
          رقم هاتف المندوب
        </label>
        <input
          type="text"
          value={formData.phone}
          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="01xxxxxxxxx"
          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-white dark:bg-muted text-foreground"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-foreground mb-1">
          البريد الإلكتروني (اختياري)
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="driver@company.com"
          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-white dark:bg-muted text-foreground"
        />
      </div>
    </div>

    <div>
      <label className="block text-xs font-semibold text-foreground mb-1">
        شعار الشركة المخصصة (اللوجو)
      </label>
      <div className="flex items-center gap-3">
        {formData.logoUrl ? (
          <img
            src={formData.logoUrl}
            alt="شعار الشركة"
            className="w-10 h-10 object-contain rounded-lg border border-border bg-card"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
            لا يوجد
          </div>
        )}
        <div className="flex-1 space-y-1">
          <input
            type="file"
            accept="image/*"
            id="manualCompanyLogoUpload"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const uploadData = new FormData();
              uploadData.append('image', file);
              try {
                const res = await (apiClient as any).post('/upload/single', uploadData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (res.data?.url) {
                  setFormData((prev: any) => ({ ...prev, logoUrl: res.data.url }));
                  toast.success('تم رفع الشعار بنجاح');
                }
              } catch (err) {
                toast.error('تعذر رفع الشعار');
              }
            }}
            className="hidden"
          />
          <div className="flex items-center gap-2">
            <label
              htmlFor="manualCompanyLogoUpload"
              className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium bg-card hover:bg-muted/50 cursor-pointer"
            >
              اختر ملف الشعار
            </label>
            {formData.logoUrl && (
              <button
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, logoUrl: '' }))}
                className="text-xs text-destructive hover:underline"
              >
                إزالة
              </button>
            )}
          </div>
          <input
            type="text"
            value={formData.logoUrl || ''}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, logoUrl: e.target.value }))}
            placeholder="أو أدخل رابط الشعار مباشرة (URL)"
            className="w-full px-3 py-1 text-[11px] font-mono border border-border dark:border-border rounded-md bg-white dark:bg-muted text-foreground"
          />
        </div>
      </div>
    </div>
  </div>
);

export interface NetworkShippingCompany {
  companyId: string;
  name: string;
  logo: string | null;
  phone: string | null;
  email: string | null;
  operatingModel?: string;
  isLinked: boolean;
  merchantId: string | null;
}

export const MaxpNetworkWizard: React.FC<CarrierWizardsProps> = ({
  formData,
  setFormData,
}) => {
  const [networkCarriers, setNetworkCarriers] = React.useState<NetworkShippingCompany[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    const fetchNetwork = async () => {
      try {
        const res: any = await apiClient.get('/shipping-companies/network');
        if (mounted && res.data?.success && Array.isArray(res.data.data)) {
          setNetworkCarriers(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load network carriers:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchNetwork();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectCarrier = (carrier: NetworkShippingCompany) => {
    setFormData((prev) => ({
      ...prev,
      name: prev.name || carrier.name,
      phone: prev.phone || carrier.phone || '',
      email: prev.email || carrier.email || '',
      providerKey: 'MAXP_NETWORK',
      integrationMode: 'INTERNAL',
      linkedCompanyId: carrier.companyId,
      logoUrl: prev.logoUrl || carrier.logo || '',
    }));
  };

  const selectedCarrier = networkCarriers.find(
    (c) => c.companyId === formData.linkedCompanyId
  );

  return (
    <div className="space-y-3.5">
      <div className="p-3.5 bg-gradient-to-r from-primary/90 to-primary/60 dark:from-primary/40 dark:to-primary/20 rounded-xl border border-primary dark:border-primary/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-primary dark:text-primary">
              شبكة شحن MaxP (MAXP Network)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary dark:bg-primary/60 dark:text-primary font-bold">
              ربط داخلي مباشر (INTERNAL)
            </span>
          </div>
          {selectedCarrier && selectedCarrier.isLinked && (
            <span className="text-xs font-mono font-bold text-success dark:text-success bg-success dark:bg-success/60 px-2.5 py-0.5 rounded-md">
              مرتبط معتمد #{selectedCarrier.merchantId?.slice(-6)}
            </span>
          )}
        </div>

        <p className="text-xs text-primary dark:text-primary/90 leading-relaxed">
          <strong>الربط الداخلي:</strong> يمكنك اختيار شركة شحن تعمل على منصة MaxP لتحويل الطلبات إلى طرود في نظامها فوراً بدون الحاجة إلى مفاتيح API خارجية.
        </p>

        {selectedCarrier && !selectedCarrier.isLinked && (
          <div className="p-2.5 rounded-lg bg-warning/10 dark:bg-warning/40 border border-warning dark:border-warning/50 text-xs text-warning dark:text-warning">
            ⚠️ <strong>غير مربوط بهذه الشركة بعد:</strong> يجب أن يقوم مدير شركة الشحن بإضافة متجرك كعميل لديه في لوحة التحكم وتفعيل الربط أولاً.
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-foreground dark:text-muted-foreground">
          اختر شركة الشحن من شبكة MaxP *
        </label>

        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">
            جاري تحميل شركات الشحن المتاحة على الشبكة...
          </div>
        ) : networkCarriers.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
            لا توجد شركات شحن مفعلة حالياً على شبكة MaxP تقبل الربط المباشر.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto">
            {networkCarriers.map((carrier) => {
              const isSelected = formData.linkedCompanyId === carrier.companyId;
              return (
                <div
                  key={carrier.companyId}
                  onClick={() => handleSelectCarrier(carrier)}
                  className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between text-xs ${
                    isSelected
                      ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-xs"
                      : "border-border/80 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {carrier.logo ? (
                      <img
                        src={carrier.logo}
                        alt={carrier.name}
                        className="w-7 h-7 rounded-md object-contain border border-border/60 bg-white"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-md border border-border/80 bg-muted/60 flex items-center justify-center font-bold text-[11px]">
                        {carrier.name.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-foreground">{carrier.name}</p>
                      {carrier.phone && (
                        <p className="text-[11px] text-muted-foreground font-mono" dir="ltr">
                          {carrier.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    {carrier.isLinked ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-success text-success dark:bg-success/60 dark:text-success font-semibold">
                        مربوط وجاهز
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning text-warning dark:bg-warning/60 dark:text-warning font-semibold">
                        بانتظار اعتماد الشركة
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground dark:text-muted-foreground mb-1">
          اسم شركة الشحن في متجرك *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="مثال: شركة النور للشحن (MaxP Network)"
          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-white dark:bg-muted text-foreground"
        />
      </div>
    </div>
  );
};

