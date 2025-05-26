
import { useEffect } from 'react';

interface UseKeyboardNavigationProps {
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  isEnabled?: boolean;
}

export const useKeyboardNavigation = ({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  isEnabled = true,
}: UseKeyboardNavigationProps) => {
  useEffect(() => {
    if (!isEnabled || totalPages <= 1) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if no input is focused
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          if (currentPage > 0) {
            event.preventDefault();
            onPreviousPage();
          }
          break;
        case 'ArrowRight':
          if (currentPage < totalPages - 1) {
            event.preventDefault();
            onNextPage();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onPreviousPage, onNextPage, isEnabled]);
};
