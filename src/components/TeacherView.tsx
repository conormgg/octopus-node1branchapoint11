
import React, { useEffect, useState } from 'react';
import SessionUrlModal from './session/SessionUrlModal';
import TeacherSessionView from './session/TeacherSessionView';
import { useSessionStudents } from '@/hooks/useSessionStudents';
import { useTeacherViewState } from '@/hooks/useTeacherViewState';
import { useSyncDirectionManager } from '@/hooks/useSyncDirectionManager';
import { Session } from '@/types/session';

export type GridOrientation = 'columns-first' | 'rows-first';

interface TeacherViewProps {
  activeSession?: Session | null;
  onEndSession?: () => void;
  onSignOut?: () => void;
  showUrlModal?: boolean;
}

const TeacherView: React.FC<TeacherViewProps> = ({
  activeSession,
  onEndSession,
  onSignOut,
  showUrlModal = false,
}) => {
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(showUrlModal);

  const { 
    sessionStudents, 
    studentsWithStatus, 
    activeStudentCount, 
    totalStudentCount, 
    handleAddIndividualStudent,
    handleRemoveIndividualStudent,
    isLoading 
  } = useSessionStudents(activeSession);
  
  // Add sync direction management
  const {
    getSyncDirection,
    toggleSyncDirection,
    isParticipantUpdating
  } = useSyncDirectionManager(activeSession?.id, 'teacher');
  
  const {
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
    handleMaximize,
    handleMinimize,
    handleLayoutChange,
    handleOrientationChange,
    handleToggleSplitView,
    handleCloseSplitView,
    handleToggleDualBrowser,
    handleCloseDualBrowser,
    handleToggleControlsCollapse,
    handlePreviousPage,
    handleNextPage,
  } = useTeacherViewState(totalStudentCount); // Use total count for layout calculations

  useEffect(() => {
    setIsUrlModalOpen(showUrlModal);
  }, [showUrlModal]);

  const handleCloseUrlModal = () => {
    setIsUrlModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // Generate a teacher senderId for viewing student boards
  const teacherSenderId = activeSession ? `teacher-${activeSession.teacher_id}` : 'teacher-default';

  return (
    <>
      {/* Session URL Modal */}
      {activeSession && (
        <SessionUrlModal
          isOpen={isUrlModalOpen}
          onClose={handleCloseUrlModal}
          sessionSlug={activeSession.unique_url_slug}
          sessionTitle={activeSession.title}
        />
      )}

      <TeacherSessionView
        activeSession={activeSession!}
        sessionStudents={sessionStudents}
        studentsWithStatus={studentsWithStatus}
        activeStudentCount={activeStudentCount}
        totalStudentCount={totalStudentCount}
        maximizedBoard={maximizedBoard}
        currentPage={currentPage}
        selectedLayoutId={selectedLayoutId}
        isSplitViewActive={isSplitViewActive}
        isDualBrowserActive={isDualBrowserActive}
        gridOrientation={gridOrientation}
        isControlsCollapsed={isControlsCollapsed}
        availableLayouts={availableLayouts}
        currentLayout={currentLayout}
        totalPages={totalPages}
        onMaximize={handleMaximize}
        onMinimize={handleMinimize}
        onLayoutChange={handleLayoutChange}
        onOrientationChange={handleOrientationChange}
        onToggleSplitView={handleToggleSplitView}
        onCloseSplitView={handleCloseSplitView}
        onCloseDualBrowser={handleCloseDualBrowser}
        onToggleControlsCollapse={handleToggleControlsCollapse}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        onEndSession={onEndSession!}
        onSignOut={onSignOut!}
        onAddIndividualStudent={handleAddIndividualStudent}
        onRemoveIndividualStudent={handleRemoveIndividualStudent}
        teacherSenderId={teacherSenderId}
        // Pass sync direction management functions
        onToggleSyncDirection={toggleSyncDirection}
        getSyncDirection={getSyncDirection}
        isParticipantUpdating={isParticipantUpdating}
      />
    </>
  );
};

export default TeacherView;
