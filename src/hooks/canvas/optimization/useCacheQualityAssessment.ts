import { useCallback, useRef } from 'react';
import Konva from 'konva';
import { createDebugLogger } from '@/utils/debug/debugConfig';

const debugLog = createDebugLogger('layerOptimization');

interface CacheQuality {
  score: number; // 0-1 scale
  renderTimeBenefit: number;
  memoryEfficiency: number;
  updateFrequency: number;
}

export const useCacheQualityAssessment = (
  layerRef: React.RefObject<Konva.Layer>
) => {
  const qualityHistory = useRef<CacheQuality[]>([]);
  const renderTimings = useRef<number[]>([]);

  // Assess cache quality based on multiple factors
  const assessCacheQuality = useCallback((): CacheQuality => {
    if (!layerRef.current) {
      return { score: 0, renderTimeBenefit: 0, memoryEfficiency: 0, updateFrequency: 0 };
    }

    const layer = layerRef.current;
    const objectCount = layer.children.length;
    
    // Calculate render time benefit (estimated)
    const avgRenderTime = renderTimings.current.length > 0 
      ? renderTimings.current.reduce((a, b) => a + b, 0) / renderTimings.current.length 
      : 5;
    
    const renderTimeBenefit = Math.min(avgRenderTime / 10, 1); // Normalize to 0-1
    
    // Memory efficiency (simulated - based on object complexity)
    const memoryEfficiency = Math.max(0, 1 - (objectCount / 100)); // Assume efficiency decreases with complexity
    
    // Update frequency (lower is better for caching)
    const recentUpdates = qualityHistory.current.slice(-5);
    const updateFrequency = recentUpdates.length > 0 
      ? 1 - (recentUpdates.filter(q => q.score > 0.5).length / recentUpdates.length)
      : 0.5;
    
    // Overall score (weighted average)
    const score = (renderTimeBenefit * 0.4 + memoryEfficiency * 0.3 + updateFrequency * 0.3);
    
    const quality: CacheQuality = {
      score,
      renderTimeBenefit,
      memoryEfficiency,
      updateFrequency
    };
    
    // Keep history limited
    qualityHistory.current.push(quality);
    if (qualityHistory.current.length > 10) {
      qualityHistory.current.shift();
    }
    
    debugLog('Phase2D3', 'Cache quality assessed', {
      score: score.toFixed(2),
      renderBenefit: renderTimeBenefit.toFixed(2),
      memoryEff: memoryEfficiency.toFixed(2),
      updateFreq: updateFrequency.toFixed(2),
      objectCount
    });
    
    return quality;
  }, [layerRef]);

  // Record render timing for quality assessment
  const recordRenderTiming = useCallback((duration: number) => {
    renderTimings.current.push(duration);
    if (renderTimings.current.length > 20) {
      renderTimings.current.shift();
    }
  }, []);

  // Get cache recommendation based on quality
  const getCacheRecommendation = useCallback((): 'enable' | 'disable' | 'maintain' => {
    const quality = assessCacheQuality();
    
    if (quality.score > 0.7) return 'enable';
    if (quality.score < 0.3) return 'disable';
    return 'maintain';
  }, [assessCacheQuality]);

  return {
    assessCacheQuality,
    recordRenderTiming,
    getCacheRecommendation,
    getQualityHistory: () => qualityHistory.current
  };
};
