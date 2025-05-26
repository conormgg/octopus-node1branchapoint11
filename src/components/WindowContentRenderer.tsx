
import React from 'react';
import { createPortal } from 'react-dom';
import StudentBoardsGrid from './StudentBoardsGrid';
import StudentBoardsWindowHeader from './StudentBoardsWindowHeader';
import { LayoutOption } from '@/utils/layoutCalculator';

interface WindowContentRendererProps {
  container: HTMLDivElement;
  studentCount: number;
  currentLayout: LayoutOption | undefined;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  currentStudentBoards: string[];
  currentPage: number;
  totalPages: number;
  onMaximize: (boardId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLayoutChange: (layoutId: string) => void;
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
  onMaximize,
  onPreviousPage,
  onNextPage,
  onLayoutChange,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
  onClose,
}) => {
  console.log('Rendering portal content', { studentCount, currentLayout, currentStudentBoards });

  return createPortal(
    <div className="flex-1 bg-gray-100 p-4 flex flex-col min-h-0">
      <div className="mb-4 flex-shrink-0">
        <StudentBoardsWindowHeader
          studentCount={studentCount}
          currentLayoutName={currentLayout?.name}
          currentPage={currentPage}
          totalPages={totalPages}
          availableLayouts={availableLayouts}
          selectedLayoutId={selectedLayoutId}
          onLayoutChange={onLayoutChange}
          onIncreaseStudentCount={onIncreaseStudentCount}
          onDecreaseStudentCount={onDecreaseStudentCount}
          onClose={onClose}
        />
      </div>
      
      <div className="flex-1 min-h-0">
        <StudentBoardsGrid
          studentCount={studentCount}
          currentLayout={currentLayout}
          currentStudentBoards={currentStudentBoards}
          currentPage={currentPage}
          totalPages={totalPages}
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
