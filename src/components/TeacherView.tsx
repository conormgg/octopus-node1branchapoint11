
import React, { useEffect, useState, useRef } from 'react';
import SessionUrlModal from './session/SessionUrlModal';
import TeacherSessionView from './session/TeacherSessionView';
import { useSessionStudents } from '@/hooks/useSessionStudents';
import { useTeacherViewState } from '@/hooks/useTeacherViewState';
import { useSyncDirectionManager } from '@/hooks/useSyncDirectionManager';
import { Session } from '@/types/session';
import { useToast } from '@/hooks/use-toast';

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
  const monitorWindowRef = useRef<Window | null>(null);
  const { toast } = useToast();

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
    handleToggleControlsCollapse,
    handlePreviousPage,
    handleNextPage,
    handleSplitView2StateChange,
  } = useTeacherViewState(totalStudentCount); // Use total count for layout calculations

  useEffect(() => {
    setIsUrlModalOpen(showUrlModal);
  }, [showUrlModal]);

  const handleCloseUrlModal = () => {
    setIsUrlModalOpen(false);
  };

  // Monitor window lifecycle management
  const handleMonitorWindowOpened = (newWindow: Window) => {
    console.log('[TeacherView] Monitor window opened, storing reference');
    monitorWindowRef.current = newWindow;
    handleSplitView2StateChange(true);
  };

  // Handle closing the monitor window
  const handleCloseSplitView2 = () => {
    if (monitorWindowRef.current && !monitorWindowRef.current.closed) {
      console.log('[TeacherView] Closing monitor window');
      monitorWindowRef.current.close();
    }
    monitorWindowRef.current = null;
    handleSplitView2StateChange(false);
  };

  // Polling for window closure detection
  useEffect(() => {
    if (!monitorWindowRef.current) return;

    console.log('[TeacherView] Setting up monitor window polling');
    
    const checkWindow = () => {
      if (monitorWindowRef.current?.closed) {
        console.log('[TeacherView] Monitor window detected as closed via polling');
        monitorWindowRef.current = null;
        handleSplitView2StateChange(false);
        
        toast({
          title: "Monitor Closed",
          description: "Reverted to original layout.",
        });
      }
    };

    const interval = setInterval(checkWindow, 500);

    return () => {
      console.log('[TeacherView] Cleaning up monitor window polling');
      clearInterval(interval);
    };
  }, [monitorWindowRef.current, handleSplitView2StateChange, toast]);

  // Message listener for immediate close detection
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      const { source, type, sessionId } = event.data || {};
      
      if (source === 'student-monitor' && sessionId === activeSession?.id) {
        if (type === 'ready') {
          console.log('[TeacherView] Monitor window ready message received');
          handleSplitView2StateChange(true);
        } else if (type === 'closing') {
          console.log('[TeacherView] Monitor window closing message received');
          monitorWindowRef.current = null;
          handleSplitView2StateChange(false);
          
          toast({
            title: "Monitor Closed",
            description: "Reverted to original layout.",
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [activeSession?.id, handleSplitView2StateChange, toast]);

  // Close monitor window when teacher window is closed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (monitorWindowRef.current && !monitorWindowRef.current.closed) {
        console.log('[TeacherView] Closing monitor window on teacher window unload');
        monitorWindowRef.current.close();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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
        onSplitView2StateChange={handleCloseSplitView2}
        onMonitorWindowOpened={handleMonitorWindowOpened}
      />
    </>
  );
};

export default TeacherView;
