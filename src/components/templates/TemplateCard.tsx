import { useMemo } from 'react';
import { Repeat, Edit2, Eye, Trash2, Calendar, BarChart2, Star, Pause, Play, ListChecks } from 'lucide-react';
import type { Task } from '../../types/task';
import { useTaskStore } from '../../store/taskStore';
import { getTemplateStats } from '../../utils/templateHelpers';
import { formatRecurrenceDetailed, formatNextOccurrence, calculateNextNOccurrences, formatPreviewDate } from '../../utils/date';
import { Badge } from '../ui/Badge';
import { PersonBadge } from '../ui/PersonBadge';
import { QuadrantIcon } from '../task/QuadrantIcon';

interface TemplateCardProps {
  template: Task;
  onEdit: (task: Task) => void;
  onViewInstances: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onTogglePause: (taskId: string) => void;
}

export function TemplateCard({ template, onEdit, onViewInstances, onDelete, onTogglePause }: TemplateCardProps) {
  const allTasks = useTaskStore((state) => state.tasks);
  const allTags = useTaskStore((state) => state.tags);
  const allPeople = useTaskStore((state) => state.people);

  const stats = getTemplateStats(template, allTasks);

  // Get tags and people for display
  const templateTags = allTags.filter((tag) => template.tags.includes(tag.id));
  const templatePeople = allPeople.filter((person) => template.people?.includes(person.id));

  // Calculate next 5 occurrences for tooltip preview
  const nextOccurrences = useMemo(() => {
    if (!template.recurrence) {
      return { dates: [], hasMore: false };
    }
    return calculateNextNOccurrences(
      stats.nextScheduledDate || new Date(),
      template.recurrence,
      5
    );
  }, [template.recurrence, stats.nextScheduledDate]);

  return (
    <div className="rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-shadow">
      {/* Header - Template badge + Quadrant + Title */}
      <div className="flex items-start gap-2 mb-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium flex-shrink-0">
          <Repeat size={12} />
          Template
        </span>
        {template.isPaused && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-medium flex-shrink-0">
            <Pause size={12} />
            Paused
          </span>
        )}
        <div className="p-1 rounded border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          <QuadrantIcon selectedQuadrant={template.quadrant} size={24} />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex-1 line-clamp-2">
          {template.title}
        </h3>
      </div>

      {/* Stats & Actions Row */}
      <div className="flex items-center gap-3 mb-3 text-sm text-gray-600 dark:text-gray-400">
        {template.recurrence && (
          <div className="relative group flex items-center gap-1.5">
            <Repeat size={14} className="flex-shrink-0" />
            <span className="cursor-help">
              {formatRecurrenceDetailed(template.recurrence)}
            </span>

            {/* Hover Tooltip */}
            {nextOccurrences.dates.length > 0 && (
              <div className="
                absolute top-full left-0 mt-2 z-20
                invisible group-hover:visible
                opacity-0 group-hover:opacity-100
                transition-opacity duration-200
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-700
                rounded-lg shadow-lg p-3
                min-w-[250px]
                pointer-events-none
              ">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Next Occurrences
                </p>

                <div className="space-y-1">
                  {nextOccurrences.dates.map((date, index) => (
                    <div
                      key={index}
                      className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2"
                    >
                      <span className="text-gray-400 dark:text-gray-500">
                        {index + 1}.
                      </span>
                      <span>{formatPreviewDate(date)}</span>
                    </div>
                  ))}
                </div>

                {nextOccurrences.hasMore && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2">
                    ...and more
                  </p>
                )}

                {template.isPaused && (
                  <p className="text-xs text-amber-600 dark:text-amber-500 italic border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    Template is paused - resume to generate instances
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="flex-shrink-0" />
          <span className="font-medium">
            {formatNextOccurrence(stats.nextScheduledDate)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <ListChecks size={14} className="flex-shrink-0" />
          <span className="font-medium">
            {stats.totalSubtasks} {stats.totalSubtasks === 1 ? 'subtask' : 'subtasks'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <BarChart2 size={14} className="flex-shrink-0" />
          <span className="font-medium">
            {stats.totalInstances} {stats.totalInstances === 1 ? 'instance' : 'instances'}
          </span>
        </div>

        {/* Action Buttons - Icon Only */}
        <div className="flex items-center gap-1 ml-auto pl-3 border-l border-gray-300 dark:border-gray-600">
          <button
            onClick={() => onTogglePause(template.id)}
            className={`
              p-1.5 rounded-md transition-colors
              ${template.isPaused
                ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              }
            `}
            title={template.isPaused ? 'Resume' : 'Pause'}
          >
            {template.isPaused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button
            onClick={() => onEdit(template)}
            className="p-1.5 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onViewInstances(template)}
            className="p-1.5 rounded-md text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            title="View"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="p-1.5 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Star, Tags and People */}
      {(template.isStarred || templateTags.length > 0 || templatePeople.length > 0) && (
        <div>
          <div className="flex flex-wrap items-center gap-1">
            {/* Star */}
            {template.isStarred && (
              <Star size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
            {/* Tags */}
            {templateTags.map((tag) => (
              <Badge key={tag.id} color={tag.color} size="sm">
                {tag.name}
              </Badge>
            ))}
            {/* People */}
            {templatePeople.map((person) => (
              <PersonBadge key={person.id} color={person.color} size="sm">
                {person.name}
              </PersonBadge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
