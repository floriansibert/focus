import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useTaskStore } from '../../store/taskStore';
import { COLOR_OPTIONS } from '../../constants/colors';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tagIds: string[]) => void;
  compact?: boolean;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  showSelectedOnly?: boolean;
}

export function TagSelector({ selectedTags, onChange, compact = false, isExpanded: externalExpanded, onExpandChange, showSelectedOnly = false }: TagSelectorProps) {
  const { tags, addTag } = useTaskStore();
  const [isCreating, setIsCreating] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(COLOR_OPTIONS[0].value);

  // Use external state if provided (compact mode), otherwise use internal state
  const isExpanded = compact ? (externalExpanded ?? false) : internalExpanded;
  const setIsExpanded = compact ? (onExpandChange ?? setInternalExpanded) : setInternalExpanded;

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;

    // Create the tag
    addTag({ name: newTagName.trim(), color: newTagColor });

    // Find the newly created tag and auto-select it
    const newTag = useTaskStore.getState().tags.find(t => t.name === newTagName.trim());
    if (newTag) {
      onChange([...selectedTags, newTag.id]);
    }

    // Reset form
    setNewTagName('');
    setNewTagColor(COLOR_OPTIONS[0].value);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setNewTagName('');
    setNewTagColor(COLOR_OPTIONS[0].value);
    setIsCreating(false);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {[...tags]
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter((tag) => {
          if (showSelectedOnly) return selectedTags.includes(tag.id);
          return !compact || isExpanded || selectedTags.includes(tag.id);
        })
        .map((tag) => {
        const isSelected = selectedTags.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => {
              toggleTag(tag.id);
              if (compact && isExpanded) setIsExpanded(false); // Close dropdown after selection in compact mode
            }}
            tabIndex={-1}
            className={`
              transition-all
              ${isSelected ? 'scale-105' : 'opacity-60 hover:opacity-100'}
            `}
          >
            <Badge
              color={tag.color}
              className={`
                cursor-pointer
                ${isSelected && (!compact || isExpanded) ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              `}
            >
              {tag.name}
            </Badge>
          </button>
        );
      })}

      {/* Create new tag inline form */}
      {!showSelectedOnly && (
        isCreating ? (
          <div className="flex items-center gap-2 p-2 border-2 border-blue-500 rounded-lg bg-white dark:bg-gray-800">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTag();
                if (e.key === 'Escape') handleCancel();
              }}
              placeholder="Tag name"
              className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-1">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setNewTagColor(color.value)}
                  className={`w-5 h-5 rounded-full cursor-pointer transition-all ${
                    newTagColor === color.value ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-blue-500' : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  aria-label={`Select ${color.name} color`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleCreateTag}
              className="p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              <Check size={16} />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            {!compact && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                tabIndex={-1}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Plus size={14} />
                Create Tag
              </button>
            )}
            {compact && isExpanded && (
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setIsCreating(true);
                }}
                tabIndex={-1}
                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <Plus size={12} />
                New
              </button>
            )}
          </>
        )
      )}
    </div>
  );
}
