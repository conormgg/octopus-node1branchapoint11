
/**
 * @fileoverview Performance timer operations
 * @description High-resolution timing for performance measurement
 */

import { useRef, useCallback } from 'react';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

/**
 * @function debugLog
 * @description Timer-specific debug logging
 */
const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[PerformanceTimers:${context}] ${action}`, data || '');
  }
};

/**
 * @hook usePerformanceTimers
 * @description High-resolution timing operations for performance measurement
 */
export const usePerformanceTimers = () => {
  const timersRef = useRef<Map<string, number>>(new Map());

  /**
   * @function startTimer
   * @description Start timing an operation
   * @param operationId - Unique identifier for the operation
   */
  const startTimer = useCallback((operationId: string) => {
    timersRef.current.set(operationId, performance.now());
    debugLog('Timer', `Started timer for ${operationId}`);
  }, []);

  /**
   * @function endTimer
   * @description End timing an operation and return duration
   * @param operationId - Unique identifier for the operation
   * @returns Duration in milliseconds
   */
  const endTimer = useCallback((operationId: string): number => {
    const startTime = timersRef.current.get(operationId);
    if (!startTime) {
      debugLog('Timer', `Timer not found for ${operationId}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    timersRef.current.delete(operationId);
    debugLog('Timer', `Ended timer for ${operationId}`, { duration: `${duration.toFixed(2)}ms` });
    return duration;
  }, []);

  /**
   * @function hasTimer
   * @description Check if a timer exists for an operation
   * @param operationId - Unique identifier for the operation
   * @returns Whether the timer exists
   */
  const hasTimer = useCallback((operationId: string): boolean => {
    return timersRef.current.has(operationId);
  }, []);

  /**
   * @function clearTimer
   * @description Clear a timer without getting duration
   * @param operationId - Unique identifier for the operation
   */
  const clearTimer = useCallback((operationId: string) => {
    timersRef.current.delete(operationId);
    debugLog('Timer', `Cleared timer for ${operationId}`);
  }, []);

  /**
   * @function clearAllTimers
   * @description Clear all active timers
   */
  const clearAllTimers = useCallback(() => {
    const count = timersRef.current.size;
    timersRef.current.clear();
    debugLog('Timer', `Cleared all timers`, { count });
  }, []);

  return {
    startTimer,
    endTimer,
    hasTimer,
    clearTimer,
    clearAllTimers
  };
};
