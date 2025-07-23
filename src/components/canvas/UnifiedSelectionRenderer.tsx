
import React from 'react';
import { Rect } from 'react-konva';
import { SelectionBounds, SelectedObject, LineObject, ImageObject } from '@/types/whiteboard';
import SelectionGroup from './SelectionGroup';

interface UnifiedSelectionRendererProps {
  selectionState: {
    selectedObjects: SelectedObject[];
    selectionBounds: SelectionBounds | null;
    isSelecting: boolean;
  };
  hoveredObjectId: string | null;
  lines: LineObject[];
  images: ImageObject[];
  onUpdateLine?: (lineId: string, updates: any) => void;
  onUpdateImage?: (imageId: string, updates: any) => void;
  onTransformEnd?: () => void;
  currentTool: string;
}

export const UnifiedSelectionRenderer: React.FC<UnifiedSelectionRendererProps> = ({
  selectionState,
  hoveredObjectId,
  lines,
  images,
  onUpdateLine,
  onUpdateImage,
  onTransformEnd,
  currentTool
}) => {
  // Helper function to get object bounds for hover feedback
  const getObjectBounds = (objectId: string, type: 'line' | 'image') => {
    if (type === 'line') {
      const line = lines.find(l => l.id === objectId);
      if (!line || line.points.length < 4) return null;
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < line.points.length; i += 2) {
        const x = line.points[i] + line.x;
        const y = line.points[i + 1] + line.y;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
      
      const padding = line.strokeWidth / 2 + 5;
      return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2
      };
    } else if (type === 'image') {
      const image = images.find(i => i.id === objectId);
      if (!image) return null;
      
      return {
        x: image.x,
        y: image.y,
        width: image.width || 100,
        height: image.height || 100
      };
    }
    return null;
  };

  return (
    <>
      {/* Hover feedback for non-selected objects */}
      {hoveredObjectId && !selectionState.selectedObjects.some(obj => obj.id === hoveredObjectId) && (
        (() => {
          const hoveredObj = lines.find(l => l.id === hoveredObjectId) 
            ? { id: hoveredObjectId, type: 'line' as const }
            : { id: hoveredObjectId, type: 'image' as const };
          const bounds = getObjectBounds(hoveredObjectId, hoveredObj.type);
          if (!bounds) return null;
          
          return (
            <Rect
              key={`hover-${hoveredObjectId}`}
              x={bounds.x}
              y={bounds.y}
              width={bounds.width}
              height={bounds.height}
              fill="transparent"
              stroke="rgba(0, 123, 255, 0.4)"
              strokeWidth={1}
              listening={false}
            />
          );
        })()
      )}

      {/* Drag-to-select rectangle */}
      {selectionState.isSelecting && selectionState.selectionBounds && (
        <Rect
          x={selectionState.selectionBounds.x}
          y={selectionState.selectionBounds.y}
          width={selectionState.selectionBounds.width}
          height={selectionState.selectionBounds.height}
          fill="rgba(0, 123, 255, 0.1)"
          stroke="rgba(0, 123, 255, 0.8)"
          strokeWidth={1}
          dash={[5, 5]}
          listening={false}
        />
      )}

      {/* Transform handles and selection group - show when objects are selected and not dragging */}
      {!selectionState.isSelecting && selectionState.selectedObjects.length > 0 && (
        <SelectionGroup
          selectedObjects={selectionState.selectedObjects}
          lines={lines}
          images={images}
          onUpdateLine={onUpdateLine}
          onUpdateImage={onUpdateImage}
          onTransformEnd={onTransformEnd}
          currentTool={currentTool}
          isVisible={true}
        />
      )}
    </>
  );
};
