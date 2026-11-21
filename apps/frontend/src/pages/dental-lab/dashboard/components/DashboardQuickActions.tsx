import { useNavigate } from "react-router-dom";

export function DashboardQuickActions() {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-border dark:border-border bg-card p-5 flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-foreground mb-2">
          إجراءات سريعة
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          وصول فوري لأهم شاشات الإنتاج والتشغيل في المعمل
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => navigate("/dental-lab/cases?new=1")}
            className="p-3 text-right rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
          >
            إنشاء أمر شغل جديد
          </button>
          <button
            type="button"
            onClick={() => navigate("/dental-lab/cases?tab=OVERDUE")}
            className="p-3 text-right rounded-lg border border-warning/30 bg-warning/10 hover:bg-warning/20 text-warning text-xs font-semibold transition-colors"
          >
            متابعة الحالات المتأخرة
          </button>
          <button
            type="button"
            onClick={() => navigate("/dental-lab/cases?kiosk=1")}
            className="p-3 text-right rounded-lg border border-border/70 bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
          >
            محطة مسح الباركود Kiosk
          </button>
          <button
            type="button"
            onClick={() => navigate("/dental-lab/invoices")}
            className="p-3 text-right rounded-lg border border-border/70 bg-card hover:bg-muted text-foreground text-xs font-semibold transition-colors"
          >
            إصدار وتحصيل الفواتير
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardQuickActions;
