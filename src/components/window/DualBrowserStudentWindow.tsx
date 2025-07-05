import React, { useMemo } from 'react';
import { SessionParticipant, SyncDirection } from '@/types/student';
import { Session } from '@/types/session';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from '@/components/TeacherView';
import TeacherSessionViewHeader from '@/components/session/TeacherSessionViewHeader';
import StudentBoardsGrid from '@/components/StudentBoardsGrid';
import { generateStudentBoardsFromParticipants, generateGridSlotsWithStatus } from '@/utils/studentBoardGenerator';

interface DualBrowserStudentWindowProps {
  activeSession: Session;
  sessionStudents: SessionParticipant[];
  activeStudentCount: number;
  totalStudentCount: number;
  maximizedBoard: string | null;
  currentPage: number;
  selectedLayoutId: string;
  gridOrientation: GridOrientation;
  isControlsCollapsed: boolean;
  availableLayouts: LayoutOption[];
  currentLayout: LayoutOption | null;
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
  onAddIndividualStudent: (name: string, email?: string) => Promise<void>;
  onRemoveIndividualStudent: (studentId: number) => Promise<void>;
  teacherSenderId: string;
  onToggleSyncDirection: (studentId: number) => Promise<boolean>;
  getSyncDirection: (studentId: number) => SyncDirection;
  isParticipantUpdating: (studentId: number) => boolean;
  onCloseDualBrowser: () => void;
}

const DualBrowserStudentWindow: React.FC<DualBrowserStudentWindowProps> = ({
  activeSession,
  sessionStudents,
  activeStudentCount,
  totalStudentCount,
  maximizedBoard,
  currentPage,
  selectedLayoutId,
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
  onCloseDualBrowser,
}) => {
  // Memoize student board data
  const allStudentBoards = useMemo(() => 
    generateStudentBoardsFromParticipants(sessionStudents),
    [sessionStudents]
  );
  
  const currentStudentBoardsInfo = useMemo(() => 
    generateGridSlotsWithStatus(
      allStudentBoards, 
      currentPage, 
      currentLayout?.studentsPerPage || 4
    ),
    [allStudentBoards, currentPage, currentLayout?.studentsPerPage]
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - Same as main browser */}
      <TeacherSessionViewHeader
        activeSession={activeSession}
        sessionStudents={sessionStudents}
        activeStudentCount={activeStudentCount}
        currentLayout={currentLayout}
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        gridOrientation={gridOrientation}
        isSplitViewActive={false}
        isControlsCollapsed={isControlsCollapsed}
        onLayoutChange={onLayoutChange}
        onOrientationChange={onOrientationChange}
        onToggleSplitView={() => {}}
        onToggleControlsCollapse={onToggleControlsCollapse}
        onEndSession={onEndSession}
        onSignOut={onSignOut}
        onAddIndividualStudent={onAddIndividualStudent}
        onRemoveIndividualStudent={onRemoveIndividualStudent}
      />

      {/* Student Boards Grid Only - No Teacher Board */}
      <div className="flex-1 min-h-0 p-4">
        <StudentBoardsGrid
          studentCount={totalStudentCount}
          activeStudentCount={activeStudentCount}
          currentLayout={currentLayout}
          currentStudentBoardsInfo={currentStudentBoardsInfo}
          currentPage={currentPage}
          totalPages={totalPages}
          gridOrientation={gridOrientation}
          maximizedBoard={maximizedBoard}
          onMaximize={onMaximize}
          onMinimize={onMinimize}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
          sessionId={activeSession.id}
          senderId={teacherSenderId}
          onToggleSyncDirection={onToggleSyncDirection}
          getSyncDirection={getSyncDirection}
          isParticipantUpdating={isParticipantUpdating}
          isTeacher={true}
        />
      </div>
    </div>
  );
};

export default DualBrowserStudentWindow;