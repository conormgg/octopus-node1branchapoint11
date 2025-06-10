
import React, { useRef, useEffect, useState } from 'react';
import { Group, Transformer, Rect } from 'react-konva';
import Konva from 'konva';
import { LineObject, ImageObject, SelectedObject } from '@/types/whiteboard';
import LineRenderer from './LineRenderer';
import ImageRenderer from './ImageRenderer';

interface SelectionGroupProps {
  selectedObjects: SelectedObject[];
  lines: LineObject[];
  images: ImageObject[];
  onUpdateLine?: (lineId: string, updates: Partial<LineObject>) => void;
  onUpdateImage?: (imageId: string, updates: Partial<ImageObject>) => void;
  onTransformEnd?: () => void;
  currentTool?: string;
  isVisible?: boolean;
}

const SelectionGroup: React.FC<SelectionGroupProps> = ({
  selectedObjects,
  lines,
  images,
  onUpdateLine,
  onUpdateImage,
  onTransformEnd,
  currentTool = 'select',
  isVisible = true
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [groupBounds, setGroupBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Get selected lines and images
  const selectedLines = selectedObjects
    .filter(obj => obj.type === 'line')
    .map(obj => lines.find(line => line.id === obj.id))
    .filter(Boolean) as LineObject[];

  const selectedImages = selectedObjects
    .filter(obj => obj.type === 'image')
    .map(obj => images.find(image => image.id === obj.id))
    .filter(Boolean) as ImageObject[];

  // Only show group if multiple objects are selected
  const shouldShowGroup = selectedObjects.length > 1 && isVisible && currentTool === 'select';

  // Calculate group bounds
  const calculateGroupBounds = () => {
    if (!shouldShowGroup || selectedObjects.length === 0) {
      setGroupBounds(null);
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Process selected lines
    for (const line of selectedLines) {
      const points = line.points;
      
      for (let i = 0; i < points.length; i += 2) {
        // Get point in local coordinates
        const localX = points[i];
        const localY = points[i + 1];
        
        // Apply scaling
        const scaledX = localX * line.scaleX;
        const scaledY = localY * line.scaleY;
        
        // Apply rotation
        const rotationRad = (line.rotation || 0) * Math.PI / 180;
        const cosRotation = Math.cos(rotationRad);
        const sinRotation = Math.sin(rotationRad);
        
        const rotatedX = scaledX * cosRotation - scaledY * sinRotation;
        const rotatedY = scaledX * sinRotation + scaledY * cosRotation;
        
        // Apply translation
        const x = rotatedX + line.x;
        const y = rotatedY + line.y;
        
        // Update bounds
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    // Process selected images
    for (const image of selectedImages) {
      const width = image.width || 100;
      const height = image.height || 100;
      
      // For non-rotated images
      if (!(image as any).rotation) {
        minX = Math.min(minX, image.x);
        minY = Math.min(minY, image.y);
        maxX = Math.max(maxX, image.x + width);
        maxY = Math.max(maxY, image.y + height);
        continue;
      }
      
      // For rotated images, check all corners
      const corners = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height }
      ];
      
      // Apply rotation to corners
      const rotationRad = ((image as any).rotation || 0) * Math.PI / 180;
      const cosRotation = Math.cos(rotationRad);
      const sinRotation = Math.sin(rotationRad);
      
      for (const corner of corners) {
        // Rotate
        const rotatedX = corner.x * cosRotation - corner.y * sinRotation;
        const rotatedY = corner.x * sinRotation + corner.y * cosRotation;
        
        // Translate
        const x = rotatedX + image.x;
        const y = rotatedY + image.y;
        
        // Update bounds
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    // If no objects were found or bounds are invalid
    if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
      setGroupBounds(null);
      return;
    }

    // Add some padding for easier selection
    const padding = 5;
    setGroupBounds({
      x: minX - padding,
      y: minY - padding,
      width: (maxX - minX) + (padding * 2),
      height: (maxY - minY) + (padding * 2)
    });
  };

  // Recalculate bounds when objects change
  useEffect(() => {
    calculateGroupBounds();
  }, [selectedLines, selectedImages, shouldShowGroup]);

  // Set up transformer when group is created
  useEffect(() => {
    if (shouldShowGroup && groupRef.current && transformerRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [shouldShowGroup, selectedObjects.length]);

  // Update transformer bounds when objects change position
  useEffect(() => {
    if (shouldShowGroup && transformerRef.current && groupRef.current && !isTransforming) {
      // Force transformer to recalculate bounds
      transformerRef.current.forceUpdate();
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedLines, selectedImages, shouldShowGroup, isTransforming]);

  // Handle group transformation
  const handleTransformStart = () => {
    setIsTransforming(true);
  };

  const handleDragMove = () => {
    // Update transformer bounds during drag to keep it following the group
    if (transformerRef.current && groupRef.current) {
      transformerRef.current.forceUpdate();
    }
  };

  const handleTransformEnd = () => {
    setIsTransforming(false);
    
    if (!groupRef.current) return;

    const group = groupRef.current;
    
    // Apply group transformation to all child objects (excluding the background rect)
    const children = group.getChildren().filter(child => child.name() !== 'group-background');
    
    children.forEach((child, index) => {
      // Get the child's transformed position and attributes
      const childTransform = child.getAbsoluteTransform();
      const attrs = childTransform.decompose();
      
      // Find the corresponding object
      if (index < selectedLines.length) {
        // This is a line
        const line = selectedLines[index];
        if (onUpdateLine) {
          onUpdateLine(line.id, {
            x: attrs.x,
            y: attrs.y,
            scaleX: attrs.scaleX,
            scaleY: attrs.scaleY,
            rotation: attrs.rotation
          });
        }
      } else {
        // This is an image
        const imageIndex = index - selectedLines.length;
        const image = selectedImages[imageIndex];
        if (image && onUpdateImage) {
          onUpdateImage(image.id, {
            x: attrs.x,
            y: attrs.y,
            width: (image.width || 100) * attrs.scaleX,
            height: (image.height || 100) * attrs.scaleY,
            rotation: attrs.rotation
          });
        }
      }
    });

    // Reset group transform
    group.x(0);
    group.y(0);
    group.scaleX(1);
    group.scaleY(1);
    group.rotation(0);

    // Force transformer update after reset with a slight delay to ensure state updates
    setTimeout(() => {
      if (transformerRef.current && groupRef.current) {
        transformerRef.current.forceUpdate();
        transformerRef.current.getLayer()?.batchDraw();
      }
    }, 0);

    if (onTransformEnd) {
      onTransformEnd();
    }
  };

  if (!shouldShowGroup) {
    return null;
  }

  return (
    <>
      <Group
        ref={groupRef}
        draggable={true}
        onTransformStart={handleTransformStart}
        onTransformEnd={handleTransformEnd}
        onDragMove={handleDragMove}
        onDragEnd={handleTransformEnd}
      >
        {/* Invisible background rectangle for dragging */}
        {groupBounds && (
          <Rect
            name="group-background"
            x={groupBounds.x}
            y={groupBounds.y}
            width={groupBounds.width}
            height={groupBounds.height}
            fill="transparent"
            listening={true}
          />
        )}
        
        {/* Render selected lines in the group */}
        {selectedLines.map((line) => (
          <LineRenderer
            key={`group-line-${line.id}`}
            line={line}
            isSelected={false} // Don't show individual selection in group
            currentTool={currentTool}
            onDragEnd={() => {}} // Group handles dragging
          />
        ))}
        
        {/* Render selected images in the group */}
        {selectedImages.map((image) => (
          <ImageRenderer
            key={`group-image-${image.id}`}
            imageObject={image}
            isSelected={false} // Don't show individual selection in group
            onSelect={() => {}} // Group handles selection
            onChange={() => {}} // Group handles changes
            onUpdateState={() => {}} // Group handles updates
            currentTool={currentTool}
          />
        ))}
      </Group>
      
      {/* Transformer for the group */}
      <Transformer
        ref={transformerRef}
        boundBoxFunc={(oldBox, newBox) => {
          // Limit minimum size
          if (newBox.width < 10 || newBox.height < 10) {
            return oldBox;
          }
          return newBox;
        }}
        enabledAnchors={[
          'top-left', 'top-right', 'bottom-left', 'bottom-right',
          'middle-left', 'middle-right', 'top-center', 'bottom-center'
        ]}
        rotateEnabled={true}
        resizeEnabled={true}
      />
    </>
  );
};

export default SelectionGroup;
