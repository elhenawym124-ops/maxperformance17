import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon, DocumentDuplicateIcon, PlusIcon } from "@heroicons/react/24/outline";

interface TaskTemplatesHeaderProps {
  onNewTemplate?: () => void;
  onOpenCreateModal?: () => void;
}

export const TaskTemplatesHeader: React.FC<TaskTemplatesHeaderProps> = ({
  onNewTemplate,
  onOpenCreateModal,
}) => {
  const handleClick = onOpenCreateModal || onNewTemplate;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Link
            to="/tasks"
            className="flex items-center text-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
          >
            <ArrowLeftIcon className="h-5 w-5 ms-2" />
            العودة
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center">
            <DocumentDuplicateIcon className="h-7 w-7 text-primary ms-2" />
            قوالب المهام
          </h1>
        </div>

        <button
          onClick={handleClick}
          className="inline-flex items-center px-4 py-2 bg-primary dark:bg-primary text-white rounded-md hover:bg-primary dark:hover:bg-primary transition-colors cursor-pointer"
        >
          <PlusIcon className="h-5 w-5 ms-2" />
          قالب جديد
        </button>
      </div>
      <p className="mt-2 text-foreground dark:text-muted-foreground">
        أنشئ قوالب للمهام المتكررة لتوفير الوقت
      </p>
    </div>
  );
};
