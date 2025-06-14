
import { useRef } from 'react';

export const usePointerEventDetection = () => {
  // Feature detection for pointer events
  const supportsPointerEvents = useRef<boolean>(
    typeof window !== 'undefined' && 
    window.PointerEvent && 
    'onpointerdown' in window
  );

  return { supportsPointerEvents: supportsPointerEvents.current };
};
