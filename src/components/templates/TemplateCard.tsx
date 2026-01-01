import { Repeat, Edit2, Eye, Trash2, Calendar, BarChart2, Star } from 'lucide-react';
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
}

export function TemplateCard({ template, onEdit, onViewInstances, onDelete }: TemplateCardProps) {
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
      {/* Header - Template badge + Quadrant badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium">
            <Repeat size={12} />
            Template
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${quadrantInfo.color}`}>
            {quadrantInfo.short}
          </span>
        </div>
        {template.isStarred && (
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
        {template.title}
      </h3>

      {/* Recurrence Pattern */}
      {template.recurrence && (
        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <Repeat size={14} className="flex-shrink-0" />
          <span>{formatRecurrenceDetailed(template.recurrence)}</span>
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-3 text-sm">
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
          <Calendar size={14} className="flex-shrink-0" />
          <span className="font-medium">
            {formatNextOccurrence(stats.nextScheduledDate)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
          <BarChart2 size={14} className="flex-shrink-0" />
          <span className="font-medium">
            {stats.totalInstances} {stats.totalInstances === 1 ? 'instance' : 'instances'}
          </span>
        </div>
      </div>

      {/* Tags and People */}
      {(templateTags.length > 0 || templatePeople.length > 0) && (
        <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          {/* Tags */}
          {templateTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {templateTags.map((tag) => (
                <Badge key={tag.id} color={tag.color} size="sm">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
          {/* People */}
          {templatePeople.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {templatePeople.map((person) => (
                <PersonBadge key={person.id} color={person.color} size="sm">
                  {person.name}
                </PersonBadge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
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
