
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
import { Pen, Eraser, MousePointer, ChevronDown, Highlighter } from 'lucide-react';
import { Tool } from '@/types/whiteboard';

interface MovableToolbarProps {
  currentTool: Tool;
  currentStrokeWidth: number;
  currentStrokeColor?: string;
  pencilSettings?: { color: string; strokeWidth: number };
  highlighterSettings?: { color: string; strokeWidth: number };
  canUndo: boolean;
  canRedo: boolean;
  onToolChange: (tool: Tool) => void;
  onStrokeWidthChange: (width: number) => void;
  onStrokeColorChange?: (color: string) => void;
  onPencilColorChange?: (color: string) => void;
  onHighlighterColorChange?: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  isReadOnly?: boolean;
  containerWidth?: number;
  containerHeight?: number;
  portalContainer?: Element | null;
}

const MovableToolbar: React.FC<MovableToolbarProps> = ({
  currentTool,
  currentStrokeWidth,
  currentStrokeColor = '#000000',
  pencilSettings = { color: '#000000', strokeWidth: 5 },
  highlighterSettings = { color: '#FFFF00', strokeWidth: 12 },
  canUndo,
  canRedo,
  onToolChange,
  onStrokeWidthChange,
  onStrokeColorChange,
  onPencilColorChange,
  onHighlighterColorChange,
  onUndo,
  onRedo,
  isReadOnly = false,
  containerWidth = 0,
  containerHeight = 0,
  portalContainer: externalPortalContainer
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  // Determine the correct document and window context
  const targetDocument = React.useMemo(() => {
    if (externalPortalContainer) {
      return externalPortalContainer.ownerDocument || document;
    }
    return document;
  }, [externalPortalContainer]);

  const targetWindow = React.useMemo(() => {
    return targetDocument.defaultView || window;
  }, [targetDocument]);

  // Use external portal container directly instead of falling back to body
  const portalContainer = externalPortalContainer;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left mouse button
    e.preventDefault();
    e.stopPropagation();
    
    // Get toolbar's current position relative to its container
    if (toolbarRef.current && externalPortalContainer) {
      const toolbarRect = toolbarRef.current.getBoundingClientRect();
      const containerRect = externalPortalContainer.getBoundingClientRect();
      
      // Calculate click offset relative to toolbar's top-left corner
      const offsetX = e.clientX - toolbarRect.left;
      const offsetY = e.clientY - toolbarRect.top;
      
      console.log('[MovableToolbar] Mouse down:', {
        clientX: e.clientX,
        clientY: e.clientY,
        toolbarRect,
        containerRect,
        offsetX,
        offsetY,
        currentPosition: position
      });
      
      setDragOffset({ x: offsetX, y: offsetY });
    } else {
      // Fallback for main window
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
    
    setIsDragging(true);
  };

  // REVISED event listener effect to fix dragging in pop-up window
  React.useEffect(() => {
    // Define handlers inside the effect to avoid stale closures
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !toolbarRef.current) return;
      e.preventDefault();
      
      let newX, newY;
      
      if (externalPortalContainer) {
        const containerRect = externalPortalContainer.getBoundingClientRect();
        newX = e.clientX - containerRect.left - dragOffset.x;
        newY = e.clientY - containerRect.top - dragOffset.y;
      } else {
        newX = e.clientX - dragOffset.x;
        newY = e.clientY - dragOffset.y;
      }
      
      if (containerWidth > 0 && containerHeight > 0) {
        const toolbarRect = toolbarRef.current.getBoundingClientRect();
        const toolbarWidth = toolbarRect.width;
        const toolbarHeight = toolbarRect.height;
        
        newX = Math.max(0, Math.min(newX, containerWidth - toolbarWidth));
        newY = Math.max(0, Math.min(newY, containerHeight - toolbarHeight));
      }
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        setIsDragging(false);
      }
    };

    if (isDragging) {
      // Attach listeners to the correct document (main window or pop-up)
      targetDocument.addEventListener('mousemove', handleMouseMove);
      targetDocument.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        targetDocument.removeEventListener('mousemove', handleMouseMove);
        targetDocument.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, targetDocument, externalPortalContainer, containerWidth, containerHeight]);

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
              className="w-48 p-3 bg-gray-800 border-gray-700 text-white" 
              align="start"
              side="bottom"
              sideOffset={5}
              avoidCollisions={true}
              style={{ zIndex: 9999 }}
              container={portalContainer}
            >
              <div className="space-y-3">
                {/* Thickness slider */}
                <div>
                  <Slider
                    value={[pencilSettings.strokeWidth]}
                    onValueChange={(value) => {
                      if (!isReadOnly) {
                        onToolChange('pencil');
                        onStrokeWidthChange(value[0]);
                      }
                    }}
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
                        pencilSettings.color === color 
                          ? 'border-white border-4' 
                          : 'border-gray-500'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        if (!isReadOnly) {
                          onPencilColorChange?.(color);
                        }
                      }}
                      disabled={isReadOnly}
                    />
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Highlighter tool with dropdown */}
          <div className="relative flex">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-6 rounded-r-none ${currentTool === 'highlighter' ? 'bg-gray-700' : ''}`}
              onClick={() => !isReadOnly && onToolChange('highlighter')}
              disabled={isReadOnly}
            >
              <Highlighter className="h-4 w-4" />
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
                className="w-48 p-3 bg-gray-800 border-gray-700 text-white" 
                align="start"
                side="bottom"
                sideOffset={5}
                avoidCollisions={true}
                style={{ zIndex: 9999 }}
                container={portalContainer}
              >
                <div className="space-y-3">
                  {/* Thickness slider */}
                  <div>
                    <Slider
                      value={[highlighterSettings.strokeWidth]}
                      onValueChange={(value) => {
                        if (!isReadOnly) {
                          onToolChange('highlighter');
                          onStrokeWidthChange(value[0]);
                        }
                      }}
                      min={8}
                      max={30}
                      step={2}
                      className="w-full"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* Highlighter color selector */}
                  <div className="flex space-x-2 justify-center">
                    {[
                      '#FFFF00', // Yellow
                      '#FFA500', // Orange
                      '#00BFFF', // Blue
                      '#32CD32'  // Green
                    ].map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          highlighterSettings.color === color 
                            ? 'border-white border-4' 
                            : 'border-gray-500'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          if (!isReadOnly) {
                            onHighlighterColorChange?.(color);
                          }
                        }}
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
