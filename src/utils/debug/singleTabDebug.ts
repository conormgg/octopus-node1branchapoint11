
/**
 * @fileoverview Debug controls for single-tab enforcement
 * @description Exposes single-tab debug functions globally for easy runtime control
 */

import SingleTabEnforcementService from '@/services/SingleTabEnforcement';

// Expose debug functions globally for easy runtime control
declare global {
  interface Window {
    enableSingleTabEnforcement: () => void;
    disableSingleTabEnforcement: () => void;
    enableSingleTabDebug: () => void;
    disableSingleTabDebug: () => void;
  }
}

// Only expose in development
if (process.env.NODE_ENV === 'development') {
  window.enableSingleTabEnforcement = () => {
    SingleTabEnforcementService.setEnabled(true);
    console.log('[SingleTabDebug] Single-tab enforcement enabled');
  };
  
  window.disableSingleTabEnforcement = () => {
    SingleTabEnforcementService.setEnabled(false);
    console.log('[SingleTabDebug] Single-tab enforcement disabled');
  };
  
  window.enableSingleTabDebug = () => {
    SingleTabEnforcementService.setDebugMode(true);
    console.log('[SingleTabDebug] Debug mode enabled');
  };
  
  window.disableSingleTabDebug = () => {
    SingleTabEnforcementService.setDebugMode(false);
    console.log('[SingleTabDebug] Debug mode disabled');
  };
  
  console.log('[SingleTabDebug] Debug functions available globally:');
  console.log('  window.enableSingleTabEnforcement()  - Enable single-tab enforcement');
  console.log('  window.disableSingleTabEnforcement() - Disable single-tab enforcement');
  console.log('  window.enableSingleTabDebug()       - Enable debug logging');
  console.log('  window.disableSingleTabDebug()      - Disable debug logging');
}
