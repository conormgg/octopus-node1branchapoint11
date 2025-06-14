
/**
 * Central hook exports with categorization and documentation
 * 
 * This file provides organized access to all application hooks,
 * making it easier for AI and developers to understand hook purposes
 * and find the right hook for specific functionality.
 */

// ============================================================================
// CORE WHITEBOARD HOOKS
// ============================================================================

/**
 * Main whiteboard state management - the primary hook for canvas functionality
 * Use this for local whiteboard instances without real-time collaboration
 */
export { useWhiteboardState } from './useWhiteboardState';

/**
 * Shared whiteboard state with real-time collaboration support
 * Use this when you need multi-user collaborative whiteboards
 */
export { useSharedWhiteboardState } from './useSharedWhiteboardState';

/**
 * Sync-enabled whiteboard state for classroom/session scenarios
 * Combines collaboration with session-specific features
 */
export { useSyncWhiteboardState } from './useSyncWhiteboardState';

// ============================================================================
// EVENT HANDLING HOOKS
// ============================================================================

/**
 * Coordinates all input events (pointer, touch, mouse) for the canvas
 * Handles the complex logic of choosing the right event system
 */
export { useStageEventHandlers } from './useStageEventHandlers';

/**
 * Advanced palm rejection for stylus input on touch devices
 * Prevents accidental palm touches while drawing with a stylus
 */
export { usePalmRejection } from './usePalmRejection';

/**
 * Canvas pan and zoom functionality with gesture support
 * Handles both touch gestures and mouse wheel interactions
 */
export { usePanZoom } from './usePanZoom';

// ============================================================================
// TOOL AND INTERACTION HOOKS
// ============================================================================

/**
 * Drawing state management for pencil and highlighter tools
 * Handles stroke creation, smoothing, and real-time drawing
 */
export { useDrawingState } from './useDrawingState';

/**
 * Eraser functionality with line intersection detection
 * Efficiently removes drawn content based on eraser path
 */
export { useEraserState } from './useEraserState';

/**
 * Selection and transformation of canvas objects
 * Handles individual and group selection, dragging, and transforming
 */
export { useSelectionState } from './useSelectionState';

/**
 * Group transformation operations for multiple selected objects
 * Provides unified transformation controls for object groups
 */
export { useGroupTransform } from './useGroupTransform';

// ============================================================================
// SESSION AND COLLABORATION HOOKS
// ============================================================================

/**
 * Authentication state and user management
 * Handles login, logout, and user session persistence
 */
export { useAuth } from './useAuth';

/**
 * Session creation and management for teachers
 * Creates classroom sessions with unique URLs and student management
 */
export { useSessionManagement } from './useSessionManagement';

/**
 * Student participation in sessions
 * Handles joining sessions and student-specific functionality
 */
export { useSessionStudents } from './useSessionStudents';

/**
 * Real-time sync state management
 * Low-level hook for Supabase realtime operations
 */
export { useSyncState } from './useSyncState';

// ============================================================================
// PERSISTENCE AND HISTORY HOOKS
// ============================================================================

/**
 * Undo/redo functionality with operation history
 * Maintains history stack for whiteboard operations
 */
export { useHistoryState } from './useHistoryState';

/**
 * Whiteboard persistence to storage/database
 * Handles saving and loading whiteboard state
 */
export { useWhiteboardPersistence } from './useWhiteboardPersistence';

// ============================================================================
// UI AND UTILITY HOOKS
// ============================================================================

/**
 * Teacher dashboard view state management
 * Handles layout, pagination, and view switching for teacher interface
 */
export { useTeacherViewState } from './useTeacherViewState';

/**
 * Moveable toolbar drag and positioning
 * Handles floating toolbar positioning and user preferences
 */
export { useToolbarDrag } from './useToolbarDrag';

/**
 * Session creation form state and validation
 * Manages form data for creating new classroom sessions
 */
export { useCreateSessionForm } from './useCreateSessionForm';

/**
 * Class template management
 * Handles creating, saving, and loading class templates
 */
export { useClassTemplates } from './useClassTemplates';

/**
 * Mobile device detection and responsive behavior
 * Provides mobile-specific UI adjustments and touch optimizations
 */
export { useMobile } from './use-mobile';

/**
 * Toast notification system
 * Provides user feedback through toast messages
 */
export { useToast } from './use-toast';

// ============================================================================
// COORDINATE AND UTILITY HOOKS
// ============================================================================

/**
 * Stage coordinate transformations
 * Converts between screen coordinates and canvas coordinates
 */
export { useStageCoordinates } from './useStageCoordinates';

/**
 * Remote operation handling for collaboration
 * Processes incoming operations from other users
 */
export { useRemoteOperationHandler } from './useRemoteOperationHandler';

/**
 * Session status monitoring
 * Checks session validity and handles expiration
 */
export { useSessionStatusChecker } from './useSessionStatusChecker';
