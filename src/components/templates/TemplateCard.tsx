import { Repeat, Edit2, Eye, Trash2, Calendar, BarChart2, Star, Pause, Play } from 'lucide-react';
import type { Task } from '../../types/task';
import { QUADRANT_INFO } from '../../types/quadrant';
import { useTaskStore } from '../../store/taskStore';
import { getTemplateStats } from '../../utils/templateHelpers';
import { formatRecurrenceDetailed, formatNextOccurrence } from '../../utils/date';
import { Badge } from '../ui/Badge';
import { PersonBadge } from '../ui/PersonBadge';

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
  const quadrantInfo = QUADRANT_INFO[template.quadrant];

  // Get tags and people for display
  const templateTags = allTags.filter((tag) => template.tags.includes(tag.id));
  const templatePeople = allPeople.filter((person) => template.people?.includes(person.id));

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
        <span className={`inline-flex items-center px-2 py-1 rounded-md border-2 text-xs font-semibold flex-shrink-0 text-gray-900 dark:text-gray-100 ${quadrantInfo.color}`}>
          {quadrantInfo.title}
        </span>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex-1 line-clamp-2">
          {template.title}
        </h3>
        {template.isStarred && (
          <Star size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
        )}
      </div>

      {/* Recurrence Pattern & Stats Row */}
      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
        {template.recurrence && (
          <div className="flex items-center gap-1.5">
            <Repeat size={14} className="flex-shrink-0" />
            <span>{formatRecurrenceDetailed(template.recurrence)}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="flex-shrink-0" />
          <span className="font-medium">
            {formatNextOccurrence(stats.nextScheduledDate)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <BarChart2 size={14} className="flex-shrink-0" />
          <span className="font-medium">
            {stats.totalInstances} {stats.totalInstances === 1 ? 'instance' : 'instances'}
          </span>
        </div>
      </div>

      {/* Tags and People */}
      {(templateTags.length > 0 || templatePeople.length > 0) && (
        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-1">
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

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onTogglePause(template.id)}
          className={`
            flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors
            ${template.isPaused
              ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
              : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
            }
          `}
        >
          {template.isPaused ? (
            <>
              <Play size={14} />
              Resume
            </>
          ) : (
            <>
              <Pause size={14} />
              Pause
            </>
          )}
        </button>
        <button
          onClick={() => onEdit(template)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
        >
          <Edit2 size={14} />
          Edit
        </button>
        <button
          onClick={() => onViewInstances(template)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
        >
          <Eye size={14} />
          View
        </button>
        <button
          onClick={() => onDelete(template.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}
