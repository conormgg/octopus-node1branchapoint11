
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
    <div className="relative flex" data-ui-interactive="true">
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-6 rounded-r-none ${isActive ? 'bg-gray-700' : ''}`}
        onClick={() => !isReadOnly && onToolSelect()}
        disabled={isReadOnly}
        data-ui-interactive="true"
      >
        {icon}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-4 rounded-l-none border-l border-gray-600 px-1"
            disabled={isReadOnly}
            data-ui-interactive="true"
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
          data-ui-interactive="true"
          data-dropdown-content="true"
        >
          <div className="space-y-3" data-ui-interactive="true">
            {/* Thickness slider */}
            <div data-ui-interactive="true">
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
                data-ui-interactive="true"
              />
            </div>

            {/* Color selector */}
            <ColorSelector
              selectedColor={color}
              colors={colors}
              onColorChange={(newColor) => {
                if (!isReadOnly) {
                  onToolSelect();
                  onColorChange(newColor);
                }
              }}
              isReadOnly={isReadOnly}
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
