
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, Loader2 } from 'lucide-react';

interface Session {
  id: string;
  title: string;
  status: string;
}

interface Participant {
  id: number;
  student_name: string;
  assigned_board_suffix: string;
  joined_at: string | null;
}

const StudentJoinPage: React.FC = () => {
  const { sessionSlug } = useParams<{ sessionSlug: string }>();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sessionLoading, setSessionLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (sessionSlug) {
      fetchSessionData();
    }
  }, [sessionSlug]);

  const fetchSessionData = async () => {
    try {
      // Fetch session details
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('id, title, status')
        .eq('unique_url_slug', sessionSlug)
        .single();

      if (sessionError) throw sessionError;

      if (sessionData.status !== 'active') {
        toast({
          title: "Session Not Available",
          description: "This session is no longer active.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setSession(sessionData);

      // Fetch participants with join status
      const { data: participantsData, error: participantsError } = await supabase
        .from('session_participants')
        .select('id, student_name, assigned_board_suffix, joined_at')
        .eq('session_id', sessionData.id);

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);
    } catch (error: any) {
      toast({
        title: "Error Loading Session",
        description: error.message,
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setSessionLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !studentName.trim()) return;

    setIsLoading(true);

    try {
      // Check if student name matches any participant
      const matchingParticipant = participants.find(
        p => p.student_name.toLowerCase() === studentName.trim().toLowerCase()
      );

      if (!matchingParticipant) {
        toast({
          title: "Name Not Found",
          description: "Your name is not in the class list. Please check with your teacher.",
          variant: "destructive",
        });
        return;
      }

      // Update joined_at timestamp to mark student as joined
      const { error: updateError } = await supabase
        .from('session_participants')
        .update({ 
          joined_at: new Date().toISOString() 
        })
        .eq('id', matchingParticipant.id);

      if (updateError) throw updateError;

      // Navigate to student view
      navigate(`/session/${sessionSlug}/student`, {
        state: {
          sessionId: session.id,
          studentName: studentName.trim(),
          boardSuffix: matchingParticipant.assigned_board_suffix,
        }
      });
    } catch (error: any) {
      toast({
        title: "Error Joining Session",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Session Not Found</CardTitle>
            <CardDescription>
              The session you're looking for doesn't exist or is no longer active.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Users className="h-6 w-6" />
            Join Session
          </CardTitle>
          <CardDescription className="text-center">
            {session.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="studentName" className="text-sm font-medium">
                Your Name
              </label>
              <Input
                id="studentName"
                type="text"
                placeholder="Enter your name as it appears in the class list"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                Enter your name exactly as your teacher added it to the class
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join Whiteboard
            </Button>
          </form>
          
          {participants.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Students in this session:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                {participants.map((participant, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span>• {participant.student_name}</span>
                    {participant.joined_at && (
                      <span className="text-green-600 text-xs">✓ Joined</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentJoinPage;
