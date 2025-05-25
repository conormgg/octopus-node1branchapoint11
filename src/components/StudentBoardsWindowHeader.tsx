
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Plus, Minus, UserPlus } from 'lucide-react';
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
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Student Boards Monitor</h1>
          <p className="text-sm text-gray-500">
            Viewing {studentCount} student{studentCount !== 1 ? 's' : ''} - 
            {currentLayoutName ? ` ${currentLayoutName} layout` : ''} - 
            Page {currentPage + 1} of {totalPages}
          </p>
        </div>
        
        {/* Controls Section */}
        <div className="flex items-center space-x-6">
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
          
          {/* Close Button */}
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
  );
};

export default StudentBoardsWindowHeader;
