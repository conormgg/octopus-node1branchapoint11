
import React from 'react';
import { Maximize2, Minimize2, Eye } from 'lucide-react';

interface TopRightButtonsProps {
  isMaximized: boolean;
  shouldShowEyeButton: boolean;
  onMaximizeClick: () => void;
  onEyeClick: () => void;
  hasLastActivity?: boolean;
  syncState?: {
    isConnected: boolean;
    isReceiveOnly: boolean;
  };
}

const TopRightButtons: React.FC<TopRightButtonsProps> = ({
  isMaximized,
  shouldShowEyeButton,
  onMaximizeClick,
  onEyeClick,
  hasLastActivity = false,
  syncState
}) => {
  return (
    <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
      {/* Sync status indicator - only show if we have sync state */}
      {syncState && (
        <div className="flex items-center space-x-2 text-sm bg-white/90 hover:bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
          <div 
            className={`w-3 h-3 rounded-full ${syncState.isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className="text-gray-700 text-xs">
            {syncState.isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {syncState.isReceiveOnly && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Read Only</span>
          )}
        </div>
      )}

      {/* Eye button - only show for teacher-main and student-shared-teacher */}
      {shouldShowEyeButton && (
        <button
          onClick={onEyeClick}
          className={`p-2 rounded-lg bg-white/90 hover:bg-white border border-gray-200 shadow-sm transition-all duration-150 ${
            hasLastActivity 
              ? 'opacity-100 cursor-pointer' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          title={hasLastActivity ? "Center on last activity" : "No recent activity to center on"}
          disabled={!hasLastActivity}
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
