/**
 * @fileoverview Centralized debug configuration system
 * @description Controls debug logging across the entire application
 */

export interface DebugConfig {
  // Performance monitoring
  performance: boolean;
  performanceMetrics: boolean;
  performanceTimers: boolean;
  memoryMonitor: boolean;
  fpsTracker: boolean;
  performanceDashboard: boolean;
  
  // Canvas and rendering
  canvas: boolean;
  layerOptimization: boolean;
  viewportCulling: boolean;
  renderOperations: boolean;
  
  // Event handling
  events: boolean;
  pointerEvents: boolean;
  touchEvents: boolean;
  wheelEvents: boolean;
  palmRejection: boolean;
  
  // State management
  state: boolean;
  selection: boolean;
  history: boolean;
  panZoom: boolean;
  
  // Sync and collaboration
  sync: boolean;
  operations: boolean;
  connection: boolean;
  
  // Window management
  windows: boolean;
  
  // Image operations
  images: boolean;
  
  // Drawing operations
  drawing: boolean;
  
  // Session management
  session: boolean;
}

// Default configuration - most debugging disabled by default
const DEFAULT_DEBUG_CONFIG: DebugConfig = {
  // Performance monitoring - disabled by default
  performance: false,
  performanceMetrics: false,
  performanceTimers: false,
  memoryMonitor: false,
  fpsTracker: false,
  performanceDashboard: false,
  
  // Canvas and rendering - disabled by default
  canvas: false,
  layerOptimization: false,
  viewportCulling: false,
  renderOperations: false,
  
  // Event handling - DISABLED by default to prevent console spam
  events: false,
  pointerEvents: false,
  touchEvents: false,
  wheelEvents: false,
  palmRejection: false, // Changed from true to false
  
  // State management - disabled by default
  state: false,
  selection: false,
  history: false,
  panZoom: false,
  
  // Sync and collaboration - disabled by default
  sync: false,
  operations: false,
  connection: false,
  
  // Window management - disabled by default
  windows: false,
  
  // Image operations - disabled by default
  images: false,
  
  // Drawing operations - disabled by default
  drawing: false,
  
  // Session management - disabled by default
  session: false
};

// Environment-based configuration
const DEVELOPMENT_OVERRIDES: Partial<DebugConfig> = {
  // Only enable essential debugging in development
  connection: true, // Keep connection status visible
  sync: false, // Disable sync spam
  events: false, // Disable event spam completely
  palmRejection: false, // Disable palm rejection spam
  layerOptimization: true, // Phase 2D.1: Enable layer optimization debugging
  performanceDashboard: true, // Enable performance dashboard in development
};

// Create the active debug configuration
const createDebugConfig = (): DebugConfig => {
  const baseConfig = { ...DEFAULT_DEBUG_CONFIG };
  
  if (process.env.NODE_ENV === 'development') {
    return { ...baseConfig, ...DEVELOPMENT_OVERRIDES };
  }
  
  return baseConfig;
};

export const DEBUG_CONFIG = createDebugConfig();

/**
 * @function createDebugLogger
 * @description Creates a conditional debug logger for a specific subsystem
 */
export const createDebugLogger = (subsystem: keyof DebugConfig) => {
  return (context: string, action: string, data?: any) => {
    if (DEBUG_CONFIG[subsystem]) {
      console.log(`[${subsystem}:${context}] ${action}`, data || '');
    }
  };
};

/**
 * @function isDebugEnabled
 * @description Check if debugging is enabled for a specific subsystem
 */
export const isDebugEnabled = (subsystem: keyof DebugConfig): boolean => {
  return DEBUG_CONFIG[subsystem];
};

/**
 * @function enableDebug
 * @description Temporarily enable debugging for a subsystem (for runtime debugging)
 */
export const enableDebug = (subsystem: keyof DebugConfig) => {
  DEBUG_CONFIG[subsystem] = true;
  console.log(`[DebugConfig] Enabled debugging for: ${subsystem}`);
};

/**
 * @function disableDebug
 * @description Disable debugging for a subsystem
 */
export const disableDebug = (subsystem: keyof DebugConfig) => {
  DEBUG_CONFIG[subsystem] = false;
  console.log(`[DebugConfig] Disabled debugging for: ${subsystem}`);
};

/**
 * @function logError
 * @description Always log errors regardless of debug settings
 */
export const logError = (context: string, message: string, error?: any) => {
  console.error(`[Error:${context}] ${message}`, error || '');
};

/**
 * @function logWarning
 * @description Always log warnings regardless of debug settings
 */
export const logWarning = (context: string, message: string, data?: any) => {
  console.warn(`[Warning:${context}] ${message}`, data || '');
};
