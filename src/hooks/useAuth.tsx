
import { useEffect, useState, useRef, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Single-tab enforcement refs
  const presenceChannelRef = useRef<any>(null);
  const tabIdRef = useRef<string | null>(null);
  
  // Flag to prevent concurrent setup/cleanup operations
  const isChannelSetupInProgress = useRef(false);

  // Generate or retrieve tab ID from sessionStorage
  const getTabId = () => {
    if (!tabIdRef.current) {
      let tabId = sessionStorage.getItem('tabId');
      if (!tabId) {
        tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem('tabId', tabId);
      }
      tabIdRef.current = tabId;
    }
    return tabIdRef.current;
  };

  // Create an async cleanup function to be awaited
  const cleanupPresenceChannel = useCallback(async () => {
    if (presenceChannelRef.current) {
      console.log('[SingleTabAuth] Cleaning up existing presence channel...');
      try {
        await supabase.removeChannel(presenceChannelRef.current);
        console.log('[SingleTabAuth] Channel successfully removed.');
      } catch (error) {
        console.error('[SingleTabAuth] Error removing channel:', error);
      } finally {
        presenceChannelRef.current = null;
      }
    }
  }, []);

  // Setup presence channel for single-tab enforcement
  const setupPresenceChannel = useCallback(async (currentUser: User) => {
    // Prevent another setup from starting if one is already in progress
    if (isChannelSetupInProgress.current) {
      console.log('[SingleTabAuth] Channel setup already in progress. Aborting.');
      return;
    }
    isChannelSetupInProgress.current = true;
    
    try {
      // Ensure any old channel is fully removed before creating a new one
      await cleanupPresenceChannel();

      const channelName = `user-presence-${currentUser.id}`;
      console.log(`[SingleTabAuth] Setting up new presence channel: ${channelName}`);
      
      const newChannel = supabase.channel(channelName);

      newChannel.on('broadcast', { event: 'new-tab-opened' }, (payload) => {
        console.log('[SingleTabAuth] Received new-tab-opened broadcast:', payload);
        
        const { tabId: newTabId } = payload.payload;
        const currentTabId = getTabId();
        
        if (newTabId !== currentTabId) {
          console.log('[SingleTabAuth] Another tab detected, signing out current tab');
          toast({
            title: "Session Moved",
            description: "You've opened the app in another tab. This session has been closed.",
            variant: "destructive"
          });
          signOut();
        }
      });

      newChannel.subscribe(async (status, err) => {
        console.log(`[SingleTabAuth] Presence channel status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          // Add random delay to prevent race conditions
          const delay = Math.random() * 250;
          
          setTimeout(() => {
            const tabId = getTabId();
            console.log(`[SingleTabAuth] Broadcasting presence for tab: ${tabId}`);
            
            newChannel.send({
              type: 'broadcast',
              event: 'new-tab-opened',
              payload: { tabId }
            }).catch((error: any) => {
              console.error('[SingleTabAuth] Failed to broadcast presence:', error);
            });
          }, delay);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[SingleTabAuth] Presence channel error - graceful degradation', err);
        } else if (status === 'TIMED_OUT') {
          console.error('[SingleTabAuth] Presence channel timed out - graceful degradation');
        }
      });

      presenceChannelRef.current = newChannel;
    } catch (error) {
      console.error('[SingleTabAuth] Error setting up presence channel:', error);
    } finally {
      isChannelSetupInProgress.current = false;
    }
  }, [cleanupPresenceChannel, toast]);

  const signOut = useCallback(async () => {
    try {
      // Cleanup presence channel before signing out
      await cleanupPresenceChannel();
      
      // Clear tab ID from sessionStorage
      sessionStorage.removeItem('tabId');
      tabIdRef.current = null;
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast({
          title: "Sign Out Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }, [cleanupPresenceChannel, toast]);

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
    let mounted = true;

    // Set initial loading state
    setLoading(true);

    // Get initial session once
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setSession(session);
        if (currentUser) {
          setupPresenceChannel(currentUser);
        }
        setLoading(false);
      }
    });

    // Set up the listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('[Auth] Auth state changed:', event, session?.user?.id);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setSession(session);

        // Only react to definitive sign-in/sign-out events to set up/tear down channels
        if (event === 'SIGNED_IN' && currentUser) {
          await setupPresenceChannel(currentUser);
        } else if (event === 'SIGNED_OUT') {
          await cleanupPresenceChannel();
          sessionStorage.removeItem('tabId');
          tabIdRef.current = null;
        }
      }
    );

    // Cleanup on component unmount
    return () => {
      mounted = false;
      subscription.unsubscribe();
      cleanupPresenceChannel();
    };
  }, [cleanupPresenceChannel, setupPresenceChannel]);

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
