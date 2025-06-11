
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import StudentBoardsGrid from '@/components/StudentBoardsGrid';
import StudentBoardsWindowHeader from '@/components/StudentBoardsWindowHeader';
import { useSessionStudents } from '@/hooks/useSessionStudents';
import { GridOrientation } from '@/components/TeacherView';
import { supabase } from '@/integrations/supabase/client';
import { calculateLayoutOptions } from '@/utils/layoutCalculator';

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
  teacher_id: string;
}

const StudentMonitorPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Independent state management for this window
  const [maximizedBoard, setMaximizedBoard] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('2x2');
  const [gridOrientation, setGridOrientation] = useState<GridOrientation>('columns-first');
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  // Fetch the actual session data
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();
        
        if (error) {
          console.error('Error fetching session:', error);
          return;
        }
        
        setSession(data);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // Use the real session data to get students - this will now sync with the main window
  const { sessionStudents, handleStudentCountChange, studentCount } = useSessionStudents(session);
  
  // Calculate layout options and current layout
  const availableLayouts = calculateLayoutOptions(studentCount);
  const currentLayout = availableLayouts.find(layout => layout.id === selectedLayoutId) || availableLayouts[0];
  const totalPages = currentLayout?.totalPages || 1;

  // Reset layout when student count changes
  useEffect(() => {
    if (availableLayouts.length > 0 && studentCount > 0) {
      setSelectedLayoutId(availableLayouts[0].id);
    }
    setCurrentPage(0);
  }, [studentCount]);

  // Get initial values from URL params only once
  useEffect(() => {
    const layoutParam = searchParams.get('layout');
    const pageParam = searchParams.get('page');
    const orientationParam = searchParams.get('orientation');
    const controlsParam = searchParams.get('hideControls');
    
    if (layoutParam) {
      const layout = availableLayouts.find(l => l.id === layoutParam);
      if (layout) {
        setSelectedLayoutId(layoutParam);
      }
    }
    
    if (pageParam) {
      const page = parseInt(pageParam) - 1; // Convert to 0-based index
      if (page >= 0 && page < totalPages) {
        setCurrentPage(page);
      }
    }
    
    if (orientationParam === 'rows-first') {
      setGridOrientation('rows-first');
    }
    
    if (controlsParam === 'true') {
      setIsControlsCollapsed(true);
    }
  }, []); // Only run once on mount

  // Update URL params when state changes (but don't cause re-renders)
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('layout', selectedLayoutId);
    params.set('page', (currentPage + 1).toString());
    params.set('orientation', gridOrientation);
    if (isControlsCollapsed) params.set('hideControls', 'true');
    
    setSearchParams(params, { replace: true });
  }, [selectedLayoutId, currentPage, gridOrientation, isControlsCollapsed, setSearchParams]);

  // Set document title
  useEffect(() => {
    document.title = `Student Boards Monitor - ${session?.title || sessionId || 'Session'}`;
    return () => {
      document.title = 'Octopus Whiteboard';
    };
  }, [session, sessionId]);

  const handleMaximize = (boardId: string) => {
    setMaximizedBoard(boardId);
  };

  const handleMinimize = () => {
    setMaximizedBoard(null);
  };

  const handleLayoutChange = (layoutId: string) => {
    setSelectedLayoutId(layoutId);
    setCurrentPage(0); // Reset to first page when layout changes
  };

  const handleOrientationChange = (orientation: GridOrientation) => {
    setGridOrientation(orientation);
  };

  const handleToggleControlsCollapse = () => {
    setIsControlsCollapsed(!isControlsCollapsed);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

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
  const currentStudentBoards = React.useMemo(() => {
    if (!currentLayout || !sessionStudents.length) return [];
    
    const boardsPerPage = currentLayout.studentsPerPage;
    const startIndex = currentPage * boardsPerPage;
    const endIndex = Math.min(startIndex + boardsPerPage, sessionStudents.length);
    
    return sessionStudents.slice(startIndex, endIndex).map(student => 
      `student-board-${student.assigned_board_suffix}`
    );
  }, [currentLayout, currentPage, sessionStudents]);

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Session</h1>
          <p className="text-gray-600">No session ID provided in the URL.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Session Not Found</h1>
          <p className="text-gray-600">The requested session could not be found.</p>
        </div>
      </div>
    );
  }

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

export default StudentMonitorPage;
