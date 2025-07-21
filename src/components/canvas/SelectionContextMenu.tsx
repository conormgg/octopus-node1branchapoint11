
import React from 'react';
import { Lock, Unlock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SelectedObject } from '@/types/whiteboard';

interface SelectionContextMenuProps {
  x: number;
  y: number;
  selectedObjects: SelectedObject[];
  onDelete: () => void;
  onToggleLock: () => void;
  onClose: () => void;
  hasLockedImages: boolean;
  hasUnlockedImages: boolean;
}

const SelectionContextMenu: React.FC<SelectionContextMenuProps> = ({
  x,
  y,
  selectedObjects,
  onDelete,
  onToggleLock,
  onClose,
  hasLockedImages,
  hasUnlockedImages
}) => {
  const imageCount = selectedObjects.filter(obj => obj.type === 'image').length;
  const totalCount = selectedObjects.length;
  const isMultipleObjects = totalCount > 1;

  const getDeleteButtonText = () => {
    if (isMultipleObjects) {
      return `Delete ${totalCount} objects`;
    }
    return selectedObjects[0]?.type === 'image' ? 'Delete image' : 'Delete drawing';
  };

  const getLockButtonText = () => {
    if (hasLockedImages && hasUnlockedImages) {
      return 'Toggle lock';
    }
    if (hasLockedImages) {
      return isMultipleObjects ? 'Unlock images' : 'Unlock image';
    }
    return isMultipleObjects ? 'Lock images' : 'Lock image';
  };

  const getLockIcon = () => {
    if (hasLockedImages && hasUnlockedImages) {
      return Lock; // Mixed state, show lock icon
    }
    return hasLockedImages ? Unlock : Lock;
  };

  const LockIcon = getLockIcon();

  return (
    <Card 
      className="absolute z-50 p-2 shadow-lg bg-popover border min-w-[160px]"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onMouseLeave={onClose}
    >
      <div className="space-y-1">
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
          {getDeleteButtonText()}
        </Button>
        
        {imageCount > 0 && (
          <>
            <Separator />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                onToggleLock();
                onClose();
              }}
            >
              <LockIcon className="h-4 w-4 mr-2" />
              {getLockButtonText()}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default SelectionContextMenu;
