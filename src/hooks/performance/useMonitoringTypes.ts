
/**
 * @fileoverview Monitoring types and operation management
 * @description Provides operation ID generation and monitoring coordination
 */

import { useCallback, useRef } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performance');

interface UseMonitoringTypesProps {
  startTimer: (operationId: string) => void;
  endTimer: (operationId: string) => number | null;
  recordDrawingOperation: (duration: number) => void;
  recordSyncOperation: (duration: number) => void;
  recordRenderOperation: (duration: number, fps: number) => void;
}

/**
 * @interface MonitoredOperations
 * @description Tracked operation types for performance monitoring
 */
export interface MonitoredOperations {
  drawing: {
    start: (x: number, y: number) => void;
    continue: (x: number, y: number) => void;
    end: () => void;
  };
  sync: {
    send: (operation: any) => void;
    receive: (operation: any) => void;
  };
  render: {
    draw: () => void;
    update: () => void;
  };
}

/**
 * @hook useMonitoringTypes
 * @description Provides operation type management and monitoring utilities
 */
export const useMonitoringTypes = ({
  startTimer,
  endTimer,
  recordDrawingOperation,
  recordSyncOperation,
  recordRenderOperation
}: UseMonitoringTypesProps) => {
  const operationCounter = useRef(0);

  /**
   * @function generateOperationId
   * @description Generate unique operation ID for tracking
   */
  const generateOperationId = useCallback((): string => {
    const timestamp = Date.now();
    const counter = operationCounter.current++;
    return `op_${timestamp}_${counter}`;
  }, []);

  /**
   * @function monitorOperation
   * @description Monitor a specific operation with automatic timing
   */
  const monitorOperation = useCallback(<T extends (...args: any[]) => any>(
    operation: T,
    operationType: 'drawing' | 'sync' | 'render',
    operationName: string
  ): T => {
    return ((...args: Parameters<T>) => {
      const operationId = generateOperationId();
      debugLog('Monitor', `Starting ${operationType} operation: ${operationName}`, { operationId });
      
      startTimer(operationId);
      const result = operation(...args);
      const duration = endTimer(operationId);
      
      if (duration !== null) {
        switch (operationType) {
          case 'drawing':
            recordDrawingOperation(duration);
            break;
          case 'sync':
            recordSyncOperation(duration);
            break;
          case 'render':
            // For render operations, calculate approximate FPS
            const fps = duration > 0 ? 1000 / duration : 60;
            recordRenderOperation(duration, fps);
            break;
        }
        
        debugLog('Monitor', `Completed ${operationType} operation: ${operationName}`, { 
          operationId, 
          duration: `${duration.toFixed(2)}ms` 
        });
      }
      
      return result;
    }) as T;
  }, [generateOperationId, startTimer, endTimer, recordDrawingOperation, recordSyncOperation, recordRenderOperation]);

  // Create placeholder operations structure
  const operations: MonitoredOperations = {
    drawing: {
      start: () => {},
      continue: () => {},
      end: () => {}
    },
    sync: {
      send: () => {},
      receive: () => {}
    },
    render: {
      draw: () => {},
      update: () => {}
    }
  };

  return {
    generateOperationId,
    monitorOperation,
    operations
  };
};
