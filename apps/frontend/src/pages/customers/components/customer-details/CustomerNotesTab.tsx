import React from "react";
import { useTranslation } from "react-i18next";
import { useDateFormat } from "@/hooks/useDateFormat";
import { PlusIcon, TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { CustomerDetailsData } from "./types";

interface CustomerNotesTabProps {
  notes: CustomerDetailsData["notes"];
  newNote: string;
  onNewNoteChange: (val: string) => void;
  onAddNote: () => void;
  isAddingNote: boolean;
  deletingNoteId: string | null;
  onDeleteNote: (noteId: string) => void;
}

export const CustomerNotesTab: React.FC<CustomerNotesTabProps> = ({
  notes,
  newNote,
  onNewNoteChange,
  onAddNote,
  isAddingNote,
  deletingNoteId,
  onDeleteNote,
}) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  return (
    <div className="space-y-4">
      {/* Add note input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newNote}
          onChange={(e) => onNewNoteChange(e.target.value)}
          placeholder={t("customers.notesPlaceholder")}
          className="flex-1 px-4 py-2 border border-border dark:border-border rounded-lg text-xs sm:text-sm focus:ring-1 focus:ring-border dark:bg-muted text-foreground dark:text-muted-foreground"
        />
        <button
          type="button"
          onClick={onAddNote}
          disabled={isAddingNote || !newNote.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-muted dark:bg-muted text-white dark:text-foreground rounded-lg hover:bg-muted dark:hover:bg-muted disabled:opacity-50 text-xs sm:text-sm font-semibold transition-all"
        >
          {isAddingNote ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <PlusIcon className="h-4 w-4" />
          )}
          <span>{t("common.add")}</span>
        </button>
      </div>

      {/* Notes list */}
      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 bg-warning/60 dark:bg-warning/20 rounded-xl border border-warning/60 dark:border-warning/40 border-r-4 border-r-amber-500 relative group"
            >
              <button
                type="button"
                onClick={() => onDeleteNote(note.id)}
                disabled={deletingNoteId === note.id}
                className="absolute top-3 left-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {deletingNoteId === note.id ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>
              <p className="text-zinc-800 dark:text-muted-foreground text-xs sm:text-sm leading-relaxed">
                {note.content}
              </p>
              <div className="mt-2 text-xs text-muted-foreground font-mono tabular-nums">
                {note.author &&
                  `${note.author.firstName} ${note.author.lastName} • `}
                {formatDate(note.createdAt)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-xs sm:text-sm text-muted-foreground py-8">
          {t("customers.noNotes")}
        </p>
      )}
    </div>
  );
};
