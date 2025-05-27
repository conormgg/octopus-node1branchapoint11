
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AuthPage from "@/components/auth/AuthPage";
import TeacherDashboard from "@/components/session/TeacherDashboard";
import StudentJoinPage from "@/components/session/StudentJoinPage";
import StudentSessionView from "@/components/session/StudentSessionView";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const AuthenticatedApp = () => {
  const { user, loading } = useAuth();

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
    <Routes>
      {/* Public routes for students to join sessions */}
      <Route path="/session/:sessionSlug" element={<StudentJoinPage />} />
      <Route path="/session/:sessionSlug/student" element={<StudentSessionView />} />
      
      {/* Teacher routes - require authentication */}
      {user ? (
        <>
          <Route path="/dashboard" element={<TeacherDashboard />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </>
      ) : (
        <>
          <Route path="/auth" element={<AuthPage onAuthSuccess={() => window.location.href = '/dashboard'} />} />
          <Route path="/dashboard" element={<Navigate to="/auth" replace />} />
          <Route path="/" element={<Index />} />
        </>
      )}
      
      {/* Catch all other routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthenticatedApp />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
