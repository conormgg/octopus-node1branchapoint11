
/**
 * @fileoverview Performance monitoring for whiteboard operations
 * @description Main interface for performance monitoring with simplified coordination
 * 
 * @ai-context This hook provides a simplified interface to the performance monitoring
 * system, delegating to specialized modules for actual implementation.
 */

import { usePerformanceCoordinator } from './monitoring/usePerformanceCoordinator';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performance');

/**
 * @hook usePerformanceMonitor
 * @description Main interface for performance monitoring
 * 
 * @returns {Object} Performance monitoring interface
 */
export const usePerformanceMonitor = () => {
  debugLog('Hook', 'Initializing performance monitor');

  const coordinator = usePerformanceCoordinator();

  debugLog('Hook', 'Performance monitor initialized');

  return coordinator;
};

// Export types for external use
export type { PerformanceMetrics, PerformanceReport } from './monitoring/usePerformanceCoordinator';
