import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('email-invitations');

interface SendInvitationParams {
  studentEmail: string;
  studentName: string;
  sessionTitle: string;
  teacherName: string;
  sessionSlug: string;
  sessionId: string;
}

export const useEmailInvitations = () => {
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const sendSessionInvitation = async (params: SendInvitationParams) => {
    setIsSending(true);
    try {
      debugLog('sendInvitation', `Sending invitation to ${params.studentEmail}`);
      
      const { data, error } = await supabase.functions.invoke('send-session-invitation', {
        body: params
      });

      if (error) throw error;

      debugLog('sendInvitation', `Email sent successfully to ${params.studentEmail}`);
      
      toast({
        title: "Invitation Sent",
        description: `Session invitation sent to ${params.studentName} (${params.studentEmail})`,
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error sending session invitation:', error);
      
      toast({
        title: "Failed to Send Invitation", 
        description: `Could not send invitation to ${params.studentEmail}. Please try again.`,
        variant: "destructive",
      });

      return { success: false, error };
    } finally {
      setIsSending(false);
    }
  };

  const sendMultipleInvitations = async (invitations: SendInvitationParams[]) => {
    setIsSending(true);
    const results = [];
    let successCount = 0;
    let failCount = 0;

    try {
      for (const invitation of invitations) {
        const result = await sendSessionInvitation(invitation);
        results.push(result);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0 && failCount === 0) {
        toast({
          title: "All Invitations Sent",
          description: `Successfully sent ${successCount} session invitation${successCount > 1 ? 's' : ''}`,
        });
      } else if (successCount > 0 && failCount > 0) {
        toast({
          title: "Partial Success",
          description: `Sent ${successCount} invitation${successCount > 1 ? 's' : ''}, ${failCount} failed`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "All Invitations Failed",
          description: "Could not send any invitations. Please check email addresses and try again.",
          variant: "destructive",
        });
      }

      return results;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendSessionInvitation,
    sendMultipleInvitations,
    isSending
  };
};