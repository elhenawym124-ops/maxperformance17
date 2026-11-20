import React from "react";
import {
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import type { Task } from "../../../types/tasks";
import type {
  DevTaskTab,
  ConfirmModalState,
  EditingTimeLogState,
} from "./types";
import TaskOverview from "../../../components/tasks/details/TaskOverview";
import TaskSubtasks from "../../../components/tasks/details/TaskSubtasks";
import TaskActivities from "../../../components/tasks/details/TaskActivities";
import { DevTaskChecklistsTab } from "./DevTaskChecklistsTab";
import { DevTaskCommentsTab } from "./DevTaskCommentsTab";
import { DevTaskAttachmentsTab } from "./DevTaskAttachmentsTab";
import { DevTaskTimeTab } from "./DevTaskTimeTab";

export interface DevTaskTabsContentProps {
  task: Task;
  activeTab: DevTaskTab;
  setActiveTab: (tab: DevTaskTab) => void;
  settings: any;
  userPermissions: any;
  handleToggleItem: (itemId: string, currentStatus: boolean) => void;
  handleAddItem: (checklistId: string) => void;
  newItemInputs: Record<string, string>;
  setNewItemInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setShowSubtaskModal: (show: boolean) => void;
  setShowTestingModal: (show: boolean) => void;
  newChecklistTitle: string;
  setNewChecklistTitle: (val: string) => void;
  handleCreateChecklist: () => void;
  handleExportChecklists: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isImporting: boolean;
  handleImportChecklists: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
  handleDeleteChecklistItem: (itemId: string) => void;
  newComment: string;
  setNewComment: (val: string) => void;
  handleAddComment: () => void;
  isUploading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteAttachment: (id: string) => void;
  isCurrentTaskTimerActive: boolean;
  isCurrentTaskTimerPaused: boolean;
  currentTaskElapsedSeconds: number;
  formatTime: (seconds: number) => string;
  handleStartTimer: () => void;
  handleStopTimer: () => void;
  handlePauseTimer: () => void;
  handleResumeTimer: () => void;
  setEditingTimeLog: React.Dispatch<React.SetStateAction<EditingTimeLogState | null>>;
  handleDeleteTimeLog: (id: string) => void;
}

export const DevTaskTabsContent: React.FC<DevTaskTabsContentProps> = ({
  task,
  activeTab,
  setActiveTab,
  settings,
  handleToggleItem,
  handleAddItem,
  newItemInputs,
  setNewItemInputs,
  setShowSubtaskModal,
  setShowTestingModal,
  newChecklistTitle,
  setNewChecklistTitle,
  handleCreateChecklist,
  handleExportChecklists,
  fileInputRef,
  isImporting,
  handleImportChecklists,
  setConfirmModal,
  handleDeleteChecklistItem,
  newComment,
  setNewComment,
  handleAddComment,
  isUploading,
  handleFileUpload,
  handleDeleteAttachment,
  isCurrentTaskTimerActive,
  isCurrentTaskTimerPaused,
  currentTaskElapsedSeconds,
  formatTime,
  handleStartTimer,
  handleStopTimer,
  handlePauseTimer,
  handleResumeTimer,
  setEditingTimeLog,
  handleDeleteTimeLog,
}) => {
  return (
    <div className="bg-card rounded-xl border border-border dark:border-border overflow-hidden shadow-sm min-h-[600px]">
      {/* Tabs Header */}
      <div className="border-b border-border dark:border-border bg-muted dark:bg-muted overflow-x-auto">
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "details"
                ? "text-primary border-primary dark:border-primary bg-card"
                : "text-muted-foreground border-transparent hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted"
            }`}
          >
            <DocumentDuplicateIcon className="h-5 w-5" />
            نظرة عامة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("subtasks")}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "subtasks"
                ? "text-primary border-primary dark:border-primary bg-card"
                : "text-muted-foreground border-transparent hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted"
            }`}
          >
            <ClipboardDocumentListIcon className="h-5 w-5" />
            المهام الفرعية ({task.subtasks?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("checklists")}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "checklists"
                ? "text-primary border-primary dark:border-primary bg-card"
                : "text-muted-foreground border-transparent hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted"
            }`}
          >
            <CheckCircleIcon className="h-5 w-5" />
            القوائم ({task.checklists?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("comments")}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "comments"
                ? "text-primary border-primary dark:border-primary bg-card"
                : "text-muted-foreground border-transparent hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted"
            }`}
          >
            <ChatBubbleLeftIcon className="h-5 w-5" />
            التعليقات ({task.comments?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("attachments")}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "attachments"
                ? "text-primary border-primary dark:border-primary bg-card"
                : "text-muted-foreground border-transparent hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted"
            }`}
          >
            <PaperClipIcon className="h-5 w-5" />
            المرفقات ({task.attachments?.length || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("time")}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "time"
                ? "text-primary border-primary dark:border-primary bg-card"
                : "text-muted-foreground border-transparent hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted"
            }`}
          >
            <ClockIcon className="h-5 w-5" />
            تتبع الوقت
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activities")}
            className={`px-6 py-4 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "activities"
                ? "text-primary border-primary dark:border-primary bg-card"
                : "text-muted-foreground border-transparent hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted"
            }`}
          >
            يوميات النظام
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === "details" && (
          <TaskOverview
            task={task}
            handleToggleItem={handleToggleItem}
            handleAddItem={handleAddItem}
            newItemInputs={newItemInputs}
            setNewItemInputs={setNewItemInputs}
            settings={settings}
          />
        )}

        {activeTab === "subtasks" && (
          <TaskSubtasks
            task={task}
            onAddSubtask={() => setShowSubtaskModal(true)}
            onRequestTesting={() => setShowTestingModal(true)}
            settings={settings}
          />
        )}

        {activeTab === "checklists" && (
          <DevTaskChecklistsTab
            checklists={task.checklists}
            newChecklistTitle={newChecklistTitle}
            setNewChecklistTitle={setNewChecklistTitle}
            handleCreateChecklist={handleCreateChecklist}
            handleExportChecklists={handleExportChecklists}
            fileInputRef={fileInputRef}
            isImporting={isImporting}
            handleImportChecklists={handleImportChecklists}
            newItemInputs={newItemInputs}
            setNewItemInputs={setNewItemInputs}
            handleToggleItem={handleToggleItem}
            handleAddItem={handleAddItem}
            setConfirmModal={setConfirmModal}
            handleDeleteChecklistItem={handleDeleteChecklistItem}
          />
        )}

        {activeTab === "comments" && (
          <DevTaskCommentsTab
            comments={task.comments}
            newComment={newComment}
            setNewComment={setNewComment}
            handleAddComment={handleAddComment}
          />
        )}

        {activeTab === "attachments" && (
          <DevTaskAttachmentsTab
            attachments={task.attachments}
            isUploading={isUploading}
            handleFileUpload={handleFileUpload}
            setConfirmModal={setConfirmModal}
            handleDeleteAttachment={handleDeleteAttachment}
          />
        )}

        {activeTab === "time" && (
          <DevTaskTimeTab
            timeLogs={task.timeLogs}
            isCurrentTaskTimerActive={isCurrentTaskTimerActive}
            isCurrentTaskTimerPaused={isCurrentTaskTimerPaused}
            currentTaskElapsedSeconds={currentTaskElapsedSeconds}
            formatTime={formatTime}
            handleStartTimer={handleStartTimer}
            handleStopTimer={handleStopTimer}
            handlePauseTimer={handlePauseTimer}
            handleResumeTimer={handleResumeTimer}
            setEditingTimeLog={setEditingTimeLog}
            setConfirmModal={setConfirmModal}
            handleDeleteTimeLog={handleDeleteTimeLog}
          />
        )}

        {activeTab === "activities" && (
          <TaskActivities activities={task.activities} />
        )}
      </div>
    </div>
  );
};
