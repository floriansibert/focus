import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useTaskStore } from '../../store/taskStore';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tagIds: string[]) => void;
}

const TAG_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#EF4444', // red
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

export function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const { tags, addTag } = useTaskStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

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
    setNewTagColor(TAG_COLORS[0]);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setNewTagName('');
    setNewTagColor(TAG_COLORS[0]);
    setIsCreating(false);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {[...tags].sort((a, b) => a.name.localeCompare(b.name)).map((tag) => {
        const isSelected = selectedTags.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
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
                ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              `}
            >
              {tag.name}
            </Badge>
          </button>
        );
      })}

      {/* Create new tag inline form */}
      {isCreating ? (
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
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewTagColor(color)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  newTagColor === color ? 'border-gray-900 dark:border-gray-100 scale-110' : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: color }}
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
    </div>
  );
}
