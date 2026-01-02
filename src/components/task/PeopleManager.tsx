import { useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PersonBadge } from '../ui/PersonBadge';
import { useTaskStore } from '../../store/taskStore';
import { COLOR_OPTIONS } from '../../constants/colors';

interface PeopleManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PeopleManager({ isOpen, onClose }: PeopleManagerProps) {
  const { people, addPerson, updatePerson, deletePerson } = useTaskStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonColor, setNewPersonColor] = useState(COLOR_OPTIONS[0].value);
  const [editPersonName, setEditPersonName] = useState('');
  const [editPersonColor, setEditPersonColor] = useState('');

  const handleAddPerson = () => {
    if (!newPersonName.trim()) return;

    addPerson({
      name: newPersonName.trim(),
      color: newPersonColor,
    });

    setNewPersonName('');
    setNewPersonColor(COLOR_OPTIONS[0].value);
  };

  const handleStartEdit = (personId: string) => {
    const person = people.find((p) => p.id === personId);
    if (!person) return;

    setEditingId(personId);
    setEditPersonName(person.name);
    setEditPersonColor(person.color);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editPersonName.trim()) return;

    updatePerson(editingId, {
      name: editPersonName.trim(),
      color: editPersonColor,
    });

    setEditingId(null);
    setEditPersonName('');
    setEditPersonColor('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPersonName('');
    setEditPersonColor('');
  };

  const handleDeletePerson = (personId: string) => {
    if (confirm('Delete this person? They will be removed from all tasks.')) {
      deletePerson(personId);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage People"
      footer={
        <Button onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Add New Person */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Add New Person
          </h3>
          <div className="space-y-3">
            <Input
              label="Person Name"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              placeholder="e.g., Alice, Bob..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddPerson();
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
                    onClick={() => setNewPersonColor(color.value)}
                    className={`
                      w-8 h-8 rounded-full transition-all
                      ${newPersonColor === color.value ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-blue-500' : 'hover:scale-110'}
                    `}
                    style={{ backgroundColor: color.value }}
                    aria-label={`Select ${color.name} color`}
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleAddPerson} className="w-full">
              <Plus size={16} />
              Add Person
            </Button>
          </div>
        </div>

        {/* Existing People */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Existing People ({people.length})
          </h3>

          {people.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No people added yet. Create one above!
            </p>
          ) : (
            <div className="space-y-2">
              {[...people].sort((a, b) => a.name.localeCompare(b.name)).map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  {editingId === person.id ? (
                    // Edit Mode
                    <>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editPersonName}
                          onChange={(e) => setEditPersonName(e.target.value)}
                          placeholder="Person name"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          {COLOR_OPTIONS.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => setEditPersonColor(color.value)}
                              className={`
                                w-6 h-6 rounded-full transition-all
                                ${editPersonColor === color.value ? 'ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-blue-500' : 'hover:scale-110'}
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
                      <PersonBadge color={person.color}>{person.name}</PersonBadge>
                      <div className="flex-1" />
                      <button
                        onClick={() => handleStartEdit(person.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePerson(person.id)}
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
