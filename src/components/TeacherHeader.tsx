
import React from 'react';
import { GraduationCap, Users, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LayoutOption } from '@/utils/layoutCalculator';

interface TeacherHeaderProps {
  studentCount: number;
  currentLayout: LayoutOption | undefined;
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
}

const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  studentCount,
  currentLayout,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
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
        
        <div className="flex items-center space-x-4">
          {/* Student Count Controls */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Students:</span>
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onDecreaseStudentCount}
                disabled={studentCount <= 1}
                className="h-6 w-6 p-0"
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-sm font-bold text-gray-800 min-w-[1.5rem] text-center">
                {studentCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onIncreaseStudentCount}
                disabled={studentCount >= 8}
                className="h-6 w-6 p-0"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Current Layout Info */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">
              Layout: {currentLayout?.name || '2×2'} Grid
            </span>
          </div>

          {/* View Type Badge */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Teacher View</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherHeader;
