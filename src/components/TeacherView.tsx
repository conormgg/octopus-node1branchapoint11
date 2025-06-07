
import React, { useEffect, useState } from 'react';
import SessionUrlModal from './session/SessionUrlModal';
import TeacherSessionView from './session/TeacherSessionView';
import { useSessionStudents } from '@/hooks/useSessionStudents';
import { useTeacherViewState } from '@/hooks/useTeacherViewState';
import { SessionExpirationProvider } from '@/contexts/SessionExpirationContext';
import { useAuth } from '@/hooks/useAuth';

export type GridOrientation = 'columns-first' | 'rows-first';

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
  teacher_id: string;
}

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
  const { user } = useAuth();

  const { sessionStudents, handleStudentCountChange, studentCount } = useSessionStudents(activeSession);
  
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
  } = useTeacherViewState(studentCount);

  useEffect(() => {
    setIsUrlModalOpen(showUrlModal);
  }, [showUrlModal]);

  // Log teacher view initialization for debugging
  useEffect(() => {
    if (activeSession && user) {
      console.log('TeacherView initialized:', {
        sessionId: activeSession.id,
        teacherId: user.id,
        sessionTitle: activeSession.title
      });
    }
  }, [activeSession, user]);

  const increaseStudentCount = () => {
    handleStudentCountChange(studentCount + 1);
  };

  const decreaseStudentCount = () => {
    handleStudentCountChange(studentCount - 1);
  };

  const handleCloseUrlModal = () => {
    setIsUrlModalOpen(false);
  };

  return (
    <SessionExpirationProvider 
      sessionId={activeSession?.id || null}
      onSessionExpired={() => {
        // Handle session expiration at the top level
        console.log('Session expired, handled by context');
      }}
    >
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
    </SessionExpirationProvider>
  );
};

export default TeacherView;
