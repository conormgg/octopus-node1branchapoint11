
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
      className={`h-10 w-10 min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors duration-150 ${
        isActive ? 'bg-gray-700' : ''
      } @media(hover:hover):hover:bg-gray-600`}
      onClick={() => !isReadOnly && onClick()}
      disabled={isReadOnly}
    >
      {icon}
    </Button>
  );
};
