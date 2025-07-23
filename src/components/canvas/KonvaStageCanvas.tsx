
import React from 'react';
import { Stage } from 'react-konva';
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
  select2MouseHandlers?: {
    onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
    onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => void;
    onMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  };
  // Add select2 state props
  select2State?: {
    selectedObjects: Array<{id: string, type: 'line' | 'image'}>;
    hoveredObjectId: string | null;
    isObjectSelected: (id: string) => boolean;
    selectObjects: (objects: Array<{id: string, type: 'line' | 'image'}>) => void;
    setHoveredObjectId: (id: string | null) => void;
  };
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
  normalizedState,
  select2MouseHandlers,
  select2State
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

  // Use select2 mouse handlers when select2 tool is active, otherwise use default handlers
  const stageMouseHandlers = currentTool === 'select2' && select2MouseHandlers ? {
    onMouseDown: select2MouseHandlers.onMouseDown,
    onMouseMove: select2MouseHandlers.onMouseMove,
    onMouseUp: select2MouseHandlers.onMouseUp,
    onMouseLeave: select2MouseHandlers.onMouseUp
  } : {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp
  };

  // Create a unified selection interface that works for both select and select2
  const unifiedSelection = select2State ? {
    isObjectSelected: select2State.isObjectSelected,
    hoveredObjectId: select2State.hoveredObjectId,
    selectObjects: select2State.selectObjects,
    setHoveredObjectId: select2State.setHoveredObjectId
  } : selection;

  return (
    <Stage
      width={width}
      height={height}
      ref={stageRef}
      {...stageMouseHandlers}
      onTouchStart={handleTouchStart}
      style={{ cursor }}
    >
      {/* Images layer - rendered first (behind) */}
      <ImagesLayer 
        images={images}
        currentTool={currentTool}
        selection={unifiedSelection}
        onUpdateImage={onUpdateImage}
        onUpdateState={onTransformEnd}
        extraContent={extraContent}
      />
      
      {/* Lines layer - rendered second (on top) */}
      <LinesLayer
        layerRef={layerRef}
        lines={lines}
        images={images}
        currentTool={currentTool}
        selectionBounds={selectionBounds}
        isSelecting={isSelecting}
        selection={unifiedSelection}
        normalizedState={normalizedState}
        onUpdateLine={onUpdateLine}
        onUpdateImage={onUpdateImage}
        onTransformEnd={onTransformEnd}
      />
    </Stage>
  );
};

export default KonvaStageCanvas;
