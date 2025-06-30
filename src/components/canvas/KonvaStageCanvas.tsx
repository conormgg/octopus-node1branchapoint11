
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
  // Transform container coordinates to world coordinates
  // This converts from screen/container space to the coordinate space that Konva uses
  const transformToWorldCoordinates = (point: { x: number; y: number }) => {
    // Convert container coordinates to world coordinates using the same logic as the zoom function
    // World position = (screen position - pan offset) / current scale
    const worldX = (point.x - panZoomState.x) / panZoomState.scale;
    const worldY = (point.y - panZoomState.y) / panZoomState.scale;
    
    return {
      x: worldX,
      y: worldY
    };
  };

  // Transform crosshair coordinates to world space
  const transformedDebugCenter = panZoom.debugCenterPoint ? transformToWorldCoordinates(panZoom.debugCenterPoint) : null;
  const transformedActualZoomFocal = panZoom.actualZoomFocalPoint ? transformToWorldCoordinates(panZoom.actualZoomFocalPoint) : null;
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
      {(transformedDebugCenter || transformedActualZoomFocal) && (
        <Layer>
          {/* Red crosshair to show calculated touch center point */}
          {transformedDebugCenter && (
            <>
              <Circle
                x={transformedDebugCenter.x}
                y={transformedDebugCenter.y}
                radius={8}
                stroke="red"
                strokeWidth={3}
                fill="rgba(255, 0, 0, 0.3)"
              />
              {/* Horizontal line */}
              <Line
                points={[
                  transformedDebugCenter.x - 15,
                  transformedDebugCenter.y,
                  transformedDebugCenter.x + 15,
                  transformedDebugCenter.y
                ]}
                stroke="red"
                strokeWidth={2}
              />
              {/* Vertical line */}
              <Line
                points={[
                  transformedDebugCenter.x,
                  transformedDebugCenter.y - 15,
                  transformedDebugCenter.x,
                  transformedDebugCenter.y + 15
                ]}
                stroke="red"
                strokeWidth={2}
              />
            </>
          )}
          
          {/* Blue crosshair to show actual zoom focal point */}
          {transformedActualZoomFocal && (
            <>
              <Circle
                x={transformedActualZoomFocal.x}
                y={transformedActualZoomFocal.y}
                radius={10}
                stroke="blue"
                strokeWidth={3}
                fill="rgba(0, 0, 255, 0.3)"
              />
              {/* Horizontal line */}
              <Line
                points={[
                  transformedActualZoomFocal.x - 20,
                  transformedActualZoomFocal.y,
                  transformedActualZoomFocal.x + 20,
                  transformedActualZoomFocal.y
                ]}
                stroke="blue"
                strokeWidth={3}
              />
              {/* Vertical line */}
              <Line
                points={[
                  transformedActualZoomFocal.x,
                  transformedActualZoomFocal.y - 20,
                  transformedActualZoomFocal.x,
                  transformedActualZoomFocal.y + 20
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
