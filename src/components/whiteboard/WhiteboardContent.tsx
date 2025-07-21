
import React, { useState, useCallback, useEffect } from 'react';
import Whiteboard from '../Whiteboard';
import { SyncWhiteboard } from '../SyncWhiteboard';
import { SyncConfig } from '@/types/sync';
import { ActivityMetadata } from '@/types/whiteboard';

interface WhiteboardContentProps {
  whiteboardWidth: number;
  whiteboardHeight: number;
  syncConfig?: SyncConfig;
  id: string;
  portalContainer?: Element | null;
  onSyncStateChange?: (syncState: { isConnected: boolean; isReceiveOnly: boolean } | null) => void;
  onLastActivityUpdate?: (activity: ActivityMetadata | null) => void;
  onCenterCallbackUpdate?: (callback: (bounds: any) => void) => void;
}

interface WhiteboardContentState {
  hasError: boolean;
  isLoading: boolean;
  errorMessage?: string;
}

const WhiteboardContent: React.FC<WhiteboardContentProps> = ({
  whiteboardWidth,
  whiteboardHeight,
  syncConfig,
  id,
  portalContainer,
  onSyncStateChange,
  onLastActivityUpdate,
  onCenterCallbackUpdate
}) => {
  const [state, setState] = useState<WhiteboardContentState>({
    hasError: false,
    isLoading: true,
    errorMessage: undefined
  });

  // Validate required props
  useEffect(() => {
    const validateProps = () => {
      if (!id || typeof id !== 'string') {
        setState(prev => ({
          ...prev,
          hasError: true,
          errorMessage: 'Invalid whiteboard ID provided'
        }));
        return false;
      }

      if (whiteboardWidth <= 0 || whiteboardHeight <= 0) {
        setState(prev => ({
          ...prev,
          hasError: true,
          errorMessage: 'Invalid whiteboard dimensions'
        }));
        return false;
      }

      return true;
    };

    const isValid = validateProps();
    if (isValid) {
      setState(prev => ({ ...prev, hasError: false, isLoading: false }));
    }
  }, [id, whiteboardWidth, whiteboardHeight]);

  // Enhanced sync state change handler with error handling - reduced logging
  const handleSyncStateChange = useCallback((syncState: { isConnected: boolean; isReceiveOnly: boolean } | null) => {
    try {
      // Only log significant state changes
      if (process.env.NODE_ENV === 'development') {
        const shouldLog = !state.hasError && syncState?.isConnected !== undefined;
        if (shouldLog) {
          console.log('[WhiteboardContent] Sync state changed:', syncState);
        }
      }
      onSyncStateChange?.(syncState);
    } catch (error) {
      console.error('[WhiteboardContent] Error handling sync state change:', error);
    }
  }, [onSyncStateChange, state.hasError]);

  // Enhanced activity update handler with validation - reduced logging
  const handleLastActivityUpdate = useCallback((activity: ActivityMetadata | null) => {
    try {
      if (activity && (!activity.bounds || !activity.timestamp)) {
        console.warn('[WhiteboardContent] Invalid activity data received:', activity);
        return;
      }
      
      // Only log when there's actually a new activity
      if (process.env.NODE_ENV === 'development' && activity) {
        console.log('[WhiteboardContent] New activity for whiteboard:', id);
      }
      onLastActivityUpdate?.(activity);
    } catch (error) {
      console.error('[WhiteboardContent] Error handling activity update:', error);
    }
  }, [id, onLastActivityUpdate]);

  // Enhanced center callback handler - reduced logging
  const handleCenterCallbackUpdate = useCallback((callback: (bounds: any) => void) => {
    try {
      if (typeof callback !== 'function') {
        console.warn('[WhiteboardContent] Invalid center callback provided');
        return;
      }

      // Remove repetitive logging for center callback updates
      onCenterCallbackUpdate?.(callback);
    } catch (error) {
      console.error('[WhiteboardContent] Error handling center callback update:', error);
    }
  }, [onCenterCallbackUpdate]);

  // Error boundary-like error handling
  const handleWhiteboardError = useCallback((error: Error) => {
    console.error('[WhiteboardContent] Whiteboard error:', error);
    setState(prev => ({
      ...prev,
      hasError: true,
      errorMessage: `Whiteboard error: ${error.message}`
    }));
  }, []);

  // Loading state
  if (state.isLoading) {
    return (
      <div className="absolute inset-0 bg-gray-25 overflow-hidden rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Initializing whiteboard...</div>
      </div>
    );
  }

  // Error state
  if (state.hasError) {
    return (
      <div className="absolute inset-0 bg-gray-25 overflow-hidden rounded-lg flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="font-semibold">Whiteboard Error</p>
          <p className="text-sm mt-2">{state.errorMessage || 'An unexpected error occurred'}</p>
          <button 
            onClick={() => setState({ hasError: false, isLoading: false })}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Invalid dimensions guard
  if (whiteboardWidth <= 0 || whiteboardHeight <= 0) {
    return (
      <div className="absolute inset-0 bg-gray-25 overflow-hidden rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Calculating whiteboard dimensions...</div>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 bg-gray-25 overflow-hidden rounded-lg"
      style={{
        top: '2px',
        left: '2px',
        right: '2px',
        bottom: '2px'
      }}
      data-ui-interactive="true"
    >
      <div className="w-full h-full">
        {syncConfig ? (
          <SyncWhiteboard 
            key={`sync-${id}`}
            syncConfig={syncConfig}
            width={whiteboardWidth}
            height={whiteboardHeight}
            portalContainer={portalContainer}
            onSyncStateChange={handleSyncStateChange}
            onLastActivityUpdate={handleLastActivityUpdate}
            onCenterCallbackUpdate={handleCenterCallbackUpdate}
          />
        ) : (
          <Whiteboard isReadOnly={false} />
        )}
      </div>
    </div>
  );
};

export default WhiteboardContent;
