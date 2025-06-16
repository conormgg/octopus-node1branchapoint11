
import { useEffect } from 'react';

export const useEscapeKeyHandler = (
  isMaximized: boolean,
  onMinimize?: () => void
) => {
  useEffect(() => {
    if (!isMaximized) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onMinimize) {
        onMinimize();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMaximized, onMinimize]);
};
