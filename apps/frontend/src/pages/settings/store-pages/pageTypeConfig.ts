import {
  CreditCard,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react';

export interface PageTypeMeta {
  key: string;
  labelKey: string;
  icon: LucideIcon;
  colorClass: string;
}

export const PAGE_TYPE_CONFIG: Record<string, PageTypeMeta> = {
  SHIPPING_POLICY: {
    key: 'SHIPPING_POLICY',
    labelKey: 'shippingPolicy',
    icon: Truck,
    colorClass: 'text-sky-500 bg-info/10 border-info/20',
  },
  RETURN_POLICY: {
    key: 'RETURN_POLICY',
    labelKey: 'returnPolicy',
    icon: ShieldAlert,
    colorClass: 'text-indigo-500 bg-primary/10 border-primary/20',
  },
  REFUND_POLICY: {
    key: 'REFUND_POLICY',
    labelKey: 'refundPolicy',
    icon: ShieldCheck,
    colorClass: 'text-rose-500 bg-destructive/10 border-destructive/20',
  },
  PRIVACY_POLICY: {
    key: 'PRIVACY_POLICY',
    labelKey: 'privacyPolicy',
    icon: ShieldCheck,
    colorClass: 'text-emerald-500 bg-success/10 border-success/20',
  },
  TERMS_CONDITIONS: {
    key: 'TERMS_CONDITIONS',
    labelKey: 'termsConditions',
    icon: FileText,
    colorClass: 'text-amber-500 bg-warning/10 border-warning/20',
  },
  ABOUT_US: {
    key: 'ABOUT_US',
    labelKey: 'aboutUs',
    icon: Info,
    colorClass: 'text-purple-500 bg-primary/10 border-primary/20',
  },
  CONTACT_US: {
    key: 'CONTACT_US',
    labelKey: 'contactUs',
    icon: Mail,
    colorClass: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  FAQ: {
    key: 'FAQ',
    labelKey: 'faq',
    icon: HelpCircle,
    colorClass: 'text-orange-500 bg-warning/10 border-warning/20',
  },
  PAYMENT_METHODS: {
    key: 'PAYMENT_METHODS',
    labelKey: 'paymentMethods',
    icon: CreditCard,
    colorClass: 'text-teal-500 bg-success/10 border-success/20',
  },
  CUSTOM: {
    key: 'CUSTOM',
    labelKey: 'customPage',
    icon: FileText,
    colorClass: 'text-zinc-500 bg-muted border-border',
  },
};
