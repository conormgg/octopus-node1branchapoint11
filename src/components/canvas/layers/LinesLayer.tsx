
import React from 'react';
import { Layer } from 'react-konva';
import Konva from 'konva';
import { Tool, SelectionBounds, LineObject, ImageObject } from '@/types/whiteboard';
import { useNormalizedWhiteboardState } from '@/hooks/performance/useNormalizedWhiteboardState';
import LineRenderer from '../LineRenderer';
import SelectionRect from '../SelectionRect';
import SelectionGroup from '../SelectionGroup';

interface LinesLayerProps {
  layerRef: React.RefObject<Konva.Layer>;
  lines: LineObject[];
  images: ImageObject[];
  currentTool: Tool;
  selectionBounds?: SelectionBounds | null;
  isSelecting?: boolean;
  selection?: any;
  // Optional normalized state for performance optimization
  normalizedState?: ReturnType<typeof useNormalizedWhiteboardState>;
  onUpdateLine?: (lineId: string, updates: any) => void;
  onUpdateImage?: (imageId: string, updates: any) => void;
  onTransformEnd?: () => void;
}

const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

const debugLog = (context: string, action: string, data?: any) => {
  if (DEBUG_ENABLED) {
    console.log(`[LinesLayer:${context}] ${action}`, data || '');
  }
};

const LinesLayer: React.FC<LinesLayerProps> = ({
  layerRef,
  lines,
  images,
  currentTool,
  selectionBounds,
  isSelecting = false,
  selection,
  normalizedState,
  onUpdateLine,
  onUpdateImage,
  onTransformEnd
}) => {
  // Use normalized state if available, otherwise fall back to array-based approach
  const useNormalized = normalizedState && normalizedState.lineCount > 0;
  
  if (DEBUG_ENABLED && useNormalized) {
    debugLog('Performance', 'Using normalized state for rendering', {
      lineCount: normalizedState.lineCount,
      imageCount: normalizedState.imageCount
    });
  }

  // Get lines to render - either from normalized state or direct array
  const linesToRender = useNormalized 
    ? normalizedState.lineIds.map(id => normalizedState.getLineById(id)).filter(Boolean)
    : lines;

  // Get images for selection group - either from normalized state or direct array
  const imagesToUse = useNormalized && normalizedState.imageCount > 0
    ? normalizedState.imageIds.map(id => normalizedState.getImageById(id)).filter(Boolean)
    : images;

  return (
    <Layer ref={layerRef}>
      {/* Individual lines - hide transformers when part of a group */}
      {linesToRender.map((line) => {
        if (!line) return null; // Safety check for filtered items
        
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
          lines={linesToRender}
          images={imagesToUse}
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
