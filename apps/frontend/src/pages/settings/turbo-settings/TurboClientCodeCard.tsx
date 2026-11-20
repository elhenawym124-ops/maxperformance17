import React from "react";
import { KeyIcon } from "@heroicons/react/24/outline";

interface TurboClientCodeCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  clientCode: number | null;
  onChangeClientCode: (code: number | null) => void;
}

export const TurboClientCodeCard: React.FC<TurboClientCodeCardProps> = ({
  t,
  clientCode,
  onChangeClientCode,
}) => {
  return (
    <div className="border-t dark:border-border pt-6">
      <div className="flex items-center mb-4">
        <KeyIcon className="h-5 w-5 text-primary ms-2" />
        <h3 className="text-lg font-medium text-foreground">
          Main Client Code
        </h3>
      </div>

      <div className="space-y-2">
        <input
          type="number"
          value={clientCode ?? ""}
          onChange={(e) =>
            onChangeClientCode(e.target.value ? parseInt(e.target.value, 10) : null)
          }
          placeholder="37321"
          className="w-full px-4 py-2 border border-border dark:bg-muted dark:text-white rounded-lg focus:ring-2 focus:ring-primary dark:focus:ring-primary focus:border-primary dark:focus:border-primary font-mono tabular-nums"
        />
        <p className="text-xs text-muted-foreground">
          {t("turbo.k_31")}
        </p>
      </div>
    </div>
  );
};
