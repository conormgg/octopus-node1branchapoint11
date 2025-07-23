import React, { useRef } from 'react';
import Konva from 'konva';
import { Stage, Layer } from 'react-konva';
import { useSharedWhiteboardState } from '@/hooks/useSharedWhiteboardState';
import LinesList from './layers/LinesList';
import { SelectRenderer } from './SelectRenderer';

interface KonvaStageProps {
  width: number;
  height: number;
  whiteboardState: ReturnType<typeof useSharedWhiteboardState>;
  isReadOnly?: boolean;
  palmRejectionConfig?: any;
  normalizedState?: any;
}

const KonvaStage: React.FC<KonvaStageProps> = ({
  width,
  height,
  whiteboardState,
  isReadOnly = false,
  palmRejectionConfig,
  normalizedState
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  
  const { state } = whiteboardState;
  const currentTool = state.currentTool;
  const isDrawing = state.isDrawing;

  const renderLines = () => {
    return (
      <LinesList
        lines={normalizedState?.linesArray || state.lines}
      />
    );
  };

  const renderSelectVisuals = () => {
    if (currentTool !== 'select') return null;

    return (
      <SelectRenderer
        selectedObjects={[]}
        hoveredObjectId={null}
        selectionBounds={null}
        isSelecting={false}
        lines={state.lines}
        images={state.images}
        groupBounds={null}
        dragOffset={null}
        isDraggingObjects={false}
      />
    );
  };

  return (
    <Stage
      width={width}
      height={height}
      style={{
        backgroundColor: '#fff',
        touchAction: 'none',
        cursor: isDrawing ? 'crosshair' : currentTool === 'eraser' ? 'grab' : currentTool === 'select' ? 'pointer' : 'default'
      }}
      ref={stageRef}
      scaleX={state.panZoomState.scale}
      scaleY={state.panZoomState.scale}
      x={state.panZoomState.x}
      y={state.panZoomState.y}
      onPointerDown={(e) => {
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos && whiteboardState.handlePointerDown) whiteboardState.handlePointerDown(pos.x, pos.y);
      }}
      onPointerMove={(e) => {
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos && whiteboardState.handlePointerMove) whiteboardState.handlePointerMove(pos.x, pos.y);
      }}
      onPointerUp={(e) => {
        if (whiteboardState.handlePointerUp) whiteboardState.handlePointerUp();
      }}
    >
      <Layer>
        {renderLines()}
        {renderSelectVisuals()}
      </Layer>
    </Stage>
  );
};

export default KonvaStage;
