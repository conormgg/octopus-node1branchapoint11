
import React, { useEffect, useState } from 'react';
import { useWindowManager } from './WindowManager';
import WindowContentRenderer from './WindowContentRenderer';
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

  const handleWindowReady = (newContainer: HTMLDivElement) => {
    setContainer(newContainer);
    setIsReady(true);
  };

  const { windowRef, containerRef } = useWindowManager({
    onWindowReady: handleWindowReady,
    onClose,
  });

  // Log prop changes for debugging
  useEffect(() => {
    console.log('Props changed in StudentBoardsWindow:', {
      studentCount,
      currentLayout: currentLayout?.name,
      currentStudentBoards,
      currentPage,
      totalPages,
      gridOrientation,
      isReady,
      hasContainer: !!container
    });
  }, [studentCount, currentLayout, currentStudentBoards, currentPage, totalPages, gridOrientation, isReady, container]);

  // Don't render portal until container is ready
  if (!container || !isReady) {
    console.log('Container or window not ready yet', { container: !!container, isReady });
    return null;
  }

  return (
    <WindowContentRenderer
      container={container}
      studentCount={studentCount}
      currentLayout={currentLayout}
      availableLayouts={availableLayouts}
      selectedLayoutId={selectedLayoutId}
      currentStudentBoards={currentStudentBoards}
      currentPage={currentPage}
      totalPages={totalPages}
      gridOrientation={gridOrientation}
      onMaximize={onMaximize}
      onPreviousPage={onPreviousPage}
      onNextPage={onNextPage}
      onLayoutChange={onLayoutChange}
      onOrientationChange={onOrientationChange}
      onIncreaseStudentCount={onIncreaseStudentCount}
      onDecreaseStudentCount={onDecreaseStudentCount}
      onClose={onClose}
    />
  );
};

export default StudentBoardsWindow;
