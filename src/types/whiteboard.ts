export type Tool = 'pencil' | 'eraser' | 'select' | 'highlighter';

export interface Point {
  x: number;
  y: number;
}

export interface WhiteboardOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  initialScale?: number;
  initialPosition?: Point;
}

export interface LineObject {
  id: string;
  tool: Tool;
  points: number[];
  color: string;
  strokeWidth: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface ImageObject {
  id: string;
  x: number;
  y: number;
  src: string;
  width?: number;
  height?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  locked?: boolean;
}

export interface PanZoomState {
  x: number;
  y: number;
  scale: number;
}

export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectedObject {
  id: string;
  type: 'line' | 'image';
}

export interface TransformationData {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface SelectionState {
  selectedObjects: SelectedObject[];
  selectionBounds: SelectionBounds | null;
  isSelecting: boolean;
  transformationData: Record<string, TransformationData>;
}

export interface ActivityMetadata {
  type: 'draw' | 'erase' | 'move' | 'paste';
  bounds: { x: number; y: number; width: number; height: number };
  timestamp: number;
}

export interface HistorySnapshot {
  lines: LineObject[];
  images: ImageObject[];
  selectionState: SelectionState;
  lastActivity?: ActivityMetadata;
}

export interface ToolSettings {
  color: string;
  strokeWidth: number;
}

export interface WhiteboardState {
  lines: LineObject[];
  images: ImageObject[];
  currentTool: Tool;
  currentColor: string;
  currentStrokeWidth: number;
  pencilSettings: ToolSettings;
  highlighterSettings: ToolSettings;
  isDrawing: boolean;
  panZoomState: PanZoomState;
  selectionState: SelectionState;
  history: HistorySnapshot[];
  historyIndex: number;
}