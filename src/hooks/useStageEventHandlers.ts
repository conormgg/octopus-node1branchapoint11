
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

  // Update current tool ref by tracking the stage attribute
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const updateTool = () => {
      const newTool = stage.getAttr('currentTool') as string;
      if (newTool && newTool !== currentToolRef.current) {
        currentToolRef.current = newTool;
        console.log('[StageEventHandlers] Tool updated to:', newTool);
        
        // Update touch-action when tool changes
        const container = containerRef.current;
        if (container) {
          container.style.touchAction = newTool === 'select' ? 'manipulation' : 'none';
        }
      }
    };
    
    // Initial update
    updateTool();
    
    // Check for updates - reduced frequency for better performance
    const interval = setInterval(updateTool, 100);
    
    return () => clearInterval(interval);
  }, [stageRef, containerRef]);

  // Wheel event handlers - always active for pan/zoom
  useWheelEventHandlers({
    containerRef,
    panZoom
  });

  // Touch events for pinch/pan - only for multi-touch gestures
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      logEventHandling('touchstart', 'touch', { touches: e.touches.length });
      
      // Only handle multi-touch gestures (2+ fingers) for pan/zoom
      if (e.touches.length >= 2) {
        console.log('[TouchEvents] Multi-touch detected, handling pan/zoom');
        e.preventDefault();
        panZoom.handleTouchStart(e);
      } else {
        console.log('[TouchEvents] Single touch detected, allowing for pointer events');
        // Don't prevent default - let it become a pointer event
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      logEventHandling('touchmove', 'touch', { touches: e.touches.length });
      
      // Only handle multi-touch gestures
      if (e.touches.length >= 2) {
        e.preventDefault();
        panZoom.handleTouchMove(e);
      }
      // Single touch moves are allowed to become pointer events
    };

    const handleTouchEnd = (e: TouchEvent) => {
      logEventHandling('touchend', 'touch', { 
        touches: e.touches.length,
        changedTouches: e.changedTouches.length 
      });
      
      // Only handle multi-touch scenarios
      if (e.touches.length >= 1 && e.changedTouches.length > 1) {
        e.preventDefault();
        panZoom.handleTouchEnd(e);
      }
      // Single touch end events become pointer events - don't prevent default
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

  // Pointer event handlers - the main drawing interface
  useEffect(() => {
    const container = containerRef.current;
    const stage = stageRef.current;
    if (!container || !stage) return;

    // Get direct access to whiteboard handlers if available
    const whiteboardHandlers = (handlePointerDown as any)?.__whiteboardHandlers;

    const handlePointerDownEvent = (e: PointerEvent) => {
      console.log('[PointerEvents] Pointer down:', {
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

      // Handle right-click pan for non-stylus devices
      if (e.pointerType !== 'pen' && e.button === 2) {
        console.log('[PointerEvents] Right-click pan initiated');
        e.preventDefault();
        panZoom.startPan(e.clientX, e.clientY);
        return;
      }
      
      // For select tool, let Konva handle events natively
      if (currentToolRef.current === 'select') {
        console.log('[PointerEvents] Select tool - letting Konva handle');
        return;
      }
      
      // Prevent default for drawing tools to avoid conflicts
      e.preventDefault();
      
      // Only proceed with drawing if not in read-only mode
      if (isReadOnly) {
        console.log('[PointerEvents] Read-only mode - skipping drawing');
        return;
      }
      
      // Apply palm rejection only if enabled
      if (palmRejectionConfig.enabled && !palmRejection.shouldProcessPointer(e)) {
        console.log('[PointerEvents] Palm rejection blocked pointer');
        return;
      }

      // Try direct coordinate handling first
      if (whiteboardHandlers?.handleDirectPointerDown) {
        console.log('[PointerEvents] Using direct coordinate handler');
        whiteboardHandlers.handleDirectPointerDown(e.clientX, e.clientY);
      } else {
        console.log('[PointerEvents] Using Konva event wrapper');
        // Fallback to Konva event wrapper
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

      // Handle right-click pan for non-stylus devices
      if (e.pointerType !== 'pen' && e.buttons === 2) {
        e.preventDefault();
        panZoom.continuePan(e.clientX, e.clientY);
        return;
      }
      
      // For select tool, let Konva handle events natively
      if (currentToolRef.current === 'select') {
        return;
      }
      
      // Prevent default for drawing tools
      e.preventDefault();
      
      // Only proceed with drawing if not in read-only mode
      if (isReadOnly) return;
      
      // Apply palm rejection only if enabled
      if (palmRejectionConfig.enabled && !palmRejection.shouldProcessPointer(e)) return;

      // Try direct coordinate handling first
      if (whiteboardHandlers?.handleDirectPointerMove) {
        whiteboardHandlers.handleDirectPointerMove(e.clientX, e.clientY);
      } else {
        // Fallback to Konva event wrapper
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
      console.log('[PointerEvents] Pointer up:', {
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

      // Handle right-click pan end for non-stylus devices
      if (e.pointerType !== 'pen' && e.button === 2) {
        e.preventDefault();
        panZoom.stopPan();
        return;
      }
      
      // Always clean up palm rejection state
      palmRejection.onPointerEnd(e.pointerId);
      
      // For select tool, let Konva handle events natively
      if (currentToolRef.current === 'select') {
        return;
      }
      
      // Prevent default for drawing tools
      e.preventDefault();
      
      // Only call handlePointerUp for drawing if not in read-only mode
      if (!isReadOnly) {
        console.log('[PointerEvents] Calling handlePointerUp for drawing');
        
        // Try direct coordinate handling first
        if (whiteboardHandlers?.handleDirectPointerUp) {
          whiteboardHandlers.handleDirectPointerUp();
        } else {
          // Fallback to Konva event wrapper
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
      logEventHandling('pointerleave', 'pointer', { 
        pointerId: e.pointerId, 
        pointerType: e.pointerType,
        tool: currentToolRef.current 
      });

      // Always clean up palm rejection state
      palmRejection.onPointerEnd(e.pointerId);
      panZoom.stopPan(); // Always stop pan on leave
      
      // For select tool, let Konva handle events natively
      if (currentToolRef.current === 'select') {
        return;
      }
      
      // Only call handlePointerUp for drawing if not in read-only mode
      if (!isReadOnly) {
        if (whiteboardHandlers?.handleDirectPointerUp) {
          whiteboardHandlers.handleDirectPointerUp();
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
      e.preventDefault(); // Prevent context menu on right-click
    };

    // Always add pointer event listeners
    console.log('[StageEventHandlers] Setting up pointer event listeners');
    container.addEventListener('pointerdown', handlePointerDownEvent, { passive: false });
    container.addEventListener('pointermove', handlePointerMoveEvent, { passive: false });
    container.addEventListener('pointerup', handlePointerUpEvent, { passive: false });
    container.addEventListener('pointerleave', handlePointerLeaveEvent, { passive: false });
    container.addEventListener('pointercancel', handlePointerUpEvent, { passive: false });
    container.addEventListener('contextmenu', handleContextMenu);

    // Set initial touch-action based on current tool
    container.style.touchAction = currentToolRef.current === 'select' ? 'manipulation' : 'none';

    return () => {
      console.log('[StageEventHandlers] Cleaning up pointer event listeners');
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
    palmRejection,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    panZoomState,
    isReadOnly,
    palmRejectionConfig.enabled,
    panZoom,
    logEventHandling
  ]);
};
