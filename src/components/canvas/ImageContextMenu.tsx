import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ImageContextMenuProps {
  x: number;
  y: number;
  isLocked: boolean;
  onToggleLock: () => void;
  onClose: () => void;
}

const ImageContextMenu: React.FC<ImageContextMenuProps> = ({
  x,
  y,
  isLocked,
  onToggleLock,
  onClose
}) => {
  return (
    <Card 
      className="absolute z-50 p-2 shadow-lg bg-white border"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
      onMouseLeave={onClose}
    >
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={() => {
          onToggleLock();
          onClose();
        }}
      >
        {isLocked ? (
          <>
            <Unlock className="h-4 w-4 mr-2" />
            Unlock Image
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Lock Image
          </>
        )}
      </Button>
    </Card>
  );
};

export default ImageContextMenu;
