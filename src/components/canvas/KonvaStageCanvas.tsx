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
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('events');

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
    handleTouchStart: (e: any) => void;
    handleTouchMove: (e: any) => void;
    handleTouchEnd: (e: any) => void;
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
  select2TouchHandlers?: {
    onTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => void;
    onTouchMove: (e: Konva.KonvaEventObject<TouchEvent>) => void;
    onTouchEnd: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  };
  unifiedSelectionHandlers?: {
    onMouseDown: (e: any) => void;
    onMouseMove: (e: any) => void;
    onMouseUp: (e: any) => void;
    onTouchStart: (e: any) => void;
    onTouchMove: (e: any) => void;
    onTouchEnd: (e: any) => void;
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
  select2TouchHandlers,
  unifiedSelectionHandlers
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

  debugLog('KonvaStageCanvas', 'Rendering with unified selection support', {
    currentTool,
    hasUnifiedHandlers: !!unifiedSelectionHandlers,
    isSelectTool: currentTool === 'select' || currentTool === 'select2'
  });

  // Use unified selection handlers when available (for select/select2 tools)
  const stageEventHandlers = unifiedSelectionHandlers ? {
    onMouseDown: (e: any) => {
      // For select tools, let unified selection handle it, but allow fallback for other interactions
      if (currentTool === 'select' || currentTool === 'select2') {
        unifiedSelectionHandlers.onMouseDown(e);
      } else {
        handleMouseDown(e);
      }
    },
    onMouseMove: (e: any) => {
      if (currentTool === 'select' || currentTool === 'select2') {
        unifiedSelectionHandlers.onMouseMove(e);
      } else {
        handleMouseMove(e);
      }
    },
    onMouseUp: (e: any) => {
      if (currentTool === 'select' || currentTool === 'select2') {
        unifiedSelectionHandlers.onMouseUp(e);
      } else {
        handleMouseUp(e);
      }
    },
    onMouseLeave: (e: any) => {
      if (currentTool === 'select' || currentTool === 'select2') {
        unifiedSelectionHandlers.onMouseUp(e);
      } else {
        handleMouseUp(e);
      }
    },
    onTouchStart: (e: any) => {
      // Check for multi-touch gestures (pan/zoom)
      if (e.evt.touches.length > 1) {
        // Let pan/zoom handle multi-touch
        panZoom.handleTouchStart(e);
      } else if (currentTool === 'select' || currentTool === 'select2') {
        unifiedSelectionHandlers.onTouchStart(e);
      } else {
        handleTouchStart(e);
      }
    },
    onTouchMove: (e: any) => {
      if (e.evt.touches.length > 1) {
        // Let pan/zoom handle multi-touch
        panZoom.handleTouchMove(e);
      } else if (currentTool === 'select' || currentTool === 'select2') {
        unifiedSelectionHandlers.onTouchMove(e);
      }
    },
    onTouchEnd: (e: any) => {
      if (e.evt.touches.length === 0 || e.evt.touches.length > 1) {
        // Let pan/zoom handle end of multi-touch
        panZoom.handleTouchEnd(e);
      } else if (currentTool === 'select' || currentTool === 'select2') {
        unifiedSelectionHandlers.onTouchEnd(e);
      }
    }
  } : {
    // Default handlers for other tools
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
    onTouchStart: handleTouchStart
  };

  return (
    <Stage
      width={width}
      height={height}
      ref={stageRef}
      {...stageEventHandlers}
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
    </Stage>
  );
};

export default KonvaStageCanvas;
