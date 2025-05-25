
import React from 'react';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WhiteboardPlaceholder from './WhiteboardPlaceholder';
import { LayoutOption } from '@/utils/layoutCalculator';

interface StudentBoardsGridProps {
  studentCount: number;
  currentLayout: LayoutOption | undefined;
  currentStudentBoards: string[];
  currentPage: number;
  totalPages: number;
  onMaximize: (boardId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

const StudentBoardsGrid: React.FC<StudentBoardsGridProps> = ({
  studentCount,
  currentLayout,
  currentStudentBoards,
  currentPage,
  totalPages,
  onMaximize,
  onPreviousPage,
  onNextPage,
}) => {
  return (
    <div className="h-full p-2">
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-500" />
              Student Boards ({studentCount} active)
            </h2>
            <p className="text-sm text-gray-600">
              {currentLayout?.description || 'Monitor and interact with student work'}
            </p>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPreviousPage}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600 px-2">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onNextPage}
                disabled={currentPage === totalPages - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="h-[calc(100%-4rem)]">
        <div className={`grid ${currentLayout?.gridClass || 'grid-cols-2'} gap-3 h-full`}>
          {currentStudentBoards.map((boardId) => (
            <div key={boardId} className="min-h-0">
              <WhiteboardPlaceholder
                id={boardId}
                onMaximize={() => onMaximize(boardId)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentBoardsGrid;
