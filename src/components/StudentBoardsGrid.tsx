
import React from 'react';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WhiteboardPlaceholder from './WhiteboardPlaceholder';
import EmptySlot from './EmptySlot';
import { LayoutOption, generateGridSlots } from '@/utils/layoutCalculator';

interface StudentBoardsGridProps {
  studentCount: number;
  currentLayout: LayoutOption | undefined;
  currentStudentBoards: string[];
  currentPage: number;
  totalPages: number;
  onMaximize: (boardId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onAddStudent?: () => void;
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
  onAddStudent,
}) => {
  // Generate grid slots with empty placeholders
  const allStudentBoards = Array.from({ length: studentCount }, (_, i) => 
    `student-${String.fromCharCode(97 + i)}`
  );
  
  const gridSlots = currentLayout ? 
    generateGridSlots(allStudentBoards, currentPage, currentLayout.studentsPerPage) : 
    currentStudentBoards;

  // Determine grid layout classes based on current layout
  const getGridClasses = () => {
    if (!currentLayout) return 'grid-cols-2 grid-rows-2';
    
    const baseClasses = `grid ${currentLayout.gridClass} gap-3 h-full`;
    
    // Add responsive classes and adjust for different layouts
    switch (currentLayout.id) {
      case '1x1':
        return `${baseClasses} place-items-center`;
      case '1x2':
        return `${baseClasses} grid-rows-2`;
      case '2x2':
        return `${baseClasses} grid-rows-2`;
      case '2x3':
        return `${baseClasses} grid-rows-3`;
      default:
        return baseClasses;
    }
  };

  // Calculate if adding students is allowed
  const canAddStudents = studentCount < 8;

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
        <div className={getGridClasses()}>
          {gridSlots.map((boardId, index) => (
            <div key={boardId || `empty-${index}`} className="min-h-0 flex">
              {boardId ? (
                <WhiteboardPlaceholder
                  id={boardId}
                  onMaximize={() => onMaximize(boardId)}
                />
              ) : (
                <EmptySlot 
                  onAddStudent={onAddStudent}
                  isAddingAllowed={canAddStudents}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentBoardsGrid;
