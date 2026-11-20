import React from "react";
import {
  Calendar,
  DollarSign,
  Award,
  Clock,
  BookOpen,
  FileText,
} from "lucide-react";
import type { TFunction } from "i18next";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Training,
  trainingStatusConfig,
  trainingTypeLabels,
} from "./types";

interface MyTrainingDetailsModalProps {
  t: TFunction;
  selectedTraining: Training | null;
  onClose: () => void;
}

export const MyTrainingDetailsModal: React.FC<MyTrainingDetailsModalProps> = ({
  t,
  selectedTraining,
  onClose,
}) => {
  if (!selectedTraining) return null;

  return (
    <div
      className="fixed inset-0 bg-muted bg-opacity-50 dark:bg-muted dark:bg-opacity-75 overflow-y-auto h-full w-full z-[100] flex justify-center items-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        dir="rtl"
        className="relative border border-border/70 shadow-2xl overflow-hidden rounded-xl bg-card text-card-foreground p-0 w-full max-w-[600px] my-auto"
      >
        <div className="relative w-full h-full pb-6">
          <div className="h-2 w-full bg-gradient-to-r from-primary to-primary absolute top-0 left-0" />
          <div className="px-6 pt-6 pb-2">
            <h2 className="text-2xl font-black text-foreground flex flex-col gap-2">
              <span className="flex items-center gap-2 text-primary">
                <BookOpen className="w-6 h-6" />
                {t("employee.training.detailsTitle")}
              </span>
              <span className="text-xl text-foreground">
                {selectedTraining.trainingName}
              </span>
            </h2>
          </div>

          <div className="p-6 space-y-6 bg-muted">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="font-bold border-primary text-primary bg-primary/10"
              >
                {t(
                  trainingTypeLabels[selectedTraining.type] ??
                    "employee.training.typeOther",
                )}
              </Badge>
              {selectedTraining.provider && (
                <Badge
                  variant="secondary"
                  className="font-bold bg-primary/10 text-primary"
                >
                  {t("employee.training.provider", {
                    name: selectedTraining.provider,
                  })}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 mt-4 gap-4 p-4 rounded-xl bg-white shadow-sm ring-1 ring-border">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  {t("employee.training.startDate")}
                </p>
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {new Date(selectedTraining.startDate).toLocaleDateString(
                    "ar-EG",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>
              {selectedTraining.endDate && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase">
                    {t("employee.training.endDate")}
                  </p>
                  <p className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {new Date(selectedTraining.endDate).toLocaleDateString(
                      "ar-EG",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 mt-4 gap-4 p-4 rounded-xl bg-white shadow-sm ring-1 ring-border">
              {selectedTraining.duration && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase">
                    {t("employee.training.duration")}
                  </p>
                  <p className="text-xl font-black font-mono tabular-nums text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {t("employee.training.hours", {
                      hours: selectedTraining.duration,
                    })}
                  </p>
                </div>
              )}
              {selectedTraining.cost ? (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase">
                    {t("employee.training.cost")}
                  </p>
                  <p className="text-xl font-black font-mono tabular-nums text-success flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    {selectedTraining.cost.toLocaleString()}
                    <span className="text-xs">EGP</span>
                  </p>
                </div>
              ) : (
                <div />
              )}
            </div>

            <div className="grid grid-cols-2 mt-4 gap-4 p-4 rounded-xl bg-white shadow-sm ring-1 ring-border">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  {t("employee.training.rating")}
                </p>
                {selectedTraining.score ? (
                  <p className="text-xl font-black font-mono tabular-nums text-warning flex items-center gap-2">
                    <Award className="w-5 h-5" />%{selectedTraining.score}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("employee.training.notRated")}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  {t("employee.training.status")}
                </p>
                <div className="mt-1">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-black border flex items-center gap-2 w-fit ${trainingStatusConfig[selectedTraining.status]?.color || "bg-gray-100 text-foreground"}`}
                  >
                    {trainingStatusConfig[selectedTraining.status]?.icon}
                    {t(
                      trainingStatusConfig[selectedTraining.status]?.labelKey ||
                        selectedTraining.status,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {selectedTraining.description && (
              <div className="p-4 rounded-xl bg-primary/50 border border-primary">
                <p className="text-xs font-bold text-primary mb-2 flex items-center gap-2 uppercase">
                  <FileText className="w-4 h-4" />{" "}
                  {t("employee.training.description")}
                </p>
                <p className="text-sm text-foreground leading-relaxed font-medium">
                  {selectedTraining.description}
                </p>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button
                onClick={onClose}
                className="bg-gray-100 hover:bg-muted text-foreground font-bold px-8 rounded-xl"
              >
                {t("employee.common.close")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
