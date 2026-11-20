import React from "react";
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  UserPlusIcon,
  ArrowUturnLeftIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import {
  AssetCategoryOption,
  AssetItemRecord,
  AssetListFiltersState,
  AssigningAssetState,
} from "./types";
import { getAssetStatusClassName, getAssetStatusLabel } from "./helpers";

interface AssetListFiltersAndTableProps {
  assets: AssetItemRecord[];
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  filters: AssetListFiltersState;
  onFiltersChange: (filters: AssetListFiltersState) => void;
  categories: AssetCategoryOption[];
  selectedIds: string[];
  onSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  formatPrice: (val: number | string) => string;
  onAssignAsset: (asset: AssigningAssetState) => void;
  onCloneAsset: (id: string) => void;
  onEditAsset: (asset: AssetItemRecord) => void;
  onDeleteAsset: (id: string) => void;
}

export const AssetListFiltersAndTable: React.FC<
  AssetListFiltersAndTableProps
> = ({
  assets,
  loading,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  categories,
  selectedIds,
  onSelectAll,
  onToggleSelect,
  formatPrice,
  onAssignAsset,
  onCloneAsset,
  onEditAsset,
  onDeleteAsset,
}) => {
  return (
    <>
      {/* Filters */}
      <div className="p-4 border-b border-border dark:border-border">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4 md:space-x-reverse">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 right-0 pe-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="block w-full pe-10 ps-3 py-2 border border-border rounded-md leading-5 bg-card text-foreground placeholder-muted focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              placeholder="بحث بالاسم، الكود، الرقم التسلسلي..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="flex space-x-2 space-x-reverse">
            <select
              value={filters.status}
              onChange={(e) =>
                onFiltersChange({ ...filters, status: e.target.value })
              }
              className="block w-full ps-3 pe-10 py-2 text-base border-border focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-card text-foreground"
            >
              <option value="">جميع الحالات</option>
              <option value="AVAILABLE">متاح</option>
              <option value="IN_USE">في الاستخدام</option>
              <option value="MAINTENANCE">في الصيانة</option>
              <option value="RETIRED">تالف/مكهن</option>
              <option value="LOST">مفقود</option>
            </select>

            <select
              value={filters.categoryId}
              onChange={(e) =>
                onFiltersChange({ ...filters, categoryId: e.target.value })
              }
              className="block w-full ps-3 pe-10 py-2 text-base border-border focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-card text-foreground"
            >
              <option value="">جميع التصنيفات</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border dark:divide-border">
          <thead className="bg-gradient-to-l from-primary via-primary to-primary">
            <tr>
              <th scope="col" className="px-4 py-3 text-right w-12">
                <input
                  type="checkbox"
                  checked={
                    assets.length > 0 && selectedIds.length === assets.length
                  }
                  onChange={onSelectAll}
                  className="h-4 w-4 rounded border-white/30 text-primary focus:ring-primary focus:ring-offset-0 bg-white/10 cursor-pointer"
                />
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-bold text-white uppercase tracking-wider"
              >
                الأصل
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-bold text-white uppercase tracking-wider"
              >
                التصنيف
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-bold text-white uppercase tracking-wider"
              >
                الحالة
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-bold text-white uppercase tracking-wider"
              >
                العهدة الحالية
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-bold text-white uppercase tracking-wider"
              >
                القيمة
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">إجراءات</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border dark:divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  {search || filters.status || filters.categoryId
                    ? "لا توجد نتائج مطابقة للبحث/الفلاتر"
                    : "لا توجد أصول مسجلة حالياً"}
                </td>
              </tr>
            ) : (
              assets.map((asset) => {
                const isSelected = selectedIds.includes(asset.id);
                return (
                  <tr
                    key={asset.id}
                    className={`transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-violet-50/70 dark:bg-primary/20 ring-1 ring-inset ring-primary dark:ring-primary/30"
                        : "hover:bg-muted/50/50"
                    }`}
                    onClick={(e) => {
                      if (
                        (e.target as HTMLElement).closest("button, input, a")
                      ) {
                        return;
                      }
                      onToggleSelect(asset.id);
                    }}
                  >
                    <td
                      className="px-4 py-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(asset.id)}
                        className="h-4 w-4 rounded border-border/70 text-primary focus:ring-primary cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap items-center gap-2 text-sm leading-tight">
                        <span className="font-medium text-foreground">
                          {asset.name}
                        </span>
                        {asset.code && (
                          <span className="bg-muted px-2 py-0.5 rounded text-xs text-foreground font-mono tabular-nums">
                            {asset.code}
                          </span>
                        )}
                        {asset.model && (
                          <span className="text-muted-foreground">
                            {asset.model}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {asset.category?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAssetStatusClassName(asset.status)}`}
                      >
                        {getAssetStatusLabel(asset.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {asset.currentHolder ? (
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary font-bold ms-2">
                            {asset.currentHolder.firstName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {asset.currentHolder.firstName}{" "}
                              {asset.currentHolder.lastName}
                            </div>
                            <div className="text-xs font-mono tabular-nums">
                              {asset.currentHolder.employeeNumber}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono tabular-nums">
                      {asset.purchaseValue
                        ? formatPrice(asset.purchaseValue)
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2 space-x-reverse">
                        {asset.status === "AVAILABLE" ? (
                          <button
                            onClick={() =>
                              onAssignAsset({ ...asset, type: "assign" })
                            }
                            className="text-primary hover:text-primary bg-primary/10 dark:bg-primary/40 p-1.5 rounded-xl hover:bg-primary transition-all"
                            title="تسليم عهدة"
                          >
                            <UserPlusIcon className="h-5 w-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              onAssignAsset({ ...asset, type: "return" })
                            }
                            className="text-orange-600 dark:text-warning hover:text-warning bg-warning/10 dark:bg-warning/40 p-1.5 rounded-xl hover:bg-warning transition-all"
                            title="استرجاع عهدة"
                          >
                            <ArrowUturnLeftIcon className="h-5 w-5" />
                          </button>
                        )}

                        <button
                          onClick={() => onCloneAsset(asset.id)}
                          className="text-amber-600 dark:text-warning hover:text-warning bg-warning/10 dark:bg-warning/40 p-1.5 rounded-xl hover:bg-warning transition-all"
                          title="استنساخ"
                        >
                          <DocumentDuplicateIcon className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => onEditAsset(asset)}
                          className="text-blue-600 dark:text-primary hover:text-primary bg-primary/10 dark:bg-primary/40 p-1.5 rounded-xl hover:bg-primary transition-all"
                          title="تعديل"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>

                        <button
                          onClick={() => onDeleteAsset(asset.id)}
                          className="text-red-600 dark:text-destructive hover:text-destructive bg-destructive/10 dark:bg-destructive/40 p-1.5 rounded-xl hover:bg-destructive transition-all"
                          title="حذف"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
