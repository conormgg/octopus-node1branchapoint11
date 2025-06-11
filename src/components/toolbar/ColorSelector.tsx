
import React from 'react';

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
    <div className="flex space-x-2 justify-center">
      {colors.map((color) => (
        <button
          key={color}
          className={`w-8 h-8 rounded-full border-2 ${
            selectedColor === color 
              ? 'border-white border-4' 
              : 'border-gray-500'
          }`}
          style={{ backgroundColor: color }}
          onClick={() => {
            if (!isReadOnly) {
              onColorChange(color);
            }
          }}
          disabled={isReadOnly}
        />
      ))}
    </div>
  );
};
