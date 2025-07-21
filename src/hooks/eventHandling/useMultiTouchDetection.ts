
import { useCallback, useRef } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('touchEvents');

export const useMultiTouchDetection = () => {
  const activePointersRef = useRef<Set<number>>(new Set());
  const activeTouchesRef = useRef<number>(0);

  const addPointer = useCallback((pointerId: number) => {
    activePointersRef.current.add(pointerId);
    debugLog('MultiTouchDetection', 'Added pointer', {
      pointerId,
      totalPointers: activePointersRef.current.size
    });
  }, []);

  const removePointer = useCallback((pointerId: number) => {
    activePointersRef.current.delete(pointerId);
    debugLog('MultiTouchDetection', 'Removed pointer', {
      pointerId,
      totalPointers: activePointersRef.current.size
    });
  }, []);

  const setActiveTouches = useCallback((count: number) => {
    activeTouchesRef.current = count;
    debugLog('MultiTouchDetection', 'Set active touches', {
      count
    });
  }, []);

  const isMultiTouch = useCallback(() => {
    const multiPointer = activePointersRef.current.size >= 2;
    const multiTouch = activeTouchesRef.current >= 2;
    const result = multiPointer || multiTouch;
    
    debugLog('MultiTouchDetection', 'Multi-touch check', {
      activePointers: activePointersRef.current.size,
      activeTouches: activeTouchesRef.current,
      multiPointer,
      multiTouch,
      result
    });
    
    return result;
  }, []);

  const reset = useCallback(() => {
    activePointersRef.current.clear();
    activeTouchesRef.current = 0;
    debugLog('MultiTouchDetection', 'Reset all gesture state');
  }, []);

  return {
    addPointer,
    removePointer,
    setActiveTouches,
    isMultiTouch,
    reset,
    getActivePointerCount: () => activePointersRef.current.size,
    getActiveTouchCount: () => activeTouchesRef.current
  };
};
