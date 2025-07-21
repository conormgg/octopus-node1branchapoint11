
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
  const touchStartTimeRef = useRef<number>(0);
  
  // Convert touch event to selection coordinates and route to pointer handlers
  const bridgeTouchToSelection = useCallback((
    e: TouchEvent, 
    action: 'down' | 'move' | 'up'
  ) => {
    // CRITICAL: Never bridge multi-touch events - they should be handled by pan/zoom
    const touchCount = action === 'up' ? e.changedTouches.length : e.touches.length;
    const totalTouches = e.touches.length + (action === 'up' ? e.changedTouches.length : 0);
    
    if (totalTouches >= 2) {
      debugLog('TouchToSelectionBridge', 'Multi-touch detected - NOT bridging to selection', {
        touchCount,
        totalTouches,
        action,
        currentTool
      });
      return false;
    }

    // Get stage reference early for tool checking
    const stage = stageRef.current;
    let effectiveTool = currentTool;
    
    // Fallback: If currentTool is undefined, try to get it from stage
    if (effectiveTool === undefined && stage) {
      effectiveTool = stage.getAttr('currentTool');
      debugLog('TouchToSelectionBridge', 'Using stage fallback tool', {
        originalTool: currentTool,
        stageTool: effectiveTool
      });
    }
    
    debugLog('TouchToSelectionBridge', `Bridge attempt for ${action}`, {
      currentTool,
      effectiveTool,
      stageTool: stage?.getAttr('currentTool'),
      toolIsSelect: effectiveTool === 'select' || effectiveTool === 'select2',
      isReadOnly,
      touchCount,
      totalTouches,
      toolUndefined: effectiveTool === undefined,
      toolType: typeof effectiveTool
    });

    // FIXED: Bridge for both select and select2 tools, only single-finger touches
    if ((effectiveTool !== 'select' && effectiveTool !== 'select2') || isReadOnly) {
      debugLog('TouchToSelectionBridge', 'Bridge conditions not met', {
        currentTool,
        effectiveTool,
        toolNotSelect: effectiveTool !== 'select' && effectiveTool !== 'select2',
        isReadOnly,
        touchCount,
        totalTouches
      });
      return false;
    }
    
    if (!stage) {
      debugLog('TouchToSelectionBridge', 'No stage reference');
      return false;
    }
    
    // Get touch coordinates
    const touch = action === 'up' ? e.changedTouches[0] : e.touches[0];
    if (!touch) {
      debugLog('TouchToSelectionBridge', 'No touch found');
      return false;
    }
    
    // FIXED: Prevent default only for touch events we're handling to avoid conflicts
    if (action === 'down') {
      touchStartTimeRef.current = Date.now();
      // Only prevent default if we're definitely handling this touch
      e.preventDefault();
    }
    
    // Convert to stage coordinates - FIXED: Use consistent coordinate transformation
    const { x, y } = getRelativePointerPosition(stage, touch.clientX, touch.clientY);
    
    debugLog('TouchToSelectionBridge', `Bridging touch ${action} to selection`, {
      touch: { clientX: touch.clientX, clientY: touch.clientY },
      stage: { x, y },
      currentTool,
      effectiveTool,
      action,
      panZoomState
    });
    
    // Route to appropriate pointer handler
    switch (action) {
      case 'down':
        debugLog('TouchToSelectionBridge', 'Calling handlePointerDown', { x, y });
        isTouchSelectionActiveRef.current = true;
        handlePointerDown(x, y);
        break;
      case 'move':
        if (isTouchSelectionActiveRef.current) {
          debugLog('TouchToSelectionBridge', 'Calling handlePointerMove', { x, y });
          // FIXED: Only prevent default on move if we're actively handling the touch
          e.preventDefault();
          handlePointerMove(x, y);
        } else {
          debugLog('TouchToSelectionBridge', 'Touch selection not active for move');
        }
        break;
      case 'up':
        if (isTouchSelectionActiveRef.current) {
          debugLog('TouchToSelectionBridge', 'Calling handlePointerUp');
          handlePointerUp();
          isTouchSelectionActiveRef.current = false;
        } else {
          debugLog('TouchToSelectionBridge', 'Touch selection not active for up');
        }
        touchStartTimeRef.current = 0;
        break;
    }
    
    debugLog('TouchToSelectionBridge', `Bridge ${action} completed successfully`);
    return true;
  }, [currentTool, isReadOnly, stageRef, getRelativePointerPosition, handlePointerDown, handlePointerMove, handlePointerUp, panZoomState]);
  
  // Reset state when tool changes
  const resetTouchSelection = useCallback(() => {
    debugLog('TouchToSelectionBridge', 'Resetting touch selection state');
    isTouchSelectionActiveRef.current = false;
    touchStartTimeRef.current = 0;
  }, []);
  
  return {
    bridgeTouchToSelection,
    resetTouchSelection,
    isTouchSelectionActive: () => isTouchSelectionActiveRef.current
  };
};
