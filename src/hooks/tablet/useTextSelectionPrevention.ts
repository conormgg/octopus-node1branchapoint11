
/**
 * @fileoverview Text selection prevention for drawing interfaces
 * @description TABLET-FRIENDLY: Prevents unwanted text selection during tablet/stylus interactions
 */

import { useEffect } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('textSelection');

interface UseTextSelectionPreventionProps {
  containerRef: React.RefObject<HTMLElement>;
  enabled: boolean;
}

/**
 * TABLET-FRIENDLY: Hook to prevent text selection during drawing operations
 * @description Applies multiple layers of text selection prevention for optimal tablet experience
 */
export const useTextSelectionPrevention = ({
  containerRef,
  enabled
}: UseTextSelectionPreventionProps) => {
  
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    
    debugLog('TextSelection', 'Setting up text selection prevention', { enabled });

    // TABLET-FRIENDLY: Document-level event prevention
    const preventTextSelection = (e: Event) => {
      e.preventDefault();
      debugLog('TextSelection', 'Prevented text selection event', { type: e.type });
    };

    const preventDragStart = (e: Event) => {
      e.preventDefault();
      debugLog('TextSelection', 'Prevented drag start event');
    };

    // TABLET-FRIENDLY: Add document-level listeners
    document.addEventListener('selectstart', preventTextSelection, { passive: false });
    document.addEventListener('dragstart', preventDragStart, { passive: false });

    // TABLET-FRIENDLY: Apply comprehensive CSS prevention
    const originalStyles = {
      userSelect: container.style.userSelect,
      webkitUserSelect: container.style.getPropertyValue('-webkit-user-select'),
      mozUserSelect: container.style.getPropertyValue('-moz-user-select'),
      msUserSelect: container.style.getPropertyValue('-ms-user-select'),
      webkitTouchCallout: container.style.getPropertyValue('-webkit-touch-callout'),
      webkitTapHighlightColor: container.style.getPropertyValue('-webkit-tap-highlight-color')
    };

    // TABLET-FRIENDLY: Apply prevention styles using setProperty for vendor prefixes
    container.style.userSelect = 'none';
    container.style.setProperty('-webkit-user-select', 'none');
    container.style.setProperty('-moz-user-select', 'none');
    container.style.setProperty('-ms-user-select', 'none');
    container.style.setProperty('-webkit-touch-callout', 'none');
    container.style.setProperty('-webkit-tap-highlight-color', 'transparent');

    debugLog('TextSelection', 'Text selection prevention applied');

    // TABLET-FRIENDLY: Cleanup function
    return () => {
      document.removeEventListener('selectstart', preventTextSelection);
      document.removeEventListener('dragstart', preventDragStart);
      
      // Restore original styles
      container.style.userSelect = originalStyles.userSelect;
      container.style.setProperty('-webkit-user-select', originalStyles.webkitUserSelect);
      container.style.setProperty('-moz-user-select', originalStyles.mozUserSelect);
      container.style.setProperty('-ms-user-select', originalStyles.msUserSelect);
      container.style.setProperty('-webkit-touch-callout', originalStyles.webkitTouchCallout);
      container.style.setProperty('-webkit-tap-highlight-color', originalStyles.webkitTapHighlightColor);
      
      debugLog('TextSelection', 'Text selection prevention cleaned up');
    };
  }, [containerRef, enabled]);
};
