import React, { useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { marketplaceHubService } from '../../../services/marketplaceHubService';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
}

export const SellerCopilotDrawer: React.FC<{ onCreditsUpdated?: (balance: number) => void }> = ({
  onCreditsUpdated,
}) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'assistant', text: 'أهلاً بك. اسألني عن التسعير، رسوم أمازون/نون/جوميا، أو تجهيز الكتالوج.' },
  ]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text }]);
    setInput('');
    setSending(true);
    try {
      const res = await marketplaceHubService.sellerCopilot(text);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: res.reply }]);
      if (onCreditsUpdated && typeof res.wallet?.balance === 'number') {
        onCreditsUpdated(res.wallet.balance);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'تعذر الاتصال بالمساعد الذكي';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 end-4 z-40">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.97]"
        >
          <MessageSquare className="h-4 w-4" />
          <span>مساعد التاجر</span>
        </button>
      ) : (
        <div className="flex w-80 max-w-[calc(100vw-2rem)] flex-col rounded-lg border border-border/70 bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border/70 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-semibold text-foreground">مساعد البائعين الذكي</span>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">1 Cr</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="إغلاق"
              className="rounded p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto p-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-md px-3 py-2 leading-relaxed ${
                  m.role === 'user'
                    ? 'ms-6 bg-primary text-primary-foreground'
                    : 'me-6 border border-border/70 bg-background text-foreground'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-1.5 border-t border-border/70 p-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك..."
              className="flex-1 rounded border border-border/70 bg-background px-2.5 py-1.5 text-xs text-foreground"
            />
            <button
              type="submit"
              disabled={sending}
              aria-label="إرسال"
              className="inline-flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
