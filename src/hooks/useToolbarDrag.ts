
import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface UseToolbarDragProps {
  containerWidth: number;
  containerHeight: number;
  externalPortalContainer?: Element | null;
}

// Helper to clamp a value between a min and max
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

export const useToolbarDrag = ({ 
  containerWidth, 
  containerHeight, 
  externalPortalContainer 
}: UseToolbarDragProps) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  // Determine the correct document context for event listeners
  const targetDocument = useMemo(() => {
    return externalPortalContainer?.ownerDocument || document;
  }, [externalPortalContainer]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || !toolbarRef.current) return; // Only act on left-click

    e.preventDefault();
    e.stopPropagation();
    
    const toolbarRect = toolbarRef.current.getBoundingClientRect();
    
    // Calculate click offset relative to the toolbar's top-left corner.
    // This works for both main window and portal scenarios.
    const offsetX = e.clientX - toolbarRect.left;
    const offsetY = e.clientY - toolbarRect.top;
      
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
  }, []); // Empty deps because it only uses stable setters and refs

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!toolbarRef.current) return;
      e.preventDefault();
      
      let newX: number;
      let newY: number;
      
      // Calculate new position based on whether we are in a portal
      if (externalPortalContainer) {
        const containerRect = externalPortalContainer.getBoundingClientRect();
        newX = e.clientX - containerRect.left - dragOffset.x;
        newY = e.clientY - containerRect.top - dragOffset.y;
      } else {
        // In the main window, position is relative to the viewport
        newX = e.clientX - dragOffset.x;
        newY = e.clientY - dragOffset.y;
      }
      
      // Constrain the position within the container boundaries
      if (containerWidth > 0 && containerHeight > 0) {
        const { width: toolbarWidth, height: toolbarHeight } = toolbarRef.current.getBoundingClientRect();
        newX = clamp(newX, 0, containerWidth - toolbarWidth);
        newY = clamp(newY, 0, containerHeight - toolbarHeight);
      }
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    // Attach listeners to the correct document (main window or pop-up)
    targetDocument.addEventListener('mousemove', handleMouseMove);
    targetDocument.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      targetDocument.removeEventListener('mousemove', handleMouseMove);
      targetDocument.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, targetDocument, externalPortalContainer, containerWidth, containerHeight]);

  return {
    position,
    isDragging,
    toolbarRef,
    handleMouseDown
  };
};
