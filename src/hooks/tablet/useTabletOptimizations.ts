
/**
 * @fileoverview iPad and Safari-specific optimizations
 * @description TABLET-FRIENDLY: Optimizations for better tablet performance and behavior
 */

import { useEffect } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('tabletOptimizations');

interface UseTabletOptimizationsProps {
  containerRef: React.RefObject<HTMLElement>;
  enabled: boolean;
  palmRejectionEnabled: boolean;
}

/**
 * TABLET-FRIENDLY: Hook for iPad and Safari-specific optimizations
 * @description Applies performance and behavior optimizations for tablet devices
 */
export const useTabletOptimizations = ({
  containerRef,
  enabled,
  palmRejectionEnabled
}: UseTabletOptimizationsProps) => {
  
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    
    debugLog('TabletOptimizations', 'Applying tablet optimizations', { 
      enabled, 
      palmRejectionEnabled 
    });

    // TABLET-FRIENDLY: Store original styles for restoration
    const originalStyles = {
      touchAction: container.style.touchAction,
      webkitTextSizeAdjust: container.style.getPropertyValue('-webkit-text-size-adjust'),
      webkitFontSmoothing: container.style.getPropertyValue('-webkit-font-smoothing'),
      webkitOverflowScrolling: container.style.getPropertyValue('-webkit-overflow-scrolling')
    };

    // TABLET-FRIENDLY: Apply optimizations using setProperty for vendor prefixes
    container.style.touchAction = palmRejectionEnabled ? 'none' : 'manipulation';
    container.style.setProperty('-webkit-text-size-adjust', 'none');
    container.style.setProperty('-webkit-font-smoothing', 'antialiased');
    container.style.setProperty('-webkit-overflow-scrolling', 'touch');

    // TABLET-FRIENDLY: Add hardware acceleration hint
    if (container.style.transform === '') {
      container.style.transform = 'translateZ(0)';
    }

    debugLog('TabletOptimizations', 'Tablet optimizations applied', {
      touchAction: container.style.touchAction,
      hardwareAcceleration: container.style.transform
    });

    // TABLET-FRIENDLY: Context menu prevention for long press
    const preventContextMenu = (e: Event) => {
      e.preventDefault();
      debugLog('TabletOptimizations', 'Prevented context menu');
    };

    container.addEventListener('contextmenu', preventContextMenu);

    // TABLET-FRIENDLY: Cleanup function
    return () => {
      // Restore original styles
      container.style.touchAction = originalStyles.touchAction;
      container.style.setProperty('-webkit-text-size-adjust', originalStyles.webkitTextSizeAdjust);
      container.style.setProperty('-webkit-font-smoothing', originalStyles.webkitFontSmoothing);
      container.style.setProperty('-webkit-overflow-scrolling', originalStyles.webkitOverflowScrolling);
      
      // Remove event listeners
      container.removeEventListener('contextmenu', preventContextMenu);
      
      debugLog('TabletOptimizations', 'Tablet optimizations cleaned up');
    };
  }, [containerRef, enabled, palmRejectionEnabled]);
};
