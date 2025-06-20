
import React from 'react';
import { createPortal } from 'react-dom';
import { useWindowContentState } from '@/hooks/window/useWindowContentState';
import WindowContentHeader from './window/WindowContentHeader';
import WindowContentBody from './window/WindowContentBody';
import { LayoutOption } from '@/utils/layoutCalculator';
import { GridOrientation } from './TeacherView';
import { StudentBoardInfo } from '@/utils/studentBoardGenerator';

interface WindowContentRendererProps {
  container: HTMLDivElement;
  studentCount: number;
  activeStudentCount?: number;
  currentLayout: LayoutOption | undefined;
  availableLayouts: LayoutOption[];
  selectedLayoutId: string;
  currentStudentBoards: string[];
  currentStudentBoardsInfo: (StudentBoardInfo | null)[];
  currentPage: number;
  totalPages: number;
  gridOrientation: GridOrientation;
  onMaximize: (boardId: string) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  onClose: () => void;
  sessionId?: string;
  senderId?: string;
}

const WindowContentRenderer: React.FC<WindowContentRendererProps> = ({
  container,
  studentCount,
  activeStudentCount = 0,
  currentLayout,
  availableLayouts,
  selectedLayoutId,
  currentStudentBoards,
  currentStudentBoardsInfo,
  currentPage,
  totalPages,
  gridOrientation,
  onMaximize,
  onPreviousPage,
  onNextPage,
  onLayoutChange,
  onOrientationChange,
  onClose,
  sessionId,
  senderId,
}) => {
  const {
    isHeaderCollapsed,
    maximizedBoard,
    toggleHeaderCollapse,
    handleMaximize,
    handleMinimize,
  } = useWindowContentState();

  console.log('Rendering portal content', { studentCount, currentLayout, currentStudentBoardsInfo });

  return createPortal(
    <div className="flex-1 bg-gray-100 flex flex-col min-h-0 relative group">
      {/* Collapsible Header */}
      <WindowContentHeader
        studentCount={studentCount}
        currentLayout={currentLayout}
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        currentPage={currentPage}
        totalPages={totalPages}
        gridOrientation={gridOrientation}
        isHeaderCollapsed={isHeaderCollapsed}
        onLayoutChange={onLayoutChange}
        onOrientationChange={onOrientationChange}
        onClose={onClose}
        onToggleCollapse={toggleHeaderCollapse}
      />

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
      <WindowContentBody
        studentCount={studentCount}
        activeStudentCount={activeStudentCount}
        currentLayout={currentLayout}
        currentStudentBoardsInfo={currentStudentBoardsInfo}
        currentPage={currentPage}
        totalPages={totalPages}
        gridOrientation={gridOrientation}
        maximizedBoard={maximizedBoard}
        isHeaderCollapsed={isHeaderCollapsed}
        onMaximize={(boardId) => handleMaximize(boardId, onMaximize)}
        onMinimize={handleMinimize}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
        sessionId={sessionId}
        senderId={senderId}
      />
    </div>,
    container
  );
};

export default WindowContentRenderer;
