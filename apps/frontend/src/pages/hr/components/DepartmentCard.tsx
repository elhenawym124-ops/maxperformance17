import React from "react";
import {
  Building2,
  Users,
  MoreVertical,
  UserCircle,
  Trash2,
  ChevronRight,
  Briefcase,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";

interface Department {
  id: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  color: string;
  isActive: boolean;
  sortOrder: number;
  parentId: string | null;
  managerId: string | null;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  } | null;
  parent: {
    id: string;
    name: string;
  } | null;
  _count: {
    users: number; // ✅ Changed from employees to users (employees are in User table)
    positions: number;
    children: number;
  };
}

interface DepartmentCardProps {
  department: Department;
  onViewDetails: (dept: Department) => void;
  onDelete: (dept: Department) => void;
  canManage: boolean;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({
  department,
  onViewDetails,
  onDelete,
  canManage,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="group relative overflow-hidden h-full border-none shadow-md hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-muted backdrop-blur-sm border border-border dark:border-border"
        onClick={() => onViewDetails(department)}
      >
        {/* Color Strip */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: department.color || "#3B82F6" }}
        />

        {/* Background Accent */}
        <div
          className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
          style={{ backgroundColor: department.color || "#3B82F6" }}
        />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl transition-colors"
                style={{
                  backgroundColor: `${department.color}15` || "#3B82F615",
                  color: department.color || "#3B82F6",
                }}
              >
                <Building2 className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {department.name}
                </CardTitle>
                {department.nameEn && (
                  <p className="text-sm font-medium text-muted-foreground/80">
                    {department.nameEn}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-muted dark:hover:bg-muted"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(department);
                  }}
                >
                  <UserCircle className="h-4 w-4 ms-2" />
                  عرض التفاصيل
                </DropdownMenuItem>
                {canManage && (
                  <DropdownMenuItem
                    className="text-red-600 focus:text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(department);
                    }}
                  >
                    <Trash2 className="h-4 w-4 ms-2" />
                    حذف القسم
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {department.description && (
            <p className="text-sm text-foreground dark:text-muted-foreground line-clamp-2 min-h-[40px] leading-relaxed">
              {department.description}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3">
            {/* Manager Info */}
            {department.manager ? (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-muted dark:bg-muted border border-border dark:border-border">
                <Avatar className="h-8 w-8 ring-2 ring-white dark:ring-border">
                  <AvatarImage src={department.manager.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {department.manager.firstName?.[0]}
                    {department.manager.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    مدير القسم
                  </span>
                  <span className="text-sm font-semibold text-foreground dark:text-muted-foreground">
                    {department.manager.firstName} {department.manager.lastName}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-2 rounded-lg border border-dashed border-border dark:border-border opacity-60">
                <div className="h-8 w-8 rounded-full bg-muted dark:bg-muted flex items-center justify-center">
                  <UserCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground italic">
                  بدون مدير معين
                </span>
              </div>
            )}

            {/* Parent Dept */}
            {department.parent && (
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-muted dark:bg-muted" />
                <span className="text-xs text-muted-foreground">جزء من:</span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold bg-muted dark:bg-muted"
                >
                  {department.parent.name}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border dark:border-border">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-primary">
                  <Users className="h-4 w-4" />
                  <span className="text-lg font-bold leading-none">
                    {department._count.users}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  موظف
                </span>
              </div>

              <div className="w-px h-8 bg-muted dark:bg-muted" />

              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 text-warning">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-lg font-bold leading-none">
                    {department._count.positions}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  وظيفة
                </span>
              </div>

              {department._count.children > 0 && (
                <>
                  <div className="w-px h-8 bg-muted dark:bg-muted" />
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 text-success">
                      <Activity className="h-4 w-4" />
                      <span className="text-lg font-bold leading-none">
                        {department._count.children}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      قسم فرعي
                    </span>
                  </div>
                </>
              )}
            </div>

            <Badge
              variant={department.isActive ? "default" : "secondary"}
              className={`px-3 py-1 rounded-full text-xs font-bold ${department.isActive
                  ? "bg-emerald-500 hover:bg-success text-white"
                  : "bg-gray-200 dark:bg-muted text-muted-foreground"
                }`}
            >
              {department.isActive ? "نشط" : "غير نشط"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DepartmentCard;
