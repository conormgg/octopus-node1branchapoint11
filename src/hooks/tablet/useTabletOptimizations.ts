
/**
 * @fileoverview Safari and iPad specific optimizations for tablet drawing
 * @description TABLET-FRIENDLY: Browser-specific optimizations for optimal tablet performance
 */

import { useEffect } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('tabletOptimizations');

interface UseTabletOptimizationsProps {
  /** Container element to apply optimizations to */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Enable or disable tablet optimizations */
  enabled?: boolean;
  /** Whether palm rejection is enabled (affects touch-action strategy) */
  palmRejectionEnabled?: boolean;
}

/**
 * TABLET-FRIENDLY: Hook for applying Safari and iPad specific optimizations
 * @description Applies browser-specific optimizations for better tablet performance and behavior
 * @param containerRef Reference to the container element
 * @param enabled Whether to enable optimizations (default: true)
 * @param palmRejectionEnabled Whether palm rejection is enabled (affects touch-action)
 */
export const useTabletOptimizations = ({
  containerRef,
  enabled = true,
  palmRejectionEnabled = true
}: UseTabletOptimizationsProps) => {
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    debugLog('TabletOptimizations', 'Applying tablet optimizations', { 
      enabled,
      palmRejectionEnabled,
      userAgent: navigator.userAgent
    });

    // TABLET-FRIENDLY: Store original touch-action for restoration
    const originalTouchAction = container.style.touchAction;

    // TABLET-FRIENDLY: Determine optimal touch-action based on palm rejection
    const optimalTouchAction = palmRejectionEnabled ? 'none' : 'manipulation';
    container.style.touchAction = optimalTouchAction;

    // TABLET-FRIENDLY: Detect Safari browser for specific optimizations
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isIPad = /iPad/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    debugLog('TabletOptimizations', 'Browser detection results', {
      isSafari,
      isIOS,
      isIPad,
      touchPoints: navigator.maxTouchPoints
    });

    // TABLET-FRIENDLY: Apply Safari-specific optimizations
    if (isSafari || isIOS) {
      // TABLET-FRIENDLY: Safari-specific CSS optimizations
      const safariStyles = {
        webkitOverflowScrolling: 'touch',
        webkitBackfaceVisibility: 'hidden',
        webkitPerspective: '1000px',
        webkitTransform: 'translate3d(0,0,0)' // Force hardware acceleration
      };

      const originalSafariStyles: Record<string, string> = {};
      Object.keys(safariStyles).forEach(key => {
        originalSafariStyles[key] = (container.style as any)[key];
        (container.style as any)[key] = (safariStyles as any)[key];
      });

      // Store for cleanup
      (container as any).__originalSafariStyles = originalSafariStyles;
    }

    // TABLET-FRIENDLY: Apply iPad-specific optimizations
    if (isIPad) {
      // TABLET-FRIENDLY: iPad-specific viewport and scaling optimizations
      const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
      let originalViewportContent = '';
      
      if (viewportMeta) {
        originalViewportContent = viewportMeta.content;
        // TABLET-FRIENDLY: Optimize viewport for iPad drawing
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      }

      // Store for cleanup
      (container as any).__originalViewportContent = originalViewportContent;

      // TABLET-FRIENDLY: Add iPad-specific CSS properties
      const ipadStyles = {
        webkitTextSizeAdjust: 'none',
        webkitUserSelect: 'none',
        webkitTouchCallout: 'none',
        webkitTapHighlightColor: 'transparent'
      };

      const originalIPadStyles: Record<string, string> = {};
      Object.keys(ipadStyles).forEach(key => {
        originalIPadStyles[key] = (container.style as any)[key];
        (container.style as any)[key] = (ipadStyles as any)[key];
      });

      // Store for cleanup
      (container as any).__originalIPadStyles = originalIPadStyles;
    }

    // TABLET-FRIENDLY: Add focus management for better keyboard handling
    if (container.tabIndex === undefined || container.tabIndex === -1) {
      container.tabIndex = 0;
      (container as any).__tabIndexAdded = true;
    }

    // TABLET-FRIENDLY: Prevent context menu on long press for better stylus support
    const preventContextMenu = (e: Event) => {
      e.preventDefault();
      debugLog('TabletOptimizations', 'Context menu prevented for tablet optimization');
    };

    container.addEventListener('contextmenu', preventContextMenu);

    debugLog('TabletOptimizations', 'Tablet optimizations applied successfully');

    return () => {
      // TABLET-FRIENDLY: Restore original touch-action
      container.style.touchAction = originalTouchAction;

      // TABLET-FRIENDLY: Restore Safari styles
      const originalSafariStyles = (container as any).__originalSafariStyles;
      if (originalSafariStyles) {
        Object.keys(originalSafariStyles).forEach(key => {
          (container.style as any)[key] = originalSafariStyles[key];
        });
        delete (container as any).__originalSafariStyles;
      }

      // TABLET-FRIENDLY: Restore iPad styles
      const originalIPadStyles = (container as any).__originalIPadStyles;
      if (originalIPadStyles) {
        Object.keys(originalIPadStyles).forEach(key => {
          (container.style as any)[key] = originalIPadStyles[key];
        });
        delete (container as any).__originalIPadStyles;
      }

      // TABLET-FRIENDLY: Restore viewport
      const originalViewportContent = (container as any).__originalViewportContent;
      if (originalViewportContent !== undefined) {
        const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
        if (viewportMeta) {
          viewportMeta.content = originalViewportContent;
        }
        delete (container as any).__originalViewportContent;
      }

      // TABLET-FRIENDLY: Remove added tabIndex
      if ((container as any).__tabIndexAdded) {
        container.removeAttribute('tabIndex');
        delete (container as any).__tabIndexAdded;
      }

      // TABLET-FRIENDLY: Remove event listeners
      container.removeEventListener('contextmenu', preventContextMenu);

      debugLog('TabletOptimizations', 'Tablet optimizations cleaned up');
    };
  }, [containerRef, enabled, palmRejectionEnabled]);
};
