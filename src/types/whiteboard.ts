export type Tool = 'pencil' | 'eraser';

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

export interface PanZoomState {
  x: number;
  y: number;
  scale: number;
}

export interface WhiteboardState {
  lines: LineObject[];
  currentTool: Tool;
  currentColor: string;
  currentStrokeWidth: number;
  isDrawing: boolean;
  panZoomState: PanZoomState;
  history: LineObject[][];
  historyIndex: number;
}
