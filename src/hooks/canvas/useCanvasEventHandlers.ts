import { useCallback, useRef } from 'react';
import { useMultiTouchDetection } from '@/hooks/eventHandling/useMultiTouchDetection';
import { useStageCoordinates } from '@/hooks/useStageCoordinates';
import { useTouchHandlers } from '@/hooks/panZoom/useTouchHandlers';
import { createDebugLogger } from '@/utils/debug/debugConfig';
import Konva from 'konva';

const debugLog = createDebugLogger('events');

interface UseCanvasEventHandlersProps {
  stageRef: React.RefObject<Konva.Stage>;
  panZoomState: any;
  panZoom: any;
  currentTool: string;
  handlePointerDown: (x: number, y: number) => void;
  handlePointerMove: (x: number, y: number) => void;
  handlePointerUp: () => void;
  isReadOnly: boolean;
}

export const useCanvasEventHandlers = ({
  stageRef,
  panZoomState,
  panZoom,
  currentTool,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isReadOnly
}: UseCanvasEventHandlersProps) => {
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);
  const multiTouchDetection = useMultiTouchDetection();
  const isDraggingRef = useRef(false);
  const isRightClickPanRef = useRef(false);
  const isMiddleClickPanRef = useRef(false);
  const isSpacePanRef = useRef(false);

  // Get advanced touch handlers
  const touchHandlers = useTouchHandlers(
    {
      startPan: panZoom.startPan,
      continuePan: panZoom.continuePan,
      stopPan: panZoom.stopPan,
      setIsGestureActiveState: (active: boolean) => {
        isDraggingRef.current = active;
      },
      isGestureActive: () => isDraggingRef.current || multiTouchDetection.isGestureActive()
    },
    panZoom.zoom,
    currentTool
  );

  // Reset all gesture states
  const resetGestureStates = useCallback(() => {
    debugLog('Canvas', 'Resetting all gesture states');
    isDraggingRef.current = false;
    isRightClickPanRef.current = false;
    isMiddleClickPanRef.current = false;
    isSpacePanRef.current = false;
    panZoom.stopPan();
    multiTouchDetection.reset();
  }, [panZoom, multiTouchDetection]);

  // Handle mouse down events (for better right-click detection)
  const onMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const button = e.evt.button;
    debugLog('Canvas', 'Mouse down', { button, currentTool });

    // Handle right-click pan (button 2)
    if (button === 2) {
      debugLog('Canvas', 'Right-click pan started');
      e.evt.preventDefault();
      const pos = stage.getPointerPosition();
      if (pos) {
        // Clear any existing pan state first
        if (isRightClickPanRef.current) {
          debugLog('Canvas', 'Already right-click panning, ignoring');
          return;
        }
        panZoom.startPan(pos.x, pos.y);
        isRightClickPanRef.current = true;
        isDraggingRef.current = true;
      }
      return;
    }

    // Handle middle-click pan (button 1)
    if (button === 1) {
      debugLog('Canvas', 'Middle-click pan started');
      e.evt.preventDefault();
      const pos = stage.getPointerPosition();
      if (pos) {
        panZoom.startPan(pos.x, pos.y);
        isMiddleClickPanRef.current = true;
        isDraggingRef.current = true;
      }
      return;
    }
  }, [stageRef, panZoom]);

  // Handle mouse move events
  const onMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Handle right-click pan
    if (isRightClickPanRef.current) {
      e.evt.preventDefault();
      const pos = stage.getPointerPosition();
      if (pos) {
        panZoom.continuePan(pos.x, pos.y);
      }
      return;
    }

    // Handle middle-click pan
    if (isMiddleClickPanRef.current) {
      e.evt.preventDefault();
      const pos = stage.getPointerPosition();
      if (pos) {
        panZoom.continuePan(pos.x, pos.y);
      }
      return;
    }
  }, [stageRef, panZoom]);

  // Handle mouse up events
  const onMouseUp = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const button = e.evt.button;
    debugLog('Canvas', 'Mouse up', { button, wasRightClickPan: isRightClickPanRef.current });

    // Handle right-click pan end
    if (button === 2 && isRightClickPanRef.current) {
      e.evt.preventDefault();
      debugLog('Canvas', 'Ending right-click pan');
      panZoom.stopPan();
      isRightClickPanRef.current = false;
      isDraggingRef.current = false;
      return;
    }

    // Handle middle-click pan end
    if (button === 1 && isMiddleClickPanRef.current) {
      e.evt.preventDefault();
      debugLog('Canvas', 'Ending middle-click pan');
      panZoom.stopPan();
      isMiddleClickPanRef.current = false;
      isDraggingRef.current = false;
      return;
    }
  }, [panZoom]);

  // Handle pointer down events
  const onPointerDown = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointerId = e.evt.pointerId;
    const pointerType = e.evt.pointerType;
    const button = e.evt.button;
    
    debugLog('Canvas', 'Pointer down', { pointerId, pointerType, button, currentTool });

    // Skip if already in a gesture state
    if (isRightClickPanRef.current || isMiddleClickPanRef.current || isSpacePanRef.current) {
      debugLog('Canvas', 'Skipping pointer down - already in gesture');
      return;
    }

    // Don't handle other interactions if read-only
    if (isReadOnly) return;
    
    // Track pointer for multi-touch detection
    multiTouchDetection.addPointer(pointerId, pointerType);
    
    // CRITICAL: If multi-touch is active, don't process single pointer events
    if (multiTouchDetection.isGestureActive()) {
      debugLog('Canvas', 'Multi-touch gesture active, blocking pointer event');
      return;
    }
    
    // Check if this is a multi-touch gesture
    if (multiTouchDetection.isMultiTouch()) {
      debugLog('Canvas', 'Multi-touch detected, starting pan');
      const pos = stage.getPointerPosition();
      if (pos) {
        panZoom.startPan(pos.x, pos.y);
        isDraggingRef.current = true;
      }
      return;
    }
    
    // Single touch/pointer with left button - route based on tool
    if (button === 0) {
      const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
      
      if (currentTool === 'select' || currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
        handlePointerDown(x, y);
      }
    }
  }, [stageRef, multiTouchDetection, panZoom, getRelativePointerPosition, currentTool, handlePointerDown, isReadOnly]);

  // Handle pointer move events
  const onPointerMove = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointerId = e.evt.pointerId;
    const pointerType = e.evt.pointerType;

    // Skip if in right-click, middle-click, or space pan mode
    if (isRightClickPanRef.current || isMiddleClickPanRef.current || isSpacePanRef.current) {
      return;
    }

    // Don't handle other interactions if read-only
    if (isReadOnly) return;
    
    // Track pointer
    multiTouchDetection.addPointer(pointerId, pointerType);
    
    // CRITICAL: If multi-touch is active, don't process single pointer events
    if (multiTouchDetection.isGestureActive()) {
      return;
    }
    
    // Handle multi-touch pan
    if (multiTouchDetection.isMultiTouch() && isDraggingRef.current) {
      const pos = stage.getPointerPosition();
      if (pos) {
        panZoom.continuePan(pos.x, pos.y);
      }
      return;
    }
    
    // Single touch/pointer - route based on tool
    const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    
    if (currentTool === 'select' || currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      handlePointerMove(x, y);
    }
  }, [stageRef, multiTouchDetection, panZoom, getRelativePointerPosition, currentTool, handlePointerMove, isReadOnly]);

  // Handle pointer up events
  const onPointerUp = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
    const pointerId = e.evt.pointerId;
    const button = e.evt.button;
    
    debugLog('Canvas', 'Pointer up', { pointerId, button, currentTool });

    // Skip if in right-click, middle-click, or space pan mode
    if (isRightClickPanRef.current || isMiddleClickPanRef.current || isSpacePanRef.current) {
      return;
    }

    // Don't handle other interactions if read-only
    if (isReadOnly) return;
    
    // Remove pointer from tracking
    multiTouchDetection.removePointer(pointerId);
    
    // End pan if we were panning
    if (isDraggingRef.current) {
      panZoom.stopPan();
      isDraggingRef.current = false;
    }
    
    // CRITICAL: If multi-touch is still active, don't process single pointer events
    if (multiTouchDetection.isGestureActive()) {
      return;
    }
    
    // Route to tool handler for left button
    if (button === 0 && (currentTool === 'select' || currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser')) {
      handlePointerUp();
    }
  }, [multiTouchDetection, panZoom, currentTool, handlePointerUp, isReadOnly]);

  // Handle context menu (right-click menu)
  const onContextMenu = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Always prevent context menu during any pan operation
    if (isRightClickPanRef.current || isMiddleClickPanRef.current || isSpacePanRef.current) {
      e.evt.preventDefault();
      e.evt.stopPropagation();
      return;
    }
    
    // Prevent context menu for drawing tools
    if (currentTool === 'pencil' || currentTool === 'highlighter' || currentTool === 'eraser') {
      e.evt.preventDefault();
      e.evt.stopPropagation();
    }
  }, [currentTool]);

  // Handle touch events for mobile using advanced touch handlers
  const onTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (isReadOnly && e.evt.touches.length === 1) return;
    
    const touches = e.evt.touches.length;
    debugLog('Canvas', 'Touch start', { touches, currentTool });
    
    multiTouchDetection.setActiveTouches(touches);
    
    // PRIORITIZE touch events for multi-touch
    if (touches >= 2) {
      debugLog('Canvas', 'Multi-touch detected via touch events - taking priority');
      e.evt.preventDefault();
      e.evt.stopPropagation();
    }
    
    // Use advanced touch handlers
    touchHandlers.handleTouchStart(e.evt);
  }, [multiTouchDetection, touchHandlers, currentTool, isReadOnly]);

  const onTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (isReadOnly && e.evt.touches.length === 1) return;
    
    const touches = e.evt.touches.length;
    multiTouchDetection.setActiveTouches(touches);
    
    // PRIORITIZE touch events for multi-touch
    if (touches >= 2) {
      e.evt.preventDefault();
      e.evt.stopPropagation();
    }
    
    // Use advanced touch handlers
    touchHandlers.handleTouchMove(e.evt);
  }, [multiTouchDetection, touchHandlers, isReadOnly]);

  const onTouchEnd = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (isReadOnly && e.evt.touches.length === 0) return;
    
    const touches = e.evt.touches.length;
    multiTouchDetection.setActiveTouches(touches);
    
    // Use advanced touch handlers
    touchHandlers.handleTouchEnd(e.evt);
  }, [multiTouchDetection, touchHandlers, isReadOnly]);

  // Space pan handlers
  const startSpacePan = useCallback((x: number, y: number) => {
    debugLog('Canvas', 'Space pan started');
    panZoom.startPan(x, y);
    isSpacePanRef.current = true;
    isDraggingRef.current = true;
  }, [panZoom]);

  const continueSpacePan = useCallback((x: number, y: number) => {
    if (isSpacePanRef.current) {
      panZoom.continuePan(x, y);
    }
  }, [panZoom]);

  const stopSpacePan = useCallback(() => {
    if (isSpacePanRef.current) {
      debugLog('Canvas', 'Space pan stopped');
      panZoom.stopPan();
      isSpacePanRef.current = false;
      isDraggingRef.current = false;
    }
  }, [panZoom]);

  // Reset on tool change
  const resetHandlers = useCallback(() => {
    debugLog('Canvas', 'Resetting handlers for tool change');
    resetGestureStates();
  }, [resetGestureStates]);

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onContextMenu,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    startSpacePan,
    continueSpacePan,
    stopSpacePan,
    resetHandlers,
    resetGestureStates
  };
};
