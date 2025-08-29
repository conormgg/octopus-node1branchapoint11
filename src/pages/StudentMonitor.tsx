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
import { SessionParticipant, SyncDirection } from '@/types/student';
import { useToast } from '@/hooks/use-toast';
import { updateParticipantSyncDirection } from '@/utils/syncDirection';

const StudentMonitor: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  
  // Sync direction management state
  const [participantSyncDirections, setParticipantSyncDirections] = useState<Record<number, SyncDirection>>({});
  const [updatingParticipants, setUpdatingParticipants] = useState<Set<number>>(new Set());

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

  // Send ready message to parent window
  useEffect(() => {
    if (window.opener && sessionId) {
      console.log('[StudentMonitor] Sending ready message to parent window');
      window.opener.postMessage({
        source: 'student-monitor',
        type: 'ready',
        sessionId
      }, window.location.origin);
    }
  }, [sessionId]);

  // Handle window close events with debouncing
  useEffect(() => {
    let closeTimeout: NodeJS.Timeout | null = null;
    
    const handleBeforeUnload = () => {
      if (window.opener && sessionId) {
        console.log('[StudentMonitor] Scheduling closing message to parent window');
        
        // Debounce the closing signal to prevent false positives during HMR/reload
        if (closeTimeout) {
          clearTimeout(closeTimeout);
        }
        
        closeTimeout = setTimeout(() => {
          console.log('[StudentMonitor] Sending closing message to parent window');
          window.opener.postMessage({
            source: 'student-monitor',
            type: 'closing',
            sessionId
          }, window.location.origin);
        }, 100);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [sessionId]);

  const {
    sessionStudents,
    studentsWithStatus,
    activeStudentCount,
    totalStudentCount,
  } = useSessionStudents(session);

  // Initialize sync directions when students change
  useEffect(() => {
    const initialDirections: Record<number, SyncDirection> = {};
    sessionStudents.forEach(student => {
      initialDirections[student.id] = student.sync_direction || 'student_active';
    });
    setParticipantSyncDirections(initialDirections);
  }, [sessionStudents]);

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
    if (window.opener && sessionId) {
      console.log('[StudentMonitor] Sending closing message before window.close()');
      window.opener.postMessage({
        source: 'student-monitor',
        type: 'closing',
        sessionId
      }, window.location.origin);
    }
    window.close();
  }, [sessionId]);

  // Sync direction management functions
  const handleToggleSyncDirection = useCallback(async (participantId: number): Promise<boolean> => {
    const currentDirection = participantSyncDirections[participantId] || 'student_active';
    const newDirection: SyncDirection = currentDirection === 'student_active' ? 'teacher_active' : 'student_active';
    
    // Optimistic update
    setParticipantSyncDirections(prev => ({
      ...prev,
      [participantId]: newDirection
    }));
    
    setUpdatingParticipants(prev => new Set(prev).add(participantId));
    
    try {
      const result = await updateParticipantSyncDirection(participantId, newDirection);
      
      if (!result.success) {
        // Revert optimistic update on failure
        setParticipantSyncDirections(prev => ({
          ...prev,
          [participantId]: currentDirection
        }));
        
        toast({
          title: "Sync Direction Update Failed",
          description: result.error || "Failed to update sync direction. Please try again.",
          variant: "destructive",
        });
        
        return false;
      }
      
      return true;
    } catch (error) {
      // Revert optimistic update on error
      setParticipantSyncDirections(prev => ({
        ...prev,
        [participantId]: currentDirection
      }));
      
      toast({
        title: "Sync Direction Update Failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
      
      return false;
    } finally {
      setUpdatingParticipants(prev => {
        const newSet = new Set(prev);
        newSet.delete(participantId);
        return newSet;
      });
    }
  }, [participantSyncDirections, toast]);

  const getSyncDirection = useCallback((participantId: number): SyncDirection => {
    return participantSyncDirections[participantId] || 'student_active';
  }, [participantSyncDirections]);

  const isParticipantUpdating = useCallback((participantId: number): boolean => {
    return updatingParticipants.has(participantId);
  }, [updatingParticipants]);

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
          // Sync direction props
          onToggleSyncDirection={handleToggleSyncDirection}
          getSyncDirection={getSyncDirection}
          isParticipantUpdating={isParticipantUpdating}
        />
      </div>
    </div>
  );
};

export default StudentMonitor;