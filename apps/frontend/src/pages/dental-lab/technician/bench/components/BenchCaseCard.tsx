import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Box,
  Play,
  Pause,
  Upload,
  Eye,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { MyCase, nextStatusOf, fmtDate } from "../../../shared";
import { TimerState, Active3DAttachment } from "../types/dentalTechBenchTypes";

interface BenchCaseCardProps {
  caseItem: MyCase;
  isOverdue: boolean;
  overdueDays: number;
  timerState: TimerState;
  onToggleTimer: (caseId: string) => void;
  fmtTimer: (seconds: number) => string;
  onOpenUpload: (caseId: string) => void;
  onAdvance: (caseItem: MyCase) => void;
  isBusy: boolean;
  onPreview3D: (att: Active3DAttachment) => void;
}

export const BenchCaseCard: React.FC<BenchCaseCardProps> = ({
  caseItem: c,
  isOverdue,
  overdueDays,
  timerState,
  onToggleTimer,
  fmtTimer,
  onOpenUpload,
  onAdvance,
  isBusy,
  onPreview3D,
}) => {
  const nextStatus = nextStatusOf(c.status);

  const scanAttachments = (c.attachments || []).filter(
    (a: any) =>
      a.fileType === "STL" ||
      a.fileType === "PLY" ||
      a.fileType === "OBJ" ||
      (a.fileName && /\.(stl|ply|obj)$/i.test(a.fileName))
  );

  return (
    <div
      className={`flex flex-col justify-between rounded-xl border transition-all shadow-xs ${
        isOverdue
          ? "border-rose-300 dark:border-destructive/80 bg-destructive/20 dark:bg-destructive/10 hover:border-destructive"
          : c.priority === "URGENT"
          ? "border-amber-300 dark:border-warning bg-warning/20 dark:bg-warning/10"
          : "border-gray-200 dark:border-border bg-white dark:bg-muted hover:border-border dark:hover:border-border"
      }`}
    >
      {/* Top Section */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-foreground tabular-nums">
                #{c.caseNumber || c.id.slice(0, 6)}
              </span>
              {isOverdue ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-destructive dark:bg-destructive/60 text-destructive dark:text-destructive animate-pulse flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3 text-destructive" />
                  متأخرة (<span className="tabular-nums font-mono">{overdueDays}</span> يوم)
                </span>
              ) : c.priority === "URGENT" ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-warning dark:bg-warning/50 text-warning dark:text-warning">
                  طارئ
                </span>
              ) : null}
            </div>
            <p className="text-xs font-bold text-foreground dark:text-muted-foreground mt-0.5">
              {c.workTypeName || "عمل معمل أسنان"}
            </p>
          </div>

          <div className="text-left shrink-0">
            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {c.activeStageName || c.status}
            </span>
          </div>
        </div>

        {/* Doctor and Patient Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs bg-muted dark:bg-muted p-2.5 rounded-xl border border-border dark:border-border">
          <div>
            <span className="text-gray-400 block text-[10px]">الطبيب:</span>
            <span className="font-semibold text-foreground dark:text-muted-foreground truncate block">
              {c.doctorName || "—"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">المريض:</span>
            <span className="font-semibold text-foreground dark:text-muted-foreground truncate block">
              {c.patientName || "—"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">اللون (Shade):</span>
            <span className="font-bold text-success dark:text-success block">
              {c.shade || "غير محدد"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">تاريخ التسليم:</span>
            <span
              className={`font-semibold block tabular-nums font-mono ${
                isOverdue ? "text-rose-600 font-bold" : "text-foreground"
              }`}
            >
              {fmtDate(c.dueDate)}
            </span>
          </div>
        </div>

        {/* 3D Files Quick Trigger */}
        {scanAttachments.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Box className="w-3 h-3 text-primary" />
              ملفات 3D:
            </span>
            {scanAttachments.slice(0, 2).map((att: any, idx: number) => (
              <button
                type="button"
                key={att.id || idx}
                onClick={() =>
                  onPreview3D({
                    url: att.fileUrl || att.url,
                    ext: (att.fileType || "stl").toLowerCase(),
                    fileName:
                      att.fileName || `model-${c.caseNumber}.${att.fileType || "stl"}`,
                  })
                }
                className="px-2 py-0.5 bg-primary/10 hover:bg-primary dark:bg-primary/50 text-primary dark:text-primary rounded text-[11px] font-bold border border-primary dark:border-primary flex items-center gap-1 transition"
              >
                <Eye className="w-3 h-3" />
                <span>معاينة {att.fileType || "3D"}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 bg-muted dark:bg-muted border-t border-border dark:border-border rounded-b-2xl flex items-center justify-between gap-2">
        {/* Stopwatch */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onToggleTimer(c.id)}
            className={`p-1.5 rounded-lg border transition ${
              timerState.running
                ? "bg-amber-500 text-white border-warning animate-pulse"
                : timerState.elapsedSeconds > 0
                ? "bg-gray-200 dark:bg-muted text-foreground dark:text-muted-foreground border-border"
                : "bg-card text-muted-foreground border-border dark:border-border hover:text-foreground"
            }`}
            title={timerState.running ? "إيقاف مؤقت للوقت" : "بدء عداد وقت المرحلة"}
          >
            {timerState.running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
            {fmtTimer(timerState.elapsedSeconds)}
          </span>
        </div>

        {/* Actions Right */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onOpenUpload(c.id)}
            className="p-1.5 rounded-lg border border-border dark:border-border bg-card text-muted-foreground hover:bg-muted transition"
            title="رفع مخرجات المرحلة أو صور"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <Link
            to={`/dental-lab/cases/${c.id}`}
            className="px-2.5 py-1.5 rounded-lg border border-border dark:border-border bg-card text-foreground hover:bg-muted text-xs font-semibold"
          >
            التفاصيل
          </Link>

          {nextStatus && (
            <button
              type="button"
              onClick={() => onAdvance(c)}
              disabled={isBusy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              {isBusy ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>إنهاء المرحلة</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BenchCaseCard;
