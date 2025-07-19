
import { useEffect, useRef, useCallback, useMemo } from 'react';
import Konva from 'konva';
import { usePalmRejection } from './usePalmRejection';
import { useStageCoordinates } from './useStageCoordinates';
import { PanZoomState } from '@/types/whiteboard';
import { useEventDebug } from './eventHandling/useEventDebug';
import { useWheelEventHandlers } from './eventHandling/useWheelEventHandlers';

interface UseStageEventHandlersProps {
  containerRef: React.RefObject<HTMLDivElement>;
  stageRef: React.RefObject<Konva.Stage>;
  panZoomState: PanZoomState;
  palmRejection: ReturnType<typeof usePalmRejection>;
  palmRejectionConfig: {
    enabled: boolean;
  };
  panZoom: {
    handleWheel: (e: WheelEvent) => void;
    handleTouchStart: (e: TouchEvent) => void;
    handleTouchMove: (e: TouchEvent) => void;
    handleTouchEnd: (e: TouchEvent) => void;
    startPan: (x: number, y: number) => void;
    continuePan: (x: number, y: number) => void;
    stopPan: () => void;
    isGestureActive: () => boolean;
  };
  handlePointerDown: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  handlePointerMove: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  handlePointerUp: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  isReadOnly: boolean;
}

export const useStageEventHandlers = ({
  containerRef,
  stageRef,
  panZoomState,
  palmRejection,
  palmRejectionConfig,
  panZoom,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isReadOnly
}: UseStageEventHandlersProps) => {
  const currentToolRef = useRef<string>('pencil');
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);
  const { logEventHandling } = useEventDebug(palmRejectionConfig);

  // Memoize stable values to prevent re-initialization
  const stablePalmRejectionEnabled = useMemo(() => palmRejectionConfig.enabled, [palmRejectionConfig.enabled]);
  const stableIsReadOnly = useMemo(() => isReadOnly, [isReadOnly]);

  // Track current tool efficiently with less frequent updates
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const updateTool = () => {
      const newTool = stage.getAttr('currentTool') as string;
      if (newTool && newTool !== currentToolRef.current) {
        currentToolRef.current = newTool;
        console.log('[StageEventHandlers] Tool updated to:', newTool);
      }
    };
    
    updateTool();
    const interval = setInterval(updateTool, 200); // Reduced frequency
    return () => clearInterval(interval);
  }, [stageRef]);

  // Wheel events for pan/zoom - memoized
  useWheelEventHandlers({
    containerRef,
    panZoom
  });

  // Touch events - memoized handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    console.log('[TouchEvents] Touch start:', e.touches.length, 'touches');
    logEventHandling('touchstart', 'touch', { touches: e.touches.length });
    
    if (e.touches.length >= 2) {
      console.log('[TouchEvents] Multi-touch detected - handling pan/zoom');
      e.preventDefault();
      panZoom.handleTouchStart(e);
    }
  }, [logEventHandling, panZoom]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    logEventHandling('touchmove', 'touch', { touches: e.touches.length });
    
    if (e.touches.length >= 2) {
      e.preventDefault();
      panZoom.handleTouchMove(e);
    }
  }, [logEventHandling, panZoom]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    logEventHandling('touchend', 'touch', { 
      touches: e.touches.length,
      changedTouches: e.changedTouches.length 
    });
    
    if (e.touches.length >= 1 && e.changedTouches.length > 1) {
      e.preventDefault();
      panZoom.handleTouchEnd(e);
    }
  }, [logEventHandling, panZoom]);

  // Touch event setup - stable effect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // CRITICAL FIX: Stabilized pointer event handlers with minimal dependencies
  const handlePointerDownEvent = useCallback((e: PointerEvent) => {
    console.log('[PointerEvents] STABLE - Pointer down:', {
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      button: e.button,
      tool: currentToolRef.current
    });

    logEventHandling('pointerdown', 'pointer', { 
      pointerId: e.pointerId, 
      pointerType: e.pointerType,
      button: e.button,
      tool: currentToolRef.current 
    });

    // Handle right-click pan for all pointer types except pen
    if (e.pointerType !== 'pen' && e.button === 2) {
      console.log('[PointerEvents] Right-click pan initiated');
      e.preventDefault();
      panZoom.startPan(e.clientX, e.clientY);
      return;
    }
    
    const isDrawingTool = ['pencil', 'highlighter', 'eraser'].includes(currentToolRef.current);
    
    // Block drawing tools in read-only mode
    if (isDrawingTool && stableIsReadOnly) {
      console.log('[PointerEvents] Read-only mode - blocking drawing');
      return;
    }

    // Apply palm rejection only if enabled
    if (stablePalmRejectionEnabled && !palmRejection.shouldProcessPointer(e)) {
      console.log('[PointerEvents] Palm rejection blocked pointer');
      return;
    }

    // Prevent default for drawing tools
    if (isDrawingTool) {
      e.preventDefault();
    }

    // Create Konva event and call handler
    const stage = stageRef.current;
    if (stage) {
      const konvaEvent = {
        evt: e,
        target: stage,
        currentTarget: stage,
        cancelBubble: false,
        type: e.type as any,
        pointerId: e.pointerId
      } as Konva.KonvaEventObject<PointerEvent>;
      handlePointerDown(konvaEvent);
    }
  }, [logEventHandling, panZoom, stableIsReadOnly, stablePalmRejectionEnabled, palmRejection, stageRef, handlePointerDown]);

  const handlePointerMoveEvent = useCallback((e: PointerEvent) => {
    logEventHandling('pointermove', 'pointer', { 
      pointerId: e.pointerId, 
      pointerType: e.pointerType,
      buttons: e.buttons,
      tool: currentToolRef.current 
    });

    // Handle right-click pan for all pointer types except pen
    if (e.pointerType !== 'pen' && e.buttons === 2) {
      e.preventDefault();
      panZoom.continuePan(e.clientX, e.clientY);
      return;
    }
    
    const isDrawingTool = ['pencil', 'highlighter', 'eraser'].includes(currentToolRef.current);
    
    if (isDrawingTool && stableIsReadOnly) {
      return;
    }

    // Apply palm rejection only if enabled
    if (stablePalmRejectionEnabled && !palmRejection.shouldProcessPointer(e)) {
      return;
    }

    // Prevent default for drawing tools
    if (isDrawingTool) {
      e.preventDefault();
    }

    // Create Konva event and call handler
    const stage = stageRef.current;
    if (stage) {
      const konvaEvent = {
        evt: e,
        target: stage,
        currentTarget: stage,
        cancelBubble: false,
        type: e.type as any,
        pointerId: e.pointerId
      } as Konva.KonvaEventObject<PointerEvent>;
      handlePointerMove(konvaEvent);
    }
  }, [logEventHandling, panZoom, stableIsReadOnly, stablePalmRejectionEnabled, palmRejection, stageRef, handlePointerMove]);

  const handlePointerUpEvent = useCallback((e: PointerEvent) => {
    console.log('[PointerEvents] STABLE - Pointer up:', {
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      button: e.button,
      tool: currentToolRef.current
    });

    logEventHandling('pointerup', 'pointer', { 
      pointerId: e.pointerId, 
      pointerType: e.pointerType,
      button: e.button,
      tool: currentToolRef.current 
    });

    // Handle right-click pan end for all pointer types except pen
    if (e.pointerType !== 'pen' && e.button === 2) {
      e.preventDefault();
      panZoom.stopPan();
      return;
    }
    
    // Always clean up palm rejection state
    palmRejection.onPointerEnd(e.pointerId);
    
    const isDrawingTool = ['pencil', 'highlighter', 'eraser'].includes(currentToolRef.current);
    
    // Prevent default for drawing tools
    if (isDrawingTool) {
      e.preventDefault();
    }
    
    // Call handlePointerUp for all tools when appropriate
    if (!stableIsReadOnly || currentToolRef.current === 'select') {
      const stage = stageRef.current;
      if (stage) {
        const konvaEvent = {
          evt: e,
          target: stage,
          currentTarget: stage,
          cancelBubble: false,
          type: e.type as any,
          pointerId: e.pointerId
        } as Konva.KonvaEventObject<PointerEvent>;
        handlePointerUp(konvaEvent);
      }
    }
  }, [logEventHandling, panZoom, palmRejection, stableIsReadOnly, stageRef, handlePointerUp]);

  const handlePointerLeaveEvent = useCallback((e: PointerEvent) => {
    console.log('[PointerEvents] Pointer leave - cleaning up');
    logEventHandling('pointerleave', 'pointer', { 
      pointerId: e.pointerId, 
      pointerType: e.pointerType,
      tool: currentToolRef.current 
    });

    // Always clean up states
    palmRejection.onPointerEnd(e.pointerId);
    panZoom.stopPan();
    
    // Call handlePointerUp for cleanup
    if (!stableIsReadOnly || currentToolRef.current === 'select') {
      const stage = stageRef.current;
      if (stage) {
        const konvaEvent = {
          evt: e,
          target: stage,
          currentTarget: stage,
          cancelBubble: false,
          type: e.type as any,
          pointerId: e.pointerId
        } as Konva.KonvaEventObject<PointerEvent>;
        handlePointerUp(konvaEvent);
      }
    }
  }, [logEventHandling, palmRejection, panZoom, stableIsReadOnly, stageRef, handlePointerUp]);

  const handleContextMenu = useCallback((e: Event) => {
    e.preventDefault();
  }, []);

  // CRITICAL: Single stable effect for pointer events with minimal dependencies
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    console.log('[StageEventHandlers] Setting up STABLE pointer event listeners');

    container.addEventListener('pointerdown', handlePointerDownEvent, { passive: false });
    container.addEventListener('pointermove', handlePointerMoveEvent, { passive: false });
    container.addEventListener('pointerup', handlePointerUpEvent, { passive: false });
    container.addEventListener('pointerleave', handlePointerLeaveEvent, { passive: false });
    container.addEventListener('pointercancel', handlePointerUpEvent, { passive: false });
    container.addEventListener('contextmenu', handleContextMenu);

    container.style.touchAction = 'none';

    return () => {
      console.log('[StageEventHandlers] Cleaning up STABLE pointer event listeners');
      container.removeEventListener('pointerdown', handlePointerDownEvent);
      container.removeEventListener('pointermove', handlePointerMoveEvent);
      container.removeEventListener('pointerup', handlePointerUpEvent);
      container.removeEventListener('pointerleave', handlePointerLeaveEvent);
      container.removeEventListener('pointercancel', handlePointerUpEvent);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.style.touchAction = '';
    };
  }, [
    // CRITICAL: Minimal stable dependencies only
    handlePointerDownEvent,
    handlePointerMoveEvent, 
    handlePointerUpEvent,
    handlePointerLeaveEvent,
    handleContextMenu
  ]);
};
