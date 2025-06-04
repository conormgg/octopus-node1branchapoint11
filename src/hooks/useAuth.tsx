
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useDemoAuth } from './useDemoAuth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { isDemoMode, demoUser, setDemoMode } = useDemoAuth();

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

  const signOut = async () => {
    try {
      // Clear demo mode first if active
      if (isDemoMode) {
        setDemoMode(false);
      }
      
      // Force clear local auth state immediately
      setSession(null);
      setUser(null);
      
      // Clear all auth-related localStorage data
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-igzgxtjkaaabziccoofe-auth-token');
        // Clear any other potential auth keys
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
      } catch (localStorageError) {
        console.warn('Could not clear localStorage:', localStorageError);
      }
      
      // Attempt to sign out from Supabase (but don't fail if session doesn't exist)
      try {
        const { error } = await supabase.auth.signOut();
        if (error && error.message !== "Session not found") {
          console.error('Error signing out:', error);
        }
      } catch (supabaseError) {
        // If Supabase sign out fails, still proceed with local cleanup
        console.warn('Supabase sign out failed, but local state cleared:', supabaseError);
      }
      
      // Force refresh the page to ensure clean state
      window.location.href = '/auth';
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, force clear local state and redirect
      setSession(null);
      setUser(null);
      setDemoMode(false);
      window.location.href = '/auth';
    }
  };

  // Return demo user if in demo mode, otherwise return real user
  const effectiveUser = isDemoMode ? demoUser : user;
  const isAuthenticated = !!(effectiveUser || user);

  return {
    user: effectiveUser,
    session,
    loading,
    signOut,
    isAuthenticated,
    isDemoMode,
  };
};
