
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

  useEffect(() => {
    const shouldBlock = isDrawing && (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser');
    
    if (shouldBlock === blockingActiveRef.current) return;
    blockingActiveRef.current = shouldBlock;

    const handleWindowTouch = (e: TouchEvent) => {
      if (shouldBlock) {
        const target = e.target as HTMLElement;
        const whiteboardUI = document.querySelector('[data-whiteboard-ui]');
        
        // Only prevent events that are completely outside the whiteboard UI
        if (whiteboardUI && !whiteboardUI.contains(target)) {
          // Check if target is a legitimate UI element that should be interactive
          const isUIElement = target.closest('[data-ui-interactive]') || 
                             target.closest('button') || 
                             target.closest('[role="button"]') ||
                             target.closest('[role="dialog"]') ||
                             target.closest('[role="menu"]');
          
          if (!isUIElement) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    const handleWindowPointer = (e: PointerEvent) => {
      if (shouldBlock) {
        const target = e.target as HTMLElement;
        const whiteboardUI = document.querySelector('[data-whiteboard-ui]');
        
        // Only prevent events that are completely outside the whiteboard UI
        if (whiteboardUI && !whiteboardUI.contains(target)) {
          // Check if target is a legitimate UI element that should be interactive
          const isUIElement = target.closest('[data-ui-interactive]') || 
                             target.closest('button') || 
                             target.closest('[role="button"]') ||
                             target.closest('[role="dialog"]') ||
                             target.closest('[role="menu"]');
          
          if (!isUIElement) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    if (shouldBlock) {
      // Add window-level event blocking with lighter touch
      window.addEventListener('touchstart', handleWindowTouch, { passive: false, capture: true });
      window.addEventListener('touchmove', handleWindowTouch, { passive: false, capture: true });
      window.addEventListener('touchend', handleWindowTouch, { passive: false, capture: true });
      window.addEventListener('pointerdown', handleWindowPointer, { passive: false, capture: true });
      window.addEventListener('pointermove', handleWindowPointer, { passive: false, capture: true });
      window.addEventListener('pointerup', handleWindowPointer, { passive: false, capture: true });
    }

    return () => {
      if (shouldBlock) {
        window.removeEventListener('touchstart', handleWindowTouch, { passive: false, capture: true } as any);
        window.removeEventListener('touchmove', handleWindowTouch, { passive: false, capture: true } as any);
        window.removeEventListener('touchend', handleWindowTouch, { passive: false, capture: true } as any);
        window.removeEventListener('pointerdown', handleWindowPointer, { passive: false, capture: true } as any);
        window.removeEventListener('pointermove', handleWindowPointer, { passive: false, capture: true } as any);
        window.removeEventListener('pointerup', handleWindowPointer, { passive: false, capture: true } as any);
      }
    };
  }, [isDrawing, currentTool]);
};
