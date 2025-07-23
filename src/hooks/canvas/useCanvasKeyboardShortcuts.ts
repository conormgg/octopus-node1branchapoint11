
import { useEffect } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

interface UseCanvasKeyboardShortcutsProps {
  containerRef: React.RefObject<HTMLDivElement>;
  currentTool: string;
  isReadOnly: boolean;
  selection: any;
  selectHandlers: any;
  lines: any[];
  images: any[];
}

export const useCanvasKeyboardShortcuts = ({
  containerRef,
  currentTool,
  isReadOnly,
  selection,
  selectHandlers,
  lines,
  images
}: UseCanvasKeyboardShortcutsProps) => {
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isReadOnly) return;

      debugLog('KeyboardShortcuts', 'Key down', { key: e.key, tool: currentTool });

      // Delete selected objects
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (currentTool === 'select' && selection?.selectionState?.selectedObjects?.length > 0) {
          e.preventDefault();
          selectHandlers.deleteSelectedObjects();
        }
      }

      // Select all
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        if (currentTool === 'select') {
          e.preventDefault();
          if (selection?.selectAll) {
            selection.selectAll(lines, images);
          }
        }
      }

      // Clear selection
      if (e.key === 'Escape') {
        if (currentTool === 'select') {
          e.preventDefault();
          selectHandlers.clearSelection();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, currentTool, isReadOnly, selection, selectHandlers, lines, images]);
};
