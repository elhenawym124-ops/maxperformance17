import React, { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import JsBarcode from 'jsbarcode';
import { toast } from 'sonner';
import { Copy, Download, QrCode, Barcode as BarcodeIcon } from 'lucide-react';
import { MarketplaceHubLayout } from './components/MarketplaceHubLayout';
import { CompanyCatalogProduct, marketplaceHubService } from '../../services/marketplaceHubService';
import {
  BARCODE_STANDARDS,
  BarcodeStandard,
  DEFAULT_QR_BG,
  DEFAULT_QR_FG,
  QR_SWATCHES,
} from './constants/marketplaceData';

export const QrBarcodePage: React.FC = () => {
  const [mode, setMode] = useState<'qr' | 'barcode'>('qr');

  // QR state
  const [qrContent, setQrContent] = useState<string>('https://maxp.online');
  const [qrSize, setQrSize] = useState<number>(280);
  const [qrMargin, setQrMargin] = useState<number>(4);
  const [fgColor, setFgColor] = useState<string>(DEFAULT_QR_FG);
  const [bgColor, setBgColor] = useState<string>(DEFAULT_QR_BG);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const qrWrapperRef = useRef<HTMLDivElement | null>(null);

  // Barcode state
  const [barcodeValue, setBarcodeValue] = useState<string>('123456789012');
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeStandard>('CODE128');
  const [displayValue, setDisplayValue] = useState<boolean>(true);
  const [moduleWidth, setModuleWidth] = useState<number>(2);
  const [moduleHeight, setModuleHeight] = useState<number>(72);
  const [fontSize, setFontSize] = useState<number>(14);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<CompanyCatalogProduct[]>([]);
  const barcodeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (mode !== 'barcode' || catalogProducts.length > 0) return;
    marketplaceHubService
      .getCompanyCatalog()
      .then(setCatalogProducts)
      .catch(() => {});
  }, [mode, catalogProducts.length]);

  useEffect(() => {
    if (mode !== 'barcode' || !barcodeCanvasRef.current) return;
    try {
      setBarcodeError(null);
      JsBarcode(barcodeCanvasRef.current, barcodeValue || ' ', {
        format: barcodeFormat,
        width: moduleWidth,
        height: moduleHeight,
        displayValue,
        fontSize,
        margin: 10,
      });
    } catch {
      setBarcodeError('القيمة المدخلة لا تطابق معيار الباركود المختار');
    }
  }, [mode, barcodeValue, barcodeFormat, displayValue, moduleWidth, moduleHeight, fontSize]);

  const applyQrPreset = (preset: 'url' | 'wifi' | 'vcard') => {
    if (preset === 'url') setQrContent('https://maxp.online');
    if (preset === 'wifi') setQrContent('WIFI:T:WPA;S:MaxP_Store;P:12345678;;');
    if (preset === 'vcard') {
      setQrContent('BEGIN:VCARD\nVERSION:3.0\nFN:MaxP Merchant\nTEL:+201000000000\nEND:VCARD');
    }
  };

  const getActiveCanvas = (): HTMLCanvasElement | null => {
    if (mode === 'qr') {
      return qrWrapperRef.current?.querySelector('canvas') || null;
    }
    return barcodeCanvasRef.current;
  };

  const handleDownload = (ext: 'png' | 'jpeg') => {
    const canvas = getActiveCanvas();
    if (!canvas) return;
    const mime = ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    const url = canvas.toDataURL(mime, 0.95);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mode}-${Date.now()}.${ext}`;
    link.click();
    toast.success('تم تنزيل الملف');
  };

  const handleCopyImage = async () => {
    const canvas = getActiveCanvas();
    if (!canvas || !navigator.clipboard) {
      toast.error('النسخ غير مدعوم في هذا المتصفح');
      return;
    }
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast.success('تم نسخ الصورة للحافظة');
      } catch {
        toast.error('تعذر نسخ الصورة');
      }
    });
  };

  return (
    <MarketplaceHubLayout title="مولد QR والباركود">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode('qr')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors active:scale-[0.97] ${
            mode === 'qr'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border/70 bg-background text-muted-foreground hover:text-foreground'
          }`}
        >
          <QrCode className="h-3.5 w-3.5" />
          <span>رمز QR</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('barcode')}
          className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors active:scale-[0.97] ${
            mode === 'barcode'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border/70 bg-background text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarcodeIcon className="h-3.5 w-3.5" />
          <span>باركود المنتجات</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Controls */}
        <div className="space-y-4 border-t border-border/70 pt-4 lg:col-span-7 lg:rounded-md lg:border lg:bg-background lg:p-5">
          {mode === 'qr' ? (
            <>
              <div>
                <div className="mb-1.5 text-xs font-medium text-muted-foreground">قوالب سريعة</div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyQrPreset('url')}
                    className="rounded border border-border/70 bg-card px-2.5 py-1 text-xs hover:bg-muted/60"
                  >
                    رابط موقع
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQrPreset('wifi')}
                    className="rounded border border-border/70 bg-card px-2.5 py-1 text-xs hover:bg-muted/60"
                  >
                    شبكة Wi-Fi
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQrPreset('vcard')}
                    className="rounded border border-border/70 bg-card px-2.5 py-1 text-xs hover:bg-muted/60"
                  >
                    بطاقة تواصل
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">المحتوى (رابط أو نص)</label>
                <textarea
                  rows={3}
                  value={qrContent}
                  onChange={(e) => setQrContent(e.target.value)}
                  className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-xs text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">الحجم (px)</label>
                  <input
                    type="number"
                    min={120}
                    max={600}
                    value={qrSize}
                    onChange={(e) => setQrSize(Math.min(600, Math.max(120, Number(e.target.value))))}
                    className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">الهوامش</label>
                  <input
                    type="number"
                    min={0}
                    max={12}
                    value={qrMargin}
                    onChange={(e) => setQrMargin(Math.min(12, Math.max(0, Number(e.target.value))))}
                    className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-sm tabular-nums"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">تصحيح الخطأ</label>
                  <select
                    value={errorLevel}
                    onChange={(e) => setErrorLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                    className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-xs"
                  >
                    <option value="L">Low (7%)</option>
                    <option value="M">Medium (15%)</option>
                    <option value="Q">Quartile (25%)</option>
                    <option value="H">High (30%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">لون الكود</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border border-border/70"
                    />
                    <div className="flex flex-wrap gap-1">
                      {QR_SWATCHES.map((s) => (
                        <button
                          key={`fg-${s.value}`}
                          type="button"
                          title={s.label}
                          onClick={() => setFgColor(s.value)}
                          style={{ backgroundColor: s.value }}
                          className="h-5 w-5 rounded border border-border/70"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">لون الخلفية</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border border-border/70"
                    />
                    <div className="flex flex-wrap gap-1">
                      {QR_SWATCHES.map((s) => (
                        <button
                          key={`bg-${s.value}`}
                          type="button"
                          title={s.label}
                          onClick={() => setBgColor(s.value)}
                          style={{ backgroundColor: s.value }}
                          className="h-5 w-5 rounded border border-border/70"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {catalogProducts.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">اختيار منتج من مخزون MaxP</label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const prod = catalogProducts.find((p) => p.id === e.target.value);
                      if (prod) setBarcodeValue(prod.barcode || prod.sku || prod.id);
                    }}
                    className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-xs"
                  >
                    <option value="">-- اختر منتجاً لتوليد باركوده --</option>
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.barcode || p.sku || p.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">قيمة الباركود (SKU / EAN)</label>
                  <input
                    type="text"
                    value={barcodeValue}
                    onChange={(e) => setBarcodeValue(e.target.value)}
                    className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">معيار الباركود</label>
                  <select
                    value={barcodeFormat}
                    onChange={(e) => setBarcodeFormat(e.target.value as BarcodeStandard)}
                    className="w-full rounded-md border border-border/70 bg-card px-3 py-2 text-xs"
                  >
                    {BARCODE_STANDARDS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">عرض الخط</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    step={0.5}
                    value={moduleWidth}
                    onChange={(e) => setModuleWidth(Number(e.target.value))}
                    className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">الارتفاع (px)</label>
                  <input
                    type="number"
                    min={30}
                    max={150}
                    value={moduleHeight}
                    onChange={(e) => setModuleHeight(Number(e.target.value))}
                    className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">حجم النص</label>
                  <input
                    type="number"
                    min={10}
                    max={24}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full rounded-md border border-border/70 bg-card px-3 py-2 font-mono text-sm tabular-nums"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={displayValue}
                  onChange={(e) => setDisplayValue(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span>إظهار الرقم أسفل الباركود</span>
              </label>
            </>
          )}
        </div>

        {/* Preview & Download */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-4 lg:col-span-5 lg:rounded-md lg:border lg:bg-muted/20 lg:p-5">
          <div className="flex min-h-[260px] w-full items-center justify-center rounded-md border border-border/70 bg-card p-4">
            {mode === 'qr' ? (
              <div ref={qrWrapperRef}>
                <QRCodeCanvas
                  value={qrContent || ' '}
                  size={Math.min(260, qrSize)}
                  marginSize={qrMargin}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level={errorLevel}
                />
              </div>
            ) : barcodeError ? (
              <p className="text-center text-xs text-destructive">{barcodeError}</p>
            ) : (
              <canvas ref={barcodeCanvasRef} className="max-w-full" />
            )}
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleDownload('png')}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>تنزيل PNG</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownload('jpeg')}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border/70 bg-card px-3 py-2 text-xs font-medium hover:bg-muted/60 active:scale-[0.98]"
            >
              <span>JPEG</span>
            </button>
            <button
              type="button"
              onClick={() => void handleCopyImage()}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border/70 bg-card px-3 py-2 text-xs font-medium hover:bg-muted/60 active:scale-[0.98]"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>نسخ</span>
            </button>
          </div>
        </div>
      </div>
    </MarketplaceHubLayout>
  );
};

export default QrBarcodePage;
