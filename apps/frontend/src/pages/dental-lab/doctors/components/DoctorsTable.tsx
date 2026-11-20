import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Archive,
  BadgePercent,
  Banknote,
  Eye,
  Loader2,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { fmtMoney, type DentalLabDoctor, MODAL_INPUT_CLS } from "../../shared";
import type { DoctorsViewMode } from "../types/doctorsTypes";

interface DoctorsTableProps {
  rows: DentalLabDoctor[];
  loading: boolean;
  viewMode: DoctorsViewMode;
  searchInput: string;
  onSearchChange: (value: string) => void;
  removingId: string | null;
  onEdit: (doctor: DentalLabDoctor) => void;
  onBulkPayment: (doctor: DentalLabDoctor) => void;
  onPricing: (doctor: DentalLabDoctor) => void;
  onToggleActive: (doctor: DentalLabDoctor) => void;
  onRemove: (doctor: DentalLabDoctor) => void;
  onRestore: (doctor: DentalLabDoctor) => void;
  onPermanentDelete: (doctor: DentalLabDoctor) => void;
}

export function DoctorsTable({
  rows,
  loading,
  viewMode,
  searchInput,
  onSearchChange,
  removingId,
  onEdit,
  onBulkPayment,
  onPricing,
  onToggleActive,
  onRemove,
  onRestore,
  onPermanentDelete,
}: DoctorsTableProps) {
  const { t } = useTranslation();
  const inputCls = `${MODAL_INPUT_CLS} text-sm`;

  return (
    <div className="bg-card rounded-xl border dark:border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b dark:border-border">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">
            {viewMode === "ACTIVE"
              ? t("dentalLab.doctors.title")
              : "الأطباء المؤرشفين"}
          </h3>
          <span className="text-xs text-muted-foreground/80">
            {t("dentalLab.doctors.ledger.title")}
          </span>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
          <input
            className={`${inputCls} pe-9 w-64`}
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("dentalLab.common.search")}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground/80">
          {viewMode === "ACTIVE" ? (
            <>
              <Users className="w-10 h-10 mx-auto mb-3" />
              {t("dentalLab.common.noResults")}
            </>
          ) : (
            <>
              <Archive className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p>لا يوجد أطباء في الأرشيف</p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-border bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground">
                {[
                  t("dentalLab.common.name"),
                  t("dentalLab.common.phone"),
                  t("dentalLab.doctors.clinicName"),
                  t("dentalLab.doctors.governorate"),
                  t("dentalLab.doctors.ledger.billed"),
                  t("dentalLab.doctors.ledger.paid"),
                  t("dentalLab.doctors.ledger.outstanding"),
                  t("dentalLab.doctors.ledger.activeCases"),
                  t("dentalLab.doctors.creditLimit"),
                  t("dentalLab.doctors.ledger.creditStatus"),
                  t("dentalLab.common.status"),
                  t("dentalLab.common.actions"),
                ].map((h) => (
                  <th
                    key={h}
                    className="text-right py-3 px-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr
                  key={d.id}
                  className="border-b dark:border-border last:border-b-0 hover:bg-muted/50"
                >
                  <td className="py-3 px-3 font-bold">
                    <Link
                      to={`/dental-lab/doctors/${d.id}`}
                      className="text-blue-600 dark:text-primary hover:underline flex items-center gap-1.5"
                      title="عرض صفحة تفاصيل الطبيب"
                    >
                      <span>{d.name}</span>
                    </Link>
                  </td>
                  <td
                    className="py-3 px-3 text-muted-foreground font-mono"
                    dir="ltr"
                  >
                    {d.phone || "—"}
                  </td>
                  <td className="py-3 px-3">
                    <div>
                      <span className="font-medium text-foreground">
                        {d.clinicName || "—"}
                      </span>
                      {d.doctors && d.doctors.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary font-medium border border-primary dark:border-primary">
                            <Users className="w-3 h-3" /> {d.doctors.length} أطباء
                            بالعيادة
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">{d.governorate || "—"}</td>
                  <td className="py-3 px-3 font-mono tabular-nums">
                    {fmtMoney(d.totalBilled ?? 0)}
                  </td>
                  <td className="py-3 px-3 text-success dark:text-success font-mono tabular-nums">
                    {fmtMoney(d.totalPaid ?? 0)}
                  </td>
                  <td
                    className={`py-3 px-3 font-semibold font-mono tabular-nums ${
                      (d.outstanding ?? 0) > 0
                        ? "text-rose-600 dark:text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {fmtMoney(d.outstanding ?? 0)}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">
                    <span className="font-mono tabular-nums">{d.activeCases ?? 0}</span>
                    {(d.overdueCases ?? 0) > 0 && (
                      <span className="me-1 text-xs text-destructive font-mono tabular-nums">
                        ({d.overdueCases} {t("dentalLab.doctors.ledger.overdue")})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono tabular-nums">
                    {d.creditLimit ? fmtMoney(d.creditLimit) : "—"}
                  </td>
                  <td className="py-3 px-3">
                    {d.creditExceeded ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-destructive text-destructive dark:bg-destructive/40 dark:text-destructive border border-destructive dark:border-destructive">
                        {t("dentalLab.doctors.ledger.creditExceeded")}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-success text-success dark:bg-success/40 dark:text-success border border-success dark:border-success">
                        {t("dentalLab.doctors.ledger.creditOk")}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => onToggleActive(d)}
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        d.isActive
                          ? "bg-green-100 text-success dark:bg-success/40 dark:text-success border-success dark:border-success"
                          : "bg-gray-200 text-foreground dark:bg-muted dark:text-muted-foreground border-border"
                      }`}
                    >
                      {d.isActive
                        ? t("dentalLab.common.active")
                        : t("dentalLab.common.inactive")}
                    </button>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <Link
                        to={`/dental-lab/doctors/${d.id}`}
                        className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg"
                        title="عرض تفاصيل الطبيب"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {viewMode === "ACTIVE" ? (
                        <>
                          <button
                            onClick={() => onEdit(d)}
                            className="p-1.5 text-primary dark:text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg"
                            title={t("dentalLab.common.edit")}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onBulkPayment(d)}
                            className="p-1.5 text-success dark:text-success hover:bg-success/10 dark:hover:bg-success/30 rounded-lg"
                            title="تحصيل دفعة على الحساب"
                          >
                            <Banknote className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onPricing(d)}
                            className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg"
                            title={t("dentalLab.doctors.pricing.title")}
                          >
                            <BadgePercent className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRemove(d)}
                            disabled={removingId !== null}
                            className="p-1.5 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded-lg disabled:opacity-40"
                            title="أرشفة / حذف الطبيب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onRestore(d)}
                            disabled={removingId !== null}
                            className="p-1.5 text-success dark:text-success hover:bg-success/10 dark:hover:bg-success/30 rounded-lg disabled:opacity-40"
                            title="استعادة إلى القائمة النشطة"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onPricing(d)}
                            className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg"
                            title={t("dentalLab.doctors.pricing.title")}
                          >
                            <BadgePercent className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onPermanentDelete(d)}
                            disabled={removingId !== null}
                            className="p-1.5 text-destructive dark:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded-lg disabled:opacity-40"
                            title="حذف نهائي من قاعدة البيانات"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DoctorsTable;
