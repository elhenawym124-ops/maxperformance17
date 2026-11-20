interface TechnicianLedgerModalFooterProps {
  onClose: () => void;
}

export function TechnicianLedgerModalFooter({ onClose }: TechnicianLedgerModalFooterProps) {
  return (
    <div className="p-3 border-t dark:border-border flex justify-end print:hidden">
      <button
        onClick={onClose}
        className="px-4 py-1.5 text-xs text-foreground border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted"
      >
        إغلاق
      </button>
    </div>
  );
}
