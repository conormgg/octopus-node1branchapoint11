
import React from 'react';
import StudentBoardsWindowHeader from '../StudentBoardsWindowHeader';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from '../TeacherView';

interface WindowContentHeaderProps {
  studentCount: number;
  currentLayout: LayoutOption | undefined;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  currentPage: number;
  totalPages: number;
  gridOrientation: GridOrientation;
  isHeaderCollapsed: boolean;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  onClose: () => void;
  onToggleCollapse: () => void;
}

const WindowContentHeader: React.FC<WindowContentHeaderProps> = ({
  studentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  currentPage,
  totalPages,
  gridOrientation,
  isHeaderCollapsed,
  onLayoutChange,
  onOrientationChange,
  onClose,
  onToggleCollapse,
}) => {
  // Create dummy functions for the StudentBoardsWindowHeader component
  const handleIncreaseStudentCount = () => {
    // No-op function since student count management is handled elsewhere
  };

  const handleDecreaseStudentCount = () => {
    // No-op function since student count management is handled elsewhere
  };

  return (
    <div 
      className={`transition-all duration-300 ease-in-out ${
        isHeaderCollapsed 
          ? 'h-0 overflow-hidden opacity-0' 
          : 'h-auto opacity-100 p-4'
      }`}
    >
      <StudentBoardsWindowHeader
        studentCount={studentCount}
        currentLayoutName={currentLayout?.name}
        currentPage={currentPage}
        totalPages={totalPages}
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        gridOrientation={gridOrientation}
        onLayoutChange={onLayoutChange}
        onOrientationChange={onOrientationChange}
        onIncreaseStudentCount={handleIncreaseStudentCount}
        onDecreaseStudentCount={handleDecreaseStudentCount}
        onClose={onClose}
        isCollapsed={isHeaderCollapsed}
        onToggleCollapse={onToggleCollapse}
      />
    </div>
  );
};

export default WindowContentHeader;
