
import { useCallback, useEffect } from 'react';
import { OriginalTemplateData } from './types';

interface UseTemplateKeyboardShortcutsProps {
  originalTemplateData: OriginalTemplateData | null;
  isClearedTemplate: boolean;
  handleClearTemplate: () => void;
}

export const useTemplateKeyboardShortcuts = ({
  originalTemplateData,
  isClearedTemplate,
  handleClearTemplate,
}: UseTemplateKeyboardShortcutsProps) => {
  // Keyboard shortcut handler
  const handleKeyboardShortcut = useCallback((event: KeyboardEvent) => {
    // Ctrl/Cmd + Shift + C to clear template
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
      if (originalTemplateData && !isClearedTemplate) {
        event.preventDefault();
        handleClearTemplate();
      }
    }
  }, [originalTemplateData, isClearedTemplate, handleClearTemplate]);

  // Register keyboard shortcut
  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, [handleKeyboardShortcut]);
};
