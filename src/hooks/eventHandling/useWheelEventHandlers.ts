
import { useEffect } from 'react';

interface UseWheelEventHandlersProps {
  containerRef: React.RefObject<HTMLDivElement>;
  panZoom: {
    handleWheel: (e: WheelEvent) => void;
  };
}

export const useWheelEventHandlers = ({
  containerRef,
  panZoom
}: UseWheelEventHandlersProps) => {
  // Wheel event for zoom - always works regardless of read-only status
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', panZoom.handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', panZoom.handleWheel);
    };
  }, [panZoom.handleWheel]);
};
