import React from "react";
import { useTranslation } from "react-i18next";
import { ChatBubbleLeftRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { AutoReplyTemplate, SmartReplyChannel } from "./types";
import { SmartReplyTemplateCardEdit } from "./SmartReplyTemplateCardEdit";
import { SmartReplyTemplateCardView } from "./SmartReplyTemplateCardView";

export interface SmartReplyTemplateListProps {
  templates: AutoReplyTemplate[];
  editingId: string | null;
  editingTemplate: AutoReplyTemplate | null;
  newKeyword: string;
  saving: boolean;
  expandedResponses: Record<string, boolean>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onAddTemplate: () => void;
  onEditStart: (template: AutoReplyTemplate) => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onDelete: (id: string) => void;
  onUpdateTemplate: (updates: Partial<AutoReplyTemplate>) => void;
  onNewKeywordChange: (val: string) => void;
  onAddKeyword: () => void;
  onRemoveKeyword: (idx: number) => void;
  onResponseChange: (idx: number, val: string) => void;
  onAddResponse: () => void;
  onRemoveResponse: (idx: number) => void;
  onToggleTemplateChannel: (channelId: SmartReplyChannel) => void;
  onToggleExpand: (templateId: string, idx: number) => void;
}

export function SmartReplyTemplateList({
  templates,
  editingId,
  editingTemplate,
  newKeyword,
  saving,
  expandedResponses,
  containerRef,
  onAddTemplate,
  onEditStart,
  onEditCancel,
  onEditSave,
  onDelete,
  onUpdateTemplate,
  onNewKeywordChange,
  onAddKeyword,
  onRemoveKeyword,
  onResponseChange,
  onAddResponse,
  onRemoveResponse,
  onToggleTemplateChannel,
  onToggleExpand,
}: SmartReplyTemplateListProps) {
  const { t } = useTranslation();

  const isCreatingNew = Boolean(
    editingId &&
    editingTemplate &&
    !templates.some((item) => item.id === editingId)
  );

  const templatesToRender =
    isCreatingNew && editingTemplate
      ? [editingTemplate, ...templates]
      : templates;

  return (
    <div
      ref={containerRef}
      className="bg-card rounded-xl shadow-xs border border-border dark:border-border overflow-hidden"
    >
      <div className="p-3.5 sm:p-5 border-b border-border dark:border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            {t("smartReplies.templates") || "قوالب الردود"}
          </h2>
          <span className="text-xs px-2.5 py-0.5 font-semibold font-mono tabular-nums bg-muted text-muted-foreground rounded-full">
            {templates.length}
          </span>
        </div>
      </div>

      <div className="divide-y divide-border dark:divide-border">
        {templatesToRender.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-muted-foreground">
            <ChatBubbleLeftRightIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 opacity-60" />
            <p className="font-semibold text-foreground dark:text-muted-foreground text-sm sm:text-base">
              {t("smartReplies.noRules") || "لا توجد قوالب ردود بعد"}
            </p>
            <p className="text-xs sm:text-sm mt-1 max-w-md mx-auto text-muted-foreground">
              {t("smartReplies.noRulesDesc") ||
                "أضف قوالب الردود التلقائية لتسهيل وسرعة الرد على العملاء فور إرسالهم للرسائل"}
            </p>
            <button
              type="button"
              onClick={onAddTemplate}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs"
            >
              <PlusIcon className="h-4 w-4" />
              <span>{t("smartReplies.addRule") || "إضافة قالب جديد"}</span>
            </button>
          </div>
        ) : (
          templatesToRender.map((item) => {
            const isEditing = editingId === item.id;

            if (isEditing && editingTemplate) {
              return (
                <SmartReplyTemplateCardEdit
                  key={item.id}
                  template={editingTemplate}
                  isCreatingNew={isCreatingNew}
                  newKeyword={newKeyword}
                  saving={saving}
                  onUpdateTemplate={onUpdateTemplate}
                  onNewKeywordChange={onNewKeywordChange}
                  onAddKeyword={onAddKeyword}
                  onRemoveKeyword={onRemoveKeyword}
                  onResponseChange={onResponseChange}
                  onAddResponse={onAddResponse}
                  onRemoveResponse={onRemoveResponse}
                  onToggleChannel={onToggleTemplateChannel}
                  onSave={onEditSave}
                  onCancel={onEditCancel}
                />
              );
            }

            return (
              <SmartReplyTemplateCardView
                key={item.id}
                template={item}
                expandedResponses={expandedResponses}
                onEdit={onEditStart}
                onDelete={onDelete}
                onToggleExpand={onToggleExpand}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
