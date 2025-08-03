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
  transformGroupRotation?: number;
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
  zoom,
  transformGroupRotation = 0
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
            x={image.x + (image.width || 100) / 2 + dragOffset.x}
            y={image.y + (image.height || 100) / 2 + dragOffset.y}
            width={image.width}
            height={image.height}
            offsetX={(image.width || 100) / 2}
            offsetY={(image.height || 100) / 2}
            rotation={image.rotation || 0}
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

    // Calculate rotation center based on actual objects, not group bounds
    let rotationCenter;
    
    if (selectedObjects.length === 1 && selectedObjects[0].type === 'image') {
      // For single image, use the image's actual center
      const image = images.find(img => img.id === selectedObjects[0].id);
      if (image) {
        const width = image.width || 100;
        const height = image.height || 100;
        rotationCenter = {
          x: image.x + width / 2,
          y: image.y + height / 2
        };
      } else {
        // Fallback to group bounds center
        rotationCenter = {
          x: initialTransformBounds.x + initialTransformBounds.width / 2,
          y: initialTransformBounds.y + initialTransformBounds.height / 2
        };
      }
    } else {
      // For multiple objects, calculate centroid of actual object centers
      let totalX = 0, totalY = 0, count = 0;
      
      selectedObjects.forEach(obj => {
        if (obj.type === 'image') {
          const image = images.find(img => img.id === obj.id);
          if (image) {
            const width = image.width || 100;
            const height = image.height || 100;
            totalX += image.x + width / 2;
            totalY += image.y + height / 2;
            count++;
          }
        } else if (obj.type === 'line') {
          const line = lines.find(l => l.id === obj.id);
          if (line && line.points.length >= 4) {
            // Calculate line center from its points
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (let i = 0; i < line.points.length; i += 2) {
              const x = line.points[i] + line.x;
              const y = line.points[i + 1] + line.y;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
            totalX += (minX + maxX) / 2;
            totalY += (minY + maxY) / 2;
            count++;
          }
        }
      });
      
      if (count > 0) {
        rotationCenter = {
          x: totalX / count,
          y: totalY / count
        };
      } else {
        // Fallback to group bounds center
        rotationCenter = {
          x: initialTransformBounds.x + initialTransformBounds.width / 2,
          y: initialTransformBounds.y + initialTransformBounds.height / 2
        };
      }
    }

    return selectedObjects.map(obj => {
      const transformedBounds = transformObjectBounds(obj, lines, images, rotationCenter, matrix);
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
            x={transformedBounds.x + transformedBounds.width / 2}
            y={transformedBounds.y + transformedBounds.height / 2}
            width={transformedBounds.width}
            height={transformedBounds.height}
            offsetX={transformedBounds.width / 2}
            offsetY={transformedBounds.height / 2}
            rotation={transformedBounds.rotation || 0}
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
      {/* Use the same SelectionRect component as the original select tool */}
      <SelectionRect
        selectionBounds={selectionBounds}
        isVisible={isSelecting}
        rotation={transformGroupRotation}
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

      {/* Transform controls */}
      <TransformControls
        bounds={currentTransformBounds || groupBounds}
        isVisible={!isSelecting && !isDraggingObjects && selectedObjects.length > 0}
        onHandleMouseDown={onTransformHandleMouseDown || (() => {})}
        zoom={zoom}
        rotation={transformGroupRotation}
      />
    </>
  );
};
