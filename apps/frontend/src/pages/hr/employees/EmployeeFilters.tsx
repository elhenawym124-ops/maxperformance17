import React from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Department } from "./types";

interface EmployeeFiltersProps {
  searchInput: string;
  setSearchInput: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  departmentFilter: string;
  setDepartmentFilter: (value: string) => void;
  contractFilter: string;
  setContractFilter: (value: string) => void;
  userStatusFilter: string;
  setUserStatusFilter: (value: string) => void;
  departments: Department[];
}

export const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  searchInput,
  setSearchInput,
  statusFilter,
  setStatusFilter,
  departmentFilter,
  setDepartmentFilter,
  contractFilter,
  setContractFilter,
  userStatusFilter,
  setUserStatusFilter,
  departments,
}) => {
  const { t } = useTranslation();

  return (
    <Card className="bg-card border-border dark:border-border">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/80 h-4 w-4" />
            <Input
              placeholder={t("employees.searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pe-10 bg-card border-border text-foreground placeholder-muted dark:placeholder-muted"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-card border-border text-foreground">
              <SelectValue placeholder={t("employees.statusFilter")} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border dark:border-border">
              <SelectItem
                value="all"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.allStatuses")}
              </SelectItem>
              <SelectItem
                value="ACTIVE"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.active")}
              </SelectItem>
              <SelectItem
                value="INACTIVE"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.inactive")}
              </SelectItem>
              <SelectItem
                value="TERMINATED"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.terminated")}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={departmentFilter}
            onValueChange={setDepartmentFilter}
          >
            <SelectTrigger className="bg-card border-border text-foreground">
              <SelectValue placeholder={t("employees.departmentFilter")} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border dark:border-border">
              <SelectItem
                value="all"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.allDepartments")}
              </SelectItem>
              {departments.map((dept) => (
                <SelectItem
                  key={dept.id}
                  value={dept.id}
                  className="text-foreground hover:bg-muted"
                >
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={contractFilter} onValueChange={setContractFilter}>
            <SelectTrigger className="bg-card border-border text-foreground">
              <SelectValue placeholder={t("employees.contractFilter")} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border dark:border-border">
              <SelectItem
                value="all"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.allContracts")}
              </SelectItem>
              <SelectItem
                value="FULL_TIME"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.fullTime")}
              </SelectItem>
              <SelectItem
                value="PART_TIME"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.partTime")}
              </SelectItem>
              <SelectItem
                value="CONTRACTOR"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.contractor")}
              </SelectItem>
              <SelectItem
                value="INTERN"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.intern")}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* User Status Filter */}
          <Select
            value={userStatusFilter}
            onValueChange={setUserStatusFilter}
          >
            <SelectTrigger className="bg-card border-border text-foreground">
              <SelectValue placeholder={t("employees.accountStatusFilter")} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border dark:border-border">
              <SelectItem
                value="all"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.allAccounts")}
              </SelectItem>
              <SelectItem
                value="HAS_USER"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.hasAccount")}
              </SelectItem>
              <SelectItem
                value="NO_USER"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.noAccount")}
              </SelectItem>
              <SelectItem
                value="ACTIVE_USER"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.activeAccount")}
              </SelectItem>
              <SelectItem
                value="INACTIVE_USER"
                className="text-foreground hover:bg-muted"
              >
                {t("employees.inactiveAccount")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
