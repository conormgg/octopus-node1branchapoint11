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
  onTransformStateChange?: (isTransforming: boolean) => void; // New prop to communicate transform state
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
  onTransformStateChange,
  currentTool = 'select',
  isVisible = true
}) => {
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [isGroupTransformActive, setIsGroupTransformActive] = useState(false);

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

  // Set up transformer when group is created or objects change position
  useEffect(() => {
    if (shouldShowGroup && groupRef.current && transformerRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [shouldShowGroup, selectedObjects.length, selectedLines, selectedImages, currentTool]);

  // Handle group transformation
  const handleTransformStart = () => {
    console.log('[SelectionGroup] Transform start - activating group transform flag');
    setIsTransforming(true);
    setIsGroupTransformActive(true);
    // Notify parent component that transform is active
    onTransformStateChange?.(true);
  };

  const handleDragMove = () => {
    if (transformerRef.current && groupRef.current) {
      transformerRef.current.forceUpdate();
    }
  };

  const handleTransformEnd = () => {
    console.log('[SelectionGroup] Transform end - group transform handling');
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
    
    // Simple translation only
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
      // Handle scaling and rotation - apply transforms directly to objects
      selectedLines.forEach((line) => {
        if (onUpdateLine) {
          // Calculate new position accounting for group center
          const centerX = (groupBounds?.x || 0) + (groupBounds?.width || 0) / 2;
          const centerY = (groupBounds?.y || 0) + (groupBounds?.height || 0) / 2;
          
          // Translate to origin, scale, rotate, translate back
          const relX = line.x - centerX;
          const relY = line.y - centerY;
          
          const rotRad = groupTransform.rotation * Math.PI / 180;
          const cos = Math.cos(rotRad);
          const sin = Math.sin(rotRad);
          
          const newRelX = (relX * cos - relY * sin) * groupTransform.scaleX;
          const newRelY = (relX * sin + relY * cos) * groupTransform.scaleY;
          
          onUpdateLine(line.id, {
            x: newRelX + centerX + groupTransform.x,
            y: newRelY + centerY + groupTransform.y,
            scaleX: (line.scaleX || 1) * groupTransform.scaleX,
            scaleY: (line.scaleY || 1) * groupTransform.scaleY,
            rotation: (line.rotation || 0) + groupTransform.rotation
          });
        }
      });
      
      selectedImages.forEach((image) => {
        if (onUpdateImage) {
          // Calculate new position accounting for group center
          const centerX = (groupBounds?.x || 0) + (groupBounds?.width || 0) / 2;
          const centerY = (groupBounds?.y || 0) + (groupBounds?.height || 0) / 2;
          
          // Translate to origin, scale, rotate, translate back
          const relX = image.x - centerX;
          const relY = image.y - centerY;
          
          const rotRad = groupTransform.rotation * Math.PI / 180;
          const cos = Math.cos(rotRad);
          const sin = Math.sin(rotRad);
          
          const newRelX = (relX * cos - relY * sin) * groupTransform.scaleX;
          const newRelY = (relX * sin + relY * cos) * groupTransform.scaleY;
          
          const currentWidth = image.width || 100;
          const currentHeight = image.height || 100;
          
          onUpdateImage(image.id, {
            x: newRelX + centerX + groupTransform.x,
            y: newRelY + centerY + groupTransform.y,
            width: currentWidth * groupTransform.scaleX,
            height: currentHeight * groupTransform.scaleY,
            rotation: (image.rotation || 0) + groupTransform.rotation
          });
        }
      });
    }

    // Reset group transform
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

    // Delay resetting the flag to ensure individual objects see it during their transform events
    setTimeout(() => {
      console.log('[SelectionGroup] Deactivating group transform flag');
      setIsGroupTransformActive(false);
      // Notify parent component that transform is no longer active
      onTransformStateChange?.(false);
    }, 100);

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
        draggable={isDraggable}
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
      
      {/* Show transformer for both select and select2, but make it non-interactive for select2 */}
      {shouldShowGroup && (
        <Transformer
          ref={transformerRef}
          listening={currentTool === 'select' || currentTool === 'select2'}
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
      )}
    </>
  );
};

export default SelectionGroup;
