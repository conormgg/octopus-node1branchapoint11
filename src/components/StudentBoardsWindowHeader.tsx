
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ChevronUp, ChevronDown, Columns2, Rows2 } from 'lucide-react';
import LayoutSelector from './LayoutSelector';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from './TeacherView';

interface StudentBoardsWindowHeaderProps {
  studentCount: number;
  currentLayoutName?: string;
  currentPage: number;
  totalPages: number;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  gridOrientation: GridOrientation;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const StudentBoardsWindowHeader: React.FC<StudentBoardsWindowHeaderProps> = ({
  studentCount,
  currentLayoutName,
  currentPage,
  totalPages,
  availableLayouts,
  selectedLayoutId,
  gridOrientation,
  onLayoutChange,
  onOrientationChange,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleOrientationToggle = () => {
    onOrientationChange(gridOrientation === 'columns-first' ? 'rows-first' : 'columns-first');
  };

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
        className={`bg-white border-b border-gray-200 rounded-lg shadow-sm transition-all duration-300 ease-in-out ${
          shouldShowHeader 
            ? 'transform translate-y-0 opacity-100' 
            : 'transform -translate-y-full opacity-0 absolute top-0 left-0 right-0 z-40'
        }`}
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => isCollapsed && setIsHovered(false)}
      >
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Student Boards Monitor</h1>
            {!isCollapsed && (
              <p className="text-sm text-gray-500">
                {studentCount} student{studentCount !== 1 ? 's' : ''} - 
                {currentLayoutName ? ` ${currentLayoutName} layout` : ''} - 
                Page {currentPage + 1} of {totalPages}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-6">
            <LayoutSelector
              availableLayouts={availableLayouts}
              selectedLayoutId={selectedLayoutId}
              onLayoutChange={onLayoutChange}
            />
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Columns2 className="w-4 h-4 text-gray-600" />
                <Switch
                  checked={gridOrientation === 'rows-first'}
                  onCheckedChange={handleOrientationToggle}
                />
                <Rows2 className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm text-gray-600">
                {gridOrientation === 'columns-first' ? 'Columns First' : 'Rows First'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
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
            
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex items-center space-x-2"
            >
              <span>Close Split View</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentBoardsWindowHeader;
