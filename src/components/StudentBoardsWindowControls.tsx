
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Plus, Minus, UserPlus } from 'lucide-react';
import LayoutSelector from './LayoutSelector';
import { LayoutOption } from '@/utils/layoutCalculator';

interface StudentBoardsWindowControlsProps {
  studentCount: number;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  onLayoutChange: (layoutId: string) => void;
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
}

const StudentBoardsWindowControls: React.FC<StudentBoardsWindowControlsProps> = ({
  studentCount,
  availableLayouts,
  selectedLayoutId,
  onLayoutChange,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
}) => {
  return (
    <div className="flex items-center justify-end space-x-6 px-6 pb-4">
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
  );
};

export default StudentBoardsWindowControls;
