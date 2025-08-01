import React, { useRef, useEffect, useState } from 'react';
import { Group } from 'react-konva';
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
  currentTool?: string;
  isVisible?: boolean;
}

const SelectionGroup: React.FC<SelectionGroupProps> = ({
  selectedObjects,
  lines,
  images,
  onUpdateLine,
  onUpdateImage,
  currentTool = 'select',
  isVisible = true
}) => {
  const groupRef = useRef<Konva.Group>(null);

  // Get selected lines and images
  const selectedLines = selectedObjects
    .filter(obj => obj.type === 'line')
    .map(obj => lines.find(line => line.id === obj.id))
    .filter(Boolean) as LineObject[];

  const selectedImages = selectedObjects
    .filter(obj => obj.type === 'image')
    .map(obj => images.find(image => image.id === obj.id))
    .filter(Boolean) as ImageObject[];

  // Only show group if multiple objects are selected and tool is select or select2
  const shouldShowGroup = isVisible && ((currentTool === 'select2' && selectedObjects.length > 0) || (currentTool === 'select' && selectedObjects.length > 1));

  // FIXED: Disable dragging for select2 tool to prevent double movement
  const isDraggable = shouldShowGroup && currentTool === 'select';

  // Calculate group bounds for the background - recalculate whenever objects change
  const groupBounds = shouldShowGroup ? calculateGroupBounds(selectedObjects, selectedLines, selectedImages) : null;

  const handleDragMove = () => {
    // Handle drag movement for group positioning
  };

  const handleDragEnd = () => {
    if (!groupRef.current) return;

    const group = groupRef.current;
    const groupTransform = {
      x: group.x(),
      y: group.y()
    };
    
    // Only handle simple position updates for dragging
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

    // Reset group position
    group.x(0);
    group.y(0);
  };

  if (!shouldShowGroup) {
    return null;
  }

  return (
    <>
      <Group
        ref={groupRef}
        draggable={isDraggable}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <SelectionGroupBackground groupBounds={groupBounds} />
        
        {selectedLines.map((line) => (
          <LineRenderer
            key={`group-line-${line.id}`}
            line={line}
            isSelected={false}
            currentTool={currentTool}
            onDragEnd={() => {}}
          />
        ))}
        
        {selectedImages.map((image) => (
          <ImageRenderer
            key={`group-image-${image.id}`}
            imageObject={image}
            isSelected={false}
            onSelect={() => {}}
            onChange={() => {}}
            onUpdateState={() => {}}
            currentTool={currentTool}
          />
        ))}
      </Group>
      
    </>
  );
};

export default SelectionGroup;
