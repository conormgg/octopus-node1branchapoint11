
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { WhiteboardStateProvider } from "@/contexts/WhiteboardStateContext";
import { SessionExpirationProvider } from "@/contexts/sessionExpiration";
import { SessionProvider, useSessionContext } from "@/contexts/SessionContext";
import { LogoProvider } from "@/contexts/LogoContext";
import AuthPage from "@/components/auth/AuthPage";
import TeacherDashboard from "@/components/session/TeacherDashboard";
import StudentJoinPage from "@/components/session/StudentJoinPage";
import StudentSessionView from "@/components/session/StudentSessionView";
import Index from "./pages/Index";
import LogoReplacer from "./pages/LogoReplacer";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import { useCallback } from "react";

const queryClient = new QueryClient();

// Helper function to check if current route is a student route
const isStudentRoute = (pathname: string) => {
  return pathname.startsWith('/session/');
};

// Student-only routes without any authentication
const StudentRoutes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract session ID from location state for student sessions
  const getSessionId = () => {
    if (location.pathname.includes('/session/') && location.state) {
      const state = location.state as { sessionId?: string };
      return state.sessionId || null;
    }
    return null;
  };

  const sessionId = getSessionId();

  const handleStudentSessionExpired = useCallback(() => {
    console.log('Student session expired, redirecting to join page');
    // For students, redirect to the session join page to show expired message
    const sessionSlug = location.pathname.split('/')[2];
    navigate(`/session/${sessionSlug}`, { replace: true });
  }, [navigate, location.pathname]);

  return (
    <SessionExpirationProvider 
      sessionId={sessionId}
      onSessionExpired={handleStudentSessionExpired}
    >
      <Routes>
        <Route path="/session/:sessionSlug" element={<StudentJoinPage />} />
        <Route path="/session/:sessionSlug/student" element={<StudentSessionView />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SessionExpirationProvider>
  );
};

// Teacher routes with full authentication
const TeacherSessionWrapper = ({ children }: { children: React.ReactNode }) => {
  const { currentSessionId, clearCurrentSession } = useSessionContext();
  const navigate = useNavigate();

  const handleTeacherSessionExpired = useCallback(() => {
    console.log('Teacher session expired, redirecting to dashboard');
    // Clear the current session and redirect to dashboard
    clearCurrentSession();
    navigate('/dashboard', { replace: true });
  }, [clearCurrentSession, navigate]);

  return (
    <SessionExpirationProvider 
      sessionId={currentSessionId}
      onSessionExpired={handleTeacherSessionExpired}
    >
      {children}
    </SessionExpirationProvider>
  );
};

const TeacherRoutes = () => {
  const { user, loading } = useAuth();

  // Show loading state during auth check
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
    <SessionProvider>
      <TeacherSessionWrapper>
        <Routes>
          {user ? (
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
      </TeacherSessionWrapper>
    </SessionProvider>
  );
};

// Route dispatcher that decides between student and teacher flows
const RouteDispatcher = () => {
  const location = useLocation();

  // For student routes, use minimal student-only app
  if (isStudentRoute(location.pathname)) {
    return <StudentRoutes />;
  }

  // For all other routes, use full teacher app with authentication
  return (
    <TeacherRoutes />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LogoProvider>
      <WhiteboardStateProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Logo Replacer route - accessible without authentication */}
              <Route path="/logo-replacer" element={<LogoReplacer />} />
              {/* All other routes */}
              <Route path="*" element={<RouteDispatcher />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WhiteboardStateProvider>
    </LogoProvider>
  </QueryClientProvider>
);

export default App;
