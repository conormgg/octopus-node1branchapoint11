
/**
 * @fileoverview Monitoring types and utilities
 * @description Defines monitoring types and utility functions for performance tracking
 * 
 * @ai-context Centralizes type definitions and utility functions used across
 * the monitoring system for consistency and maintainability.
 */

import { useCallback, useRef } from 'react';
import { WhiteboardOperation } from '@/types/sync';

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[MonitoringTypes:${context}] ${action}`, data || '');
  }
};

/**
 * @interface MonitoredOperations
 * @description Structure for tracking monitored operations
 */
export interface MonitoredOperations {
  drawing: {
    start: () => string;
    end: (operationId: string) => void;
  };
  sync: {
    start: () => string;
    end: (operationId: string) => void;
  };
  render: {
    start: () => string;
    end: (operationId: string) => void;
  };
}

interface UseMonitoringTypesProps {
  startTimer: (operationId: string) => void;
  endTimer: (operationId: string) => number;
  recordDrawingOperation: (duration: number) => void;
  recordSyncOperation: (duration: number) => void;
  recordRenderOperation: (duration: number) => void;
}

/**
 * @hook useMonitoringTypes
 * @description Provides monitoring types and utility functions
 */
export const useMonitoringTypes = ({
  startTimer,
  endTimer,
  recordDrawingOperation,
  recordSyncOperation,
  recordRenderOperation
}: UseMonitoringTypesProps) => {
  const operationCounterRef = useRef(0);

  /**
   * @function generateOperationId
   * @description Generate unique operation ID
   */
  const generateOperationId = useCallback((): string => {
    return `op_${Date.now()}_${++operationCounterRef.current}`;
  }, []);

  /**
   * @function monitorOperation
   * @description Monitor a specific whiteboard operation
   */
  const monitorOperation = useCallback((
    operation: WhiteboardOperation,
    type: 'drawing' | 'sync' | 'render' = 'sync'
  ) => {
    const operationId = `${type}_${operation.operation_type}_${Date.now()}`;
    debugLog('Operation', `Monitoring ${type} operation`, {
      operationId,
      operationType: operation.operation_type
    });

    startTimer(operationId);
    
    // Monitor the operation processing time
    setTimeout(() => {
      const duration = endTimer(operationId);
      
      switch (type) {
        case 'drawing':
          recordDrawingOperation(duration);
          break;
        case 'sync':
          recordSyncOperation(duration);
          break;
        case 'render':
          recordRenderOperation(duration);
          break;
      }
      
      debugLog('Operation', `Completed ${type} operation monitoring`, {
        operationId,
        duration
      });
    }, 0);
  }, [startTimer, endTimer, recordDrawingOperation, recordSyncOperation, recordRenderOperation]);

  /**
   * @constant operations
   * @description Pre-configured operation monitoring functions
   */
  const operations: MonitoredOperations = {
    drawing: {
      start: () => {
        const operationId = generateOperationId();
        startTimer(operationId);
        return operationId;
      },
      end: (operationId: string) => {
        const duration = endTimer(operationId);
        recordDrawingOperation(duration);
      }
    },
    sync: {
      start: () => {
        const operationId = generateOperationId();
        startTimer(operationId);
        return operationId;
      },
      end: (operationId: string) => {
        const duration = endTimer(operationId);
        recordSyncOperation(duration);
      }
    },
    render: {
      start: () => {
        const operationId = generateOperationId();
        startTimer(operationId);
        return operationId;
      },
      end: (operationId: string) => {
        const duration = endTimer(operationId);
        recordRenderOperation(duration);
      }
    }
  };

  return {
    generateOperationId,
    monitorOperation,
    operations
  };
};
