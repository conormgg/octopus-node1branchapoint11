
import React from 'react';
import { Stage, Layer, Circle, Line } from 'react-konva';
import Konva from 'konva';
import { PanZoomState, Tool, SelectionBounds } from '@/types/whiteboard';
import { coordinateBuffer } from '@/hooks/coordinateDebugBuffer';
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
    debugFingerPoints?: { x: number; y: number }[] | null;
    debugDrawingCoordinates?: { x: number; y: number }[] | null;
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
  // Transform container coordinates appropriately based on view type
  const transformCrosshairCoordinates = (point: { x: number; y: number }) => {
    // Get the stage element to determine the actual rendered size
    const stage = stageRef.current;
    if (!stage) {
      console.log('[DEBUG] No stage ref available');
      return point;
    }
    
    const stageContainer = stage.container();
    if (!stageContainer) {
      console.log('[DEBUG] No stage container available');
      return point;
    }
    
    const containerRect = stageContainer.getBoundingClientRect();
    
    // Check if we're in minimized view (container is smaller than canvas)
    const isMinimizedView = containerRect.width < width || containerRect.height < height;
    
    // DEBUG: Log all the coordinate information
    console.log('[DEBUG] Crosshair coordinate transformation:', {
      originalPoint: point,
      containerRect: {
        width: containerRect.width,
        height: containerRect.height,
        left: containerRect.left,
        top: containerRect.top
      },
      canvasSize: { width, height },
      isMinimizedView,
      panZoomState
    });
    
    // Add visual debug border to the stage container
    if (stageContainer && stageContainer.style) {
      stageContainer.style.border = '3px solid yellow';
      stageContainer.style.boxSizing = 'border-box';
    }
    
    if (isMinimizedView) {
      // For minimized view: scale container coordinates to logical canvas coordinates
      // Direct 1:1 mapping to world coordinates (no viewport scaling)
      // Direct 1:1 coordinate mapping (viewport to world)
      const scaledX = point.x;
      const scaledY = point.y;
      console.log('[DEBUG] Using minimized view mode - scaling coordinates:', {
        original: point,
        containerRect: { width: containerRect.width, height: containerRect.height },
        canvasSize: { width, height },
        scaled: { x: scaledX, y: scaledY }
      });
      return { x: scaledX, y: scaledY };
    } else {
      // For maximized view: apply world coordinate transformation
      // Convert canvas coordinates to world coordinates using the same logic as the zoom function
      // World position = (canvas position - pan offset) / current scale
      const worldX = (point.x - panZoomState.x) / panZoomState.scale;
      const worldY = (point.y - panZoomState.y) / panZoomState.scale;
      
      const transformedPoint = { x: worldX, y: worldY };
      console.log('[DEBUG] Using maximized view mode - applying world transformation:', {
        original: point,
        transformed: transformedPoint
      });
      
      return transformedPoint;
    }
  };

  // Transform crosshair coordinates appropriately based on view type
  const transformedDebugCenter = panZoom.debugCenterPoint ? transformCrosshairCoordinates(panZoom.debugCenterPoint) : null;
  const transformedActualZoomFocal = panZoom.actualZoomFocalPoint ? transformCrosshairCoordinates(panZoom.actualZoomFocalPoint) : null;

  // Use the debug drawing coordinates which simulate actual drawing coordinates
  const transformedDebugFingerPoints = Array.isArray(panZoom.debugDrawingCoordinates)
    ? panZoom.debugDrawingCoordinates
    : [];

  // Check if crosshairs are within visible bounds for minimized view
  const isPointWithinBounds = (point: { x: number; y: number }) => {
    const stage = stageRef.current;
    if (!stage) return true;
    
    const stageContainer = stage.container();
    if (!stageContainer) return true;
    
    const containerRect = stageContainer.getBoundingClientRect();
    const isMinimizedView = containerRect.width < width || containerRect.height < height;
    
    if (isMinimizedView) {
      // For minimized view, check if point is within the visible container bounds
      return point.x >= 0 && point.x <= containerRect.width && 
             point.y >= 0 && point.y <= containerRect.height;
    }
    
    // For maximized view, allow all points
    return true;
  };

  // Only show crosshairs if they're within visible bounds
  const visibleDebugCenter = transformedDebugCenter && isPointWithinBounds(transformedDebugCenter) ? transformedDebugCenter : null;
  const visibleActualZoomFocal = transformedActualZoomFocal && isPointWithinBounds(transformedActualZoomFocal) ? transformedActualZoomFocal : null;
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

  const { handleTouchStart: rawHandleTouchStart } = useTouchEventHandlers(
    {
      currentTool,
      palmRejectionConfig,
      onStageClick
    },
    undefined,
    stageRef,
    panZoomState
  );
  // Wrap to extract native event for compatibility with Konva
  const handleTouchStart = (evt: any) => {
    if (rawHandleTouchStart) {
      rawHandleTouchStart(evt.evt || evt);
    }
  };

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
      {(visibleDebugCenter || visibleActualZoomFocal || transformedDebugFingerPoints.length > 0) && (
        <Layer>
          {/* Dots for each finger (green) - using simulated drawing coordinates */}
          {transformedDebugFingerPoints.map((pt, idx) => {
            // Convert main board coordinates back to minimized board space
            let displayX = pt.x;
            let displayY = pt.y;
            
            // Get the board rect/scale from coordinate buffer
            const coordData = coordinateBuffer.pinch?.[idx] || coordinateBuffer.drawA;
            if (coordData?.boardRect && coordData?.boardScale) {
              displayX = (displayX - coordData.boardRect.left) / coordData.boardScale;
              displayY = (displayY - coordData.boardRect.top) / coordData.boardScale;
            }

            return (
              <Circle
                key={`debug-drawing-${idx}`}
                x={displayX}
                y={displayY}
                radius={10}
                stroke="green"
                strokeWidth={3}
                fill="rgba(0, 255, 0, 0.3)"
              />
            );
          })}
          {/* Red crosshair to show calculated touch center point */}
          {visibleDebugCenter && (
            <>
              <Circle
                x={visibleDebugCenter.x}
                y={visibleDebugCenter.y}
                radius={8}
                stroke="red"
                strokeWidth={3}
                fill="rgba(255, 0, 0, 0.3)"
              />
              {/* Horizontal line */}
              <Line
                points={[
                  visibleDebugCenter.x - 15,
                  visibleDebugCenter.y,
                  visibleDebugCenter.x + 15,
                  visibleDebugCenter.y
                ]}
                stroke="red"
                strokeWidth={2}
              />
              {/* Vertical line */}
              <Line
                points={[
                  visibleDebugCenter.x,
                  visibleDebugCenter.y - 15,
                  visibleDebugCenter.x,
                  visibleDebugCenter.y + 15
                ]}
                stroke="red"
                strokeWidth={2}
              />
            </>
          )}
          
          {/* Blue crosshair to show actual zoom focal point */}
          {visibleActualZoomFocal && (
            <>
              <Circle
                x={visibleActualZoomFocal.x}
                y={visibleActualZoomFocal.y}
                radius={10}
                stroke="blue"
                strokeWidth={3}
                fill="rgba(0, 0, 255, 0.3)"
              />
              {/* Horizontal line */}
              <Line
                points={[
                  visibleActualZoomFocal.x - 20,
                  visibleActualZoomFocal.y,
                  visibleActualZoomFocal.x + 20,
                  visibleActualZoomFocal.y
                ]}
                stroke="blue"
                strokeWidth={3}
              />
              {/* Vertical line */}
              <Line
                points={[
                  visibleActualZoomFocal.x,
                  visibleActualZoomFocal.y - 20,
                  visibleActualZoomFocal.x,
                  visibleActualZoomFocal.y + 20
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
