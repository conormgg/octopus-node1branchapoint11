
import React, { useState, useEffect } from 'react';

interface UseToolbarDragProps {
  containerWidth: number;
  containerHeight: number;
  externalPortalContainer?: Element | null;
}

export const useToolbarDrag = ({ 
  containerWidth, 
  containerHeight, 
  externalPortalContainer 
}: UseToolbarDragProps) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  // Determine the correct document context
  const targetDocument = React.useMemo(() => {
    if (externalPortalContainer) {
      return externalPortalContainer.ownerDocument || document;
    }
    return document;
  }, [externalPortalContainer]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    e.preventDefault();
    e.stopPropagation();
    
    // Get toolbar's current position relative to its container
    if (toolbarRef.current && externalPortalContainer) {
      const toolbarRect = toolbarRef.current.getBoundingClientRect();
      const containerRect = externalPortalContainer.getBoundingClientRect();
      
      // Calculate click offset relative to toolbar's top-left corner
      const offsetX = e.clientX - toolbarRect.left;
      const offsetY = e.clientY - toolbarRect.top;
      
      
      setDragOffset({ x: offsetX, y: offsetY });
    } else {
      // Fallback for main window
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
    
    setIsDragging(true);
  };

  // Event listener effect to fix dragging in pop-up window
  useEffect(() => {
    // Define handlers inside the effect to avoid stale closures
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !toolbarRef.current) return;
      e.preventDefault();
      
      let newX, newY;
      
      if (externalPortalContainer) {
        const containerRect = externalPortalContainer.getBoundingClientRect();
        newX = e.clientX - containerRect.left - dragOffset.x;
        newY = e.clientY - containerRect.top - dragOffset.y;
      } else {
        newX = e.clientX - dragOffset.x;
        newY = e.clientY - dragOffset.y;
      }
      
      if (containerWidth > 0 && containerHeight > 0) {
        const toolbarRect = toolbarRef.current.getBoundingClientRect();
        const toolbarWidth = toolbarRect.width;
        const toolbarHeight = toolbarRect.height;
        
        newX = Math.max(0, Math.min(newX, containerWidth - toolbarWidth));
        newY = Math.max(0, Math.min(newY, containerHeight - toolbarHeight));
      }
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        setIsDragging(false);
      }
    };

    if (isDragging) {
      // Attach listeners to the correct document (main window or pop-up)
      targetDocument.addEventListener('mousemove', handleMouseMove);
      targetDocument.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        targetDocument.removeEventListener('mousemove', handleMouseMove);
        targetDocument.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, targetDocument, externalPortalContainer, containerWidth, containerHeight]);

  return {
    position,
    isDragging,
    toolbarRef,
    handleMouseDown
  };
};
