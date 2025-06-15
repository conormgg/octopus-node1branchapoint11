
/**
 * @fileoverview FPS tracking for render performance
 * @description Tracks frames per second for smooth canvas operations
 */

import { useRef, useCallback } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('fpsTracker');

/**
 * @hook useFpsTracker
 * @description FPS tracking for render performance monitoring
 */
export const useFpsTracker = () => {
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());

  /**
   * @function trackFrame
   * @description Track a render frame and calculate FPS
   * @returns Current FPS or null if not enough time has passed
   */
  const trackFrame = useCallback((): number | null => {
    frameCountRef.current++;
    const currentTime = performance.now();
    const timeDiff = currentTime - lastFrameTimeRef.current;

    // Calculate FPS every second
    if (timeDiff >= 1000) {
      const fps = (frameCountRef.current * 1000) / timeDiff;
      frameCountRef.current = 0;
      lastFrameTimeRef.current = currentTime;

      debugLog('FPS', 'Calculated FPS', { fps: fps.toFixed(1) });
      return fps;
    }

    return null;
  }, []);

  /**
   * @function reset
   * @description Reset FPS tracking counters
   */
  const reset = useCallback(() => {
    frameCountRef.current = 0;
    lastFrameTimeRef.current = performance.now();
    debugLog('FPS', 'Reset FPS tracking');
  }, []);

  return {
    trackFrame,
    reset
  };
};
