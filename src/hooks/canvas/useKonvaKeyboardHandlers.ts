import { useCallback, useEffect } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

interface UseKonvaKeyboardHandlersProps {
  containerRef: React.RefObject<HTMLDivElement>;
  whiteboardState: any;
  isReadOnly: boolean;
  whiteboardId: string;
  select2DeleteFunction?: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  originalSelectDeleteFunction?: () => void;
  select2Handlers?: {
    select2State: any;
    deleteSelectedObjects: () => void;
    clearSelection: () => void;
  };
  unifiedSelectionHandlers?: {
    selectionState: {
      selectedObjects: Array<{id: string, type: 'line' | 'image'}>;
    };
    deleteSelectedObjects: () => void;
    clearSelection: () => void;
  };
}

export const useKonvaKeyboardHandlers = ({
  containerRef,
  whiteboardState,
  isReadOnly,
  whiteboardId,
  select2DeleteFunction,
  originalSelectDeleteFunction,
  select2Handlers,
  unifiedSelectionHandlers
}: UseKonvaKeyboardHandlersProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (isReadOnly) return;

    // Ensure the container has focus
    if (containerRef.current !== document.activeElement) {
      return;
    }

    // Prevent default action for specific keys
    if (event.key === 'Delete' || event.key === 'Backspace' || event.key === 'Escape' || (event.ctrlKey && event.key === 'a')) {
      event.preventDefault();
    }

    // Handle select2 keyboard shortcuts
    if (select2Handlers) {
      if ((event.key === 'Delete' || event.key === 'Backspace') && select2Handlers.select2State.selectedObjects.length > 0) {
        debugLog('KeyboardHandlers', 'Delete key pressed for select2');
        select2Handlers.deleteSelectedObjects();
        return;
      }

      if (event.key === 'Escape') {
        debugLog('KeyboardHandlers', 'Escape key pressed for select2');
        select2Handlers.clearSelection();
        return;
      }

      if (event.ctrlKey && event.key === 'a') {
        debugLog('KeyboardHandlers', 'Ctrl+A for select2 not implemented yet');
        // TODO: Implement select all for select2
        return;
      }

      return;
    }

    // Handle unified selection keyboard shortcuts
    if (unifiedSelectionHandlers) {
      if ((event.key === 'Delete' || event.key === 'Backspace') && 
          unifiedSelectionHandlers.selectionState.selectedObjects.length > 0) {
        event.preventDefault();
        debugLog('KeyboardHandlers', 'Delete key pressed for unified selection');
        unifiedSelectionHandlers.deleteSelectedObjects();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        debugLog('KeyboardHandlers', 'Escape key pressed for unified selection');
        unifiedSelectionHandlers.clearSelection();
        return;
      }

      if (event.ctrlKey && event.key === 'a') {
        event.preventDefault();
        debugLog('KeyboardHandlers', 'Ctrl+A for unified selection not implemented yet');
        // TODO: Implement select all for unified selection
        return;
      }

      return;
    }

    // Fallback to original selection handlers if no select2 handlers are available
    if ((event.key === 'Delete' || event.key === 'Backspace') &&
        'selection' in whiteboardState &&
        whiteboardState.selection &&
        whiteboardState.selection.getSelectedObjectIds() &&
        whiteboardState.selection.getSelectedObjectIds().length > 0) {
      debugLog('KeyboardHandlers', 'Delete key pressed for original selection');
      if (originalSelectDeleteFunction) {
        originalSelectDeleteFunction();
      }
      return;
    }

    if (event.key === 'Escape' &&
        'selection' in whiteboardState &&
        whiteboardState.selection &&
        whiteboardState.selection.clearSelection) {
      debugLog('KeyboardHandlers', 'Escape key pressed for original selection');
      whiteboardState.selection.clearSelection();
      return;
    }

    if (event.ctrlKey && event.key === 'a' &&
        'selection' in whiteboardState &&
        whiteboardState.selection &&
        whiteboardState.selection.selectAll) {
      debugLog('KeyboardHandlers', 'Ctrl+A pressed');
      whiteboardState.selection.selectAll(whiteboardState.lines, whiteboardState.images);
    }
  }, [whiteboardState, isReadOnly, whiteboardId, unifiedSelectionHandlers]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    debugLog('KeyboardHandlers', 'Adding keyboard event listener', { whiteboardId });

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      debugLog('KeyboardHandlers', 'Removing keyboard event listener', { whiteboardId });
    };
  }, [containerRef, handleKeyDown, whiteboardId]);
};
