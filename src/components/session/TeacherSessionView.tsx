
import React, { useMemo } from 'react';
import TeacherSessionViewHeader from './TeacherSessionViewHeader';
import TeacherSessionMainContent from './TeacherSessionMainContent';
import { generateStudentBoardsFromParticipants, generateGridSlotsWithStatus } from '@/utils/studentBoardGenerator';
import { GridOrientation } from '../TeacherView';
import { SessionParticipant, SyncDirection } from '@/types/student';

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
  isDualBrowserActive?: boolean;
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
  onToggleDualBrowser?: () => void;
  onCloseDualBrowser?: () => void;
  onToggleControlsCollapse: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onEndSession: () => void;
  onSignOut: () => void;
  // Individual student management props
  onAddIndividualStudent?: (name: string, email: string) => Promise<void>;
  onRemoveIndividualStudent?: (participantId: number) => Promise<void>;
  teacherSenderId?: string;
  // New sync direction props
  onToggleSyncDirection?: (participantId: number) => Promise<boolean>;
  getSyncDirection?: (participantId: number) => SyncDirection;
  isParticipantUpdating?: (participantId: number) => boolean;
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
  isDualBrowserActive,
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
  onToggleDualBrowser,
  onCloseDualBrowser,
  onToggleControlsCollapse,
  onPreviousPage,
  onNextPage,
  onEndSession,
  onSignOut,
  onAddIndividualStudent,
  onRemoveIndividualStudent,
  teacherSenderId,
  onToggleSyncDirection,
  getSyncDirection,
  isParticipantUpdating,
}) => {
  // Memoize expensive computations to prevent unnecessary re-renders
  const allStudentBoards = useMemo(() => 
    generateStudentBoardsFromParticipants(sessionStudents),
    [sessionStudents]
  );
  
  // Memoize grid slots calculation
  const currentStudentBoardsInfo = useMemo(() => 
    generateGridSlotsWithStatus(
      allStudentBoards, 
      currentPage, 
      currentLayout?.studentsPerPage || 4
    ),
    [allStudentBoards, currentPage, currentLayout?.studentsPerPage]
  );

  // Extract boardId strings for components that still expect string[] (backward compatibility)
  const currentStudentBoards = useMemo(() => 
    currentStudentBoardsInfo
      .filter(board => board !== null)
      .map(board => board!.boardId),
    [currentStudentBoardsInfo]
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <TeacherSessionViewHeader
        activeStudentCount={activeStudentCount}
        currentLayout={currentLayout}
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        gridOrientation={gridOrientation}
        isSplitViewActive={isSplitViewActive}
        isDualBrowserActive={isDualBrowserActive}
        isControlsCollapsed={isControlsCollapsed}
        activeSession={activeSession}
        sessionStudents={sessionStudents}
        onLayoutChange={onLayoutChange}
        onOrientationChange={onOrientationChange}
        onToggleSplitView={onToggleSplitView}
        onToggleDualBrowser={onToggleDualBrowser}
        onToggleControlsCollapse={onToggleControlsCollapse}
        onEndSession={onEndSession}
        onSignOut={onSignOut}
        onAddIndividualStudent={onAddIndividualStudent}
        onRemoveIndividualStudent={onRemoveIndividualStudent}
      />

      <TeacherSessionMainContent
        activeSession={activeSession}
        sessionStudents={sessionStudents}
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
        isDualBrowserActive={isDualBrowserActive}
        onMaximize={onMaximize}
        onMinimize={onMinimize}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
        onLayoutChange={onLayoutChange}
        onOrientationChange={onOrientationChange}
        onCloseSplitView={onCloseSplitView}
        onCloseDualBrowser={onCloseDualBrowser}
        onEndSession={onEndSession}
        onSignOut={onSignOut}
        onAddIndividualStudent={onAddIndividualStudent}
        onRemoveIndividualStudent={onRemoveIndividualStudent}
        teacherSenderId={teacherSenderId}
        onToggleSyncDirection={onToggleSyncDirection}
        getSyncDirection={getSyncDirection}
        isParticipantUpdating={isParticipantUpdating}
      />
    </div>
  );
};

export default TeacherSessionView;
