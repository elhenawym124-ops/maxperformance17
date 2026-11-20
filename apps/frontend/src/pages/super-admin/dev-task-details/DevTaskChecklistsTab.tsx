import React from "react";
import {
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";
import type { ConfirmModalState } from "./types";

export interface DevTaskChecklistsTabProps {
  checklists?: any[];
  newChecklistTitle: string;
  setNewChecklistTitle: (val: string) => void;
  handleCreateChecklist: () => void;
  handleExportChecklists: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isImporting: boolean;
  handleImportChecklists: (e: React.ChangeEvent<HTMLInputElement>) => void;
  newItemInputs: Record<string, string>;
  setNewItemInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleToggleItem: (itemId: string, currentStatus: boolean) => void;
  handleAddItem: (checklistId: string) => void;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
  handleDeleteChecklistItem: (itemId: string) => void;
}

export const DevTaskChecklistsTab: React.FC<DevTaskChecklistsTabProps> = ({
  checklists,
  newChecklistTitle,
  setNewChecklistTitle,
  handleCreateChecklist,
  handleExportChecklists,
  fileInputRef,
  isImporting,
  handleImportChecklists,
  newItemInputs,
  setNewItemInputs,
  handleToggleItem,
  handleAddItem,
  setConfirmModal,
  handleDeleteChecklistItem,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 justify-between items-center mb-4">
        <div className="flex gap-2 flex-1">
          <input
            type="text"
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            placeholder="عنوان القائمة الجديدة..."
            className="flex-1 px-4 py-2 border border-border rounded-lg dark:bg-muted dark:text-muted-foreground"
          />
          <button
            type="button"
            onClick={handleCreateChecklist}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportChecklists}
            title="تصدير القوائم"
            className="p-2 text-foreground bg-muted hover:bg-muted dark:text-muted-foreground dark:bg-muted dark:hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            title="استيراد قوائم"
            className={`p-2 text-foreground bg-muted hover:bg-muted dark:text-muted-foreground dark:bg-muted dark:hover:bg-muted rounded-lg transition-colors ${
              isImporting ? "opacity-60 cursor-wait" : ""
            }`}
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportChecklists}
            accept=".txt"
            className="hidden"
          />
        </div>
      </div>

      {checklists?.map((checklist) => (
        <div
          key={checklist.id}
          className="bg-gray-50 dark:bg-muted rounded-lg p-4 border border-border dark:border-border"
        >
          <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-primary" />
            {checklist.title}
          </h4>
          <div className="space-y-2 mb-3">
            {checklist.items?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 group">
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  onChange={() => handleToggleItem(item.id, item.isCompleted)}
                  className="h-4 w-4 text-primary rounded border-border cursor-pointer dark:bg-muted dark:border-border focus:ring-primary"
                />
                <span
                  className={`flex-1 transition-all ${
                    item.isCompleted
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {item.content}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmModal({
                      open: true,
                      message: "هل أنت متأكد من حذف هذا العنصر؟",
                      onConfirm: () => handleDeleteChecklistItem(item.id),
                    })
                  }
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded transition-opacity"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newItemInputs[checklist.id] || ""}
              onChange={(e) =>
                setNewItemInputs({
                  ...newItemInputs,
                  [checklist.id]: e.target.value,
                })
              }
              placeholder="إضافة عنصر..."
              className="flex-1 px-3 py-1.5 text-sm border border-border rounded-lg dark:bg-muted dark:text-muted-foreground focus:ring-1 focus:ring-primary"
              onKeyDown={(e) =>
                e.key === "Enter" && handleAddItem(checklist.id)
              }
            />
            <button
              type="button"
              onClick={() => handleAddItem(checklist.id)}
              className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
      {(!checklists || checklists.length === 0) && !newChecklistTitle && (
        <div className="text-center py-12 text-muted-foreground bg-muted dark:bg-muted rounded-xl border border-dashed border-border dark:border-border">
          <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground dark:text-foreground" />
          <p>لا توجد قوائم مرجعية</p>
        </div>
      )}
    </div>
  );
};
