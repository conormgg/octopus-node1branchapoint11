import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useClassTemplates } from '@/hooks/useClassTemplates';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CreateSessionForm from './CreateSessionForm';
import ClassTemplatesPage from './ClassTemplatesPage';
import TeacherView from '../TeacherView';
import { LogOut, Plus, History, BookOpen } from 'lucide-react';

type DashboardView = 'main' | 'create-session' | 'templates';

const TeacherDashboard: React.FC = () => {
  const { user, signOut, isDemoMode } = useAuth();
  const { templates, refreshTemplates } = useClassTemplates();
  const [currentView, setCurrentView] = useState<DashboardView>('main');
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    activeSession,
    recentSessions,
    showUrlModal,
    handleSessionCreated,
    handleEndSession,
    resumeSession,
    handleCloseUrlModal,
  } = useSessionManagement(user, isDemoMode);

  // Refresh templates when returning from templates page
  useEffect(() => {
    if (currentView === 'create-session') {
      refreshTemplates();
      setRefreshKey(prev => prev + 1);
    }
  }, [currentView, refreshTemplates]);

  if (activeSession) {
    return (
      <TeacherView
        activeSession={activeSession}
        onEndSession={handleEndSession}
        onSignOut={signOut}
        showUrlModal={showUrlModal}
      />
    );
  }

  if (currentView === 'create-session') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => setCurrentView('main')}>
              ← Back to Dashboard
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
          <CreateSessionForm key={refreshKey} onSessionCreated={handleSessionCreated} />
        </div>
      </div>
    );
  }

  if (currentView === 'templates') {
    return (
      <ClassTemplatesPage onBack={() => setCurrentView('main')} />
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              <Button onClick={() => setCurrentView('create-session')} className="w-full">
                Create New Session
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Class Templates
              </CardTitle>
              <CardDescription>
                Manage your saved class templates ({templates.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setCurrentView('templates')} className="w-full" variant="outline">
                Manage Templates
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
