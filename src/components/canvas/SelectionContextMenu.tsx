
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Lock, Unlock } from 'lucide-react';
import { SelectionBounds, SelectedObject } from '@/types/whiteboard';

interface SelectionContextMenuProps {
  selectedObjects: SelectedObject[];
  groupBounds: SelectionBounds | null;
  onDelete: () => void;
  onToggleLock?: (imageIds: string[], lock: boolean) => void;
  isVisible: boolean;
  images?: Array<{ id: string; locked?: boolean }>;
}

export const SelectionContextMenu: React.FC<SelectionContextMenuProps> = ({
  selectedObjects,
  groupBounds,
  onDelete,
  onToggleLock,
  isVisible,
  images = []
}) => {
  if (!isVisible || !groupBounds || selectedObjects.length === 0) {
    return null;
  }

  // Calculate menu position - position above the selection bounds with some padding
  const menuX = groupBounds.x + groupBounds.width / 2;
  const menuY = groupBounds.y - 60; // 60px above the selection
  
  // Check if any selected objects are images and get their lock status
  const selectedImages = selectedObjects
    .filter(obj => obj.type === 'image')
    .map(obj => images.find(img => img.id === obj.id))
    .filter(Boolean);
  
  const hasImages = selectedImages.length > 0;
  const allImagesLocked = selectedImages.every(img => img?.locked);
  const someImagesLocked = selectedImages.some(img => img?.locked);

  const handleToggleLock = () => {
    if (!onToggleLock || !hasImages) return;
    
    const imageIds = selectedImages.map(img => img!.id);
    // If all are locked, unlock them. If none or some are locked, lock all
    const shouldLock = !allImagesLocked;
    onToggleLock(imageIds, shouldLock);
  };

  return (
    <div
      className="absolute z-50 flex items-center gap-1 bg-background border border-border rounded-lg shadow-lg p-1"
      style={{
        left: menuX,
        top: menuY,
        transform: 'translateX(-50%)', // Center horizontally
      }}
    >
      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[40px] px-3"
        title={`Delete ${selectedObjects.length} object${selectedObjects.length === 1 ? '' : 's'}`}
      >
        <Trash2 size={16} />
        <span className="text-sm font-medium">
          Delete {selectedObjects.length}
        </span>
      </Button>

      {/* Lock/Unlock Button - only show if images are selected */}
      {hasImages && onToggleLock && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleLock}
          className="flex items-center gap-2 hover:bg-accent hover:text-accent-foreground min-h-[40px] px-3"
          title={allImagesLocked ? 'Unlock images' : 'Lock images'}
        >
          {allImagesLocked ? <Unlock size={16} /> : <Lock size={16} />}
          <span className="text-sm font-medium">
            {allImagesLocked ? 'Unlock' : 'Lock'}
            {someImagesLocked && !allImagesLocked ? ' All' : ''}
          </span>
        </Button>
      )}
    </div>
  );
};
