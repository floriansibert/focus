import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTaskStore } from '../../store/taskStore';
import { calculateCompletionTrend } from '../../lib/analytics';

export function CompletionTrends() {
  const tasks = useTaskStore((state) => state.tasks);
  const trend = calculateCompletionTrend(tasks, 7);

  // Detect dark mode
  const isDarkMode = document.documentElement.classList.contains('dark');
  const axisColor = isDarkMode ? '#9ca3af' : '#6b7280';
  const gridColor = isDarkMode ? '#374151' : '#e5e7eb';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        7-Day Activity Trend
      </h3>

      {tasks.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: axisColor }}
              stroke={axisColor}
            />
            <YAxis
              tick={{ fontSize: 12, fill: axisColor }}
              allowDecimals={false}
              stroke={axisColor}
            />
            <Tooltip
              cursor={{ fill: isDarkMode ? 'rgba(55, 65, 81, 0.3)' : 'rgba(229, 231, 235, 0.5)' }}
              contentStyle={{
                backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                borderRadius: '0.5rem',
                padding: '0.75rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{
                color: isDarkMode ? '#f3f4f6' : '#111827',
                fontWeight: 500,
                fontSize: '0.875rem',
                marginBottom: '0.25rem',
              }}
              itemStyle={{
                fontSize: '0.875rem',
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '1rem',
                fontSize: '0.875rem',
              }}
              iconType="circle"
            />
            <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="created" fill="#3b82f6" name="Created" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
          No activity yet. Start creating and completing tasks!
        </div>
      )}
    </div>
  );
}
