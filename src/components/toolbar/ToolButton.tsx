
import React from 'react';
import { Button } from '@/components/ui/button';

interface ToolButtonProps {
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  isReadOnly: boolean;
}

export const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  isActive,
  onClick,
  isReadOnly
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-8 w-8 ${isActive ? 'bg-gray-700' : ''}`}
      onClick={() => !isReadOnly && onClick()}
      disabled={isReadOnly}
    >
      {icon}
    </Button>
  );
};
