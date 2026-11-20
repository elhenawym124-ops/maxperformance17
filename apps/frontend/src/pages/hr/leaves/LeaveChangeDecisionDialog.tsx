import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, X, RotateCcw, FileText } from "lucide-react";
import { LeaveRequest, leaveTypeConfig, statusConfig } from "./types";

interface LeaveChangeDecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRequest: LeaveRequest | null;
  newDecision: string;
  setNewDecision: (decision: string) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  onChangeDecision: (decision: string) => void;
  t: (key: string, options?: any) => string;
}

export const LeaveChangeDecisionDialog: React.FC<LeaveChangeDecisionDialogProps> = ({
  open,
  onOpenChange,
  selectedRequest,
  newDecision,
  setNewDecision,
  rejectionReason,
  setRejectionReason,
  onChangeDecision,
  t,
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setNewDecision("");
          setRejectionReason("");
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-muted border-border dark:border-border">
        <DialogHeader className="text-right">
          <DialogTitle className="text-2xl font-bold flex items-center justify-end gap-2">
            <RotateCcw className="h-6 w-6 text-primary" />
            {t("employee.leaves.changeDecisionTitle")}
          </DialogTitle>
          <DialogDescription className="text-right text-muted-foreground">
            {t("employee.leaves.changeDecisionDesc")}
          </DialogDescription>
        </DialogHeader>

        {selectedRequest && (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary dark:border-primary/30">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">{t("employee.leaves.employee")}:</span>
                  <span className="font-medium">
                    {selectedRequest.employee?.firstName}{" "}
                    {selectedRequest.employee?.lastName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">{t("employee.leaves.leaveType")}:</span>
                  <span>
                    {leaveTypeConfig[selectedRequest.type]?.labelKey
                      ? t(leaveTypeConfig[selectedRequest.type].labelKey)
                      : selectedRequest.type}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">{t("employee.leaves.duration")}:</span>
                  <span className="font-mono tabular-nums">
                    {selectedRequest.totalDays} {t("employee.leaves.day")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">{t("employee.leaves.currentStatus")}:</span>
                  <Badge
                    className={
                      statusConfig[selectedRequest.status]?.color || ""
                    }
                  >
                    {statusConfig[selectedRequest.status]?.labelKey
                      ? t(statusConfig[selectedRequest.status].labelKey)
                      : selectedRequest.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold">
                {t("employee.leaves.newDecisionLabel")}
              </Label>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className={`h-20 flex flex-col gap-2 p-1 ${
                    selectedRequest.status === "APPROVED"
                      ? "border-gray-300 opacity-50 cursor-not-allowed bg-muted"
                      : "border-green-500 hover:bg-success/10 hover:border-success"
                  }`}
                  onClick={() => {
                    if (selectedRequest.status !== "APPROVED") {
                      setNewDecision("APPROVE");
                      onChangeDecision("APPROVE");
                    }
                  }}
                  disabled={selectedRequest.status === "APPROVED"}
                >
                  <Check className="h-5 w-5 text-success" />
                  <span className="font-medium text-xs">{t("employee.leaves.approveOption")}</span>
                  {selectedRequest.status === "APPROVED" && (
                    <span className="text-[10px] text-muted-foreground">
                      {t("employee.leaves.currentStatusLabel")}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className={`h-20 flex flex-col gap-2 p-1 ${
                    selectedRequest.status === "REJECTED"
                      ? "border-gray-300 opacity-50 cursor-not-allowed bg-muted"
                      : "border-red-500 hover:bg-destructive/10 hover:border-destructive"
                  }`}
                  onClick={() => {
                    if (selectedRequest.status !== "REJECTED") {
                      setNewDecision("REJECT");
                    }
                  }}
                  disabled={selectedRequest.status === "REJECTED"}
                >
                  <X className="h-5 w-5 text-destructive" />
                  <span className="font-medium text-xs">{t("employee.leaves.rejectOption")}</span>
                  {selectedRequest.status === "REJECTED" && (
                    <span className="text-[10px] text-muted-foreground">
                      {t("employee.leaves.currentStatusLabel")}
                    </span>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className={`h-20 flex flex-col gap-2 p-1 ${
                    selectedRequest.status === "CANCELLED"
                      ? "border-gray-300 opacity-50 cursor-not-allowed bg-muted"
                      : "border-orange-500 hover:bg-warning/10 hover:border-warning"
                  }`}
                  onClick={() => {
                    if (selectedRequest.status !== "CANCELLED") {
                      setNewDecision("CANCELLED");
                      onChangeDecision("CANCELLED");
                    }
                  }}
                  disabled={selectedRequest.status === "CANCELLED"}
                >
                  <RotateCcw className="h-5 w-5 text-warning" />
                  <span className="font-medium text-xs">{t("employee.leaves.cancelRequest")}</span>
                  {selectedRequest.status === "CANCELLED" && (
                    <span className="text-[10px] text-muted-foreground">
                      {t("employee.leaves.currentStatusLabel")}
                    </span>
                  )}
                </Button>
              </div>

              {newDecision === "REJECT" && (
                <div className="space-y-2 pt-2 animate-in slide-in-from-top-4 duration-300">
                  <Label className="flex items-center gap-2 text-foreground">
                    <FileText className="h-4 w-4" />
                    {t("employee.leaves.rejectReasonLabel")} *
                  </Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={t("employee.leaves.rejectReasonPlaceholder")}
                    rows={3}
                    className="bg-gray-50 dark:bg-muted border-border dark:border-border text-right"
                  />
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => onChangeDecision("REJECT")}
                  >
                    <X className="h-4 w-4 ms-2" />
                    {t("employee.leaves.confirmReject")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex-row-reverse sm:justify-start">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setRejectionReason("");
            }}
          >
            {t("employee.leaves.closeButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
