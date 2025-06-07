
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import StudentView from '../StudentView';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useSessionExpiration } from '@/hooks/useSessionExpiration';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';
import { Button } from '@/components/ui/button';

interface LocationState {
  sessionId: string;
  studentName: string;
  boardSuffix: string;
}

const StudentSessionView: React.FC = () => {
  const { sessionSlug } = useParams<{ sessionSlug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { clearWhiteboardState } = useWhiteboardStateContext();

  const state = location.state as LocationState;
  
  // Session expiration handling
  const { isExpired } = state?.sessionId ? useSessionExpiration({
    sessionId: state.sessionId,
    onSessionExpired: () => {
      toast({
        title: "Session Expired",
        description: "This session has expired. You will be redirected to the home page.",
        variant: "destructive",
      });
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
  }) : { isExpired: false };

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
          // Clear whiteboard state from memory for all boards related to this session
          const { data: whiteboardData } = await supabase
            .from('whiteboard_data')
            .select('board_id')
            .eq('session_id', state.sessionId);
            
          if (whiteboardData) {
            // Get unique board IDs
            const boardIds = [...new Set(whiteboardData.map(item => item.board_id))];
            
            // Clear each board from memory
            boardIds.forEach(boardId => {
              clearWhiteboardState(boardId);
            });
          }
          
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
  }, [state, sessionSlug, navigate, toast, clearWhiteboardState]);

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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Expired</h2>
          <p className="text-gray-600 mb-6">This session has expired. You will be redirected to the home page shortly.</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            Return to Home
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

export default StudentSessionView;
