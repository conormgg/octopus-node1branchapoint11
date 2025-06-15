
/**
 * @fileoverview Global debug function exports for runtime control
 * @description Exposes debug control functions globally for easy console access
 */

import { enableDebug, disableDebug, DEBUG_CONFIG } from './debugConfig';

// Performance Dashboard state management
let performanceDashboardVisible = false;
let performanceDashboardCallbacks: (() => void)[] = [];

// Expose debug functions globally for easy runtime control
declare global {
  interface Window {
    debug: {
      enableDebug: typeof enableDebug;
      disableDebug: typeof disableDebug;
      getDebugConfig: () => typeof DEBUG_CONFIG;
      showPerformanceDashboard: () => void;
      hidePerformanceDashboard: () => void;
      isPerformanceDashboardVisible: () => boolean;
      isPerformanceDashboardAvailable: () => boolean;
    };
  }
}

/**
 * @function showPerformanceDashboard
 * @description Show the performance dashboard
 */
const showPerformanceDashboard = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('[DebugSystem] Performance dashboard only available in development mode');
    return;
  }
  
  performanceDashboardVisible = true;
  performanceDashboardCallbacks.forEach(callback => callback());
  console.log('[DebugSystem] Performance dashboard opened');
};

/**
 * @function hidePerformanceDashboard
 * @description Hide the performance dashboard
 */
const hidePerformanceDashboard = () => {
  performanceDashboardVisible = false;
  performanceDashboardCallbacks.forEach(callback => callback());
  console.log('[DebugSystem] Performance dashboard closed');
};

/**
 * @function isPerformanceDashboardVisible
 * @description Check if performance dashboard is currently visible
 */
const isPerformanceDashboardVisible = () => performanceDashboardVisible;

/**
 * @function isPerformanceDashboardAvailable
 * @description Check if performance dashboard is available (development mode)
 */
const isPerformanceDashboardAvailable = () => process.env.NODE_ENV === 'development';

/**
 * @function registerPerformanceDashboardCallback
 * @description Register callback for dashboard visibility changes
 */
export const registerPerformanceDashboardCallback = (callback: () => void) => {
  performanceDashboardCallbacks.push(callback);
  return () => {
    performanceDashboardCallbacks = performanceDashboardCallbacks.filter(cb => cb !== callback);
  };
};

/**
 * @function getPerformanceDashboardState
 * @description Get current dashboard state for providers
 */
export const getPerformanceDashboardState = () => performanceDashboardVisible;

// Only expose in development
if (process.env.NODE_ENV === 'development') {
  window.debug = {
    enableDebug,
    disableDebug,
    getDebugConfig: () => ({ ...DEBUG_CONFIG }),
    showPerformanceDashboard,
    hidePerformanceDashboard,
    isPerformanceDashboardVisible,
    isPerformanceDashboardAvailable
  };
  
  console.log('[DebugSystem] Debug functions available globally:');
  console.log('  window.debug.enableDebug(subsystem)   - Enable debugging for a subsystem');
  console.log('  window.debug.disableDebug(subsystem)  - Disable debugging for a subsystem');
  console.log('  window.debug.getDebugConfig()         - Get current debug configuration');
  console.log('  window.debug.showPerformanceDashboard() - Show performance dashboard');
  console.log('  window.debug.hidePerformanceDashboard() - Hide performance dashboard');
  console.log('');
  console.log('Available subsystems:', Object.keys(DEBUG_CONFIG).join(', '));
}
