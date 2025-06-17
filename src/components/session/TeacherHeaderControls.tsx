
import React from 'react';
import { Monitor, Columns2, Rows2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import LayoutSelector from '../LayoutSelector';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from '../TeacherView';

interface TeacherHeaderControlsProps {
  currentLayout: LayoutOption | undefined;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  gridOrientation: GridOrientation;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  onToggleSplitView?: () => void;
  isSplitViewActive?: boolean;
}

const TeacherHeaderControls: React.FC<TeacherHeaderControlsProps> = ({
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  gridOrientation,
  onLayoutChange,
  onOrientationChange,
  onToggleSplitView,
  isSplitViewActive = false,
}) => {
  return (
    <>
      {/* Layout Selector */}
      <LayoutSelector
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        onLayoutChange={onLayoutChange}
      />

      {/* Grid Orientation Toggle */}
      {availableLayouts.length > 0 && (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Grid:</span>
          <ToggleGroup
            type="single"
            value={gridOrientation}
            onValueChange={(value) => value && onOrientationChange(value as GridOrientation)}
            className="border rounded-lg p-1"
          >
            <ToggleGroupItem
              value="columns-first"
              aria-label="Columns first"
              className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
              title="Columns first"
            >
              <Columns2 className="w-4 h-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="rows-first"
              aria-label="Rows first"
              className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700"
              title="Rows first"
            >
              <Rows2 className="w-4 h-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      
      {/* Split View Button */}
      {onToggleSplitView && (
        <Button
          variant={isSplitViewActive ? "default" : "outline"}
          size="sm"
          onClick={onToggleSplitView}
          className="flex items-center space-x-2"
        >
          <Monitor className="w-4 h-4" />
          <span>{isSplitViewActive ? 'Close Split View' : 'Split View'}</span>
        </Button>
      )}
    </>
  );
};

export default TeacherHeaderControls;
