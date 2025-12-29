import type { HistoryEntry } from '../../types/task';
import { HistoryEventRow } from './HistoryEventRow';

interface HistoryTimelineProps {
  eventsByDate: Map<string, HistoryEntry[]>;
  onTaskClick: (taskId: string) => void;
}

export function HistoryTimeline({ eventsByDate, onTaskClick }: HistoryTimelineProps) {
  return (
    <div className="space-y-6">
      {Array.from(eventsByDate.entries()).map(([dateKey, events]) => (
        <div key={dateKey}>
          {/* Date Header */}
          <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 py-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {dateKey}
            </h3>
          </div>

          {/* Events for this date */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {events.map((event) => (
              <HistoryEventRow
                key={event.id}
                event={event}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
