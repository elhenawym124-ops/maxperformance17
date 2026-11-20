import React from "react";
import { Calendar, FileText, History, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RadiologyStatusMap, RadiologyStudy } from "../shared";
import { Card, Row } from "./CardRow";
import { fmtDate, fmtDateTime, renderBadge, transitionText } from "./helpers";
import {
  HISTORY_DIMENSION_META,
  StudyDetailsAppointment,
  StudyDetailsHistoryEntry,
} from "./types";

interface StudyHistoryTimelineCardProps {
  study: RadiologyStudy;
  appointment?: StudyDetailsAppointment | null;
  siblings: RadiologyStudy[] | null;
  history: StudyDetailsHistoryEntry[];
}

export const StudyHistoryTimelineCard: React.FC<StudyHistoryTimelineCardProps> = ({
  study,
  appointment,
  siblings,
  history,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      {appointment ? (
        <Card title={t("radiology.details.appointment")} icon={<Calendar className="w-5 h-5" />}>
          <Row label={t("radiology.schedule.date")}>{fmtDate(appointment.appointmentDate)}</Row>
          <Row label={t("radiology.schedule.time")}>
            <span dir="ltr">{appointment.appointmentTime || "—"}</span>
          </Row>
          <Row label={t("radiology.schedule.referringDoctor")}>
            {appointment.referringPhysicianId || study.referralDoctor || "—"}
          </Row>
        </Card>
      ) : null}

      {study.appointmentId ? (
        <Card
          title={t("radiology.order.siblingStudies")}
          icon={<FileText className="w-5 h-5" />}
        >
          {siblings === null ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : siblings.length === 0 ? (
            <p className="text-sm text-muted-foreground/80">
              {t("radiology.order.noSiblings")}
            </p>
          ) : (
            <div className="space-y-2">
              {siblings.map((sib) => (
                <button
                  key={sib.id}
                  onClick={() => navigate(`/radiology/study/${sib.id}`)}
                  className="w-full flex items-center justify-between gap-3 text-sm border dark:border-border rounded-lg px-3 py-2 hover:bg-muted/50 text-right cursor-pointer"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="font-medium text-blue-600 dark:text-blue-400 truncate"
                      dir="ltr"
                    >
                      {sib.studyNumber || sib.id.slice(0, 8)}
                    </span>
                    <span className="text-muted-foreground truncate">
                      {sib.examTypeName || sib.examType?.name || "—"}
                    </span>
                  </span>
                  {renderBadge(RadiologyStatusMap, sib.status, t)}
                </button>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      <Card
        title={t("radiology.details.timelineTitle")}
        icon={<History className="w-5 h-5" />}
      >
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground/80">
            {t("radiology.details.timelineEmpty")}
          </p>
        ) : (
          <div>
            {history.map((h, idx) => {
              const dimMeta = HISTORY_DIMENSION_META[h.dimension];
              const isLast = idx === history.length - 1;
              return (
                <div key={h.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {!isLast ? (
                    <span className="absolute right-2 top-4 bottom-0 w-px bg-muted dark:bg-muted" />
                  ) : null}
                  <span
                    className={`w-4 h-4 rounded-full shrink-0 ring-4 ring-white dark:ring-border mt-0.5 ${
                      dimMeta?.color || "bg-gray-300"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap ${
                          dimMeta?.color ||
                          "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground"
                        }`}
                      >
                        {dimMeta ? t(dimMeta.label) : h.dimension}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {transitionText(h, t)}
                      </span>
                    </div>
                    {h.reason ? (
                      <p className="text-xs text-muted-foreground mt-1">{h.reason}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground/80 mt-1">
                      {h.userName || h.changedBy ? `${h.userName || h.changedBy} — ` : ""}
                      {fmtDateTime(h.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
};
