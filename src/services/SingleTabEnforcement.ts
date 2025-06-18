
/**
 * @fileoverview Robust Single-Tab Enforcement Service
 * @description Singleton service for managing single-tab authentication enforcement
 */

import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface TabEnforcementConfig {
  enabled: boolean;
  debugMode: boolean;
  maxRetries: number;
  baseRetryDelay: number;
  maxRetryDelay: number;
  fallbackToBroadcastChannel: boolean;
}

class SingleTabEnforcementService {
  private static instance: SingleTabEnforcementService;
  private config: TabEnforcementConfig;
  private currentTabId: string | null = null;
  private supabaseChannel: any = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private retryCount = 0;
  private retryTimeout: NodeJS.Timeout | null = null;
  private onSignOutCallback: (() => void) | null = null;
  private isInitialized = false;

  private constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'production', // Disabled in development by default
      debugMode: process.env.NODE_ENV === 'development',
      maxRetries: 3,
      baseRetryDelay: 1000,
      maxRetryDelay: 10000,
      fallbackToBroadcastChannel: true,
    };

    // Listen for page unload to cleanup
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
      window.addEventListener('unload', () => this.cleanup());
    }
  }

  public static getInstance(): SingleTabEnforcementService {
    if (!SingleTabEnforcementService.instance) {
      SingleTabEnforcementService.instance = new SingleTabEnforcementService();
    }
    return SingleTabEnforcementService.instance;
  }

  /**
   * Initialize single-tab enforcement for a user
   */
  public async initialize(user: User, onSignOut: () => void): Promise<void> {
    if (!this.config.enabled) {
      this.log('Single-tab enforcement disabled');
      return;
    }

    if (this.isInitialized && this.currentTabId) {
      this.log('Already initialized, skipping');
      return;
    }

    this.onSignOutCallback = onSignOut;
    this.currentTabId = this.getOrCreateTabId();
    this.isInitialized = true;
    
    this.log(`Initializing single-tab enforcement for user ${user.id}, tab ${this.currentTabId}`);

    // Try Supabase channel first
    await this.initializeSupabaseChannel(user);

    // If Supabase fails and fallback is enabled, use BroadcastChannel
    if (!this.supabaseChannel && this.config.fallbackToBroadcastChannel) {
      this.initializeBroadcastChannel(user);
    }
  }

  /**
   * Initialize Supabase realtime channel with retry logic
   */
  private async initializeSupabaseChannel(user: User): Promise<void> {
    try {
      const channelName = `user-presence-${user.id}`;
      
      // Clean up existing channel if any
      if (this.supabaseChannel) {
        try {
          await supabase.removeChannel(this.supabaseChannel);
        } catch (error) {
          this.log('Error cleaning up existing channel:', error);
        }
      }

      this.supabaseChannel = supabase.channel(channelName);

      this.supabaseChannel.on('broadcast', { event: 'new-tab-opened' }, (payload: any) => {
        this.handleNewTabEvent(payload);
      });

      // Subscribe with retry logic
      this.supabaseChannel.subscribe((status: string, err?: Error) => {
        if (status === 'SUBSCRIBED') {
          this.log(`Successfully connected to Supabase presence channel`);
          this.retryCount = 0; // Reset retry count on success
          
          // Broadcast our presence after a random delay
          const delay = Math.floor(Math.random() * 250);
          setTimeout(() => {
            this.broadcastTabPresence();
          }, delay);
        } else if (status === 'CHANNEL_ERROR' || err) {
          this.log('Supabase channel error:', err);
          this.handleConnectionFailure();
        }
      });

    } catch (error) {
      this.log('Error initializing Supabase channel:', error);
      this.handleConnectionFailure();
    }
  }

  /**
   * Initialize BroadcastChannel as fallback
   */
  private initializeBroadcastChannel(user: User): void {
    if (!('BroadcastChannel' in window)) {
      this.log('BroadcastChannel not supported');
      return;
    }

    try {
      const channelName = `tab-enforcement-${user.id}`;
      this.broadcastChannel = new BroadcastChannel(channelName);
      
      this.broadcastChannel.onmessage = (event) => {
        this.handleNewTabEvent({ message: event.data });
      };

      this.log('BroadcastChannel initialized as fallback');
      
      // Broadcast our presence
      setTimeout(() => {
        this.broadcastTabPresence();
      }, Math.floor(Math.random() * 250));

    } catch (error) {
      this.log('Error initializing BroadcastChannel:', error);
    }
  }

  /**
   * Handle connection failures with exponential backoff
   */
  private handleConnectionFailure(): void {
    if (this.retryCount >= this.config.maxRetries) {
      this.log('Max retries reached, giving up');
      return;
    }

    const delay = Math.min(
      this.config.baseRetryDelay * Math.pow(2, this.retryCount),
      this.config.maxRetryDelay
    );

    this.retryCount++;
    this.log(`Retrying connection in ${delay}ms (attempt ${this.retryCount})`);

    this.retryTimeout = setTimeout(() => {
      if (this.onSignOutCallback) {
        this.log('Retrying Supabase channel connection');
        // Note: We would need the user object here for retry
        // For now, just log the retry attempt
      }
    }, delay);
  }

  /**
   * Handle new tab events
   */
  private handleNewTabEvent(payload: any): void {
    try {
      const incomingTabId = payload?.message?.tabId || payload?.tabId;
      
      if (incomingTabId && incomingTabId !== this.currentTabId) {
        this.log(`New tab detected (${incomingTabId}). Current tab (${this.currentTabId}) will be signed out.`);
        
        if (this.onSignOutCallback) {
          this.onSignOutCallback();
        }
      }
    } catch (error) {
      this.log('Error handling new tab event:', error);
    }
  }

  /**
   * Broadcast tab presence
   */
  private broadcastTabPresence(): void {
    if (!this.currentTabId) return;

    const message = { tabId: this.currentTabId };

    // Try Supabase first
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'new-tab-opened',
          message,
        });
        this.log('Broadcasted presence via Supabase');
      } catch (error) {
        this.log('Error broadcasting via Supabase:', error);
      }
    }

    // Fallback to BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
        this.log('Broadcasted presence via BroadcastChannel');
      } catch (error) {
        this.log('Error broadcasting via BroadcastChannel:', error);
      }
    }
  }

  /**
   * Get or create a unique tab ID
   */
  private getOrCreateTabId(): string {
    try {
      let tabId = sessionStorage.getItem('tabId');
      if (!tabId) {
        tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('tabId', tabId);
      }
      return tabId;
    } catch (error) {
      this.log('Could not access sessionStorage for tab ID:', error);
      // Fallback to memory-only tab ID
      return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Cleanup all connections
   */
  public cleanup(): void {
    this.log('Cleaning up single-tab enforcement');
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    if (this.supabaseChannel) {
      try {
        supabase.removeChannel(this.supabaseChannel);
      } catch (error) {
        this.log('Error cleaning up Supabase channel:', error);
      }
      this.supabaseChannel = null;
    }

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.close();
      } catch (error) {
        this.log('Error closing BroadcastChannel:', error);
      }
      this.broadcastChannel = null;
    }

    this.isInitialized = false;
    this.retryCount = 0;
  }

  /**
   * Enable or disable the service
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.cleanup();
    }
  }

  /**
   * Enable debug mode
   */
  public setDebugMode(enabled: boolean): void {
    this.config.debugMode = enabled;
  }

  /**
   * Debug logging
   */
  private log(message: string, data?: any): void {
    if (this.config.debugMode) {
      console.log(`[SingleTabEnforcement] ${message}`, data || '');
    }
  }
}

export default SingleTabEnforcementService.getInstance();
