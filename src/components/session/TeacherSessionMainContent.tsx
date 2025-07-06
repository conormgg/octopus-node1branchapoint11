
import React from 'react';
import TeacherSessionSplitView from './TeacherSessionSplitView';
import TeacherSessionResizablePanels from './TeacherSessionResizablePanels';
import TeacherDualBrowserView from './TeacherDualBrowserView';
import { GridOrientation } from '../TeacherView';
import { StudentBoardInfo } from '@/utils/studentBoardGenerator';
import { SyncDirection } from '@/types/student';

interface TeacherSessionMainContentProps {
  activeSession: {
    id: string;
    title: string;
    unique_url_slug: string;
    status: string;
    created_at: string;
    teacher_id: string;
  };
  sessionStudents?: any[];
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
  isSplitViewActive: boolean;
  isDualBrowserActive?: boolean;
  teacherSenderId?: string;
  onMaximize: (boardId: string) => void;
  onMinimize: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  onCloseSplitView: () => void;
  onCloseDualBrowser?: () => void;
  onEndSession?: () => void;
  onSignOut?: () => void;
  onAddIndividualStudent?: (name: string, email?: string) => Promise<void>;
  onRemoveIndividualStudent?: (studentId: number) => Promise<void>;
  // Add sync direction props
  onToggleSyncDirection?: (participantId: number) => Promise<boolean>;
  getSyncDirection?: (participantId: number) => SyncDirection;
  isParticipantUpdating?: (participantId: number) => boolean;
}

const TeacherSessionMainContent: React.FC<TeacherSessionMainContentProps> = ({
  activeSession,
  sessionStudents,
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
  isSplitViewActive,
  isDualBrowserActive,
  teacherSenderId,
  onMaximize,
  onMinimize,
  onPreviousPage,
  onNextPage,
  onLayoutChange,
  onOrientationChange,
  onCloseSplitView,
  onCloseDualBrowser,
  onEndSession,
  onSignOut,
  onAddIndividualStudent,
  onRemoveIndividualStudent,
  onToggleSyncDirection,
  getSyncDirection,
  isParticipantUpdating,
}) => {
  return (
    <div className={`flex-1 ${isControlsCollapsed ? 'h-screen' : 'h-[calc(100vh-5rem)]'} p-4`}>
      {isDualBrowserActive ? (
        <TeacherDualBrowserView
          activeSession={activeSession}
          sessionStudents={sessionStudents || []}
          activeStudentCount={activeStudentCount || 0}
          totalStudentCount={studentCount}
          maximizedBoard={maximizedBoard}
          currentPage={currentPage}
          selectedLayoutId={selectedLayoutId}
          gridOrientation={gridOrientation}
          isControlsCollapsed={isControlsCollapsed}
          availableLayouts={availableLayouts}
          currentLayout={currentLayout}
          totalPages={totalPages}
          teacherSenderId={teacherSenderId || activeSession.teacher_id}
          onMaximize={onMaximize}
          onMinimize={onMinimize}
          onLayoutChange={onLayoutChange}
          onOrientationChange={onOrientationChange}
          onToggleControlsCollapse={() => {}} // This will be handled by the main browser
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
          onEndSession={onEndSession || (() => {})}
          onSignOut={onSignOut || (() => {})}
          onAddIndividualStudent={onAddIndividualStudent || (async () => {})}
          onRemoveIndividualStudent={onRemoveIndividualStudent || (async () => {})}
          onToggleSyncDirection={onToggleSyncDirection || (async () => false)}
          getSyncDirection={getSyncDirection || (() => 'student_active')}
          isParticipantUpdating={isParticipantUpdating || (() => false)}
          onCloseDualBrowser={onCloseDualBrowser || (() => {})}
        />
      ) : isSplitViewActive ? (
        <TeacherSessionSplitView
          activeSession={activeSession}
          studentCount={studentCount}
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
          teacherSenderId={teacherSenderId}
          onMaximize={onMaximize}
          onMinimize={onMinimize}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
          onLayoutChange={onLayoutChange}
          onOrientationChange={onOrientationChange}
          onCloseSplitView={onCloseSplitView}
          onToggleSyncDirection={onToggleSyncDirection}
          getSyncDirection={getSyncDirection}
          isParticipantUpdating={isParticipantUpdating}
        />
      ) : (
        <TeacherSessionResizablePanels
          activeSession={activeSession}
          studentCount={studentCount}
          activeStudentCount={activeStudentCount}
          currentLayout={currentLayout}
          currentStudentBoards={currentStudentBoards}
          currentStudentBoardsInfo={currentStudentBoardsInfo}
          currentPage={currentPage}
          totalPages={totalPages}
          gridOrientation={gridOrientation}
          maximizedBoard={maximizedBoard}
          isControlsCollapsed={isControlsCollapsed}
          teacherSenderId={teacherSenderId}
          onMaximize={onMaximize}
          onMinimize={onMinimize}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
          onToggleSyncDirection={onToggleSyncDirection}
          getSyncDirection={getSyncDirection}
          isParticipantUpdating={isParticipantUpdating}
        />
      )}
    </div>
  );
};

export default TeacherSessionMainContent;
