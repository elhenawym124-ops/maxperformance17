import React from 'react';
import {
  MessageSquare,
  Clock,
  GitFork,
  Zap,
  CheckCircle2,
  XCircle,
  Smartphone,
  Send,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Bell,
} from 'lucide-react';
import type { CanvasNodeData, EducationChannelType, MetaWindowPolicy } from './types';

interface EducationFlowNodeCardProps {
  node: CanvasNodeData;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const EducationFlowNodeCard: React.FC<EducationFlowNodeCardProps> = ({
  node,
  isSelected,
  onSelect,
}) => {
  const isSelectedCls = isSelected
    ? 'ring-2 ring-primary border-primary shadow-lg scale-[1.01]'
    : 'border-slate-200 dark:border-border hover:border-border dark:hover:border-border shadow-xs';

  const getChannelConfig = (channel?: CanvasNodeData['channel']) => {
    switch (channel) {
      case 'WHATSAPP_WABA':
        return {
          icon: ShieldCheck,
          label: 'واتساب رسمي معتمد (Meta WABA)',
          badgeCls: 'bg-emerald-500 text-white',
          borderCls: 'border-emerald-500',
          textCls: 'text-emerald-700 dark:text-success',
        };
      case 'WHATSAPP_BAILEYS':
      case 'WHATSAPP':
        return {
          icon: Smartphone,
          label: 'واتساب عادي (Baileys QR)',
          badgeCls: 'bg-teal-600 text-white',
          borderCls: 'border-teal-500',
          textCls: 'text-teal-700 dark:text-success',
        };
      case 'FACEBOOK_MESSENGER':
      case 'MESSENGER':
        return {
          icon: MessageSquare,
          label: 'فيسبوك ماسنجر (Messenger)',
          badgeCls: 'bg-blue-600 text-white',
          borderCls: 'border-blue-500',
          textCls: 'text-blue-700 dark:text-primary',
        };
      case 'INSTAGRAM_DIRECT':
        return {
          icon: MessageSquare,
          label: 'إنستجرام دايركت (Instagram)',
          badgeCls: 'bg-pink-600 text-white',
          borderCls: 'border-pink-500',
          textCls: 'text-pink-700 dark:text-primary',
        };
      case 'PUSH_FIRST':
        return {
          icon: Bell,
          label: 'توفير ذكي (Push First)',
          badgeCls: 'bg-indigo-600 text-white',
          borderCls: 'border-indigo-500',
          textCls: 'text-indigo-700 dark:text-primary',
        };
      default:
        return {
          icon: MessageSquare,
          label: 'رسالة تلقائية',
          badgeCls: 'bg-slate-700 text-white',
          borderCls: 'border-slate-500',
          textCls: 'text-slate-700 dark:text-muted-foreground',
        };
    }
  };

  const renderWindowPolicyBadge = (policy?: MetaWindowPolicy, templateName?: string) => {
    if (policy === 'INSIDE_24H') {
      return (
        <span
          title="يمكن إرسال نص حر وأزرار لأن النافذة التفاعلية للعميل مفتوحة"
          className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success dark:bg-success/60 dark:text-success border border-success dark:border-success font-medium"
        >
          24h نافذة مفتوحة
        </span>
      );
    }
    if (policy === 'OUTSIDE_24H_HSM') {
      return (
        <span
          title={`قالب معتمد من Meta: ${templateName || 'UTILITY'}`}
          className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:bg-primary/60 dark:text-primary border border-primary dark:border-primary font-medium"
        >
          قالب معتمد خارج 24h
        </span>
      );
    }
    if (policy === 'MESSAGE_TAG_EVENT_UPDATE') {
      return (
        <span
          title="Message Tag: CONFIRMED_EVENT_UPDATE لتذكيرات الفعاليات والحصص"
          className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:bg-primary/60 dark:text-primary border border-primary dark:border-primary font-medium"
        >
          Message Tag
        </span>
      );
    }
    if (policy === 'NOT_APPLICABLE') {
      return (
        <span
          title="إشعار ويب مجاني على بوابة ولي الأمر"
          className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:bg-primary/60 dark:text-primary border border-primary dark:border-primary font-medium"
        >
          مجاني (Web Push)
        </span>
      );
    }
    return null;
  };

  // 1. TRIGGER NODE
  if (node.type === 'trigger') {
    return (
      <div
        id={node.id}
        onClick={() => onSelect(node.id)}
        className={`w-full max-w-md mx-auto cursor-pointer rounded-xl bg-white dark:bg-muted border p-4 transition-all text-right relative ${isSelectedCls}`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-warning dark:text-warning block">
                مشغل المسار (Start Trigger)
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">
                {node.title}
              </h3>
            </div>
          </div>
          {node.badges && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success dark:text-success border border-success/20 font-medium shrink-0">
              {node.badges[1] || node.badges[0]}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground pe-10 leading-relaxed">
          {node.subtitle}
        </p>

        {/* Bottom Connection Port Handle */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-muted border-2 border-primary flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
      </div>
    );
  }

  // 2. TIME DELAY NODE
  if (node.type === 'delay') {
    return (
      <div
        id={node.id}
        onClick={() => onSelect(node.id)}
        className={`w-full max-w-md mx-auto cursor-pointer rounded-xl bg-warning/5 dark:bg-warning/20 border-2 border-warning/30 p-4 transition-all text-right relative ${isSelectedCls}`}
      >
        {/* Top Connection Port Handle */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-muted border-2 border-warning flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-warning" />
        </div>

        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-7 h-7 rounded-lg bg-warning/15 text-warning dark:text-warning flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-warning dark:text-warning tracking-wide uppercase">
            تأخير زمني وجدولة (Time Delay)
          </span>
        </div>

        <div className="pe-9.5 space-y-0.5">
          <div className="text-sm font-bold text-foreground">
            {node.delayText}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {node.delayDetail || node.title}
          </p>
        </div>

        {/* Bottom Connection Port Handle */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-muted border-2 border-warning flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-warning" />
        </div>
      </div>
    );
  }

  // 3. CONDITION / BRANCHING NODE
  if (node.type === 'condition') {
    return (
      <div
        id={node.id}
        onClick={() => onSelect(node.id)}
        className={`w-full max-w-lg mx-auto cursor-pointer rounded-xl bg-info/5 dark:bg-info/20 border-2 border-info/40 p-4 transition-all text-right relative ${isSelectedCls}`}
      >
        {/* Top Connection Port Handle */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-muted border-2 border-info flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-info" />
        </div>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg bg-info/20 text-info dark:text-info flex items-center justify-center shrink-0">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-info dark:text-info tracking-wide uppercase block">
              شرط وتفرع ذكي (Condition / Split)
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              {node.title}
            </h3>
          </div>
        </div>

        <p className="text-xs text-muted-foreground pe-9.5 mb-3 leading-relaxed">
          {node.conditionQuestion}
        </p>

        {/* Visual Branch Exit Ports */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-info/20">
          <div className="p-2.5 rounded-xl bg-success/10 border border-success/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-success dark:text-success">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{node.branches?.yes.label}</span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-success" />
          </div>

          <div className="p-2.5 rounded-xl bg-warning/10 border border-warning/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-warning dark:text-warning">
              <XCircle className="w-3.5 h-3.5" />
              <span>{node.branches?.no.label}</span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-warning" />
          </div>
        </div>

        {/* Bottom Connection Port Handles for branches */}
        <div className="absolute -bottom-2 right-1/4 w-4 h-4 rounded-full bg-white dark:bg-muted border-2 border-success flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-success" />
        </div>
        <div className="absolute -bottom-2 left-1/4 w-4 h-4 rounded-full bg-white dark:bg-muted border-2 border-warning flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-warning" />
        </div>
      </div>
    );
  }

  // 4. MESSAGE CARD (Multi-Channel + 24h Meta Compliance + Customer.io Stats)
  const channelCfg = getChannelConfig(node.channel);
  const ChannelIcon = channelCfg.icon;

  return (
    <div
      id={node.id}
      onClick={() => onSelect(node.id)}
      className={`w-full max-w-md mx-auto cursor-pointer rounded-xl bg-white dark:bg-muted border p-4 transition-all text-right relative ${isSelectedCls}`}
    >
      {/* Top Connection Port Handle */}
      <div
        className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-muted border-2 ${channelCfg.borderCls} flex items-center justify-center`}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
      </div>

      {/* Header: Channel Logo, Title & 24h Policy Badge */}
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-border dark:border-border">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg ${channelCfg.badgeCls} flex items-center justify-center shrink-0 shadow-xs`}
          >
            <ChannelIcon className="w-4 h-4" />
          </div>
          <div>
            <span className={`text-[10px] font-bold ${channelCfg.textCls} tracking-wider uppercase block`}>
              {channelCfg.label}
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-foreground">
              {node.title}
            </h4>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1">
          {renderWindowPolicyBadge(node.windowPolicy, node.metaTemplateName)}
        </div>
      </div>

      {/* Message Speech Bubble Body */}
      <div className="my-3 p-3 rounded-xl bg-muted dark:bg-muted border border-border dark:border-border text-xs text-foreground whitespace-pre-line leading-relaxed">
        {node.messageText}
      </div>

      {/* Buttons / Quick Replies */}
      {node.buttons && node.buttons.length > 0 && (
        <div className="space-y-1.5 mb-2.5">
          <span className="text-[10px] text-muted-foreground block pe-1">
            الأزرار التفاعلية التي تظهر لولي الأمر:
          </span>
          <div className="flex flex-col gap-1.5">
            {node.buttons.map((btn) => (
              <div
                key={btn.id}
                className="px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 transition-all text-xs font-semibold flex items-center justify-between"
              >
                <span>{btn.label}</span>
                {btn.actionType === 'OPEN_URL' ? (
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 rotate-180" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Telemetry Stats Bar (Customer.io Style) */}
      {node.stats && (
        <div className="py-2 px-2.5 rounded-lg bg-muted dark:bg-muted border border-border dark:border-border text-[10px] text-muted-foreground flex items-center justify-between font-mono">
          <span>
            مرسل: <strong className="text-foreground">{node.stats.enteredCount}</strong>
          </span>
          <span>
            تم التسليم: <strong className="text-emerald-600 dark:text-success">{node.stats.deliveredCount}</strong>
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-primary" />
            تفاعل: <strong className="text-primary">{node.stats.responseRate}%</strong>
          </span>
        </div>
      )}

      {/* Footer / Status Note */}
      {node.footerNote && (
        <div className="pt-2 border-t border-border dark:border-border text-[11px] text-muted-foreground flex items-center gap-1.5 mt-2">
          <Clock className="w-3 h-3 text-muted-foreground/70 shrink-0" />
          <span className="line-clamp-1">{node.footerNote}</span>
        </div>
      )}

      {/* Bottom Connection Port Handle */}
      <div
        className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white dark:bg-muted border-2 ${channelCfg.borderCls} flex items-center justify-center`}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-current" />
      </div>
    </div>
  );
};
