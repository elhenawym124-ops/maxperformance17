import React, { useState, useMemo } from "react";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  FileCheck,
  Clock,
  ArrowRight,
} from "lucide-react";
import { ShopifyPageHeader } from "../orders/ShopifyPageHeader";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileSize?: number;
  expiryDate?: string;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

interface PolarisDocumentsViewProps {
  documents: DocumentItem[];
  loading: boolean;
  onOpenUpload: () => void;
  onDelete: (id: string) => void;
  onVerify: (id: string) => void;
  onBackToEmployees: () => void;
}

export const PolarisDocumentsView: React.FC<PolarisDocumentsViewProps> = ({
  documents,
  loading,
  onOpenUpload,
  onDelete,
  onVerify,
  onBackToEmployees,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "valid" | "expiring" | "expired" | "unverified">("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const counts = useMemo(() => {
    let valid = 0;
    let expiring = 0;
    let expired = 0;
    let unverified = 0;

    documents.forEach((d) => {
      if (isExpired(d.expiryDate)) {
        expired++;
      } else if (isExpiringSoon(d.expiryDate)) {
        expiring++;
      } else {
        valid++;
      }
      if (!d.isVerified) {
        unverified++;
      }
    });

    return {
      all: documents.length,
      valid,
      expiring,
      expired,
      unverified,
    };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search filter
      const matchesSearch =
        !searchTerm.trim() ||
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = typeFilter === "all" || doc.type === typeFilter;

      // Tab filter
      let matchesTab = true;
      if (selectedTab === "valid") {
        matchesTab = !isExpired(doc.expiryDate) && !isExpiringSoon(doc.expiryDate);
      } else if (selectedTab === "expiring") {
        matchesTab = isExpiringSoon(doc.expiryDate) && !isExpired(doc.expiryDate);
      } else if (selectedTab === "expired") {
        matchesTab = isExpired(doc.expiryDate);
      } else if (selectedTab === "unverified") {
        matchesTab = !doc.isVerified;
      }

      return matchesSearch && matchesType && matchesTab;
    });
  }, [documents, searchTerm, typeFilter, selectedTab]);

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case "contract":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs">عقد عمل</Badge>;
      case "id":
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-xs">هوية/جواز</Badge>;
      case "certificate":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">شهادة</Badge>;
      case "medical":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">طبي</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-4 w-full max-w-full" dir="rtl">
      {/* Polaris Page Header */}
      <ShopifyPageHeader
        title="مستندات وملفات الموظف"
        subtitle="الأرشيف الرقمي الموحد لإدارة وثائق الموظف وتتبع فترات الصلاحية والتحقق الرسمي"
        badges={[
          { label: `${counts.all} مستند`, variant: "default" },
          ...(counts.expired > 0 ? [{ label: `${counts.expired} منتهي`, variant: "destructive" as const }] : []),
          ...(counts.unverified > 0 ? [{ label: `${counts.unverified} بانتظار التحقق`, variant: "secondary" as const }] : []),
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToEmployees}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              العودة للموظفين
            </Button>
            <Button
              size="sm"
              onClick={onOpenUpload}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-medium shadow-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              رفع مستند جديد
            </Button>
          </div>
        }
      />

      {/* Main Single-Surface Polaris Card Chassis */}
      <Card className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        {/* Segmented Status Tabs */}
        <div className="border-b border-border/70 bg-muted/20 px-3 pt-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            <button
              onClick={() => setSelectedTab("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedTab === "all"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <span>الكل</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                {counts.all}
              </span>
            </button>
            <button
              onClick={() => setSelectedTab("valid")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedTab === "valid"
                  ? "bg-background text-emerald-600 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-emerald-600 hover:bg-background/50"
              }`}
            >
              <span>سارية</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600">
                {counts.valid}
              </span>
            </button>
            <button
              onClick={() => setSelectedTab("expiring")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedTab === "expiring"
                  ? "bg-background text-amber-600 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-amber-600 hover:bg-background/50"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>تنتهي قريباً</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600">
                {counts.expiring}
              </span>
            </button>
            <button
              onClick={() => setSelectedTab("expired")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedTab === "expired"
                  ? "bg-background text-rose-600 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-rose-600 hover:bg-background/50"
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>منتهية</span>
              {counts.expired > 0 && (
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-600 font-bold">
                  {counts.expired}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab("unverified")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedTab === "unverified"
                  ? "bg-background text-amber-600 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-amber-600 hover:bg-background/50"
              }`}
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>بانتظار التحقق</span>
              {counts.unverified > 0 && (
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                  {counts.unverified}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-3 border-b border-border/70 bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث باسم المستند، أو نوع الملف..."
              className="pr-9 h-9 text-xs rounded-xl bg-background border-border/70"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-40">
              <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || "all")}>
                <SelectTrigger className="h-9 text-xs rounded-xl border-border/70 bg-background">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" />
                    <SelectValue placeholder="نوع المستند" />
                  </div>
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="all">كافة الأنواع</SelectItem>
                  <SelectItem value="contract">عقد عمل</SelectItem>
                  <SelectItem value="id">هوية / جواز سفر</SelectItem>
                  <SelectItem value="certificate">شهادة</SelectItem>
                  <SelectItem value="medical">تقرير طبي</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Content Section: Table / Empty / Loading */}
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              <p className="text-xs text-muted-foreground">جاري تحميل المستندات...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="h-12 w-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">لا توجد مستندات مطابقة</h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-4">
                لم يتم العثور على وثائق مطابقة للفلاتر الحالية. يمكنك رفع مستند جديد أو تعديل معايير البحث.
              </p>
              <Button size="sm" onClick={onOpenUpload} className="h-8 text-xs gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                رفع مستند الآن
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/30 text-muted-foreground font-medium">
                    <th className="py-2.5 px-4 font-medium">المستند</th>
                    <th className="py-2.5 px-4 font-medium">النوع</th>
                    <th className="py-2.5 px-4 font-medium">الحجم</th>
                    <th className="py-2.5 px-4 font-medium">حالة الصلاحية</th>
                    <th className="py-2.5 px-4 font-medium">التحقق</th>
                    <th className="py-2.5 px-4 font-medium">تاريخ الرفع</th>
                    <th className="py-2.5 px-4 font-medium text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredDocuments.map((doc) => {
                    const expired = isExpired(doc.expiryDate);
                    const expiring = isExpiringSoon(doc.expiryDate);

                    return (
                      <tr
                        key={doc.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          expired ? "bg-rose-500/[0.02]" : ""
                        }`}
                      >
                        {/* Name and Icon */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate max-w-[200px] sm:max-w-[280px]">
                                {doc.name}
                              </p>
                              {doc.expiryDate && (
                                <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
                                  ينتهي: {new Date(doc.expiryDate).toLocaleDateString("ar-EG")}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3 px-4">
                          {getDocTypeBadge(doc.type)}
                        </td>

                        {/* File Size */}
                        <td className="py-3 px-4 font-mono tabular-nums text-muted-foreground">
                          {formatFileSize(doc.fileSize)}
                        </td>

                        {/* Expiry Status */}
                        <td className="py-3 px-4">
                          {expired ? (
                            <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[11px] gap-1">
                              <AlertCircle className="h-3 w-3" />
                              منتهي الصلاحية
                            </Badge>
                          ) : expiring ? (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[11px] gap-1">
                              <Clock className="h-3 w-3" />
                              ينتهي قريباً
                            </Badge>
                          ) : doc.expiryDate ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px]">
                              ساري الصلاحية
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">دائم (بلا انتهاء)</span>
                          )}
                        </td>

                        {/* Verification Status */}
                        <td className="py-3 px-4">
                          {doc.isVerified ? (
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <CheckCircle className="h-4 w-4 shrink-0" />
                              <span className="text-[11px] font-medium">موثق ومطابق</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-600">
                              <XCircle className="h-4 w-4 shrink-0" />
                              <span className="text-[11px] font-medium">غير موثق</span>
                            </div>
                          )}
                        </td>

                        {/* Created At */}
                        <td className="py-3 px-4 font-mono tabular-nums text-muted-foreground text-[11px]">
                          {new Date(doc.createdAt).toLocaleDateString("ar-EG")}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(doc.fileUrl, "_blank")}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="تحميل / فتح المستند"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>

                            {!doc.isVerified && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onVerify(doc.id)}
                                className="h-7 px-2 text-[11px] gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                title="توثيق المستند"
                              >
                                <CheckCircle className="h-3 w-3" />
                                توثيق
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(doc.id)}
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                              title="حذف المستند"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
