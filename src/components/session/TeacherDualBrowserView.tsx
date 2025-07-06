import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import TeacherMainBoard from '../TeacherMainBoard';
import DualBrowserStudentWindow from '../window/DualBrowserStudentWindow';
import { useDualBrowserManager } from '@/hooks/window/useDualBrowserManager';
import { GridOrientation } from '../TeacherView';
import { SessionParticipant, SyncDirection } from '@/types/student';
import { Session } from '@/types/session';
import { LayoutOption } from '@/utils/layoutCalculator';

interface TeacherDualBrowserViewProps {
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
  teacherSenderId: string;
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
  onToggleSyncDirection: (studentId: number) => Promise<boolean>;
  getSyncDirection: (studentId: number) => SyncDirection;
  isParticipantUpdating: (studentId: number) => boolean;
  onCloseDualBrowser: () => void;
}

const TeacherDualBrowserView: React.FC<TeacherDualBrowserViewProps> = ({
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
  teacherSenderId,
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
  onToggleSyncDirection,
  getSyncDirection,
  isParticipantUpdating,
  onCloseDualBrowser,
}) => {
  const { containerRef } = useDualBrowserManager({
    onStudentWindowReady: (container) => {
      console.log('[TeacherDualBrowserView] Student window container ready');
    },
    onClose: onCloseDualBrowser
  });

  return (
    <>
      {/* Main browser shows only teacher board */}
      <div className="h-full relative">
        <TeacherMainBoard 
          onMaximize={onMaximize}
          onMinimize={onMinimize}
          maximizedBoard={maximizedBoard}
          isHeaderCollapsed={isControlsCollapsed}
          sessionId={activeSession.id}
          senderId={teacherSenderId}
        />
      </div>

      {/* Portal student boards to the separate browser window */}
      {containerRef.current && createPortal(
        <DualBrowserStudentWindow
          activeSession={activeSession}
          sessionStudents={sessionStudents}
          activeStudentCount={activeStudentCount}
          totalStudentCount={totalStudentCount}
          maximizedBoard={maximizedBoard}
          currentPage={currentPage}
          selectedLayoutId={selectedLayoutId}
          gridOrientation={gridOrientation}
          isControlsCollapsed={isControlsCollapsed}
          availableLayouts={availableLayouts}
          currentLayout={currentLayout}
          totalPages={totalPages}
          onMaximize={onMaximize}
          onMinimize={onMinimize}
          onLayoutChange={onLayoutChange}
          onOrientationChange={onOrientationChange}
          onToggleControlsCollapse={onToggleControlsCollapse}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
          onEndSession={onEndSession}
          onSignOut={onSignOut}
          onAddIndividualStudent={onAddIndividualStudent}
          onRemoveIndividualStudent={onRemoveIndividualStudent}
          teacherSenderId={teacherSenderId}
          onToggleSyncDirection={onToggleSyncDirection}
          getSyncDirection={getSyncDirection}
          isParticipantUpdating={isParticipantUpdating}
          onCloseDualBrowser={onCloseDualBrowser}
        />,
        containerRef.current
      )}
    </>
  );
};

export default TeacherDualBrowserView;