
/**
 * @fileoverview Operation wrapper functions for performance monitoring
 * @description Provides wrapper functions that automatically instrument operations with timing
 */

import { useCallback } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performanceTimers');

interface UseOperationWrappersProps {
  isEnabled: boolean;
  generateOperationId: () => string;
  startTimer: (operationId: string) => void;
  endTimer: (operationId: string) => number | null;
  recordDrawingOperation: (duration: number) => void;
  recordSyncOperation: (duration: number) => void;
  recordRenderOperation: (duration: number, fps: number) => void;
}

/**
 * @hook useOperationWrappers
 * @description Provides wrapper functions for automatic operation instrumentation
 */
export const useOperationWrappers = ({
  isEnabled,
  generateOperationId,
  startTimer,
  endTimer,
  recordDrawingOperation,
  recordSyncOperation,
  recordRenderOperation
}: UseOperationWrappersProps) => {
  
  /**
   * @function wrapDrawingOperation
   * @description Wraps drawing operations with automatic timing and metrics recording
   */
  const wrapDrawingOperation = useCallback(<T extends (...args: any[]) => any>(
    operation: T,
    operationName: string
  ): T => {
    if (!isEnabled) {
      return operation;
    }

    return ((...args: Parameters<T>) => {
      const operationId = generateOperationId();
      debugLog('Drawing', `Starting operation: ${operationName}`, { operationId });
      
      startTimer(operationId);
      const result = operation(...args);
      const duration = endTimer(operationId);
      
      if (duration !== null) {
        recordDrawingOperation(duration);
        debugLog('Drawing', `Completed operation: ${operationName}`, { 
          operationId, 
          duration: `${duration.toFixed(2)}ms` 
        });
      }
      
      return result;
    }) as T;
  }, [isEnabled, generateOperationId, startTimer, endTimer, recordDrawingOperation]);

  /**
   * @function wrapSyncOperation
   * @description Wraps sync operations with automatic timing and metrics recording
   */
  const wrapSyncOperation = useCallback(<T extends (...args: any[]) => any>(
    operation: T,
    operationName: string
  ): T => {
    if (!isEnabled) {
      return operation;
    }

    return ((...args: Parameters<T>) => {
      const operationId = generateOperationId();
      debugLog('Sync', `Starting operation: ${operationName}`, { operationId });
      
      startTimer(operationId);
      const result = operation(...args);
      const duration = endTimer(operationId);
      
      if (duration !== null) {
        recordSyncOperation(duration);
        debugLog('Sync', `Completed operation: ${operationName}`, { 
          operationId, 
          duration: `${duration.toFixed(2)}ms` 
        });
      }
      
      return result;
    }) as T;
  }, [isEnabled, generateOperationId, startTimer, endTimer, recordSyncOperation]);

  /**
   * @function wrapRenderOperation
   * @description Wraps render operations with automatic timing and FPS tracking
   */
  const wrapRenderOperation = useCallback(<T extends (...args: any[]) => any>(
    operation: T,
    operationName: string
  ): T => {
    if (!isEnabled) {
      return operation;
    }

    return ((...args: Parameters<T>) => {
      const operationId = generateOperationId();
      debugLog('Render', `Starting operation: ${operationName}`, { operationId });
      
      startTimer(operationId);
      const result = operation(...args);
      const duration = endTimer(operationId);
      
      if (duration !== null) {
        // Calculate FPS based on render duration (approximate)
        const fps = duration > 0 ? 1000 / duration : 60;
        recordRenderOperation(duration, fps);
        debugLog('Render', `Completed operation: ${operationName}`, { 
          operationId, 
          duration: `${duration.toFixed(2)}ms`,
          fps: fps.toFixed(1)
        });
      }
      
      return result;
    }) as T;
  }, [isEnabled, generateOperationId, startTimer, endTimer, recordRenderOperation]);

  return {
    wrapDrawingOperation,
    wrapSyncOperation,
    wrapRenderOperation
  };
};
