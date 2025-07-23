
import React from 'react';
import { Layer } from 'react-konva';
import { ImageObject } from '@/types/whiteboard';
import ImageRenderer from '../ImageRenderer';

interface ImagesLayerProps {
  images?: ImageObject[];
  currentTool?: string;
  selection?: {
    isObjectSelected: (id: string) => boolean;
    hoveredObjectId: string | null;
    selectObjects: (objects: { id: string; type: 'image' }[]) => void;
    setHoveredObjectId: (id: string | null) => void;
  };
  onUpdateImage?: (imageId: string, updates: Partial<ImageObject>) => void;
  onUpdateState?: () => void;
  extraContent?: React.ReactNode;
}

const ImagesLayer: React.FC<ImagesLayerProps> = ({ 
  images = [], 
  currentTool = 'pencil',
  selection,
  onUpdateImage,
  onUpdateState,
  extraContent 
}) => {
  return (
    <Layer>
      {/* Render individual images */}
      {images.map((image) => {
        const isSelected = selection?.isObjectSelected(image.id) || false;
        const isHovered = selection?.hoveredObjectId === image.id;
        
        return (
          <ImageRenderer
            key={image.id}
            imageObject={image}
            isSelected={isSelected}
            isHovered={isHovered}
            onSelect={() => {
              if (selection && (currentTool === 'select' || currentTool === 'select2')) {
                selection.selectObjects([{ id: image.id, type: 'image' }]);
              }
            }}
            onChange={(updates) => {
              if (onUpdateImage) {
                onUpdateImage(image.id, updates);
              }
            }}
            onUpdateState={onUpdateState || (() => {})}
            currentTool={currentTool}
            onMouseEnter={(currentTool === 'select' || currentTool === 'select2') ? () => {
              if (selection?.setHoveredObjectId) {
                selection.setHoveredObjectId(image.id);
              }
            } : undefined}
            onMouseLeave={(currentTool === 'select' || currentTool === 'select2') ? () => {
              if (selection?.setHoveredObjectId) {
                selection.setHoveredObjectId(null);
              }
            } : undefined}
          />
        );
      })}
      
      {/* Extra content */}
      {extraContent}
    </Layer>
  );
};

export default ImagesLayer;
