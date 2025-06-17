
import React from 'react';
import TeacherSessionSplitView from './TeacherSessionSplitView';
import TeacherSessionResizablePanels from './TeacherSessionResizablePanels';
import { GridOrientation } from '../TeacherView';

interface TeacherSessionMainContentProps {
  activeSession: {
    id: string;
    title: string;
    unique_url_slug: string;
    status: string;
    created_at: string;
    teacher_id: string;
  };
  studentCount: number;
  activeStudentCount?: number; // Add optional active student count
  currentLayout: any;
  availableLayouts: any[];
  selectedLayoutId: string;
  currentStudentBoards: any[];
  currentPage: number;
  totalPages: number;
  gridOrientation: GridOrientation;
  maximizedBoard: string | null;
  isControlsCollapsed: boolean;
  isSplitViewActive: boolean;
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

const TeacherSessionMainContent: React.FC<TeacherSessionMainContentProps> = ({
  activeSession,
  studentCount,
  activeStudentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  currentStudentBoards,
  currentPage,
  totalPages,
  gridOrientation,
  maximizedBoard,
  isControlsCollapsed,
  isSplitViewActive,
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
    <div className={`flex-1 ${isControlsCollapsed ? 'h-screen' : 'h-[calc(100vh-5rem)]'} p-4`}>
      {isSplitViewActive ? (
        <TeacherSessionSplitView
          activeSession={activeSession}
          studentCount={studentCount}
          currentLayout={currentLayout}
          availableLayouts={availableLayouts}
          selectedLayoutId={selectedLayoutId}
          currentStudentBoards={currentStudentBoards}
          currentPage={currentPage}
          totalPages={totalPages}
          gridOrientation={gridOrientation}
          maximizedBoard={maximizedBoard}
          isControlsCollapsed={isControlsCollapsed}
          onMaximize={onMaximize}
          onMinimize={onMinimize}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
          onLayoutChange={onLayoutChange}
          onOrientationChange={onOrientationChange}
          onIncreaseStudentCount={onIncreaseStudentCount}
          onDecreaseStudentCount={onDecreaseStudentCount}
          onCloseSplitView={onCloseSplitView}
        />
      ) : (
        <TeacherSessionResizablePanels
          activeSession={activeSession}
          studentCount={studentCount}
          currentLayout={currentLayout}
          currentStudentBoards={currentStudentBoards}
          currentPage={currentPage}
          totalPages={totalPages}
          gridOrientation={gridOrientation}
          maximizedBoard={maximizedBoard}
          isControlsCollapsed={isControlsCollapsed}
          onMaximize={onMaximize}
          onMinimize={onMinimize}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
        />
      )}
    </div>
  );
};

export default TeacherSessionMainContent;
