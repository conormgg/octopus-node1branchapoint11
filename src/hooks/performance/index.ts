
/**
 * @fileoverview Performance monitoring hooks exports
 * @description Central export point for all performance monitoring related hooks and utilities
 * 
 * @ai-context These hooks provide comprehensive performance monitoring:
 * - usePerformanceMonitor: Main coordination hook for all performance tracking
 * - useMonitoringIntegration: Automatic operation instrumentation
 * - useOptimizationTracker: Performance analysis and recommendations
 * - Individual modules for focused performance tracking
 */

// Main coordination hooks
export { usePerformanceMonitor } from './usePerformanceMonitor';
export { useMonitoringIntegration } from './useMonitoringIntegration';
export { useOptimizationTracker } from './useOptimizationTracker';

// Individual performance modules
export { usePerformanceMetrics } from './usePerformanceMetrics';
export { usePerformanceTimers } from './usePerformanceTimers';
export { useMemoryMonitor } from './useMemoryMonitor';
export { usePerformanceReporting } from './usePerformanceReporting';
export { useFpsTracker } from './useFpsTracker';

// Types
export type { PerformanceMetrics, PerformanceReport } from './usePerformanceMonitor';
