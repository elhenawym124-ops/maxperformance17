import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Award,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  certificatePdfUrl,
  closeExamApi,
  createExamApi,
  deleteCertificateApi,
  deleteExamApi,
  fetchCertificatesApi,
  fetchExamDetailApi,
  fetchExamsApi,
  issueCertificateApi,
  publishExamApi,
  saveExamResultsApi,
} from "./api";

type ExamRow = {
  id: string;
  title: string;
  type: string;
  maxScore: number;
  status: string;
  scheduledAt?: string | null;
  resultsCount?: number;
};

type StudentRow = {
  studentId: string;
  studentName: string;
  code?: string | null;
  score: number | null;
  maxScore: number;
  grade?: string | null;
  certificateId?: string | null;
  certificateSerial?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  CLOSED: "مغلق",
};

const TYPE_LABEL: Record<string, string> = {
  QUIZ: "اختبار قصير",
  EXAM: "امتحان",
  ASSESSMENT: "تقييم",
};

const CERT_TYPE_LABEL: Record<string, string> = {
  LEVEL: "إتمام مستوى",
  COURSE: "إتمام برنامج",
  ACHIEVEMENT: "شهادة تقدير",
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export function EducationExamsTab() {
  const { i18n } = useTranslation();
  const isEn = i18n.language === "en";

  const [section, setSection] = useState<"exams" | "certificates">("exams");
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", type: "QUIZ", maxScore: 100, scheduledAt: "" });
  const [activeExam, setActiveExam] = useState<{ exam: ExamRow; students: StudentRow[] } | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [savingScores, setSavingScores] = useState(false);
  const [issueFor, setIssueFor] = useState<{ studentId: string; studentName: string; examId: string; title: string } | null>(null);
  const [issueType, setIssueType] = useState("ACHIEVEMENT");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (section === "exams") {
        const data = await fetchExamsApi({ limit: 50 });
        setExams(data.exams);
      } else {
        const data = await fetchCertificatesApi({ limit: 50 });
        setCertificates(data.certificates);
      }
    } catch (err: any) {
      setError(err.message || (isEn ? "Failed to load" : "فشل التحميل"));
    } finally {
      setLoading(false);
    }
  }, [section, isEn]);

  useEffect(() => {
    load();
  }, [load]);

  const openExam = async (exam: ExamRow) => {
    try {
      const detail = await fetchExamDetailApi(exam.id);
      setActiveExam({ exam: detail.exam, students: detail.students || [] });
      const next: Record<string, string> = {};
      (detail.students || []).forEach((student: StudentRow) => {
        next[student.studentId] = student.score === null || student.score === undefined ? "" : String(student.score);
      });
      setScores(next);
    } catch (err: any) {
      toast.error(err.message || "فشل جلب الامتحان");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(isEn ? "Title is required" : "عنوان الامتحان مطلوب");
      return;
    }
    setCreating(true);
    try {
      await createExamApi({
        title: form.title.trim(),
        type: form.type,
        maxScore: Number(form.maxScore) || 100,
        scheduledAt: form.scheduledAt || null,
      });
      toast.success(isEn ? "Exam created" : "تم إنشاء الامتحان");
      setCreateOpen(false);
      setForm({ title: "", type: "QUIZ", maxScore: 100, scheduledAt: "" });
      load();
    } catch (err: any) {
      toast.error(err.message || "فشل إنشاء الامتحان");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveScores = async () => {
    if (!activeExam) return;
    setSavingScores(true);
    try {
      const results = activeExam.students
        .filter((student) => scores[student.studentId] !== undefined && scores[student.studentId] !== "")
        .map((student) => ({ studentId: student.studentId, score: Number(scores[student.studentId]) }));
      await saveExamResultsApi(activeExam.exam.id, results);
      toast.success(isEn ? "Grades saved" : "تم حفظ الدرجات");
      await openExam(activeExam.exam);
      load();
    } catch (err: any) {
      toast.error(err.message || "فشل حفظ الدرجات");
    } finally {
      setSavingScores(false);
    }
  };

  const handlePublish = async () => {
    if (!activeExam) return;
    if (!window.confirm(isEn ? "Publish results and notify parents?" : "نشر النتائج وإشعار أولياء الأمور؟")) return;
    try {
      await publishExamApi(activeExam.exam.id);
      toast.success(isEn ? "Results published" : "تم نشر النتائج");
      await openExam(activeExam.exam);
      load();
    } catch (err: any) {
      toast.error(err.message || "فشل نشر النتائج");
    }
  };

  const handleClose = async () => {
    if (!activeExam) return;
    try {
      await closeExamApi(activeExam.exam.id);
      toast.success(isEn ? "Exam closed" : "تم إغلاق الامتحان");
      await openExam(activeExam.exam);
      load();
    } catch (err: any) {
      toast.error(err.message || "فشل إغلاق الامتحان");
    }
  };

  const handleDeleteExam = async (exam: ExamRow) => {
    if (!window.confirm(isEn ? `Delete "${exam.title}"?` : `حذف «${exam.title}»؟`)) return;
    try {
      await deleteExamApi(exam.id);
      toast.success(isEn ? "Exam deleted" : "تم حذف الامتحان");
      if (activeExam?.exam.id === exam.id) setActiveExam(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "فشل حذف الامتحان");
    }
  };

  const handleIssue = async () => {
    if (!issueFor) return;
    try {
      await issueCertificateApi({
        studentId: issueFor.studentId,
        examId: issueFor.examId || null,
        type: issueType,
        title: issueFor.title,
      });
      toast.success(isEn ? "Certificate issued" : "تم إصدار الشهادة");
      setIssueFor(null);
      if (section === "certificates") load();
      if (activeExam) await openExam(activeExam.exam);
    } catch (err: any) {
      toast.error(err.message || "فشل إصدار الشهادة");
    }
  };

  const handleDeleteCertificate = async (certificate: any) => {
    if (!window.confirm(isEn ? "Delete this certificate?" : "حذف هذه الشهادة؟")) return;
    try {
      await deleteCertificateApi(certificate.id);
      toast.success(isEn ? "Certificate deleted" : "تم حذف الشهادة");
      load();
    } catch (err: any) {
      toast.error(err.message || "فشل حذف الشهادة");
    }
  };

  const summary = useMemo(
    () => ({
      draft: exams.filter((exam) => exam.status === "DRAFT").length,
      published: exams.filter((exam) => exam.status === "PUBLISHED").length,
    }),
    [exams]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card p-1">
          {(["exams", "certificates"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSection(key)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                section === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {key === "exams"
                ? (isEn ? "Exams & Grades" : "الامتحانات والدرجات")
                : (isEn ? "Certificates" : "الشهادات")}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="p-1.5 rounded-lg border border-border/70 text-muted-foreground hover:bg-muted"
            aria-label={isEn ? "Refresh" : "تحديث"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          {section === "exams" && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              {isEn ? "New exam" : "امتحان جديد"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>
      )}

      {section === "exams" ? (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: isEn ? "Total exams" : "إجمالي الامتحانات", value: exams.length, tone: "text-foreground" },
              { label: isEn ? "Drafts" : "مسودات", value: summary.draft, tone: "text-muted-foreground" },
              { label: isEn ? "Published" : "منشورة", value: summary.published, tone: "text-success" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/70 bg-card p-3">
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
                <p className={`text-sm font-bold font-mono tabular-nums mt-1 ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
            {loading ? (
              <div className="p-6 flex items-center justify-center text-muted-foreground text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> {isEn ? "Loading..." : "جارٍ التحميل..."}
              </div>
            ) : exams.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                <FileText className="w-5 h-5 mx-auto mb-2 opacity-60" />
                {isEn ? "No exams yet" : "لا توجد امتحانات بعد"}
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {exams.map((exam) => (
                  <div key={exam.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">{exam.title}</span>
                        <span className="px-1.5 py-0.5 rounded border border-border/70 text-[10px] text-muted-foreground">
                          {TYPE_LABEL[exam.type] || exam.type}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            exam.status === "PUBLISHED"
                              ? "bg-success/10 text-success border border-success/20"
                              : exam.status === "CLOSED"
                                ? "bg-muted text-muted-foreground"
                                : "bg-warning/10 text-warning border border-warning/20"
                          }`}
                        >
                          {STATUS_LABEL[exam.status] || exam.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono tabular-nums">
                        {exam.maxScore} {isEn ? "pts" : "درجة"} · {exam.resultsCount || 0} {isEn ? "graded" : "مصحح"}
                        {exam.scheduledAt ? ` · ${formatDate(exam.scheduledAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openExam(exam)}
                        className="px-2.5 py-1 rounded-lg border border-border/70 text-[11px] text-foreground hover:bg-muted"
                      >
                        {isEn ? "Grades" : "الدرجات"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExam(exam)}
                        className="p-1.5 rounded-lg border border-border/70 text-destructive hover:bg-destructive/10"
                        aria-label={isEn ? "Delete" : "حذف"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
          {loading ? (
            <div className="p-6 flex items-center justify-center text-muted-foreground text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> {isEn ? "Loading..." : "جارٍ التحميل..."}
            </div>
          ) : certificates.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              <Award className="w-5 h-5 mx-auto mb-2 opacity-60" />
              {isEn ? "No certificates issued" : "لا توجد شهادات صادرة"}
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {certificates.map((certificate) => (
                <div key={certificate.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-foreground">{certificate.title}</span>
                      <span className="px-1.5 py-0.5 rounded border border-border/70 text-[10px] text-muted-foreground">
                        {CERT_TYPE_LABEL[certificate.type] || certificate.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono tabular-nums">
                      {certificate.studentName || "—"} · {certificate.serialNumber} · {formatDate(certificate.issuedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={certificatePdfUrl(certificate.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/70 text-[11px] text-foreground hover:bg-muted"
                    >
                      <Download className="w-3.5 h-3.5" />
                      PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteCertificate(certificate)}
                      className="p-1.5 rounded-lg border border-border/70 text-destructive hover:bg-destructive/10"
                      aria-label={isEn ? "Delete" : "حذف"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md rounded-xl border border-border/70 bg-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{isEn ? "New exam" : "امتحان جديد"}</h3>
              <button type="button" onClick={() => setCreateOpen(false)} aria-label={isEn ? "Close" : "إغلاق"}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <label className="block text-[11px] text-muted-foreground">
              {isEn ? "Title" : "العنوان"}
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs text-foreground"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-[11px] text-muted-foreground">
                {isEn ? "Type" : "النوع"}
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs text-foreground"
                >
                  <option value="QUIZ">{TYPE_LABEL['QUIZ']}</option>
                  <option value="EXAM">{TYPE_LABEL['EXAM']}</option>
                  <option value="ASSESSMENT">{TYPE_LABEL['ASSESSMENT']}</option>
                </select>
              </label>
              <label className="block text-[11px] text-muted-foreground">
                {isEn ? "Max score" : "الدرجة العظمى"}
                <input
                  type="number"
                  min={1}
                  value={form.maxScore}
                  onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs text-foreground font-mono"
                />
              </label>
            </div>
            <label className="block text-[11px] text-muted-foreground">
              {isEn ? "Scheduled at" : "موعد الامتحان"}
              <input
                type="date"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs text-foreground font-mono"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-60"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {isEn ? "Create" : "إنشاء"}
            </button>
          </form>
        </div>
      )}

      {activeExam && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-border/70 bg-card my-6">
            <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground truncate">{activeExam.exam.title}</h3>
                <p className="text-[10px] text-muted-foreground font-mono tabular-nums mt-0.5">
                  {STATUS_LABEL[activeExam.exam.status] || activeExam.exam.status} · {activeExam.exam.maxScore}{" "}
                  {isEn ? "pts" : "درجة"}
                </p>
              </div>
              <button type="button" onClick={() => setActiveExam(null)} aria-label={isEn ? "Close" : "إغلاق"}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="divide-y divide-border/60 max-h-[55vh] overflow-y-auto">
              {activeExam.students.length === 0 ? (
                <p className="p-4 text-[11px] text-muted-foreground">
                  {isEn ? "No students in scope for this exam" : "لا يوجد طلاب مرتبطون بهذا الامتحان"}
                </p>
              ) : (
                activeExam.students.map((student) => (
                  <div key={student.studentId} className="px-4 py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-foreground">{student.studentName}</span>
                      {student.code ? (
                        <span className="text-[10px] text-muted-foreground font-mono ms-2">{student.code}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={activeExam.exam.maxScore}
                        value={scores[student.studentId] ?? ""}
                        onChange={(e) => setScores({ ...scores, [student.studentId]: e.target.value })}
                        placeholder="—"
                        className="w-16 rounded-lg border border-border/70 bg-background px-2 py-1 text-[11px] text-foreground font-mono text-center"
                      />
                      <span className="text-[10px] text-muted-foreground font-mono">/{activeExam.exam.maxScore}</span>
                      {student.grade ? (
                        <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-foreground">
                          {student.grade}
                        </span>
                      ) : null}
                      {student.certificateId ? (
                        <a
                          href={certificatePdfUrl(student.certificateId)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded border border-border/70 text-success"
                          aria-label={isEn ? "Certificate" : "الشهادة"}
                        >
                          <Award className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setIssueFor({
                              studentId: student.studentId,
                              studentName: student.studentName,
                              examId: activeExam.exam.id,
                              title: activeExam.exam.title,
                            })
                          }
                          className="p-1 rounded border border-border/70 text-muted-foreground hover:bg-muted"
                          aria-label={isEn ? "Issue certificate" : "إصدار شهادة"}
                        >
                          <Award className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-4 py-3 border-t border-border/70 flex flex-wrap items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={handleSaveScores}
                disabled={savingScores || activeExam.exam.status === "CLOSED"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
              >
                {savingScores ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {isEn ? "Save grades" : "حفظ الدرجات"}
              </button>
              {activeExam.exam.status !== "CLOSED" && (
                <>
                  <button
                    type="button"
                    onClick={handlePublish}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isEn ? "Publish" : "نشر النتائج"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/70 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
                  >
                    {isEn ? "Close exam" : "إغلاق الامتحان"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {issueFor && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border border-border/70 bg-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {isEn ? "Issue certificate" : "إصدار شهادة"} — {issueFor.studentName}
            </h3>
            <label className="block text-[11px] text-muted-foreground">
              {isEn ? "Type" : "نوع الشهادة"}
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-xs text-foreground"
              >
                <option value="ACHIEVEMENT">{CERT_TYPE_LABEL['ACHIEVEMENT']}</option>
                <option value="LEVEL">{CERT_TYPE_LABEL['LEVEL']}</option>
                <option value="COURSE">{CERT_TYPE_LABEL['COURSE']}</option>
              </select>
            </label>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIssueFor(null)}
                className="px-3 py-1.5 rounded-lg border border-border/70 text-[11px] text-muted-foreground"
              >
                {isEn ? "Cancel" : "إلغاء"}
              </button>
              <button
                type="button"
                onClick={handleIssue}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold"
              >
                {isEn ? "Issue" : "إصدار"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
