
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDemoAuth } from '@/hooks/useDemoAuth';

interface DemoModeSectionProps {
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

const DemoModeSection: React.FC<DemoModeSectionProps> = ({ isLoading, onLoadingChange }) => {
  const { toast } = useToast();
  const { setDemoMode } = useDemoAuth();

  const handleTestLogin = async () => {
    onLoadingChange(true);
    
    try {
      // Enable demo mode
      setDemoMode(true);
      
      toast({
        title: "Demo Mode Active!",
        description: "You're now using the app in demo mode as a test teacher.",
      });
      
      // Navigate to dashboard (App.tsx will now recognize demo mode)
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast({
        title: "Demo Login Error",
        description: "Unable to start demo mode. Please contact support.",
        variant: "destructive",
      });
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <UserCheck className="h-4 w-4 text-blue-600" />
        <span className="font-medium text-blue-900">Quick Demo Access</span>
      </div>
      <p className="text-sm text-blue-700 mb-3">
        Explore the app immediately in demo mode - no signup required!
      </p>
      <Button 
        onClick={handleTestLogin} 
        disabled={isLoading}
        variant="outline"
        className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continue in Demo Mode
      </Button>
    </div>
  );
};

export default DemoModeSection;
