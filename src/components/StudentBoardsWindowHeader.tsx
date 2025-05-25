
import React from 'react';
import { Button } from '@/components/ui/button';

interface StudentBoardsWindowHeaderProps {
  studentCount: number;
  currentLayoutName?: string;
  currentPage: number;
  totalPages: number;
  onClose: () => void;
}

const StudentBoardsWindowHeader: React.FC<StudentBoardsWindowHeaderProps> = ({
  studentCount,
  currentLayoutName,
  currentPage,
  totalPages,
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
  );
};

export default StudentBoardsWindowHeader;
