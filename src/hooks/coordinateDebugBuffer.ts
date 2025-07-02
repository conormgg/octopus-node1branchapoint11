import { toast } from './use-toast';

export type CoordinateEntry = {
  screen: { x: number; y: number };
  viewport: { x: number; y: number };
  world: { x: number; y: number };
  local: { x: number; y: number } | null;
  boardRect?: DOMRect; // Added container rect
  boardScale?: number; // Added container scale
};

export let coordinateBuffer: {
  drawA?: CoordinateEntry;
  drawB?: CoordinateEntry;
  pinch?: [CoordinateEntry, CoordinateEntry];
} = {};

function formatCoords(label: string, coord: any) {
  return (
    `${label}:\n` +
    `  Raw: (${coord.screen?.x?.toFixed(2)}, ${coord.screen?.y?.toFixed(2)})\n` +
    `  World: (${coord.world?.x?.toFixed(2)}, ${coord.world?.y?.toFixed(2)})`
  );
}

export function maybeShowConsolidatedToast() {
  if (coordinateBuffer.drawA && coordinateBuffer.drawB && coordinateBuffer.pinch) {
    toast({
      title: 'Coordinate Comparison',
      description:
        formatCoords('Draw A', coordinateBuffer.drawA) + '\n\n' +
        formatCoords('Draw B', coordinateBuffer.drawB) + '\n\n' +
        formatCoords('Pinch A', coordinateBuffer.pinch[0]) + '\n\n' +
        formatCoords('Pinch B', coordinateBuffer.pinch[1])
    });
    coordinateBuffer = {};
  }
}
