
/**
 * Generic object pool for reusing objects to reduce garbage collection
 * Phase 2B-1: Low-risk object pooling implementation
 */

interface PoolableObject {
  reset?(): void;
}

interface PoolConfig<T> {
  createFn: () => T;
  resetFn?: (obj: T) => void;
  maxSize?: number;
  initialSize?: number;
}

class ObjectPool<T extends PoolableObject> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (obj: T) => void;
  private maxSize: number;
  
  constructor(config: PoolConfig<T>) {
    this.createFn = config.createFn;
    this.resetFn = config.resetFn;
    this.maxSize = config.maxSize || 50;
    
    // Pre-populate pool
    const initialSize = config.initialSize || Math.min(5, this.maxSize);
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      // Reset object state
      if (this.resetFn) {
        this.resetFn(obj);
      } else if (obj.reset) {
        obj.reset();
      }
      
      this.pool.push(obj);
    }
  }

  clear(): void {
    this.pool.length = 0;
  }

  get size(): number {
    return this.pool.length;
  }
}

// Type definitions for pooled objects
interface PooledPoint extends PoolableObject {
  x: number;
  y: number;
}

interface PooledBounds extends PoolableObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PooledTransform extends PoolableObject {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

interface PooledCalculationResult extends PoolableObject {
  result: number;
  valid: boolean;
  metadata: any;
}

// Specific pools for whiteboard objects
export const pointPool = new ObjectPool<PooledPoint>({
  createFn: (): PooledPoint => ({ x: 0, y: 0 }),
  resetFn: (point) => {
    point.x = 0;
    point.y = 0;
  },
  maxSize: 100,
  initialSize: 10
});

export const boundsPool = new ObjectPool<PooledBounds>({
  createFn: (): PooledBounds => ({ x: 0, y: 0, width: 0, height: 0 }),
  resetFn: (bounds) => {
    bounds.x = 0;
    bounds.y = 0;
    bounds.width = 0;
    bounds.height = 0;
  },
  maxSize: 20,
  initialSize: 5
});

export const transformDataPool = new ObjectPool<PooledTransform>({
  createFn: (): PooledTransform => ({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }),
  resetFn: (transform) => {
    transform.x = 0;
    transform.y = 0;
    transform.scaleX = 1;
    transform.scaleY = 1;
    transform.rotation = 0;
  },
  maxSize: 30,
  initialSize: 5
});

// Calculation result pools for temporary objects
export const calculationResultPool = new ObjectPool<PooledCalculationResult>({
  createFn: (): PooledCalculationResult => ({ result: 0, valid: false, metadata: null }),
  resetFn: (calc) => {
    calc.result = 0;
    calc.valid = false;
    calc.metadata = null;
  },
  maxSize: 50,
  initialSize: 10
});

export { ObjectPool };
export type { PooledPoint, PooledBounds, PooledTransform, PooledCalculationResult };
