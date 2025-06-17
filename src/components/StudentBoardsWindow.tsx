import React, { useEffect, useState } from 'react';
import WindowContentRenderer from './WindowContentRenderer';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from '../TeacherView';
import { StudentBoardInfo } from '@/utils/studentBoardGenerator';

interface StudentBoardsWindowProps {
  studentCount: number;
  currentLayout: LayoutOption;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  currentStudentBoardsInfo: (StudentBoardInfo | null)[];
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
  sessionId?: string;
  senderId?: string;
}

const StudentBoardsWindow: React.FC<StudentBoardsWindowProps> = ({
  studentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  currentStudentBoardsInfo,
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
  sessionId,
  senderId,
}) => {
  const [windowContainer, setWindowContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = document.createElement('div');
    container.id = 'student-boards-window';
    document.body.appendChild(container);
    setWindowContainer(container);

    return () => {
      document.body.removeChild(container);
    };
  }, []);

  if (!windowContainer) {
    return null;
  }

  // Extract boardId strings for backward compatibility with components that still need them
  const currentStudentBoards = currentStudentBoardsInfo
    .filter(board => board !== null)
    .map(board => board!.boardId);

  return (
    <WindowContentRenderer
      container={windowContainer}
      studentCount={studentCount}
      currentLayout={currentLayout}
      availableLayouts={availableLayouts}
      selectedLayoutId={selectedLayoutId}
      currentStudentBoards={currentStudentBoards}
      currentStudentBoardsInfo={currentStudentBoardsInfo}
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
      sessionId={sessionId}
      senderId={senderId}
    />
  );
};

export default StudentBoardsWindow;
