
import React from 'react';
import TeacherHeader from '../TeacherHeader';

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
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: 'columns-first' | 'rows-first') => void;
  onToggleSplitView: () => void;
  onToggleControlsCollapse: () => void;
  onEndSession: () => void;
  onSignOut: () => void;
  onOpenAddDialog?: () => void;
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
  onIncreaseStudentCount,
  onDecreaseStudentCount,
  onLayoutChange,
  onOrientationChange,
  onToggleSplitView,
  onToggleControlsCollapse,
  onEndSession,
  onSignOut,
  onOpenAddDialog,
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
        onEndSession={onEndSession}
        onSignOut={onSignOut}
        onOpenAddDialog={onOpenAddDialog}
      />
    </>
  );
};

export default TeacherSessionViewHeader;
