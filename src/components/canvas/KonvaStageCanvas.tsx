import React from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import LinesList from './layers/LinesList';
import SelectionRect from './SelectionRect';
import { Tool } from '@/types/whiteboard';

interface KonvaStageCanvasProps {
  width: number;
  height: number;
  stageRef: React.RefObject<Konva.Stage>;
  layerRef: React.RefObject<Konva.Layer>;
  lines: any[];
  images: any[];
  currentTool: Tool;
  panZoomState: { x: number; y: number; scale: number };
  palmRejectionConfig: any;
  panZoom: any;
  handlePointerDown: (x: number, y: number, pressure: number) => void;
  handlePointerMove: (x: number, y: number, pressure: number) => void;
  handlePointerUp: () => void;
  isReadOnly?: boolean;
  onStageClick?: (e: any) => void;
  selectionBounds: any;
  isSelecting: boolean;
  selection: any;
  onUpdateLine?: (lineId: string, updates: any) => void;
  onUpdateImage?: (imageId: string, updates: any) => void;
  onTransformEnd?: () => void;
  normalizedState?: any;
  select2MouseHandlers?: any;
  extraContent?: React.ReactNode;
}

const KonvaStageCanvas: React.FC<KonvaStageCanvasProps> = ({
  width,
  height,
  stageRef,
  layerRef,
  lines,
  images,
  currentTool,
  panZoomState,
  palmRejectionConfig,
  panZoom,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  isReadOnly,
  onStageClick,
  selectionBounds,
  isSelecting,
  selection,
  onUpdateLine,
  onUpdateImage,
  onTransformEnd,
  normalizedState,
  select2MouseHandlers,
  extraContent
}) => {
  // Extract select2State from select2MouseHandlers if available
  const select2State = select2MouseHandlers?.select2State;

  return (
    <Stage
      width={width}
      height={height}
      ref={stageRef}
      scaleX={panZoomState.scale}
      scaleY={panZoomState.scale}
      x={panZoomState.x}
      y={panZoomState.y}
      listening={!isReadOnly}
      onClick={onStageClick}
    >
      <Layer ref={layerRef}>
        {/* Lines layer */}
        <LinesList
          lines={lines}
          currentTool={currentTool}
          selection={selection}
          select2State={select2State}
          onUpdateLine={onUpdateLine}
        />
        
        {/* Selection rectangle */}
        {selectionBounds && isSelecting && (
          <SelectionRect selectionBounds={selectionBounds} isVisible={true} />
        )}
        
        {/* Extra content (Select2Renderer, SelectionGroup, etc.) */}
        {extraContent}
      </Layer>
    </Stage>
  );
};

export default KonvaStageCanvas;
