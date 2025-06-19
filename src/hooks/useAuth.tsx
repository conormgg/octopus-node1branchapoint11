import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
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
 * Custom hook for managing authentication state
 */
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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

  /**
   * Signs out the user, clearing all auth state and redirecting to auth page
   */
  const signOut = async () => {
    try {
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
  };

  const isAuthenticated = !!user;

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated,
  };
};
