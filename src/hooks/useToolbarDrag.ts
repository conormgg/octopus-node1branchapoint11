
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

  // Helper function to get position from different event types
  const getEventPosition = useCallback((e: MouseEvent | TouchEvent | PointerEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent | PointerEvent).clientX, y: (e as MouseEvent | PointerEvent).clientY };
  }, []);

  // Helper function to start drag operation
  const startDrag = useCallback((clientX: number, clientY: number) => {
    if (!toolbarRef.current) return false;
    
    const toolbarRect = toolbarRef.current.getBoundingClientRect();
    
    // Calculate click offset relative to the toolbar's top-left corner
    const offsetX = clientX - toolbarRect.left;
    const offsetY = clientY - toolbarRect.top;
      
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
    return true;
  }, []);

  // Helper function to update position during drag
  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!toolbarRef.current) return;
    
    let newX: number;
    let newY: number;

    // Determine the reference container for positioning
    const positioningContainer = externalPortalContainer || toolbarRef.current.offsetParent;
    
    if (positioningContainer) {
      const containerRect = positioningContainer.getBoundingClientRect();
      // Calculate position relative to the container
      newX = clientX - containerRect.left - dragOffset.x;
      newY = clientY - containerRect.top - dragOffset.y;
    } else {
      // Fallback: position relative to the viewport
      newX = clientX - dragOffset.x;
      newY = clientY - dragOffset.y;
    }
    
    // Constrain the position within the container boundaries
    if (containerWidth > 0 && containerHeight > 0) {
      const { width: toolbarWidth, height: toolbarHeight } = toolbarRef.current.getBoundingClientRect();
      newX = clamp(newX, 0, containerWidth - toolbarWidth);
      newY = clamp(newY, 0, containerHeight - toolbarHeight);
    }
    
    setPosition({ x: newX, y: newY });
  }, [dragOffset, externalPortalContainer, containerWidth, containerHeight]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only act on left-click

    e.preventDefault();
    e.stopPropagation();
    
    startDrag(e.clientX, e.clientY);
  }, [startDrag]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return; // Only single touch

    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  }, [startDrag]);

  // Pointer event handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== -1) return; // Primary button or touch

    e.preventDefault();
    e.stopPropagation();
    
    startDrag(e.clientX, e.clientY);
  }, [startDrag]);

  // Mouse move and up handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updatePosition(e.clientX, e.clientY);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    targetDocument.addEventListener('mousemove', handleMouseMove);
    targetDocument.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      targetDocument.removeEventListener('mousemove', handleMouseMove);
      targetDocument.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, targetDocument, updatePosition]);

  // Touch move and end handlers
  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      
      e.preventDefault();
      const touch = e.touches[0];
      updatePosition(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    targetDocument.addEventListener('touchmove', handleTouchMove, { passive: false });
    targetDocument.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    return () => {
      targetDocument.removeEventListener('touchmove', handleTouchMove);
      targetDocument.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, targetDocument, updatePosition]);

  // Pointer move and up handlers
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();
      updatePosition(e.clientX, e.clientY);
    };

    const handlePointerUp = (e: PointerEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    targetDocument.addEventListener('pointermove', handlePointerMove);
    targetDocument.addEventListener('pointerup', handlePointerUp);
    targetDocument.addEventListener('pointercancel', handlePointerUp);
    
    return () => {
      targetDocument.removeEventListener('pointermove', handlePointerMove);
      targetDocument.removeEventListener('pointerup', handlePointerUp);
      targetDocument.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [isDragging, targetDocument, updatePosition]);

  return {
    position,
    isDragging,
    toolbarRef,
    handleMouseDown,
    handleTouchStart,
    handlePointerDown
  };
};
