
import React from 'react';
import StudentBoardsGrid from '../StudentBoardsGrid';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from '../TeacherView';

interface WindowContentBodyProps {
  studentCount: number;
  currentLayout: LayoutOption | undefined;
  currentStudentBoards: string[];
  currentPage: number;
  totalPages: number;
  gridOrientation: GridOrientation;
  maximizedBoard: string | null;
  isHeaderCollapsed: boolean;
  onMaximize: (boardId: string) => void;
  onMinimize: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

const WindowContentBody: React.FC<WindowContentBodyProps> = ({
  studentCount,
  currentLayout,
  currentStudentBoards,
  currentPage,
  totalPages,
  gridOrientation,
  maximizedBoard,
  isHeaderCollapsed,
  onMaximize,
  onMinimize,
  onPreviousPage,
  onNextPage,
}) => {
  return (
    <div className={`flex-1 min-h-0 ${isHeaderCollapsed ? 'p-4 pt-2' : 'px-4 pb-4'}`}>
      <StudentBoardsGrid
        studentCount={studentCount}
        currentLayout={currentLayout}
        currentStudentBoards={currentStudentBoards}
        currentPage={currentPage}
        totalPages={totalPages}
        gridOrientation={gridOrientation}
        maximizedBoard={maximizedBoard}
        onMaximize={onMaximize}
        onMinimize={onMinimize}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
        isHeaderCollapsed={isHeaderCollapsed}
      />
    </div>
  );
};

export default WindowContentBody;
