import { useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useTaskStore } from '../../store/taskStore';
import { COLOR_OPTIONS } from '../../constants/colors';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TagManager({ isOpen, onClose }: TagManagerProps) {
  const { tags, addTag, updateTag, deleteTag } = useTaskStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(COLOR_OPTIONS[0].value);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState('');

  const handleAddTag = () => {
    if (!newTagName.trim()) return;

    addTag({
      name: newTagName.trim(),
      color: newTagColor,
    });

    setNewTagName('');
    setNewTagColor(COLOR_OPTIONS[0].value);
  };

  const handleStartEdit = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (!tag) return;

    setEditingId(tagId);
    setEditTagName(tag.name);
    setEditTagColor(tag.color);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editTagName.trim()) return;

    updateTag(editingId, {
      name: editTagName.trim(),
      color: editTagColor,
    });

    setEditingId(null);
    setEditTagName('');
    setEditTagColor('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTagName('');
    setEditTagColor('');
  };

  const handleDeleteTag = (tagId: string) => {
    if (confirm('Delete this tag? It will be removed from all tasks.')) {
      deleteTag(tagId);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Tags"
      footer={
        <Button onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Add New Tag */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Add New Tag
          </h3>
          <div className="space-y-3">
            <Input
              label="Tag Name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="e.g., Work, Personal..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag();
              }}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewTagColor(color.value)}
                    className={`
                      w-8 h-8 rounded-full transition-all
                      ${newTagColor === color.value ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-blue-500' : 'hover:scale-110'}
                    `}
                    style={{ backgroundColor: color.value }}
                    aria-label={`Select ${color.name} color`}
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleAddTag} className="w-full">
              <Plus size={16} />
              Add Tag
            </Button>
          </div>
        </div>

        {/* Existing Tags */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Existing Tags ({tags.length})
          </h3>

          {tags.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No tags yet. Create one above!
            </p>
          ) : (
            <div className="space-y-2">
              {[...tags].sort((a, b) => a.name.localeCompare(b.name)).map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  {editingId === tag.id ? (
                    // Edit Mode
                    <>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editTagName}
                          onChange={(e) => setEditTagName(e.target.value)}
                          placeholder="Tag name"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          {COLOR_OPTIONS.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => setEditTagColor(color.value)}
                              className={`
                                w-6 h-6 rounded-full transition-all
                                ${editTagColor === color.value ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-blue-500' : 'hover:scale-110'}
                              `}
                              style={{ backgroundColor: color.value }}
                              aria-label={`Select ${color.name} color`}
                            />
                          ))}
                        </div>
                      </div>
                      <Button size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        <X size={16} />
                      </Button>
                    </>
                  ) : (
                    // View Mode
                    <>
                      <Badge color={tag.color}>{tag.name}</Badge>
                      <div className="flex-1" />
                      <button
                        onClick={() => handleStartEdit(tag.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
