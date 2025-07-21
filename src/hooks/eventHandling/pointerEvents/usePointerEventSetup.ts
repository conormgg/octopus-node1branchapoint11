
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

    // Use proper EventListenerOptions type
    const eventOptions: AddEventListenerOptions = { passive: false };

    if (shouldUsePointerEvents) {
      container.addEventListener('pointerdown', handlePointerDownEvent, eventOptions);
      container.addEventListener('pointermove', handlePointerMoveEvent, eventOptions);
      container.addEventListener('pointerup', handlePointerUpEvent, eventOptions);
      container.addEventListener('pointerleave', handlePointerLeaveEvent, eventOptions);
      container.addEventListener('pointercancel', handlePointerUpEvent, eventOptions);
    }
    
    container.addEventListener('contextmenu', handleContextMenu, eventOptions);

    // Set appropriate touch-action based on use case
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
      }
      container.removeEventListener('contextmenu', handleContextMenu, eventOptions);
      container.style.touchAction = '';
      container.style.webkitUserSelect = '';
      container.style.userSelect = '';
      (container.style as any).webkitTouchCallout = '';
    };
  }, [containerRef, shouldUsePointerEvents, handlers]);
};
