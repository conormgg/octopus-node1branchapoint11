
import React from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { PanZoomState, Tool, SelectionBounds } from '@/types/whiteboard';
import { useNormalizedWhiteboardState } from '@/hooks/performance/useNormalizedWhiteboardState';
import { useStageCursor } from './hooks/useStageCursor';
import LineRenderer from './LineRenderer';
import ImageRenderer from './ImageRenderer';
import SelectionRect from './SelectionRect';
import SelectionGroup from './SelectionGroup';

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
  handlePointerDown: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  handlePointerMove: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  handlePointerUp: (e: Konva.KonvaEventObject<PointerEvent>) => void;
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
  const cursor = useStageCursor({ currentTool, selection });

  // Handle line selection
  const handleLineSelect = (lineId: string) => {
    if (currentTool === 'select' && selection) {
      selection.selectObjects([{ id: lineId, type: 'line' }]);
    }
  };

  // Handle line hover
  const handleLineMouseEnter = (lineId: string) => {
    if (currentTool === 'select' && selection?.setHoveredObjectId) {
      selection.setHoveredObjectId(lineId);
    }
  };

  const handleLineMouseLeave = () => {
    if (currentTool === 'select' && selection?.setHoveredObjectId) {
      selection.setHoveredObjectId(null);
    }
  };

  // Handle image selection
  const handleImageSelect = (imageId: string) => {
    if (currentTool === 'select' && selection) {
      selection.selectObjects([{ id: imageId, type: 'image' }]);
    }
  };

  // Handle image hover
  const handleImageMouseEnter = (imageId: string) => {
    if (currentTool === 'select' && selection?.setHoveredObjectId) {
      selection.setHoveredObjectId(imageId);
    }
  };

  const handleImageMouseLeave = () => {
    if (currentTool === 'select' && selection?.setHoveredObjectId) {
      selection.setHoveredObjectId(null);
    }
  };

  return (
    <Stage
      width={width}
      height={height}
      ref={stageRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={onStageClick}
      style={{ cursor }}
    >
      {/* Images layer - rendered first (behind) */}
      <Layer>
        {/* Render extraContent (contains existing image renderers) */}
        {extraContent}
        
        {/* Directly render images if they exist and aren't in extraContent */}
        {images.map((image) => {
          if (!image) return null;
          const isSelected = selection?.isObjectSelected?.(image.id) || false;
          const isInGroup = selection?.selectionState?.selectedObjects?.length > 1 && isSelected;
          const isHovered = selection?.hoveredObjectId === image.id;
          
          return (
            <ImageRenderer
              key={image.id}
              imageObject={image}
              isSelected={isSelected && !isInGroup}
              isHovered={isHovered}
              currentTool={currentTool}
              onSelect={() => handleImageSelect(image.id)}
              onMouseEnter={() => handleImageMouseEnter(image.id)}
              onMouseLeave={handleImageMouseLeave}
              onChange={(updates) => {
                if (onUpdateImage) {
                  onUpdateImage(image.id, updates);
                }
              }}
              onUpdateState={() => {
                if (onTransformEnd) {
                  onTransformEnd();
                }
              }}
            />
          );
        })}
      </Layer>
      
      {/* Lines layer - rendered second (on top) */}
      <Layer ref={layerRef}>
        {/* Directly render lines */}
        {lines.map((line) => {
          if (!line) return null;
          const isSelected = selection?.isObjectSelected?.(line.id) || false;
          const isInGroup = selection?.selectionState?.selectedObjects?.length > 1 && isSelected;
          const isHovered = selection?.hoveredObjectId === line.id;
          
          return (
            <LineRenderer 
              key={line.id} 
              line={line}
              isSelected={isSelected && !isInGroup}
              isHovered={isHovered}
              currentTool={currentTool}
              onSelect={currentTool === 'select' ? () => handleLineSelect(line.id) : undefined}
              onMouseEnter={currentTool === 'select' ? () => handleLineMouseEnter(line.id) : undefined}
              onMouseLeave={currentTool === 'select' ? handleLineMouseLeave : undefined}
              onDragEnd={(updates) => {
                if (onUpdateLine) {
                  onUpdateLine(line.id, updates);
                }
              }}
            />
          );
        })}
        
        {/* Selection Group for multi-object selection */}
        {selection?.selectionState?.selectedObjects && selection.selectionState.selectedObjects.length > 1 && (
          <SelectionGroup
            selectedObjects={selection.selectionState.selectedObjects}
            lines={lines}
            images={images}
            onUpdateLine={onUpdateLine}
            onUpdateImage={onUpdateImage}
            onTransformEnd={onTransformEnd}
            currentTool={currentTool}
            isVisible={!isSelecting}
          />
        )}
        
        {/* Selection rectangle for area selection */}
        <SelectionRect
          selectionBounds={selectionBounds}
          isVisible={isSelecting}
        />
      </Layer>
    </Stage>
  );
};

export default KonvaStageCanvas;
