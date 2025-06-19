
import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import SingleTabEnforcementService from '@/services/SingleTabEnforcement';

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

  /**
   * Signs out the user, clearing all auth state and redirecting to auth page
   * Using useCallback to ensure stable reference across renders
   */
  const signOut = useCallback(async () => {
    try {
      // First, cleanup single-tab enforcement
      SingleTabEnforcementService.cleanup();

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

        // Handle single-tab enforcement
        if (session?.user) {
          // Initialize single-tab enforcement when user signs in
          SingleTabEnforcementService.initialize(session.user, signOut);
        } else {
          // Clean up when user signs out
          SingleTabEnforcementService.cleanup();
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Initialize single-tab enforcement if user is already logged in
      if (session?.user) {
        SingleTabEnforcementService.initialize(session.user, signOut);
      }
    });

    return () => {
      subscription.unsubscribe();
      SingleTabEnforcementService.cleanup();
    };
  }, [signOut]);

  const isAuthenticated = !!user;

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated,
  };
};
