
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import TeacherMainBoard from '../TeacherMainBoard';
import StudentBoardsGrid from '../StudentBoardsGrid';
import { GridOrientation } from '../TeacherView';

interface TeacherSessionResizablePanelsProps {
  activeSession: {
    id: string;
    title: string;
    unique_url_slug: string;
    status: string;
    created_at: string;
    teacher_id: string;
  };
  studentCount: number;
  currentLayout: any;
  currentStudentBoards: any[];
  currentPage: number;
  totalPages: number;
  gridOrientation: GridOrientation;
  maximizedBoard: string | null;
  isControlsCollapsed: boolean;
  onMaximize: (boardId: string) => void;
  onMinimize: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

const TeacherSessionResizablePanels: React.FC<TeacherSessionResizablePanelsProps> = ({
  activeSession,
  studentCount,
  currentLayout,
  currentStudentBoards,
  currentPage,
  totalPages,
  gridOrientation,
  maximizedBoard,
  isControlsCollapsed,
  onMaximize,
  onMinimize,
  onPreviousPage,
  onNextPage,
}) => {
  return (
    <ResizablePanelGroup direction="horizontal" className="rounded-lg overflow-hidden">
      {/* Left Pane - Teacher's Main Board */}
      <ResizablePanel defaultSize={60} minSize={40}>
        <div className="h-full relative">
          <TeacherMainBoard 
            onMaximize={onMaximize}
            onMinimize={onMinimize}
            maximizedBoard={maximizedBoard}
            isHeaderCollapsed={isControlsCollapsed}
            sessionId={activeSession.id}
            senderId={activeSession.teacher_id}
          />
        </div>
      </ResizablePanel>

      <ResizableHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors duration-150" />

      {/* Right Pane - Student Boards Grid */}
      <ResizablePanel defaultSize={40} minSize={30}>
        <div className="h-full relative">
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
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default TeacherSessionResizablePanels;
