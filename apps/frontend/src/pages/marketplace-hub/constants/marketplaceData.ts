export interface SwatchOption {
  label: string;
  value: string;
}

export const QR_SWATCHES: SwatchOption[] = [
  { label: 'أسود', value: '#000000' },
  { label: 'أبيض', value: '#ffffff' },
  { label: 'بترولي', value: '#013735' },
  { label: 'أحمر', value: '#dc2626' },
  { label: 'أزرق', value: '#2563eb' },
  { label: 'أخضر', value: '#16a34a' },
  { label: 'برتقالي', value: '#ea580c' },
];

export const DEFAULT_QR_FG = '#000000';
export const DEFAULT_QR_BG = '#ffffff';

export const BARCODE_STANDARDS = [
  { value: 'CODE128', label: 'Code 128 (قياسي)' },
  { value: 'EAN13', label: 'EAN-13 (التجزئة العالمية)' },
  { value: 'UPC', label: 'UPC-A' },
  { value: 'CODE39', label: 'Code 39' },
  { value: 'ITF14', label: 'ITF-14 / ITF' },
  { value: 'codabar', label: 'Codabar' },
] as const;

export type BarcodeStandard = (typeof BARCODE_STANDARDS)[number]['value'];
