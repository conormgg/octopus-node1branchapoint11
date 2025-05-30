
import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import WhiteboardPlaceholder from './WhiteboardPlaceholder';
import TeacherHeader from './TeacherHeader';
import TeacherMainBoard from './TeacherMainBoard';
import StudentBoardsGrid from './StudentBoardsGrid';
import StudentBoardsWindow from './StudentBoardsWindow';
import { calculateLayoutOptions, generateStudentBoards, getStudentBoardsForPage } from '@/utils/layoutCalculator';
import { supabase } from '@/integrations/supabase/client';

export type GridOrientation = 'columns-first' | 'rows-first';

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
}

interface TeacherViewProps {
  activeSession?: Session | null;
  onEndSession?: () => void;
  onSignOut?: () => void;
}

const TeacherView: React.FC<TeacherViewProps> = ({
  activeSession,
  onEndSession,
  onSignOut,
}) => {
  const [maximizedBoard, setMaximizedBoard] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [sessionStudents, setSessionStudents] = useState<SessionStudent[]>([]);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('2x2');
  const [isSplitViewActive, setIsSplitViewActive] = useState(false);
  const [gridOrientation, setGridOrientation] = useState<GridOrientation>('columns-first');
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  // Get actual student count from session data
  const studentCount = sessionStudents.length;

  useEffect(() => {
    if (activeSession) {
      fetchSessionStudents();
    }
  }, [activeSession]);

  useEffect(() => {
    // Reset layout to first available option when student count changes
    const availableLayouts = calculateLayoutOptions(studentCount);
    if (availableLayouts.length > 0 && studentCount > 0) {
      setSelectedLayoutId(availableLayouts[0].id);
    }
    setCurrentPage(0);
  }, [studentCount]);

  const fetchSessionStudents = async () => {
    if (!activeSession) return;

    try {
      const { data, error } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', activeSession.id)
        .order('assigned_board_suffix');

      if (error) throw error;
      setSessionStudents(data || []);
    } catch (error) {
      console.error('Error fetching session students:', error);
      setSessionStudents([]);
    }
  };

  const handleMaximize = (boardId: string) => {
    setMaximizedBoard(boardId);
  };

  const handleMinimize = () => {
    setMaximizedBoard(null);
  };

  const handleStudentCountChange = (newCount: number) => {
    // For now, this creates a simulation of students for UI testing
    // In real implementation, this would add/remove students from the session
    const clampedCount = Math.max(1, Math.min(8, newCount));
    
    // Create mock student data for UI testing
    const mockStudents: SessionStudent[] = Array.from({ length: clampedCount }, (_, i) => ({
      id: i + 1,
      student_name: `Student ${String.fromCharCode(65 + i)}`,
      assigned_board_suffix: String.fromCharCode(65 + i),
    }));
    
    setSessionStudents(mockStudents);
    setCurrentPage(0);
  };

  const handleLayoutChange = (layoutId: string) => {
    setSelectedLayoutId(layoutId);
    setCurrentPage(0); // Reset to first page when layout changes
  };

  const handleOrientationChange = (orientation: GridOrientation) => {
    setGridOrientation(orientation);
  };

  const increaseStudentCount = () => {
    handleStudentCountChange(studentCount + 1);
  };

  const decreaseStudentCount = () => {
    handleStudentCountChange(studentCount - 1);
  };

  const handleToggleSplitView = () => {
    setIsSplitViewActive(!isSplitViewActive);
  };

  const handleCloseSplitView = () => {
    setIsSplitViewActive(false);
  };

  const handleToggleControlsCollapse = () => {
    setIsControlsCollapsed(!isControlsCollapsed);
  };

  // Calculate layout options and current layout
  const availableLayouts = calculateLayoutOptions(studentCount);
  const currentLayout = availableLayouts.find(layout => layout.id === selectedLayoutId) || availableLayouts[0];
  
  // Generate student boards and get current page boards
  const allStudentBoards = generateStudentBoards(studentCount);
  const currentStudentBoards = getStudentBoardsForPage(
    allStudentBoards, 
    currentPage, 
    currentLayout?.studentsPerPage || 4
  );

  const totalPages = currentLayout?.totalPages || 1;

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  if (maximizedBoard) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="h-[calc(100vh-2rem)]">
          <WhiteboardPlaceholder
            id={maximizedBoard}
            isMaximized={true}
            onMinimize={handleMinimize}
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
        onIncreaseStudentCount={increaseStudentCount}
        onDecreaseStudentCount={decreaseStudentCount}
        onLayoutChange={handleLayoutChange}
        onOrientationChange={handleOrientationChange}
        onToggleSplitView={handleToggleSplitView}
        isSplitViewActive={isSplitViewActive}
        isCollapsed={isControlsCollapsed}
        onToggleCollapse={handleToggleControlsCollapse}
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
          onMaximize={handleMaximize}
          onPreviousPage={handlePreviousPage}
          onNextPage={handleNextPage}
          onLayoutChange={handleLayoutChange}
          onOrientationChange={handleOrientationChange}
          onIncreaseStudentCount={increaseStudentCount}
          onDecreaseStudentCount={decreaseStudentCount}
          onClose={handleCloseSplitView}
        />
      )}

      {/* Main Content */}
      <div className={`flex-1 ${isControlsCollapsed ? 'h-screen' : 'h-[calc(100vh-5rem)]'} p-4`}>
        {isSplitViewActive ? (
          // Single panel view - only teacher's board when split view is active
          <div className="h-full">
            <TeacherMainBoard 
              onMaximize={handleMaximize} 
              isHeaderCollapsed={isControlsCollapsed}
            />
          </div>
        ) : (
          // Normal split panel view
          <ResizablePanelGroup direction="horizontal" className="rounded-lg overflow-hidden">
            {/* Left Pane - Teacher's Main Board */}
            <ResizablePanel defaultSize={60} minSize={40}>
              <TeacherMainBoard 
                onMaximize={handleMaximize} 
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
                onMaximize={handleMaximize}
                onPreviousPage={handlePreviousPage}
                onNextPage={handleNextPage}
                isHeaderCollapsed={isControlsCollapsed}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
};

export default TeacherView;
