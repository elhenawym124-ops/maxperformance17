import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FolderArchive, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { BulkSkuZipGroup, ProductCustomField, marketplaceHubService } from '../../../services/marketplaceHubService';

export const CatalogToolsPanel: React.FC = () => {
  // ZIP Bulk SKU Images state
  const [zipGroups, setZipGroups] = useState<BulkSkuZipGroup[]>([]);
  const [zipSummary, setZipSummary] = useState<{ totalImages: number; skuCount: number } | null>(null);
  const [zipBusy, setZipBusy] = useState(false);

  // Custom Product Fields state
  const [fields, setFields] = useState<ProductCustomField[]>([]);
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState<ProductCustomField['fieldType']>('TEXT');
  const [fieldScope, setFieldScope] = useState<ProductCustomField['scope']>('PRODUCT');

  useEffect(() => {
    marketplaceHubService.listCustomFields().then(setFields).catch(() => {});
  }, []);

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error('الحد الأقصى لحجم ملف ZIP هو 15MB');
      return;
    }
    setZipBusy(true);
    try {
      const buffer = await file.arrayBuffer();
      let bin = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const res = await marketplaceHubService.importSkuZip(btoa(bin));
      setZipSummary({ totalImages: res.totalImages, skuCount: res.skuCount });
      setZipGroups(res.groups);
      toast.success(`تم فك وتوزيع ${res.totalImages} صورة على ${res.skuCount} SKU`);
    } catch {
      toast.error('تعذر قراءة ملف ZIP (تأكد من وجود مجلدات باسم كل SKU)');
    } finally {
      setZipBusy(false);
    }
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName.trim()) {
      toast.error('أدخل اسم الحقل المخصص');
      return;
    }
    try {
      const saved = await marketplaceHubService.saveCustomField({ name: fieldName, fieldType, scope: fieldScope });
      setFields((prev) => [saved, ...prev]);
      setFieldName('');
      toast.success('تمت إضافة الحقل المخصص');
    } catch {
      toast.error('تعذر حفظ الحقل المخصص');
    }
  };

  const handleDeleteField = async (id: string) => {
    try {
      await marketplaceHubService.deleteCustomField(id);
      setFields((prev) => prev.filter((f) => f.id !== id));
    } catch {
      toast.error('تعذر حذف الحقل');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* ZIP Bulk SKU Images */}
      <div className="space-y-4 border-t border-border/70 pt-4 lg:col-span-6 lg:rounded-md lg:border lg:bg-background lg:p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FolderArchive className="h-4 w-4 text-primary" />
          <span>رفع صور المنتجات دفعة واحدة (ZIP / SKU Folders)</span>
        </div>
        <p className="text-xs text-muted-foreground">
          أنشئ مجلداً لكل SKU داخل ملف ZIP، واجعل الصورة الرئيسية باسم 1.jpg وبقية الصور للمعرض تلقائياً.
        </p>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border/70 bg-card px-4 py-4 text-xs text-muted-foreground hover:border-primary/60">
          <FolderArchive className="h-4 w-4 text-primary" />
          <span>{zipBusy ? 'جاري فك أرشيف SKU...' : 'اختر ملف .zip يحتوي مجلدات SKU'}</span>
          <input type="file" accept=".zip" onChange={(e) => void handleZipUpload(e)} className="hidden" />
        </label>

        {zipSummary && (
          <div className="space-y-2 text-xs">
            <div className="font-mono text-primary tabular-nums">
              {zipSummary.skuCount} SKUs · {zipSummary.totalImages} Images
            </div>
            <div className="divide-y divide-border/50 rounded border border-border/70 bg-card">
              {zipGroups.map((g) => (
                <div key={g.sku} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <div className="font-mono font-semibold text-foreground">{g.sku}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {g.matchedProduct ? `مطابق في MaxP: ${g.matchedProduct.name}` : 'SKU غير مسجل بعد'}
                    </div>
                  </div>
                  <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    Main: {g.mainImage?.fileName || '—'} · Gallery: {g.gallery.length}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Custom Fields */}
      <div className="space-y-4 border-t border-border/70 pt-4 lg:col-span-6 lg:rounded-md lg:border lg:bg-background lg:p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <span>الحقول المخصصة للمنتج (Custom Product Fields)</span>
        </div>

        <form onSubmit={handleAddField} className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <input
            type="text"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="مثال: Battery health %"
            className="rounded border border-border/70 bg-card px-2.5 py-1.5 text-xs sm:col-span-2"
          />
          <select
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as ProductCustomField['fieldType'])}
            className="rounded border border-border/70 bg-card px-2 py-1.5 text-xs"
          >
            <option value="TEXT">Text</option>
            <option value="NUMBER">Number</option>
            <option value="PERCENT">%</option>
            <option value="SELECT">Choice</option>
          </select>
          <select
            value={fieldScope}
            onChange={(e) => setFieldScope(e.target.value as ProductCustomField['scope'])}
            className="rounded border border-border/70 bg-card px-2 py-1.5 text-xs"
          >
            <option value="PRODUCT">Product</option>
            <option value="VARIANT">Variant</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground sm:col-span-4"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>إضافة حقل مخصص</span>
          </button>
        </form>

        <div className="divide-y divide-border/50 rounded border border-border/70 bg-card text-xs">
          {fields.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">لا توجد حقول مخصصة بعد.</div>
          ) : (
            fields.map((f) => (
              <div key={f.id} className="flex items-center justify-between px-3 py-2">
                <div>
                  <span className="font-medium text-foreground">{f.name}</span>
                  <span className="ms-2 font-mono text-[10px] text-muted-foreground">
                    {f.fieldType} · {f.scope}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteField(f.id)}
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                  aria-label="حذف الحقل"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
