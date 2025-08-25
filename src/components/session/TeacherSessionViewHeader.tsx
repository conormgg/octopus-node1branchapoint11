
import React from 'react';
import TeacherHeader from '../TeacherHeader';
import { SessionParticipant } from '@/types/student';

interface TeacherSessionViewHeaderProps {
  activeStudentCount?: number; // Keep for internal use
  currentLayout: any;
  availableLayouts: any[];
  selectedLayoutId: string;
  gridOrientation: 'columns-first' | 'rows-first';
  
  isSplitView2Active?: boolean;
  isControlsCollapsed: boolean;
  activeSession: {
    id: string;
    title: string;
    unique_url_slug: string;
    status: string;
    created_at: string;
    teacher_id: string;
  };
  sessionStudents?: SessionParticipant[];
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: 'columns-first' | 'rows-first') => void;
  
  onToggleControlsCollapse: () => void;
  onEndSession: () => void;
  onSignOut: () => void;
  onAddIndividualStudent?: (name: string, email: string) => Promise<void>;
  onRemoveIndividualStudent?: (participantId: number) => Promise<void>;
  onSplitView2StateChange?: (isActive: boolean) => void;
}

const TeacherSessionViewHeader: React.FC<TeacherSessionViewHeaderProps> = ({
  activeStudentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  gridOrientation,
  
  isSplitView2Active = false,
  isControlsCollapsed,
  activeSession,
  sessionStudents,
  onLayoutChange,
  onOrientationChange,
  
  onToggleControlsCollapse,
  onEndSession,
  onSignOut,
  onAddIndividualStudent,
  onRemoveIndividualStudent,
  onSplitView2StateChange,
}) => {
  return (
    <>
      {/* Hover zone for collapsed header */}
      {isControlsCollapsed && (
        <div 
          className="absolute top-0 left-0 right-0 h-4 z-50 bg-transparent"
        />
      )}

      <TeacherHeader
        activeStudentCount={activeStudentCount}
        currentLayout={currentLayout}
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        gridOrientation={gridOrientation}
        onLayoutChange={onLayoutChange}
        onOrientationChange={onOrientationChange}
        isCollapsed={isControlsCollapsed}
        onToggleCollapse={onToggleControlsCollapse}
        activeSession={activeSession}
        sessionStudents={sessionStudents}
        onEndSession={onEndSession}
        onSignOut={onSignOut}
        onAddIndividualStudent={onAddIndividualStudent}
        onRemoveIndividualStudent={onRemoveIndividualStudent}
        onSplitView2StateChange={onSplitView2StateChange}
      />
    </>
  );
};

export default TeacherSessionViewHeader;
