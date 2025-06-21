
/**
 * @fileoverview TABLET-FRIENDLY: Tablet support hooks index
 * @description Central export point for all tablet-related functionality
 */

export { useTabletEventHandling, type TabletEventConfig, DEFAULT_TABLET_CONFIG } from './useTabletEventHandling';
export { usePalmRejection, type PalmRejectionConfig } from './usePalmRejection';
export { useTextSelectionPrevention } from './useTextSelectionPrevention';
export { useTabletOptimizations } from './useTabletOptimizations';

// TABLET-FRIENDLY: Export debugging utilities
export { tabletDebugger, logPalmRejectionStatus, logConfigurationChange } from '@/utils/tablet/tabletDebugger';

// TABLET-FRIENDLY: Export centralized configuration
export { 
  DEFAULT_TABLET_CONFIG as COMPLETE_TABLET_CONFIG,
  TABLET_CONFIG_PRESETS,
  getOptimalTabletConfig,
  validateTabletConfig,
  type CompleteTabletConfig,
  type TabletCSSConfig,
  type SafariOptimizationsConfig,
  type TabletPerformanceConfig
} from '@/config/tabletConfig';
