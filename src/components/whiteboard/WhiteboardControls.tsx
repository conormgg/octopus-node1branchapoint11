
import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface WhiteboardControlsProps {
  isMaximized: boolean;
  onMaximizeClick: () => void;
}

const WhiteboardControls: React.FC<WhiteboardControlsProps> = ({
  isMaximized,
  onMaximizeClick
}) => {
  return (
    <button
      onClick={onMaximizeClick}
      className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-white/90 hover:bg-white border border-gray-200 shadow-sm transition-all duration-150"
      title={isMaximized ? "Minimize (Press Esc)" : "Maximize"}
    >
      {isMaximized ? (
        <Minimize2 size={16} className="text-gray-600" />
      ) : (
        <Maximize2 size={16} className="text-gray-600" />
      )}
    </button>
  );
};

export default WhiteboardControls;
