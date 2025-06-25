
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

    if (shouldUsePointerEvents) {
      container.addEventListener('pointerdown', handlePointerDownEvent);
      container.addEventListener('pointermove', handlePointerMoveEvent);
      container.addEventListener('pointerup', handlePointerUpEvent);
      container.addEventListener('pointerleave', handlePointerLeaveEvent);
      container.addEventListener('pointercancel', handlePointerUpEvent);
    }
    
    container.addEventListener('contextmenu', handleContextMenu);

    // Always set touch-action to none when using pointer events for better control
    container.style.touchAction = shouldUsePointerEvents ? 'none' : 'manipulation';

    return () => {
      if (shouldUsePointerEvents) {
        container.removeEventListener('pointerdown', handlePointerDownEvent);
        container.removeEventListener('pointermove', handlePointerMoveEvent);
        container.removeEventListener('pointerup', handlePointerUpEvent);
        container.removeEventListener('pointerleave', handlePointerLeaveEvent);
        container.removeEventListener('pointercancel', handlePointerUpEvent);
      }
      container.removeEventListener('contextmenu', handleContextMenu);
      container.style.touchAction = '';
    };
  }, [containerRef, shouldUsePointerEvents, handlers]);
};
