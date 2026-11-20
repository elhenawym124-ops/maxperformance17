import React, { useState, useEffect } from "react";
import { buildApiUrl } from "../../utils/urlHelper";
import tokenManager from "../../utils/tokenManager";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { DateInput } from '../ui/DateInput';

interface SearchFilters {
  query: string;
  status: string[];
  priority: string[];
  projectId: string;
  categoryId: string;
  assignedTo: string;
  createdBy: string;
  dueDateFrom: string;
  dueDateTo: string;
  createdDateFrom: string;
  createdDateTo: string;
  hasAttachments: boolean | null;
  hasComments: boolean | null;
  isOverdue: boolean | null;
  progressMin: number;
  progressMax: number;
  tags: string[];
  searchIn: ("title" | "description" | "comments" | "attachments")[];
}

interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
}

export interface AdvancedSearchFilters extends SearchFilters {}

export interface AdvancedSearchProps {
  initialFilters?: Partial<SearchFilters>;
  onSearch: (filters: SearchFilters) => void;
  onClose: () => void;
}

const defaultFilters: SearchFilters = {
  query: "",
  status: [],
  priority: [],
  projectId: "",
  categoryId: "",
  assignedTo: "",
  createdBy: "",
  dueDateFrom: "",
  dueDateTo: "",
  createdDateFrom: "",
  createdDateTo: "",
  hasAttachments: null,
  hasComments: null,
  isOverdue: null,
  progressMin: 0,
  progressMax: 100,
  tags: [],
  searchIn: ["title", "description"],
};

const getAuthHeaders = (additionalHeaders: Record<string, string> = {}) =>
  tokenManager.createAuthHeaders(additionalHeaders);

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  initialFilters,
  onSearch,
  onClose,
}) => {
  const [filters, setFilters] = useState<SearchFilters>(() => ({
    ...defaultFilters,
    ...initialFilters,
  }));
  const [users, setUsers] = useState<
    { id: string; firstName: string; lastName: string }[]
  >([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchProjects();
    fetchCategories();
    loadSavedSearches();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(buildApiUrl("tasks/company-users"), {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("Error fetching users:", {
          status: response.status,
          code: errData?.code,
          message: errData?.message || response.statusText,
        });
        return;
      }
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch(buildApiUrl("projects"), {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(buildApiUrl("tasks/categories/list"), {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const loadSavedSearches = () => {
    const saved = localStorage.getItem("taskSavedSearches");
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  };

  const saveSearch = () => {
    if (!searchName.trim()) return;

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName,
      filters: { ...filters },
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem("taskSavedSearches", JSON.stringify(updated));
    setShowSaveModal(false);
    setSearchName("");
  };

  const deleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem("taskSavedSearches", JSON.stringify(updated));
  };

  const loadSavedSearch = (search: SavedSearch) => {
    setFilters(search.filters);
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const toggleStatus = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter((s) => s !== status)
        : [...prev.status, status],
    }));
  };

  const togglePriority = (priority: string) => {
    setFilters((prev) => ({
      ...prev,
      priority: prev.priority.includes(priority)
        ? prev.priority.filter((p) => p !== priority)
        : [...prev.priority, priority],
    }));
  };

  const toggleSearchIn = (
    field: "title" | "description" | "comments" | "attachments",
  ) => {
    setFilters((prev) => ({
      ...prev,
      searchIn: prev.searchIn.includes(field)
        ? prev.searchIn.filter((f) => f !== field)
        : [...prev.searchIn, field],
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      setFilters((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.status.length) count++;
    if (filters.priority.length) count++;
    if (filters.projectId) count++;
    if (filters.categoryId) count++;
    if (filters.assignedTo) count++;
    if (filters.createdBy) count++;
    if (filters.dueDateFrom || filters.dueDateTo) count++;
    if (filters.createdDateFrom || filters.createdDateTo) count++;
    if (filters.hasAttachments !== null) count++;
    if (filters.hasComments !== null) count++;
    if (filters.isOverdue !== null) count++;
    if (filters.progressMin > 0 || filters.progressMax < 100) count++;
    if (filters.tags.length) count++;
    return count;
  };

  return (
    <div className="fixed inset-0 bg-muted bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-5 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <AdjustmentsHorizontalIcon className="h-6 w-6 text-primary ms-2" />
            <h2 className="text-xl font-bold text-foreground">البحث المتقدم</h2>
            {getActiveFiltersCount() > 0 && (
              <span className="me-2 px-2 py-1 text-xs bg-primary text-primary rounded-full">
                {getActiveFiltersCount()} فلتر نشط
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-foreground"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-2 flex items-center">
              <BookmarkIcon className="h-4 w-4 ms-1" />
              عمليات البحث المحفوظة
            </h3>
            <div className="flex flex-wrap gap-2">
              {savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="inline-flex items-center bg-muted rounded-full"
                >
                  <button
                    onClick={() => loadSavedSearch(search)}
                    className="px-3 py-1 text-sm text-foreground hover:text-primary"
                  >
                    {search.name}
                  </button>
                  <button
                    onClick={() => deleteSavedSearch(search.id)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Query */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            كلمة البحث
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={filters.query}
              onChange={(e) =>
                setFilters({ ...filters, query: e.target.value })
              }
              placeholder="ابحث في المهام..."
              className="w-full pe-10 ps-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Search In Options */}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">البحث في:</span>
            {[
              { id: "title", label: "العنوان" },
              { id: "description", label: "الوصف" },
              { id: "comments", label: "التعليقات" },
              { id: "attachments", label: "المرفقات" },
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => toggleSearchIn(option.id as any)}
                className={`px-2 py-1 text-xs rounded ${
                  filters.searchIn.includes(option.id as any)
                    ? "bg-indigo-100 text-primary"
                    : "bg-gray-100 text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              الحالة
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  id: "pending",
                  label: "في الانتظار",
                  color: "bg-yellow-100 text-warning",
                },
                {
                  id: "in_progress",
                  label: "قيد التنفيذ",
                  color: "bg-blue-100 text-primary",
                },
                {
                  id: "completed",
                  label: "مكتمل",
                  color: "bg-green-100 text-success",
                },
                {
                  id: "cancelled",
                  label: "ملغي",
                  color: "bg-red-100 text-destructive",
                },
              ].map((status) => (
                <button
                  key={status.id}
                  onClick={() => toggleStatus(status.id)}
                  className={`px-3 py-1 text-sm rounded-full border-2 ${
                    filters.status.includes(status.id)
                      ? `${status.color} border-current`
                      : "bg-gray-50 text-muted-foreground border-transparent"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              الأولوية
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                {
                  id: "urgent",
                  label: "عاجل",
                  color: "bg-red-100 text-destructive",
                },
                {
                  id: "high",
                  label: "عالي",
                  color: "bg-orange-100 text-warning",
                },
                {
                  id: "medium",
                  label: "متوسط",
                  color: "bg-yellow-100 text-warning",
                },
                {
                  id: "low",
                  label: "منخفض",
                  color: "bg-green-100 text-success",
                },
              ].map((priority) => (
                <button
                  key={priority.id}
                  onClick={() => togglePriority(priority.id)}
                  className={`px-3 py-1 text-sm rounded-full border-2 ${
                    filters.priority.includes(priority.id)
                      ? `${priority.color} border-current`
                      : "bg-gray-50 text-muted-foreground border-transparent"
                  }`}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              المشروع
            </label>
            <select
              value={filters.projectId}
              onChange={(e) =>
                setFilters({ ...filters, projectId: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">جميع المشاريع</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              القسم
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) =>
                setFilters({ ...filters, categoryId: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">جميع الأقسام</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned To Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              المسؤول
            </label>
            <select
              value={filters.assignedTo}
              onChange={(e) =>
                setFilters({ ...filters, assignedTo: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">جميع المستخدمين</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Created By Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              أنشأها
            </label>
            <select
              value={filters.createdBy}
              onChange={(e) =>
                setFilters({ ...filters, createdBy: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">جميع المستخدمين</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              تاريخ الاستحقاق
            </label>
            <div className="flex space-x-2 space-x-reverse">
              <DateInput
                value={filters.dueDateFrom}
                onChange={(e) =>
                  setFilters({ ...filters, dueDateFrom: e.target.value })
                }
                className="flex-1 px-2 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <DateInput
                value={filters.dueDateTo}
                onChange={(e) =>
                  setFilters({ ...filters, dueDateTo: e.target.value })
                }
                className="flex-1 px-2 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Created Date Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              تاريخ الإنشاء
            </label>
            <div className="flex space-x-2 space-x-reverse">
              <DateInput
                value={filters.createdDateFrom}
                onChange={(e) =>
                  setFilters({ ...filters, createdDateFrom: e.target.value })
                }
                className="flex-1 px-2 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <DateInput
                value={filters.createdDateTo}
                onChange={(e) =>
                  setFilters({ ...filters, createdDateTo: e.target.value })
                }
                className="flex-1 px-2 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Progress Range */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              التقدم: {filters.progressMin}% - {filters.progressMax}%
            </label>
            <div className="flex items-center space-x-2 space-x-reverse">
              <input
                type="range"
                min="0"
                max="100"
                value={filters.progressMin}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    progressMin: parseInt(e.target.value),
                  })
                }
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="100"
                value={filters.progressMax}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    progressMax: parseInt(e.target.value),
                  })
                }
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.isOverdue === true}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    isOverdue: e.target.checked ? true : null,
                  })
                }
                className="ms-2"
              />
              <span className="text-sm text-foreground">المهام المتأخرة فقط</span>
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hasAttachments === true}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    hasAttachments: e.target.checked ? true : null,
                  })
                }
                className="ms-2"
              />
              <span className="text-sm text-foreground">تحتوي على مرفقات</span>
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.hasComments === true}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    hasComments: e.target.checked ? true : null,
                  })
                }
                className="ms-2"
              />
              <span className="text-sm text-foreground">تحتوي على تعليقات</span>
            </label>
          </div>
        </div>

        {/* Tags Filter */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            الوسوم
          </label>
          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addTag())
              }
              placeholder="أضف وسم..."
              className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={addTag}
              className="px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted"
            >
              إضافة
            </button>
          </div>
          {filters.tags &&
            Array.isArray(filters.tags) &&
            filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-primary text-primary rounded text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="me-1 text-primary hover:text-primary"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between border-t pt-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-foreground hover:text-foreground"
            >
              إعادة تعيين
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-4 py-2 text-primary hover:text-primary flex items-center"
            >
              <BookmarkIcon className="h-4 w-4 ms-1" />
              حفظ البحث
            </button>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted"
            >
              إلغاء
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary flex items-center"
            >
              <MagnifyingGlassIcon className="h-5 w-5 ms-2" />
              بحث
            </button>
          </div>
        </div>

        {/* Save Search Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-muted bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm">
              <h3 className="text-lg font-medium text-foreground mb-4">
                حفظ البحث
              </h3>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="اسم البحث..."
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary mb-4"
                autoFocus
              />
              <div className="flex justify-end space-x-2 space-x-reverse">
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setSearchName("");
                  }}
                  className="px-4 py-2 text-foreground hover:text-foreground"
                >
                  إلغاء
                </button>
                <button
                  onClick={saveSearch}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearch;
