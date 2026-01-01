import { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { PersonBadge } from '../ui/PersonBadge';
import { useTaskStore } from '../../store/taskStore';

interface PeopleSelectorProps {
  selectedPeople: string[];
  onChange: (peopleIds: string[]) => void;
}

const PERSON_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#EF4444', // red
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

export function PeopleSelector({ selectedPeople, onChange }: PeopleSelectorProps) {
  const { people, addPerson } = useTaskStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonColor, setNewPersonColor] = useState(PERSON_COLORS[0]);

  const togglePerson = (personId: string) => {
    if (selectedPeople.includes(personId)) {
      onChange(selectedPeople.filter((id) => id !== personId));
    } else {
      onChange([...selectedPeople, personId]);
    }
  };

  const handleCreatePerson = () => {
    if (!newPersonName.trim()) return;

    // Create the person
    addPerson({ name: newPersonName.trim(), color: newPersonColor });

    // Find the newly created person and auto-select them
    const newPerson = useTaskStore.getState().people.find(p => p.name === newPersonName.trim());
    if (newPerson) {
      onChange([...selectedPeople, newPerson.id]);
    }

    // Reset form
    setNewPersonName('');
    setNewPersonColor(PERSON_COLORS[0]);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setNewPersonName('');
    setNewPersonColor(PERSON_COLORS[0]);
    setIsCreating(false);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {[...people].sort((a, b) => a.name.localeCompare(b.name)).map((person) => {
        const isSelected = selectedPeople.includes(person.id);
        return (
          <button
            key={person.id}
            type="button"
            onClick={() => togglePerson(person.id)}
            tabIndex={-1}
            className={`
              transition-all
              ${isSelected ? 'scale-105' : 'opacity-60 hover:opacity-100'}
            `}
          >
            <PersonBadge
              color={person.color}
              className={`
                cursor-pointer
                ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800' : ''}
              `}
            >
              {person.name}
            </PersonBadge>
          </button>
        );
      })}

      {/* Create new person inline form */}
      {isCreating ? (
        <div className="flex items-center gap-2 p-2 border-2 border-blue-500 rounded-lg bg-white dark:bg-gray-800">
          <input
            type="text"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreatePerson();
              if (e.key === 'Escape') handleCancel();
            }}
            placeholder="Person name"
            className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex gap-1">
            {PERSON_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewPersonColor(color)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  newPersonColor === color ? 'border-gray-900 dark:border-gray-100 scale-110' : 'border-gray-300 dark:border-gray-600'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleCreatePerson}
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
          Create Person
        </button>
      )}
    </div>
  );
}
