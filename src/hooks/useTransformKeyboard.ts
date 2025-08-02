import { useEffect, useCallback } from 'react';

interface UseTransformKeyboardProps {
  isTransforming: boolean;
  onKeyDown: (key: string, modifiers: { ctrl: boolean; shift: boolean; alt: boolean }) => void;
  onKeyUp: (key: string, modifiers: { ctrl: boolean; shift: boolean; alt: boolean }) => void;
}

export const useTransformKeyboard = ({ 
  isTransforming, 
  onKeyDown, 
  onKeyUp 
}: UseTransformKeyboardProps) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isTransforming) return;
    
    const modifiers = {
      ctrl: e.ctrlKey || e.metaKey,
      shift: e.shiftKey,
      alt: e.altKey
    };
    
    onKeyDown(e.key, modifiers);
    
    // Prevent default for transform modifier keys
    if (e.key === 'Shift' || e.key === 'Alt' || e.key === 'Control' || e.key === 'Meta') {
      e.preventDefault();
    }
  }, [isTransforming, onKeyDown]);
  
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!isTransforming) return;
    
    const modifiers = {
      ctrl: e.ctrlKey || e.metaKey,
      shift: e.shiftKey,
      alt: e.altKey
    };
    
    onKeyUp(e.key, modifiers);
  }, [isTransforming, onKeyUp]);
  
  useEffect(() => {
    if (isTransforming) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [isTransforming, handleKeyDown, handleKeyUp]);
};