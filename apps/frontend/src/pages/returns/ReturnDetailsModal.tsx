import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { ReturnRequest } from '../../services/returnService';
import { useReturnDetailsModal } from './hooks/useReturnDetailsModal';
import { ReturnDetailsTab } from './components/ReturnDetailsTab';
import { ReturnContactHistoryTab } from './components/ReturnContactHistoryTab';
import { ReturnActivityTimelineTab } from './components/ReturnActivityTimelineTab';

export interface ReturnDetailsModalProps {
  request: ReturnRequest;
  onClose: () => void;
  onUpdate: () => void;
}

const ReturnDetailsModal: React.FC<ReturnDetailsModalProps> = ({
  request,
  onClose,
  onUpdate,
}) => {
  const { t } = useTranslation();
  const {
    activeTab,
    setActiveTab,
    contactHistory,
    activityLog,
    loadingLogs,
    contactMethod,
    setContactMethod,
    contactResult,
    setContactResult,
    contactNotes,
    setContactNotes,
    reasonId,
    setReasonId,
    customerNotes,
    setCustomerNotes,
    responsibleParty,
    setResponsibleParty,
    adminNotes,
    setAdminNotes,
    shippingReturnCost,
    setShippingReturnCost,
    settlementAmount,
    setSettlementAmount,
    submittingReview,
    shippingCompanies,
    returnTypes,
    shippingCompanyId,
    returnTypeId,
    categories,
    reasons,
    responsiblePartyOptions,
    activityFilter,
    setActivityFilter,
    handleShippingCompanyChange,
    handleReturnTypeChange,
    getSuggestedCost,
    handleSaveReview,
    handleAddContact,
  } = useReturnDetailsModal(request, onUpdate);

  return (
    <div
      className="fixed inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      dir="rtl"
    >
      <div className="bg-card rounded-lg w-full max-w-2xl h-[80vh] flex flex-col shadow-xl mx-2 md:mx-0">
        {/* Header */}
        <div className="p-4 border-b border-border dark:border-border flex justify-between items-center bg-muted dark:bg-muted rounded-t-lg">
          <div>
            <h2 className="text-lg font-bold text-foreground dark:text-white flex items-center gap-2">
              {t('returns.k_189')}{request.order?.orderNumber}
            </h2>
            <p className="text-sm text-muted-foreground tabular-nums">
              {new Date(request.createdAt).toLocaleString('ar-EG')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground/80 hover:text-foreground dark:hover:text-muted-foreground transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border dark:border-border">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'details'
                ? 'border-blue-600 dark:border-primary text-primary dark:text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground'
            }`}
          >
            {t('returns.k_190')}
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'contact'
                ? 'border-blue-600 dark:border-primary text-primary dark:text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground'
            }`}
          >
            {t('returns.k_191')}
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'activity'
                ? 'border-blue-600 dark:border-primary text-primary dark:text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground'
            }`}
          >
            {t('returns.k_192')}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-card">
          {activeTab === 'details' && (
            <ReturnDetailsTab
              request={request}
              responsibleParty={responsibleParty}
              setResponsibleParty={setResponsibleParty}
              responsiblePartyOptions={responsiblePartyOptions}
              reasonId={reasonId}
              setReasonId={setReasonId}
              reasons={reasons}
              categories={categories}
              customerNotes={customerNotes}
              setCustomerNotes={setCustomerNotes}
              adminNotes={adminNotes}
              setAdminNotes={setAdminNotes}
              shippingCompanyId={shippingCompanyId}
              handleShippingCompanyChange={handleShippingCompanyChange}
              shippingCompanies={shippingCompanies}
              returnTypeId={returnTypeId}
              handleReturnTypeChange={handleReturnTypeChange}
              returnTypes={returnTypes}
              getSuggestedCost={getSuggestedCost}
              shippingReturnCost={shippingReturnCost}
              setShippingReturnCost={setShippingReturnCost}
              settlementAmount={settlementAmount}
              setSettlementAmount={setSettlementAmount}
            />
          )}

          {activeTab === 'contact' && (
            <ReturnContactHistoryTab
              handleAddContact={handleAddContact}
              contactMethod={contactMethod}
              setContactMethod={setContactMethod}
              contactResult={contactResult}
              setContactResult={setContactResult}
              contactNotes={contactNotes}
              setContactNotes={setContactNotes}
              loadingLogs={loadingLogs}
              contactHistory={contactHistory}
            />
          )}

          {activeTab === 'activity' && (
            <ReturnActivityTimelineTab
              request={request}
              loadingLogs={loadingLogs}
              activityLog={activityLog}
              activityFilter={activityFilter}
              setActivityFilter={setActivityFilter}
              reasons={reasons}
              shippingCompanies={shippingCompanies}
              returnTypes={returnTypes}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border dark:border-border bg-muted dark:bg-muted rounded-b-lg flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-card border border-border rounded-md text-sm text-foreground hover:bg-muted/50 transition-colors"
          >
            {t('returns.k_220')}
          </button>
          {activeTab === 'details' && (
            <button
              onClick={handleSaveReview}
              disabled={submittingReview}
              className="px-6 py-2 bg-primary dark:bg-primary text-white rounded-md text-sm font-bold hover:bg-primary dark:hover:bg-primary transition-colors disabled:opacity-50"
            >
              {submittingReview ? t('returns.k_105') : t('returns.k_134')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReturnDetailsModal;
