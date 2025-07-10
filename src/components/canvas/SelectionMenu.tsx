import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { SelectionBounds } from '@/types/whiteboard';

interface SelectionMenuProps {
  selectionBounds: SelectionBounds | null;
  selectedCount: number;
  onDelete: () => void;
  isVisible: boolean;
}

const SelectionMenu: React.FC<SelectionMenuProps> = ({
  selectionBounds,
  selectedCount,
  onDelete,
  isVisible
}) => {
  if (!isVisible || !selectionBounds || selectedCount === 0) {
    return null;
  }

  // Position the menu above the selection bounds
  const menuX = selectionBounds.x + selectionBounds.width / 2;
  const menuY = selectionBounds.y - 50; // 50px above the selection

  return (
    <div
      className="absolute z-50 bg-background border border-border rounded-lg shadow-lg p-2 flex items-center gap-2"
      style={{
        left: `${menuX}px`,
        top: `${menuY}px`,
        transform: 'translateX(-50%)',
        pointerEvents: 'auto'
      }}
    >
      <span className="text-sm text-muted-foreground px-2">
        {selectedCount} selected
      </span>
      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        className="h-8 px-3"
      >
        <Trash2 size={16} className="mr-1" />
        Delete
      </Button>
    </div>
  );
};

export default SelectionMenu;