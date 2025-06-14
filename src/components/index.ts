
/**
 * Component exports with categorization and usage documentation
 * 
 * This file organizes all React components by their purpose,
 * making it easier to find and understand component responsibilities.
 */

// ============================================================================
// MAIN CANVAS COMPONENTS
// ============================================================================

/**
 * Primary whiteboard canvas component using Konva.js
 * Main entry point for whiteboard functionality
 * 
 * @usage For standalone whiteboard instances
 */
export { default as Whiteboard } from './Whiteboard';

/**
 * Sync-enabled whiteboard with real-time collaboration
 * 
 * @usage For collaborative whiteboard sessions
 */
export { SyncWhiteboard } from './SyncWhiteboard';

/**
 * Lower-level Konva stage wrapper with advanced event handling
 * 
 * @usage When you need direct access to Konva stage features
 */
export { default as KonvaStage } from './canvas/KonvaStage';

/**
 * Raw Konva stage canvas without container logic
 * 
 * @usage For custom canvas implementations
 */
export { default as KonvaStageCanvas } from './canvas/KonvaStageCanvas';

// ============================================================================
// CANVAS RENDERING COMPONENTS
// ============================================================================

/**
 * Renders individual line objects (strokes) on the canvas
 * Handles selection, transformation, and visual feedback
 */
export { default as LineRenderer } from './canvas/LineRenderer';

/**
 * Renders individual image objects on the canvas
 * Supports drag, resize, rotate, and selection operations
 */
export { default as ImageRenderer } from './canvas/ImageRenderer';

/**
 * Selection rectangle for drag-to-select functionality
 * Shows visual feedback during selection operations
 */
export { default as SelectionRect } from './canvas/SelectionRect';

/**
 * Group selection and transformation component
 * Handles multiple selected objects as a unified group
 */
export { default as SelectionGroup } from './canvas/SelectionGroup';

/**
 * Context menu for image operations
 * Provides lock/unlock and other image-specific actions
 */
export { default as ImageContextMenu } from './canvas/ImageContextMenu';

// ============================================================================
// SESSION MANAGEMENT COMPONENTS
// ============================================================================

/**
 * Teacher dashboard for session creation and management
 * Main interface for educators to create and run sessions
 */
export { default as TeacherDashboard } from './session/TeacherDashboard';

/**
 * Active teaching session view with student board monitoring
 * Shows teacher's board and grid of student boards
 */
export { default as TeacherSessionView } from './session/TeacherSessionView';

/**
 * Student view for joining and participating in sessions
 * Simplified interface for student whiteboard interaction
 */
export { default as StudentSessionView } from './session/StudentSessionView';

/**
 * Form for creating new classroom sessions
 * Handles session configuration and student list setup
 */
export { default as CreateSessionForm } from './session/CreateSessionForm';

/**
 * Student join page for entering sessions via URL
 * Entry point for students to join active sessions
 */
export { default as StudentJoinPage } from './session/StudentJoinPage';

// ============================================================================
// TEACHER VIEW COMPONENTS
// ============================================================================

/**
 * Main teacher interface with session controls
 * Top-level component for active teaching sessions
 */
export { default as TeacherView } from './TeacherView';

/**
 * Teacher's main whiteboard area
 * Primary drawing surface for instructor content
 */
export { default as TeacherMainBoard } from './TeacherMainBoard';

/**
 * Grid display of student whiteboards
 * Allows teacher to monitor all student work simultaneously
 */
export { default as StudentBoardsGrid } from './StudentBoardsGrid';

/**
 * Separate window for student board monitoring
 * Provides dedicated window for student work overview
 */
export { default as StudentBoardsWindow } from './StudentBoardsWindow';

/**
 * Header controls for teacher interface
 * Contains session controls, layout options, and student management
 */
export { default as TeacherHeader } from './TeacherHeader';

// ============================================================================
// AUTHENTICATION COMPONENTS
// ============================================================================

/**
 * Complete authentication page with login/signup forms
 * Entry point for user authentication flow
 */
export { default as AuthPage } from './auth/AuthPage';

/**
 * Authentication form component
 * Handles both login and registration functionality
 */
export { default as AuthForm } from './auth/AuthForm';

// ============================================================================
// TOOLBAR AND UI COMPONENTS
// ============================================================================

/**
 * Moveable floating toolbar for drawing tools
 * Provides access to pencil, eraser, colors, and other tools
 */
export { default as MovableToolbar } from './MovableToolbar';

/**
 * Layout selector for student board arrangements
 * Allows teachers to choose grid layouts for student monitoring
 */
export { default as LayoutSelector } from './LayoutSelector';

/**
 * Palm rejection configuration interface
 * Settings for stylus input and palm rejection sensitivity
 */
export { PalmRejectionSettings } from './PalmRejectionSettings';

/**
 * View switching controls
 * Toggles between different interface modes and views
 */
export { default as ViewSwitcher } from './ViewSwitcher';

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Placeholder shown when whiteboard is loading or empty
 * Provides visual feedback and loading states
 */
export { default as WhiteboardPlaceholder } from './WhiteboardPlaceholder';

/**
 * Window management for multi-window interfaces
 * Handles popup windows and window state management
 */
export { useWindowManager } from './WindowManager';

/**
 * Generic content renderer for different window types
 * Flexible component for rendering various content types
 */
export { default as WindowContentRenderer } from './WindowContentRenderer';

/**
 * Student-specific whiteboard view
 * Simplified interface optimized for student interaction
 */
export { default as StudentView } from './StudentView';

/**
 * Navigation controls that persist across page changes
 * Provides consistent navigation for paginated content
 */
export { default as PersistentPageNavigation } from './PersistentPageNavigation';

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Basic whiteboard setup:
 * 
 * import { Whiteboard } from '@/components';
 * 
 * function App() {
 *   return <Whiteboard width={800} height={600} />;
 * }
 */

/**
 * Collaborative whiteboard:
 * 
 * import { SyncWhiteboard } from '@/components';
 * 
 * function CollaborativeApp() {
 *   const syncConfig = {
 *     whiteboardId: 'classroom-1',
 *     userId: 'teacher-123',
 *     isReceiveOnly: false
 *   };
 *   
 *   return <SyncWhiteboard syncConfig={syncConfig} width={800} height={600} />;
 * }
 */

/**
 * Teacher session:
 * 
 * import { TeacherView } from '@/components';
 * 
 * function TeacherApp() {
 *   return <TeacherView activeSession={session} onEndSession={handleEnd} />;
 * }
 */
