
import React, { useState } from 'react';
import { GraduationCap, Users, Plus, Minus, UserPlus, Monitor, ChevronUp, ChevronDown, Columns2, Rows2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import LayoutSelector from './LayoutSelector';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from './TeacherView';

interface TeacherHeaderProps {
  studentCount: number;
  currentLayout: LayoutOption | undefined;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  gridOrientation: GridOrientation;
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  onToggleSplitView?: () => void;
  isSplitViewActive?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  studentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  gridOrientation,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
  onLayoutChange,
  onOrientationChange,
  onToggleSplitView,
  isSplitViewActive = false,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const shouldShowHeader = !isCollapsed || isHovered;

  return (
    <>
      {isCollapsed && (
        <div 
          className="absolute top-0 left-0 right-0 h-4 z-50 bg-transparent"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      )}
      
      <div 
        className={`bg-white border-b border-gray-200 transition-all duration-300 ease-in-out ${
          shouldShowHeader 
            ? 'transform translate-y-0 opacity-100' 
            : 'transform -translate-y-full opacity-0 absolute top-0 left-0 right-0 z-40'
        }`}
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => isCollapsed && setIsHovered(false)}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Teacher Dashboard</h1>
                {!isCollapsed && (
                  <p className="text-sm text-gray-500">Collaborative Whiteboard Session</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
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
              
              {/* Add Student Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onIncreaseStudentCount}
                disabled={studentCount >= 8}
                className="flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Student</span>
              </Button>
              
              {/* Student Count Controls */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {studentCount} Student{studentCount !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDecreaseStudentCount}
                    disabled={studentCount <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onIncreaseStudentCount}
                    disabled={studentCount >= 8}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Hide Controls Button */}
              {onToggleCollapse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCollapse}
                  className="flex items-center space-x-1"
                >
                  {isCollapsed ? (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>Show Controls</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>Hide Controls</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherHeader;
