import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import WhiteboardPlaceholder from '../WhiteboardPlaceholder';
import TeacherHeader from '../TeacherHeader';
import TeacherMainBoard from '../TeacherMainBoard';
import StudentBoardsGrid from '../StudentBoardsGrid';
import StudentBoardsWindow from '../StudentBoardsWindow';
import { generateStudentBoards, getStudentBoardsForPage } from '@/utils/layoutCalculator';
import { GridOrientation } from '../TeacherView';

interface SessionStudent {
  id: number;
  student_name: string;
  student_email?: string;
  assigned_board_suffix: string;
}

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
  teacher_id: string;
}

interface TeacherSessionViewProps {
  activeSession: Session;
  sessionStudents: SessionStudent[];
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
  onEndSession: () => void;
  onSignOut: () => void;
}

const TeacherSessionView: React.FC<TeacherSessionViewProps> = ({
  activeSession,
  sessionStudents,
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
  onEndSession,
  onSignOut,
}) => {
  const studentCount = sessionStudents.length;
  
  // Generate student boards and get current page boards
  const allStudentBoards = generateStudentBoards(studentCount);
  const currentStudentBoards = getStudentBoardsForPage(
    allStudentBoards, 
    currentPage, 
    currentLayout?.studentsPerPage || 4
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hover zone for collapsed header */}
      {isControlsCollapsed && (
        <div 
          className="absolute top-0 left-0 right-0 h-4 z-50 bg-transparent"
        />
      )}

      {/* Normal Layout - Always Rendered */}
      <div>
        <TeacherHeader
          studentCount={studentCount}
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
            onIncreaseStudentCount={onIncreaseStudentCount}
            onDecreaseStudentCount={onDecreaseStudentCount}
            onClose={onCloseSplitView}
          />
        )}

        {/* Main Content */}
        <div className={`flex-1 ${isControlsCollapsed ? 'h-screen' : 'h-[calc(100vh-5rem)]'} p-4`}>
          {isSplitViewActive ? (
            // Single panel view - only teacher's board when split view is active
            <div className="h-full relative">
              <div 
                className={`h-full ${
                  maximizedBoard === "teacher-main" 
                    ? "fixed inset-4 z-50 bg-gray-100" 
                    : ""
                }`}
              >
                <TeacherMainBoard 
                  onMaximize={onMaximize}
                  onMinimize={onMinimize}
                  maximizedBoard={maximizedBoard}
                  isHeaderCollapsed={isControlsCollapsed}
                  sessionId={activeSession.id}
                  senderId={activeSession.teacher_id}
                />
              </div>
            </div>
          ) : (
            // Normal split panel view
            <ResizablePanelGroup direction="horizontal" className="rounded-lg overflow-hidden">
              {/* Left Pane - Teacher's Main Board */}
              <ResizablePanel defaultSize={60} minSize={40}>
                <div className="h-full relative">
                  <div 
                    className={`h-full ${
                      maximizedBoard === "teacher-main" 
                        ? "fixed inset-4 z-50 bg-gray-100" 
                        : ""
                    }`}
                  >
                    <TeacherMainBoard 
                      onMaximize={onMaximize}
                      onMinimize={onMinimize}
                      maximizedBoard={maximizedBoard}
                      isHeaderCollapsed={isControlsCollapsed}
                      sessionId={activeSession.id}
                      senderId={activeSession.teacher_id}
                    />
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors duration-150" />

              {/* Right Pane - Student Boards Grid */}
              <ResizablePanel defaultSize={40} minSize={30}>
                <div className="h-full relative">
                  <div 
                    className={`h-full ${
                      maximizedBoard && maximizedBoard.startsWith("student-board-") 
                        ? "fixed inset-4 z-50 bg-gray-100" 
                        : ""
                    }`}
                  >
                    <StudentBoardsGrid
                      studentCount={studentCount}
                      currentLayout={currentLayout}
                      currentStudentBoards={currentStudentBoards}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      gridOrientation={gridOrientation}
                      maximizedBoard={maximizedBoard}
                      onMaximize={onMaximize}
                      onMinimize={onMinimize}
                      onPreviousPage={onPreviousPage}
                      onNextPage={onNextPage}
                      isHeaderCollapsed={isControlsCollapsed}
                      sessionId={activeSession.id}
                      senderId={activeSession.teacher_id}
                    />
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherSessionView;
