
import React, { useState } from 'react';
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
  const [currentColor, setCurrentColor] = useState('#000000');

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

  const colorOptions = [
    '#000000', // Black
    '#FF0000', // Red  
    '#0080FF', // Blue
    '#00C851', // Green
    '#FFFFFF', // White
  ];

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
          {/* Pen tool with dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 relative ${currentTool === 'pencil' ? 'bg-gray-700' : ''}`}
                onClick={() => !isReadOnly && onToolChange('pencil')}
                disabled={isReadOnly}
              >
                <Pen className="h-4 w-4" />
                <ChevronDown className="h-2 w-2 absolute -bottom-0.5 -right-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-64 p-4 bg-popover border" 
              align="start"
              side="bottom"
            >
              <div className="space-y-4">
                {/* Stroke width slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Stroke Width</span>
                    <span className="text-sm text-muted-foreground">{currentStrokeWidth}px</span>
                  </div>
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

                <Separator />

                {/* Color selector */}
                <div className="space-y-2">
                  <span className="text-sm font-medium">Color</span>
                  <div className="flex space-x-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          currentColor === color 
                            ? 'border-primary border-4' 
                            : color === '#FFFFFF' 
                              ? 'border-gray-300' 
                              : 'border-gray-600'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setCurrentColor(color)}
                        disabled={isReadOnly}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
