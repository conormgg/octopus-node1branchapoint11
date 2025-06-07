
import { useState, useCallback, useEffect, useRef } from 'react';
import { WhiteboardState, Tool, LineObject, PanZoomState, ImageObject } from '@/types/whiteboard';
import { SyncConfig } from '@/types/sync';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { useHistoryState } from './useHistoryState';
import { useSyncState } from './useSyncState';
import { useRemoteOperationHandler } from './useRemoteOperationHandler';
import { useWhiteboardStateContext } from '@/contexts/WhiteboardStateContext';
import { usePanZoom } from './usePanZoom';
import { serializeDrawOperation, serializeEraseOperation, serializeAddImageOperation } from '@/utils/operationSerializer';
import { v4 as uuidv4 } from 'uuid';
import Konva from 'konva';

export const useSharedWhiteboardState = (syncConfig?: SyncConfig, whiteboardId?: string) => {
  const { getWhiteboardState, updateWhiteboardState } = useWhiteboardStateContext();
  
  // Track lines before erasing to detect what was erased
  const linesBeforeErasingRef = useRef<LineObject[]>([]);
  
  // Initialize state with shared state if available
  const [state, setState] = useState<WhiteboardState>(() => {
    const sharedLines = whiteboardId ? getWhiteboardState(whiteboardId) : [];
    return {
      lines: sharedLines,
      images: [],
      currentTool: 'pencil',
      currentColor: '#000000',
      currentStrokeWidth: 5,
      isDrawing: false,
      panZoomState: { x: 0, y: 0, scale: 1 },
      history: [{ lines: sharedLines, images: [] }],
      historyIndex: 0
    };
  });

  // Pan/zoom state management
  const setPanZoomState = useCallback((panZoomState: PanZoomState) => {
    setState(prev => ({
      ...prev,
      panZoomState
    }));
  }, []);

  // Pan/zoom operations
  const panZoom = usePanZoom(state.panZoomState, setPanZoomState);

  // Update shared state whenever lines change
  useEffect(() => {
    if (whiteboardId) {
      updateWhiteboardState(whiteboardId, state.lines);
    }
  }, [state.lines, whiteboardId, updateWhiteboardState]);

  // Handle remote operations
  const { handleRemoteOperation, isApplyingRemoteOperation } = useRemoteOperationHandler(setState);

  // Set up sync if config is provided
  const { syncState, sendOperation } = syncConfig 
    ? useSyncState(syncConfig, handleRemoteOperation)
    : { syncState: null, sendOperation: null };

  // Enhanced add to history that syncs operations
  const {
    addToHistory: baseAddToHistory,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistoryState(state, setState);

  const addToHistory = useCallback(() => {
    baseAddToHistory({ lines: state.lines, images: state.images });
  }, [baseAddToHistory, state.lines, state.images]);

  // Drawing operations with sync
  const {
    startDrawing,
    continueDrawing,
    stopDrawing: baseStopDrawing
  } = useDrawingState(state, setState, addToHistory);

  const stopDrawing = useCallback(() => {
    if (!state.isDrawing) return;

    baseStopDrawing();

    // Sync the drawn line if we're not in receive-only mode
    if (sendOperation && !isApplyingRemoteOperation.current) {
      const drawnLine = state.lines[state.lines.length - 1];
      if (drawnLine && drawnLine.tool === 'pencil') {
        sendOperation(serializeDrawOperation(drawnLine));
      }
    }
  }, [state.isDrawing, state.lines, baseStopDrawing, sendOperation, isApplyingRemoteOperation]);

  // Eraser operations with sync
  const {
    startErasing: baseStartErasing,
    continueErasing,
    stopErasing: baseStopErasing
  } = useEraserState(state, setState, addToHistory);

  const startErasing = useCallback((x: number, y: number) => {
    if (!state.isDrawing) {
      // Store the current lines before erasing starts
      linesBeforeErasingRef.current = [...state.lines];
    }
    baseStartErasing(x, y);
  }, [state.lines, state.isDrawing, baseStartErasing]);

  const stopErasing = useCallback(() => {
    if (!state.isDrawing) return;

    baseStopErasing();
    
    // Sync the erased lines if we're not in receive-only mode
    if (sendOperation && !isApplyingRemoteOperation.current) {
      // Find the IDs of lines that were erased by comparing with the lines before erasing
      const erasedLineIds = linesBeforeErasingRef.current
        .filter(line => !state.lines.some(l => l.id === line.id))
        .map(line => line.id);
      
      console.log('Lines before erasing:', linesBeforeErasingRef.current.length);
      console.log('Lines after erasing:', state.lines.length);
      console.log('Erased line IDs:', erasedLineIds);
      
      if (erasedLineIds.length > 0) {
        sendOperation(serializeEraseOperation(erasedLineIds));
      }
    }
    
    // Clear the reference
    linesBeforeErasingRef.current = [];
  }, [state.isDrawing, state.lines, baseStopErasing, sendOperation, isApplyingRemoteOperation]);

  // Handle paste
  const handlePaste = useCallback((e: ClipboardEvent, stage: Konva.Stage | null) => {
    console.log('Paste event triggered in shared whiteboard state');
    e.preventDefault();
    const items = e.clipboardData?.items;
    if (!items || !stage) {
      console.log('No clipboard items or stage available');
      return;
    }
  
    console.log('Processing clipboard items:', items.length);
    for (let i = 0; i < items.length; i++) {
      console.log('Item type:', items[i].type);
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (!file) {
          console.log('Could not get file from clipboard item');
          continue;
        }
  
        console.log('Processing image file:', file.name, file.type);
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          const image = new window.Image();
          image.src = imageUrl;
          image.onload = () => {
            console.log('Image loaded, creating image object');
            const pointerPosition = stage.getPointerPosition() ?? { x: stage.width() / 2, y: stage.height() / 2 };
            const position = {
              x: (pointerPosition.x - state.panZoomState.x) / state.panZoomState.scale,
              y: (pointerPosition.y - state.panZoomState.y) / state.panZoomState.scale,
            };

            const newImage: ImageObject = {
              id: `image_${uuidv4()}`,
              src: imageUrl,
              x: position.x - (image.width / 4),
              y: position.y - (image.height / 4),
              width: image.width / 2,
              height: image.height / 2,
            };
            
            setState(prev => ({
              ...prev,
              images: [...prev.images, newImage]
            }));
            
            // Add to history after state update
            setTimeout(() => addToHistory(), 0);
            
            // Sync the new image if we're not in receive-only mode
            if (sendOperation && !isApplyingRemoteOperation.current) {
              console.log('Syncing new image to other clients:', newImage);
              sendOperation(serializeAddImageOperation(newImage));
            }
            
            console.log('Image added to whiteboard');
          };
        };
        reader.readAsDataURL(file);
      }
    }
  }, [state.panZoomState, addToHistory, sendOperation, isApplyingRemoteOperation]);

  // Tool change
  const setTool = useCallback((tool: Tool) => {
    setState(prev => ({
      ...prev,
      currentTool: tool
    }));
  }, []);

  // Color change
  const setColor = useCallback((color: string) => {
    setState(prev => ({
      ...prev,
      currentColor: color
    }));
  }, []);

  // Stroke width change
  const setStrokeWidth = useCallback((width: number) => {
    setState(prev => ({
      ...prev,
      currentStrokeWidth: width
    }));
  }, []);

  // Handle pointer down
  const handlePointerDown = useCallback((x: number, y: number) => {
    // Don't allow drawing in receive-only mode or during pan/zoom gestures
    if (syncConfig?.isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      startDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      startErasing(x, y);
    }
  }, [state.currentTool, startDrawing, startErasing, syncConfig?.isReceiveOnly, panZoom]);

  // Handle pointer move
  const handlePointerMove = useCallback((x: number, y: number) => {
    // Don't allow drawing in receive-only mode or during pan/zoom gestures
    if (syncConfig?.isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      continueDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      continueErasing(x, y);
    }
  }, [state.currentTool, continueDrawing, continueErasing, syncConfig?.isReceiveOnly, panZoom]);

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    // Don't allow drawing in receive-only mode
    if (syncConfig?.isReceiveOnly) return;
    
    if (state.currentTool === 'pencil') {
      stopDrawing();
    } else if (state.currentTool === 'eraser') {
      stopErasing();
    }
  }, [state.currentTool, stopDrawing, stopErasing, syncConfig?.isReceiveOnly]);

  return {
    state,
    syncState,
    setTool,
    setColor,
    setStrokeWidth,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePaste,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    panZoom,
    isReadOnly: syncConfig?.isReceiveOnly || false
  };
};
