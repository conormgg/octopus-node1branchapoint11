
import React from 'react';
import { Pen, Eraser } from 'lucide-react';

interface WhiteboardToolbarProps {
  activeTool: 'pen' | 'eraser';
  onToolChange: (tool: 'pen' | 'eraser') => void;
}

const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({ 
  activeTool, 
  onToolChange 
}) => {
  return (
    <div className="absolute top-3 left-3 z-10 flex gap-2 bg-black rounded-lg p-2 shadow-lg">
      <button
        onClick={() => onToolChange('pen')}
        className={`p-2 rounded transition-colors ${
          activeTool === 'pen' 
            ? 'bg-white text-black' 
            : 'text-white hover:bg-gray-700'
        }`}
        title="Pen"
      >
        <Pen size={16} />
      </button>
      
      <button
        onClick={() => onToolChange('eraser')}
        className={`p-2 rounded transition-colors ${
          activeTool === 'eraser' 
            ? 'bg-white text-black' 
            : 'text-white hover:bg-gray-700'
        }`}
        title="Eraser"
      >
        <Eraser size={16} />
      </button>
    </div>
  );
};

export default WhiteboardToolbar;
