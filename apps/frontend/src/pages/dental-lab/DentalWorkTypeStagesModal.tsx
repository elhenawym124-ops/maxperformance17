import { Loader2, Plus, Workflow } from "lucide-react";
import { MODAL_CONTENT_CLS } from "./shared";
import { type DentalWorkTypeStagesModalProps } from "./stages-modal/types/stagesModalTypes";
import { StagesModalHeader } from "./stages-modal/components/StagesModalHeader";
import { StagesSummaryBar } from "./stages-modal/components/StagesSummaryBar";
import { StageRowItem } from "./stages-modal/components/StageRowItem";
import { StagesModalFooter } from "./stages-modal/components/StagesModalFooter";
import { useWorkTypeStages } from "./stages-modal/hooks/useWorkTypeStages";

export type { DentalWorkTypeStagesModalProps };

export default function DentalWorkTypeStagesModal({
  workType,
  onClose,
  onSaved,
}: DentalWorkTypeStagesModalProps) {
  const {
    stages,
    loading,
    saving,
    error,
    updateStage,
    addStage,
    removeStage,
    moveStage,
    resetToCanonical,
    handleSave,
    totalSlaHours,
    totalWages,
    totalDays,
  } = useWorkTypeStages({ workType, onClose, onSaved });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className={`${MODAL_CONTENT_CLS} !max-w-4xl max-h-[92vh] flex flex-col overflow-hidden`}
      >
        <StagesModalHeader
          workType={workType}
          saving={saving}
          onClose={onClose}
        />

        <StagesSummaryBar
          stagesCount={stages.length}
          totalSlaHours={totalSlaHours}
          totalDays={totalDays}
          totalWages={totalWages}
          onReset={resetToCanonical}
        />

        {error && (
          <div className="m-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive dark:text-destructive text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : stages.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Workflow className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">لا توجد مراحل مسجلة لهذا النوع.</p>
            </div>
          ) : (
            stages.map((st, idx) => (
              <StageRowItem
                key={`${idx}-${st.name}`}
                stage={st}
                index={idx}
                totalStages={stages.length}
                onUpdate={(updates) => updateStage(idx, updates)}
                onMove={(dir) => moveStage(idx, dir)}
                onRemove={() => removeStage(idx)}
              />
            ))
          )}

          <button
            type="button"
            onClick={addStage}
            className="w-full py-2.5 border-2 border-dashed border-border dark:border-border rounded-lg text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary dark:hover:text-primary transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            إضافة محطة / مرحلة إنتاجية جديدة
          </button>
        </div>

        <StagesModalFooter
          saving={saving}
          loading={loading}
          onClose={onClose}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
