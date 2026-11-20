import React from "react";
import { DocumentTextIcon, IdentificationIcon } from "@heroicons/react/24/outline";
import { AffiliateDocument } from "./types";
import { formatDate, getDocumentStatusLabel } from "./helpers";

interface AffiliateDocumentsCardProps {
  identityDocumentStatus: string;
  identityDocumentUploadedAt?: string | null;
  identityDocumentReviewNote?: string | null;
  identityDocumentUrl?: string | null;
  documentHistory: AffiliateDocument[];
  reviewDocument: (status: "APPROVED" | "REJECTED") => Promise<void>;
  saving: boolean;
}

export const AffiliateDocumentsCard: React.FC<AffiliateDocumentsCardProps> = ({
  identityDocumentStatus,
  identityDocumentUploadedAt,
  identityDocumentReviewNote,
  identityDocumentUrl,
  documentHistory,
  reviewDocument,
  saving,
}) => {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <IdentificationIcon className="h-5 w-5" />
        المستندات والمراجعة
      </h2>
      <div className="mt-4 space-y-3 text-sm">
        <div className="rounded-xl border border-border p-3 dark:border-border">
          <div className="font-semibold">
            {getDocumentStatusLabel(identityDocumentStatus)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground tabular-nums">
            {formatDate(identityDocumentUploadedAt)}
          </div>
          {identityDocumentReviewNote ? (
            <p className="mt-2 text-xs text-destructive dark:text-destructive">
              {identityDocumentReviewNote}
            </p>
          ) : null}
          {identityDocumentUrl ? (
            <a
              href={identityDocumentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <DocumentTextIcon className="h-4 w-4" />
              فتح المستند الحالي
            </a>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => void reviewDocument("APPROVED")}
            disabled={saving || !identityDocumentUrl}
            className="min-h-10 rounded-xl border border-success bg-success/10 text-sm font-semibold text-success disabled:opacity-50 dark:border-success/20 dark:bg-success/10 dark:text-success"
          >
            اعتماد المستند
          </button>
          <button
            onClick={() => void reviewDocument("REJECTED")}
            disabled={saving || !identityDocumentUrl}
            className="min-h-10 rounded-xl border border-destructive bg-destructive/10 text-sm font-semibold text-destructive disabled:opacity-50 dark:border-destructive/20 dark:bg-destructive/10 dark:text-destructive"
          >
            رفض المستند
          </button>
        </div>

        <div className="space-y-2">
          {documentHistory.slice(0, 4).map((document) => (
            <a
              key={document.id}
              href={document.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-xs hover:bg-muted dark:border-border dark:hover:bg-muted"
            >
              <span>{document.isCurrent ? "الحالي" : "نسخة سابقة"}</span>
              <span className="tabular-nums">{formatDate(document.uploadedAt)}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
