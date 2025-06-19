
import { useEffect, useState, useRef } from 'react';
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

  // Setup presence channel for single-tab enforcement
  const setupPresenceChannel = (currentUser: User) => {
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
    }

    const channelName = `user-presence-${currentUser.id}`;
    console.log(`[SingleTabAuth] Setting up presence channel: ${channelName}`);

    presenceChannelRef.current = supabase
      .channel(channelName)
      .on('broadcast', { event: 'new-tab-opened' }, (payload) => {
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
      })
      .subscribe(async (status) => {
        console.log(`[SingleTabAuth] Presence channel status: ${status}`);
        
        if (status === 'SUBSCRIBED') {
          // Add random delay to prevent race conditions
          const delay = Math.random() * 250;
          
          setTimeout(() => {
            const tabId = getTabId();
            console.log(`[SingleTabAuth] Broadcasting presence for tab: ${tabId}`);
            
            presenceChannelRef.current?.send({
              type: 'broadcast',
              event: 'new-tab-opened',
              payload: { tabId }
            }).catch((error: any) => {
              console.error('[SingleTabAuth] Failed to broadcast presence:', error);
            });
          }, delay);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[SingleTabAuth] Presence channel error - graceful degradation');
        } else if (status === 'TIMED_OUT') {
          console.error('[SingleTabAuth] Presence channel timed out - graceful degradation');
        }
      });
  };

  // Cleanup presence channel
  const cleanupPresenceChannel = () => {
    if (presenceChannelRef.current) {
      console.log('[SingleTabAuth] Cleaning up presence channel');
      supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }
  };

  const signOut = async () => {
    try {
      // Cleanup presence channel before signing out
      cleanupPresenceChannel();
      
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
  };

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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Setup single-tab enforcement if user is authenticated
      if (session?.user) {
        setupPresenceChannel(session.user);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          // Setup single-tab enforcement for new sign-ins
          setupPresenceChannel(session.user);
        } else if (event === 'SIGNED_OUT') {
          // Cleanup on sign out
          cleanupPresenceChannel();
          sessionStorage.removeItem('tabId');
          tabIdRef.current = null;
        }
      }
    );

    // Cleanup on component unmount
    return () => {
      subscription.unsubscribe();
      cleanupPresenceChannel();
    };
  }, []);

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
