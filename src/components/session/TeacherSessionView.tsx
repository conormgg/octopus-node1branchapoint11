
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
  onEndSession: () => void;
  onSignOut: () => void;
  // Individual student management props
  onAddIndividualStudent?: (name: string, email: string) => Promise<void>;
  onRemoveIndividualStudent?: (participantId: number) => Promise<void>;
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
  onEndSession,
  onSignOut,
  onAddIndividualStudent,
  onRemoveIndividualStudent,
}) => {
  // Generate student boards with status information using the correct SessionParticipant[] type
  const allStudentBoards = generateStudentBoardsFromParticipants(sessionStudents);
  
  // Add teacherA board for observing Student A's student2 workspace
  const teacherObserverBoards = [
    {
      boardId: 'teacherA',
      studentName: 'Student A Workspace',
      studentEmail: '',
      hasJoined: true,
      status: 'active' as const
    }
  ];
  
  // Combine regular student boards with teacher observer boards
  const allBoardsWithTeacherA = [...allStudentBoards, ...teacherObserverBoards];
  
  // Generate grid slots with null placeholders for empty slots
  const currentStudentBoardsInfo = generateGridSlotsWithStatus(
    allBoardsWithTeacherA, 
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
        activeStudentCount={activeStudentCount}
        currentLayout={currentLayout}
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        gridOrientation={gridOrientation}
        isSplitViewActive={isSplitViewActive}
        isControlsCollapsed={isControlsCollapsed}
        activeSession={activeSession}
        sessionStudents={sessionStudents}
        onLayoutChange={onLayoutChange}
        onOrientationChange={onOrientationChange}
        onToggleSplitView={onToggleSplitView}
        onToggleControlsCollapse={onToggleControlsCollapse}
        onEndSession={onEndSession}
        onSignOut={onSignOut}
        onAddIndividualStudent={onAddIndividualStudent}
        onRemoveIndividualStudent={onRemoveIndividualStudent}
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
        onCloseSplitView={onCloseSplitView}
      />
    </div>
  );
};

export default TeacherSessionView;
