
/**
 * @fileoverview Centralized tablet configuration
 * @description TABLET-FRIENDLY: Single source of truth for all tablet-related settings
 */

import { TabletEventConfig } from '@/hooks/tablet';

/**
 * TABLET-FRIENDLY: CSS prevention configuration
 */
export interface TabletCSSConfig {
  /** Prevent text selection using CSS user-select */
  preventTextSelection: boolean;
  /** Disable webkit touch callouts */
  disableTouchCallouts: boolean;
  /** Remove tap highlight colors */
  removeTapHighlight: boolean;
  /** Apply webkit text size adjustments for iPad */
  applyTextSizeAdjust: boolean;
  /** Enable font smoothing optimizations */
  enableFontSmoothing: boolean;
  /** Custom touch action strategy */
  touchAction: 'auto' | 'none' | 'manipulation';
}

/**
 * TABLET-FRIENDLY: Safari/iPad specific optimizations
 */
export interface SafariOptimizationsConfig {
  /** Enable Safari-specific optimizations */
  enabled: boolean;
  /** Force hardware acceleration */
  forceHardwareAcceleration: boolean;
  /** Optimize overflow scrolling */
  optimizeOverflowScrolling: boolean;
  /** Apply viewport optimizations for iPad */
  optimizeViewport: boolean;
  /** Prevent context menu on long press */
  preventContextMenu: boolean;
}

/**
 * TABLET-FRIENDLY: Performance optimization settings
 */
export interface TabletPerformanceConfig {
  /** Enable layer caching optimizations */
  enableLayerCaching: boolean;
  /** Optimize for high DPI displays */
  optimizeHighDPI: boolean;
  /** Enable viewport culling for large canvases */
  enableViewportCulling: boolean;
  /** Batch pointer events for better performance */
  batchPointerEvents: boolean;
}

/**
 * TABLET-FRIENDLY: Complete tablet configuration interface
 */
export interface CompleteTabletConfig {
  /** Event handling configuration */
  events: TabletEventConfig;
  /** CSS and styling configuration */
  css: TabletCSSConfig;
  /** Safari/iPad optimizations */
  safari: SafariOptimizationsConfig;
  /** Performance optimizations */
  performance: TabletPerformanceConfig;
  /** Master enable/disable for all tablet optimizations */
  enabled: boolean;
}

/**
 * TABLET-FRIENDLY: Default CSS configuration optimized for iPad with Apple Pencil
 */
export const DEFAULT_CSS_CONFIG: TabletCSSConfig = {
  preventTextSelection: true,
  disableTouchCallouts: true,
  removeTapHighlight: true,
  applyTextSizeAdjust: true,
  enableFontSmoothing: true,
  touchAction: 'none' // Optimal for palm rejection
};

/**
 * TABLET-FRIENDLY: Default Safari optimizations for iPad
 */
export const DEFAULT_SAFARI_CONFIG: SafariOptimizationsConfig = {
  enabled: true,
  forceHardwareAcceleration: true,
  optimizeOverflowScrolling: true,
  optimizeViewport: true,
  preventContextMenu: true
};

/**
 * TABLET-FRIENDLY: Default performance optimizations
 */
export const DEFAULT_PERFORMANCE_CONFIG: TabletPerformanceConfig = {
  enableLayerCaching: true,
  optimizeHighDPI: true,
  enableViewportCulling: true,
  batchPointerEvents: true
};

/**
 * TABLET-FRIENDLY: Default tablet event configuration (from existing hook)
 */
export const DEFAULT_EVENT_CONFIG: TabletEventConfig = {
  palmRejectionEnabled: true,
  maxContactSize: 40,
  minPressure: 0.1,
  palmTimeoutMs: 500,
  clusterDistance: 100,
  preferStylus: true,
  preventTextSelection: true,
  enableSafariOptimizations: true
};

/**
 * TABLET-FRIENDLY: Complete default tablet configuration
 */
export const DEFAULT_TABLET_CONFIG: CompleteTabletConfig = {
  events: DEFAULT_EVENT_CONFIG,
  css: DEFAULT_CSS_CONFIG,
  safari: DEFAULT_SAFARI_CONFIG,
  performance: DEFAULT_PERFORMANCE_CONFIG,
  enabled: true
};

/**
 * TABLET-FRIENDLY: Development configuration with debugging enabled
 */
export const DEVELOPMENT_TABLET_CONFIG: CompleteTabletConfig = {
  ...DEFAULT_TABLET_CONFIG,
  events: {
    ...DEFAULT_EVENT_CONFIG,
    palmTimeoutMs: 300, // Shorter timeout for development
  },
  css: {
    ...DEFAULT_CSS_CONFIG,
    touchAction: 'manipulation' // Less aggressive for debugging
  }
};

/**
 * TABLET-FRIENDLY: Minimal configuration for testing without optimizations
 */
export const MINIMAL_TABLET_CONFIG: CompleteTabletConfig = {
  events: {
    ...DEFAULT_EVENT_CONFIG,
    palmRejectionEnabled: false,
    preventTextSelection: false,
    enableSafariOptimizations: false
  },
  css: {
    ...DEFAULT_CSS_CONFIG,
    preventTextSelection: false,
    touchAction: 'auto'
  },
  safari: {
    ...DEFAULT_SAFARI_CONFIG,
    enabled: false
  },
  performance: {
    ...DEFAULT_PERFORMANCE_CONFIG,
    enableLayerCaching: false,
    enableViewportCulling: false
  },
  enabled: false
};

/**
 * TABLET-FRIENDLY: Configuration presets for different use cases
 */
export const TABLET_CONFIG_PRESETS = {
  /** Optimized for iPad with Apple Pencil */
  ipad: DEFAULT_TABLET_CONFIG,
  /** For development and debugging */
  development: DEVELOPMENT_TABLET_CONFIG,
  /** Minimal optimizations for testing */
  minimal: MINIMAL_TABLET_CONFIG,
  /** High performance for complex drawings */
  performance: {
    ...DEFAULT_TABLET_CONFIG,
    events: {
      ...DEFAULT_EVENT_CONFIG,
      palmTimeoutMs: 200, // Faster response
    },
    performance: {
      ...DEFAULT_PERFORMANCE_CONFIG,
      batchPointerEvents: true,
      enableLayerCaching: true
    }
  }
} as const;

/**
 * TABLET-FRIENDLY: Get configuration based on environment and device detection
 */
export const getOptimalTabletConfig = (): CompleteTabletConfig => {
  // TABLET-FRIENDLY: Detect environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // TABLET-FRIENDLY: Detect device capabilities
  const isIPad = typeof navigator !== 'undefined' && 
    (/iPad/.test(navigator.userAgent) || 
     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
  
  const hasHighDPI = typeof window !== 'undefined' && window.devicePixelRatio > 1;
  
  // TABLET-FRIENDLY: Select optimal configuration
  if (isDevelopment) {
    return TABLET_CONFIG_PRESETS.development;
  }
  
  if (isIPad) {
    return TABLET_CONFIG_PRESETS.ipad;
  }
  
  // TABLET-FRIENDLY: Default configuration with device-specific adjustments
  const config = { ...DEFAULT_TABLET_CONFIG };
  
  if (hasHighDPI) {
    config.performance.optimizeHighDPI = true;
  }
  
  return config;
};

/**
 * TABLET-FRIENDLY: Validate complete tablet configuration
 */
export const validateTabletConfig = (config: Partial<CompleteTabletConfig>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // TABLET-FRIENDLY: Validate event configuration
  if (config.events) {
    if (config.events.maxContactSize !== undefined && config.events.maxContactSize <= 0) {
      errors.push('events.maxContactSize must be greater than 0');
    }
    
    if (config.events.minPressure !== undefined && 
        (config.events.minPressure < 0 || config.events.minPressure > 1)) {
      errors.push('events.minPressure must be between 0 and 1');
    }
    
    if (config.events.palmTimeoutMs !== undefined && config.events.palmTimeoutMs < 0) {
      errors.push('events.palmTimeoutMs must be non-negative');
    }
  }
  
  // TABLET-FRIENDLY: Validate CSS configuration
  if (config.css?.touchAction && 
      !['auto', 'none', 'manipulation'].includes(config.css.touchAction)) {
    errors.push('css.touchAction must be "auto", "none", or "manipulation"');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * TABLET-FRIENDLY: Export global configuration for console access
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).tabletConfig = {
    presets: TABLET_CONFIG_PRESETS,
    getOptimal: getOptimalTabletConfig,
    validate: validateTabletConfig
  };
  console.log('[TabletConfig] Tablet configuration available at window.tabletConfig');
}
