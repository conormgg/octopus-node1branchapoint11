
import { useEffect } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

interface SpacePanHandlers {
  startSpacePan: (x: number, y: number) => void;
  continueSpacePan: (x: number, y: number) => void;
  stopSpacePan: () => void;
}

interface UseCanvasKeyboardShortcutsProps {
  containerRef?: React.RefObject<HTMLDivElement>;
  currentTool: string;
  isReadOnly: boolean;
  selection: any;
  selectHandlers: any;
  lines: any[];
  images: any[];
  spacePanHandlers?: SpacePanHandlers;
}

export const useCanvasKeyboardShortcuts = ({
  containerRef,
  currentTool,
  isReadOnly,
  selection,
  selectHandlers,
  lines,
  images,
  spacePanHandlers
}: UseCanvasKeyboardShortcutsProps) => {
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    let isSpacePressed = false;
    let wasSpacePanning = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isReadOnly) return;

      // Handle space key for panning
      if (e.code === 'Space' && !isSpacePressed) {
        isSpacePressed = true;
        wasSpacePanning = false;
        debugLog('Keyboard', 'Space key pressed');
        // Don't prevent default yet - only when actually panning
      }

      // Handle selection shortcuts
      if (currentTool === 'select' && selection) {
        // Delete key - delete selected objects
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          if (selectHandlers?.deleteSelectedObjects) {
            debugLog('Keyboard', 'Delete key pressed - deleting selected objects');
            selectHandlers.deleteSelectedObjects();
          }
        }
        
        // Ctrl+A - select all
        if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          if (selection.selectAll) {
            debugLog('Keyboard', 'Ctrl+A pressed - selecting all objects');
            selection.selectAll(lines, images);
          }
        }
        
        // Escape - clear selection
        if (e.key === 'Escape') {
          e.preventDefault();
          if (selection.clearSelection) {
            debugLog('Keyboard', 'Escape pressed - clearing selection');
            selection.clearSelection();
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isSpacePressed) {
        isSpacePressed = false;
        if (wasSpacePanning && spacePanHandlers) {
          debugLog('Keyboard', 'Space key released - stopping pan');
          spacePanHandlers.stopSpacePan();
          wasSpacePanning = false;
        }
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (isSpacePressed && e.button === 0 && spacePanHandlers) {
        e.preventDefault();
        debugLog('Keyboard', 'Space + pointer down - starting pan');
        spacePanHandlers.startSpacePan(e.clientX, e.clientY);
        wasSpacePanning = true;
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isSpacePressed && wasSpacePanning && spacePanHandlers) {
        e.preventDefault();
        spacePanHandlers.continueSpacePan(e.clientX, e.clientY);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (isSpacePressed && wasSpacePanning && e.button === 0 && spacePanHandlers) {
        e.preventDefault();
        spacePanHandlers.stopSpacePan();
        wasSpacePanning = false;
      }
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
    };
  }, [containerRef, currentTool, isReadOnly, selection, selectHandlers, lines, images, spacePanHandlers]);
};
