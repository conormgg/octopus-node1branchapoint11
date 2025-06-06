
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import WhiteboardPlaceholder from '../WhiteboardPlaceholder';
import TeacherHeader from '../TeacherHeader';
import TeacherMainBoard from '../TeacherMainBoard';
import StudentBoardsGrid from '../StudentBoardsGrid';
import StudentBoardsWindow from '../StudentBoardsWindow';
import { generateStudentBoards, getStudentBoardsForPage } from '@/utils/layoutCalculator';
import { GridOrientation } from '../TeacherView';
import { useUnifiedSession } from '@/contexts/UnifiedSessionContext';

interface TeacherSessionViewProps {
  maximizedBoard: string | null;
  currentPage: number;
  selectedLayoutId: string;
  isSplitViewActive: boolean;
  gridOrientation: GridOrientation;
  isControlsCollapsed: boolean;
  availableLayouts: any[];
  currentLayout: any;
  totalPages: number;
  onMaximize: (boardId: string) => void;
  onMinimize: () => void;
  onLayoutChange: (layoutId: string) => void;
  onOrientationChange: (orientation: GridOrientation) => void;
  onToggleSplitView: () => void;
  onCloseSplitView: () => void;
  onToggleControlsCollapse: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onIncreaseStudentCount: () => void;
  onDecreaseStudentCount: () => void;
}

const TeacherSessionView: React.FC<TeacherSessionViewProps> = ({
  maximizedBoard,
  currentPage,
  selectedLayoutId,
  isSplitViewActive,
  gridOrientation,
  isControlsCollapsed,
  availableLayouts,
  currentLayout,
  totalPages,
  onMaximize,
  onMinimize,
  onLayoutChange,
  onOrientationChange,
  onToggleSplitView,
  onCloseSplitView,
  onToggleControlsCollapse,
  onPreviousPage,
  onNextPage,
  onIncreaseStudentCount,
  onDecreaseStudentCount,
}) => {
  const { 
    activeSession, 
    sessionStudents, 
    handleEndSession, 
    signOut,
    handleStudentCountChange 
  } = useUnifiedSession();

  const studentCount = sessionStudents.length;
  
  // Generate student boards and get current page boards
  const allStudentBoards = generateStudentBoards(studentCount);
  const currentStudentBoards = getStudentBoardsForPage(
    allStudentBoards, 
    currentPage, 
    currentLayout?.studentsPerPage || 4
  );

  // Use unified session's student count handler
  const handleIncreaseStudentCount = () => {
    handleStudentCountChange(studentCount + 1);
    onIncreaseStudentCount();
  };

  const handleDecreaseStudentCount = () => {
    handleStudentCountChange(Math.max(1, studentCount - 1));
    onDecreaseStudentCount();
  };

  if (maximizedBoard) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="h-[calc(100vh-2rem)]">
          <WhiteboardPlaceholder
            id={maximizedBoard}
            isMaximized={true}
            onMinimize={onMinimize}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hover zone for collapsed header */}
      {isControlsCollapsed && (
        <div 
          className="absolute top-0 left-0 right-0 h-4 z-50 bg-transparent"
        />
      )}

      <TeacherHeader
        studentCount={studentCount}
        currentLayout={currentLayout}
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        gridOrientation={gridOrientation}
        onIncreaseStudentCount={handleIncreaseStudentCount}
        onDecreaseStudentCount={handleDecreaseStudentCount}
        onLayoutChange={onLayoutChange}
        onOrientationChange={onOrientationChange}
        onToggleSplitView={onToggleSplitView}
        isSplitViewActive={isSplitViewActive}
        isCollapsed={isControlsCollapsed}
        onToggleCollapse={onToggleControlsCollapse}
        activeSession={activeSession}
        onEndSession={handleEndSession}
        onSignOut={signOut}
      />

      {/* Split View Window */}
      {isSplitViewActive && (
        <StudentBoardsWindow
          studentCount={studentCount}
          currentLayout={currentLayout}
          availableLayouts={availableLayouts}
          selectedLayoutId={selectedLayoutId}
          currentStudentBoards={currentStudentBoards}
          currentPage={currentPage}
          totalPages={totalPages}
          gridOrientation={gridOrientation}
          onMaximize={onMaximize}
          onPreviousPage={onPreviousPage}
          onNextPage={onNextPage}
          onLayoutChange={onLayoutChange}
          onOrientationChange={onOrientationChange}
          onIncreaseStudentCount={handleIncreaseStudentCount}
          onDecreaseStudentCount={handleDecreaseStudentCount}
          onClose={onCloseSplitView}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 ${isControlsCollapsed ? 'h-screen' : 'h-[calc(100vh-5rem)]'} p-4`}>
        {isSplitViewActive ? (
          // Single panel view - only teacher's board when split view is active
          <div className="h-full">
            <TeacherMainBoard 
              onMaximize={onMaximize} 
              isHeaderCollapsed={isControlsCollapsed}
            />
          </div>
        ) : (
          // Normal split panel view
          <ResizablePanelGroup direction="horizontal" className="rounded-lg overflow-hidden">
            {/* Left Pane - Teacher's Main Board */}
            <ResizablePanel defaultSize={60} minSize={40}>
              <TeacherMainBoard 
                onMaximize={onMaximize} 
                isHeaderCollapsed={isControlsCollapsed}
              />
            </ResizablePanel>

            <ResizableHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors duration-150" />

            {/* Right Pane - Student Boards Grid */}
            <ResizablePanel defaultSize={40} minSize={30}>
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
                isHeaderCollapsed={isControlsCollapsed}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
};

export default TeacherSessionView;
