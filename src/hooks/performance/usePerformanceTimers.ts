
/**
 * @fileoverview High-resolution performance timer operations
 * @description Provides precise timing capabilities for performance measurement using the Performance API
 * 
 * @module usePerformanceTimers
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * const { startTimer, endTimer } = usePerformanceTimers();
 * 
 * // Time a drawing operation
 * startTimer('pencil-stroke-1');
 * // ... perform drawing ...
 * const duration = endTimer('pencil-stroke-1');
 * console.log(`Drawing took ${duration.toFixed(2)}ms`);
 * ```
 */

import { useRef, useCallback } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performanceTimers');

/**
 * @hook usePerformanceTimers
 * @description High-resolution timing operations for precise performance measurement
 * 
 * This hook provides microsecond-precision timing using the Performance API. It integrates
 * seamlessly with other performance monitoring hooks:
 * - usePerformanceMetrics: Records timing results
 * - useOperationWrappers: Automatic timing instrumentation
 * - useMonitoringIntegration: Coordinated performance tracking
 * 
 * @returns {Object} Timer management interface
 * @returns {Function} returns.startTimer - Begin timing an operation
 * @returns {Function} returns.endTimer - End timing and get duration
 * @returns {Function} returns.hasTimer - Check if timer exists
 * @returns {Function} returns.clearTimer - Remove timer without measurement
 * @returns {Function} returns.clearAllTimers - Remove all active timers
 * 
 * @example
 * ```typescript
 * // Basic operation timing
 * const timers = usePerformanceTimers();
 * 
 * timers.startTimer('my-operation');
 * await performSomeOperation();
 * const duration = timers.endTimer('my-operation');
 * 
 * console.log(`Operation completed in ${duration.toFixed(2)}ms`);
 * ```
 * 
 * @example
 * ```typescript
 * // Integration with performance metrics
 * const timers = usePerformanceTimers();
 * const metrics = usePerformanceMetrics();
 * 
 * // Coordinated timing and recording
 * timers.startTimer('drawing-operation');
 * performDrawingOperation();
 * const duration = timers.endTimer('drawing-operation');
 * metrics.recordDrawingOperation(duration);
 * ```
 * 
 * @example
 * ```typescript
 * // Multiple concurrent timers
 * const timers = usePerformanceTimers();
 * 
 * timers.startTimer('render-pass-1');
 * timers.startTimer('render-pass-2');
 * 
 * // Operations can complete in any order
 * const duration2 = timers.endTimer('render-pass-2'); // 12.3ms
 * const duration1 = timers.endTimer('render-pass-1'); // 8.7ms
 * ```
 */
export const usePerformanceTimers = () => {
  /** @internal Map storing operation IDs to their start timestamps */
  const timersRef = useRef<Map<string, number>>(new Map());

  /**
   * @function startTimer
   * @description Begins timing an operation using high-resolution performance timestamps
   * 
   * @param {string} operationId - Unique identifier for the operation being timed
   * 
   * @example
   * ```typescript
   * // Start timing a pencil drawing operation
   * startTimer('pencil-stroke-user-123');
   * 
   * // Start timing multiple operations
   * startTimer('sync-to-server');
   * startTimer('render-canvas');
   * startTimer('process-touch-events');
   * ```
   * 
   * @throws {Error} Does not throw - overwrites existing timer if operationId already exists
   */
  const startTimer = useCallback((operationId: string) => {
    timersRef.current.set(operationId, performance.now());
    debugLog('Timer', `Started timer for ${operationId}`);
  }, []);

  /**
   * @function endTimer
   * @description Ends timing an operation and returns the elapsed duration
   * 
   * @param {string} operationId - Unique identifier for the operation being timed
   * @returns {number} Duration in milliseconds (high-precision decimal)
   * 
   * @example
   * ```typescript
   * startTimer('drawing-stroke');
   * performDrawingOperation();
   * const duration = endTimer('drawing-stroke');
   * 
   * // Duration is high-precision: 15.234567ms
   * console.log(`Drawing took ${duration.toFixed(3)}ms`);
   * ```
   * 
   * @example
   * ```typescript
   * // Handle missing timers gracefully
   * const duration = endTimer('non-existent-timer'); // Returns 0
   * if (duration === 0) {
   *   console.warn('Timer was not found');
   * }
   * ```
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
   * @description Checks if a timer is currently active for the given operation
   * 
   * @param {string} operationId - Unique identifier for the operation
   * @returns {boolean} True if timer exists, false otherwise
   * 
   * @example
   * ```typescript
   * if (hasTimer('drawing-operation')) {
   *   console.log('Drawing operation is still being timed');
   * } else {
   *   startTimer('drawing-operation');
   * }
   * ```
   */
  const hasTimer = useCallback((operationId: string): boolean => {
    return timersRef.current.has(operationId);
  }, []);

  /**
   * @function clearTimer
   * @description Removes a timer without measuring duration (cleanup)
   * 
   * @param {string} operationId - Unique identifier for the operation
   * 
   * @example
   * ```typescript
   * // Start an operation but cancel it
   * startTimer('user-drawing');
   * // ... user cancels drawing ...
   * clearTimer('user-drawing'); // Clean up without measurement
   * ```
   */
  const clearTimer = useCallback((operationId: string) => {
    timersRef.current.delete(operationId);
    debugLog('Timer', `Cleared timer for ${operationId}`);
  }, []);

  /**
   * @function clearAllTimers
   * @description Removes all active timers (typically used for cleanup or reset)
   * 
   * @example
   * ```typescript
   * // Clean up on component unmount or error
   * useEffect(() => {
   *   return () => {
   *     clearAllTimers(); // Cleanup on unmount
   *   };
   * }, [clearAllTimers]);
   * ```
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
