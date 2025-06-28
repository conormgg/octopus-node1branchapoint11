
import { useCallback } from 'react';

interface ContainerCoordinatesOptions {
  containerRef?: React.RefObject<HTMLElement>;
  includeScrollPosition?: boolean;
}

export const useContainerCoordinates = ({ 
  containerRef, 
  includeScrollPosition = false 
}: ContainerCoordinatesOptions = {}) => {
  
  const getContainerRelativeCoordinates = useCallback((clientX: number, clientY: number) => {
    let relativeX = clientX;
    let relativeY = clientY;
    
    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      relativeX = clientX - rect.left;
      relativeY = clientY - rect.top;
      
      if (includeScrollPosition) {
        const scrollLeft = containerRef.current.scrollLeft || 0;
        const scrollTop = containerRef.current.scrollTop || 0;
        relativeX += scrollLeft;
        relativeY += scrollTop;
      }
    }
    
    return { x: relativeX, y: relativeY };
  }, [containerRef, includeScrollPosition]);

  const getTouchCenter = useCallback((touches: TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    // Calculate center in screen coordinates
    const screenCenter = {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
    
    // Convert to container-relative coordinates
    const containerCenter = getContainerRelativeCoordinates(screenCenter.x, screenCenter.y);
    
    return {
      screenCenter,
      containerCenter
    };
  }, [getContainerRelativeCoordinates]);

  const getTouchDistance = useCallback((touches: TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  return {
    getContainerRelativeCoordinates,
    getTouchCenter,
    getTouchDistance
  };
};
