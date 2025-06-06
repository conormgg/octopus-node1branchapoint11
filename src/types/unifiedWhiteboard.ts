
import { WhiteboardState, Tool, LineObject, PanZoomState } from './whiteboard';
import { SyncState } from './sync';

export interface UnifiedWhiteboardState {
  state: WhiteboardState;
  syncState?: SyncState | null;
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  handlePointerDown: (x: number, y: number) => void;
  handlePointerMove: (x: number, y: number) => void;
  handlePointerUp: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isReadOnly?: boolean;
}

export interface WhiteboardCanvasProps {
  width: number;
  height: number;
  whiteboardState: UnifiedWhiteboardState;
  isReadOnly?: boolean;
}
