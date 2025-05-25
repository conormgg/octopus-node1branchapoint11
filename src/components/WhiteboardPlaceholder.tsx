
import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface WhiteboardPlaceholderProps {
  id: string;
  initialWidth?: number;
  initialHeight?: number;
  isMaximized?: boolean;
  onMaximize?: () => void;
  onMinimize?: () => void;
}

const WhiteboardPlaceholder: React.FC<WhiteboardPlaceholderProps> = ({
  id,
  initialWidth,
  initialHeight,
  isMaximized = false,
  onMaximize,
  onMinimize,
}) => {
  const handleMaximizeClick = () => {
    if (isMaximized && onMinimize) {
      onMinimize();
    } else if (!isMaximized && onMaximize) {
      onMaximize();
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
      style={{ 
        width: initialWidth ? `${initialWidth}px` : '100%',
        height: initialHeight ? `${initialHeight}px` : '100%'
      }}
    >
      {/* Toolbar Area */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="text-sm font-medium text-gray-700">
          Toolbar for {id}
        </div>
        <button
          onClick={handleMaximizeClick}
          className="p-1 rounded hover:bg-gray-200 transition-colors duration-150"
          title={isMaximized ? "Minimize" : "Maximize"}
        >
          {isMaximized ? (
            <Minimize2 size={16} className="text-gray-600" />
          ) : (
            <Maximize2 size={16} className="text-gray-600" />
          )}
        </button>
      </div>
      
      {/* Whiteboard Content Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-25 relative overflow-hidden">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-500 rounded"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Whiteboard: {id}
          </h3>
          <p className="text-sm text-gray-500">
            Placeholder for collaborative whiteboard
          </p>
        </div>
        
        {/* Grid pattern background */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              radial-gradient(circle, #666 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px'
          }}
        ></div>
      </div>
    </div>
  );
};

export default WhiteboardPlaceholder;
