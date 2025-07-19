
import { useState, useCallback, useRef } from 'react';
import { SelectionBounds, SelectedObject } from '@/types/whiteboard';

export interface SelectionMode {
  type: 'idle' | 'potential_drag' | 'rectangle_selection' | 'object_selected';
  isDragging: boolean;
  startPoint: { x: number; y: number } | null;
}

export const useSelectionModes = () => {
  const [selectionMode, setSelectionMode] = useState<SelectionMode>({
    type: 'idle',
    isDragging: false,
    startPoint: null
  });
  
  const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const MIN_DRAG_DISTANCE = 5; // pixels

  // Start potential drag (waiting to see if it becomes a rectangle drag)
  const startPotentialDrag = useCallback((x: number, y: number) => {
    console.log('[SelectionModes] Starting potential drag at:', { x, y });
    dragStartPointRef.current = { x, y };
    setSelectionMode({
      type: 'potential_drag',
      isDragging: false,
      startPoint: { x, y }
    });
  }, []);

  // Check if movement exceeds threshold and switch to rectangle selection
  const checkDragThreshold = useCallback((x: number, y: number): boolean => {
    if (!dragStartPointRef.current || selectionMode.type !== 'potential_drag') {
      return false;
    }

    const distance = Math.sqrt(
      Math.pow(x - dragStartPointRef.current.x, 2) + 
      Math.pow(y - dragStartPointRef.current.y, 2)
    );

    if (distance >= MIN_DRAG_DISTANCE) {
      console.log('[SelectionModes] Drag threshold exceeded, switching to rectangle selection');
      setSelectionMode({
        type: 'rectangle_selection',
        isDragging: true,
        startPoint: dragStartPointRef.current
      });
      return true;
    }

    return false;
  }, [selectionMode.type]);

  // Switch to object selection mode
  const selectObject = useCallback(() => {
    console.log('[SelectionModes] Switching to object selection mode');
    setSelectionMode({
      type: 'object_selected',
      isDragging: false,
      startPoint: null
    });
    dragStartPointRef.current = null;
  }, []);

  // Complete rectangle selection
  const completeRectangleSelection = useCallback(() => {
    console.log('[SelectionModes] Completing rectangle selection');
    setSelectionMode({
      type: 'idle',
      isDragging: false,
      startPoint: null
    });
    dragStartPointRef.current = null;
  }, []);

  // Reset to idle state
  const resetSelection = useCallback(() => {
    console.log('[SelectionModes] Resetting selection to idle');
    setSelectionMode({
      type: 'idle',
      isDragging: false,
      startPoint: null
    });
    dragStartPointRef.current = null;
  }, []);

  // Check if we should allow object hit detection
  const shouldAllowObjectSelection = useCallback((): boolean => {
    return selectionMode.type !== 'rectangle_selection';
  }, [selectionMode.type]);

  // Check if we're actively dragging a rectangle
  const isRectangleDragging = useCallback((): boolean => {
    return selectionMode.type === 'rectangle_selection' && selectionMode.isDragging;
  }, [selectionMode.type, selectionMode.isDragging]);

  return {
    selectionMode,
    startPotentialDrag,
    checkDragThreshold,
    selectObject,
    completeRectangleSelection,
    resetSelection,
    shouldAllowObjectSelection,
    isRectangleDragging
  };
};
