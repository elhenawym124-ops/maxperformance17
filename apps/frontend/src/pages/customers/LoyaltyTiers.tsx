import React, { useState } from "react";
import { Crown } from "lucide-react";
import {
  type CustomerLoyaltyTier,
  EGYPT_GOVERNORATES,
  useLoyaltyTiers,
  useTierForm,
  LoyaltyTiersHeader,
  TierGrid,
  TierModal,
  TierPresetModal,
} from "./loyalty-tiers";

export { EGYPT_GOVERNORATES };

const LoyaltyTiers: React.FC = () => {
  const {
    tiers,
    programs,
    isLoading,
    fetchTiers,
    tiersEnabled,
    tiersToggleSaving,
    tiersToggleMsg,
    toggleTiersEnabled,
    handleDelete,
  } = useLoyaltyTiers();

  const {
    isModalOpen,
    setIsModalOpen,
    editingTier,
    setEditingTier,
    isSaving,
    handleOpenModal,
    handleSave,
    isPresetModalOpen,
    setIsPresetModalOpen,
    presetProgramId,
    setPresetProgramId,
    selectedPresetKey,
    setSelectedPresetKey,
    isApplyingPreset,
    handleApplyPreset,
    openPresetModal,
  } = useTierForm({ programs, fetchTiers });

  // 🌍 فلترة المستويات حسب النطاق الجغرافي
  const [selectedGovFilter, setSelectedGovFilter] = useState<string>("ALL");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LoyaltyTiersHeader
        onRefresh={fetchTiers}
        onOpenPresetModal={openPresetModal}
        onOpenNewTierModal={() => handleOpenModal()}
        tiersEnabled={tiersEnabled}
        tiersToggleSaving={tiersToggleSaving}
        tiersToggleMsg={tiersToggleMsg}
        onToggleTiersEnabled={toggleTiersEnabled}
      />

      {tiers.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border dark:border-border">
          <Crown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            لا توجد مستويات
          </h3>
          <p className="text-muted-foreground mb-4">
            قم بإنشاء مستويات لتمييز عملائك المميزين
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary transition-colors shadow-sm"
          >
            إنشاء مستوى جديد
          </button>
        </div>
      ) : (
        <TierGrid
          tiers={tiers}
          selectedGovFilter={selectedGovFilter}
          setSelectedGovFilter={setSelectedGovFilter}
          onEdit={(tier: CustomerLoyaltyTier) => handleOpenModal(tier)}
          onDelete={handleDelete}
        />
      )}

      <TierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingTier={editingTier}
        setEditingTier={setEditingTier}
        programs={programs}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <TierPresetModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        programs={programs}
        presetProgramId={presetProgramId}
        setPresetProgramId={setPresetProgramId}
        selectedPresetKey={selectedPresetKey}
        setSelectedPresetKey={setSelectedPresetKey}
        onApplyPreset={handleApplyPreset}
        isApplyingPreset={isApplyingPreset}
      />
    </div>
  );
};

export default LoyaltyTiers;
