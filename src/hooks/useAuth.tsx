
import { useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const presenceChannelRef = useRef<any>(null);
  const isCleaningUp = useRef(false);

  // Use useCallback to ensure the function reference is stable
  const signOut = useCallback(async () => {
    isCleaningUp.current = true;
    if (presenceChannelRef.current) {
      try {
        await supabase.removeChannel(presenceChannelRef.current);
        console.log('[Auth] Presence channel removed successfully before sign out.');
      } catch (e) {
        console.error('[Auth] Error removing presence channel on sign out:', e);
      } finally {
        presenceChannelRef.current = null;
      }
    }
    
    sessionStorage.removeItem('tabId');
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive"
      });
    }
    isCleaningUp.current = false;
  }, [toast]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    
    if (error) {
      console.error('Error signing in with Google:', error);
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Error signing in with email:', error);
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'teacher'
        }
      }
    });
    
    if (error) {
      console.error('Error signing up:', error);
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success!",
        description: "Please check your email to confirm your account.",
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    let tabId: string;

    const getTabId = () => {
      if (!sessionStorage.getItem('tabId')) {
        sessionStorage.setItem('tabId', `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
      }
      return sessionStorage.getItem('tabId')!;
    };

    const setupPresenceChannel = (currentUser: User) => {
      // If a channel already exists or cleanup is in progress, do nothing.
      if (presenceChannelRef.current || isCleaningUp.current) {
        console.log('[Auth] Presence channel setup skipped (already exists or cleaning up).');
        return;
      }

      const channelName = `user-presence-${currentUser.id}`;
      console.log(`[Auth] Setting up presence channel: ${channelName}`);
      const channel = supabase.channel(channelName);

      channel.on('broadcast', { event: 'new-tab-opened' }, (payload) => {
        const { tabId: newTabId } = payload.payload;
        if (newTabId !== tabId) {
          console.log(`[Auth] New tab detected (${newTabId}). Current tab (${tabId}) signing out.`);
          toast({
            title: "Session Moved",
            description: "You've opened the app in another tab. This session has been closed.",
            variant: "destructive",
          });
          signOut();
        }
      });

      channel.subscribe((status, err) => {
        if (!isMounted) return;
        console.log(`[Auth] Presence channel status: ${status}`);

        if (status === 'SUBSCRIBED') {
          tabId = getTabId();
          console.log(`[Auth] Broadcasting presence for tab: ${tabId}`);
          channel.send({
            type: 'broadcast',
            event: 'new-tab-opened',
            payload: { tabId },
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`[Auth] Presence channel error: ${status}`, err);
        }
      });
      presenceChannelRef.current = channel;
    };

    const cleanupPresenceChannel = async () => {
      isCleaningUp.current = true;
      if (presenceChannelRef.current) {
        try {
          await supabase.removeChannel(presenceChannelRef.current);
          console.log('[Auth] Presence channel removed successfully.');
        } catch (e) {
          console.error('[Auth] Error removing presence channel:', e);
        } finally {
          presenceChannelRef.current = null;
          isCleaningUp.current = false;
        }
      } else {
        isCleaningUp.current = false;
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setUser(session?.user ?? null);
        setSession(session);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('[Auth] Auth state changed:', event);
        setUser(session?.user ?? null);
        setSession(session);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          if (session?.user) {
            await cleanupPresenceChannel(); // Ensure old channel is gone before setting up new one
            setupPresenceChannel(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          await cleanupPresenceChannel();
        }
      }
    );

    return () => {
      console.log('[Auth] Cleaning up auth hook.');
      isMounted = false;
      subscription.unsubscribe();
      cleanupPresenceChannel();
    };
  }, [signOut, toast]); // Dependency array contains only stable functions

  return {
    user,
    session,
    loading,
    signOut,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail
  };
};
