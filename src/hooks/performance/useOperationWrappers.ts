
/**
 * @fileoverview Operation wrapper functions for performance monitoring
 * @description Provides wrapper functions that automatically instrument operations with timing
 * 
 * @ai-context These wrappers automatically add performance monitoring to any function
 * without requiring manual instrumentation throughout the codebase.
 */

import { useCallback } from 'react';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[OperationWrappers:${context}] ${action}`, data || '');
  }
};

interface UseOperationWrappersProps {
  isEnabled: boolean;
  generateOperationId: () => string;
  startTimer: (operationId: string) => void;
  endTimer: (operationId: string) => number;
  recordDrawingOperation: (duration: number) => void;
  recordSyncOperation: (duration: number) => void;
  recordRenderOperation: (duration: number) => void;
}

/**
 * @hook useOperationWrappers
 * @description Provides wrapper functions for automatic performance monitoring
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
   * @description Wrap a drawing function with automatic performance monitoring
   */
  const wrapDrawingOperation = useCallback(<T extends (...args: any[]) => any>(
    operation: T
  ): T => {
    if (!isEnabled) return operation;

    return ((...args: any[]) => {
      const operationId = generateOperationId();
      debugLog('Drawing', 'Starting monitored drawing operation', { operationId });
      
      startTimer(operationId);
      
      try {
        const result = operation(...args);
        
        // Handle both sync and async operations
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            const duration = endTimer(operationId);
            recordDrawingOperation(duration);
            debugLog('Drawing', 'Completed async drawing operation', { operationId, duration });
          });
        } else {
          const duration = endTimer(operationId);
          recordDrawingOperation(duration);
          debugLog('Drawing', 'Completed sync drawing operation', { operationId, duration });
          return result;
        }
      } catch (error) {
        const duration = endTimer(operationId);
        recordDrawingOperation(duration);
        debugLog('Drawing', 'Error in drawing operation', { operationId, error });
        throw error;
      }
    }) as T;
  }, [isEnabled, generateOperationId, startTimer, endTimer, recordDrawingOperation]);

  /**
   * @function wrapSyncOperation
   * @description Wrap a sync function with automatic performance monitoring
   */
  const wrapSyncOperation = useCallback(<T extends (...args: any[]) => any>(
    operation: T
  ): T => {
    if (!isEnabled) return operation;

    return ((...args: any[]) => {
      const operationId = generateOperationId();
      debugLog('Sync', 'Starting monitored sync operation', { operationId });
      
      startTimer(operationId);
      
      try {
        const result = operation(...args);
        
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            const duration = endTimer(operationId);
            recordSyncOperation(duration);
            debugLog('Sync', 'Completed async sync operation', { operationId, duration });
          });
        } else {
          const duration = endTimer(operationId);
          recordSyncOperation(duration);
          debugLog('Sync', 'Completed sync sync operation', { operationId, duration });
          return result;
        }
      } catch (error) {
        const duration = endTimer(operationId);
        recordSyncOperation(duration);
        debugLog('Sync', 'Error in sync operation', { operationId, error });
        throw error;
      }
    }) as T;
  }, [isEnabled, generateOperationId, startTimer, endTimer, recordSyncOperation]);

  /**
   * @function wrapRenderOperation
   * @description Wrap a render function with automatic performance monitoring
   */
  const wrapRenderOperation = useCallback(<T extends (...args: any[]) => any>(
    operation: T
  ): T => {
    if (!isEnabled) return operation;

    return ((...args: any[]) => {
      const operationId = generateOperationId();
      
      startTimer(operationId);
      
      try {
        const result = operation(...args);
        
        if (result && typeof result.then === 'function') {
          return result.finally(() => {
            const duration = endTimer(operationId);
            recordRenderOperation(duration);
          });
        } else {
          const duration = endTimer(operationId);
          recordRenderOperation(duration);
          return result;
        }
      } catch (error) {
        const duration = endTimer(operationId);
        recordRenderOperation(duration);
        debugLog('Render', 'Error in render operation', { operationId, error });
        throw error;
      }
    }) as T;
  }, [isEnabled, generateOperationId, startTimer, endTimer, recordRenderOperation]);

  return {
    wrapDrawingOperation,
    wrapSyncOperation,
    wrapRenderOperation
  };
};
