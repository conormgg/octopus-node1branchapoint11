
import { useCallback, useRef } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('touchEvents');

export const useMultiTouchDetection = () => {
  const activePointersRef = useRef<Map<number, string>>(new Map());
  const activeTouchesRef = useRef<number>(0);
  const lastMultiTouchCheckRef = useRef<number>(0);
  const isMultiTouchActiveRef = useRef<boolean>(false);
  const MULTI_TOUCH_DEBOUNCE = 50; // ms

  const addPointer = useCallback((pointerId: number, pointerType: string = 'unknown') => {
    activePointersRef.current.set(pointerId, pointerType);
    debugLog('MultiTouchDetection', 'Added pointer', {
      pointerId,
      pointerType,
      totalPointers: activePointersRef.current.size
    });
  }, []);

  const removePointer = useCallback((pointerId: number) => {
    const pointerType = activePointersRef.current.get(pointerId);
    activePointersRef.current.delete(pointerId);
    debugLog('MultiTouchDetection', 'Removed pointer', {
      pointerId,
      pointerType,
      totalPointers: activePointersRef.current.size
    });
    
    // Update multi-touch active state
    if (activePointersRef.current.size < 2 && activeTouchesRef.current < 2) {
      isMultiTouchActiveRef.current = false;
      debugLog('MultiTouchDetection', 'Multi-touch ended');
    }
  }, []);

  const setActiveTouches = useCallback((count: number) => {
    activeTouchesRef.current = count;
    debugLog('MultiTouchDetection', 'Set active touches', {
      count,
      wasMultiTouch: isMultiTouchActiveRef.current
    });
    
    // Update multi-touch active state
    if (count >= 2) {
      isMultiTouchActiveRef.current = true;
      debugLog('MultiTouchDetection', 'Multi-touch started via touches');
    } else if (count === 0) {
      isMultiTouchActiveRef.current = false;
      debugLog('MultiTouchDetection', 'Multi-touch ended via touches');
    }
  }, []);

  const isMultiTouch = useCallback(() => {
    const now = Date.now();
    
    // Debounce multi-touch checks to prevent rapid state changes
    if (now - lastMultiTouchCheckRef.current < MULTI_TOUCH_DEBOUNCE) {
      return isMultiTouchActiveRef.current;
    }
    
    // Count only touch pointers, exclude stylus/pen pointers
    const touchPointers = Array.from(activePointersRef.current.values())
      .filter(pointerType => pointerType === 'touch' || pointerType === 'unknown');
    
    const multiPointer = touchPointers.length >= 2;
    const multiTouch = activeTouchesRef.current >= 2;
    const result = multiPointer || multiTouch;
    
    if (result) {
      lastMultiTouchCheckRef.current = now;
      isMultiTouchActiveRef.current = true;
    }
    
    debugLog('MultiTouchDetection', 'Multi-touch check', {
      activePointers: activePointersRef.current.size,
      touchPointers: touchPointers.length,
      activeTouches: activeTouchesRef.current,
      multiPointer,
      multiTouch,
      result,
      isActive: isMultiTouchActiveRef.current
    });
    
    return result;
  }, []);

  const reset = useCallback(() => {
    activePointersRef.current.clear();
    activeTouchesRef.current = 0;
    lastMultiTouchCheckRef.current = 0;
    isMultiTouchActiveRef.current = false;
    debugLog('MultiTouchDetection', 'Reset all gesture state');
  }, []);

  const isGestureActive = useCallback(() => {
    return isMultiTouchActiveRef.current;
  }, []);

  return {
    addPointer,
    removePointer,
    setActiveTouches,
    isMultiTouch,
    isGestureActive,
    reset,
    getActivePointerCount: () => activePointersRef.current.size,
    getActiveTouchCount: () => activeTouchesRef.current
  };
};
