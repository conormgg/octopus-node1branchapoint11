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
      // Enhanced UI element detection with better dropdown and portal support
      return target.closest('[data-ui-interactive]') || 
             target.closest('button') || 
             target.closest('[role="button"]') ||
             target.closest('[role="dialog"]') ||
             target.closest('[role="menu"]') ||
             target.closest('[role="menuitem"]') ||
             target.closest('[data-dropdown-content]') ||
             target.closest('[data-color-selector-button]') ||
             target.closest('[data-radix-dropdown-menu-content]') ||
             target.closest('[data-radix-popover-content]') ||
             target.closest('[data-radix-portal]') ||
             target.closest('.radix-dropdown-menu-content') ||
             target.closest('.radix-popover-content') ||
             target.closest('.interactive-element') ||
             target.closest('[data-state="open"]') ||
             // Portal container detection
             target.closest('body > div[data-radix-portal]') ||
             target.closest('body > div[style*="z-index"]') ||
             // Slider and input detection
             target.closest('[role="slider"]') ||
             target.closest('input') ||
             target.closest('textarea') ||
             target.closest('select') ||
             // Additional dropdown patterns
             target.getAttribute('data-ui-interactive') === 'true' ||
             target.getAttribute('data-dropdown-content') === 'true' ||
             target.getAttribute('data-color-selector-button') === 'true';
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
      
      // Always allow UI interactions - this is critical for stylus
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
      
      // Refined stylus handling - less aggressive blocking for UI interactions
      if (e.pointerType === 'pen') {
        // During drawing sequence, allow stylus events within canvas
        if (isInDrawingSequence() && isWithinCanvas(target)) {
          return;
        }
        
        // Only block stylus events on true background elements (not UI)
        if (!isWithinCanvas(target) && !isUIElement(target)) {
          // Check if this is a background element we should block
          const isBackground = !target.closest('[data-ui-interactive]') && 
                             !target.closest('button') && 
                             !target.closest('[role="button"]') &&
                             !target.closest('[data-dropdown-content]') &&
                             !target.closest('[data-radix-dropdown-menu-content]') &&
                             target.tagName !== 'BUTTON' &&
                             target.tagName !== 'INPUT' &&
                             target.tagName !== 'TEXTAREA';
          
          if (isBackground) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
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
