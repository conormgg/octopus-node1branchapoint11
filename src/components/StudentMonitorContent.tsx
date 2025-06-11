
import React, { useMemo } from 'react';
import StudentBoardsGrid from '@/components/StudentBoardsGrid';
import StudentBoardsWindowHeader from '@/components/StudentBoardsWindowHeader';
import { useSessionStudents } from '@/hooks/useSessionStudents';
import { useStudentMonitorState } from '@/hooks/useStudentMonitorState';
import { GridOrientation } from '@/components/TeacherView';

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
  teacher_id: string;
}

interface StudentMonitorContentProps {
  session: Session;
  sessionId: string;
}

const StudentMonitorContent: React.FC<StudentMonitorContentProps> = ({
  session,
  sessionId,
}) => {
  // Use the real session data to get students - this will now sync with the main window
  const { sessionStudents, handleStudentCountChange, studentCount } = useSessionStudents(session);
  
  const {
    maximizedBoard,
    currentPage,
    selectedLayoutId,
    gridOrientation,
    isControlsCollapsed,
    availableLayouts,
    currentLayout,
    totalPages,
    handleMaximize,
    handleMinimize,
    handleLayoutChange,
    handleOrientationChange,
    handleToggleControlsCollapse,
    handlePreviousPage,
    handleNextPage,
  } = useStudentMonitorState(studentCount);

  const handleCloseSplitView = () => {
    window.close();
  };

  const increaseStudentCount = () => {
    handleStudentCountChange(studentCount + 1);
  };

  const decreaseStudentCount = () => {
    handleStudentCountChange(studentCount - 1);
  };

  // Generate current student boards based on pagination and actual session students
  const currentStudentBoards = useMemo(() => {
    if (!currentLayout || !sessionStudents.length) return [];
    
    const boardsPerPage = currentLayout.studentsPerPage;
    const startIndex = currentPage * boardsPerPage;
    const endIndex = Math.min(startIndex + boardsPerPage, sessionStudents.length);
    
    return sessionStudents.slice(startIndex, endIndex).map(student => 
      `student-board-${student.assigned_board_suffix}`
    );
  }, [currentLayout, currentPage, sessionStudents]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <StudentBoardsWindowHeader
        studentCount={studentCount}
        currentLayoutName={currentLayout?.name}
        currentPage={currentPage}
        totalPages={totalPages}
        availableLayouts={availableLayouts}
        selectedLayoutId={selectedLayoutId}
        gridOrientation={gridOrientation}
        onLayoutChange={handleLayoutChange}
        onOrientationChange={handleOrientationChange}
        onIncreaseStudentCount={increaseStudentCount}
        onDecreaseStudentCount={decreaseStudentCount}
        onClose={handleCloseSplitView}
        isCollapsed={isControlsCollapsed}
        onToggleCollapse={handleToggleControlsCollapse}
      />

      <div className="flex-1 overflow-hidden">
        <StudentBoardsGrid
          studentCount={studentCount}
          currentLayout={currentLayout}
          currentStudentBoards={currentStudentBoards}
          currentPage={currentPage}
          totalPages={totalPages}
          gridOrientation={gridOrientation}
          maximizedBoard={maximizedBoard}
          onMaximize={handleMaximize}
          onMinimize={handleMinimize}
          onPreviousPage={handlePreviousPage}
          onNextPage={handleNextPage}
          isHeaderCollapsed={isControlsCollapsed}
          sessionId={sessionId}
          senderId="teacher-monitor"
        />
      </div>
    </div>
  );
};

export default StudentMonitorContent;
