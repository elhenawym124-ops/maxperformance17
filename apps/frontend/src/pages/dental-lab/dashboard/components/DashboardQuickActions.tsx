import { useNavigate } from "react-router-dom";

export function DashboardQuickActions() {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border border-border dark:border-border bg-card/50 p-5 flex flex-col justify-between">
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
            className="p-3 text-right rounded-xl border border-primary dark:border-primary bg-primary/50 dark:bg-primary/30 hover:bg-primary/60 dark:hover:bg-primary/50 text-primary dark:text-primary text-xs font-semibold transition-colors"
          >
            إنشاء أمر شغل جديد
          </button>
          <button
            type="button"
            onClick={() => navigate("/dental-lab/cases?tab=OVERDUE")}
            className="p-3 text-right rounded-xl border border-destructive dark:border-destructive bg-destructive/50 dark:bg-destructive/30 hover:bg-destructive/60 dark:hover:bg-destructive/50 text-destructive dark:text-destructive text-xs font-semibold transition-colors"
          >
            متابعة الحالات المتأخرة
          </button>
          <button
            type="button"
            onClick={() => navigate("/dental-lab/cases?kiosk=1")}
            className="p-3 text-right rounded-xl border border-primary dark:border-primary bg-primary/50 dark:bg-primary/30 hover:bg-primary/60 dark:hover:bg-primary/50 text-primary dark:text-primary text-xs font-semibold transition-colors"
          >
            محطة مسح الباركود Kiosk
          </button>
          <button
            type="button"
            onClick={() => navigate("/dental-lab/invoices")}
            className="p-3 text-right rounded-xl border border-success dark:border-success bg-success/50 dark:bg-success/30 hover:bg-success/60 dark:hover:bg-success/50 text-success dark:text-success text-xs font-semibold transition-colors"
          >
            إصدار وتحصيل الفواتير
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardQuickActions;
