import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Pen, Eraser, MousePointer } from 'lucide-react';
import { Tool } from '@/types/whiteboard';

interface MovableToolbarProps {
  currentTool: Tool;
  currentStrokeWidth: number;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: Tool) => void;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  isReadOnly?: boolean;
}

const MovableToolbar: React.FC<MovableToolbarProps> = ({
  currentTool,
  currentStrokeWidth,
  canUndo,
  canRedo,
  onToolChange,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  isReadOnly = false
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // Add event listeners to document to handle dragging
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <Card
      className="absolute shadow-md rounded-lg z-10 select-none bg-black text-white"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <div
        className="p-2 flex items-center justify-between"
        onMouseDown={handleMouseDown}
      >
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${currentTool === 'pencil' ? 'bg-gray-700' : ''}`}
            onClick={() => !isReadOnly && onToolChange('pencil')}
            disabled={isReadOnly}
          >
            <Pen className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${currentTool === 'eraser' ? 'bg-gray-700' : ''}`}
            onClick={() => !isReadOnly && onToolChange('eraser')}
            disabled={isReadOnly}
          >
            <Eraser className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${currentTool === 'select' ? 'bg-gray-700' : ''}`}
            onClick={() => !isReadOnly && onToolChange('select')}
            disabled={isReadOnly}
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-8 bg-gray-600" />
          
          {/* Stroke width slider for current tool */}
          <div className="flex items-center space-x-1">
            <input
              type="range"
              min="1"
              max="20"
              value={currentStrokeWidth}
              onChange={(e) => !isReadOnly && onStrokeWidthChange(parseInt(e.target.value))}
              className="w-20"
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MovableToolbar;
