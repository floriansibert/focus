import { useState, useEffect } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { db } from '../../lib/db';
import toast from 'react-hot-toast';
import type { Task, QuadrantType } from '../../types/task';

export function TaskDebugPanel() {
  const tasks = useTaskStore((state) => state.tasks);
  const { deleteTask, loadFromDB } = useTaskStore();
  const [dbTasks, setDbTasks] = useState<Task[]>([]);

  useEffect(() => {
    const loadDbTasks = async () => {
      const tasksFromDb = await db.tasks.toArray();
      setDbTasks(tasksFromDb);
    };
    loadDbTasks();
  }, []);

  const cleanupOrphanedSubtasks = async () => {
    const orphaned = tasks.filter(t => {
      if (!t.parentTaskId) return false;
      const parentExists = tasks.some(parent => parent.id === t.parentTaskId);
      return !parentExists;
    });

    if (orphaned.length === 0) {
      toast.success('No orphaned subtasks to clean up!');
      return;
    }

    if (!confirm(`Delete ${orphaned.length} orphaned subtask(s)?\n\n${orphaned.map(t => `• ${t.title}`).join('\n')}`)) {
      return;
    }

    for (const task of orphaned) {
      deleteTask(task.id);
    }

    await loadFromDB();
    toast.success(`Deleted ${orphaned.length} orphaned subtask(s)`);
  };

  const fixInvalidQuadrants = async () => {
    const validQuadrants = ['urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important'];
    const invalid = tasks.filter(t => !t.parentTaskId && !validQuadrants.includes(t.quadrant));

    if (invalid.length === 0) {
      toast.success('All tasks have valid quadrants!');
      return;
    }

    const choice = prompt(
      `Found ${invalid.length} task(s) with invalid quadrants:\n\n${invalid.map(t => `• ${t.title} (currently: ${t.quadrant})`).join('\n')}\n\nChoose a quadrant to assign them to:\n1 = Urgent & Important\n2 = Not Urgent & Important\n3 = Urgent & Not Important\n4 = Not Urgent & Not Important\n\nEnter 1-4:`
    );

    const quadrantMap: Record<string, string> = {
      '1': 'urgent-important',
      '2': 'not-urgent-important',
      '3': 'urgent-not-important',
      '4': 'not-urgent-not-important'
    };

    const selectedQuadrant = quadrantMap[choice || ''];
    if (!selectedQuadrant) {
      toast.error('Invalid choice. Please enter 1-4.');
      return;
    }

    const { updateTask } = useTaskStore.getState();
    for (const task of invalid) {
      updateTask(task.id, { quadrant: selectedQuadrant as QuadrantType });
    }

    await loadFromDB();
    toast.success(`Fixed ${invalid.length} task(s) - moved to ${selectedQuadrant}`);
  };

  const breakdown = {
    total: tasks.length,
    dbTotal: dbTasks.length,
    byType: {
      standard: tasks.filter(t => t.taskType === 'standard').length,
      recurringParent: tasks.filter(t => t.taskType === 'recurring-parent').length,
      recurringInstance: tasks.filter(t => t.taskType === 'recurring-instance').length,
      subtask: tasks.filter(t => t.taskType === 'subtask').length,
    },
    byStatus: {
      completed: tasks.filter(t => t.completed).length,
      incomplete: tasks.filter(t => !t.completed).length,
    },
    topLevel: tasks.filter(t => !t.parentTaskId).length,
    withParent: tasks.filter(t => t.parentTaskId).length,
    recurring: tasks.filter(t => t.isRecurring).length,
  };

  const recurringParents = tasks.filter(t => t.taskType === 'recurring-parent');
  const recurringButNotTyped = tasks.filter(t => t.isRecurring && !t.parentTaskId && t.taskType !== 'recurring-parent');

  // Check for orphaned subtasks (subtasks whose parent doesn't exist)
  const orphanedSubtasks = tasks.filter(t => {
    if (!t.parentTaskId) return false;
    const parentExists = tasks.some(parent => parent.id === t.parentTaskId);
    return !parentExists;
  });

  // Check for subtasks and their parents
  const subtasks = tasks.filter(t => t.taskType === 'subtask');
  const subtaskDetails = subtasks.map(subtask => ({
    subtask,
    parentExists: tasks.some(t => t.id === subtask.parentTaskId),
    parent: tasks.find(t => t.id === subtask.parentTaskId)
  }));

  // Check for tasks with invalid/missing quadrants
  const validQuadrants = ['urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important'];
  const tasksWithInvalidQuadrant = tasks.filter(t => !t.parentTaskId && !validQuadrants.includes(t.quadrant));

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border-2 border-red-500 rounded-lg p-4 shadow-xl max-w-2xl max-h-[80vh] overflow-auto z-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Task Debug Panel</h2>
        <div className="flex gap-2">
          {orphanedSubtasks.length > 0 && (
            <button
              onClick={cleanupOrphanedSubtasks}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Clean Up Orphaned ({orphanedSubtasks.length})
            </button>
          )}
          {tasksWithInvalidQuadrant.length > 0 && (
            <button
              onClick={fixInvalidQuadrants}
              className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              Fix Invalid Quadrants ({tasksWithInvalidQuadrant.length})
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Overview</h3>
          <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">
            {JSON.stringify(breakdown, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Recurring Parents ({recurringParents.length})</h3>
          {recurringParents.map(task => (
            <div key={task.id} className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded mb-1">
              <div><strong>ID:</strong> {task.id}</div>
              <div><strong>Title:</strong> {task.title}</div>
              <div><strong>Quadrant:</strong> {task.quadrant}</div>
              <div><strong>TaskType:</strong> {task.taskType}</div>
              <div><strong>isRecurring:</strong> {String(task.isRecurring)}</div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-red-600">Recurring but Wrong Type ({recurringButNotTyped.length})</h3>
          {recurringButNotTyped.map(task => (
            <div key={task.id} className="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded mb-1">
              <div><strong>ID:</strong> {task.id}</div>
              <div><strong>Title:</strong> {task.title}</div>
              <div><strong>Quadrant:</strong> {task.quadrant}</div>
              <div><strong>TaskType:</strong> {task.taskType}</div>
              <div><strong>isRecurring:</strong> {String(task.isRecurring)}</div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-red-600">⚠️ Orphaned Subtasks ({orphanedSubtasks.length})</h3>
          {orphanedSubtasks.length === 0 ? (
            <div className="text-xs text-gray-500">No orphaned subtasks found</div>
          ) : (
            orphanedSubtasks.map(task => (
              <div key={task.id} className="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded mb-1">
                <div><strong>ID:</strong> {task.id}</div>
                <div><strong>Title:</strong> {task.title}</div>
                <div><strong>Quadrant:</strong> {task.quadrant}</div>
                <div><strong>ParentTaskId:</strong> {task.parentTaskId} (DOES NOT EXIST)</div>
                <div><strong>TaskType:</strong> {task.taskType}</div>
              </div>
            ))
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-2">Subtask Details ({subtaskDetails.length})</h3>
          {subtaskDetails.map(({ subtask, parentExists, parent }) => (
            <div key={subtask.id} className={`text-xs p-2 rounded mb-1 ${parentExists ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <div><strong>Subtask:</strong> {subtask.title}</div>
              <div><strong>Parent ID:</strong> {subtask.parentTaskId}</div>
              <div><strong>Parent Exists:</strong> {String(parentExists)}</div>
              {parent && <div><strong>Parent Title:</strong> {parent.title}</div>}
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-orange-600">⚠️ Tasks with Invalid Quadrant ({tasksWithInvalidQuadrant.length})</h3>
          {tasksWithInvalidQuadrant.length === 0 ? (
            <div className="text-xs text-gray-500">All tasks have valid quadrants</div>
          ) : (
            tasksWithInvalidQuadrant.map(task => (
              <div key={task.id} className="text-xs bg-orange-50 dark:bg-orange-900/20 p-2 rounded mb-1">
                <div><strong>ID:</strong> {task.id}</div>
                <div><strong>Title:</strong> {task.title}</div>
                <div><strong>Quadrant:</strong> {task.quadrant} ❌ INVALID</div>
                <div><strong>TaskType:</strong> {task.taskType}</div>
              </div>
            ))
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-2">All Tasks by Quadrant</h3>
          {['urgent-important', 'not-urgent-important', 'urgent-not-important', 'not-urgent-not-important'].map(quadrant => {
            const quadrantTasks = tasks.filter(t => t.quadrant === quadrant && !t.parentTaskId);
            return (
              <div key={quadrant} className="mb-2">
                <div className="font-medium text-sm">{quadrant}: {quadrantTasks.length} tasks</div>
                <div className="text-xs pl-2">
                  {quadrantTasks.map(t => (
                    <div key={t.id}>• {t.title} ({t.taskType})</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
