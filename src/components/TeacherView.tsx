
import React, { useEffect, useState } from 'react';
import SessionUrlModal from './session/SessionUrlModal';
import TeacherSessionView from './session/TeacherSessionView';
import { useSessionStudents } from '@/hooks/useSessionStudents';
import { useTeacherViewState } from '@/hooks/useTeacherViewState';

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

  const { sessionStudents, handleStudentCountChange, studentCount } = useSessionStudents(activeSession);
  
  const {
    maximizedBoard,
    currentPage,
    selectedLayoutId,
    isSplitViewActive,
    isSplitView2Active,
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
    handleToggleSplitView2,
    handleCloseSplitView2,
    handleToggleControlsCollapse,
    handlePreviousPage,
    handleNextPage,
  } = useTeacherViewState(studentCount);

  useEffect(() => {
    setIsUrlModalOpen(showUrlModal);
  }, [showUrlModal]);

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
        maximizedBoard={maximizedBoard}
        currentPage={currentPage}
        selectedLayoutId={selectedLayoutId}
        isSplitViewActive={isSplitViewActive}
        isSplitView2Active={isSplitView2Active}
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
        onToggleSplitView2={handleToggleSplitView2}
        onCloseSplitView2={handleCloseSplitView2}
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
