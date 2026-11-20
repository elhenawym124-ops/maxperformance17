import React from "react";
import { Users, CheckCircle, Pencil, Save, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Benefit, Employee, EnrollmentFormData } from "./types";
import { getTypeIcon, getTypeLabel } from "./helpers";
import { DateInput } from '../../../components/ui/DateInput';

interface BenefitDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedBenefit: Benefit | null;
  employees: Employee[];
  enrollmentFormData: EnrollmentFormData;
  setEnrollmentFormData: React.Dispatch<
    React.SetStateAction<EnrollmentFormData>
  >;
  enrollLoading: boolean;
  onEnroll: () => void;
}

export const BenefitDetailsDialog: React.FC<BenefitDetailsDialogProps> = ({
  open,
  onOpenChange,
  selectedBenefit,
  employees,
  enrollmentFormData,
  setEnrollmentFormData,
  enrollLoading,
  onEnroll,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl rounded-xl p-0 overflow-hidden border-none shadow-2xl bg-white/95 dark:bg-muted backdrop-blur-md"
        dir="rtl"
      >
        {selectedBenefit && (
          <div className="flex flex-col max-h-[90vh]">
            <div className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border dark:border-border">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-card rounded-xl shadow-sm">
                      {getTypeIcon(selectedBenefit.type)}
                    </div>
                    <div className="flex flex-col">
                      <Badge
                        variant="outline"
                        className="w-fit bg-white/50 dark:bg-white/5 border-primary/20 text-primary font-bold"
                      >
                        {getTypeLabel(selectedBenefit.type)}
                      </Badge>
                      <DialogTitle className="text-3xl font-black mt-1 text-foreground">
                        {selectedBenefit.name}
                      </DialogTitle>
                    </div>
                  </div>
                  <DialogDescription className="text-gray-600 dark:text-muted-foreground leading-relaxed max-w-2xl">
                    {selectedBenefit.description ||
                      "لا يوجد وصف متاح لهذه الميزة"}
                  </DialogDescription>
                </div>
                <div className="flex items-center gap-4 bg-card/50 p-5 rounded-xl shadow-xl border border-border dark:border-border min-w-[200px]">
                  <div className="w-12 h-12 bg-warning dark:bg-warning/20 rounded-xl flex items-center justify-center text-warning dark:text-warning shadow-inner">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground/80 font-black uppercase tracking-widest mb-0.5">
                      المشتركون حالياً
                    </p>
                    <p className="text-3xl font-black text-foreground leading-none font-mono tabular-nums">
                      {selectedBenefit.activeEnrollments || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Tabs
              defaultValue="enrollments"
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="px-8 border-b border-border dark:border-border bg-white/50 dark:bg-muted">
                <TabsList className="bg-transparent gap-8 h-16">
                  <TabsTrigger
                    value="enrollments"
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-16 px-2 font-bold transition-all text-muted-foreground"
                  >
                    قائمة المشتركين
                  </TabsTrigger>
                  <TabsTrigger
                    value="add_enrollment"
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none h-16 px-2 font-bold transition-all text-muted-foreground"
                  >
                    إضافة مشترك جديد
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-8 flex-1 overflow-y-auto custom-scrollbar bg-muted dark:bg-black/20">
                <TabsContent
                  value="enrollments"
                  className="m-0 focus-visible:outline-none data-[state=active]:flex data-[state=active]:flex-col"
                >
                  {!selectedBenefit.enrollments ||
                  selectedBenefit.enrollments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 bg-muted dark:bg-muted rounded-full flex items-center justify-center mb-4">
                        <Users className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="font-bold text-foreground">
                        لا يوجد مشتركون حالياً
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ابدأ بإضافة موظفين للاستفادة من هذه الميزة
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-sm">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-b bg-muted dark:bg-muted">
                            <TableHead className="text-right text-foreground font-bold py-4">
                              الموظف
                            </TableHead>
                            <TableHead className="text-right text-foreground font-bold">
                              تاريخ البدء
                            </TableHead>
                            <TableHead className="text-right text-foreground font-bold">
                              الحالة
                            </TableHead>
                            <TableHead className="text-left text-foreground font-bold">
                              ملاحظات
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedBenefit.enrollments.map((en) => (
                            <TableRow
                              key={en.id}
                              className="group hover:bg-primary/5 dark:hover:bg-primary/10 border-b border-border dark:border-border transition-colors"
                            >
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase">
                                    {en.employee.firstName[0]}
                                  </div>
                                  <div>
                                    <p className="font-bold text-foreground">
                                      {en.employee.firstName}{" "}
                                      {en.employee.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-mono tabular-nums">
                                      #{en.employee.employeeNumber}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-600 dark:text-muted-foreground font-medium font-mono tabular-nums">
                                {new Date(en.startDate).toLocaleDateString(
                                  "ar-EG",
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    en.status === "ACTIVE"
                                      ? "bg-emerald-100 text-success hover:bg-success border-none"
                                      : "bg-gray-100 text-foreground hover:bg-muted border-none"
                                  }
                                >
                                  {en.status === "ACTIVE" ? "نشط" : "ملغى"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground dark:text-muted-foreground max-w-[200px] truncate italic">
                                {en.notes || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent
                  value="add_enrollment"
                  className="m-0 focus-visible:outline-none data-[state=active]:flex data-[state=active]:flex-col"
                >
                  <div className="max-w-2xl mx-auto space-y-8 pt-2 pb-12 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label className="text-sm font-black text-foreground flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          اختر الموظف المستفيد
                        </Label>
                        <Select
                          value={enrollmentFormData.employeeId}
                          onValueChange={(val) =>
                            setEnrollmentFormData({
                              ...enrollmentFormData,
                              employeeId: val,
                            })
                          }
                        >
                          <SelectTrigger className="h-14 rounded-xl bg-card border-border dark:border-border shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-foreground">
                            <SelectValue placeholder="ابحث عن الموظف..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border dark:border-border shadow-2xl">
                            <ScrollArea className="h-64">
                              {employees.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted-foreground italic">
                                  لا يوجد موظفون متاحون
                                </div>
                              ) : (
                                employees.map((emp) => (
                                  <SelectItem
                                    key={emp.id}
                                    value={emp.id}
                                    className="rounded-xl m-1 cursor-pointer focus:bg-primary/10"
                                  >
                                    <div className="flex flex-col text-right">
                                      <span className="font-bold">
                                        {emp.firstName} {emp.lastName}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                                        #{emp.employeeNumber}
                                      </span>
                                    </div>
                                  </SelectItem>
                                ))
                              )}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-black text-foreground flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          تاريخ بدء الاستحقاق
                        </Label>
                        <DateInput
                          
                          value={enrollmentFormData.startDate}
                          onChange={(e) =>
                            setEnrollmentFormData({
                              ...enrollmentFormData,
                              startDate: e.target.value,
                            })
                          }
                          className="h-14 rounded-xl bg-card border-border dark:border-border shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-black text-foreground flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-primary" />
                        ملاحظات إضافية
                      </Label>
                      <Textarea
                        value={enrollmentFormData.notes}
                        onChange={(e) =>
                          setEnrollmentFormData({
                            ...enrollmentFormData,
                            notes: e.target.value,
                          })
                        }
                        placeholder="أي تفاصيل خاصة باشتراك هذا الموظف (مثلاً: الفئة التأمينية، المرافقون...)"
                        className="min-h-[120px] rounded-xl bg-card border-border dark:border-border shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-foreground resize-none p-4"
                      />
                    </div>

                    <Button
                      className="w-full h-14 rounded-xl font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
                      onClick={onEnroll}
                      disabled={enrollLoading}
                    >
                      {enrollLoading ? (
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 border-3 border-white/30 border-t-white animate-spin rounded-full" />
                          جاري الحفظ...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="h-5 w-5" />
                          تأكيد التسجيل في الميزة
                        </div>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
