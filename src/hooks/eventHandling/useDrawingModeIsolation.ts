
import { useEffect, useRef } from 'react';

interface UseDrawingModeIsolationProps {
  isDrawing: boolean;
  currentTool: string;
}

export const useDrawingModeIsolation = ({
  isDrawing,
  currentTool
}: UseDrawingModeIsolationProps) => {
  const blockingActiveRef = useRef(false);
  const drawingSequenceRef = useRef<number>(0);
  const DRAWING_SEQUENCE_GRACE_PERIOD = 100; // ms

  useEffect(() => {
    const shouldBlock = isDrawing && (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser');
    
    if (shouldBlock === blockingActiveRef.current) return;
    blockingActiveRef.current = shouldBlock;

    // Set drawing sequence timestamp
    if (shouldBlock) {
      drawingSequenceRef.current = Date.now();
    }

    const isInDrawingSequence = () => {
      return Date.now() - drawingSequenceRef.current < DRAWING_SEQUENCE_GRACE_PERIOD;
    };

    const isWithinCanvas = (target: HTMLElement) => {
      const canvasArea = document.querySelector('[data-whiteboard-canvas]');
      return canvasArea && canvasArea.contains(target);
    };

    const isUIElement = (target: HTMLElement) => {
      return target.closest('[data-ui-interactive]') || 
             target.closest('button') || 
             target.closest('[role="button"]') ||
             target.closest('[role="dialog"]') ||
             target.closest('[role="menu"]') ||
             target.closest('.interactive-element');
    };

    const handleWindowTouch = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Always allow UI interactions
      if (isUIElement(target)) {
        return;
      }
      
      // During drawing sequence, be less aggressive within canvas
      if (isInDrawingSequence() && isWithinCanvas(target)) {
        return;
      }
      
      // Block background interactions during drawing
      if (shouldBlock && !isWithinCanvas(target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleWindowPointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      
      // Always allow UI interactions
      if (isUIElement(target)) {
        return;
      }
      
      // Special handling for stylus - prioritize drawing flow
      if (e.pointerType === 'pen') {
        // During drawing sequence, allow stylus events within canvas
        if (isInDrawingSequence() && isWithinCanvas(target)) {
          return;
        }
        
        // Block stylus events outside canvas more aggressively
        if (!isWithinCanvas(target)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return;
        }
      }
      
      // Standard blocking for other pointer types
      if (shouldBlock && !isWithinCanvas(target)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleWindowContextMenu = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Always allow UI context menus
      if (isUIElement(target)) {
        return;
      }
      
      // Block context menus during drawing or drawing sequence
      if (shouldBlock || isInDrawingSequence()) {
        if (!isWithinCanvas(target)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }
    };

    if (shouldBlock) {
      // Add adaptive event blocking
      window.addEventListener('touchstart', handleWindowTouch, { passive: false, capture: true });
      window.addEventListener('touchmove', handleWindowTouch, { passive: false, capture: true });
      window.addEventListener('touchend', handleWindowTouch, { passive: false, capture: true });
      window.addEventListener('pointerdown', handleWindowPointer, { passive: false, capture: true });
      window.addEventListener('pointermove', handleWindowPointer, { passive: false, capture: true });
      window.addEventListener('pointerup', handleWindowPointer, { passive: false, capture: true });
      window.addEventListener('contextmenu', handleWindowContextMenu, { passive: false, capture: true });
    }

    return () => {
      if (shouldBlock) {
        window.removeEventListener('touchstart', handleWindowTouch, { passive: false, capture: true } as any);
        window.removeEventListener('touchmove', handleWindowTouch, { passive: false, capture: true } as any);
        window.removeEventListener('touchend', handleWindowTouch, { passive: false, capture: true } as any);
        window.removeEventListener('pointerdown', handleWindowPointer, { passive: false, capture: true } as any);
        window.removeEventListener('pointermove', handleWindowPointer, { passive: false, capture: true } as any);
        window.removeEventListener('pointerup', handleWindowPointer, { passive: false, capture: true } as any);
        window.removeEventListener('contextmenu', handleWindowContextMenu, { passive: false, capture: true } as any);
      }
    };
  }, [isDrawing, currentTool]);
};
