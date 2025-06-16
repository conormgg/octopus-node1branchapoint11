
import { useState, useEffect, useRef } from 'react';

export const useWhiteboardDimensions = (
  initialWidth?: number,
  initialHeight?: number,
  isMaximized?: boolean
) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updateDimensions = () => {
    if (containerRef.current && !isMaximized) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      // Account for border and padding - subtract 4px for 2px border on each side
      const adjustedWidth = Math.max(0, width - 4);
      const adjustedHeight = Math.max(0, height - 4);
      setDimensions({ width: adjustedWidth, height: adjustedHeight });
    }
  };

  useEffect(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [isMaximized]);

  // Calculate dimensions based on maximized state
  const whiteboardWidth = isMaximized ? (window.innerWidth - 32) : (dimensions.width || initialWidth || 800);
  const whiteboardHeight = isMaximized ? (window.innerHeight - 32) : (dimensions.height || initialHeight || 600);

  return {
    containerRef,
    whiteboardWidth,
    whiteboardHeight
  };
};
