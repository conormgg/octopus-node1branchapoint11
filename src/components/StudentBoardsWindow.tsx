
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWindowManager } from './WindowManager';
import StudentBoardsGrid from './StudentBoardsGrid';
import StudentBoardsWindowHeader from './StudentBoardsWindowHeader';
import WhiteboardPlaceholder from './WhiteboardPlaceholder';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from './TeacherView';

interface StudentBoardsWindowProps {
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

const StudentBoardsWindow: React.FC<StudentBoardsWindowProps> = ({
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
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [maximizedBoard, setMaximizedBoard] = useState<string | null>(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  const handleWindowReady = (newContainer: HTMLDivElement) => {
    setContainer(newContainer);
    setIsReady(true);
  };

  const { windowRef, containerRef } = useWindowManager({
    onWindowReady: handleWindowReady,
    onClose,
  });

  const toggleHeaderCollapse = () => {
    setIsHeaderCollapsed(prev => !prev);
  };

  const handleMaximizeInWindow = (boardId: string) => {
    setMaximizedBoard(boardId);
  };

  const handleMinimizeInWindow = () => {
    setMaximizedBoard(null);
  };

  useEffect(() => {
    console.log('Props changed in StudentBoardsWindow:', {
      studentCount,
      currentLayout: currentLayout?.name,
      currentStudentBoards,
      currentPage,
      totalPages,
      gridOrientation,
      isReady,
      hasContainer: !!container,
      maximizedBoard,
      isHeaderCollapsed,
    });
  }, [studentCount, currentLayout, currentStudentBoards, currentPage, totalPages, gridOrientation, isReady, container, maximizedBoard, isHeaderCollapsed]);

  if (!container || !isReady) {
    console.log('Container or window not ready yet', { container: !!container, isReady });
    return null;
  }

  if (maximizedBoard) {
    return createPortal(
      <div className="h-full w-full bg-gray-100 p-4">
        <WhiteboardPlaceholder
          id={maximizedBoard}
          isMaximized={true}
          onMinimize={handleMinimizeInWindow}
        />
      </div>,
      container
    );
  }

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
        isCollapsed={isHeaderCollapsed}
        onToggleCollapse={toggleHeaderCollapse}
      />
      
      <div className="flex-1 min-h-0 mt-4">
        <StudentBoardsGrid
          studentCount={studentCount}
          currentLayout={currentLayout}
          currentStudentBoards={currentStudentBoards}
          currentPage={currentPage}
          totalPages={totalPages}
          gridOrientation={gridOrientation}
          onMaximize={handleMaximizeInWindow}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
          isHeaderCollapsed={isHeaderCollapsed}
        />
      </div>
    </div>,
    container
  );
};

export default StudentBoardsWindow;
