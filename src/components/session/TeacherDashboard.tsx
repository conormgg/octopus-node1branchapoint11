import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import CreateSessionForm from './CreateSessionForm';
import TeacherView from '../TeacherView';
import { LogOut, Plus, History, Settings, Copy, Check, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
}

const TeacherDashboard: React.FC = () => {
  const { user, signOut, isDemoMode } = useAuth();
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchRecentSessions();
    }
  }, [user]);

  const fetchRecentSessions = async () => {
    // Skip fetching for demo mode since we don't have real data
    if (isDemoMode) {
      setRecentSessions([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentSessions(data || []);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleSessionCreated = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      
      setActiveSession(data);
      setShowCreateForm(false);
      fetchRecentSessions();
    } catch (error: any) {
      toast({
        title: "Error Loading Session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'ended_by_teacher' })
        .eq('id', activeSession.id);

      if (error) throw error;

      toast({
        title: "Session Ended",
        description: "The session has been ended successfully.",
      });

      setActiveSession(null);
      fetchRecentSessions();
    } catch (error: any) {
      toast({
        title: "Error Ending Session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resumeSession = (session: Session) => {
    if (session.status === 'active') {
      setActiveSession(session);
    }
  };

  const copySessionUrl = async () => {
    if (!activeSession) return;
    
    const sessionUrl = `${window.location.origin}/session/${activeSession.unique_url_slug}`;
    
    try {
      await navigator.clipboard.writeText(sessionUrl);
      setCopied(true);
      toast({
        title: "URL Copied!",
        description: "Session URL has been copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy URL to clipboard.",
        variant: "destructive",
      });
    }
  };

  const openSessionInNewWindow = () => {
    if (!activeSession) return;
    
    const sessionUrl = `${window.location.origin}/session/${activeSession.unique_url_slug}`;
    window.open(sessionUrl, '_blank');
  };

  if (activeSession) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Active Session: {activeSession.title}</h1>
            <p className="text-sm text-gray-600">Session ID: {activeSession.id}</p>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Session Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Student Access URL</DropdownMenuLabel>
                <div className="px-2 py-1.5">
                  <p className="text-sm text-gray-600 mb-2">
                    Share this URL with your students to join the session
                  </p>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <code className="text-sm flex-1 break-all">
                      {`${window.location.origin}/session/${activeSession.unique_url_slug}`}
                    </code>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={copySessionUrl}>
                  {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {copied ? 'Copied!' : 'Copy URL'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openSessionInNewWindow}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Window
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleEndSession} className="text-red-600">
                  End Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
        <TeacherView />
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              ← Back to Dashboard
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
          <CreateSessionForm onSessionCreated={handleSessionCreated} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {isDemoMode ? 'Demo Teacher' : user?.user_metadata?.full_name || user?.email}
              {isDemoMode && <span className="ml-2 text-blue-600 font-medium">(Demo Mode)</span>}
            </p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Start New Session
              </CardTitle>
              <CardDescription>
                Create a new collaborative whiteboard session for your class
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowCreateForm(true)} className="w-full">
                Create New Session
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Sessions
              </CardTitle>
              <CardDescription>
                Your recent whiteboard sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{session.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          session.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.status}
                        </span>
                        {session.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resumeSession(session)}
                          >
                            Resume
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent sessions</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
