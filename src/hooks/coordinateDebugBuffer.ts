import { toast } from './use-toast';

export let coordinateBuffer: {
  drawA?: any;
  drawB?: any;
  pinch?: [any, any];
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
