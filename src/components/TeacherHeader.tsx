
import React from 'react';
import { GraduationCap, Users, Plus, Minus, UserPlus, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LayoutSelector from './LayoutSelector';
import { LayoutOption } from '@/utils/layoutCalculator';

interface TeacherHeaderProps {
  studentCount: number;
  currentLayout: LayoutOption | undefined;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
  onLayoutChange: (layoutId: string) => void;
  onToggleSplitView?: () => void;
  isSplitViewActive?: boolean;
}

const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  studentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
  onLayoutChange,
  onToggleSplitView,
  isSplitViewActive = false,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Teacher Dashboard</h1>
            <p className="text-sm text-gray-500">Collaborative Whiteboard Session</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Layout Selector */}
          <LayoutSelector
            availableLayouts={availableLayouts}
            selectedLayoutId={selectedLayoutId}
            onLayoutChange={onLayoutChange}
          />
          
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
        </div>
      </div>
    </div>
  );
};

export default TeacherHeader;
