
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import StudentBoardsGrid from './StudentBoardsGrid';
import StudentBoardsWindowHeader from './StudentBoardsWindowHeader';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from './TeacherView';

interface WindowContentRendererProps {
  container: HTMLDivElement;
  studentCount: number;
  currentLayout: LayoutOption | undefined;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  currentStudentBoards: string[];
  currentPage: number;
  totalPages: number;
  gridOrientation: GridOrientation;
  onMaximize: (boardId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
  onClose: () => void;
}

const WindowContentRenderer: React.FC<WindowContentRendererProps> = ({
  container,
  studentCount,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  currentStudentBoards,
  currentPage,
  totalPages,
  gridOrientation,
  onMaximize,
  onPreviousPage,
  onNextPage,
  onLayoutChange,
  onOrientationChange,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
  onClose,
}) => {
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  const toggleHeaderCollapse = () => {
    setIsHeaderCollapsed(prev => !prev);
  };

  console.log('Rendering portal content', { studentCount, currentLayout, currentStudentBoards });

  return createPortal(
    <div className="flex-1 bg-gray-100 flex flex-col min-h-0 relative group">
      {/* Collapsible Header */}
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
          onIncreaseStudentCount={onIncreaseStudentCount}
          onDecreaseStudentCount={onDecreaseStudentCount}
          onClose={onClose}
          isCollapsed={isHeaderCollapsed}
          onToggleCollapse={toggleHeaderCollapse}
        />
      </div>

      {/* Toggle Button - Always visible on hover */}
      <button
        onClick={toggleHeaderCollapse}
        className={`absolute top-2 right-2 z-30 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-2 shadow-sm transition-all duration-200 ${
          isHeaderCollapsed 
            ? 'opacity-0 group-hover:opacity-100' 
            : 'opacity-100'
        } hover:bg-white hover:shadow-md`}
        title={isHeaderCollapsed ? 'Show Controls' : 'Hide Controls'}
      >
        <div className="w-4 h-4 flex flex-col justify-center">
          <div className={`h-0.5 bg-gray-600 transition-all duration-200 ${
            isHeaderCollapsed ? 'rotate-180' : ''
          }`}>
            <div className="w-full h-full bg-current"></div>
          </div>
          <div className="h-0.5 bg-gray-600 mt-1">
            <div className="w-full h-full bg-current"></div>
          </div>
          <div className="h-0.5 bg-gray-600 mt-1">
            <div className="w-full h-full bg-current"></div>
          </div>
        </div>
      </button>
      
      {/* Main Content */}
      <div className={`flex-1 min-h-0 ${isHeaderCollapsed ? 'p-4 pt-2' : 'px-4 pb-4'}`}>
        <StudentBoardsGrid
          studentCount={studentCount}
          currentLayout={currentLayout}
          currentStudentBoards={currentStudentBoards}
          currentPage={currentPage}
          totalPages={totalPages}
          gridOrientation={gridOrientation}
          onMaximize={onMaximize}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
          isHeaderCollapsed={isHeaderCollapsed}
        />
      </div>
    </div>,
    container
  );
};

export default WindowContentRenderer;
