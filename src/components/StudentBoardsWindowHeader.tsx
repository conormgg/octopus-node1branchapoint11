
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, Plus, Minus, UserPlus, ChevronUp, ChevronDown } from 'lucide-react';
import LayoutSelector from './LayoutSelector';
import { LayoutOption } from '@/utils/layoutCalculator';

interface StudentBoardsWindowHeaderProps {
  studentCount: number;
  currentLayoutName?: string;
  currentPage: number;
  totalPages: number;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  onLayoutChange: (layoutId: string) => void;
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
  onClose: () => void;
}

const StudentBoardsWindowHeader: React.FC<StudentBoardsWindowHeaderProps> = ({
  studentCount,
  currentLayoutName,
  currentPage,
  totalPages,
  availableLayouts,
  selectedLayoutId,
  onLayoutChange,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
  onClose,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="bg-white border-b border-gray-200 rounded-lg shadow-sm transition-all duration-200 ease-in-out">
      {/* Always visible header bar */}
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-semibold text-gray-900">Student Boards Monitor</h1>
          <p className="text-sm text-gray-500">
            {studentCount} student{studentCount !== 1 ? 's' : ''} - 
            {currentLayoutName ? ` ${currentLayoutName} layout` : ''} - 
            Page {currentPage + 1} of {totalPages}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
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

      {/* Collapsible controls section */}
      {!isCollapsed && (
        <div className="px-6 pb-4 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-6 pt-3">
            {/* Layout Selector */}
            <LayoutSelector
              availableLayouts={availableLayouts}
              selectedLayoutId={selectedLayoutId}
              onLayoutChange={onLayoutChange}
            />
            
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
            
            {/* Student Count Display */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {studentCount} Student{studentCount !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Plus/Minus Controls */}
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
        </div>
      )}
    </div>
  );
};

export default StudentBoardsWindowHeader;
