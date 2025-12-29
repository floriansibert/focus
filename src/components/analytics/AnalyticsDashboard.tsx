import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import { generateInsights } from '../../lib/analytics';
import { QuadrantDistribution } from './QuadrantDistribution';
import { CompletionTrends } from './CompletionTrends';
import { WeeklyCompletions } from './WeeklyCompletions';

export function AnalyticsDashboard() {
  const tasks = useTaskStore((state) => state.tasks);
  const insights = generateInsights(tasks);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />;
      case 'success':
        return <CheckCircle size={18} className="text-green-600 dark:text-green-400" />;
      case 'info':
      default:
        return <Info size={18} className="text-blue-600 dark:text-blue-400" />;
    }
  };

  const getInsightBgColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800';
      case 'success':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Insights into your productivity and task management
        </p>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`
                flex items-start gap-3 p-4 rounded-lg border
                ${getInsightBgColor(insight.type)}
              `}
            >
              <div className="flex-shrink-0 mt-0.5">{getInsightIcon(insight.type)}</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{insight.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {tasks.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {tasks.filter((t) => t.completed).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {tasks.filter((t) => !t.completed).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {
              tasks.filter((t) => {
                if (!t.dueDate || t.completed) return false;
                return new Date(t.dueDate) < new Date();
              }).length
            }
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Overdue</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuadrantDistribution />
        <CompletionTrends />
      </div>

      {/* Weekly Completions */}
      <WeeklyCompletions />
    </div>
  );
}
