
import { useCallback } from 'react';
import Konva from 'konva';
import { LineObject, ImageObject } from '@/types/whiteboard';

interface UseGroupTransformProps {
  selectedLines: LineObject[];
  selectedImages: ImageObject[];
  onUpdateLine?: (lineId: string, updates: Partial<LineObject>) => void;
  onUpdateImage?: (imageId: string, updates: Partial<ImageObject>) => void;
  onTransformEnd?: () => void;
}

export const useGroupTransform = ({
  selectedLines,
  selectedImages,
  onUpdateLine,
  onUpdateImage,
  onTransformEnd
}: UseGroupTransformProps) => {
  const handleTransformEnd = useCallback((groupRef: React.RefObject<Konva.Group>) => {
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
            y: attrs.y
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
            height: (image.height || 100) * attrs.scaleY
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

    if (onTransformEnd) {
      onTransformEnd();
    }
  }, [selectedLines, selectedImages, onUpdateLine, onUpdateImage, onTransformEnd]);

  return { handleTransformEnd };
};
