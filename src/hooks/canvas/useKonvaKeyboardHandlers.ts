
import { useEffect } from 'react';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';

interface UseKonvaKeyboardHandlersProps {
  containerRef: React.RefObject<HTMLDivElement>;
  whiteboardState: ReturnType<typeof useWhiteboardState>;
  isReadOnly: boolean;
  whiteboardId?: string;
  unifiedDeleteFunction?: (selectedObjects?: Array<{id: string, type: 'line' | 'image'}>) => void;
  select2Handlers?: {
    select2State: any;
    deleteSelectedObjects: () => void;
    clearSelection: () => void;
  };
}

export const useKonvaKeyboardHandlers = ({
  containerRef,
  whiteboardState,
  isReadOnly,
  whiteboardId,
  unifiedDeleteFunction,
  select2Handlers
}: UseKonvaKeyboardHandlersProps) => {
  const { state, handlePaste, selection } = whiteboardState;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isReadOnly) return;

    const pasteHandler = (e: ClipboardEvent) => {
      handlePaste(e, null);
    };

    const keyDownHandler = (e: KeyboardEvent) => {
      if (document.activeElement !== container && !container.contains(document.activeElement)) {
        return;
      }

      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        if ('undo' in whiteboardState && typeof whiteboardState.undo === 'function') {
          whiteboardState.undo();
        }
        e.preventDefault();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        if ('redo' in whiteboardState && typeof whiteboardState.redo === 'function') {
          whiteboardState.redo();
        }
        e.preventDefault();
        return;
      }

      // Ctrl+A - select all objects (only when select tool is active)
      if (e.ctrlKey && e.key === 'a' && state.currentTool === 'select' && selection?.selectAll) {
        selection.selectAll(state.lines || [], state.images || []);
        e.preventDefault();
        return;
      }

      // Escape key - clear selection
      if (e.key === 'Escape' && selection?.clearSelection) {
        selection.clearSelection();
        e.preventDefault();
      }
      
      // Delete key - remove selected objects using unified function
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        // Check if using select2 tool with active selection
        if (state.currentTool === 'select2' && select2Handlers?.select2State?.selectedObjects?.length > 0) {
          console.log(`[${whiteboardId}] Delete key pressed - select2 selected objects:`, select2Handlers.select2State.selectedObjects);
          
          if (unifiedDeleteFunction) {
            unifiedDeleteFunction(select2Handlers.select2State.selectedObjects);
          }
          
          // Clear select2 selection
          if (select2Handlers.clearSelection) {
            select2Handlers.clearSelection();
          }
        } else if (selection?.selectionState?.selectedObjects?.length > 0) {
          // Fallback to regular selection
          console.log(`[${whiteboardId}] Delete key pressed - selected objects:`, selection.selectionState.selectedObjects);
          
          if (unifiedDeleteFunction) {
            unifiedDeleteFunction(selection.selectionState.selectedObjects);
          }
        }
        
        e.preventDefault();
      }
    };

    const clickHandler = (e: MouseEvent) => {
      if (container && e.target && container.contains(e.target as Node)) {
        container.focus();
      }
    };

    // Make container focusable and add event listeners
    const tabIndexValue =
      typeof whiteboardId === 'string'
        ? String(1000 + whiteboardId.charCodeAt(0))
        : '1000';
    
    container.setAttribute('tabIndex', tabIndexValue);
    container.setAttribute('id', `whiteboard-container-${whiteboardId || 'unknown'}`);
    container.style.outline = 'none';
    
    container.addEventListener('paste', pasteHandler);
    container.addEventListener('keydown', keyDownHandler);
    container.addEventListener('click', clickHandler);

    return () => {
      container.removeEventListener('paste', pasteHandler);
      container.removeEventListener('keydown', keyDownHandler);
      container.removeEventListener('click', clickHandler);
    };
  }, [handlePaste, isReadOnly, selection, whiteboardId, state.currentTool, state.lines, state.images, whiteboardState, unifiedDeleteFunction, select2Handlers]);
};
