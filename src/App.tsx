
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DemoAuthProvider } from "@/hooks/useDemoAuth";
import { WhiteboardStateProvider } from "@/contexts/WhiteboardStateContext";
import { SessionExpirationProvider } from "@/contexts/sessionExpiration";
import { SessionProvider, useSessionContext } from "@/contexts/SessionContext";
import AuthPage from "@/components/auth/AuthPage";
import TeacherDashboard from "@/components/session/TeacherDashboard";
import StudentJoinPage from "@/components/session/StudentJoinPage";
import StudentSessionView from "@/components/session/StudentSessionView";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const SessionWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { currentSessionId } = useSessionContext();
  
  // Extract session ID from location state for student sessions
  const getSessionId = () => {
    // First check if we have a teacher session ID from context
    if (currentSessionId) {
      return currentSessionId;
    }
    
    // Then check for student session from location state
    if (location.pathname.includes('/session/') && location.state) {
      const state = location.state as { sessionId?: string };
      return state.sessionId || null;
    }
    return null;
  };

  const sessionId = getSessionId();

  return (
    <SessionExpirationProvider 
      sessionId={sessionId}
      onSessionExpired={() => {
        console.log('Session expired, handled by centralized context');
      }}
    >
      {children}
    </SessionExpirationProvider>
  );
};

const AuthenticatedApp = () => {
  const { user, loading, isDemoMode } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <SessionProvider>
        <SessionWrapper>
          <Routes>
            {/* Public routes for students to join sessions */}
            <Route path="/session/:sessionSlug" element={<StudentJoinPage />} />
            <Route path="/session/:sessionSlug/student" element={<StudentSessionView />} />
            
            {/* Teacher routes - require authentication or demo mode */}
            {(user || isDemoMode) ? (
              <>
                <Route path="/dashboard" element={<TeacherDashboard />} />
                <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </>
            ) : (
              <>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/dashboard" element={<Navigate to="/auth" replace />} />
                <Route path="/" element={<Index />} />
              </>
            )}
            
            {/* Catch all other routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionWrapper>
      </SessionProvider>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DemoAuthProvider>
      <WhiteboardStateProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthenticatedApp />
        </TooltipProvider>
      </WhiteboardStateProvider>
    </DemoAuthProvider>
  </QueryClientProvider>
);

export default App;
