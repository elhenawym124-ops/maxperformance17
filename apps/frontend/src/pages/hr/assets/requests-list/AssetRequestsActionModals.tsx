import React from "react";
import { AssetRequestAdminRecord } from "./types";

interface AssetRequestsActionModalsProps {
  selectedRequest: AssetRequestAdminRecord | null;
  showApproveModal: boolean;
  onCloseApprove: () => void;
  approvalNotes: string;
  onApprovalNotesChange: (val: string) => void;
  onConfirmApprove: () => void;
  showRejectModal: boolean;
  onCloseReject: () => void;
  rejectionReason: string;
  onRejectionReasonChange: (val: string) => void;
  onConfirmReject: () => void;
  showFulfillModal: boolean;
  onCloseFulfill: () => void;
  selectedAssetId: string;
  onSelectedAssetIdChange: (val: string) => void;
  onConfirmFulfill: () => void;
}

export const AssetRequestsActionModals: React.FC<
  AssetRequestsActionModalsProps
> = ({
  selectedRequest,
  showApproveModal,
  onCloseApprove,
  approvalNotes,
  onApprovalNotesChange,
  onConfirmApprove,
  showRejectModal,
  onCloseReject,
  rejectionReason,
  onRejectionReasonChange,
  onConfirmReject,
  showFulfillModal,
  onCloseFulfill,
  selectedAssetId,
  onSelectedAssetIdChange,
  onConfirmFulfill,
}) => {
  return (
    <>
      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              الموافقة على الطلب
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => onApprovalNotesChange(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                  placeholder="أضف ملاحظات..."
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onCloseApprove}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted dark:hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  onClick={onConfirmApprove}
                  className="px-4 py-2 text-sm font-medium text-white bg-success rounded-lg hover:bg-success"
                >
                  موافقة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              رفض الطلب
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  سبب الرفض *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => onRejectionReasonChange(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                  placeholder="اكتب سبب الرفض..."
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onCloseReject}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted dark:hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  onClick={onConfirmReject}
                  className="px-4 py-2 text-sm font-medium text-white bg-destructive rounded-lg hover:bg-destructive"
                >
                  رفض
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fulfill Modal */}
      {showFulfillModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              تخصيص أصل
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  اختر الأصل *
                </label>
                <input
                  type="text"
                  value={selectedAssetId}
                  onChange={(e) => onSelectedAssetIdChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground font-mono tabular-nums"
                  placeholder="معرف الأصل"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  سيتم تحسين هذا لاحقاً بقائمة منسدلة للأصول المتاحة
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onCloseFulfill}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted dark:hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  onClick={onConfirmFulfill}
                  className="px-4 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-xs"
                >
                  تخصيص
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
