
import React, { useState } from 'react';
import { Settings, Copy, Check, ExternalLink, UserPlus, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Session {
  id: string;
  title: string;
  unique_url_slug: string;
  status: string;
  created_at: string;
}

interface TeacherHeaderSessionOptionsProps {
  activeSession?: Session | null;
  onEndSession?: () => void;
  onSignOut?: () => void;
  onOpenAddDialog?: () => void;
}

const TeacherHeaderSessionOptions: React.FC<TeacherHeaderSessionOptionsProps> = ({
  activeSession,
  onEndSession,
  onSignOut,
  onOpenAddDialog,
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!activeSession) return null;

  const sessionUrl = `${window.location.origin}/session/${activeSession.unique_url_slug}`;

  const copyToClipboard = async () => {
    if (!sessionUrl) return;
    
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

  const openInNewWindow = () => {
    if (sessionUrl) {
      window.open(sessionUrl, '_blank');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Settings className="w-4 h-4" />
          <span>Session Options</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-white" align="end">
        <DropdownMenuLabel className="font-semibold">
          Active Session: {activeSession.title}
        </DropdownMenuLabel>
        <div className="px-2 py-1 text-xs text-gray-500">
          Session ID: {activeSession.id}
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuLabel className="text-sm font-medium">
          Student Access URL
        </DropdownMenuLabel>
        <div className="px-2 py-2">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs font-mono">
            <span className="flex-1 truncate">{sessionUrl}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-6 w-6 p-0"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>
        
        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
          <Copy className="w-4 h-4 mr-2" />
          {copied ? 'Copied!' : 'Copy URL'}
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={openInNewWindow} className="cursor-pointer">
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in New Window
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Add Student option */}
        {onOpenAddDialog && (
          <DropdownMenuItem onClick={onOpenAddDialog} className="cursor-pointer">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Student
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onEndSession} 
          className="cursor-pointer text-orange-600 focus:text-orange-600"
        >
          <X className="w-4 h-4 mr-2" />
          End Session
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={onSignOut} 
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TeacherHeaderSessionOptions;
