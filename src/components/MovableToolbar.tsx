
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pen, Eraser, MousePointer, ChevronDown } from 'lucide-react';
import { Tool } from '@/types/whiteboard';

interface MovableToolbarProps {
  currentTool: Tool;
  currentStrokeWidth: number;
  currentStrokeColor?: string;
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: Tool) => void;
  onStrokeWidthChange: (width: number) => void;
  onStrokeColorChange?: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  isReadOnly?: boolean;
  containerWidth?: number;
  containerHeight?: number;
}

const MovableToolbar: React.FC<MovableToolbarProps> = ({
  currentTool,
  currentStrokeWidth,
  currentStrokeColor = '#000000',
  canUndo,
  canRedo,
  onToolChange,
  onStrokeWidthChange,
  onStrokeColorChange,
  onUndo,
  onRedo,
  isReadOnly = false,
  containerWidth = 0,
  containerHeight = 0
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    e.preventDefault();
    e.stopPropagation();
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;
    
    // Apply boundary constraints if container dimensions are available
    if (containerWidth > 0 && containerHeight > 0 && toolbarRef.current) {
      const toolbarRect = toolbarRef.current.getBoundingClientRect();
      const toolbarWidth = toolbarRect.width;
      const toolbarHeight = toolbarRect.height;
      
      // Constrain to container bounds
      newX = Math.max(0, Math.min(newX, containerWidth - toolbarWidth));
      newY = Math.max(0, Math.min(newY, containerHeight - toolbarHeight));
    }
    
    setPosition({
      x: newX,
      y: newY
    });
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setIsDragging(false);
    }
  };

  // Use useEffect to manage event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset.x, dragOffset.y]);

  const colorOptions = [
    '#000000', // Black
    '#FF0000', // Red  
    '#0080FF', // Blue
    '#00C851', // Green
  ];

  return (
    <Card
      ref={toolbarRef}
      className="absolute shadow-md rounded-lg z-40 select-none bg-black text-white"
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
        <div className="flex space-x-1" onMouseDown={(e) => e.stopPropagation()}>
          {/* Pen tool with dropdown */}
          <div className="relative flex">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-6 rounded-r-none ${currentTool === 'pencil' ? 'bg-gray-700' : ''}`}
              onClick={() => !isReadOnly && onToolChange('pencil')}
              disabled={isReadOnly}
            >
              <Pen className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-4 rounded-l-none border-l border-gray-600 px-1"
                  disabled={isReadOnly}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-48 p-3 bg-gray-800 border-gray-700 z-50" 
              align="start"
              side="bottom"
              sideOffset={5}
              avoidCollisions={true}
            >
              <div className="space-y-3">
                {/* Thickness slider */}
                <div>
                  <Slider
                    value={[currentStrokeWidth]}
                    onValueChange={(value) => !isReadOnly && onStrokeWidthChange(value[0])}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                    disabled={isReadOnly}
                  />
                </div>

                {/* Color selector */}
                <div className="flex space-x-2 justify-center">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        currentStrokeColor === color 
                          ? 'border-white border-4' 
                          : 'border-gray-500'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => !isReadOnly && onStrokeColorChange?.(color)}
                      disabled={isReadOnly}
                    />
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
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
        </div>
      </div>
    </Card>
  );
};

export default MovableToolbar;
