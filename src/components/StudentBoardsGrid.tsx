
import React from 'react';
import { Users, ChevronLeft, ChevronRight, RotateCcw, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WhiteboardPlaceholder from './WhiteboardPlaceholder';
import PersistentPageNavigation from './PersistentPageNavigation';
import { LayoutOption, getOrientationAwareGridClasses } from '@/utils/layoutCalculator';
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
  sessionId?: string;
  senderId?: string;
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
  sessionId,
  senderId,
}) => {
  const renderStudentGrid = () => {
    if (!currentLayout) return null;

    const gridClass = getOrientationAwareGridClasses(currentLayout, gridOrientation);

    return (
      <div className={`grid ${gridClass} gap-3 h-full`}>
        {currentStudentBoards.map((boardId) => (
          <div key={boardId} className="min-h-0">
            <WhiteboardPlaceholder
              id={boardId}
              onMaximize={() => onMaximize(boardId)}
              sessionId={sessionId}
              senderId={senderId}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full p-2 relative">
      {!isHeaderCollapsed && (
        <div className="mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-500" />
                Student Boards ({studentCount} active)
              </h2>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPreviousPage}
                  disabled={currentPage === 0}
                  className="flex items-center space-x-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>
                
                <span className="text-sm text-gray-600 px-2">
                  Page {currentPage + 1} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
          
          <p className="text-sm text-gray-600">
            {currentLayout && `Showing ${currentStudentBoards.length} students in ${currentLayout.name} layout`}
          </p>
        </div>
      )}
      
      <div className={`${isHeaderCollapsed ? 'h-full' : 'h-[calc(100%-4rem)]'} relative`}>
        {renderStudentGrid()}
        
        <PersistentPageNavigation
          currentPage={currentPage}
          totalPages={totalPages}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
        />
      </div>
    </div>
  );
};

export default StudentBoardsGrid;
