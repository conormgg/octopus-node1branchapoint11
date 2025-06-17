
import React from 'react';
import TeacherHeader from '../TeacherHeader';
import { SessionParticipant } from '@/types/student';

interface TeacherSessionViewHeaderProps {
  studentCount: number;
  activeStudentCount?: number; // Add optional active count
  currentLayout: any;
  availableLayouts: any[];
  selectedLayoutId: string;
  gridOrientation: 'columns-first' | 'rows-first';
  isSplitViewActive: boolean;
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
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: 'columns-first' | 'rows-first') => void;
  onToggleSplitView: () => void;
  onToggleControlsCollapse: () => void;
  onEndSession: () => void;
  onSignOut: () => void;
  onAddIndividualStudent?: (name: string, email: string) => Promise<void>;
  onRemoveIndividualStudent?: (participantId: number) => Promise<void>;
}

const TeacherSessionViewHeader: React.FC<TeacherSessionViewHeaderProps> = ({
  studentCount,
  activeStudentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  gridOrientation,
  isSplitViewActive,
  isControlsCollapsed,
  activeSession,
  sessionStudents,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
  onLayoutChange,
  onOrientationChange,
  onToggleSplitView,
  onToggleControlsCollapse,
  onEndSession,
  onSignOut,
  onAddIndividualStudent,
  onRemoveIndividualStudent,
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
        studentCount={studentCount}
        activeStudentCount={activeStudentCount}
        currentLayout={currentLayout}
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        gridOrientation={gridOrientation}
        onIncreaseStudentCount={onIncreaseStudentCount}
        onDecreaseStudentCount={onDecreaseStudentCount}
        onLayoutChange={onLayoutChange}
        onOrientationChange={onOrientationChange}
        onToggleSplitView={onToggleSplitView}
        isSplitViewActive={isSplitViewActive}
        isCollapsed={isControlsCollapsed}
        onToggleCollapse={onToggleControlsCollapse}
        activeSession={activeSession}
        sessionStudents={sessionStudents}
        onEndSession={onEndSession}
        onSignOut={onSignOut}
        onAddIndividualStudent={onAddIndividualStudent}
        onRemoveIndividualStudent={onRemoveIndividualStudent}
      />
    </>
  );
};

export default TeacherSessionViewHeader;
