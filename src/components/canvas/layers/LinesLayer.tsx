
import React from 'react';
import { Layer } from 'react-konva';
import Konva from 'konva';
import { Tool, SelectionBounds } from '@/types/whiteboard';
import LineRenderer from '../LineRenderer';
import SelectionRect from '../SelectionRect';
import SelectionGroup from '../SelectionGroup';

interface LinesLayerProps {
  layerRef: React.RefObject<Konva.Layer>;
  lines: any[];
  images: any[];
  currentTool: Tool;
  selectionBounds?: SelectionBounds | null;
  isSelecting?: boolean;
  selection?: any;
  onUpdateLine?: (lineId: string, updates: any) => void;
  onUpdateImage?: (imageId: string, updates: any) => void;
  onTransformEnd?: () => void;
}

const LinesLayer: React.FC<LinesLayerProps> = ({
  layerRef,
  lines,
  images,
  currentTool,
  selectionBounds,
  isSelecting = false,
  selection,
  onUpdateLine,
  onUpdateImage,
  onTransformEnd
}) => {
  return (
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
  );
};

export default LinesLayer;
