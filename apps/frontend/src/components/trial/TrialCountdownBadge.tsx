import React from "react";
import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { useCompany } from "../../contexts/CompanyContext";

/**
 * شارة «الأيام المتبقية في التجربة» في الهيدر.
 * كانت الشركة لا ترى تاريخ انتهاء تجربتها في أي مكان بالمنصة.
 * لا تُعرض لأي شركة بلا تجربة (trialEndsAt = null) — صفر أثر على الشركات المدفوعة.
 */
const TrialCountdownBadge: React.FC = () => {
  const { company } = useCompany();

  const endsAt = company?.trialEndsAt ? new Date(company.trialEndsAt) : null;
  if (!endsAt || Number.isNaN(endsAt.getTime())) return null;

  const days =
    typeof company?.trialDaysRemaining === "number"
      ? company.trialDaysRemaining
      : Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / 86400000));

  const expired = endsAt.getTime() < Date.now();
  const urgent = !expired && days <= 3;

  return (
    <Link
      to="/subscription"
      title={expired ? "انتهت الفترة التجريبية" : `تنتهي التجربة في ${endsAt.toLocaleDateString("ar-EG")}`}
      className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
        expired
          ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15"
          : urgent
          ? "bg-warning/10 text-warning border-warning/30 hover:bg-warning/15"
          : "bg-primary/10 text-primary border-primary/25 hover:bg-primary/15"
      }`}
    >
      <CalendarClock className="w-3.5 h-3.5" />
      <span className="font-mono tabular-nums">
        {expired ? "التجربة منتهية" : `التجربة: ${days} يوم`}
      </span>
    </Link>
  );
};

export default TrialCountdownBadge;
