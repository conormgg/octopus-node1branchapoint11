
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, ExternalLink, X } from 'lucide-react';

interface SessionUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionSlug: string;
  sessionTitle: string;
}

const SessionUrlModal: React.FC<SessionUrlModalProps> = ({ 
  isOpen, 
  onClose, 
  sessionSlug, 
  sessionTitle 
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const sessionUrl = `${window.location.origin}/session/${sessionSlug}`;

  const copyToClipboard = async () => {
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
    window.open(sessionUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Session Created Successfully!
          </DialogTitle>
          <DialogDescription>
            Your session "{sessionTitle}" is now active. Share this URL with your students to join the session.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Student Access URL</label>
            <div className="flex gap-2">
              <Input
                value={sessionUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={copyToClipboard}
                size="sm"
                variant="outline"
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={copyToClipboard} className="flex-1">
              {copied ? 'Copied!' : 'Copy URL'}
            </Button>
            <Button onClick={openInNewWindow} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex justify-end pt-2">
            <Button onClick={onClose} variant="outline">
              Continue to Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionUrlModal;
