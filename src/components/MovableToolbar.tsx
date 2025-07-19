
import React from 'react';
import { Card } from '@/components/ui/card';
import { Pen, Eraser, MousePointer, Highlighter, Undo, Redo, MousePointer2 } from 'lucide-react';
import { Tool } from '@/types/whiteboard';
import { useToolbarDrag } from '@/hooks/useToolbarDrag';
import { ToolDropdown } from './toolbar/ToolDropdown';
import { ToolButton } from './toolbar/ToolButton';

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
  portalContainer
}) => {
  const { position, isDragging, toolbarRef, handleMouseDown } = useToolbarDrag({
    containerWidth,
    containerHeight,
    externalPortalContainer: portalContainer
  });

  const pencilColors = [
    '#000000', // Black
    '#FF0000', // Red  
    '#0080FF', // Blue
    '#00C851', // Green
  ];

  const highlighterColors = [
    '#FFFF00', // Yellow
    '#FFA500', // Orange
    '#00BFFF', // Blue
    '#32CD32'  // Green
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
          <ToolDropdown
            icon={<Pen className="h-4 w-4" />}
            isActive={currentTool === 'pencil'}
            strokeWidth={pencilSettings.strokeWidth}
            color={pencilSettings.color}
            colors={pencilColors}
            minStrokeWidth={1}
            maxStrokeWidth={20}
            strokeWidthStep={1}
            onToolSelect={() => onToolChange('pencil')}
            onStrokeWidthChange={onStrokeWidthChange}
            onColorChange={(color) => onPencilColorChange?.(color)}
            isReadOnly={isReadOnly}
            portalContainer={portalContainer}
          />

          {/* Highlighter tool with dropdown */}
          <ToolDropdown
            icon={<Highlighter className="h-4 w-4" />}
            isActive={currentTool === 'highlighter'}
            strokeWidth={highlighterSettings.strokeWidth}
            color={highlighterSettings.color}
            colors={highlighterColors}
            minStrokeWidth={8}
            maxStrokeWidth={30}
            strokeWidthStep={2}
            onToolSelect={() => onToolChange('highlighter')}
            onStrokeWidthChange={onStrokeWidthChange}
            onColorChange={(color) => onHighlighterColorChange?.(color)}
            isReadOnly={isReadOnly}
            portalContainer={portalContainer}
          />
          
          <ToolButton
            icon={<Eraser className="h-4 w-4" />}
            isActive={currentTool === 'eraser'}
            onClick={() => onToolChange('eraser')}
            isReadOnly={isReadOnly}
          />
          
          <ToolButton
            icon={<MousePointer className="h-4 w-4" />}
            isActive={currentTool === 'select'}
            onClick={() => onToolChange('select')}
            isReadOnly={isReadOnly}
          />

          {/* Select2 tool (experimental) */}
          <ToolButton
            icon={<MousePointer2 className="h-4 w-4" />}
            isActive={currentTool === 'select2'}
            onClick={() => onToolChange('select2')}
            isReadOnly={isReadOnly}
          />

          {/* Separator */}
          <div className="w-px h-6 bg-gray-600 mx-1" />

          {/* Undo button */}
          <ToolButton
            icon={<Undo className="h-4 w-4" />}
            isActive={false}
            onClick={onUndo}
            isReadOnly={isReadOnly || !canUndo}
          />

          {/* Redo button */}
          <ToolButton
            icon={<Redo className="h-4 w-4" />}
            isActive={false}
            onClick={onRedo}
            isReadOnly={isReadOnly || !canRedo}
          />
        </div>
      </div>
    </Card>
  );
};

export default MovableToolbar;
