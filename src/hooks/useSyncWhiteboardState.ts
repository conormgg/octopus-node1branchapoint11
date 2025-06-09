
import { useState, useCallback } from 'react';
import { WhiteboardState, Tool, LineObject, ImageObject } from '@/types/whiteboard';
import { SyncConfig } from '@/types/sync';
import { useDrawingState } from './useDrawingState';
import { useEraserState } from './useEraserState';
import { useHistoryState } from './useHistoryState';
import { useSyncState } from './useSyncState';
import { useRemoteOperationHandler } from './useRemoteOperationHandler';
import { usePanZoom } from './usePanZoom';
import { useSelectionState } from './useSelectionState';
import { serializeDrawOperation, serializeEraseOperation } from '@/utils/operationSerializer';
import { v4 as uuidv4 } from 'uuid';
import Konva from 'konva';

export const useSyncWhiteboardState = (syncConfig: SyncConfig) => {
  const [state, setState] = useState<WhiteboardState>({
    lines: [],
    images: [],
    currentTool: 'pencil',
    currentColor: '#000000',
    currentStrokeWidth: 5,
    isDrawing: false,
    panZoomState: { x: 0, y: 0, scale: 1 },
    selectionState: {
      selectedObjects: [],
      selectionBounds: null,
      isSelecting: false,
      transformationData: {}
    },
    history: [{ lines: [], images: [] }],
    historyIndex: 0
  });

  // Pan/zoom operations
  const setPanZoomState = useCallback((panZoomState: any) => {
    setState(prev => ({
      ...prev,
      panZoomState
    }));
  }, []);

  const panZoom = usePanZoom(state.panZoomState, setPanZoomState);

  // Selection operations
  const selection = useSelectionState();

  // Handle remote operations
  const { handleRemoteOperation, isApplyingRemoteOperation } = useRemoteOperationHandler(setState);

  // Set up sync
  const { syncState, sendOperation } = useSyncState(syncConfig, handleRemoteOperation);

  // History management
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
    if (sendOperation && !isApplyingRemoteOperation.current && !syncConfig.isReceiveOnly) {
      const drawnLine = state.lines[state.lines.length - 1];
      if (drawnLine && drawnLine.tool === 'pencil') {
        sendOperation(serializeDrawOperation(drawnLine));
      }
    }
  }, [state.isDrawing, state.lines, baseStopDrawing, sendOperation, isApplyingRemoteOperation, syncConfig.isReceiveOnly]);

  // Eraser operations with sync  
  const {
    startErasing,
    continueErasing,
    stopErasing: baseStopErasing
  } = useEraserState(state, setState, addToHistory);

  const stopErasing = useCallback(() => {
    if (!state.isDrawing) return;

    baseStopErasing();
    
    // Add sync logic for erasing if needed
  }, [state.isDrawing, baseStopErasing]);

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
    if (syncConfig.isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      startDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      startErasing(x, y);
    } else if (state.currentTool === 'select') {
      // Handle selection logic
      const foundObjects = selection.findObjectsAtPoint({ x, y }, state.lines, state.images);
      
      if (foundObjects.length > 0) {
        // Select the first found object
        selection.selectObjects([foundObjects[0]]);
      } else {
        // Start drag-to-select
        selection.setIsSelecting(true);
        selection.setSelectionBounds({ x, y, width: 0, height: 0 });
      }
    }
  }, [state.currentTool, state.lines, state.images, startDrawing, startErasing, syncConfig.isReceiveOnly, panZoom, selection]);

  // Handle pointer move
  const handlePointerMove = useCallback((x: number, y: number) => {
    if (syncConfig.isReceiveOnly || panZoom.isGestureActive()) return;
    
    if (state.currentTool === 'pencil') {
      continueDrawing(x, y);
    } else if (state.currentTool === 'eraser') {
      continueErasing(x, y);
    } else if (state.currentTool === 'select' && selection.selectionState.isSelecting) {
      // Update drag-to-select rectangle
      const bounds = selection.selectionState.selectionBounds;
      if (bounds) {
        const newBounds = {
          x: Math.min(bounds.x, x),
          y: Math.min(bounds.y, y),
          width: Math.abs(x - bounds.x),
          height: Math.abs(y - bounds.y)
        };
        selection.setSelectionBounds(newBounds);
      }
    }
  }, [state.currentTool, continueDrawing, continueErasing, syncConfig.isReceiveOnly, panZoom, selection]);

  // Handle pointer up
  const handlePointerUp = useCallback(() => {
    if (syncConfig.isReceiveOnly) return;
    
    if (state.currentTool === 'pencil') {
      stopDrawing();
    } else if (state.currentTool === 'eraser') {
      stopErasing();
    } else if (state.currentTool === 'select' && selection.selectionState.isSelecting) {
      // Complete drag-to-select
      const bounds = selection.selectionState.selectionBounds;
      if (bounds && (bounds.width > 5 || bounds.height > 5)) {
        // Find objects within selection bounds
        const objectsInBounds = selection.findObjectsInBounds(bounds, state.lines, state.images);
        selection.selectObjects(objectsInBounds);
      }
      
      // End selection
      selection.setIsSelecting(false);
      selection.setSelectionBounds(null);
    }
  }, [state.currentTool, state.lines, state.images, stopDrawing, stopErasing, syncConfig.isReceiveOnly, selection]);

  // Handle paste functionality
  const handlePaste = useCallback((e: ClipboardEvent, stage: Konva.Stage | null) => {
    console.log('Paste event triggered in sync whiteboard state');
    
    // Don't allow paste in receive-only mode
    if (syncConfig.isReceiveOnly) {
      console.log('Paste blocked - receive-only mode');
      return;
    }
    
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
            console.log('Image added to sync whiteboard');
            
            // TODO: Add sync logic for image paste in future stages
            // if (sendOperation && !isApplyingRemoteOperation.current) {
            //   sendOperation(serializeImageOperation(newImage));
            // }
          };
        };
        reader.readAsDataURL(file);
      }
    }
  }, [state.panZoomState, addToHistory, syncConfig.isReceiveOnly]);

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
    undo,
    redo,
    canUndo,
    canRedo,
    panZoom,
    selection,
    isReadOnly: syncConfig.isReceiveOnly
  };
};
