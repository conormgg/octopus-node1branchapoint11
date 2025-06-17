
import React, { useState } from 'react';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from './TeacherView';
import TeacherHeaderLogo from './session/TeacherHeaderLogo';
import TeacherHeaderControls from './session/TeacherHeaderControls';
import TeacherHeaderStudentCount from './session/TeacherHeaderStudentCount';
import TeacherHeaderSessionOptions from './session/TeacherHeaderSessionOptions';
import TeacherHeaderCollapseToggle from './session/TeacherHeaderCollapseToggle';

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
}

interface TeacherHeaderProps {
  studentCount: number;
  activeStudentCount?: number;
  currentLayout: LayoutOption | undefined;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  gridOrientation: GridOrientation;
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  onToggleSplitView?: () => void;
  isSplitViewActive?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  activeSession?: Session | null;
  onEndSession?: () => void;
  onSignOut?: () => void;
  onOpenAddDialog?: () => void;
}

const TeacherHeader: React.FC<TeacherHeaderProps> = ({
  studentCount,
  activeStudentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  gridOrientation,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
  onLayoutChange,
  onOrientationChange,
  onToggleSplitView,
  isSplitViewActive = false,
  isCollapsed = false,
  onToggleCollapse,
  activeSession,
  onEndSession,
  onSignOut,
  onOpenAddDialog,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const shouldShowHeader = !isCollapsed || isHovered;

  return (
    <>
      {isCollapsed && (
        <div 
          className="absolute top-0 left-0 right-0 h-4 z-50 bg-transparent"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      )}
      
      <div 
        className={`bg-white border-b border-gray-200 transition-all duration-300 ease-in-out ${
          shouldShowHeader 
            ? 'transform translate-y-0 opacity-100' 
            : 'transform -translate-y-full opacity-0 absolute top-0 left-0 right-0 z-40'
        }`}
        onMouseEnter={() => isCollapsed && setIsHovered(true)}
        onMouseLeave={() => isCollapsed && setIsHovered(false)}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <TeacherHeaderLogo isCollapsed={isCollapsed} />
            
            <div className="flex items-center space-x-6">
              <TeacherHeaderControls
                currentLayout={currentLayout}
                availableLayouts={availableLayouts}
                selectedLayoutId={selectedLayoutId}
                gridOrientation={gridOrientation}
                onLayoutChange={onLayoutChange}
                onOrientationChange={onOrientationChange}
                onToggleSplitView={onToggleSplitView}
                isSplitViewActive={isSplitViewActive}
              />
              
              <TeacherHeaderStudentCount
                studentCount={studentCount}
                activeStudentCount={activeStudentCount}
                onIncreaseStudentCount={onIncreaseStudentCount}
                onDecreaseStudentCount={onDecreaseStudentCount}
              />

              <TeacherHeaderSessionOptions
                activeSession={activeSession}
                onEndSession={onEndSession}
                onSignOut={onSignOut}
                onOpenAddDialog={onOpenAddDialog}
              />

              <TeacherHeaderCollapseToggle
                isCollapsed={isCollapsed}
                onToggleCollapse={onToggleCollapse}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherHeader;
