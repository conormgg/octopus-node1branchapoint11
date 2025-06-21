
import { useCallback, useRef } from 'react';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('textSelection');

/**
 * Hook for temporary document-level text selection protection during drawing
 */
export const useTemporaryDocumentProtection = () => {
  const isProtectedRef = useRef(false);
  const styleElementRef = useRef<HTMLStyleElement | null>(null);

  const enableProtection = useCallback(() => {
    if (isProtectedRef.current) return;

    debugLog('DocumentProtection', 'Enabling temporary document protection');
    
    // Create and inject CSS to prevent text selection
    const style = document.createElement('style');
    style.textContent = `
      body.drawing-protection * {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
    `;
    
    document.head.appendChild(style);
    document.body.classList.add('drawing-protection');
    
    styleElementRef.current = style;
    isProtectedRef.current = true;
  }, []);

  const disableProtection = useCallback(() => {
    if (!isProtectedRef.current) return;

    debugLog('DocumentProtection', 'Disabling temporary document protection');
    
    document.body.classList.remove('drawing-protection');
    
    if (styleElementRef.current) {
      document.head.removeChild(styleElementRef.current);
      styleElementRef.current = null;
    }
    
    isProtectedRef.current = false;
  }, []);

  const isProtected = useCallback(() => isProtectedRef.current, []);

  return {
    enableProtection,
    disableProtection,
    isProtected
  };
};
