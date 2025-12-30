import { PersonBadge } from '../ui/PersonBadge';
import { useTaskStore } from '../../store/taskStore';

interface PeopleSelectorProps {
  selectedPeople: string[];
  onChange: (peopleIds: string[]) => void;
}

export function PeopleSelector({ selectedPeople, onChange }: PeopleSelectorProps) {
  const people = useTaskStore((state) => state.people);

  const togglePerson = (personId: string) => {
    if (selectedPeople.includes(personId)) {
      onChange(selectedPeople.filter((id) => id !== personId));
    } else {
      onChange([...selectedPeople, personId]);
    }
  };

  if (people.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        No people available. Create people using the users icon in the header.
      </div>
    );
  }

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
    </div>
  );
}
