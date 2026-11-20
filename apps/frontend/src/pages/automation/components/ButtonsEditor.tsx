import React from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

export interface BotButton {
  title: string;
  payload: string;
}

interface Props {
  buttons: BotButton[];
  onChange: (buttons: BotButton[]) => void;
  max?: number;
}

const ButtonsEditor: React.FC<Props> = ({ buttons, onChange, max = 3 }) => {
  const { t } = useTranslation();

  const update = (index: number, patch: Partial<BotButton>) => {
    onChange(buttons.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  };

  const add = () => {
    if (buttons.length >= max) return;
    onChange([...buttons, { title: "", payload: "" }]);
  };

  const remove = (index: number) => {
    onChange(buttons.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {buttons.map((b, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <input
            type="text"
            value={b.title}
            onChange={(e) => update(idx, { title: e.target.value })}
            placeholder={String(t("botStudio.buttonTitle"))}
            className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
          />
          <input
            type="text"
            value={b.payload}
            onChange={(e) => update(idx, { payload: e.target.value })}
            placeholder={String(t("botStudio.buttonPayload"))}
            className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
          />
          <button onClick={() => remove(idx)} className="p-2 text-muted-foreground hover:text-destructive">
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
      {buttons.length < max && (
        <button
          onClick={add}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <PlusIcon className="h-4 w-4" /> {t("botStudio.addButton")}
        </button>
      )}
    </div>
  );
};

export default ButtonsEditor;
