import { useState, useRef } from 'react';
import { Upload, FileJson, AlertCircle, CheckCircle, Merge, RefreshCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useTaskStore } from '../../store/taskStore';
import { importFromJSON, readFileAsText, mergeData } from '../../lib/import';
import { dataOperationLogger } from '../../lib/dataOperationLogger';
import { db } from '../../lib/db';
import toast from 'react-hot-toast';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportMode = 'merge' | 'replace';

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { tasks, tags, people, setTasks, setTags, setPeople } = useTaskStore();
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{
    tasks: number;
    tags: number;
    people: number;
    warnings?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewData(null);

    try {
      const content = await readFileAsText(file);
      const result = importFromJSON(content);

      if (!result.success) {
        toast.error(result.error || 'Failed to parse file');
        setSelectedFile(null);
        return;
      }

      setPreviewData({
        tasks: result.tasks?.length || 0,
        tags: result.tags?.length || 0,
        people: result.people?.length || 0,
        warnings: result.warnings,
      });
    } catch {
      toast.error('Failed to read file');
      setSelectedFile(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);

    try {
      const content = await readFileAsText(selectedFile);
      const result = importFromJSON(content);

      if (!result.success || !result.tasks || !result.tags) {
        // Log failed import
        await dataOperationLogger.logImport({
          filename: selectedFile.name,
          fileSizeBytes: selectedFile.size,
          taskCount: 0,
          tagCount: 0,
          peopleCount: 0,
          importMode,
          success: false,
          errorMessage: result.error || 'Failed to import data',
        });

        toast.error(result.error || 'Failed to import data');
        return;
      }

      const importedPeople = result.people || [];

      if (importMode === 'merge') {
        const merged = mergeData({ tasks, tags, people }, { tasks: result.tasks, tags: result.tags, people: importedPeople });
        setTasks(merged.tasks);
        setTags(merged.tags);
        setPeople(merged.people);
        toast.success(`Merged ${result.tasks.length} tasks, ${result.tags.length} tags, and ${importedPeople.length} people!`);
      } else {
        setTasks(result.tasks);
        setTags(result.tags);
        setPeople(importedPeople);

        // Clear history when replacing data (old events reference deleted tasks)
        await db.history.clear();
        console.log('History cleared due to data replacement');

        toast.success(`Imported ${result.tasks.length} tasks, ${result.tags.length} tags, and ${importedPeople.length} people!`);
      }

      // Log successful import
      await dataOperationLogger.logImport({
        filename: selectedFile.name,
        fileSizeBytes: selectedFile.size,
        taskCount: result.tasks.length,
        tagCount: result.tags.length,
        peopleCount: importedPeople.length,
        importMode,
        success: true,
      });

      if (result.warnings && result.warnings.length > 0) {
        toast(
          `Import completed with ${result.warnings.length} warning(s). Check console for details.`,
          { icon: '⚠️' }
        );
        console.warn('Import warnings:', result.warnings);
      }

      onClose();
    } catch (error) {
      // Log failed import
      await dataOperationLogger.logImport({
        filename: selectedFile.name,
        fileSizeBytes: selectedFile.size,
        taskCount: 0,
        tagCount: 0,
        peopleCount: 0,
        importMode,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      toast.error('Failed to import data');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Upload size={24} className="text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Import Data</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Restore from a previous backup
            </p>
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select File
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="import-file"
              />
              <label
                htmlFor="import-file"
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <FileJson size={20} className="text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFile ? selectedFile.name : 'Choose JSON file...'}
                </span>
              </label>
            </div>
            {selectedFile && (
              <button
                onClick={handleReset}
                className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                title="Clear selection"
              >
                <RefreshCw size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Preview */}
        {previewData && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle size={18} />
              <span className="font-medium">File validated successfully</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {previewData.tasks}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tasks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {previewData.tags}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Tags</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {previewData.people}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">People</div>
              </div>
            </div>
            {previewData.warnings && previewData.warnings.length > 0 && (
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 text-sm">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{previewData.warnings.length} warning(s) found</span>
              </div>
            )}
          </div>
        )}

        {/* Import Mode */}
        {previewData && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Import Mode
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setImportMode('merge')}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  importMode === 'merge'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Merge
                  size={24}
                  className={
                    importMode === 'merge'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400'
                  }
                />
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">Merge</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Combine with existing data (recommended)
                  </p>
                </div>
              </button>

              <button
                onClick={() => setImportMode('replace')}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                  importMode === 'replace'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <RefreshCw
                  size={24}
                  className={
                    importMode === 'replace'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400'
                  }
                />
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">Replace</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Replace all existing data
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Warning */}
        {importMode === 'replace' && previewData && (
          <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200 flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                Warning: This will delete all your current tasks, tags, and people. This action cannot be
                undone.
              </span>
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
            onClick={handleImport}
            disabled={!previewData || isImporting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            {isImporting ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
