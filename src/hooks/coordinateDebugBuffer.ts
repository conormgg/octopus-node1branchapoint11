import { toast } from './use-toast';

export let coordinateBuffer: {
  drawA?: { x: number; y: number };
  drawB?: { x: number; y: number };
  pinch?: [{ x: number; y: number }, { x: number; y: number }];
} = {};

export function maybeShowConsolidatedToast() {
  if (coordinateBuffer.drawA && coordinateBuffer.drawB && coordinateBuffer.pinch) {
    toast({
      title: 'Coordinate Comparison',
      description:
        `Draw A: (${coordinateBuffer.drawA.x.toFixed(2)}, ${coordinateBuffer.drawA.y.toFixed(2)})\n` +
        `Draw B: (${coordinateBuffer.drawB.x.toFixed(2)}, ${coordinateBuffer.drawB.y.toFixed(2)})\n` +
        `Pinch A: (${coordinateBuffer.pinch[0].x.toFixed(2)}, ${coordinateBuffer.pinch[0].y.toFixed(2)})\n` +
        `Pinch B: (${coordinateBuffer.pinch[1].x.toFixed(2)}, ${coordinateBuffer.pinch[1].y.toFixed(2)})`
    });
    coordinateBuffer = {};
  }
}
