
import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import StudentView from '../StudentView';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
