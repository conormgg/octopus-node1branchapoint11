
import React from 'react';
import { Maximize2, Minimize2, Eye } from 'lucide-react';

interface TopRightButtonsProps {
  isMaximized: boolean;
  shouldShowEyeButton: boolean;
  onMaximizeClick: () => void;
  onEyeClick: () => void;
}

const TopRightButtons: React.FC<TopRightButtonsProps> = ({
  isMaximized,
  shouldShowEyeButton,
  onMaximizeClick,
  onEyeClick
}) => {
  return (
    <div className="absolute top-3 right-3 z-10 flex gap-2">
      {/* Eye button - only show for teacher-main and student-shared-teacher */}
      {shouldShowEyeButton && (
        <button
          onClick={onEyeClick}
          className="p-2 rounded-lg bg-white/90 hover:bg-white border border-gray-200 shadow-sm transition-all duration-150 opacity-50 cursor-not-allowed"
          title="Center on last activity (Coming soon)"
          disabled
        >
          <Eye size={16} className="text-gray-600" />
        </button>
      )}
      
      {/* Maximize/Minimize button */}
      <button
        onClick={onMaximizeClick}
        className="p-2 rounded-lg bg-white/90 hover:bg-white border border-gray-200 shadow-sm transition-all duration-150"
        title={isMaximized ? "Minimize (Press Esc)" : "Maximize"}
      >
        {isMaximized ? (
          <Minimize2 size={16} className="text-gray-600" />
        ) : (
          <Maximize2 size={16} className="text-gray-600" />
        )}
      </button>
    </div>
  );
};

export default TopRightButtons;
