
/**
 * Centralized type definitions for OctoPi Ink
 * 
 * This file provides organized access to all TypeScript types,
 * making it easier to understand the data structures and
 * find the right types for development.
 */

// ============================================================================
// CORE WHITEBOARD TYPES
// ============================================================================

/**
 * Main whiteboard data structures and enums
 * Includes LineObject, ImageObject, Tool enum, and WhiteboardState
 */
export type {
  WhiteboardState,
  LineObject,
  ImageObject,
  Tool,
  PanZoomState,
  SelectionState,
  SelectionBounds
} from './whiteboard';

// ============================================================================
// SESSION AND COLLABORATION TYPES
// ============================================================================

/**
 * Session management types for classroom functionality
 * Includes Session interface and session-related enums
 */
export type { Session } from './session';

/**
 * Student and participant types for session management
 * Includes Student and SessionParticipant interfaces
 */
export type { Student, SessionParticipant } from './student';

/**
 * Real-time synchronization types
 * Includes SyncConfig, SyncState, and sync-related interfaces
 */
export type {
  SyncConfig,
  SyncState
} from './sync';

// ============================================================================
// TEMPLATE AND PERSISTENCE TYPES
// ============================================================================

/**
 * Class template types for reusable session configurations
 * Includes ClassTemplate and template-related interfaces
 */
export type {
  ClassTemplate
} from './templates';

// ============================================================================
// COMMON TYPE PATTERNS
// ============================================================================

/**
 * Common coordinate and geometry types used throughout the application
 */
export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Standard callback patterns used in components
 */
export type EventCallback<T = void> = () => T;
export type ValueCallback<T, R = void> = (value: T) => R;
export type ChangeCallback<T> = (value: T) => void;

/**
 * Common async operation states
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Form validation result pattern
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract non-function properties from an interface
 */
export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
