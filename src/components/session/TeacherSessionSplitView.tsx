
import React from 'react';
import TeacherMainBoard from '../TeacherMainBoard';
import StudentBoardsWindow from '../StudentBoardsWindow';
import { GridOrientation } from '../TeacherView';
import { StudentBoardInfo } from '@/utils/studentBoardGenerator';

interface TeacherSessionSplitViewProps {
  activeSession: {
    id: string;
    title: string;
    unique_url_slug: string;
    status: string;
    created_at: string;
    teacher_id: string;
  };
  studentCount: number;
  activeStudentCount?: number;
  currentLayout: any;
  availableLayouts: any[];
  selectedLayoutId: string;
  currentStudentBoards: any[];
  currentStudentBoardsInfo: (StudentBoardInfo | null)[];
  currentPage: number;
  totalPages: number;
  gridOrientation: GridOrientation;
  maximizedBoard: string | null;
  isControlsCollapsed: boolean;
  onMaximize: (boardId: string) => void;
  onMinimize: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
  onCloseSplitView: () => void;
}

const TeacherSessionSplitView: React.FC<TeacherSessionSplitViewProps> = ({
  activeSession,
  studentCount,
  activeStudentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  currentStudentBoards,
  currentStudentBoardsInfo,
  currentPage,
  totalPages,
  gridOrientation,
  maximizedBoard,
  isControlsCollapsed,
  onMaximize,
  onMinimize,
  onPreviousPage,
  onNextPage,
  onLayoutChange,
  onOrientationChange,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
  onCloseSplitView,
}) => {
  return (
    <>
      {/* Split View Window */}
      <StudentBoardsWindow
        studentCount={studentCount}
        activeStudentCount={activeStudentCount || 0}
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
        onClose={onCloseSplitView}
      />

      {/* Single panel view - only teacher's board when split view is active */}
      <div className="h-full relative">
        <TeacherMainBoard 
          onMaximize={onMaximize}
          onMinimize={onMinimize}
          maximizedBoard={maximizedBoard}
          isHeaderCollapsed={isControlsCollapsed}
          sessionId={activeSession.id}
          senderId={activeSession.teacher_id}
        />
      </div>
    </>
  );
};

export default TeacherSessionSplitView;
