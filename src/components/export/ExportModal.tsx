import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useTaskStore } from '../../store/taskStore';
import { exportAsJSON, exportAsCSV, downloadFile, generateFilename } from '../../lib/export';
import { dataOperationLogger } from '../../lib/dataOperationLogger';
import toast from 'react-hot-toast';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportComplete?: () => void;
}

type ExportFormat = 'json' | 'csv';

export function ExportModal({ isOpen, onClose, onExportComplete }: ExportModalProps) {
  const { tasks, tags, people } = useTaskStore();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [isExporting, setIsExporting] = useState(false);

  const formats = [
    {
      id: 'json' as ExportFormat,
      name: 'JSON',
      description: 'Complete backup with all data',
      icon: FileJson,
      recommended: true,
    },
    {
      id: 'csv' as ExportFormat,
      name: 'CSV',
      description: 'For spreadsheets (tasks only)',
      icon: FileSpreadsheet,
      recommended: false,
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let content: string;
      let filename: string;
      let mimeType: string;
      let fileSizeBytes: number;

      if (selectedFormat === 'json') {
        content = exportAsJSON(tasks, tags, people);
        filename = generateFilename('focus-backup', 'json');
        mimeType = 'application/json';
        fileSizeBytes = new Blob([content]).size;

        downloadFile(content, filename, mimeType);

        // Log JSON export
        await dataOperationLogger.logExport({
          filename,
          fileSizeBytes,
          format: 'json',
          taskCount: tasks.length,
          tagCount: tags.length,
          peopleCount: people.length,
          success: true,
        });
      } else {
        content = exportAsCSV(tasks, tags, people);
        filename = generateFilename('focus-tasks', 'csv');
        mimeType = 'text/csv';
        fileSizeBytes = new Blob([content]).size;

        downloadFile(content, filename, mimeType);

        // Log CSV export (CSV only has tasks, no tags/people)
        await dataOperationLogger.logExport({
          filename,
          fileSizeBytes,
          format: 'csv',
          taskCount: tasks.length,
          tagCount: 0,
          peopleCount: 0,
          success: true,
        });
      }

      toast.success(`Exported ${tasks.length} tasks successfully!`);
      onExportComplete?.();
      onClose();
    } catch (error) {
      // Log failed export
      const filename = selectedFormat === 'json'
        ? generateFilename('focus-backup', 'json')
        : generateFilename('focus-tasks', 'csv');

      await dataOperationLogger.logExport({
        filename,
        fileSizeBytes: 0,
        format: selectedFormat,
        taskCount: tasks.length,
        tagCount: selectedFormat === 'json' ? tags.length : 0,
        peopleCount: selectedFormat === 'json' ? people.length : 0,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      toast.error('Failed to export data');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Download size={24} className="text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Export Data</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Download your tasks, tags, and people
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {tasks.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tasks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tags.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tags</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{people.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">People</div>
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Export Format
          </label>
          <div className="space-y-2">
            {formats.map((format) => {
              const Icon = format.icon;
              return (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon
                    size={24}
                    className={
                      selectedFormat === format.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400'
                    }
                  />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {format.name}
                      </span>
                      {format.recommended && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format.description}
                    </p>
                  </div>
                  {selectedFormat === format.id && (
                    <Check size={20} className="text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        {selectedFormat === 'json' && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 JSON exports include all your data and can be imported back to restore everything.
            </p>
          </div>
        )}

        {selectedFormat === 'csv' && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              ⚠️ CSV exports only include tasks (no tags or time entries). Use JSON for full
              backups.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Download size={18} />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
