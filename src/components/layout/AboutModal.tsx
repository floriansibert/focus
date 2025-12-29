import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Info, Calendar, GitBranch, User } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();
  const author = typeof __APP_AUTHOR__ !== 'undefined' ? __APP_AUTHOR__ : 'Unknown';

  const formatBuildTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="About Focus"
      size="sm"
      footer={
        <Button onClick={onClose} variant="primary">
          Close
        </Button>
      }
    >
      <div className="space-y-6">
        {/* App Icon/Logo */}
        <div className="flex items-center justify-center">
          <svg
            className="w-20 h-20"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Q1: Urgent & Important (top-left, red) */}
            <rect x="2" y="2" width="12" height="12" rx="2" className="fill-red-500 dark:fill-red-400" />

            {/* Q2: Not Urgent & Important (top-right, blue) */}
            <rect x="18" y="2" width="12" height="12" rx="2" className="fill-blue-500 dark:fill-blue-400" />

            {/* Q3: Urgent & Not Important (bottom-left, amber) */}
            <rect x="2" y="18" width="12" height="12" rx="2" className="fill-amber-500 dark:fill-amber-400" />

            {/* Q4: Not Urgent & Not Important (bottom-right, gray) */}
            <rect x="18" y="18" width="12" height="12" rx="2" className="fill-gray-400 dark:fill-gray-500" />
          </svg>
        </div>

        {/* App Name */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Focus
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Eisenhower Priority Matrix
          </p>
        </div>

        {/* Version Info */}
        <div className="space-y-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <GitBranch size={16} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Version</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {version}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Calendar size={16} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Build Time</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatBuildTime(buildTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <User size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Author</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {author}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>
            Organize your tasks using the Eisenhower Matrix to focus on what truly matters.
          </p>
          <p className="flex items-center justify-center gap-1 text-xs">
            <Info size={12} />
            All data is stored locally in your browser
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p>Built with React, TypeScript & Vite</p>
        </div>
      </div>
    </Modal>
  );
}
