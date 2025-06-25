
import React, { useRef, useEffect, useState } from 'react';
import { Group, Transformer } from 'react-konva';
import Konva from 'konva';
import { LineObject, ImageObject, SelectedObject } from '@/types/whiteboard';
import LineRenderer from './LineRenderer';
import ImageRenderer from './ImageRenderer';
import SelectionGroupBackground from './SelectionGroupBackground';
import { calculateGroupBounds } from '@/utils/groupBoundsCalculator';

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

  // Calculate group bounds for positioning and background
  const groupBounds = shouldShowGroup ? calculateGroupBounds(selectedObjects, selectedLines, selectedImages) : null;

  // Set up transformer when group is created
  useEffect(() => {
    if (shouldShowGroup && groupRef.current && transformerRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [shouldShowGroup, selectedObjects.length]);

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
    
    if (!groupRef.current || !groupBounds) return;

    const group = groupRef.current;
    const groupTransform = {
      x: group.x(),
      y: group.y(),
      scaleX: group.scaleX(),
      scaleY: group.scaleY(),
      rotation: group.rotation()
    };
    
    // For simple translation (dragging), just apply the offset to each object
    if (groupTransform.scaleX === 1 && groupTransform.scaleY === 1 && groupTransform.rotation === 0) {
      // Simple translation - just move each object by the group offset
      selectedLines.forEach((line) => {
        if (onUpdateLine) {
          onUpdateLine(line.id, {
            x: line.x + groupTransform.x,
            y: line.y + groupTransform.y
          });
        }
      });
      
      selectedImages.forEach((image) => {
        if (onUpdateImage) {
          onUpdateImage(image.id, {
            x: image.x + groupTransform.x,
            y: image.y + groupTransform.y
          });
        }
      });
    } else {
      // Complex transformation (scaling/rotation) - use matrix calculations
      const children = group.getChildren();
      
      children.forEach((child, index) => {
        // Skip the background rectangle (last child now)
        if (index === children.length - 1) return;
        
        // Calculate the child's new position after group transformation
        const localTransform = child.getTransform().copy();
        const groupTransformMatrix = group.getTransform().copy();
        const finalTransform = groupTransformMatrix.multiply(localTransform);
        const decomposed = finalTransform.decompose();
        
        // Find the corresponding object and apply updates
        if (index < selectedLines.length) {
          // This is a line
          const line = selectedLines[index];
          if (onUpdateLine) {
            const updatedLine = {
              x: decomposed.x + groupBounds.x,
              y: decomposed.y + groupBounds.y,
              scaleX: (line.scaleX || 1) * groupTransform.scaleX,
              scaleY: (line.scaleY || 1) * groupTransform.scaleY,
              rotation: (line.rotation || 0) + groupTransform.rotation
            };
            
            onUpdateLine(line.id, updatedLine);
          }
        } else {
          // This is an image
          const imageIndex = index - selectedLines.length;
          const image = selectedImages[imageIndex];
          if (image && onUpdateImage) {
            const currentWidth = image.width || 100;
            const currentHeight = image.height || 100;
            
            const updatedImage = {
              x: decomposed.x + groupBounds.x,
              y: decomposed.y + groupBounds.y,
              width: currentWidth * groupTransform.scaleX,
              height: currentHeight * groupTransform.scaleY,
              rotation: (image.rotation || 0) + groupTransform.rotation
            };
            
            onUpdateImage(image.id, updatedImage);
          }
        }
      });
    }

    // Reset group transform to identity and position
    group.x(groupBounds.x);
    group.y(groupBounds.y);
    group.scaleX(1);
    group.scaleY(1);
    group.rotation(0);

    // Force transformer update after reset
    requestAnimationFrame(() => {
      if (transformerRef.current) {
        transformerRef.current.forceUpdate();
        transformerRef.current.getLayer()?.batchDraw();
      }
    });

    if (onTransformEnd) {
      onTransformEnd();
    }
  };

  if (!shouldShowGroup || !groupBounds) {
    return null;
  }

  return (
    <>
      <Group
        ref={groupRef}
        x={groupBounds.x}
        y={groupBounds.y}
        draggable={true}
        onTransformStart={handleTransformStart}
        onTransformEnd={handleTransformEnd}
        onDragMove={handleDragMove}
        onDragEnd={handleTransformEnd}
      >
        {/* Render selected lines first */}
        {selectedLines.map((line) => (
          <LineRenderer
            key={`group-line-${line.id}`}
            line={{
              ...line,
              x: line.x - groupBounds.x,
              y: line.y - groupBounds.y
            }}
            isSelected={false} // Don't show individual selection in group
            currentTool={currentTool}
            onDragEnd={() => {}} // Group handles dragging
          />
        ))}
        
        {/* Render selected images second */}
        {selectedImages.map((image) => (
          <ImageRenderer
            key={`group-image-${image.id}`}
            imageObject={{
              ...image,
              x: image.x - groupBounds.x,
              y: image.y - groupBounds.y
            }}
            isSelected={false} // Don't show individual selection in group
            onSelect={() => {}} // Group handles selection
            onChange={() => {}} // Group handles changes
            onUpdateState={() => {}} // Group handles updates
            currentTool={currentTool}
          />
        ))}

        {/* Render the transparent, clickable background LAST (on top) */}
        <SelectionGroupBackground groupBounds={groupBounds} isGroupPositioned={true} />
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
