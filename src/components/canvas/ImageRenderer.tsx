import React, { useState, useRef, useEffect } from 'react';
import { Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import { ImageObject } from '@/types/whiteboard';
import { useObjectLocking } from '@/hooks/useObjectLocking';
import { useSelectEventHandlers } from '@/hooks/useSelectEventHandlers';

interface ImageRendererProps {
  image: ImageObject;
  isSelected: boolean;
  stageRef: React.RefObject<any>;
  onTransform: (id: string, transform: any) => void;
  onDelete: (id: string) => void;
  lines: any[];
  images: any[];
  panZoomState: { x: number; y: number; scale: number };
  panZoom: any;
  onUpdateLine?: (lineId: string, updates: any) => void;
  onUpdateImage?: (imageId: string, updates: any) => void;
  onDeleteObjects?: (selectedObjects: Array<{id: string, type: 'line' | 'image'}>) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  selectObjects: (objects: Array<{id: string, type: 'line' | 'image'}>) => void;
  clearSelection: () => void;
  setSelectionBounds: (bounds: any) => void;
  setIsSelecting: (selecting: boolean) => void;
  selectedObjects: Array<{id: string, type: 'line' | 'image'}>;
  isSelecting: boolean;
  selectionBounds: any;
}

const ImageRenderer: React.FC<ImageRendererProps> = ({
  image,
  isSelected,
  stageRef,
  onTransform,
  onDelete,
  lines,
  images,
  panZoomState,
  panZoom,
  onUpdateLine,
  onUpdateImage,
  onDeleteObjects,
  containerRef,
  selectObjects,
  clearSelection,
  setSelectionBounds,
  setIsSelecting,
  selectedObjects,
  isSelecting,
  selectionBounds
}) => {
  const [img] = useImage(image.src);
  const imageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const { isObjectLocked, toggleObjectLock } = useObjectLocking(image.id);

  useEffect(() => {
    if (isSelected && transformerRef.current) {
      transformerRef.current.nodes([imageRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  // Select handlers for interaction
  const selectHandlers = useSelectEventHandlers({
    stageRef,
    lines,
    images,
    panZoomState,
    panZoom,
    onUpdateLine,
    onUpdateImage,
    onDeleteObjects,
    containerRef,
    mainSelection: {
      selectObjects,
      clearSelection,
      setSelectionBounds,
      setIsSelecting,
      selectionState: {
        selectedObjects,
        isSelecting,
        selectionBounds
      }
    }
  });

  const handleTransform = () => {
    if (!imageRef.current) return;

    const node = imageRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Reset scaling to 1 for accurate width/height
    node.scaleX(1);
    node.scaleY(1);

    onTransform(image.id, {
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: rotation
    });
  };

  return (
    <>
      <KonvaImage
        image={img}
        x={image.x}
        y={image.y}
        width={image.width}
        height={image.height}
        rotation={(image as any).rotation || 0}
        draggable={isSelected && !isObjectLocked}
        ref={imageRef}
        onDblClick={() => toggleObjectLock(image.id)}
        onTap={() => toggleObjectLock(image.id)}
        onTransformEnd={handleTransform}
        onDragEnd={handleTransform}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default ImageRenderer;
