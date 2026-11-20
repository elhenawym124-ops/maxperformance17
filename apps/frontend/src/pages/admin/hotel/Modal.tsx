import { XMarkIcon } from "@heroicons/react/24/outline";

export const INPUT_CLS = "w-full border rounded-lg px-3 py-2 dark:border-border dark:bg-muted dark:text-muted-foreground";
export const BTN_CLS = "px-4 py-2 rounded-lg text-sm font-medium transition-colors";
export const BTN_PRIMARY = `${BTN_CLS} bg-blue-600 text-white hover:bg-blue-700`;
export const BTN_GHOST = `${BTN_CLS} text-muted-foreground hover:bg-muted`;

export default function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-muted rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose}><XMarkIcon className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
