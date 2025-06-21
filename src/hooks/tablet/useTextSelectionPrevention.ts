
/**
 * @fileoverview Text selection prevention for tablet drawing interfaces
 * @description TABLET-FRIENDLY: Comprehensive text selection prevention across all browser layers
 */

import { useEffect } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('textSelection');

interface UseTextSelectionPreventionProps {
  /** Container element to apply text selection prevention */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Enable or disable text selection prevention */
  enabled?: boolean;
}

/**
 * TABLET-FRIENDLY: Hook for preventing text selection during drawing operations
 * @description Implements multiple layers of text selection prevention for tablet drawing interfaces
 * @param containerRef Reference to the container element
 * @param enabled Whether to enable text selection prevention (default: true)
 */
export const useTextSelectionPrevention = ({
  containerRef,
  enabled = true
}: UseTextSelectionPreventionProps) => {
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    debugLog('TextSelection', 'Setting up text selection prevention', { enabled });

    // TABLET-FRIENDLY: Apply comprehensive CSS-based text selection prevention
    const containerStyle = container.style as any; // Type assertion for WebKit properties
    const originalStyles = {
      userSelect: containerStyle.userSelect,
      webkitUserSelect: containerStyle.webkitUserSelect,
      MozUserSelect: containerStyle.MozUserSelect,
      msUserSelect: containerStyle.msUserSelect,
      webkitTouchCallout: containerStyle.webkitTouchCallout,
      webkitTapHighlightColor: containerStyle.webkitTapHighlightColor,
      webkitTextSizeAdjust: containerStyle.webkitTextSizeAdjust,
      webkitFontSmoothing: containerStyle.webkitFontSmoothing
    };

    // TABLET-FRIENDLY: Apply text selection prevention styles
    Object.assign(containerStyle, {
      userSelect: 'none',
      webkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      webkitTouchCallout: 'none',
      webkitTapHighlightColor: 'transparent',
      webkitTextSizeAdjust: 'none', // iPad-specific optimization
      webkitFontSmoothing: 'antialiased' // Better text rendering on iPad
    });

    // TABLET-FRIENDLY: Document-level event prevention for text selection
    const preventSelection = (e: Event) => {
      debugLog('TextSelection', 'Preventing selectstart event');
      e.preventDefault();
      return false;
    };

    const preventDragStart = (e: Event) => {
      debugLog('TextSelection', 'Preventing dragstart event');
      e.preventDefault();
      return false;
    };

    // TABLET-FRIENDLY: Container-level event prevention
    const preventContainerSelection = (e: Event) => {
      debugLog('TextSelection', 'Preventing container selection event');
      e.preventDefault();
      return false;
    };

    // TABLET-FRIENDLY: Add event listeners to prevent text selection
    container.addEventListener('selectstart', preventContainerSelection);
    container.addEventListener('dragstart', preventContainerSelection);
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('dragstart', preventDragStart);

    // TABLET-FRIENDLY: Add pointer event prevention on the container
    const preventPointerDefaults = (e: Event) => {
      // Only prevent default for drawing-related interactions
      if (e.target === container || container.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    container.addEventListener('pointerdown', preventPointerDefaults);
    container.addEventListener('mousedown', preventPointerDefaults);

    debugLog('TextSelection', 'Text selection prevention applied successfully');

    return () => {
      // TABLET-FRIENDLY: Restore original styles
      Object.assign(containerStyle, originalStyles);

      // TABLET-FRIENDLY: Remove event listeners
      container.removeEventListener('selectstart', preventContainerSelection);
      container.removeEventListener('dragstart', preventContainerSelection);
      container.removeEventListener('pointerdown', preventPointerDefaults);
      container.removeEventListener('mousedown', preventPointerDefaults);
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('dragstart', preventDragStart);

      debugLog('TextSelection', 'Text selection prevention cleaned up');
    };
  }, [containerRef, enabled]);
};
