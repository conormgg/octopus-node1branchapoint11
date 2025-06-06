
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DemoAuthProvider } from "@/hooks/useDemoAuth";
import { SessionProvider } from "@/contexts/SessionContext";
import { UnifiedSessionProvider } from "@/contexts/UnifiedSessionContext";
import AuthPage from "@/components/auth/AuthPage";
import TeacherDashboard from "@/components/session/TeacherDashboard";
import StudentJoinPage from "@/components/session/StudentJoinPage";
import StudentSessionView from "@/components/session/StudentSessionView";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

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
      <Routes>
        {/* Public routes for students to join sessions */}
        <Route path="/session/:sessionSlug" element={<StudentJoinPage />} />
        <Route path="/session/:sessionSlug/student" element={<StudentSessionView />} />
        
        {/* Teacher routes - require authentication or demo mode */}
        {(user || isDemoMode) ? (
          <>
            <Route path="/dashboard" element={
              <UnifiedSessionProvider>
                <TeacherDashboard />
              </UnifiedSessionProvider>
            } />
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
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DemoAuthProvider>
      <SessionProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthenticatedApp />
        </TooltipProvider>
      </SessionProvider>
    </DemoAuthProvider>
  </QueryClientProvider>
);

export default App;
