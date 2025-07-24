
import { useEffect } from 'react';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';

interface UseKonvaKeyboardHandlersProps {
  containerRef: React.RefObject<HTMLDivElement>;
  whiteboardState: ReturnType<typeof useWhiteboardState>;
  isReadOnly: boolean;
}

export const useKonvaKeyboardHandlers = ({
  containerRef,
  whiteboardState,
  isReadOnly
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
        console.log('Delete key pressed - delete system will be reimplemented');
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
    container.setAttribute('tabIndex', '1000');
    container.setAttribute('id', `whiteboard-container`);
    container.style.outline = 'none';
    
    container.addEventListener('paste', pasteHandler);
    container.addEventListener('keydown', keyDownHandler);
    container.addEventListener('click', clickHandler);

    return () => {
      container.removeEventListener('paste', pasteHandler);
      container.removeEventListener('keydown', keyDownHandler);
      container.removeEventListener('click', clickHandler);
    };
  }, [handlePaste, isReadOnly, state.currentTool, whiteboardState]);
};
