import { useState, useMemo } from 'react';
import { Repeat, Plus, Inbox } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { useUIStore } from '../../store/uiStore';
import { TaskType, QuadrantType } from '../../types/task';
import { TemplateCard } from './TemplateCard';
import { TaskModal } from '../task/TaskModal';
import { TaskSidePanel } from '../task/TaskSidePanel';
import { EmptyState } from '../ui/EmptyState';
import type { Task } from '../../types/task';
import toast from 'react-hot-toast';

export function TemplatesDashboard() {
  const { tasks, deleteTask } = useTaskStore();
  const [selectedTemplate, setSelectedTemplate] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingInstancesFor, setViewingInstancesFor] = useState<Task | null>(null);

  // Get all RECURRING_PARENT tasks (templates)
  const templates = useMemo(
    () => tasks.filter((task) => task.taskType === TaskType.RECURRING_PARENT),
    [tasks]
  );

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalInstances = tasks.filter(
      (task) => task.taskType === TaskType.RECURRING_INSTANCE
    ).length;

    const activeInstances = tasks.filter(
      (task) => task.taskType === TaskType.RECURRING_INSTANCE && !task.completed
    ).length;

    const completedInstances = tasks.filter(
      (task) => task.taskType === TaskType.RECURRING_INSTANCE && task.completed
    ).length;

    const completionRate =
      totalInstances > 0
        ? Math.round((completedInstances / totalInstances) * 100)
        : 0;

    return {
      totalTemplates: templates.length,
      totalInstances,
      activeInstances,
      completedInstances,
      completionRate,
    };
  }, [templates, tasks]);

  const handleEdit = (template: Task) => {
    setSelectedTemplate(template);
  };

  const handleViewInstances = (template: Task) => {
    setViewingInstancesFor(template);
  };

  const handleDelete = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const instanceCount = tasks.filter((t) => t.parentTaskId === templateId).length;

    const message =
      instanceCount > 0
        ? `Delete template and ${instanceCount} instance${instanceCount === 1 ? '' : 's'}?`
        : 'Delete this template?';

    if (window.confirm(message)) {
      // Delete template
      deleteTask(templateId);

      // Delete all instances
      tasks
        .filter((t) => t.parentTaskId === templateId)
        .forEach((instance) => deleteTask(instance.id));

      toast.success(
        `Deleted template${instanceCount > 0 ? ` and ${instanceCount} instance${instanceCount === 1 ? '' : 's'}` : ''}`
      );
    }
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
    setShowCreateModal(false);
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

      {/* Summary Statistics */}
      {templates.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {stats.totalTemplates}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {stats.totalTemplates === 1 ? 'Template' : 'Templates'}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {stats.totalInstances}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Instances
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {stats.activeInstances}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Active
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {stats.completionRate}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Completion Rate
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
