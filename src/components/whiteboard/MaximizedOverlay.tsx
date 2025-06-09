
import React from 'react';

interface MaximizedOverlayProps {
  isMaximized: boolean;
  onBackdropClick: (e: React.MouseEvent) => void;
}

const MaximizedOverlay: React.FC<MaximizedOverlayProps> = ({
  isMaximized,
  onBackdropClick
}) => {
  if (!isMaximized) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[9998]" 
      onClick={onBackdropClick}
    />
  );
};

export default MaximizedOverlay;
