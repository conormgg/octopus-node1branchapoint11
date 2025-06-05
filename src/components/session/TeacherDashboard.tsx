
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CreateSessionForm from './CreateSessionForm';
import TeacherView from '../TeacherView';
import { LogOut, Plus, History } from 'lucide-react';

const TeacherDashboard: React.FC = () => {
  const { user, signOut, isDemoMode } = useAuth();

  const {
    activeSession,
    recentSessions,
    showUrlModal,
    handleSessionCreated,
    handleEndSession,
    resumeSession,
    handleCloseUrlModal,
  } = useSessionManagement(user, isDemoMode);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="/lovable-uploads/48e6b925-cc0f-4179-a7c9-2a393e857ac4.png" 
              alt="OctoPi Ink Logo" 
              className="h-16 w-auto"
              onError={(e) => {
                console.error('Logo failed to load');
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {isDemoMode ? 'Demo Teacher' : user?.user_metadata?.full_name || user?.email}
                {isDemoMode && <span className="ml-2 text-blue-600 font-medium">(Demo Mode)</span>}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Create New Session - Now contains the full form */}
          <div className="lg:col-span-2">
            <CreateSessionForm onSessionCreated={handleSessionCreated} />
          </div>

          {/* Recent Sessions */}
          <div>
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
    </div>
  );
};

export default TeacherDashboard;
