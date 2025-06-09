
export type Tool = 'pencil' | 'eraser' | 'select';

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
}

export interface PanZoomState {
  x: number;
  y: number;
  scale: number;
}

export interface SelectionState {
  selectedIds: string[];
  isTransforming: boolean;
  selectionRect: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null;
}

export interface WhiteboardState {
  lines: LineObject[];
  images: ImageObject[];
  currentTool: Tool;
  currentColor: string;
  currentStrokeWidth: number;
  isDrawing: boolean;
  panZoomState: PanZoomState;
  history: { lines: LineObject[]; images: ImageObject[] }[];
  historyIndex: number;
  selectionState: SelectionState;
}
