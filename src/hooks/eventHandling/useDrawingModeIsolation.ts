
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
        // Only prevent if the touch is not within the canvas area
        const target = e.target as HTMLElement;
        const canvasContainer = document.querySelector('[data-whiteboard-canvas]');
        
        if (canvasContainer && !canvasContainer.contains(target)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    const handleWindowPointer = (e: PointerEvent) => {
      if (shouldBlock) {
        // Only prevent if the pointer is not within the canvas area
        const target = e.target as HTMLElement;
        const canvasContainer = document.querySelector('[data-whiteboard-canvas]');
        
        if (canvasContainer && !canvasContainer.contains(target)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    if (shouldBlock) {
      // Add window-level event blocking
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
