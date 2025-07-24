
import { useEffect } from 'react';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';

interface UseKonvaKeyboardHandlersProps {
  containerRef: React.RefObject<HTMLDivElement>;
  whiteboardState: ReturnType<typeof useWhiteboardState>;
  isReadOnly: boolean;
  whiteboardId?: string;
  select2DeleteFunction?: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  originalSelectDeleteFunction?: () => void;
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
  select2DeleteFunction,
  originalSelectDeleteFunction,
  select2Handlers
}: UseKonvaKeyboardHandlersProps) => {
  const { state, handlePaste } = whiteboardState; // selection now handled by select2 system

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
      // Ctrl+A functionality now handled by select2 system

      // Escape key - clear selection now handled by select2 system
      
      // Delete key - remove selected objects
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        // Check if using select2 tool
        if (state.currentTool === 'select' && select2Handlers?.select2State?.selectedObjects?.length > 0) {
          console.log(`[${whiteboardId}] Delete key pressed - select2 selected objects:`, select2Handlers.select2State.selectedObjects);
          
          // Use the select2 delete function (accepts parameters)
          if (select2DeleteFunction) {
            select2DeleteFunction(select2Handlers.select2State.selectedObjects);
          }
          
          // Clear select2 selection
          if (select2Handlers.clearSelection) {
            select2Handlers.clearSelection();
          }
          
          e.preventDefault();
          return;
        }
        
        // Original selection system no longer used
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
  }, [handlePaste, isReadOnly, whiteboardId, state.currentTool, state.lines, state.images, whiteboardState, select2DeleteFunction, originalSelectDeleteFunction, select2Handlers]);
};
