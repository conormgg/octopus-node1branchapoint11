
import React from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useStageCoordinates } from '@/hooks/useStageCoordinates';
import { PanZoomState, Tool, SelectionBounds } from '@/types/whiteboard';
import LineRenderer from './LineRenderer';
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
  onTransformEnd
}) => {
  const { getRelativePointerPosition } = useStageCoordinates(panZoomState);

  // Fallback mouse handlers for devices without pointer events
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Handle right-click pan - works for everyone, including read-only users
    if (e.evt.button === 2) {
      panZoom.startPan(e.evt.clientX, e.evt.clientY);
      // Clear hover state when starting pan to prevent jerky behavior
      if (selection?.setHoveredObjectId) {
        selection.setHoveredObjectId(null);
      }
      return;
    }
    
    // Handle selection tool clicks
    if (currentTool === 'select' && selection && !isReadOnly) {
      // Check if we clicked on a line or image
      const clickedShape = e.target;
      if (clickedShape && clickedShape !== e.target.getStage()) {
        // Don't handle the click here - let the shape's onClick handler deal with it
        // This allows dragging to work properly
        return;
      }
      // For empty space clicks with select tool, let handlePointerDown handle it
      // so that drag-to-select can work
    } else if (onStageClick && currentTool !== 'select') {
      // Call the stage click handler for other tools
      onStageClick(e);
    }
    
    // Only proceed with drawing/selection if not in read-only mode or palm rejection is disabled
    if (isReadOnly || (palmRejectionConfig.enabled && currentTool !== 'select')) return;
    
    const stage = e.target.getStage();
    if (!stage) return;

    const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    handlePointerDown(x, y);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Handle right-click pan - works for everyone, including read-only users
    if (e.evt.buttons === 2) {
      panZoom.continuePan(e.evt.clientX, e.evt.clientY);
      // Clear hover state during pan to prevent jerky behavior
      if (selection?.setHoveredObjectId) {
        selection.setHoveredObjectId(null);
      }
      return;
    }
    
    // Only proceed with drawing/selection if not in read-only mode or palm rejection is disabled
    if (isReadOnly || (palmRejectionConfig.enabled && currentTool !== 'select')) return;
    
    const stage = e.target.getStage();
    if (!stage) return;

    const { x, y } = getRelativePointerPosition(stage, e.evt.clientX, e.evt.clientY);
    handlePointerMove(x, y);
  };

  const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Handle right-click pan end - works for everyone, including read-only users
    if (e.evt.button === 2) {
      panZoom.stopPan();
      return;
    }
    
    // Only proceed with drawing/selection if not in read-only mode or palm rejection is disabled
    if (isReadOnly || (palmRejectionConfig.enabled && currentTool !== 'select')) return;
    
    handlePointerUp();
  };

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    if (onStageClick) onStageClick(e);
  };

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
      style={{ 
        cursor: currentTool === 'eraser' ? 'crosshair' : 
                currentTool === 'select' && selection?.hoveredObjectId ? 'pointer' : 
                'default' 
      }}
    >
      {/* Images layer - rendered first (behind) */}
      <Layer>
        {extraContent}
      </Layer>
      
      {/* Lines layer - rendered second (on top) */}
      <Layer ref={layerRef}>
        {/* Individual lines - hide transformers when part of a group */}
        {lines.map((line) => {
          const isSelected = selection?.isObjectSelected?.(line.id) || false;
          const isInGroup = selection?.selectionState?.selectedObjects?.length > 1 && isSelected;
          
          return (
            <LineRenderer 
              key={line.id} 
              line={line}
              isSelected={isSelected && !isInGroup} // Hide individual selection when in group
              isHovered={selection?.hoveredObjectId === line.id}
              currentTool={currentTool}
              onSelect={currentTool === 'select' ? () => {
                if (selection) {
                  selection.selectObjects([{ id: line.id, type: 'line' }]);
                }
              } : undefined}
              onMouseEnter={currentTool === 'select' ? () => {
                if (selection?.setHoveredObjectId) {
                  selection.setHoveredObjectId(line.id);
                }
              } : undefined}
              onMouseLeave={currentTool === 'select' ? () => {
                if (selection?.setHoveredObjectId) {
                  selection.setHoveredObjectId(null);
                }
              } : undefined}
              onDragEnd={(newPosition) => {
                if (onUpdateLine) {
                  onUpdateLine(line.id, newPosition);
                }
              }}
            />
          );
        })}
        
        {/* Selection Group - handles multiple selected objects as one entity */}
        {selection?.selectionState?.selectedObjects && (
          <SelectionGroup
            selectedObjects={selection.selectionState.selectedObjects}
            lines={lines}
            images={images}
            onUpdateLine={onUpdateLine}
            onUpdateImage={onUpdateImage}
            onTransformEnd={onTransformEnd}
            currentTool={currentTool}
            isVisible={!isSelecting} // Hide during drag-to-select
          />
        )}
        
        {/* Selection rectangle - rendered on top of everything */}
        <SelectionRect
          selectionBounds={selectionBounds}
          isVisible={isSelecting}
        />
      </Layer>
    </Stage>
  );
};

export default KonvaStageCanvas;
