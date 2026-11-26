import React, { useEffect, useMemo, useRef, useState } from 'react';
import { buildWhatsAppUrl } from '../sections/elements/WhatsAppCtaElement';

export type FloatingContactChannelId =
  | 'whatsapp'
  | 'phone'
  | 'messenger'
  | 'instagram'
  | 'telegram'
  | 'email';

export interface FloatingContactChannelInput {
  enabled?: boolean;
  value?: string;
  message?: string;
}

export interface FloatingContactConfig {
  enabled?: boolean;
  position?: 'end' | 'start';
  whatsapp?: { enabled?: boolean; phoneNumber?: string; message?: string };
  phone?: { enabled?: boolean; number?: string };
  messenger?: { enabled?: boolean; url?: string };
  instagram?: { enabled?: boolean; url?: string };
  telegram?: { enabled?: boolean; url?: string };
  email?: { enabled?: boolean; address?: string };
}

export interface ResolvedContactChannel {
  id: FloatingContactChannelId;
  labelAr: string;
  labelEn: string;
  href: string;
  external: boolean;
  badgeClass: string;
}

const normalizeExternalUrl = (raw: string, baseUrl: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@+/, '').replace(/^\/+/, '');
  return `${baseUrl}${handle}`;
};

const normalizePhoneHref = (raw: string): string => {
  const cleaned = raw.replace(/[^+\d]/g, '');
  return cleaned ? `tel:${cleaned}` : '';
};

export function resolveFloatingContactConfig(
  designTokens?: Record<string, unknown> | null,
): FloatingContactConfig {
  const tokens = designTokens && typeof designTokens === 'object' ? designTokens : {};
  const fc = (tokens['floatingContact'] as FloatingContactConfig | undefined) || {};
  const legacyWa = (tokens['whatsapp'] as { enabled?: boolean; phoneNumber?: string; message?: string } | undefined) || {};

  const waPhone = fc.whatsapp?.phoneNumber ?? legacyWa.phoneNumber ?? '';
  const waMessage = fc.whatsapp?.message ?? legacyWa.message ?? 'مرحباً، أود الاستفسار عن منتج...';
  const waEnabled = fc.whatsapp?.enabled ?? (Boolean(legacyWa.enabled) || Boolean(waPhone.trim()));

  const masterEnabled =
    typeof fc.enabled === 'boolean' ? fc.enabled : Boolean(legacyWa.enabled);

  return {
    enabled: masterEnabled,
    position: fc.position === 'start' ? 'start' : 'end',
    whatsapp: {
      enabled: waEnabled,
      phoneNumber: waPhone,
      message: waMessage,
    },
    phone: {
      enabled: Boolean(fc.phone?.enabled),
      number: fc.phone?.number ?? '',
    },
    messenger: {
      enabled: Boolean(fc.messenger?.enabled),
      url: fc.messenger?.url ?? '',
    },
    instagram: {
      enabled: Boolean(fc.instagram?.enabled),
      url: fc.instagram?.url ?? '',
    },
    telegram: {
      enabled: Boolean(fc.telegram?.enabled),
      url: fc.telegram?.url ?? '',
    },
    email: {
      enabled: Boolean(fc.email?.enabled),
      address: fc.email?.address ?? '',
    },
  };
}

export function buildActiveContactChannels(
  config: FloatingContactConfig,
): ResolvedContactChannel[] {
  if (!config.enabled) return [];

  const channels: ResolvedContactChannel[] = [];

  if (config.whatsapp?.enabled && config.whatsapp.phoneNumber?.trim()) {
    const href = buildWhatsAppUrl(
      config.whatsapp.phoneNumber,
      config.whatsapp.message,
    );
    if (href && href !== '#') {
      channels.push({
        id: 'whatsapp',
        labelAr: 'واتساب',
        labelEn: 'WhatsApp',
        href,
        external: true,
        badgeClass: 'bg-emerald-500 text-white hover:bg-emerald-600',
      });
    }
  }

  if (config.phone?.enabled && config.phone.number?.trim()) {
    const href = normalizePhoneHref(config.phone.number);
    if (href) {
      channels.push({
        id: 'phone',
        labelAr: 'اتصال هاتفي',
        labelEn: 'Call Us',
        href,
        external: false,
        badgeClass: 'bg-sky-600 text-white hover:bg-sky-700',
      });
    }
  }

  if (config.messenger?.enabled && config.messenger.url?.trim()) {
    const href = normalizeExternalUrl(config.messenger.url, 'https://m.me/');
    if (href) {
      channels.push({
        id: 'messenger',
        labelAr: 'ماسنجر',
        labelEn: 'Messenger',
        href,
        external: true,
        badgeClass: 'bg-blue-600 text-white hover:bg-blue-700',
      });
    }
  }

  if (config.instagram?.enabled && config.instagram.url?.trim()) {
    const href = normalizeExternalUrl(config.instagram.url, 'https://instagram.com/');
    if (href) {
      channels.push({
        id: 'instagram',
        labelAr: 'إنستجرام',
        labelEn: 'Instagram',
        href,
        external: true,
        badgeClass: 'bg-pink-600 text-white hover:bg-pink-700',
      });
    }
  }

  if (config.telegram?.enabled && config.telegram.url?.trim()) {
    const href = normalizeExternalUrl(config.telegram.url, 'https://t.me/');
    if (href) {
      channels.push({
        id: 'telegram',
        labelAr: 'تيليجرام',
        labelEn: 'Telegram',
        href,
        external: true,
        badgeClass: 'bg-cyan-600 text-white hover:bg-cyan-700',
      });
    }
  }

  if (config.email?.enabled && config.email.address?.trim()) {
    channels.push({
      id: 'email',
      labelAr: 'البريد الإلكتروني',
      labelEn: 'Email',
      href: `mailto:${config.email.address.trim()}`,
      external: false,
      badgeClass: 'bg-slate-700 text-white hover:bg-slate-800',
    });
  }

  return channels;
}

const ChannelIcon: React.FC<{ id: FloatingContactChannelId; className?: string }> = ({
  id,
  className = 'h-5 w-5',
}) => {
  switch (id) {
    case 'whatsapp':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    case 'phone':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.77 19.77 0 0 1-8.63-3.07 19.3 19.3 0 0 1-6-6A19.77 19.77 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.79.62 2.65a2 2 0 0 1-.45 2.11L8 9.77a16 16 0 0 0 6.23 6.23l1.29-1.28a2 2 0 0 1 2.11-.45c.86.29 1.75.5 2.65.62A2 2 0 0 1 22 16.92Z" />
        </svg>
      );
    case 'messenger':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.14.26.35.27.57l.05 1.78c.02.57.61.94 1.13.71l1.98-.87c.17-.08.36-.1.54-.05.91.25 1.88.39 2.89.39 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2Zm5.95 7.46-2.93 4.65a1.5 1.5 0 0 1-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.93-4.65a1.5 1.5 0 0 1 2.17-.4l2.34 1.75a.6.6 0 0 0 .72 0l3.16-2.4c.42-.32.97.18.69.63Z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="3.8" />
          <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'telegram':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M21.4 4.6 2.9 11.7c-1.2.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.5c.2.6.1.9.8.9.6 0 .8-.3 1.1-.6l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.5-1.8ZM8.4 14.3l9.9-6.2c.5-.3.9-.1.5.2l-8 7.2-.3 3.4-2.1-4.6Z" />
        </svg>
      );
    case 'email':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
  }
};

export interface FloatingContactWidgetProps {
  designTokens?: Record<string, unknown> | null;
  locale?: 'ar' | 'en';
  hasMobileBottomNav?: boolean;
}

export const FloatingContactWidget: React.FC<FloatingContactWidgetProps> = ({
  designTokens,
  locale = 'ar',
  hasMobileBottomNav = false,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const config = useMemo(
    () => resolveFloatingContactConfig(designTokens),
    [designTokens],
  );
  const channels = useMemo(
    () => buildActiveContactChannels(config),
    [config],
  );

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (channels.length === 0) {
    return null;
  }

  const isArabic = locale !== 'en';
  const sideClass = config.position === 'start' ? 'start-4 sm:start-6' : 'end-4 sm:end-6';
  const bottomClass = hasMobileBottomNav ? 'bottom-20 md:bottom-6' : 'bottom-5 sm:bottom-6';

  if (channels.length === 1 && channels[0]) {
    const single = channels[0];
    const label = isArabic ? single.labelAr : single.labelEn;
    return (
      <div
        ref={containerRef}
        data-testid="floating-contact-widget"
        className={`fixed z-40 ${bottomClass} ${sideClass}`}
      >
        <a
          href={single.href}
          target={single.external ? '_blank' : undefined}
          rel={single.external ? 'noopener noreferrer' : undefined}
          aria-label={label}
          title={label}
          className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95 ${single.badgeClass}`}
        >
          <ChannelIcon id={single.id} className="h-6 w-6" />
        </a>
      </div>
    );
  }

  const primaryChannel = channels[0]!;
  const toggleLabel = isArabic ? 'تواصل معنا' : 'Contact Us';

  return (
    <div
      ref={containerRef}
      data-testid="floating-contact-widget"
      className={`fixed z-40 flex flex-col items-end gap-2.5 ${bottomClass} ${sideClass}`}
    >
      {open && (
        <div
          role="menu"
          className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/95 p-2 shadow-xl backdrop-blur-md"
        >
          {channels.map((ch) => {
            const label = isArabic ? ch.labelAr : ch.labelEn;
            return (
              <a
                key={ch.id}
                role="menuitem"
                href={ch.href}
                target={ch.external ? '_blank' : undefined}
                rel={ch.external ? 'noopener noreferrer' : undefined}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ch.badgeClass}`}
                >
                  <ChannelIcon id={ch.id} className="h-4 w-4" />
                </span>
                <span className="whitespace-nowrap">{label}</span>
              </a>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={toggleLabel}
        title={toggleLabel}
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95 ${
          open
            ? 'bg-foreground text-background'
            : primaryChannel.badgeClass
        }`}
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <ChannelIcon id={primaryChannel.id} className="h-6 w-6" />
        )}
      </button>
    </div>
  );
};

export default FloatingContactWidget;
