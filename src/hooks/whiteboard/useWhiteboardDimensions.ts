
import { useState, useEffect, useRef, useCallback } from 'react';

export const useWhiteboardDimensions = (
  initialWidth?: number,
  initialHeight?: number,
  isMaximized?: boolean,
  gridOrientation?: string
) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const updateDimensions = useCallback(() => {
    if (containerRef.current && !isMaximized) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      // Account for border and padding - subtract 4px for 2px border on each side
      const adjustedWidth = Math.max(0, width - 4);
      const adjustedHeight = Math.max(0, height - 4);
      setDimensions({ width: adjustedWidth, height: adjustedHeight });
    }
  }, [isMaximized]);

  const refreshDimensions = useCallback(() => {
    // Force a dimension update - useful when layout changes
    setTimeout(updateDimensions, 0);
  }, [updateDimensions]);

  useEffect(() => {
    updateDimensions();

    // Set up ResizeObserver to detect container size changes
    if (containerRef.current && !isMaximized) {
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === containerRef.current) {
            updateDimensions();
          }
        }
      });
      resizeObserverRef.current.observe(containerRef.current);
    }

    // Also listen for window resize as fallback
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', updateDimensions);
    };
  }, [isMaximized, updateDimensions]);

  // Update dimensions when grid orientation changes
  useEffect(() => {
    if (gridOrientation) {
      refreshDimensions();
    }
  }, [gridOrientation, refreshDimensions]);

  // Calculate dimensions based on maximized state
  const whiteboardWidth = isMaximized ? (window.innerWidth - 32) : (dimensions.width || initialWidth || 800);
  const whiteboardHeight = isMaximized ? (window.innerHeight - 32) : (dimensions.height || initialHeight || 600);

  return {
    containerRef,
    whiteboardWidth,
    whiteboardHeight,
    refreshDimensions
  };
};
