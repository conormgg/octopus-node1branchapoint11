import React from 'react';
import { Trash2, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SelectedObject, ImageObject } from '@/types/whiteboard';

interface SelectionContextMenuProps {
  x: number;
  y: number;
  selectedObjects: SelectedObject[];
  images: ImageObject[];
  onDelete: () => void;
  onLockImages: () => void;
  onUnlockImages: () => void;
  onClose: () => void;
}

const SelectionContextMenu: React.FC<SelectionContextMenuProps> = ({
  x,
  y,
  selectedObjects,
  images,
  onDelete,
  onLockImages,
  onUnlockImages,
  onClose
}) => {
  // Get selected image objects
  const selectedImages = selectedObjects
    .filter(obj => obj.type === 'image')
    .map(obj => images.find(img => img.id === obj.id))
    .filter(Boolean) as ImageObject[];

  // Determine lock state of selected images
  const lockedImages = selectedImages.filter(img => img.locked);
  const unlockedImages = selectedImages.filter(img => !img.locked);
  
  const hasImages = selectedImages.length > 0;
  const allImagesLocked = hasImages && lockedImages.length === selectedImages.length;
  const allImagesUnlocked = hasImages && unlockedImages.length === selectedImages.length;
  const mixedLockState = hasImages && lockedImages.length > 0 && unlockedImages.length > 0;

  // Generate appropriate labels
  const getDeleteLabel = () => {
    if (selectedObjects.length === 1) {
      return selectedObjects[0].type === 'image' ? 'Delete Image' : 'Delete Line';
    }
    return 'Delete Selection';
  };

  const getLockLabel = () => {
    if (selectedImages.length === 1) return 'Lock Image';
    return 'Lock Images';
  };

  const getUnlockLabel = () => {
    if (selectedImages.length === 1) return 'Unlock Image';
    return 'Unlock Images';
  };

  return (
    <Card 
      className="absolute z-50 p-2 shadow-lg bg-background border"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onMouseLeave={onClose}
    >
      <div className="flex flex-col gap-1">
        {/* Delete option - always available */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {getDeleteLabel()}
        </Button>

        {/* Lock/Unlock options - only for images */}
        {hasImages && (
          <>
            {/* Show Lock option if: all unlocked OR mixed state */}
            {(allImagesUnlocked || mixedLockState) && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  onLockImages();
                  onClose();
                }}
              >
                <Lock className="h-4 w-4 mr-2" />
                {getLockLabel()}
              </Button>
            )}

            {/* Show Unlock option if: all locked OR mixed state */}
            {(allImagesLocked || mixedLockState) && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  onUnlockImages();
                  onClose();
                }}
              >
                <Unlock className="h-4 w-4 mr-2" />
                {getUnlockLabel()}
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default SelectionContextMenu;