
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { LayoutGrid, RectangleVertical, Grid2X2, Grid3X3 } from 'lucide-react';
import { LayoutOption } from '@/utils/layoutCalculator';

interface LayoutSelectorProps {
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  onLayoutChange: (layoutId: string) => void;
}

const getLayoutIcon = (iconName: string) => {
  const iconMap = {
    'square': LayoutGrid,
    'rectangle-vertical': RectangleVertical,
    'grid-2x2': Grid2X2,
    'grid-3x3': Grid3X3
  };
  
  return iconMap[iconName as keyof typeof iconMap] || LayoutGrid;
};

const LayoutSelector: React.FC<LayoutSelectorProps> = ({
  availableLayouts,
  selectedLayoutId,
  onLayoutChange,
}) => {
  // Don't show selector if only one layout option
  if (availableLayouts.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700">Layout:</span>
      <ToggleGroup
        type="single"
        value={selectedLayoutId}
        onValueChange={(value) => value && onLayoutChange(value)}
        className="border rounded-lg p-1"
      >
        {availableLayouts.map((layout) => {
          const Icon = getLayoutIcon(layout.icon);
          return (
            <ToggleGroupItem
              key={layout.id}
              value={layout.id}
              aria-label={layout.description}
              className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
              title={layout.description}
            >
              <Icon className="w-4 h-4 mr-1" />
              <span className="text-xs font-medium">{layout.name}</span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
};

export default LayoutSelector;
