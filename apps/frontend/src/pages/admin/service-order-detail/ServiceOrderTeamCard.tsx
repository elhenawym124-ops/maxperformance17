import React from "react";
import { Link } from "react-router-dom";
import { Users, Save } from "lucide-react";

interface ServiceOrderTeamCardProps {
  assignedTo: string;
  setAssignedTo: (val: string) => void;
  teamMembers: any[];
  savingNotes: boolean;
  onSaveAssignment: () => void;
  order: any;
}

export const ServiceOrderTeamCard: React.FC<ServiceOrderTeamCardProps> = ({
  assignedTo,
  setAssignedTo,
  teamMembers,
  savingNotes,
  onSaveAssignment,
  order,
}) => {
  return (
    <div className="bg-card rounded-xl border border-border dark:border-border p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border dark:border-border">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-primary-600" />
          فريق العمل والمسؤول
        </h3>
        <Link
          to="/admin/services/settings"
          className="text-xs text-primary-600 hover:underline"
          title="إعدادات توزيع الأدوار"
        >
          تعديل الأدوار
        </Link>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground block">
          المسؤول الحالي عن الطلب:
        </label>
        <div className="flex items-center gap-2">
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="flex-1 p-2 text-xs rounded-xl border border-border dark:border-border bg-muted dark:bg-muted text-foreground dark:text-muted-foreground outline-hidden"
          >
            <option value="">-- غير محدد --</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name} ({m.role})
              </option>
            ))}
            {assignedTo && !teamMembers.some((m) => m.name === assignedTo) && (
              <option value={assignedTo}>{assignedTo}</option>
            )}
          </select>
          <button
            type="button"
            disabled={savingNotes}
            onClick={onSaveAssignment}
            className="p-2 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-950/40 rounded-xl transition-colors"
            title="حفظ المسؤول"
          >
            <Save className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pt-2 border-t border-border dark:border-border space-y-1.5 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>تاريخ الإنشاء:</span>
          <span className="font-medium text-muted-foreground tabular-nums">
            {new Date(order.createdAt).toLocaleDateString("ar-EG")}
          </span>
        </div>
        <div className="flex justify-between">
          <span>آخر تحديث:</span>
          <span className="font-medium text-muted-foreground tabular-nums">
            {new Date(order.updatedAt).toLocaleDateString("ar-EG")}
          </span>
        </div>
      </div>
    </div>
  );
};
