
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface SessionUrlDisplayProps {
  sessionSlug: string;
}

const SessionUrlDisplay: React.FC<SessionUrlDisplayProps> = ({ sessionSlug }) => {
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
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Student Access URL</CardTitle>
        <CardDescription>
          Share this URL with your students to join the session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
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
        
        <div className="flex gap-2">
          <Button onClick={copyToClipboard} className="flex-1" variant="secondary">
            {copied ? 'Copied!' : 'Copy URL'}
          </Button>
          <Button onClick={openInNewWindow} variant="outline" size="sm">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionUrlDisplay;
