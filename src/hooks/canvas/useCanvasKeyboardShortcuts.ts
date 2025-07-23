
import { useEffect } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

interface UseCanvasKeyboardShortcutsProps {
  containerRef: React.RefObject<HTMLDivElement>;
  currentTool: string;
  isReadOnly: boolean;
  selection?: any;
  onDeleteSelected?: () => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
}

export const useCanvasKeyboardShortcuts = ({
  containerRef,
  currentTool,
  isReadOnly,
  selection,
  onDeleteSelected,
  onSelectAll,
  onClearSelection
}: UseCanvasKeyboardShortcutsProps) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isReadOnly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      debugLog('Keyboard', 'Key down', { key: e.key, tool: currentTool });

      // Delete selected objects
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (currentTool === 'select' && selection?.selectionState?.selectedObjects?.length > 0) {
          e.preventDefault();
          onDeleteSelected?.();
        }
      }

      // Select all
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        if (currentTool === 'select') {
          e.preventDefault();
          onSelectAll?.();
        }
      }

      // Clear selection
      if (e.key === 'Escape') {
        if (currentTool === 'select') {
          e.preventDefault();
          onClearSelection?.();
        }
      }
    };

    // Make container focusable and focus it
    container.tabIndex = 0;
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, currentTool, isReadOnly, selection, onDeleteSelected, onSelectAll, onClearSelection]);
};
