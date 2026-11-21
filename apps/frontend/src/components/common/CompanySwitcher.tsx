import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Building2,
  Zap,
  Loader2,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuthSimple";
import { getRoleLabel } from "../../pages/super-admin/company-details/helpers";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

const quietScrollbar =
  "[scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border";

interface CompanySwitcherProps {
  collapsed?: boolean;
}

type UserCompany = NonNullable<
  NonNullable<ReturnType<typeof useAuth>["user"]>["companies"]
>[number];

const CompanySwitcher: React.FC<CompanySwitcherProps> = ({
  collapsed = false,
}) => {
  const { user, switchCompany, isSwitchingCompany } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const companies = user?.companies ?? [];
  const currentCompany =
    companies.find((company) => company.isCurrent) || user?.company;
  const currentCompanyName = currentCompany?.name || "الشركة الحالية";
  const switcherLabel = `تبديل الشركة الحالية: ${currentCompanyName}`;

  useEffect(() => {
    if (collapsed) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [collapsed]);

  useEffect(() => {
    setIsOpen(false);
  }, [currentCompany?.id]);

  if (!user?.hasMultipleCompanies || companies.length <= 1) {
    return null;
  }

  const handleSwitchCompany = async (companyId: string) => {
    if (companyId === currentCompany?.id) {
      setIsOpen(false);
      return;
    }

    const success = await switchCompany(companyId);
    if (success) {
      setIsOpen(false);
    }
  };

  const renderCompanyOption = (company: UserCompany) => {
    const isCurrent = company.id === currentCompany?.id || company.isCurrent;

    return (
      <button
        key={company.id}
        type="button"
        onClick={() => handleSwitchCompany(company.id)}
        disabled={isSwitchingCompany}
        title={getRoleLabel(company.role)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-[13px] font-medium text-foreground transition-colors hover:bg-muted/60 active:scale-[.985] disabled:opacity-50"
      >
        <span className="min-w-0 flex-1 truncate">{company.name}</span>
        {isCurrent ? <Check className="size-4 shrink-0 text-primary" /> : null}
      </button>
    );
  };

  if (collapsed) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          disabled={isSwitchingCompany}
          className="relative flex items-center justify-center w-9 h-9 sm:w-auto sm:min-w-0 sm:max-w-[7.75rem] sm:gap-2 rounded-xl border border-border/70 bg-card p-0 sm:px-2.5 sm:py-2 text-right text-foreground transition-all hover:bg-muted/40 active:scale-[0.98] disabled:opacity-50"
          title={switcherLabel}
          aria-label={switcherLabel}
        >
          <span className="flex h-7 w-7 sm:h-auto sm:w-auto shrink-0 items-center justify-center rounded-md sm:bg-primary/10 text-primary">
            {isSwitchingCompany ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              <ArrowLeftRight className="size-3.5" />
            )}
          </span>

          <span className="sr-only sm:not-sr-only sm:min-w-0 sm:flex-1 text-right">
            <span className="block truncate text-xs font-semibold leading-tight text-foreground">
              {currentCompanyName}
            </span>
            <span className="block truncate text-[10px] text-muted-foreground font-mono tabular-nums">
              {companies.length} شركات
            </span>
          </span>

          <span className="absolute -top-1 -right-1 sm:static sm:top-auto sm:right-auto inline-flex min-h-[16px] min-w-[16px] sm:min-h-[18px] sm:min-w-[18px] shrink-0 items-center justify-center rounded-full sm:rounded-md bg-primary text-primary-foreground sm:bg-muted sm:text-muted-foreground px-1 text-[9px] sm:text-[10px] font-bold sm:font-semibold font-mono tabular-nums shadow-xs">
            {companies.length}
          </span>
        </button>

        <SheetContent
          side="bottom"
          className="gap-0 rounded-t-xl px-0 pb-6 bg-card border-t border-border/70"
          showCloseButton={false}
        >
          <SheetHeader className="border-b border-border/60 px-5 pb-3 pt-2 text-right">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-muted-foreground/30" />
            <SheetTitle className="flex items-center gap-2 text-sm text-right text-foreground">
              <Building2 className="size-4 text-primary" />
              تبديل الشركة
            </SheetTitle>
            <SheetDescription className="text-xs text-right text-muted-foreground">
              تعمل الآن داخل <span className="font-semibold text-foreground">{currentCompanyName}</span>
            </SheetDescription>
          </SheetHeader>

          <div
            className={`max-h-[60vh] overflow-y-auto p-1.5 ${quietScrollbar}`}
          >
            {companies.map((company) => renderCompanyOption(company))}
            {user?.role === 'SUPER_ADMIN' && (
              <div className="border-t border-border/60 p-3">
                <Link
                  to="/super-admin/companies-v2"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-all no-underline"
                >
                  <span>إدارة جميع شركات المنصة (Super Admin)</span>
                  <Zap className="size-3.5" />
                </Link>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={isSwitchingCompany}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`تبديل الشركة: ${currentCompany?.name || ""}`}
        className="flex h-8 w-full items-center gap-1.5 rounded-lg border border-border/70 bg-card px-2 text-right transition-all hover:bg-muted/40 active:scale-[.97] disabled:opacity-50"
      >
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-foreground">
          {currentCompany?.name || "الشركة"}
        </span>

        <span className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-md bg-primary/10 px-1 text-[10.5px] font-semibold text-primary font-mono tabular-nums">
          {companies.length}
        </span>

        {isSwitchingCompany ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
        ) : (
          <ChevronDown
            className={`size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute start-0 top-full z-50 mt-2 w-[232px] rounded-xl border border-border/70 bg-card p-1.5 shadow-[0_1px_2px_rgba(26,26,26,0.06),0_8px_24px_rgba(26,26,26,0.14)] before:absolute before:-top-1 before:start-[22px] before:h-2 before:w-2 before:-rotate-45 before:border-s before:border-t before:border-border before:bg-card animate-in fade-in zoom-in-95 duration-100">
          <div className={`flex max-h-[300px] flex-col gap-px overflow-y-auto ${quietScrollbar}`}>
            {companies.map((company) => renderCompanyOption(company))}
          </div>
          {user?.role === 'SUPER_ADMIN' && (
            <div className="mt-1 border-t border-border/60 pt-1">
              <Link
                to="/super-admin/companies-v2"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-all no-underline"
              >
                <span>إدارة جميع شركات المنصة</span>
                <Zap className="size-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanySwitcher;
