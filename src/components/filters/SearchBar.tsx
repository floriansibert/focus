import { Search, X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export function SearchBar() {
  const { searchQuery, setSearchQuery } = useUIStore();

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={18} className="text-gray-400" />
      </div>

      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search tasks..."
        tabIndex={-1}
        className="
          w-full pl-10 pr-10 py-2 rounded-lg border
          bg-white dark:bg-gray-800
          border-gray-300 dark:border-gray-600
          text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          transition-colors
        "
      />

      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          tabIndex={-1}
          className="
            absolute inset-y-0 right-0 pr-3 flex items-center
            text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
            transition-colors
          "
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
