import { useState } from 'react';
import { Tag, Users, Calendar, Star, Check } from 'lucide-react';
import { TagSelector } from './TagSelector';
import { PeopleSelector } from './PeopleSelector';
import { DatePicker } from '../ui/DatePicker';
import { SubtaskProgressPie } from '../ui/SubtaskProgressPie';

interface CompactMetadataBarProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedPeople: string[];
  onPeopleChange: (people: string[]) => void;
  dueDate: Date | undefined;
  onDueDateChange: (date: Date | undefined) => void;
  isStarred: boolean;
  onStarToggle: () => void;
  // Completion props
  isCompleted: boolean;
  onCompletionToggle: () => void;
  subtaskCount?: number;
  completedSubtaskCount?: number;
  onSubtaskToggle?: () => void;
  isSubtasksExpanded?: boolean;
}

export function CompactMetadataBar({
  selectedTags,
  onTagsChange,
  selectedPeople,
  onPeopleChange,
  dueDate,
  onDueDateChange,
  isStarred,
  onStarToggle,
  isCompleted,
  onCompletionToggle,
  subtaskCount,
  completedSubtaskCount,
  onSubtaskToggle,
  isSubtasksExpanded = false,
}: CompactMetadataBarProps) {
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [isPeopleExpanded, setIsPeopleExpanded] = useState(false);

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
      {/* Row 1: Metadata Line - Always fixed */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Completion Indicator - FIRST */}
        {subtaskCount !== undefined && subtaskCount > 0 ? (
          // Tasks WITH subtasks: SubtaskProgressPie
          <button
            type="button"
            onClick={onSubtaskToggle}
            className="flex-shrink-0"
            title={`${completedSubtaskCount} of ${subtaskCount} subtasks - Click to ${isSubtasksExpanded ? 'collapse' : 'expand'}`}
          >
            <SubtaskProgressPie
              completed={completedSubtaskCount || 0}
              total={subtaskCount}
              size={20}
            />
          </button>
        ) : (
          // Tasks WITHOUT subtasks: Checkbox
          <button
            type="button"
            onClick={onCompletionToggle}
            className="flex-shrink-0"
          >
            <div className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
              ${isCompleted
                ? 'bg-blue-600 border-blue-600'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
              }
            `}>
              {isCompleted && <Check size={14} className="text-white" />}
            </div>
          </button>
        )}

        {/* Star Toggle - SECOND */}
        <button
          type="button"
          onClick={onStarToggle}
          className="flex-shrink-0"
        >
          <Star
            size={20}
            className={isStarred ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}
          />
        </button>

        {/* Tags: Icon + Selected badges only */}
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setIsTagsExpanded(!isTagsExpanded)}
            className="text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
            title={isTagsExpanded ? 'Close tags' : 'Select tags'}
          >
            <Tag size={16} />
          </button>
          <TagSelector
            selectedTags={selectedTags}
            onChange={onTagsChange}
            compact
            isExpanded={false}
            showSelectedOnly={true}
          />
        </div>

        {/* People: Icon + Selected badges only */}
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setIsPeopleExpanded(!isPeopleExpanded)}
            className="text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
            title={isPeopleExpanded ? 'Close people' : 'Select people'}
          >
            <Users size={16} />
          </button>
          <PeopleSelector
            selectedPeople={selectedPeople}
            onChange={onPeopleChange}
            compact
            isExpanded={false}
            showSelectedOnly={true}
          />
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-1.5">
          <span title="Due date" className="flex-shrink-0">
            <Calendar size={16} className="text-gray-400" />
          </span>
          <DatePicker
            value={dueDate}
            onChange={onDueDateChange}
            compact
          />
        </div>
      </div>

      {/* Row 2: Expansion Area - Conditionally rendered */}
      {(isTagsExpanded || isPeopleExpanded) && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          {isTagsExpanded && (
            <div className={isPeopleExpanded ? 'mb-3' : ''}>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select tags:</p>
              <TagSelector
                selectedTags={selectedTags}
                onChange={onTagsChange}
                compact={false}
                isExpanded={true}
              />
            </div>
          )}

          {isPeopleExpanded && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select people:</p>
              <PeopleSelector
                selectedPeople={selectedPeople}
                onChange={onPeopleChange}
                compact={false}
                isExpanded={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
