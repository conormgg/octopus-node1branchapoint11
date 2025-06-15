
/**
 * @fileoverview Integration layer for performance monitoring
 * @description Simplified integration layer using focused modules
 * 
 * @ai-context This hook serves as the main entry point for performance monitoring
 * integration, using the new modular architecture for better separation of concerns.
 */

import { useIntegrationCore } from './monitoring/useIntegrationCore';
import { createDebugLogger, isDebugEnabled } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('performance');

/**
 * @hook useMonitoringIntegration
 * @description Provides automatic performance monitoring integration for whiteboard operations
 * 
 * @param isEnabled - Whether monitoring is enabled
 * 
 * @returns {Object} Monitoring integration interface
 */
export const useMonitoringIntegration = (isEnabled: boolean = isDebugEnabled('performance')) => {
  debugLog('Hook', 'Initializing monitoring integration', { isEnabled });

  const integrationCore = useIntegrationCore(isEnabled);

  return integrationCore;
};
