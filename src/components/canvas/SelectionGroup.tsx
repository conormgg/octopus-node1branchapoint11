
import React, { useRef, useEffect, useState } from 'react';
import { Group } from 'react-konva';
import Konva from 'konva';
import { LineObject, ImageObject, SelectedObject } from '@/types/whiteboard';
import LineRenderer from './LineRenderer';
import ImageRenderer from './ImageRenderer';
import GroupTransformer from './GroupTransformer';
import SelectionGroupBackground from './SelectionGroupBackground';
import { calculateGroupBounds, GroupBounds } from '@/utils/groupBoundsCalculator';
import { useGroupTransform } from '@/hooks/useGroupTransform';

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
  const [isTransforming, setIsTransforming] = useState(false);
  const [groupBounds, setGroupBounds] = useState<GroupBounds | null>(null);

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

  // Use the group transform hook
  const { handleTransformEnd: onGroupTransformEnd } = useGroupTransform({
    selectedLines,
    selectedImages,
    onUpdateLine,
    onUpdateImage,
    onTransformEnd
  });

  // Calculate group bounds
  useEffect(() => {
    if (!shouldShowGroup) {
      setGroupBounds(null);
      return;
    }

    const bounds = calculateGroupBounds(selectedObjects, selectedLines, selectedImages);
    setGroupBounds(bounds);
  }, [selectedLines, selectedImages, shouldShowGroup, selectedObjects]);

  // Handle group transformation
  const handleTransformStart = () => {
    setIsTransforming(true);
  };

  const handleDragMove = () => {
    // This will be handled by the GroupTransformer component
  };

  const handleTransformEnd = () => {
    setIsTransforming(false);
    onGroupTransformEnd(groupRef);

    // Force transformer update after reset with a slight delay to ensure state updates
    setTimeout(() => {
      // This will be handled by the GroupTransformer component
    }, 0);
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
        <SelectionGroupBackground groupBounds={groupBounds} />
        
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
      <GroupTransformer
        targetRef={groupRef}
        isVisible={shouldShowGroup}
        selectedObjectsLength={selectedObjects.length}
        onTransformStart={handleTransformStart}
        onTransformEnd={handleTransformEnd}
      />
    </>
  );
};

export default SelectionGroup;
