import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquare,
  Clock,
  GitFork,
  Check,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Bell,
} from 'lucide-react';
import type { CanvasNodeData, EducationChannelType, FlowMessageButton } from './types';
import { SMART_VARIABLES } from './constants';

interface EducationNodeInspectorDrawerProps {
  node: CanvasNodeData | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNode: (
    nodeId: string,
    updated: {
      text: string;
      channel?: EducationChannelType;
      buttons?: FlowMessageButton[];
    }
  ) => void;
}

export const EducationNodeInspectorDrawer: React.FC<EducationNodeInspectorDrawerProps> = ({
  node,
  isOpen,
  onClose,
  onSaveNode,
}) => {
  const [draftText, setDraftText] = useState('');
  const [draftChannel, setDraftChannel] = useState<EducationChannelType>('WHATSAPP_WABA');
  const [draftButtons, setDraftButtons] = useState<FlowMessageButton[]>([]);
  const [selectedVarCategory, setSelectedVarCategory] = useState<string>('all');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (node) {
      setDraftText(node.messageText || node.delayDetail || '');
      setDraftChannel((node.channel as EducationChannelType) || 'WHATSAPP_WABA');
      setDraftButtons(node.buttons ? [...node.buttons] : []);
      setSavedSuccess(false);
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleInsertVariable = (varKey: string) => {
    if (!textareaRef.current) {
      setDraftText((prev) => prev + ` ${varKey} `);
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const next = draftText.substring(0, start) + varKey + draftText.substring(end);
    setDraftText(next);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + varKey.length, start + varKey.length);
      }
    }, 50);
  };

  const handleAddButton = () => {
    const newBtn: FlowMessageButton = {
      id: `btn-${Date.now()}`,
      label: 'زر اختيار سريع جديد',
      actionType: 'NAVIGATE',
    };
    setDraftButtons((prev) => [...prev, newBtn]);
  };

  const handleRemoveButton = (btnId: string) => {
    setDraftButtons((prev) => prev.filter((b) => b.id !== btnId));
  };

  const handleUpdateButton = (btnId: string, label: string) => {
    setDraftButtons((prev) =>
      prev.map((b) => (b.id === btnId ? { ...b, label } : b))
    );
  };

  const handleSave = () => {
    onSaveNode(node.id, {
      text: draftText,
      channel: draftChannel,
      buttons: draftButtons,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2200);
  };

  const filteredVariables = SMART_VARIABLES.filter(
    (v) => selectedVarCategory === 'all' || v.category === selectedVarCategory
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-muted border-l border-border dark:border-border h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-border dark:border-border flex items-center justify-between bg-muted dark:bg-muted">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {node.type === 'message' && <MessageSquare className="w-4 h-4" />}
              {node.type === 'delay' && <Clock className="w-4 h-4" />}
              {node.type === 'condition' && <GitFork className="w-4 h-4" />}
              {node.type === 'trigger' && <MessageSquare className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-foreground">
                {node.title}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                تخصيص نص الرسالة، قناة الإرسال، والأزرار الذكية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-muted transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-success dark:text-success text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>تم حفظ التعديلات في المسار بنجاح</span>
            </div>
          )}

          {/* 1. Channel Selector (For Messages) */}
          {node.type === 'message' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                قناة الإرسال المستهدفة:
              </label>
              <select
                value={draftChannel}
                onChange={(e) => setDraftChannel(e.target.value as EducationChannelType)}
                className="w-full p-2.5 rounded-xl border border-border dark:border-border bg-muted dark:bg-muted text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="WHATSAPP_WABA">واتساب رسمي معتمد (Meta Cloud API / WABA)</option>
                <option value="WHATSAPP_BAILEYS">واتساب ويب عادي (Baileys QR Session)</option>
                <option value="FACEBOOK_MESSENGER">فيسبوك ماسنجر (Facebook Page Messenger)</option>
                <option value="INSTAGRAM_DIRECT">إنستجرام دايركت (Instagram Direct DM)</option>
                <option value="PUSH_FIRST">توفير ذكي: إشعار البوابة أولاً (Web Push First)</option>
              </select>

              {/* Policy Helper Banner */}
              {draftChannel === 'WHATSAPP_WABA' && (
                <div className="p-2.5 rounded-xl bg-success/10 dark:bg-success/40 border border-success dark:border-success/60 text-[11px] text-success dark:text-success flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>مطابقة ميتا:</strong> إذا كانت نافذة الـ 24 ساعة مفتوحة، تُرسل كنص تفاعلي؛ وإذا كانت مغلقة، تُرسل كقالب HSM معتمد مع استبدال المتغيرات آلياً.
                  </span>
                </div>
              )}
              {draftChannel === 'PUSH_FIRST' && (
                <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-primary/40 border border-primary dark:border-primary/60 text-[11px] text-primary dark:text-primary flex items-start gap-2">
                  <Bell className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>توفير التكاليف:</strong> يرسل النظام إشعار ويب مجاني على هاتف ولي الأمر أولاً، وفي حال عدم الفتح خلال ساعتين يتم الإرسال عبر واتساب تلقائياً.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 2. Smart Variables Bar (Click to Insert) */}
          {node.type === 'message' && (
            <div className="space-y-2 p-3 rounded-xl bg-muted dark:bg-muted border border-border dark:border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-warning" />
                  <span>المتغيرات الذكية (انقر للإدراج):</span>
                </span>
                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 text-[10px]">
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'student', label: 'الطالب' },
                    { id: 'session', label: 'الجلسة' },
                    { id: 'demoday', label: 'الديمو' },
                    { id: 'billing', label: 'الماليات' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedVarCategory(cat.id)}
                      className={`px-1.5 py-0.5 rounded ${
                        selectedVarCategory === cat.id
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variable Chips */}
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                {filteredVariables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => handleInsertVariable(v.key)}
                    title={`مثال: ${v.sample}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-muted border border-border dark:border-border text-[11px] font-medium text-foreground hover:border-primary hover:text-primary transition-all shadow-2xs"
                  >
                    <span>{v.label}</span>
                    <span className="text-[9px] text-muted-foreground font-mono">{v.key}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Message Textarea */}
          {node.type === 'message' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                محتوى الرسالة:
              </label>
              <textarea
                ref={textareaRef}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={9}
                className="w-full p-3.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted text-xs text-foreground leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 font-sans"
                placeholder="اكتب نص الرسالة هنا مع المتغيرات..."
              />
            </div>
          )}

          {/* 4. Interactive Buttons / Quick Replies Builder */}
          {node.type === 'message' && (
            <div className="space-y-2 pt-2 border-t border-border dark:border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  الأزرار التفاعلية (Quick Replies & CTAs):
                </label>
                <button
                  type="button"
                  onClick={handleAddButton}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-bold transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>إضافة زر</span>
                </button>
              </div>

              <div className="space-y-2">
                {draftButtons.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    لا توجد أزرار مضافة لهذه الرسالة (تُرسل كنص بسيط)
                  </p>
                ) : (
                  draftButtons.map((btn) => (
                    <div
                      key={btn.id}
                      className="p-2.5 rounded-xl bg-muted dark:bg-muted border border-border dark:border-border flex items-center justify-between gap-2"
                    >
                      <input
                        type="text"
                        value={btn.label}
                        onChange={(e) => handleUpdateButton(btn.id, e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-muted border border-border dark:border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="نص الزر..."
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveButton(btn.id)}
                        className="p-1 rounded text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/40 transition-colors"
                        title="حذف الزر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Delay Details */}
          {node.type === 'delay' && (
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 space-y-2">
              <span className="text-xs font-bold text-warning dark:text-warning">
                توقيت الإطلاق التلقائي:
              </span>
              <div className="text-sm font-bold text-foreground">
                {node.delayText}
              </div>
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-lg border border-warning dark:border-warning bg-white dark:bg-muted text-xs text-foreground focus:outline-none"
              />
            </div>
          )}

          {/* Condition Details */}
          {node.type === 'condition' && (
            <div className="p-4 rounded-xl bg-info/10 border border-info/20 space-y-2">
              <span className="text-xs font-bold text-info dark:text-info">
                سؤال التحقق والتفرع:
              </span>
              <p className="text-xs text-foreground font-semibold">
                {node.conditionQuestion}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2 rounded-lg bg-success/15 text-success dark:text-success text-xs font-bold text-center">
                  {node.branches?.yes.label}
                </div>
                <div className="p-2 rounded-lg bg-warning/15 text-warning dark:text-warning text-xs font-bold text-center">
                  {node.branches?.no.label}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border dark:border-border flex items-center justify-end gap-2 bg-muted dark:bg-muted">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-border dark:border-border text-xs text-muted-foreground hover:text-foreground"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ التعديلات</span>
          </button>
        </div>
      </div>
    </div>
  );
};
