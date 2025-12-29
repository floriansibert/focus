import { Upload, Download, FileJson, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import type { DataOperation } from '../../types/task';

interface DataOperationCardProps {
  operation: DataOperation;
}

export function DataOperationCard({ operation }: DataOperationCardProps) {
  const isImport = operation.operationType === 'import';
  const isJson = operation.format === 'json';

  // Icon selection
  const Icon = isImport ? Upload : Download;
  const FormatIcon = isJson ? FileJson : FileSpreadsheet;

  // Color scheme
  const bgColor = isImport
    ? 'bg-blue-50 dark:bg-blue-900/20'
    : 'bg-green-50 dark:bg-green-900/20';
  const borderColor = isImport
    ? 'border-blue-200 dark:border-blue-800'
    : 'border-green-200 dark:border-green-800';
  const iconColor = isImport
    ? 'text-blue-600 dark:text-blue-400'
    : 'text-green-600 dark:text-green-400';

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={`rounded-lg border-2 ${borderColor} ${bgColor} p-4`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${bgColor} border ${borderColor} flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>

        {/* Title and Timestamp */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`text-sm font-semibold ${iconColor}`}>
              {isImport ? 'Import' : 'Export'} - {isJson ? 'JSON' : 'CSV'}
            </h4>
            {operation.success ? (
              <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle size={14} className="text-red-600 dark:text-red-400" />
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {formatTimestamp(operation.timestamp)}
          </p>
        </div>

        {/* Format Icon */}
        <FormatIcon size={18} className="text-gray-400" />
      </div>

      {/* File Info */}
      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-600 dark:text-gray-400 truncate" title={operation.filename}>
            {operation.filename}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600 dark:text-gray-400 flex-shrink-0">
            {formatFileSize(operation.fileSizeBytes)}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {operation.taskCount}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Tasks</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {operation.tagCount}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Tags</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {operation.peopleCount}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">People</div>
        </div>
      </div>

      {/* Import Mode Badge */}
      {isImport && operation.importMode && (
        <div className="flex items-center gap-2">
          <span className={`
            text-xs px-2 py-1 rounded-full font-medium
            ${operation.importMode === 'merge'
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
              : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'}
          `}>
            {operation.importMode === 'merge' ? 'Merged' : 'Replaced'}
          </span>
        </div>
      )}

      {/* Error Message */}
      {!operation.success && operation.errorMessage && (
        <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
            <span>{operation.errorMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
