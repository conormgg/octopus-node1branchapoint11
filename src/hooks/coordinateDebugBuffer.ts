import { toast } from './use-toast';

export type CoordinateEntry = {
  screen: { x: number; y: number };
  viewport: { x: number; y: number };
  world: { x: number; y: number };
  local: { x: number; y: number } | null;
  containerRect?: DOMRect; // Added container dimensions
};

export let coordinateBuffer: {
  drawA?: CoordinateEntry;
  drawB?: CoordinateEntry;
  pinch?: [CoordinateEntry, CoordinateEntry];
  containerRect?: DOMRect; // Store container dimensions separately
} = {};

function formatCoords(label: string, coord: any) {
  return (
    `${label}:\n` +
    `  Raw: (${coord.screen?.x?.toFixed(2)}, ${coord.screen?.y?.toFixed(2)})\n` +
    `  World: (${coord.world?.x?.toFixed(2)}, ${coord.world?.y?.toFixed(2)})`
  );
}

function formatContainerInfo(rect: DOMRect) {
  return `Container: L=${rect.left.toFixed(2)}, T=${rect.top.toFixed(2)}, W=${rect.width.toFixed(2)}, H=${rect.height.toFixed(2)}`;
}

export function maybeShowConsolidatedToast() {
  // Show toast if we have pinch data and container info, even without draw data
  if (coordinateBuffer.pinch && coordinateBuffer.containerRect) {
    let description = formatContainerInfo(coordinateBuffer.containerRect) + '\n\n' +
      formatCoords('Pinch A', coordinateBuffer.pinch[0]) + '\n\n' +
      formatCoords('Pinch B', coordinateBuffer.pinch[1]);
    
    if (coordinateBuffer.drawA && coordinateBuffer.drawB) {
      description += '\n\n' + formatCoords('Draw A', coordinateBuffer.drawA) + '\n\n' +
        formatCoords('Draw B', coordinateBuffer.drawB);
    }
    
    toast({
      title: 'Coordinate & Container Info',
      description
    });
    coordinateBuffer = {};
  }
}
