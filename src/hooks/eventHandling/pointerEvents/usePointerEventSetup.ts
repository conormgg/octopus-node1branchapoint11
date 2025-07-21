
import { useEffect } from 'react';

interface UsePointerEventSetupProps {
  containerRef: React.RefObject<HTMLDivElement>;
  shouldUsePointerEvents: boolean;
  handlers: {
    handlePointerDownEvent: (e: PointerEvent) => void;
    handlePointerMoveEvent: (e: PointerEvent) => void;
    handlePointerUpEvent: (e: PointerEvent) => void;
    handlePointerLeaveEvent: (e: PointerEvent) => void;
    handleContextMenu: (e: Event) => void;
  };
}

export const usePointerEventSetup = ({
  containerRef,
  shouldUsePointerEvents,
  handlers
}: UsePointerEventSetupProps) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const {
      handlePointerDownEvent,
      handlePointerMoveEvent,
      handlePointerUpEvent,
      handlePointerLeaveEvent,
      handleContextMenu
    } = handlers;

    // Enhanced event listener options for better touch isolation
    const eventOptions = { passive: false, capture: true };

    if (shouldUsePointerEvents) {
      container.addEventListener('pointerdown', handlePointerDownEvent, eventOptions);
      container.addEventListener('pointermove', handlePointerMoveEvent, eventOptions);
      container.addEventListener('pointerup', handlePointerUpEvent, eventOptions);
      container.addEventListener('pointerleave', handlePointerLeaveEvent, eventOptions);
      container.addEventListener('pointercancel', handlePointerUpEvent, eventOptions);
      
      // Add touch event listeners with aggressive prevention
      container.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, eventOptions);
      
      container.addEventListener('touchmove', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, eventOptions);
      
      container.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, eventOptions);
    }
    
    container.addEventListener('contextmenu', handleContextMenu, eventOptions);

    // Always set comprehensive touch-action and user-select prevention
    container.style.touchAction = shouldUsePointerEvents ? 'none' : 'manipulation';
    container.style.webkitUserSelect = 'none';
    container.style.userSelect = 'none';
    (container.style as any).webkitTouchCallout = 'none';

    return () => {
      if (shouldUsePointerEvents) {
        container.removeEventListener('pointerdown', handlePointerDownEvent, eventOptions);
        container.removeEventListener('pointermove', handlePointerMoveEvent, eventOptions);
        container.removeEventListener('pointerup', handlePointerUpEvent, eventOptions);
        container.removeEventListener('pointerleave', handlePointerLeaveEvent, eventOptions);
        container.removeEventListener('pointercancel', handlePointerUpEvent, eventOptions);
        
        container.removeEventListener('touchstart', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, eventOptions);
        
        container.removeEventListener('touchmove', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, eventOptions);
        
        container.removeEventListener('touchend', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, eventOptions);
      }
      container.removeEventListener('contextmenu', handleContextMenu, eventOptions);
      container.style.touchAction = '';
      container.style.webkitUserSelect = '';
      container.style.userSelect = '';
      (container.style as any).webkitTouchCallout = '';
    };
  }, [containerRef, shouldUsePointerEvents, handlers]);
};
