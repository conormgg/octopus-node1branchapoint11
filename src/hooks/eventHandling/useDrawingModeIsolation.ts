
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
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DRAWING_SEQUENCE_GRACE_PERIOD = 100; // ms
  const LONG_PRESS_DELAY = 300; // ms

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

    const preventLongPress = (e: TouchEvent) => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
      
      longPressTimeoutRef.current = setTimeout(() => {
        // Cancel the touch event to prevent long press
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }, LONG_PRESS_DELAY);
    };

    const clearLongPressTimeout = () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    };

    const handleWindowTouch = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      
      // Always allow UI interactions
      if (isUIElement(target)) {
        return;
      }
      
      // Within canvas area during drawing - apply strict control
      if (isWithinCanvas(target)) {
        if (shouldBlock) {
          // Prevent long press and magnifier for drawing tools
          preventLongPress(e);
          
          // Set strict touch-action on the canvas element
          const canvas = document.querySelector('[data-whiteboard-canvas]') as HTMLElement;
          if (canvas) {
            canvas.style.touchAction = 'none';
            canvas.style.webkitUserSelect = 'none';
            (canvas.style as any).webkitTouchCallout = 'none';
          }
        }
        return;
      }
      
      // Block background interactions more aggressively during drawing
      if (shouldBlock || isInDrawingSequence()) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    const handleWindowTouchEnd = (e: TouchEvent) => {
      clearLongPressTimeout();
      
      const target = e.target as HTMLElement;
      
      // Always allow UI interactions
      if (isUIElement(target)) {
        return;
      }
      
      // Restore touch-action when drawing ends
      if (!shouldBlock) {
        const canvas = document.querySelector('[data-whiteboard-canvas]') as HTMLElement;
        if (canvas) {
          canvas.style.touchAction = 'manipulation';
        }
      }
      
      // Block background interactions
      if (shouldBlock || isInDrawingSequence()) {
        if (!isWithinCanvas(target)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }
    };

    const handleWindowPointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      
      // Always allow UI interactions
      if (isUIElement(target)) {
        return;
      }
      
      // Special handling for touch pointers (finger input)
      if (e.pointerType === 'touch') {
        if (isWithinCanvas(target) && shouldBlock) {
          // Prevent magnifier and text selection for touch input
          e.preventDefault();
          return;
        }
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
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    const handleWindowSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Always allow UI text selection
      if (isUIElement(target)) {
        return;
      }
      
      // Block text selection during drawing
      if (shouldBlock || isInDrawingSequence()) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    if (shouldBlock) {
      // Add adaptive event blocking with enhanced touch handling
      window.addEventListener('touchstart', handleWindowTouch, { passive: false, capture: true });
      window.addEventListener('touchmove', handleWindowTouch, { passive: false, capture: true });
      window.addEventListener('touchend', handleWindowTouchEnd, { passive: false, capture: true });
      window.addEventListener('pointerdown', handleWindowPointer, { passive: false, capture: true });
      window.addEventListener('pointermove', handleWindowPointer, { passive: false, capture: true });
      window.addEventListener('pointerup', handleWindowPointer, { passive: false, capture: true });
      window.addEventListener('contextmenu', handleWindowContextMenu, { passive: false, capture: true });
      window.addEventListener('selectstart', handleWindowSelectStart, { passive: false, capture: true });
    }

    return () => {
      clearLongPressTimeout();
      
      if (shouldBlock) {
        window.removeEventListener('touchstart', handleWindowTouch, { passive: false, capture: true } as any);
        window.removeEventListener('touchmove', handleWindowTouch, { passive: false, capture: true } as any);
        window.removeEventListener('touchend', handleWindowTouchEnd, { passive: false, capture: true } as any);
        window.removeEventListener('pointerdown', handleWindowPointer, { passive: false, capture: true } as any);
        window.removeEventListener('pointermove', handleWindowPointer, { passive: false, capture: true } as any);
        window.removeEventListener('pointerup', handleWindowPointer, { passive: false, capture: true } as any);
        window.removeEventListener('contextmenu', handleWindowContextMenu, { passive: false, capture: true } as any);
        window.removeEventListener('selectstart', handleWindowSelectStart, { passive: false, capture: true } as any);
      }
    };
  }, [isDrawing, currentTool]);
};
