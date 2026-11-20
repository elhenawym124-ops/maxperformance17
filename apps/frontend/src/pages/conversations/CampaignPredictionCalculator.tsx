import React, { useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import {
  CampaignTab,
  useCampaignCalculator,
  CampaignHeader,
  CampaignTabsNav,
  CampaignLiveInputsCard,
  CampaignAdvancedSettings,
  CampaignGoalPredictorBanner,
  CampaignAchievementCards,
  CampaignRemainingMetrics,
  CampaignSummaryRow,
  CampaignAdvancedFinancialAnalysis,
  CampaignChartsSection,
  CampaignRecommendations,
} from "./campaign-calculator";

export * from "./campaign-calculator";

export const CampaignPredictionCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CampaignTab>("input");
  const {
    inputs,
    setInputs,
    defaults,
    showAdvanced,
    setShowAdvanced,
    currentResults,
    funnelData,
    dailyProjectionData,
    recommendations,
    saveScenario,
    formatCurrency,
    formatNumber,
  } = useCampaignCalculator();

  return (
    <div className="min-h-screen bg-muted dark:bg-muted py-4 sm:py-6 px-3 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <CampaignHeader defaults={defaults} />

        {/* Tab Navigation */}
        <CampaignTabsNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Input Tab */}
        {activeTab === "input" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CampaignLiveInputsCard
              inputs={inputs}
              setInputs={setInputs}
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
            />

            {showAdvanced && (
              <CampaignAdvancedSettings
                inputs={inputs}
                setInputs={setInputs}
                defaults={defaults}
              />
            )}
          </div>
        )}

        {/* Results Tab / Live Dashboard */}
        {(activeTab === "results" || !showAdvanced) && currentResults && (
          <div className="space-y-6 mt-6">
            <div className="bg-white dark:bg-muted rounded-xl shadow-lg p-6 border-t-4 border-primary">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <SparklesIcon className="w-8 h-8 text-warning dark:text-warning" />
                  تحليل الأداء المباشر ({inputs.productName || "المنتج"})
                </h3>
                <div className="flex gap-2">
                  <span className="px-4 py-1.5 bg-primary/10 dark:bg-primary text-primary dark:text-primary rounded-full text-sm font-bold tabular-nums">
                    تارجت رسايل: {formatNumber(inputs.dailyTarget)}
                  </span>
                  <span className="px-4 py-1.5 bg-success/10 dark:bg-success text-success dark:text-success rounded-full text-sm font-bold tabular-nums">
                    تارجت اوردرات: {formatNumber(inputs.orderTarget)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Goal Predictor Banner */}
                <CampaignGoalPredictorBanner
                  inputs={inputs}
                  currentResults={currentResults}
                  formatNumber={formatNumber}
                />

                {/* Achievement Summary */}
                <CampaignAchievementCards
                  inputs={inputs}
                  currentResults={currentResults}
                  formatNumber={formatNumber}
                />

                {/* Status Metrics */}
                <CampaignRemainingMetrics
                  inputs={inputs}
                  currentResults={currentResults}
                  formatNumber={formatNumber}
                />
              </div>

              {/* Extra details row */}
              <CampaignSummaryRow
                inputs={inputs}
                currentResults={currentResults}
                formatNumber={formatNumber}
              />
            </div>

            {/* Advanced Analysis */}
            {showAdvanced && (
              <>
                <CampaignAdvancedFinancialAnalysis
                  inputs={inputs}
                  currentResults={currentResults}
                  formatCurrency={formatCurrency}
                  formatNumber={formatNumber}
                />

                <CampaignChartsSection
                  funnelData={funnelData}
                  dailyProjectionData={dailyProjectionData}
                />

                <CampaignRecommendations
                  recommendations={recommendations}
                  onSaveScenario={saveScenario}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignPredictionCalculator;
