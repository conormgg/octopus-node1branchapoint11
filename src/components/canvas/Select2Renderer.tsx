
import React from 'react';
import { Rect, Line, Image } from 'react-konva';
import { SelectionBounds, SelectedObject, LineObject, ImageObject } from '@/types/whiteboard';

interface Select2RendererProps {
  selectedObjects: SelectedObject[];
  hoveredObjectId: string | null;
  selectionBounds: SelectionBounds | null;
  isSelecting: boolean;
  lines: LineObject[];
  images: ImageObject[];
  groupBounds: SelectionBounds | null;
  dragOffset: { x: number; y: number } | null;
  isDraggingObjects: boolean;
}

export const Select2Renderer: React.FC<Select2RendererProps> = ({
  selectedObjects,
  hoveredObjectId,
  selectionBounds,
  isSelecting,
  lines,
  images,
  groupBounds,
  dragOffset,
  isDraggingObjects
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

  // Render preview objects during dragging
  const renderPreviewObjects = () => {
    if (!isDraggingObjects || !dragOffset) return null;

    return selectedObjects.map(obj => {
      if (obj.type === 'line') {
        const line = lines.find(l => l.id === obj.id);
        if (!line) return null;

        return (
          <Line
            key={`preview-${obj.id}`}
            points={line.points}
            x={line.x + dragOffset.x}
            y={line.y + dragOffset.y}
            stroke="rgba(0, 123, 255, 0.6)"
            strokeWidth={line.strokeWidth}
            lineCap="round"
            lineJoin="round"
            opacity={0.5}
            listening={false}
            dash={[5, 5]}
          />
        );
      } else if (obj.type === 'image') {
        const image = images.find(i => i.id === obj.id);
        if (!image) return null;

        // Create a temporary image element for rendering
        const img = new window.Image();
        img.src = image.src;

        return (
          <Image
            key={`preview-${obj.id}`}
            image={img}
            x={image.x + dragOffset.x}
            y={image.y + dragOffset.y}
            width={image.width}
            height={image.height}
            opacity={0.5}
            listening={false}
          />
        );
      }
      return null;
    });
  };

  // Render dimming overlay for original objects during drag
  const renderOriginalObjectDimming = () => {
    if (!isDraggingObjects || !dragOffset) return null;

    return selectedObjects.map(obj => {
      const bounds = getObjectBounds(obj);
      if (!bounds) return null;

      return (
        <Rect
          key={`dim-${obj.id}`}
          x={bounds.x}
          y={bounds.y}
          width={bounds.width}
          height={bounds.height}
          fill="rgba(255, 255, 255, 0.7)"
          listening={false}
        />
      );
    });
  };

  return (
    <>
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

      {/* Dimming overlay for original objects during drag */}
      {renderOriginalObjectDimming()}

      {/* Preview objects during dragging */}
      {renderPreviewObjects()}
    </>
  );
};
