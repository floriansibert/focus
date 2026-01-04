import { useState, useMemo, useEffect } from 'react';
import { Repeat, Plus } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';
import { TaskType, QuadrantType } from '../../types/task';
import { TemplateCard } from './TemplateCard';
import { TaskModal } from '../task/TaskModal';
import { TaskSidePanel } from '../task/TaskSidePanel';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { Task } from '../../types/task';
import toast from 'react-hot-toast';

export function TemplatesDashboard() {
  const { tasks, deleteTask, toggleTemplatePause, updateTask } = useTaskStore();
  const focusedTaskId = useUIStore((state) => state.focusedTaskId);
  const setFocusedTask = useUIStore((state) => state.setFocusedTask);
  const [selectedTemplate, setSelectedTemplate] = useState<Task | null>(null);
  const [viewingInstancesFor, setViewingInstancesFor] = useState<Task | null>(null);
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<Task | null>(null);

  // Get all RECURRING_PARENT tasks (templates)
  const templates = useMemo(
    () => tasks.filter((task) => task.taskType === TaskType.RECURRING_PARENT),
    [tasks]
  );

  // Handle focused task from external navigation (e.g., clicking template link from instance)
  useEffect(() => {
    if (focusedTaskId) {
      const template = templates.find((t) => t.id === focusedTaskId);
      if (template) {
        setViewingInstancesFor(template);
        setFocusedTask(null); // Clear after handling
      }
    }
  }, [focusedTaskId, templates, setFocusedTask]);

  const handleEdit = (template: Task) => {
    setSelectedTemplate(template);
  };

  const handleViewInstances = (template: Task) => {
    setViewingInstancesFor(template);
  };

  const handleDelete = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setDeleteConfirmTemplate(template);
  };

  const confirmDelete = () => {
    if (!deleteConfirmTemplate) return;

    const instanceCount = tasks.filter((t) => t.parentTaskId === deleteConfirmTemplate.id).length;

    // Convert all instances to standard tasks
    tasks
      .filter((t) => t.parentTaskId === deleteConfirmTemplate.id)
      .forEach((instance) => {
        updateTask(instance.id, {
          parentTaskId: undefined,
          taskType: TaskType.STANDARD,
        });
      });

    // Delete template
    deleteTask(deleteConfirmTemplate.id);

    const successMessage = instanceCount > 0
      ? `Template deleted. ${instanceCount} instance${instanceCount === 1 ? '' : 's'} converted to standalone task${instanceCount === 1 ? '' : 's'}.`
      : 'Template deleted';

    toast.success(successMessage);
    setDeleteConfirmTemplate(null);
  };

  const handleTogglePause = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    toggleTemplatePause(templateId);

    toast.success(
      template.isPaused
        ? 'Template resumed - instances will generate on schedule'
        : 'Template paused - no new instances will be created'
    );
  };

  const handleCreateTemplate = () => {
    // Set a template task for the modal to pre-configure
    const templateTask: Partial<Task> = {
      title: '',
      description: '',
      quadrant: QuadrantType.NOT_URGENT_IMPORTANT,
      completed: false,
      isRecurring: true,
      taskType: TaskType.RECURRING_PARENT,
      tags: [],
      people: [],
      order: 0,
    };

    setSelectedTemplate(templateTask as Task);
  };

  const handleCloseModal = () => {
    setSelectedTemplate(null);
  };

  const handleCloseSidePanel = () => {
    setViewingInstancesFor(null);
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Repeat size={28} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Templates
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage recurring task templates
          </p>
        </div>

        {templates.length > 0 && (
          <button
            onClick={handleCreateTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus size={18} />
            Create Template
          </button>
        )}
      </div>

      {/* Templates Grid or Empty State */}
      {templates.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No Templates Yet"
          description="Create recurring task templates to automatically generate tasks on a schedule."
          action={{
            label: 'Create Template',
            onClick: handleCreateTemplate,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEdit}
              onViewInstances={handleViewInstances}
              onDelete={handleDelete}
              onTogglePause={handleTogglePause}
            />
          ))}
        </div>
      )}

      {/* Task Modal for editing/creating templates */}
      {selectedTemplate && (
        <TaskModal
          isOpen={true}
          task={selectedTemplate.id ? selectedTemplate : undefined}
          onClose={handleCloseModal}
          defaultQuadrant={selectedTemplate.quadrant}
          defaultIsRecurring={true}
        />
      )}

      {/* Task Side Panel for viewing instances */}
      {viewingInstancesFor && (
        <TaskSidePanel
          isOpen={true}
          task={viewingInstancesFor}
          onClose={handleCloseSidePanel}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmTemplate && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteConfirmTemplate(null)}
          title="Delete Template"
          message={
            tasks.filter((t) => t.parentTaskId === deleteConfirmTemplate.id).length > 0
              ? `Delete template? ${tasks.filter((t) => t.parentTaskId === deleteConfirmTemplate.id).length} instance${tasks.filter((t) => t.parentTaskId === deleteConfirmTemplate.id).length === 1 ? '' : 's'} will be converted to standalone task${tasks.filter((t) => t.parentTaskId === deleteConfirmTemplate.id).length === 1 ? '' : 's'}.`
              : 'Delete this template?'
          }
          confirmText="Delete"
          variant="danger"
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
