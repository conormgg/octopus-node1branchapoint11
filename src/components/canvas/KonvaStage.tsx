
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
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPos, setPanStartPos] = useState({ x: 0, y: 0 });

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

  // Pan and zoom event handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      panZoom.handleWheel(e);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (panZoom.handlePanStart(e)) {
        setIsPanning(true);
        setPanStartPos({ x: e.clientX, y: e.clientY });
        container.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        const newPos = panZoom.handlePanMove(e, panStartPos);
        setPanStartPos(newPos);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isPanning && e.button === 2) {
        setIsPanning(false);
        container.style.cursor = 'default';
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent right-click context menu
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [panZoom, isPanning, panStartPos]);

  // Pointer event handlers with palm rejection
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isReadOnly || !palmRejectionConfig.enabled) return;

    const handlePointerDownEvent = (e: PointerEvent) => {
      // Don't start drawing if we're panning
      if (isPanning || e.button === 2) return;
      
      e.preventDefault();
      
      if (!palmRejection.shouldProcessPointer(e)) {
        console.log('Palm rejection: Ignoring pointer', e.pointerId, e.pointerType);
        return;
      }

      const stage = stageRef.current;
      if (!stage) return;

      const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
      handlePointerDown(x, y);
    };

    const handlePointerMoveEvent = (e: PointerEvent) => {
      // Don't draw if we're panning
      if (isPanning) return;
      
      e.preventDefault();
      
      if (!palmRejection.shouldProcessPointer(e)) return;

      const stage = stageRef.current;
      if (!stage) return;

      const { x, y } = getRelativePointerPosition(stage, e.clientX, e.clientY);
      handlePointerMove(x, y);
    };

    const handlePointerUpEvent = (e: PointerEvent) => {
      e.preventDefault();
      
      palmRejection.onPointerEnd(e.pointerId);
      
      // Always call handlePointerUp to complete any ongoing drawing
      handlePointerUp();
    };

    const handlePointerLeaveEvent = (e: PointerEvent) => {
      palmRejection.onPointerEnd(e.pointerId);
      handlePointerUp();
    };

    container.addEventListener('pointerdown', handlePointerDownEvent);
    container.addEventListener('pointermove', handlePointerMoveEvent);
    container.addEventListener('pointerup', handlePointerUpEvent);
    container.addEventListener('pointerleave', handlePointerLeaveEvent);
    container.addEventListener('pointercancel', handlePointerUpEvent);

    // Set touch-action to none for better pointer event handling
    container.style.touchAction = 'none';

    return () => {
      container.removeEventListener('pointerdown', handlePointerDownEvent);
      container.removeEventListener('pointermove', handlePointerMoveEvent);
      container.removeEventListener('pointerup', handlePointerUpEvent);
      container.removeEventListener('pointerleave', handlePointerLeaveEvent);
      container.removeEventListener('pointercancel', handlePointerUpEvent);
      container.style.touchAction = '';
    };
  }, [palmRejection, handlePointerDown, handlePointerMove, handlePointerUp, state.panZoomState, isReadOnly, palmRejectionConfig.enabled, isPanning]);

  // Fallback mouse handlers for devices without pointer events
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isReadOnly || palmRejectionConfig.enabled || isPanning || e.evt.button === 2) return;
    
    const stage = e.target.getStage();
    if (!stage) return;

    const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    handlePointerDown(x, y);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isReadOnly || palmRejectionConfig.enabled || isPanning) return;
    
    const stage = e.target.getStage();
    if (!stage) return;

    const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    handlePointerMove(x, y);
  };

  const handleMouseUp = () => {
    if (isReadOnly || palmRejectionConfig.enabled || isPanning) return;
    
    handlePointerUp();
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <Stage
        width={width}
        height={height}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : (state.currentTool === 'eraser' ? 'crosshair' : 'default') }}
        x={state.panZoomState.x}
        y={state.panZoomState.y}
        scaleX={state.panZoomState.scale}
        scaleY={state.panZoomState.scale}
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
