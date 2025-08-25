
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
  
  isSplitView2Active?: boolean;
  gridOrientation: GridOrientation;
  isControlsCollapsed: boolean;
  availableLayouts: any[];
  currentLayout: any;
  totalPages: number;
  onMaximize: (boardId: string) => void;
  onMinimize: () => void;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
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
  // Split View 2 callback
  onSplitView2StateChange?: (isActive: boolean) => void;
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
  
  isSplitView2Active = false,
  gridOrientation,
  isControlsCollapsed,
  availableLayouts,
  currentLayout,
  totalPages,
  onMaximize,
  onMinimize,
  onLayoutChange,
  onOrientationChange,
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
  onSplitView2StateChange,
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
        isSplitView2Active={isSplitView2Active}
        isControlsCollapsed={isControlsCollapsed}
        activeSession={activeSession}
        sessionStudents={sessionStudents}
        onLayoutChange={onLayoutChange}
        onOrientationChange={onOrientationChange}
        
        onToggleControlsCollapse={onToggleControlsCollapse}
        onEndSession={onEndSession}
        onSignOut={onSignOut}
        onAddIndividualStudent={onAddIndividualStudent}
        onRemoveIndividualStudent={onRemoveIndividualStudent}
        onSplitView2StateChange={onSplitView2StateChange}
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
        
        onMaximize={onMaximize}
        onMinimize={onMinimize}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
        onLayoutChange={onLayoutChange}
        onOrientationChange={onOrientationChange}
        
        teacherSenderId={teacherSenderId}
        onToggleSyncDirection={onToggleSyncDirection}
        getSyncDirection={getSyncDirection}
        isParticipantUpdating={isParticipantUpdating}
        isSplitView2Active={isSplitView2Active}
      />
    </div>
  );
};

export default TeacherSessionView;
