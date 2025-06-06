
import React, { useRef, useEffect } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import LineRenderer from './LineRenderer';
import { UnifiedWhiteboardState } from '@/types/unifiedWhiteboard';

interface KonvaStageProps {
  width: number;
  height: number;
  whiteboardState: UnifiedWhiteboardState;
  isReadOnly?: boolean;
}

const KonvaStage: React.FC<KonvaStageProps> = ({
  width,
  height,
  whiteboardState,
  isReadOnly = false
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);

  const {
    state,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  } = whiteboardState;

  const getRelativePointerPosition = (stage: Konva.Stage) => {
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return { x: 0, y: 0 };

    const { x, y } = pointerPosition;
    const { x: stageX, y: stageY } = state.panZoomState;
    const scale = state.panZoomState.scale;

    return {
      x: (x - stageX) / scale,
      y: (y - stageY) / scale
    };
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isReadOnly) return;
    
    const stage = e.target.getStage();
    if (!stage) return;

    const { x, y } = getRelativePointerPosition(stage);
    handlePointerDown(x, y);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isReadOnly) return;
    
    const stage = e.target.getStage();
    if (!stage) return;

    const { x, y } = getRelativePointerPosition(stage);
    handlePointerMove(x, y);
  };

  const handleMouseUp = () => {
    if (isReadOnly) return;
    
    handlePointerUp();
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
      onTouchStart={(e) => {
        if (isReadOnly) return;
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;
        const { x, y } = getRelativePointerPosition(stage);
        handlePointerDown(x, y);
      }}
      onTouchMove={(e) => {
        if (isReadOnly) return;
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;
        const { x, y } = getRelativePointerPosition(stage);
        handlePointerMove(x, y);
      }}
      onTouchEnd={() => {
        if (isReadOnly) return;
        handlePointerUp();
      }}
      style={{ cursor: state.currentTool === 'eraser' ? 'crosshair' : 'default' }}
    >
      <Layer ref={layerRef}>
        {state.lines.map((line) => (
          <LineRenderer key={line.id} line={line} />
        ))}
      </Layer>
    </Stage>
  );
};

export default KonvaStage;
