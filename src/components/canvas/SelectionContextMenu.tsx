
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Lock, Unlock } from 'lucide-react';
import { SelectionBounds, SelectedObject } from '@/types/whiteboard';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('contextMenu');

interface SelectionContextMenuProps {
  selectedObjects: SelectedObject[];
  groupBounds: SelectionBounds | null;
  onDelete: () => void;
  onToggleLock?: (imageIds: string[]) => void;
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
  debugLog('SelectionContextMenu', 'Render', {
    selectedCount: selectedObjects.length,
    hasGroupBounds: !!groupBounds,
    isVisible,
    groupBounds
  });

  if (!isVisible || !groupBounds || selectedObjects.length === 0) {
    debugLog('SelectionContextMenu', 'Not rendering - missing requirements', {
      isVisible,
      hasGroupBounds: !!groupBounds,
      selectedCount: selectedObjects.length
    });
    return null;
  }

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
    debugLog('SelectionContextMenu', 'Toggle lock called', { imageIds });
    onToggleLock(imageIds);
  };

  const handleDelete = () => {
    debugLog('SelectionContextMenu', 'Delete called', { selectedObjects });
    onDelete();
  };

  debugLog('SelectionContextMenu', 'Rendering context menu', {
    selectedCount: selectedObjects.length,
    hasImages,
    allImagesLocked,
    someImagesLocked
  });

  return (
    <div className="flex items-center gap-1 bg-background border border-border rounded-lg shadow-lg p-1">
      {/* Delete Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDelete}
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
