import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName);

      for (const shortcut of shortcuts) {
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        // On Mac, treat Cmd as Ctrl
        const modifierMatch = (shortcut.ctrl || shortcut.meta)
          ? (event.ctrlKey || event.metaKey)
          : true;

        if (keyMatch && modifierMatch && shiftMatch) {
          // Don't trigger shortcuts in input fields (except for Escape and specific ones)
          // Allow space shortcuts with modifiers (Ctrl+Space, Ctrl+Shift+Space)
          const isSpaceWithModifier = event.key === ' ' && (event.ctrlKey || event.metaKey);
          if (isInput && event.key !== 'Escape' && event.key !== 'k' && !isSpaceWithModifier) continue;

          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Get the display text for a keyboard shortcut
 */
export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];

  if (shortcut.ctrl || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}
