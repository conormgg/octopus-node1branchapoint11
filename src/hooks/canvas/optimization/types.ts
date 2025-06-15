
export interface LayerCacheConfig {
  enableStaticCaching: boolean;
  cacheThreshold: number; // Number of objects before enabling cache
  maxCacheAge: number; // Max time in ms before cache refresh
}

export interface PerformanceMetrics {
  cacheHits: number;
  cacheMisses: number;
  totalOptimizedUpdates: number;
}

export interface LayerCacheState {
  lastCacheTime: number;
  staticObjectCount: number;
  performanceMetrics: PerformanceMetrics;
}
