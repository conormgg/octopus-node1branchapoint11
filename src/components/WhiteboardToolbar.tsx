
import React from 'react';
import { Pen, Eraser, Trash2, Palette } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WhiteboardToolbarProps {
  activeTool: 'pen' | 'eraser';
  strokeWidth: number;
  strokeColor: string;
  onToolChange: (tool: 'pen' | 'eraser') => void;
  onStrokeWidthChange: (width: number) => void;
  onColorChange: (color: string) => void;
  onClear: () => void;
}

const WhiteboardToolbar: React.FC<WhiteboardToolbarProps> = ({ 
  activeTool, 
  strokeWidth,
  strokeColor,
  onToolChange,
  onStrokeWidthChange,
  onColorChange,
  onClear
}) => {
  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Orange', value: '#f97316' },
    { name: 'White', value: '#ffffff' },
  ];

  return (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 bg-black rounded-lg p-3 shadow-lg min-w-[200px]">
      {/* Tool Selection */}
      <div className="flex gap-2">
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
        
        <button
          onClick={onClear}
          className="p-2 rounded transition-colors text-white hover:bg-red-600"
          title="Clear Canvas"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Stroke Width Control */}
      <div className="flex flex-col gap-2">
        <label className="text-white text-xs font-medium">
          Stroke Width: {strokeWidth}px
        </label>
        <Slider
          value={[strokeWidth]}
          onValueChange={(value) => onStrokeWidthChange(value[0])}
          max={20}
          min={1}
          step={1}
          className="w-full"
        />
      </div>

      {/* Color Selection for Pen */}
      {activeTool === 'pen' && (
        <div className="flex flex-col gap-2">
          <label className="text-white text-xs font-medium flex items-center gap-1">
            <Palette size={12} />
            Color
          </label>
          <Select value={strokeColor} onValueChange={onColorChange}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: strokeColor }}
                  />
                  {colors.find(c => c.value === strokeColor)?.name || 'Custom'}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {colors.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: color.value }}
                    />
                    {color.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default WhiteboardToolbar;
