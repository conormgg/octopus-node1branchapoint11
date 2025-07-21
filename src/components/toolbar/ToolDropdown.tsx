
import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { ColorSelector } from './ColorSelector';

interface ToolDropdownProps {
  icon: React.ReactNode;
  isActive: boolean;
  strokeWidth: number;
  color: string;
  colors: string[];
  minStrokeWidth: number;
  maxStrokeWidth: number;
  strokeWidthStep: number;
  onToolSelect: () => void;
  onStrokeWidthChange: (width: number) => void;
  onColorChange: (color: string) => void;
  isReadOnly: boolean;
  portalContainer?: Element | null;
}

export const ToolDropdown: React.FC<ToolDropdownProps> = ({
  icon,
  isActive,
  strokeWidth,
  color,
  colors,
  minStrokeWidth,
  maxStrokeWidth,
  strokeWidthStep,
  onToolSelect,
  onStrokeWidthChange,
  onColorChange,
  isReadOnly,
  portalContainer
}) => {
  return (
    <div className="relative flex">
      <Button
        variant="ghost"
        size="icon"
        className={`h-10 w-8 min-h-[44px] rounded-r-none flex items-center justify-center transition-colors duration-150 ${
          isActive ? 'bg-gray-700' : ''
        } @media(hover:hover):hover:bg-gray-600`}
        onClick={() => !isReadOnly && onToolSelect()}
        disabled={isReadOnly}
      >
        {icon}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-6 min-h-[44px] rounded-l-none border-l border-gray-600 px-1 transition-colors duration-150 @media(hover:hover):hover:bg-gray-600"
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
                value={[strokeWidth]}
                onValueChange={(value) => {
                  if (!isReadOnly) {
                    onToolSelect();
                    onStrokeWidthChange(value[0]);
                  }
                }}
                min={minStrokeWidth}
                max={maxStrokeWidth}
                step={strokeWidthStep}
                className="w-full"
                disabled={isReadOnly}
              />
            </div>

            {/* Color selector */}
            <ColorSelector
              selectedColor={color}
              colors={colors}
              onColorChange={onColorChange}
              isReadOnly={isReadOnly}
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
