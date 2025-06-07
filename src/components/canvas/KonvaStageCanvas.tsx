
import React from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useStageCoordinates } from '@/hooks/useStageCoordinates';
import { PanZoomState, Tool } from '@/types/whiteboard';
import LineRenderer from './LineRenderer';

interface KonvaStageCanvasProps {
  width: number;
  height: number;
  stageRef: React.RefObject<Konva.Stage>;
  layerRef: React.RefObject<Konva.Layer>;
  lines: any[];
  currentTool: Tool;
  panZoomState: PanZoomState;
  palmRejectionConfig: {
    enabled: boolean;
  };
  panZoom: {
    startPan: (x: number, y: number) => void;
    continuePan: (x: number, y: number) => void;
    stopPan: () => void;
  };
  handlePointerDown: (x: number, y: number) => void;
  handlePointerMove: (x: number, y: number) => void;
  handlePointerUp: () => void;
  isReadOnly: boolean;
  onStageClick?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  extraContent?: React.ReactNode;
}

const KonvaStageCanvas: React.FC<KonvaStageCanvasProps> = ({
  width,
  height,
  stageRef,
  layerRef,
  lines,
  currentTool,
  panZoomState,
  palmRejectionConfig,
  panZoom,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isReadOnly,
  onStageClick,
  extraContent
}) => {
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  // Fallback mouse handlers for devices without pointer events
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (onStageClick) onStageClick(e);
    
    if (isReadOnly || palmRejectionConfig.enabled) return;
    
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

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (onStageClick) onStageClick(e);
  };

  return (
    <Stage
      width={width}
      height={height}
      ref={stageRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      style={{ cursor: currentTool === 'eraser' ? 'crosshair' : 'default' }}
    >
      <Layer ref={layerRef}>
        {lines.map((line) => (
          <LineRenderer key={line.id} line={line} />
        ))}
        {extraContent}
      </Layer>
    </Stage>
  );
};

export default KonvaStageCanvas;
