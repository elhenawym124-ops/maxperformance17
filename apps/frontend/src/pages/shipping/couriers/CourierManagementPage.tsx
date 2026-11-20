import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { useCourierManagementData } from './hooks/useCourierManagementData';
import { CourierSummaryCards } from './components/CourierSummaryCards';
import { CourierTable } from './components/CourierTable';
import { CourierModal } from './components/CourierModal';
import { CourierDocumentsModal } from './components/CourierDocumentsModal';
import { Courier } from '../../../../services/courierService';

const CourierManagementPage: React.FC = () => {
  const {
    couriers,
    summary,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    isModalOpen,
    setIsModalOpen,
    editingCourier,
    saving,
    formData,
    setFormData,
    fetchData,
    handleOpenCreate,
    handleOpenEdit,
    handleSave,
    handleDelete,
  } = useCourierManagementData();

  const [selectedCourierForDocs, setSelectedCourierForDocs] = useState<Courier | null>(null);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);

  const handleOpenDocuments = (c: Courier) => {
    setSelectedCourierForDocs(c);
    setIsDocsModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 w-full max-w-[1800px] mx-auto text-foreground dark:text-muted-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border dark:border-border pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">إدارة المناديب والتوصيل الداخلي</h1>
          <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground mt-1">
            متابعة أسطول التوصيل الداخلي، توثيق المستندات، احتساب المرتبات والبونص، ومراقبة العهد النقدية
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/shipping/courier-payroll"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold border border-success dark:border-success bg-success/10 dark:bg-success/40 text-success dark:text-success rounded-lg hover:bg-success dark:hover:bg-success/40 transition"
          >
            <BanknotesIcon className="w-4 h-4" />
            مسير الرواتب والمكافآت
          </Link>
          <Link
            to="/shipping/delivery-runs"
            className="px-3.5 py-2 text-xs sm:text-sm font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
          >
            رحلات التوزيع والمانيفست
          </Link>
          <Link
            to="/shipping/courier-settlements"
            className="px-3.5 py-2 text-xs sm:text-sm font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
          >
            التوريد المالي وتسوية الوردية
          </Link>
          <Link
            to="/shipping/fleet-settings"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
          >
            <Cog6ToothIcon className="w-4 h-4 text-muted-foreground" />
            إعدادات الأسطول
          </Link>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-muted dark:bg-muted dark:text-foreground rounded-lg hover:bg-muted transition active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            إضافة مندوب جديد
          </button>
        </div>
      </div>

      {/* Telemetry Summary Cards */}
      <CourierSummaryCards summary={summary} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-muted p-3 rounded-xl border border-border dark:border-border">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlassIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث بالاسم، الهاتف، أو رقم اللوحة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full ps-3 pe-9 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-border dark:focus:ring-border"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-muted dark:bg-muted border border-border dark:border-border rounded-lg focus:outline-none"
          >
            <option value="ALL">كل حالات العمل</option>
            <option value="AVAILABLE">متاح بالمقر</option>
            <option value="ON_DUTY">في المأمورية</option>
            <option value="OFF_DUTY">خارج الدوام</option>
          </select>
          <button
            onClick={fetchData}
            title="تحديث"
            className="p-2 border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Couriers Grid/Table */}
      <CourierTable
        couriers={couriers}
        onOpenEdit={handleOpenEdit}
        onOpenDocuments={handleOpenDocuments}
        onDelete={handleDelete}
      />

      {/* Add / Edit Modal */}
      <CourierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingCourier={editingCourier}
        formData={formData}
        setFormData={setFormData}
        saving={saving}
        onSave={handleSave}
      />

      {/* Documents Modal */}
      <CourierDocumentsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        courier={selectedCourierForDocs}
        onStatusUpdated={() => {
          fetchData();
        }}
      />
    </div>
  );
};

export default CourierManagementPage;
