import React from "react";
import { ShieldCheck, Zap } from "lucide-react";

interface AgentHireFormFieldsProps {
  customName: string;
  department: string;
  safetyMode: "draft" | "autonomous";
  onCustomNameChange: (val: string) => void;
  onDepartmentChange: (val: string) => void;
  onSafetyModeChange: (val: "draft" | "autonomous") => void;
}

export const AgentHireFormFields: React.FC<AgentHireFormFieldsProps> = ({
  customName,
  department,
  safetyMode,
  onCustomNameChange,
  onDepartmentChange,
  onSafetyModeChange,
}) => {
  return (
    <div className="space-y-4 text-xs">
      <div className="space-y-1.5">
        <label htmlFor="agent-custom-name" className="font-semibold text-foreground block">
          اسم الوكيل داخل الشركة
        </label>
        <input
          id="agent-custom-name"
          type="text"
          value={customName}
          onChange={(e) => onCustomNameChange(e.target.value)}
          placeholder="مثال: سليم — المساعد التنفيذي"
          className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="agent-department" className="font-semibold text-foreground block">
          القسم التابع له
        </label>
        <select
          id="agent-department"
          value={department}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <option value="executive">الإدارة التنفيذية</option>
          <option value="sales">المبيعات وخدمة العملاء</option>
          <option value="operations">العمليات والشحن والمخزون</option>
          <option value="marketing">التسويق والإعلانات والنمو</option>
          <option value="medical">القطاع الطبي والعيادات</option>
          <option value="hr">الموارد البشرية وشؤون الموظفين</option>
        </select>
      </div>

      <div className="space-y-2">
        <span className="font-semibold text-foreground block">نظام الحوكمة والتنفيذ</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSafetyModeChange("draft")}
            className={`flex flex-col text-start p-3 rounded-lg border transition-all ${
              safetyMode === "draft"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border/70 bg-background hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
              <ShieldCheck className="size-3.5 text-primary stroke-[1.5]" />
              <span>مسودات بموافقة (آمن)</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              يجهز الإجراءات الحساسة كمسودات بانتظار اعتمادك.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSafetyModeChange("autonomous")}
            className={`flex flex-col text-start p-3 rounded-lg border transition-all ${
              safetyMode === "autonomous"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border/70 bg-background hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-foreground mb-1">
              <Zap className="size-3.5 text-warning stroke-[1.5]" />
              <span>تنفيذ تلقائي</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              ينفذ المهام المعتمدة تلقائياً على مدار الساعة.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
