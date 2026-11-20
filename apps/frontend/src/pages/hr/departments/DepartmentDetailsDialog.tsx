import React from "react";
import {
  Building2,
  Users,
  Trash2,
  UserPlus,
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../../components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { Department, Employee, DepartmentFormData } from "./types";
import { DepartmentEditForm } from "./DepartmentEditForm";
import { DepartmentAssignEmployeesForm } from "./DepartmentAssignEmployeesForm";

interface DepartmentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDepartment: Department | null;
  departments: Department[];
  employees: Employee[];
  filteredEmployees: Employee[];
  canManage: boolean;
  isEditingDetails: boolean;
  setIsEditingDetails: React.Dispatch<React.SetStateAction<boolean>>;
  isAddingEmployees: boolean;
  setIsAddingEmployees: React.Dispatch<React.SetStateAction<boolean>>;
  formData: DepartmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<DepartmentFormData>>;
  assignEmployeesSelection: string[];
  toggleAssignEmployeeSelection: (id: string) => void;
  employeeSearchQuery: string;
  setEmployeeSearchQuery: (query: string) => void;
  isAssigningEmployees: boolean;
  onSaveEdit: () => void;
  onAssignEmployees: () => void;
  onRemoveEmployee: (employeeId: string) => void;
  fillFormFromDepartment: (dept: Department) => void;
}

export const DepartmentDetailsDialog: React.FC<DepartmentDetailsDialogProps> = ({
  open,
  onOpenChange,
  selectedDepartment,
  departments,
  employees,
  filteredEmployees,
  canManage,
  isEditingDetails,
  setIsEditingDetails,
  isAddingEmployees,
  setIsAddingEmployees,
  formData,
  setFormData,
  assignEmployeesSelection,
  toggleAssignEmployeeSelection,
  employeeSearchQuery,
  setEmployeeSearchQuery,
  isAssigningEmployees,
  onSaveEdit,
  onAssignEmployees,
  onRemoveEmployee,
  fillFormFromDepartment,
}) => {
  if (!selectedDepartment) return null;

  const departmentEmployees = employees.filter(
    (e) =>
      e.department?.id === selectedDepartment.id ||
      e.departmentId === selectedDepartment.id,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 rounded-xl border-none">
        <DialogHeader className="sr-only">
          <DialogTitle>
            تفاصيل قسم {selectedDepartment.name}
          </DialogTitle>
          <DialogDescription>
            عرض بيانات القسم وإدارة الموظفين والتعديلات.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gradient-to-br from-primary via-primary to-primary dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6">
          <div className="flex flex-col gap-4">
            {/* Header section */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: selectedDepartment.color || "#3B82F6",
                  }}
                />
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {selectedDepartment.name}
                  </h2>
                  {selectedDepartment.nameEn && (
                    <p className="text-muted-foreground">
                      {selectedDepartment.nameEn}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={selectedDepartment.isActive ? "default" : "secondary"}
                >
                  {selectedDepartment.isActive ? "نشط" : "غير نشط"}
                </Badge>
                {canManage && (
                  <>
                    <Button
                      variant={isAddingEmployees ? "secondary" : "outline"}
                      className="gap-2"
                      onClick={() => {
                        setIsAddingEmployees((prev) => !prev);
                        setIsEditingDetails(false);
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                      {isAddingEmployees
                        ? "إغلاق إضافة الموظفين"
                        : "إضافة موظفين"}
                    </Button>
                    <Button
                      variant={isEditingDetails ? "secondary" : "outline"}
                      className="gap-2"
                      onClick={() => {
                        setIsEditingDetails((prev) => {
                          const next = !prev;
                          if (!next && selectedDepartment) {
                            fillFormFromDepartment(selectedDepartment);
                          }
                          return next;
                        });
                        setIsAddingEmployees(false);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      {isEditingDetails ? "إلغاء التعديل" : "تعديل"}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  رجوع
                </Button>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/70 dark:bg-muted">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      عدد الموظفين
                    </p>
                    <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
                      {selectedDepartment._count.users}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-primary" />
                </CardContent>
              </Card>
              <Card className="bg-white/70 dark:bg-muted">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      الأقسام الفرعية
                    </p>
                    <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
                      {selectedDepartment._count.children}
                    </p>
                  </div>
                  <Building2 className="h-8 w-8 text-primary" />
                </CardContent>
              </Card>
              <Card className="bg-white/70 dark:bg-muted">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      الوظائف
                    </p>
                    <p className="text-2xl font-bold text-foreground font-mono tabular-nums">
                      {selectedDepartment._count.positions}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-success" />
                </CardContent>
              </Card>
            </div>

            {/* Department info card */}
            <Card className="bg-white/80 dark:bg-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">معلومات القسم</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">المدير</p>
                  {selectedDepartment.manager ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={selectedDepartment.manager.avatar} />
                        <AvatarFallback className="text-xs">
                          {selectedDepartment.manager.firstName?.[0]}
                          {selectedDepartment.manager.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-foreground">
                        {selectedDepartment.manager.firstName}{" "}
                        {selectedDepartment.manager.lastName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500">غير محدد</span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">القسم الأب</p>
                  <span className="text-foreground">
                    {selectedDepartment.parent?.name || "بدون"}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">اللون</p>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">
                      {selectedDepartment.color}
                    </span>
                    <div
                      className="w-5 h-5 rounded border"
                      style={{
                        backgroundColor: selectedDepartment.color || "#3B82F6",
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">الترتيب</p>
                  <span className="text-foreground font-bold font-mono tabular-nums">
                    {selectedDepartment.sortOrder || 0}
                  </span>
                </div>
                {selectedDepartment.description && (
                  <div className="md:col-span-3 space-y-1">
                    <p className="text-muted-foreground">الوصف</p>
                    <p className="text-gray-800 dark:text-muted-foreground">
                      {selectedDepartment.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employees list in department */}
            <Card className="bg-white/80 dark:bg-muted">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  موظفو القسم
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-primary border-primary font-mono tabular-nums"
                >
                  {departmentEmployees.length} موظف
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto pe-1">
                  {departmentEmployees.length > 0 ? (
                    departmentEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/50 dark:hover:bg-muted border border-transparent hover:border-border dark:hover:border-border transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={emp.avatar} />
                            <AvatarFallback className="bg-blue-50 text-primary font-bold">
                              {emp.firstName?.[0]}
                              {emp.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {emp.position?.title || "بدون مسمى وظيفي"}
                              </span>
                              {emp.email && <span>• {emp.email}</span>}
                            </div>
                          </div>
                        </div>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                            onClick={() => onRemoveEmployee(emp.id)}
                            title="إزالة من القسم"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-muted-foreground bg-muted dark:bg-muted rounded-lg border border-dashed text-sm">
                      لا يوجد موظفين في هذا القسم حالياً
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inline editing form */}
            {isEditingDetails && (
              <DepartmentEditForm
                formData={formData}
                setFormData={setFormData}
                selectedDepartment={selectedDepartment}
                departments={departments}
                employees={employees}
                onCancel={() => {
                  fillFormFromDepartment(selectedDepartment);
                  setIsEditingDetails(false);
                }}
                onSave={onSaveEdit}
              />
            )}

            {/* Inline assign employees panel */}
            {isAddingEmployees && (
              <DepartmentAssignEmployeesForm
                employees={employees}
                filteredEmployees={filteredEmployees}
                employeeSearchQuery={employeeSearchQuery}
                setEmployeeSearchQuery={setEmployeeSearchQuery}
                assignEmployeesSelection={assignEmployeesSelection}
                toggleAssignEmployeeSelection={toggleAssignEmployeeSelection}
                isAssigningEmployees={isAssigningEmployees}
                onCancel={() => {
                  setIsAddingEmployees(false);
                }}
                onAssign={onAssignEmployees}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
