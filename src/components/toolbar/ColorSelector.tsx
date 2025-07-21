
import React from 'react';
import { Button } from '@/components/ui/button';

interface ColorSelectorProps {
  selectedColor: string;
  colors: string[];
  onColorChange: (color: string) => void;
  isReadOnly: boolean;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({
  selectedColor,
  colors,
  onColorChange,
  isReadOnly
}) => {
  return (
    <div className="flex space-x-2 justify-center" data-ui-interactive="true">
      {colors.map((color) => (
        <Button
          key={color}
          variant="ghost"
          size="icon"
          className={`w-8 h-8 rounded-full p-0 border-2 transition-all hover:scale-105 ${
            selectedColor === color 
              ? 'border-white border-4 shadow-lg' 
              : 'border-gray-500 hover:border-gray-400'
          }`}
          style={{ backgroundColor: color }}
          onClick={() => {
            if (!isReadOnly) {
              onColorChange(color);
            }
          }}
          disabled={isReadOnly}
          data-ui-interactive="true"
          data-color-selector-button="true"
        />
      ))}
    </div>
  );
};
