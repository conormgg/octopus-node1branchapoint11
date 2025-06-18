
import { useState, useEffect, useRef, useCallback } from 'react';
import { User, Session, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Clears all authentication-related data from localStorage
 */
const clearAuthLocalStorage = () => {
  try {
    // Clear known Supabase auth keys
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Could not clear localStorage:', error);
  }
};

/**
 * Gets or creates a unique tab ID for single-tab enforcement
 */
const getOrCreateTabId = (): string => {
  try {
    let tabId = sessionStorage.getItem('tabId');
    if (!tabId) {
      tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('tabId', tabId);
    }
    return tabId;
  } catch (error) {
    console.warn('Could not access sessionStorage for tab ID:', error);
    // Fallback to memory-only tab ID
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Custom hook for managing authentication state
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const userChannelRef = useRef<RealtimeChannel | null>(null);

  /**
   * Signs out the user, clearing all auth state and redirecting to auth page
   * Using useCallback to ensure stable reference across renders
   */
  const signOut = useCallback(async () => {
    try {
      // First, cleanup presence channel if it exists
      if (userChannelRef.current) {
        try {
          console.log('Cleaning up presence channel during sign out');
          supabase.removeChannel(userChannelRef.current);
          userChannelRef.current = null;
        } catch (channelError) {
          console.error('Error cleaning up presence channel during sign out:', channelError);
        }
      }

      // Clear local auth state immediately
      setSession(null);
      setUser(null);
      
      // Clear localStorage
      clearAuthLocalStorage();
      
      // Attempt Supabase sign out (don't fail if session doesn't exist)
      try {
        const { error } = await supabase.auth.signOut();
        if (error && error.message !== "Session not found") {
          console.error('Error signing out:', error);
        }
      } catch (supabaseError) {
        console.warn('Supabase sign out failed, but local state cleared:', supabaseError);
      }
      
      // Force refresh to ensure clean state
      window.location.href = '/auth';
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Fallback: force clear state and redirect anyway
      setSession(null);
      setUser(null);
      window.location.href = '/auth';
    }
  }, []); // Empty dependency array ensures stable reference

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Single-tab enforcement effect
  useEffect(() => {
    if (user) {
      try {
        const tabId = getOrCreateTabId();
        const channelName = `user-presence-${user.id}`;
        
        // Cleanup any existing channel before creating a new one
        if (userChannelRef.current) {
          try {
            console.log('Cleaning up existing channel before creating new one');
            supabase.removeChannel(userChannelRef.current);
            userChannelRef.current = null;
          } catch (error) {
            console.error('Error cleaning up existing channel:', error);
          }
        }
        
        const userChannel = supabase.channel(channelName);
        
        // Store channel reference for cleanup
        userChannelRef.current = userChannel;

        // Set up broadcast listener for new tab events
        const handleNewTabEvent = (payload: any) => {
          try {
            if (payload.event === 'new-tab-opened' && payload.message?.tabId !== tabId) {
              console.warn(`New tab detected (${payload.message?.tabId}). This tab (${tabId}) will be signed out.`);
              signOut();
            }
          } catch (error) {
            console.error('Error handling new tab event:', error);
          }
        };

        userChannel
          .on('broadcast', { event: 'new-tab-opened' }, handleNewTabEvent)
          .subscribe((status, err) => {
            if (status !== 'SUBSCRIBED' || err) {
              console.error(
                'Could not connect to single-tab presence channel. This feature will be disabled for this session.',
                err
              );
              return;
            }

            if (status === 'SUBSCRIBED') {
              console.log(`Tab ${tabId} successfully subscribed to presence channel`);
              // Add randomized delay to prevent race conditions
              const randomDelay = Math.floor(Math.random() * 250);
              setTimeout(() => {
                try {
                  userChannel.send({
                    type: 'broadcast',
                    event: 'new-tab-opened',
                    message: { tabId: tabId },
                  });
                } catch (broadcastError) {
                  console.error('Error broadcasting tab presence:', broadcastError);
                }
              }, randomDelay);
            }
          });

      } catch (error) {
        console.error('Error setting up single-tab enforcement:', error);
        // Graceful degradation - continue without single-tab enforcement
      }
    } else {
      // User signed out, cleanup channel
      if (userChannelRef.current) {
        try {
          console.log('User signed out, cleaning up presence channel');
          supabase.removeChannel(userChannelRef.current);
          userChannelRef.current = null;
        } catch (error) {
          console.error('Error cleaning up presence channel:', error);
        }
      }
    }

    // Cleanup function
    return () => {
      if (userChannelRef.current) {
        try {
          console.log('Cleaning up presence channel on unmount');
          supabase.removeChannel(userChannelRef.current);
          userChannelRef.current = null;
        } catch (error) {
          console.error('Error cleaning up presence channel on unmount:', error);
        }
      }
    };
  }, [user, signOut]); // Now signOut has a stable reference

  const isAuthenticated = !!user;

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated,
  };
};
