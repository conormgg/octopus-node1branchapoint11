
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
      webkitUserSelect: container.style.webkitUserSelect,
      mozUserSelect: container.style.MozUserSelect,
      msUserSelect: container.style.msUserSelect,
      webkitTouchCallout: container.style.webkitTouchCallout,
      webkitTapHighlightColor: container.style.webkitTapHighlightColor
    };

    // TABLET-FRIENDLY: Apply prevention styles
    Object.assign(container.style, {
      userSelect: 'none',
      webkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      webkitTouchCallout: 'none',
      webkitTapHighlightColor: 'transparent'
    });

    debugLog('TextSelection', 'Text selection prevention applied');

    // TABLET-FRIENDLY: Cleanup function
    return () => {
      document.removeEventListener('selectstart', preventTextSelection);
      document.removeEventListener('dragstart', preventDragStart);
      
      // Restore original styles
      Object.assign(container.style, originalStyles);
      
      debugLog('TextSelection', 'Text selection prevention cleaned up');
    };
  }, [containerRef, enabled]);
};
