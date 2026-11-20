import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PlusIcon, TrashIcon, CheckIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  botAutomationService,
  type BotMenu,
} from "../../../services/botAutomationService";

type MenuItem = { type: "postback" | "web_url"; title: string; payload?: string; url?: string };

const emptyMenu: BotMenu = {
  isEnabled: true,
  pageId: null,
  pageName: null,
  hasPageConnected: false,
  items: [],
};

const MenuTab: React.FC = () => {
  const { t: translate } = useTranslation();
  const t = useCallback((key: string) => String(translate(key)), [translate]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<BotMenu>(emptyMenu);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await botAutomationService.getMenu();
      setMenu(data || emptyMenu);
    } catch (e) {
      toast.error(String(t("botStudio.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addItem = () => {
    setMenu({
      ...menu,
      items: [...menu.items, { type: "postback", title: "" }],
    });
  };

  const updateItem = (index: number, patch: Partial<MenuItem>) => {
    setMenu({
      ...menu,
      items: menu.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    });
  };

  const removeItem = (index: number) => {
    setMenu({ ...menu, items: menu.items.filter((_, i) => i !== index) });
  };

  const save = async () => {
    try {
      setSaving(true);
      const cleanItems: MenuItem[] = menu.items
        .filter((it) => it.title && it.title.trim())
        .map((it): MenuItem =>
          it.type === "web_url"
            ? { type: "web_url", title: it.title, url: it.url || "" }
            : { type: "postback", title: it.title, payload: it.payload || "" }
        );
      const result = await botAutomationService.saveMenu({ isEnabled: menu.isEnabled, items: cleanItems });
      if (result.push && result.push.success === false) {
        toast.error(String(t("botStudio.menuPushFailed")));
      } else {
        toast.success(String(t("botStudio.saved")));
      }
      load();
    } catch (e) {
      toast.error(String(t("botStudio.saveFailed")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary dark:border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {!menu.hasPageConnected && (
        <div className="rounded-xl border border-warning dark:border-warning bg-warning/10 dark:bg-warning/30 p-4 text-sm text-warning dark:text-warning">
          {t("botStudio.menuNoPage")}
        </div>
      )}
      {menu.hasPageConnected && menu.pageName && (
        <div className="rounded-xl border border-border dark:border-border bg-card p-4 text-sm text-foreground">
          <span className="font-medium">{t("botStudio.menuTargetPage")}:</span> {menu.pageName}
        </div>
      )}

      <div className="bg-card rounded-xl shadow-sm border border-border dark:border-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary dark:bg-primary">
              <Bars3Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{t("botStudio.persistentMenu")}</h3>
              <p className="text-sm text-foreground dark:text-muted-foreground">{t("botStudio.persistentMenuDesc")}</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0" dir="ltr">
            <input
              type="checkbox"
              checked={menu.isEnabled}
              onChange={(e) => setMenu({ ...menu, isEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-muted dark:bg-muted peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
          </label>
        </div>

        <div className="mt-5 space-y-3">
          {menu.items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">{t("botStudio.menuNoItems")}</p>
          )}
          {menu.items.map((it, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={it.title}
                  onChange={(e) => updateItem(idx, { title: e.target.value })}
                  placeholder={t("botStudio.menuItemTitle")}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
                />
                <div className="flex gap-2">
                  <select
                    value={it.type}
                    onChange={(e) => updateItem(idx, { type: e.target.value as MenuItem["type"] })}
                    className="px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
                  >
                    <option value="postback">{t("botStudio.menuItemPostback")}</option>
                    <option value="web_url">{t("botStudio.menuItemUrl")}</option>
                  </select>
                  {it.type === "postback" ? (
                    <input
                      type="text"
                      value={it.payload || ""}
                      onChange={(e) => updateItem(idx, { payload: e.target.value })}
                      placeholder={t("botStudio.menuItemPayload")}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      value={it.url || ""}
                      onChange={(e) => updateItem(idx, { url: e.target.value })}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
                    />
                  )}
                </div>
              </div>
              <button onClick={() => removeItem(idx)} className="p-2 text-muted-foreground hover:text-destructive">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}

          <button
            onClick={addItem}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <PlusIcon className="h-4 w-4" /> {t("botStudio.menuAddItem")}
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1 px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
          >
            <CheckIcon className="h-4 w-4" /> {saving ? t("botStudio.saving") : t("botStudio.menuSave")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuTab;
