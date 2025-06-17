
import React from 'react';
import { Users, Plus, Minus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeacherHeaderStudentCountProps {
  studentCount: number;
  activeStudentCount?: number;
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
}

const TeacherHeaderStudentCount: React.FC<TeacherHeaderStudentCountProps> = ({
  studentCount,
  activeStudentCount,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
}) => {
  return (
    <>
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
      
      {/* Student Count Controls with Active/Total display */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {activeStudentCount !== undefined ? (
              <>
                {activeStudentCount}/{studentCount} Student{studentCount !== 1 ? 's' : ''}
              </>
            ) : (
              <>
                {studentCount} Student{studentCount !== 1 ? 's' : ''}
              </>
            )}
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
    </>
  );
};

export default TeacherHeaderStudentCount;
