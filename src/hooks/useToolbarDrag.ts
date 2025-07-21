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

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 || !toolbarRef.current) return; // Only act on left-click
    
    // Allow stylus and touch inputs to pass through for color selectors
    if (e.pointerType === 'pen' || e.pointerType === 'touch') {
      const target = e.target as HTMLElement;
      if (target.closest('[data-color-selector-button]')) {
        return;
      }
    }

    e.preventDefault();
    e.stopPropagation();
    
    const toolbarRect = toolbarRef.current.getBoundingClientRect();
    
    // Calculate click offset relative to the toolbar's top-left corner.
    // This works for both main window and portal scenarios.
    const offsetX = e.clientX - toolbarRect.left;
    const offsetY = e.clientY - toolbarRect.top;
      
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!toolbarRef.current) return;
      e.preventDefault();
      
      let newX: number;
      let newY: number;

      // Determine the reference container for positioning.
      // Use the portal container if provided, otherwise use the toolbar's offsetParent.
      const positioningContainer = externalPortalContainer || toolbarRef.current.offsetParent;
      
      if (positioningContainer) {
        const containerRect = positioningContainer.getBoundingClientRect();
        // Calculate position relative to the container
        newX = e.clientX - containerRect.left - dragOffset.x;
        newY = e.clientY - containerRect.top - dragOffset.y;
      } else {
        // Fallback: This should not happen if the toolbar is inside a positioned container.
        // Calculates position relative to the viewport.
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

    const handlePointerUp = (e: PointerEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    // Attach listeners to the correct document (main window or pop-up)
    targetDocument.addEventListener('pointermove', handlePointerMove);
    targetDocument.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      targetDocument.removeEventListener('pointermove', handlePointerMove);
      targetDocument.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, dragOffset, targetDocument, externalPortalContainer, containerWidth, containerHeight]);

  return {
    position,
    isDragging,
    toolbarRef,
    handlePointerDown
  };
};
