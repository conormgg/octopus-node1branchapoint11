
import React, { useEffect, useRef } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { PanZoomState, Tool, SelectionBounds } from '@/types/whiteboard';
import { useNormalizedWhiteboardState } from '@/hooks/performance/useNormalizedWhiteboardState';
import { useMonitoringIntegration } from '@/hooks/performance/useMonitoringIntegration';
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
  // Disable performance monitoring during canvas initialization to prevent hangs
  const isInitializing = useRef(true);
  const { wrapRenderOperation } = useMonitoringIntegration(false, isInitializing.current);

  // Monitor canvas render performance with safety guards
  useEffect(() => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    
    try {
      console.log('[KonvaStageCanvas] Setting up render monitoring');
      
      // Only wrap draw method if monitoring is enabled and not initializing
      if (!isInitializing.current) {
        const originalDraw = stage.draw.bind(stage);
        stage.draw = wrapRenderOperation(originalDraw, 'canvas_render');
        
        console.log('[KonvaStageCanvas] Render monitoring enabled');
        
        return () => {
          // Restore original draw method on cleanup
          try {
            stage.draw = originalDraw;
            console.log('[KonvaStageCanvas] Render monitoring cleanup completed');
          } catch (error) {
            console.error('[KonvaStageCanvas] Render monitoring cleanup failed:', error);
          }
        };
      }
    } catch (error) {
      console.error('[KonvaStageCanvas] Failed to set up render monitoring:', error);
      // Continue without monitoring
    }
  }, [stageRef, wrapRenderOperation, isInitializing.current]);

  // Mark initialization as complete after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitializing.current = false;
      console.log('[KonvaStageCanvas] Initialization completed');
    }, 1000); // Wait 1 second before enabling monitoring
    
    return () => clearTimeout(timer);
  }, []);

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
        stageRef={stageRef}
      />
    </Stage>
  );
};

export default KonvaStageCanvas;
