import { useCallback, useRef } from 'react';
import { useStageCoordinates } from '@/hooks/useStageCoordinates';
import { PanZoomState } from '@/types/whiteboard';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('touchEvents');

interface UseTouchToSelectionBridgeProps {
  panZoomState: PanZoomState;
  handlePointerDown: (x: number, y: number) => void;
  handlePointerMove: (x: number, y: number) => void;
  handlePointerUp: () => void;
  currentTool: string;
  isReadOnly: boolean;
  stageRef: React.RefObject<any>;
}

/**
 * Phase 2: Touch-to-Selection Bridge
 * 
 * This hook bridges single-finger touch events to selection logic when the select tool is active.
 * It converts touch coordinates to the same format expected by pointer handlers and routes
 * them appropriately based on the current tool.
 */
export const useTouchToSelectionBridge = ({
  panZoomState,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  currentTool,
  isReadOnly,
  stageRef
}: UseTouchToSelectionBridgeProps) => {
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);
  const isTouchSelectionActiveRef = useRef(false);
  
  // Convert touch event to selection coordinates and route to pointer handlers
  const bridgeTouchToSelection = useCallback((
    e: TouchEvent, 
    action: 'down' | 'move' | 'up'
  ) => {
    // Only bridge single-finger touches when select tool is active
    if (currentTool !== 'select' || isReadOnly || e.touches.length > 1) {
      return false;
    }
    
    const stage = stageRef.current;
    if (!stage) return false;
    
    // Get touch coordinates
    const touch = action === 'up' ? e.changedTouches[0] : e.touches[0];
    if (!touch) return false;
    
    // Convert to stage coordinates
    const { x, y } = getRelativePointerPosition(stage, touch.clientX, touch.clientY);
    
    debugLog('TouchToSelectionBridge', `Bridging touch ${action} to selection`, {
      touch: { clientX: touch.clientX, clientY: touch.clientY },
      stage: { x, y },
      currentTool
    });
    
    // Route to appropriate pointer handler
    switch (action) {
      case 'down':
        isTouchSelectionActiveRef.current = true;
        handlePointerDown(x, y);
        break;
      case 'move':
        if (isTouchSelectionActiveRef.current) {
          handlePointerMove(x, y);
        }
        break;
      case 'up':
        if (isTouchSelectionActiveRef.current) {
          handlePointerUp();
          isTouchSelectionActiveRef.current = false;
        }
        break;
    }
    
    return true;
  }, [currentTool, isReadOnly, stageRef, getRelativePointerPosition, handlePointerDown, handlePointerMove, handlePointerUp]);
  
  // Reset state when tool changes
  const resetTouchSelection = useCallback(() => {
    isTouchSelectionActiveRef.current = false;
  }, []);
  
  return {
    bridgeTouchToSelection,
    resetTouchSelection,
    isTouchSelectionActive: () => isTouchSelectionActiveRef.current
  };
};