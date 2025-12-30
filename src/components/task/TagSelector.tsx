import { Badge } from '../ui/Badge';
import { useTaskStore } from '../../store/taskStore';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const tags = useTaskStore((state) => state.tags);

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  if (tags.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        No tags available. Create tags using the tag icon in the header.
      </div>
    );
  }

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
    </div>
  );
}
