import React from 'react';
import { AlertTriangle, Image, Loader2, Send, ShoppingBag, Smartphone } from 'lucide-react';

interface WhatsAppChatComposerProps {
  draft: string;
  onDraftChange: (text: string) => void;
  onSendMessage: () => void;
  onSendSms: () => void;
  onOpenProductPicker: () => void;
  onOpenImageGallery: () => void;
  saving: boolean;
  outboundDisabled?: boolean;
  inboundDisabled?: boolean;
  placeholder: string;
  sendLabel: string;
}

export const WhatsAppChatComposer: React.FC<WhatsAppChatComposerProps> = ({
  draft,
  onDraftChange,
  onSendMessage,
  onSendSms,
  onOpenProductPicker,
  onOpenImageGallery,
  saving,
  outboundDisabled = false,
  inboundDisabled = false,
  placeholder,
  sendLabel,
}) => {
  return (
    <div className="border-t border-border/50 bg-card/60 p-3 md:p-4 space-y-2">
      {(outboundDisabled || inboundDisabled) && (
        <div className="space-y-1.5">
          {outboundDisabled && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>الإرسال موقوف على هذه القناة من إعدادات جلسات واتساب (يمكنك استخدام SMS كبديل).</span>
            </div>
          )}
          {inboundDisabled && (
            <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-1.5 text-xs text-warning">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>الاستقبال موقوف على هذه القناة — لن يتم استقبال ردود جديدة من العميل عليها.</span>
            </div>
          )}
        </div>
      )}
      <div className="rounded-xl border border-border/50 bg-background/80 p-2 shadow-xs focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
        <textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!outboundDisabled) onSendMessage();
            }
          }}
          placeholder={outboundDisabled ? 'الإرسال عبر واتساب موقوف لهذه القناة...' : placeholder}
          rows={3}
          className="w-full resize-none border-none bg-transparent p-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenProductPicker}
              disabled={outboundDisabled}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition disabled:opacity-40"
              title="إرسال صور وتفاصيل منتج من الكتالوج"
            >
              <ShoppingBag className="size-3.5 text-primary" />
              <span className="hidden sm:inline">كتالوج المنتجات</span>
            </button>

            <button
              type="button"
              onClick={onOpenImageGallery}
              disabled={outboundDisabled}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition disabled:opacity-40"
              title="إرسال صور من حافظة الوسائط"
            >
              <Image className="size-3.5 text-indigo-500" />
              <span className="hidden sm:inline">حافظة الصور</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSendSms}
              disabled={saving || !draft.trim()}
              className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
              title="إرسال كـ SMS احتياطي إذا كان واتساب غير متاح"
            >
              <Smartphone className="size-3 text-amber-500" />
              <span>SMS</span>
            </button>

            <button
              type="button"
              onClick={onSendMessage}
              disabled={saving || outboundDisabled || !draft.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5 rtl:rotate-180" />}
              <span>{sendLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
