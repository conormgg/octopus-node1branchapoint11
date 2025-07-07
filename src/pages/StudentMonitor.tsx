import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Monitor, ExternalLink, LogOut, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useSessionStudents } from '@/hooks/useSessionStudents';
import { useTeacherViewState } from '@/hooks/useTeacherViewState';
import StudentBoardsGrid from '@/components/StudentBoardsGrid';
import { generateStudentBoardsFromParticipants, generateGridSlotsWithStatus } from '@/utils/studentBoardGenerator';
import { Session } from '@/types/session';
import { SessionParticipant } from '@/types/student';
import { useToast } from '@/hooks/use-toast';

const StudentMonitor: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;

      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (error) throw error;

        if (data.status !== 'active') {
          setError('This session is no longer active.');
          return;
        }

        setSession(data);
      } catch (err: any) {
        console.error('Error fetching session:', err);
        setError('Failed to load session data.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // Set up realtime session status monitoring
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session-monitor-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          const updatedSession = payload.new as Session;
          setSession(updatedSession);
          
          if (updatedSession.status !== 'active') {
            toast({
              title: "Session Ended",
              description: "This session has been ended by the teacher.",
              variant: "destructive",
            });
            setError('This session has ended.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, toast]);

  const {
    sessionStudents,
    studentsWithStatus,
    activeStudentCount,
    totalStudentCount,
  } = useSessionStudents(session);

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
  } = useTeacherViewState(totalStudentCount);

  // Generate student boards for current page
  const allStudentBoards = React.useMemo(() => 
    generateStudentBoardsFromParticipants(sessionStudents),
    [sessionStudents]
  );
  
  const currentStudentBoardsInfo = React.useMemo(() => 
    generateGridSlotsWithStatus(
      allStudentBoards, 
      currentPage, 
      currentLayout?.studentsPerPage || 4
    ),
    [allStudentBoards, currentPage, currentLayout?.studentsPerPage]
  );

  const handleCloseMonitor = useCallback(() => {
    window.close();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive mb-4">{error || 'Session not found'}</p>
          <Button onClick={handleCloseMonitor}>
            Close Monitor
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className={`bg-card border-b border-border transition-all duration-300 ${
        isControlsCollapsed ? 'h-2 overflow-hidden hover:h-20' : 'h-20'
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">
                  Student Monitor
                </h1>
              </div>
              <div className="text-sm text-muted-foreground">
                {session.title} • {activeStudentCount}/{totalStudentCount} students
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Layout Controls */}
              {availableLayouts.length > 1 && (
                <select
                  value={selectedLayoutId}
                  onChange={(e) => handleLayoutChange(e.target.value)}
                  className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
                >
                  {availableLayouts.map((layout) => (
                    <option key={layout.id} value={layout.id}>
                      {layout.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Grid Orientation Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOrientationChange(
                  gridOrientation === 'columns-first' ? 'rows-first' : 'columns-first'
                )}
              >
                {gridOrientation === 'columns-first' ? 'Columns First' : 'Rows First'}
              </Button>

              {/* Header Collapse Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleControlsCollapse}
                title={isControlsCollapsed ? 'Show Header' : 'Hide Header'}
              >
                {isControlsCollapsed ? 'Show' : 'Hide'}
              </Button>

              {/* Close Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseMonitor}
                className="flex items-center space-x-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Close Monitor</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${isControlsCollapsed ? 'h-screen' : 'h-[calc(100vh-5rem)]'}`}>
        <StudentBoardsGrid
          studentCount={totalStudentCount}
          activeStudentCount={activeStudentCount}
          currentLayout={currentLayout}
          currentStudentBoardsInfo={currentStudentBoardsInfo}
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
          isTeacher={true}
        />
      </div>
    </div>
  );
};

export default StudentMonitor;