import React from "react";
import { TagIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import LoadingSpinner from "../../../../components/LoadingSpinner";
import { TagItem } from "./types";

interface CustomerSegmentsTagsTabProps {
  tags: TagItem[];
  tagsLoading: boolean;
  renamingTag: string | null;
  newTagName: string;
  onNewTagNameChange: (v: string) => void;
  tagActionLoading: boolean;
  onStartRename: (tag: TagItem) => void;
  onCancelRename: () => void;
  onConfirmRename: (oldName: string) => void;
  onDeleteTag: (tagName: string) => void;
}

export const CustomerSegmentsTagsTab: React.FC<CustomerSegmentsTagsTabProps> = ({
  tags,
  tagsLoading,
  renamingTag,
  newTagName,
  onNewTagNameChange,
  tagActionLoading,
  onStartRename,
  onCancelRename,
  onConfirmRename,
  onDeleteTag,
}) => {
  if (tagsLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card shadow dark:shadow-md overflow-hidden sm:rounded-md">
        {tags.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">لا توجد وسوم بعد</div>
        ) : (
          <table className="min-w-full divide-y divide-border dark:divide-border">
            <thead className="bg-gray-50 dark:bg-muted">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">الوسم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">عدد العملاء</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {tags.map((tag) => (
                <tr key={tag.name} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renamingTag === tag.name ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTagName}
                          onChange={(e) => onNewTagNameChange(e.target.value)}
                          className="px-2 py-1 border border-border rounded text-sm bg-card text-foreground"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") onConfirmRename(tag.name);
                            if (e.key === "Escape") onCancelRename();
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => onConfirmRename(tag.name)}
                          disabled={tagActionLoading}
                          className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary disabled:opacity-50 cursor-pointer"
                        >
                          حفظ
                        </button>
                        <button
                          type="button"
                          onClick={onCancelRename}
                          className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <TagIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{tag.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground dark:text-muted-foreground font-mono tabular-nums" dir="ltr">
                    {tag.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                    {renamingTag !== tag.name && (
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => onStartRename(tag)}
                          className="text-indigo-600 hover:text-primary cursor-pointer"
                          title="إعادة تسمية"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTag(tag.name)}
                          disabled={tagActionLoading}
                          className="text-red-500 hover:text-destructive disabled:opacity-50 cursor-pointer"
                          title="حذف"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
