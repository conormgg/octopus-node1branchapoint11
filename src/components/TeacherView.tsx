
import React, { useEffect, useState } from 'react';
import SessionUrlModal from './session/SessionUrlModal';
import TeacherSessionView from './session/TeacherSessionView';
import { useSessionStudents } from '@/hooks/useSessionStudents';
import { useTeacherViewState } from '@/hooks/useTeacherViewState';
import { usePresenceCleanup } from '@/hooks/usePresenceCleanup';
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
    handleStudentCountChange,
    isLoading 
  } = useSessionStudents(activeSession);
  
  // Set up presence cleanup for this session
  usePresenceCleanup({
    sessionId: activeSession?.id || '',
    enabled: !!activeSession,
  });
  
  const {
    maximizedBoard,
    currentPage,
    selectedLayoutId,
    isSplitViewActive,
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
    handleToggleControlsCollapse,
    handlePreviousPage,
    handleNextPage,
  } = useTeacherViewState(totalStudentCount); // Use total count for layout calculations

  useEffect(() => {
    setIsUrlModalOpen(showUrlModal);
  }, [showUrlModal]);

  const increaseStudentCount = () => {
    handleStudentCountChange(totalStudentCount + 1);
  };

  const decreaseStudentCount = () => {
    handleStudentCountChange(totalStudentCount - 1);
  };

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
        onToggleControlsCollapse={handleToggleControlsCollapse}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        onIncreaseStudentCount={increaseStudentCount}
        onDecreaseStudentCount={decreaseStudentCount}
        onEndSession={onEndSession!}
        onSignOut={onSignOut!}
      />
    </>
  );
};

export default TeacherView;
