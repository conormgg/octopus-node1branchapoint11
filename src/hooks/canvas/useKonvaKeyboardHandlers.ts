
import { useEffect } from 'react';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';

interface UseKonvaKeyboardHandlersProps {
  containerRef: React.RefObject<HTMLDivElement>;
  whiteboardState: ReturnType<typeof useWhiteboardState>;
  isReadOnly: boolean;
  whiteboardId?: string;
  select2DeleteFunction?: undefined; // Removed - will be replaced
  originalSelectDeleteFunction?: undefined; // Removed - will be replaced
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
  select2Handlers
}: UseKonvaKeyboardHandlersProps) => {
  const { state, handlePaste } = whiteboardState;

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

      // Delete key - will be replaced with new delete system
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        console.log(`[${whiteboardId}] Delete key pressed - delete system will be reimplemented`);
        e.preventDefault();
        return;
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
  }, [handlePaste, isReadOnly, whiteboardId, state.currentTool, whiteboardState, select2Handlers]);
};
