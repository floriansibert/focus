import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface QuickAddSubtaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string) => void;
  parentTaskTitle?: string;
}

export function QuickAddSubtaskModal({
  isOpen,
  onClose,
  onAdd,
  parentTaskTitle,
}: QuickAddSubtaskModalProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;

    onAdd(title.trim());
    setTitle('');
  };

  const handleClose = () => {
    setTitle('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Subtask">
      <div className="space-y-4">
        {parentTaskTitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Adding subtask to: <span className="font-medium">{parentTaskTitle}</span>
          </p>
        )}

        <div>
          <label
            htmlFor="subtask-title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Subtask Title
          </label>
          <Input
            id="subtask-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter subtask title..."
            autoFocus
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Add Subtask
          </Button>
        </div>
      </div>
    </Modal>
  );
}
