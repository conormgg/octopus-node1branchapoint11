
import React from 'react';
import { createPortal } from 'react-dom';
import StudentBoardsGrid from './StudentBoardsGrid';
import StudentBoardsWindowHeader from './StudentBoardsWindowHeader';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from './TeacherView';

interface WindowContentRendererProps {
  container: HTMLDivElement;
  studentCount: number;
  currentLayout: LayoutOption | undefined;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  currentStudentBoards: string[];
  currentPage: number;
  totalPages: number;
  gridOrientation: GridOrientation;
  onMaximize: (boardId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
  onClose: () => void;
}

const WindowContentRenderer: React.FC<WindowContentRendererProps> = ({
  container,
  studentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  currentStudentBoards,
  currentPage,
  totalPages,
  gridOrientation,
  onMaximize,
  onPreviousPage,
  onNextPage,
  onLayoutChange,
  onOrientationChange,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
  onClose,
}) => {
  console.log('Rendering portal content', { studentCount, currentLayout, currentStudentBoards });

  return createPortal(
    <div className="flex-1 bg-gray-100 p-4 flex flex-col min-h-0 relative">
      <StudentBoardsWindowHeader
        studentCount={studentCount}
        currentLayoutName={currentLayout?.name}
        currentPage={currentPage}
        totalPages={totalPages}
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        gridOrientation={gridOrientation}
        onLayoutChange={onLayoutChange}
        onOrientationChange={onOrientationChange}
        onIncreaseStudentCount={onIncreaseStudentCount}
        onDecreaseStudentCount={onDecreaseStudentCount}
        onClose={onClose}
      />
      
      <div className="flex-1 min-h-0 mt-4">
        <StudentBoardsGrid
          studentCount={studentCount}
          currentLayout={currentLayout}
          currentStudentBoards={currentStudentBoards}
          currentPage={currentPage}
          totalPages={totalPages}
          gridOrientation={gridOrientation}
          onMaximize={onMaximize}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
        />
      </div>
    </div>,
    container
  );
};

export default WindowContentRenderer;
