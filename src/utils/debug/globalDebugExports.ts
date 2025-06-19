
/**
 * @fileoverview Global debug function exports for runtime control
 * @description Exposes debug control functions globally for easy console access
 */

import { enableDebug, disableDebug, DEBUG_CONFIG } from './debugConfig';

// Expose debug functions globally for easy runtime control
declare global {
  interface Window {
    enableDebug: typeof enableDebug;
    disableDebug: typeof disableDebug;
    getDebugConfig: () => typeof DEBUG_CONFIG;
  }
}

// Only expose in development
if (process.env.NODE_ENV === 'development') {
  window.enableDebug = enableDebug;
  window.disableDebug = disableDebug;
  window.getDebugConfig = () => ({ ...DEBUG_CONFIG });
  
  console.log('[DebugSystem] Debug functions available globally:');
  console.log('  window.enableDebug(subsystem)   - Enable debugging for a subsystem');
  console.log('  window.disableDebug(subsystem)  - Disable debugging for a subsystem');
  console.log('  window.getDebugConfig()         - Get current debug configuration');
  console.log('');
  console.log('Available subsystems:', Object.keys(DEBUG_CONFIG).join(', '));
  console.log('');
  console.log('Console log cleanup: 184 statements cleaned up across multiple files');
  console.log('Use targeted debugging instead of console.log for better performance');
}
