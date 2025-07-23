import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { Tool, LineObject, ImageObject } from '@/types/whiteboard';
import { useSelect2EventHandlers } from '@/hooks/useSelect2EventHandlers';
import { useUnifiedSelection } from '@/hooks/useUnifiedSelection';
import LinesLayer from './layers/LinesLayer';
import ImagesLayer from './layers/ImagesLayer';
import KonvaImageOperationsHandler from './KonvaImageOperationsHandler';
import Select2Renderer from './Select2Renderer';

interface KonvaStageProps {
  width: number;
  height: number;
  whiteboardState: any;
  onCanvasMount?: (stage: Konva.Stage) => void;
  onLineUpdate?: (lineId: string, updates: Partial<LineObject>) => void;
  onImagePaste?: (image: ImageObject) => void;
  onUpdateLine?: (lineId: string, updates: Partial<LineObject>) => void;
  onUpdateImage?: (imageId: string, updates: Partial<ImageObject>) => void;
  onImageContextMenu?: (imageId: string, x: number, y: number) => void;
  onDeleteObjects?: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const KonvaStage: React.FC<KonvaStageProps> = ({
  width,
  height,
  whiteboardState,
  onCanvasMount,
  onImagePaste,
  onUpdateLine,
  onUpdateImage,
  onImageContextMenu,
  onDeleteObjects,
  containerRef,
  ...props
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const linesLayerRef = useRef<Konva.Layer>(null);
  const [isDraggable, setIsDraggable] = useState(false);

  // Unified selection hook
  const { shouldRenderUnifiedSelection } = useUnifiedSelection();

  // Mount callback
  useEffect(() => {
    if (stageRef.current && onCanvasMount) {
      onCanvasMount(stageRef.current);
    }
  }, [stageRef, onCanvasMount]);

  // Konva Event Handlers - Unified Select
  const {
    select2State,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleStageClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    clearSelection,
    deleteSelectedObjects
  } = useSelect2EventHandlers({
    stageRef,
    lines: whiteboardState.state.lines,
    images: whiteboardState.state.images,
    panZoomState: whiteboardState.state.panZoomState,
    onUpdateLine,
    onUpdateImage,
    onDeleteObjects,
    containerRef,
    mainSelection: whiteboardState.selection
  });

  // Event handlers for the Konva Stage
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    whiteboardState.panZoom.handleWheel(e.evt);
  }, [whiteboardState.panZoom]);

  const handleDragStart = useCallback(() => {
    setIsDraggable(true);
  }, []);

  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    whiteboardState.panZoom.handleDrag(e.target.x(), e.target.y());
  }, [whiteboardState.panZoom]);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    setIsDraggable(false);
    whiteboardState.panZoom.handleDragEnd(e.target.x(), e.target.y());
  }, [whiteboardState.panZoom]);

  const handleTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const stage = e.target.getStage();
      if (stage) {
        const pointerPosition = stage.getPointerPosition();
        if (pointerPosition) {
          handlePointerDown(pointerPosition.x, pointerPosition.y);
        }
      }
    }
  }, [handlePointerDown]);

  const handleTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const stage = e.target.getStage();
      if (stage) {
        const pointerPosition = stage.getPointerPosition();
        if (pointerPosition) {
          handlePointerMove(pointerPosition.x, pointerPosition.y);
        }
      }
    }
  }, [handlePointerMove]);

  const handleTouchEnd = useCallback(() => {
    handlePointerUp();
  }, [handlePointerUp]);

  // Keyboard event listeners for delete
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelectedObjects();
      }
    };

    containerRef?.current?.addEventListener('keydown', handleKeyDown);
    return () => {
      containerRef?.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, deleteSelectedObjects]);

  // Unified Select Event Handlers
  const eventHandlers = {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onClick: handleStageClick
  };

  return (
    <div className="w-full h-full overflow-hidden">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        x={whiteboardState.state.panZoomState.x}
        y={whiteboardState.state.panZoomState.y}
        scaleX={whiteboardState.state.panZoomState.scale}
        scaleY={whiteboardState.state.panZoomState.scale}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        draggable={isDraggable}
        {...eventHandlers}
      >
        {/* Lines Layer */}
        <LinesLayer
          layerRef={linesLayerRef}
          lines={whiteboardState.state.lines}
          images={whiteboardState.state.images}
          currentTool={whiteboardState.state.currentTool}
          onUpdateLine={onUpdateLine}
          onUpdateImage={onUpdateImage}
          onTransformEnd={whiteboardState.addToHistory}
          normalizedState={whiteboardState.normalizedState}
        />

        {/* Images Layer */}
        <ImagesLayer>
          <KonvaImageOperationsHandler
            whiteboardState={whiteboardState}
            onImageContextMenu={onImageContextMenu}
          />
        </ImagesLayer>

        {/* Unified Selection Layer */}
        <Layer>
          {shouldRenderUnifiedSelection && (
            <Select2Renderer
              selectedObjects={select2State.select2State.selectedObjects}
              hoveredObjectId={select2State.select2State.hoveredObjectId}
              selectionBounds={select2State.select2State.selectionBounds}
              isSelecting={select2State.select2State.isSelecting}
              lines={whiteboardState.state.lines}
              images={whiteboardState.state.images}
              groupBounds={select2State.select2State.groupBounds}
              dragOffset={select2State.select2State.dragOffset}
              isDraggingObjects={select2State.select2State.isDraggingObjects}
              currentTool={whiteboardState.state.currentTool}
              onUpdateLine={onUpdateLine}
              onUpdateImage={onUpdateImage}
              onTransformEnd={whiteboardState.addToHistory}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default KonvaStage;
