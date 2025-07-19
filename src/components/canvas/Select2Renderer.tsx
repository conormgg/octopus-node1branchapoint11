
import React from 'react';
import { Rect } from 'react-konva';
import { SelectionBounds, SelectedObject, LineObject, ImageObject } from '@/types/whiteboard';

interface Select2RendererProps {
  selectedObjects: SelectedObject[];
  hoveredObjectId: string | null;
  selectionBounds: SelectionBounds | null;
  isSelecting: boolean;
  lines: LineObject[];
  images: ImageObject[];
  groupBounds: SelectionBounds | null;
}

export const Select2Renderer: React.FC<Select2RendererProps> = ({
  selectedObjects,
  hoveredObjectId,
  selectionBounds,
  isSelecting,
  lines,
  images,
  groupBounds
}) => {
  // Helper function to get object bounds for individual hover feedback
  const getObjectBounds = (obj: SelectedObject) => {
    if (obj.type === 'line') {
      const line = lines.find(l => l.id === obj.id);
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
      
      // Add padding for stroke width
      const padding = line.strokeWidth / 2 + 5;
      return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2
      };
    } else if (obj.type === 'image') {
      const image = images.find(i => i.id === obj.id);
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
      {/* Selection rectangle during drag-to-select */}
      {isSelecting && selectionBounds && (
        <Rect
          x={selectionBounds.x}
          y={selectionBounds.y}
          width={selectionBounds.width}
          height={selectionBounds.height}
          fill="rgba(0, 123, 255, 0.1)"
          stroke="rgba(0, 123, 255, 0.5)"
          strokeWidth={1}
          dash={[5, 5]}
          listening={false}
        />
      )}

      {/* Unified group selection bounds */}
      {selectedObjects.length > 0 && groupBounds && (
        <Rect
          x={groupBounds.x}
          y={groupBounds.y}
          width={groupBounds.width}
          height={groupBounds.height}
          fill="transparent"
          stroke="rgba(0, 123, 255, 0.8)"
          strokeWidth={2}
          listening={false}
        />
      )}

      {/* Visual feedback for hovered object (only when not selected) */}
      {hoveredObjectId && !selectedObjects.some(obj => obj.id === hoveredObjectId) && (
        (() => {
          const hoveredObj = { 
            id: hoveredObjectId, 
            type: (lines.find(l => l.id === hoveredObjectId) ? 'line' : 'image') as 'line' | 'image'
          };
          const bounds = getObjectBounds(hoveredObj);
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
    </>
  );
};
