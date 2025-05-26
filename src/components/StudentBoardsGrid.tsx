
import React from 'react';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WhiteboardPlaceholder from './WhiteboardPlaceholder';
import { LayoutOption, getStudentBoardsForPage, getOrientationAwareGridClasses } from '@/utils/layoutCalculator';
import { GridOrientation } from './TeacherView';

interface StudentBoardsGridProps {
  studentCount: number;
  currentLayout: LayoutOption | undefined;
  currentStudentBoards: string[];
  currentPage: number;
  totalPages: number;
  gridOrientation: GridOrientation;
  onMaximize: (boardId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  isHeaderCollapsed?: boolean;
}

const StudentBoardsGrid: React.FC<StudentBoardsGridProps> = ({
  studentCount,
  currentLayout,
  currentStudentBoards,
  currentPage,
  totalPages,
  gridOrientation,
  onMaximize,
  onPreviousPage,
  onNextPage,
  isHeaderCollapsed = false,
}) => {
  const allStudentBoards = Array.from({ length: studentCount }, (_, i) => 
    `student-${String.fromCharCode(97 + i)}`
  );
  
  const displayBoards = currentLayout ? 
    getStudentBoardsForPage(allStudentBoards, currentPage, currentLayout.studentsPerPage) : 
    currentStudentBoards;

  const gridClasses = currentLayout ? 
    getOrientationAwareGridClasses(currentLayout, gridOrientation) : 
    'grid-cols-2 grid-rows-2';

  return (
    <div className="h-full w-full flex flex-col p-4">
      {!isHeaderCollapsed && (
        <div className="mb-4 flex-shrink-0">
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
      )}
      
      <div className="flex-1 min-h-0 w-full">
        <div className={`grid ${gridClasses} gap-4 h-full w-full`}>
          {displayBoards.map((boardId) => (
            <div key={boardId} className="w-full h-full min-h-0">
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
