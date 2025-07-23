/**
 * @file Feature Flags for Migration Management
 * @description Controls feature availability during migration periods
 */

export interface FeatureFlags {
  // Selection system flags
  enableLegacySelection: boolean;
  enableUnifiedSelection: boolean;
  showLegacySelectTool: boolean;
  
  // Migration flags
  allowSelectToolFallback: boolean;
  enableMigrationLogging: boolean;
}

/**
 * Default feature flags configuration
 */
const defaultFlags: FeatureFlags = {
  // Selection system - unified is now primary
  enableLegacySelection: false,        // Legacy selection system disabled
  enableUnifiedSelection: true,        // Unified selection system enabled
  showLegacySelectTool: false,         // Don't show legacy select in toolbar
  
  // Migration settings
  allowSelectToolFallback: false,      // No fallback to legacy select
  enableMigrationLogging: false        // Disable migration logging in production
};

/**
 * Gets current feature flags
 */
export const getFeatureFlags = (): FeatureFlags => {
  // In development, allow override via localStorage
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const stored = localStorage.getItem('whiteboard-feature-flags');
    if (stored) {
      try {
        const override = JSON.parse(stored);
        return { ...defaultFlags, ...override };
      } catch (e) {
        console.warn('Invalid feature flags in localStorage:', e);
      }
    }
  }
  
  return defaultFlags;
};

/**
 * Sets feature flags (development only)
 */
export const setFeatureFlags = (flags: Partial<FeatureFlags>): void => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const current = getFeatureFlags();
    const updated = { ...current, ...flags };
    localStorage.setItem('whiteboard-feature-flags', JSON.stringify(updated));
    console.log('Feature flags updated:', updated);
  }
};

/**
 * Hook for using feature flags in React components
 */
import { useState, useEffect } from 'react';

export const useFeatureFlags = (): FeatureFlags => {
  const [flags, setFlags] = useState<FeatureFlags>(getFeatureFlags());
  
  useEffect(() => {
    // Listen for storage changes in development
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const handleStorageChange = () => {
        setFlags(getFeatureFlags());
      };
      
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);
  
  return flags;
};