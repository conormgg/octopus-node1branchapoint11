import React from 'react';
import { Rect, Line, Image } from 'react-konva';
import { SelectionBounds, SelectedObject, LineObject, ImageObject } from '@/types/whiteboard';
import SelectionRect from './SelectionRect';
import { TransformControls } from './TransformControls';
import { useSelect2Transform } from '@/hooks/useSelect2Transform';

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
  // Transform props
  isTransforming: boolean;
  transformMode: 'resize' | 'rotate' | null;
  currentTransformBounds: SelectionBounds | null;
  initialTransformBounds: SelectionBounds | null;
  transformRotation: number;
  onTransformHandleMouseDown?: (handleType: string, e: any) => void;
  zoom: number;
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
  isDraggingObjects,
  isTransforming,
  transformMode,
  currentTransformBounds,
  initialTransformBounds,
  transformRotation,
  onTransformHandleMouseDown,
  zoom
}) => {
  const { calculateTransformMatrix, transformObjectBounds } = useSelect2Transform();
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

  // Render preview objects during transform
  const renderTransformPreviewObjects = () => {
    if (!isTransforming || !currentTransformBounds || !initialTransformBounds) return null;

    // Calculate transform matrix
    const matrix = calculateTransformMatrix(
      initialTransformBounds,
      currentTransformBounds,
      transformRotation
    );

    // Calculate group center for transform origin
    const groupCenter = {
      x: initialTransformBounds.x + initialTransformBounds.width / 2,
      y: initialTransformBounds.y + initialTransformBounds.height / 2
    };

    return selectedObjects.map(obj => {
      const transformedBounds = transformObjectBounds(obj, lines, images, groupCenter, matrix);
      if (!transformedBounds) return null;

      if (obj.type === 'line') {
        return (
          <Line
            key={`transform-preview-${obj.id}`}
            points={transformedBounds.points}
            x={transformedBounds.x}
            y={transformedBounds.y}
            stroke="rgba(0, 123, 255, 0.6)"
            strokeWidth={transformedBounds.strokeWidth}
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

        const img = new window.Image();
        img.src = image.src;

        return (
          <Image
            key={`transform-preview-${obj.id}`}
            image={img}
            x={transformedBounds.x}
            y={transformedBounds.y}
            width={transformedBounds.width}
            height={transformedBounds.height}
            opacity={0.5}
            listening={false}
          />
        );
      }
      return null;
    });
  };

  // Render dimming overlay for original objects during drag/transform
  const renderOriginalObjectDimming = () => {
    if ((!isDraggingObjects || !dragOffset) && !isTransforming) return null;

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
      {/* Selection rectangle for drag-to-select */}
      <SelectionRect
        selectionBounds={selectionBounds}
        isVisible={isSelecting}
      />

      {/* Bounding box for selected objects (groupBounds) */}
      <TransformControls
        bounds={currentTransformBounds || groupBounds}
        isVisible={!isSelecting && !isDraggingObjects && selectedObjects.length > 0}
        onHandleMouseDown={onTransformHandleMouseDown || (() => {})}
        zoom={zoom}
      />

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

      {/* Dimming overlay for original objects during drag/transform */}
      {renderOriginalObjectDimming()}

      {/* Preview objects during dragging */}
      {renderPreviewObjects()}

      {/* Preview objects during transform */}
      {renderTransformPreviewObjects()}

      {/* Visual feedback for group bounds */}
      {groupBounds && !isTransforming && (
        <SelectionRect
          selectionBounds={groupBounds}
          isVisible={!isSelecting && selectedObjects.length > 0}
        />
      )}
    </>
  );
};
