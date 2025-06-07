
import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useWhiteboardState } from '@/hooks/useWhiteboardState';
import { usePalmRejection } from '@/hooks/usePalmRejection';
import LineRenderer from './LineRenderer';

interface KonvaStageProps {
  width: number;
  height: number;
  whiteboardState: ReturnType<typeof useWhiteboardState>;
  isReadOnly?: boolean;
  palmRejectionConfig?: {
    maxContactSize: number;
    minPressure: number;
    palmTimeoutMs: number;
    clusterDistance: number;
    preferStylus: boolean;
    enabled: boolean;
  };
}

const KonvaStage: React.FC<KonvaStageProps> = ({
  width,
  height,
  whiteboardState,
  isReadOnly = false,
  palmRejectionConfig = {
    maxContactSize: 40,
    minPressure: 0.1,
    palmTimeoutMs: 500,
    clusterDistance: 100,
    preferStylus: true,
    enabled: true
  }
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    panZoom
  } = whiteboardState;

  const palmRejection = usePalmRejection(palmRejectionConfig);

  const getRelativePointerPosition = (stage: Konva.Stage, clientX: number, clientY: number) => {
    const rect = stage.container().getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const { x: stageX, y: stageY } = state.panZoomState;
    const scale = state.panZoomState.scale;

    return {
      x: (x - stageX) / scale,
      y: (y - stageY) / scale
    };
  };

  // Apply pan/zoom transformations to the stage
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.x(state.panZoomState.x);
    stage.y(state.panZoomState.y);
    stage.scaleX(state.panZoomState.scale);
    stage.scaleY(state.panZoomState.scale);
  }, [state.panZoomState]);

  // Wheel event for zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', panZoom.handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', panZoom.handleWheel);
    };
  }, [panZoom.handleWheel]);

  // Touch events for pinch/pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // Prevent iOS context menu
      panZoom.handleTouchStart(e);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // Prevent scrolling and selection
      panZoom.handleTouchMove(e);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault(); // Prevent default touch behaviors
      panZoom.handleTouchEnd(e);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [panZoom.handleTouchStart, panZoom.handleTouchMove, panZoom.handleTouchEnd]);

  // Pointer event handlers with palm rejection and pan/zoom integration
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isReadOnly) return;

    const handlePointerDownEvent = (e: PointerEvent) => {
      e.preventDefault();
      
      // Handle right-click pan
      if (e.button === 2) {
        panZoom.startPan(e.clientX, e.clientY);
        return;
      }
      
      // Don't process drawing if palm rejection is enabled and rejects this pointer
      if (palmRejectionConfig.enabled && !palmRejection.shouldProcessPointer(e)) {
        console.log('Palm rejection: Ignoring pointer', e.pointerId, e.pointerType);
        return;
      }

      const stage = stageRef.current;
      if (!stage) return;

      const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
      handlePointerDown(x, y);
    };

    const handlePointerMoveEvent = (e: PointerEvent) => {
      e.preventDefault();
      
      // Handle right-click pan
      if (e.buttons === 2) {
        panZoom.continuePan(e.clientX, e.clientY);
        return;
      }
      
      // Don't process drawing if palm rejection rejects this pointer
      if (palmRejectionConfig.enabled && !palmRejection.shouldProcessPointer(e)) return;

      const stage = stageRef.current;
      if (!stage) return;

      const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
      handlePointerMove(x, y);
    };

    const handlePointerUpEvent = (e: PointerEvent) => {
      e.preventDefault();
      
      // Handle right-click pan end
      if (e.button === 2) {
        panZoom.stopPan();
        return;
      }
      
      palmRejection.onPointerEnd(e.pointerId);
      
      // Always call handlePointerUp to complete any ongoing drawing
      handlePointerUp();
    };

    const handlePointerLeaveEvent = (e: PointerEvent) => {
      palmRejection.onPointerEnd(e.pointerId);
      panZoom.stopPan();
      handlePointerUp();
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault(); // Prevent context menu on right-click
    };

    container.addEventListener('pointerdown', handlePointerDownEvent);
    container.addEventListener('pointermove', handlePointerMoveEvent);
    container.addEventListener('pointerup', handlePointerUpEvent);
    container.addEventListener('pointerleave', handlePointerLeaveEvent);
    container.addEventListener('pointercancel', handlePointerUpEvent);
    container.addEventListener('contextmenu', handleContextMenu);

    // Set touch-action to none for better pointer event handling
    container.style.touchAction = 'none';

    return () => {
      container.removeEventListener('pointerdown', handlePointerDownEvent);
      container.removeEventListener('pointermove', handlePointerMoveEvent);
      container.removeEventListener('pointerup', handlePointerUpEvent);
      container.removeEventListener('pointerleave', handlePointerLeaveEvent);
      container.removeEventListener('pointercancel', handlePointerUpEvent);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.style.touchAction = '';
    };
  }, [palmRejection, handlePointerDown, handlePointerMove, handlePointerUp, state.panZoomState, isReadOnly, palmRejectionConfig.enabled, panZoom]);

  // Fallback mouse handlers for devices without pointer events
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isReadOnly || palmRejectionConfig.enabled) return; // Use pointer events when palm rejection is enabled
    
    // Handle right-click pan
    if (e.evt.button === 2) {
      panZoom.startPan(e.evt.clientX, e.evt.clientY);
      return;
    }
    
    const stage = e.target.getStage();
    if (!stage) return;

    const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    handlePointerDown(x, y);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isReadOnly || palmRejectionConfig.enabled) return;
    
    // Handle right-click pan
    if (e.evt.buttons === 2) {
      panZoom.continuePan(e.evt.clientX, e.evt.clientY);
      return;
    }
    
    const stage = e.target.getStage();
    if (!stage) return;

    const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    handlePointerMove(x, y);
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isReadOnly || palmRejectionConfig.enabled) return;
    
    // Handle right-click pan end
    if (e.evt.button === 2) {
      panZoom.stopPan();
      return;
    }
    
    handlePointerUp();
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full select-none" 
      style={{ 
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: 'none'
      }}
    >
      <Stage
        width={width}
        height={height}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: state.currentTool === 'eraser' ? 'crosshair' : 'default' }}
      >
        <Layer ref={layerRef}>
          {state.lines.map((line) => (
            <LineRenderer key={line.id} line={line} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default KonvaStage;
