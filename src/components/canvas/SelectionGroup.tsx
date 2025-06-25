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

  // Calculate group bounds
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
    
    // Apply transformation to each selected object
    selectedLines.forEach((line) => {
      if (onUpdateLine) {
        // Calculate new position relative to original group bounds
        const relativeX = line.x - groupBounds.x;
        const relativeY = line.y - groupBounds.y;
        
        // Apply group transformation
        const newX = groupBounds.x + groupTransform.x + (relativeX * groupTransform.scaleX);
        const newY = groupBounds.y + groupTransform.y + (relativeY * groupTransform.scaleY);
        
        onUpdateLine(line.id, {
          x: newX,
          y: newY,
          scaleX: (line.scaleX || 1) * groupTransform.scaleX,
          scaleY: (line.scaleY || 1) * groupTransform.scaleY,
          rotation: (line.rotation || 0) + groupTransform.rotation
        });
      }
    });
    
    selectedImages.forEach((image) => {
      if (onUpdateImage) {
        // Calculate new position relative to original group bounds
        const relativeX = image.x - groupBounds.x;
        const relativeY = image.y - groupBounds.y;
        
        // Apply group transformation
        const newX = groupBounds.x + groupTransform.x + (relativeX * groupTransform.scaleX);
        const newY = groupBounds.y + groupTransform.y + (relativeY * groupTransform.scaleY);
        
        const currentWidth = image.width || 100;
        const currentHeight = image.height || 100;
        
        onUpdateImage(image.id, {
          x: newX,
          y: newY,
          width: currentWidth * groupTransform.scaleX,
          height: currentHeight * groupTransform.scaleY,
          rotation: (image.rotation || 0) + groupTransform.rotation
        });
      }
    });

    // Reset group transform to identity
    group.x(0);
    group.y(0);
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
        {/* Background rectangle for easier selection and dragging */}
        <SelectionGroupBackground groupBounds={groupBounds} />
        
        {/* Render selected lines in the group with relative coordinates */}
        {selectedLines.map((line) => (
          <LineRenderer
            key={`group-line-${line.id}`}
            line={{
              ...line,
              x: line.x - groupBounds.x, // Convert to relative coordinates
              y: line.y - groupBounds.y
            }}
            isSelected={false} // Don't show individual selection in group
            isInGroup={true} // New prop to prevent individual transformers
            currentTool={currentTool}
            onDragEnd={() => {}} // Group handles dragging
          />
        ))}
        
        {/* Render selected images in the group with relative coordinates */}
        {selectedImages.map((image) => (
          <ImageRenderer
            key={`group-image-${image.id}`}
            imageObject={{
              ...image,
              x: image.x - groupBounds.x, // Convert to relative coordinates
              y: image.y - groupBounds.y
            }}
            isSelected={false} // Don't show individual selection in group
            isInGroup={true} // New prop to prevent individual transformers
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
