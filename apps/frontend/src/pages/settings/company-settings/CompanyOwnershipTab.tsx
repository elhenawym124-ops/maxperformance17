import React from "react";
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { CompanyUser } from "./types";

interface CompanyOwnershipTabProps {
  users: CompanyUser[];
  selectedNewOwner: string;
  setSelectedNewOwner: (userId: string) => void;
  showTransferConfirm: boolean;
  setShowTransferConfirm: (show: boolean) => void;
  transferring: boolean;
  handleTransferOwnership: () => void;
}

export const CompanyOwnershipTab: React.FC<CompanyOwnershipTabProps> = ({
  users,
  selectedNewOwner,
  setSelectedNewOwner,
  showTransferConfirm,
  setShowTransferConfirm,
  transferring,
  handleTransferOwnership,
}) => {
  return (
    <div className="bg-card shadow rounded-lg p-6 border-2 border-destructive dark:border-destructive/30">
      <h2 className="text-xl font-semibold text-destructive dark:text-destructive mb-6 flex items-center">
        <ShieldCheckIcon className="h-6 w-6 me-2" />
        نقل ملكية الشركة
      </h2>

      <div className="bg-red-50 dark:bg-destructive/20 p-4 rounded-lg mb-6 border border-destructive dark:border-destructive">
        <div className="flex items-center gap-2 text-destructive dark:text-destructive font-medium mb-2">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-destructive dark:text-destructive" />
          <span>منطقة خطر!</span>
        </div>
        <div className="text-sm text-destructive dark:text-destructive">
          نقل الملكية إجراء نهائي لا يمكن التراجع عنه. عند نقل الملكية لموظف آخر:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>ستفقد صلاحيات المالك وتصبح مديراً (Admin) فقط.</li>
            <li>
              سيحصل المالك الجديد على كامل الصلاحيات بما في ذلك حذفك من النظام.
            </li>
            <li>سيطالبك النظام بتسجيل الدخول مجدداً لتحديث الصلاحيات.</li>
          </ul>
        </div>
      </div>

      <div className="max-w-xl">
        <label
          htmlFor="company-transfer-owner"
          className="block text-sm font-medium text-foreground mb-2"
        >
          اختر المالك الجديد
        </label>
        <select
          id="company-transfer-owner"
          name="newOwnerId"
          autoComplete="off"
          value={selectedNewOwner}
          onChange={(e) => setSelectedNewOwner(e.target.value)}
          className="mt-1 block w-full ps-3 pe-10 py-2 text-base border-border focus:outline-none focus:ring-destructive focus:border-destructive sm:text-sm rounded-md bg-card dark:border-border text-foreground"
        >
          <option value="">اختر مستخدم...</option>
          {users.map((u) => {
            const displayName =
              u.firstName && u.lastName
                ? `${u.firstName} ${u.lastName}`
                : u.name || u.email || u.id;
            return (
              <option key={u.id} value={u.id}>
                {displayName} ({u.email || "—"}) - {u.role || "MEMBER"}
              </option>
            );
          })}
        </select>

        <div className="mt-6">
          {!showTransferConfirm ? (
            <button
              type="button"
              onClick={() => setShowTransferConfirm(true)}
              disabled={!selectedNewOwner}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-destructive hover:bg-destructive focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive disabled:bg-muted dark:disabled:bg-muted disabled:cursor-not-allowed"
            >
              نقل الملكية
            </button>
          ) : (
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                type="button"
                onClick={handleTransferOwnership}
                disabled={transferring}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-destructive hover:bg-destructive focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-destructive disabled:opacity-50"
              >
                {transferring ? "جاري النقل..." : "تأكيد النقل النهائي"}
              </button>
              <button
                type="button"
                onClick={() => setShowTransferConfirm(false)}
                disabled={transferring}
                className="inline-flex justify-center py-2 px-4 border border-border shadow-sm text-sm font-medium rounded-md text-foreground bg-card hover:bg-muted dark:hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
