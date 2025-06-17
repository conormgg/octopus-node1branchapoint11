
import React from 'react';
import TeacherSessionViewHeader from './TeacherSessionViewHeader';
import TeacherSessionMainContent from './TeacherSessionMainContent';
import { generateStudentBoardsFromParticipants, generateGridSlotsWithStatus } from '@/utils/studentBoardGenerator';
import { GridOrientation } from '../TeacherView';
import { SessionParticipant } from '@/types/student';

interface StudentWithStatus extends SessionParticipant {
  hasJoined: boolean;
  boardId: string;
  status: 'active' | 'pending';
}

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
  teacher_id: string;
}

interface TeacherSessionViewProps {
  activeSession: Session;
  sessionStudents: SessionParticipant[];
  studentsWithStatus: StudentWithStatus[];
  activeStudentCount: number;
  totalStudentCount: number;
  maximizedBoard: string | null;
  currentPage: number;
  selectedLayoutId: string;
  isSplitViewActive: boolean;
  gridOrientation: GridOrientation;
  isControlsCollapsed: boolean;
  availableLayouts: any[];
  currentLayout: any;
  totalPages: number;
  onMaximize: (boardId: string) => void;
  onMinimize: () => void;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  onToggleSplitView: () => void;
  onCloseSplitView: () => void;
  onToggleControlsCollapse: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
  onOpenAddDialog?: () => void; // Changed from onAddStudent
  onRemoveStudent?: (studentId: number) => void;
  onEndSession: () => void;
  onSignOut: () => void;
}

const TeacherSessionView: React.FC<TeacherSessionViewProps> = ({
  activeSession,
  sessionStudents,
  studentsWithStatus,
  activeStudentCount,
  totalStudentCount,
  maximizedBoard,
  currentPage,
  selectedLayoutId,
  isSplitViewActive,
  gridOrientation,
  isControlsCollapsed,
  availableLayouts,
  currentLayout,
  totalPages,
  onMaximize,
  onMinimize,
  onLayoutChange,
  onOrientationChange,
  onToggleSplitView,
  onCloseSplitView,
  onToggleControlsCollapse,
  onPreviousPage,
  onNextPage,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
  onOpenAddDialog,
  onRemoveStudent,
  onEndSession,
  onSignOut,
}) => {
  // Generate student boards with status information using the correct SessionParticipant[] type
  const allStudentBoards = generateStudentBoardsFromParticipants(sessionStudents);
  
  // Generate grid slots with null placeholders for empty slots
  const currentStudentBoardsInfo = generateGridSlotsWithStatus(
    allStudentBoards, 
    currentPage, 
    currentLayout?.studentsPerPage || 4
  );

  // Extract boardId strings for components that still expect string[] (backward compatibility)
  const currentStudentBoards = currentStudentBoardsInfo
    .filter(board => board !== null)
    .map(board => board!.boardId);

  return (
    <div className="min-h-screen bg-gray-100">
      <TeacherSessionViewHeader
        studentCount={totalStudentCount}
        activeStudentCount={activeStudentCount}
        currentLayout={currentLayout}
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        gridOrientation={gridOrientation}
        isSplitViewActive={isSplitViewActive}
        isControlsCollapsed={isControlsCollapsed}
        activeSession={activeSession}
        onIncreaseStudentCount={onIncreaseStudentCount}
        onDecreaseStudentCount={onDecreaseStudentCount}
        onLayoutChange={onLayoutChange}
        onOrientationChange={onOrientationChange}
        onToggleSplitView={onToggleSplitView}
        onToggleControlsCollapse={onToggleControlsCollapse}
        onEndSession={onEndSession}
        onSignOut={onSignOut}
      />

      <TeacherSessionMainContent
        activeSession={activeSession}
        studentCount={totalStudentCount}
        activeStudentCount={activeStudentCount}
        currentLayout={currentLayout}
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        currentStudentBoards={currentStudentBoards}
        currentStudentBoardsInfo={currentStudentBoardsInfo}
        currentPage={currentPage}
        totalPages={totalPages}
        gridOrientation={gridOrientation}
        maximizedBoard={maximizedBoard}
        isControlsCollapsed={isControlsCollapsed}
        isSplitViewActive={isSplitViewActive}
        onMaximize={onMaximize}
        onMinimize={onMinimize}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
        onLayoutChange={onLayoutChange}
        onOrientationChange={onOrientationChange}
        onIncreaseStudentCount={onIncreaseStudentCount}
        onDecreaseStudentCount={onDecreaseStudentCount}
        onOpenAddDialog={onOpenAddDialog}
        onRemoveStudent={onRemoveStudent}
        onCloseSplitView={onCloseSplitView}
      />
    </div>
  );
};

export default TeacherSessionView;
