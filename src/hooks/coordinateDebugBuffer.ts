import { toast } from './use-toast';

export let coordinateBuffer: {
  drawA?: any;
  drawB?: any;
  pinch?: [any, any];
} = {};

function formatCoord(label: string, coord: any) {
  return (
    `${label}:\n` +
    `  Screen: (${coord.screen?.x?.toFixed(2)}, ${coord.screen?.y?.toFixed(2)})\n` +
    `  Viewport: (${coord.viewport?.x?.toFixed(2)}, ${coord.viewport?.y?.toFixed(2)})\n` +
    `  World: (${coord.world?.x?.toFixed(2)}, ${coord.world?.y?.toFixed(2)})\n` +
    `  Local: (${coord.local?.x?.toFixed(2)}, ${coord.local?.y?.toFixed(2)})`
  );
}

export function maybeShowConsolidatedToast() {
  if (coordinateBuffer.drawA && coordinateBuffer.drawB && coordinateBuffer.pinch) {
    toast({
      title: 'Coordinate Comparison',
      description:
        formatCoord('Draw A', coordinateBuffer.drawA) + '\n\n' +
        formatCoord('Draw B', coordinateBuffer.drawB) + '\n\n' +
        formatCoord('Pinch A', coordinateBuffer.pinch[0]) + '\n\n' +
        formatCoord('Pinch B', coordinateBuffer.pinch[1])
    });
    coordinateBuffer = {};
  }
}
