import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import StudentView from '../StudentView';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useSessionExpirationContext } from '@/contexts/sessionExpiration';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';
import { useStudentPresence } from '@/hooks/useStudentPresence';
import { Button } from '@/components/ui/button';

interface LocationState {
  sessionId: string;
  studentName: string;
  boardSuffix: string;
}

const StudentSessionContent: React.FC<{ state: LocationState; sessionSlug?: string }> = ({ state, sessionSlug }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clearWhiteboardState } = useWhiteboardStateContext();
  const { isExpired, sessionEndReason, isRedirecting } = useSessionExpirationContext();
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [participantIdError, setParticipantIdError] = useState<string | null>(null);

  // Get participant ID and set joined_at timestamp
  useEffect(() => {
    const fetchAndSetupParticipant = async () => {
      console.log(`[StudentSession:${state.studentName}] Starting participant setup for session ${state.sessionId}`);
      
      try {
        // First, fetch the participant record
        const { data: participant, error: fetchError } = await supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', state.sessionId)
          .eq('student_name', state.studentName)
          .single();

        if (fetchError) {
          console.error(`[StudentSession:${state.studentName}] Error fetching participant:`, fetchError);
          setParticipantIdError(`Failed to find participant: ${fetchError.message}`);
          return;
        }
        
        console.log(`[StudentSession:${state.studentName}] Found participant:`, {
          participantId: participant.id,
          currentJoinedAt: participant.joined_at,
          lastPingAt: participant.last_ping_at
        });

        // Set the participant ID
        setParticipantId(participant.id);

        // If joined_at is null, set it to mark the student as active
        if (!participant.joined_at) {
          console.log(`[StudentSession:${state.studentName}] Setting joined_at for participant ${participant.id}`);
          
          const joinTime = new Date().toISOString();
          const { data: updateData, error: updateError } = await supabase
            .from('session_participants')
            .update({ 
              joined_at: joinTime,
              last_ping_at: joinTime // Set initial ping time too
            })
            .eq('id', participant.id)
            .select();

          if (updateError) {
            console.error(`[StudentSession:${state.studentName}] Error setting joined_at:`, updateError);
            setParticipantIdError(`Failed to join session: ${updateError.message}`);
            return;
          }

          console.log(`[StudentSession:${state.studentName}] Successfully joined session:`, {
            participantId: participant.id,
            joinTime,
            updateData
          });
        } else {
          console.log(`[StudentSession:${state.studentName}] Student already joined at ${participant.joined_at}`);
        }

      } catch (error) {
        console.error(`[StudentSession:${state.studentName}] Exception during participant setup:`, error);
        setParticipantIdError(`Setup failed: ${error}`);
      }
    };

    fetchAndSetupParticipant();
  }, [state.sessionId, state.studentName]);

  // Set up student presence tracking ONLY after participantId is available
  const presenceData = useStudentPresence({
    sessionId: state.sessionId,
    studentName: state.studentName,
    participantId: participantId || undefined,
  });

  // Log presence data for debugging
  useEffect(() => {
    console.log(`[StudentSession:${state.studentName}] Presence data:`, {
      participantId,
      isActive: presenceData.isActive,
      lastHeartbeat: presenceData.lastHeartbeat,
      hasError: !!participantIdError
    });
  }, [participantId, presenceData.isActive, presenceData.lastHeartbeat, participantIdError, state.studentName]);

  // ... keep existing code for session expiration handling and UI rendering
  useEffect(() => {
    if (isExpired && isRedirecting) {
      // Clear whiteboard state from memory for all boards related to this session
      const clearSessionData = async () => {
        const { data: whiteboardData } = await supabase
          .from('whiteboard_data')
          .select('board_id')
          .eq('session_id', state.sessionId);
          
        if (whiteboardData) {
          const boardIds = [...new Set(whiteboardData.map(item => item.board_id))];
          boardIds.forEach(boardId => {
            clearWhiteboardState(boardId);
          });
        }
      };
      
      clearSessionData();
      
      // Redirect to home page after a short delay
      // Use a longer delay to ensure the toast is visible and reduce flickering
      const redirectTimer = setTimeout(() => {
        navigate('/');
      }, 3500);
      
      // Clean up the timer if the component unmounts
      return () => clearTimeout(redirectTimer);
    }
  }, [isExpired, isRedirecting, navigate, clearWhiteboardState, state.sessionId]);
  
  // If session is expired, show a message
  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {sessionEndReason === 'ended_by_teacher' ? 'Session Ended' : 'Session Expired'}
          </h2>
          <p className="text-gray-600 mb-6">
            {sessionEndReason === 'ended_by_teacher' 
              ? 'This session has been ended by the teacher. You will be redirected to the home page shortly.' 
              : 'This session has expired. You will be redirected to the home page shortly.'}
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Show error if participant setup failed
  if (participantIdError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{participantIdError}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Welcome, {state.studentName}</h1>
            <p className="text-sm text-gray-600">Board: Student {state.boardSuffix}</p>
            {participantId && (
              <p className="text-xs text-green-600">
                Participant ID: {participantId} | Active: {presenceData.isActive ? 'Yes' : 'No'}
                {presenceData.lastHeartbeat && (
                  <span className="ml-2">Last: {presenceData.lastHeartbeat.toLocaleTimeString()}</span>
                )}
              </p>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Session: {sessionSlug}
          </div>
        </div>
      </div>
      <StudentView sessionId={state.sessionId} />
    </div>
  );
};

const StudentSessionView: React.FC = () => {
  const { sessionSlug } = useParams<{ sessionSlug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const state = location.state as LocationState;

  useEffect(() => {
    if (!state || !state.sessionId || !state.studentName) {
      toast({
        title: "Invalid Session Access",
        description: "Please join the session through the proper link.",
        variant: "destructive",
      });
      navigate(`/session/${sessionSlug}`);
      return;
    }

    // Verify session is still active
    const verifySession = async () => {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('status')
          .eq('id', state.sessionId)
          .single();

        if (error) throw error;

        if (data.status !== 'active') {
          toast({
            title: "Session Ended",
            description: "This session is no longer active.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setIsLoading(false);
      } catch (error: any) {
        toast({
          title: "Error Loading Session",
          description: error.message,
          variant: "destructive",
        });
        navigate('/');
      }
    };

    verifySession();
  }, [state, sessionSlug, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  return <StudentSessionContent state={state} sessionSlug={sessionSlug} />;
};

export default StudentSessionView;
