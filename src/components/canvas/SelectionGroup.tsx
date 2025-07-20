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

  // Only show group if multiple objects are selected and tool is select or select2
  const shouldShowGroup = selectedObjects.length > 1 && isVisible && (currentTool === 'select' || currentTool === 'select2');

  // Calculate group bounds for the background - recalculate whenever objects change
  const groupBounds = shouldShowGroup ? calculateGroupBounds(selectedObjects, selectedLines, selectedImages) : null;

  // Set up transformer when group is created or objects change position
  useEffect(() => {
    if (shouldShowGroup && groupRef.current && transformerRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [shouldShowGroup, selectedObjects.length, selectedLines, selectedImages]);

  // Handle group transformation
  const handleTransformStart = () => {
    setIsTransforming(true);
  };

  const handleDragMove = () => {
    if (transformerRef.current && groupRef.current) {
      transformerRef.current.forceUpdate();
    }
  };

  const handleTransformEnd = () => {
    setIsTransforming(false);
    
    if (!groupRef.current) return;

    const group = groupRef.current;
    const groupTransform = {
      x: group.x(),
      y: group.y(),
      scaleX: group.scaleX(),
      scaleY: group.scaleY(),
      rotation: group.rotation()
    };
    
    if (groupTransform.scaleX === 1 && groupTransform.scaleY === 1 && groupTransform.rotation === 0) {
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
      const children = group.getChildren();
      
      children.forEach((child, index) => {
        if (index === 0) return;
        
        const localTransform = child.getTransform().copy();
        const groupTransformMatrix = group.getTransform().copy();
        const finalTransform = groupTransformMatrix.multiply(localTransform);
        const decomposed = finalTransform.decompose();
        
        const adjustedIndex = index - 1;
        
        if (adjustedIndex < selectedLines.length) {
          const line = selectedLines[adjustedIndex];
          if (onUpdateLine) {
            const updatedLine = {
              x: decomposed.x,
              y: decomposed.y,
              scaleX: (line.scaleX || 1) * groupTransform.scaleX,
              scaleY: (line.scaleY || 1) * groupTransform.scaleY,
              rotation: (line.rotation || 0) + groupTransform.rotation
            };
            
            onUpdateLine(line.id, updatedLine);
          }
        } else {
          const imageIndex = adjustedIndex - selectedLines.length;
          const image = selectedImages[imageIndex];
          if (image && onUpdateImage) {
            const currentWidth = image.width || 100;
            const currentHeight = image.height || 100;
            
            const updatedImage = {
              x: decomposed.x,
              y: decomposed.y,
              width: currentWidth * groupTransform.scaleX,
              height: currentHeight * groupTransform.scaleY,
              rotation: (image.rotation || 0) + groupTransform.rotation
            };
            
            onUpdateImage(image.id, updatedImage);
          }
        }
      });
    }

    group.x(0);
    group.y(0);
    group.scaleX(1);
    group.scaleY(1);
    group.rotation(0);

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
      
      <Transformer
        ref={transformerRef}
        boundBoxFunc={(oldBox, newBox) => {
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
