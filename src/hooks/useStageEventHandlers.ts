
import { useEffect, useRef } from 'react';
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

  // Track current tool more efficiently
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
    const interval = setInterval(updateTool, 100);
    return () => clearInterval(interval);
  }, [stageRef]);

  // Wheel events for pan/zoom
  useWheelEventHandlers({
    containerRef,
    panZoom
  });

  // Touch events - only for multi-touch gestures
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      console.log('[TouchEvents] Touch start:', e.touches.length, 'touches');
      logEventHandling('touchstart', 'touch', { touches: e.touches.length });
      
      if (e.touches.length >= 2) {
        console.log('[TouchEvents] Multi-touch detected - handling pan/zoom');
        e.preventDefault();
        panZoom.handleTouchStart(e);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      logEventHandling('touchmove', 'touch', { touches: e.touches.length });
      
      if (e.touches.length >= 2) {
        e.preventDefault();
        panZoom.handleTouchMove(e);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      logEventHandling('touchend', 'touch', { 
        touches: e.touches.length,
        changedTouches: e.changedTouches.length 
      });
      
      if (e.touches.length >= 1 && e.changedTouches.length > 1) {
        e.preventDefault();
        panZoom.handleTouchEnd(e);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [panZoom, logEventHandling]);

  // SIMPLIFIED POINTER EVENT HANDLERS - Remove complex branching
  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    console.log('[StageEventHandlers] Setting up simplified pointer event listeners');

    // Get direct handlers if available
    const directHandlers = (handlePointerDown as any)?.__whiteboardHandlers;

    const handlePointerDownEvent = (e: PointerEvent) => {
      console.log('[PointerEvents] SIMPLIFIED - Pointer down:', {
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        button: e.button,
        tool: currentToolRef.current,
        clientX: e.clientX,
        clientY: e.clientY
      });

      logEventHandling('pointerdown', 'pointer', { 
        pointerId: e.pointerId, 
        pointerType: e.pointerType,
        button: e.button,
        tool: currentToolRef.current 
      });

      // Handle right-click pan ONLY for non-stylus
      if (e.pointerType !== 'pen' && e.button === 2) {
        console.log('[PointerEvents] Right-click pan initiated');
        e.preventDefault();
        panZoom.startPan(e.clientX, e.clientY);
        return;
      }
      
      // For drawing tools, skip read-only check and pan/zoom interference
      const isDrawingTool = ['pencil', 'highlighter', 'eraser'].includes(currentToolRef.current);
      
      if (isDrawingTool && isReadOnly) {
        console.log('[PointerEvents] Read-only mode - blocking drawing');
        return;
      }

      // Apply palm rejection ONLY if enabled
      if (palmRejectionConfig.enabled && !palmRejection.shouldProcessPointer(e)) {
        console.log('[PointerEvents] Palm rejection blocked pointer');
        return;
      }

      // ALWAYS prevent default after checks for drawing tools
      if (isDrawingTool) {
        e.preventDefault();
      }

      // Use direct handlers if available, otherwise fallback to Konva wrapper
      if (directHandlers?.handleDirectPointerDown) {
        console.log('[PointerEvents] Using direct coordinate handler for pointer down');
        directHandlers.handleDirectPointerDown(e.clientX, e.clientY);
      } else {
        console.log('[PointerEvents] Using Konva event wrapper for pointer down');
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
    };

    const handlePointerMoveEvent = (e: PointerEvent) => {
      logEventHandling('pointermove', 'pointer', { 
        pointerId: e.pointerId, 
        pointerType: e.pointerType,
        buttons: e.buttons,
        tool: currentToolRef.current 
      });

      // Handle right-click pan ONLY for non-stylus
      if (e.pointerType !== 'pen' && e.buttons === 2) {
        e.preventDefault();
        panZoom.continuePan(e.clientX, e.clientY);
        return;
      }
      
      const isDrawingTool = ['pencil', 'highlighter', 'eraser'].includes(currentToolRef.current);
      
      if (isDrawingTool && isReadOnly) {
        return;
      }

      // Apply palm rejection ONLY if enabled
      if (palmRejectionConfig.enabled && !palmRejection.shouldProcessPointer(e)) {
        return;
      }

      // ALWAYS prevent default after checks for drawing tools
      if (isDrawingTool) {
        e.preventDefault();
      }

      // Use direct handlers if available
      if (directHandlers?.handleDirectPointerMove) {
        console.log('[PointerEvents] Using direct coordinate handler for pointer move');
        directHandlers.handleDirectPointerMove(e.clientX, e.clientY);
      } else {
        console.log('[PointerEvents] Using Konva event wrapper for pointer move');
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
    };

    const handlePointerUpEvent = (e: PointerEvent) => {
      console.log('[PointerEvents] SIMPLIFIED - Pointer up:', {
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

      // Handle right-click pan end ONLY for non-stylus
      if (e.pointerType !== 'pen' && e.button === 2) {
        e.preventDefault();
        panZoom.stopPan();
        return;
      }
      
      // ALWAYS clean up palm rejection state
      palmRejection.onPointerEnd(e.pointerId);
      
      const isDrawingTool = ['pencil', 'highlighter', 'eraser'].includes(currentToolRef.current);
      
      // ALWAYS prevent default after palm rejection cleanup for drawing tools
      if (isDrawingTool) {
        e.preventDefault();
      }
      
      // Call handlePointerUp for all tools (including selection) when appropriate
      if (!isReadOnly || currentToolRef.current === 'select') {
        if (directHandlers?.handleDirectPointerUp) {
          console.log('[PointerEvents] Using direct coordinate handler for pointer up');
          directHandlers.handleDirectPointerUp();
        } else {
          console.log('[PointerEvents] Using Konva event wrapper for pointer up');
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
    };

    const handlePointerLeaveEvent = (e: PointerEvent) => {
      console.log('[PointerEvents] Pointer leave - cleaning up');
      logEventHandling('pointerleave', 'pointer', { 
        pointerId: e.pointerId, 
        pointerType: e.pointerType,
        tool: currentToolRef.current 
      });

      // ALWAYS clean up states
      palmRejection.onPointerEnd(e.pointerId);
      panZoom.stopPan();
      
      // Call handlePointerUp for cleanup
      if (!isReadOnly || currentToolRef.current === 'select') {
        if (directHandlers?.handleDirectPointerUp) {
          directHandlers.handleDirectPointerUp();
        } else {
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
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };

    // Add all pointer event listeners
    container.addEventListener('pointerdown', handlePointerDownEvent, { passive: false });
    container.addEventListener('pointermove', handlePointerMoveEvent, { passive: false });
    container.addEventListener('pointerup', handlePointerUpEvent, { passive: false });
    container.addEventListener('pointerleave', handlePointerLeaveEvent, { passive: false });
    container.addEventListener('pointercancel', handlePointerUpEvent, { passive: false });
    container.addEventListener('contextmenu', handleContextMenu);

    // Set appropriate touch-action
    container.style.touchAction = 'none';

    return () => {
      console.log('[StageEventHandlers] Cleaning up simplified pointer event listeners');
      container.removeEventListener('pointerdown', handlePointerDownEvent);
      container.removeEventListener('pointermove', handlePointerMoveEvent);
      container.removeEventListener('pointerup', handlePointerUpEvent);
      container.removeEventListener('pointerleave', handlePointerLeaveEvent);
      container.removeEventListener('pointercancel', handlePointerUpEvent);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.style.touchAction = '';
    };
  }, [
    containerRef,
    stageRef,
    isReadOnly,
    palmRejectionConfig.enabled,
    palmRejection,
    panZoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    logEventHandling
  ]);
};
