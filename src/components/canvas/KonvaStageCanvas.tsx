
import React from 'react';
import { Stage, Layer, Circle, Line } from 'react-konva';
import Konva from 'konva';
import { PanZoomState, Tool, SelectionBounds } from '@/types/whiteboard';
import { useNormalizedWhiteboardState } from '@/hooks/performance/useNormalizedWhiteboardState';
import { useMouseEventHandlers } from './hooks/useMouseEventHandlers';
import { useTouchEventHandlers } from './hooks/useTouchEventHandlers';
import { useStageCursor } from './hooks/useStageCursor';
import ImagesLayer from './layers/ImagesLayer';
import LinesLayer from './layers/LinesLayer';

interface KonvaStageCanvasProps {
  width: number;
  height: number;
  stageRef: React.RefObject<Konva.Stage>;
  layerRef: React.RefObject<Konva.Layer>;
  lines: any[];
  images?: any[];
  currentTool: Tool;
  panZoomState: PanZoomState;
  palmRejectionConfig: {
    enabled: boolean;
  };
  panZoom: {
    startPan: (x: number, y: number) => void;
    continuePan: (x: number, y: number) => void;
    stopPan: () => void;
    debugCenterPoint?: { x: number; y: number } | null;
    actualZoomFocalPoint?: { x: number; y: number } | null;
  };
  handlePointerDown: (x: number, y: number) => void;
  handlePointerMove: (x: number, y: number) => void;
  handlePointerUp: () => void;
  isReadOnly: boolean;
  onStageClick?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  extraContent?: React.ReactNode;
  selectionBounds?: SelectionBounds | null;
  isSelecting?: boolean;
  selection?: any;
  onUpdateLine?: (lineId: string, updates: any) => void;
  onUpdateImage?: (imageId: string, updates: any) => void;
  onTransformEnd?: () => void;
  normalizedState?: ReturnType<typeof useNormalizedWhiteboardState>;
}

const KonvaStageCanvas: React.FC<KonvaStageCanvasProps> = ({
  width,
  height,
  stageRef,
  layerRef,
  lines,
  images = [],
  currentTool,
  panZoomState,
  palmRejectionConfig,
  panZoom,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isReadOnly,
  onStageClick,
  extraContent,
  selectionBounds,
  isSelecting = false,
  selection,
  onUpdateLine,
  onUpdateImage,
  onTransformEnd,
  normalizedState
}) => {
  const { handleMouseDown, handleMouseMove, handleMouseUp } = useMouseEventHandlers({
    currentTool,
    panZoomState,
    palmRejectionConfig,
    panZoom,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isReadOnly,
    onStageClick,
    selection
  });

  const { handleTouchStart } = useTouchEventHandlers({
    currentTool,
    palmRejectionConfig,
    onStageClick
  });

  const cursor = useStageCursor({ currentTool, selection });

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
      style={{ cursor }}
    >
      {/* Images layer - rendered first (behind) */}
      <ImagesLayer extraContent={extraContent} />
      
      {/* Lines layer - rendered second (on top) */}
      <LinesLayer
        layerRef={layerRef}
        lines={lines}
        images={images}
        currentTool={currentTool}
        selectionBounds={selectionBounds}
        isSelecting={isSelecting}
        selection={selection}
        normalizedState={normalizedState}
        onUpdateLine={onUpdateLine}
        onUpdateImage={onUpdateImage}
        onTransformEnd={onTransformEnd}
        stageRef={stageRef} // Pass stageRef for viewport calculations
      />
      
      {/* Debug layer - rendered on top for troubleshooting */}
      {(panZoom.debugCenterPoint || panZoom.actualZoomFocalPoint) && (
        <Layer>
          {/* Red crosshair to show calculated touch center point */}
          {panZoom.debugCenterPoint && (
            <>
              <Circle
                x={panZoom.debugCenterPoint.x}
                y={panZoom.debugCenterPoint.y}
                radius={8}
                stroke="red"
                strokeWidth={3}
                fill="rgba(255, 0, 0, 0.3)"
              />
              {/* Horizontal line */}
              <Line
                points={[
                  panZoom.debugCenterPoint.x - 15,
                  panZoom.debugCenterPoint.y,
                  panZoom.debugCenterPoint.x + 15,
                  panZoom.debugCenterPoint.y
                ]}
                stroke="red"
                strokeWidth={2}
              />
              {/* Vertical line */}
              <Line
                points={[
                  panZoom.debugCenterPoint.x,
                  panZoom.debugCenterPoint.y - 15,
                  panZoom.debugCenterPoint.x,
                  panZoom.debugCenterPoint.y + 15
                ]}
                stroke="red"
                strokeWidth={2}
              />
            </>
          )}
          
          {/* Blue crosshair to show actual zoom focal point */}
          {panZoom.actualZoomFocalPoint && (
            <>
              <Circle
                x={panZoom.actualZoomFocalPoint.x}
                y={panZoom.actualZoomFocalPoint.y}
                radius={10}
                stroke="blue"
                strokeWidth={3}
                fill="rgba(0, 0, 255, 0.3)"
              />
              {/* Horizontal line */}
              <Line
                points={[
                  panZoom.actualZoomFocalPoint.x - 20,
                  panZoom.actualZoomFocalPoint.y,
                  panZoom.actualZoomFocalPoint.x + 20,
                  panZoom.actualZoomFocalPoint.y
                ]}
                stroke="blue"
                strokeWidth={3}
              />
              {/* Vertical line */}
              <Line
                points={[
                  panZoom.actualZoomFocalPoint.x,
                  panZoom.actualZoomFocalPoint.y - 20,
                  panZoom.actualZoomFocalPoint.x,
                  panZoom.actualZoomFocalPoint.y + 20
                ]}
                stroke="blue"
                strokeWidth={3}
              />
            </>
          )}
        </Layer>
      )}
    </Stage>
  );
};

export default KonvaStageCanvas;
