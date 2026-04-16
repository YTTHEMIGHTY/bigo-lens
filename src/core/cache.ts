// ─── BigO Lens — In-Memory Analysis Cache ────────────────────
//
// Caches analysis results to avoid re-parsing unchanged files.
// Uses content hash as key so edits invalidate the cache.

import { FileAnalysis } from './types';

/**
 * Simple hash for cache key generation.
 * Uses djb2 algorithm — fast and sufficient for cache invalidation.
 */
function hashContent(content: string): string {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash + content.charCodeAt(i)) & 0xffffffff;
  }
  return hash.toString(36);
}

const MAX_CACHE_SIZE = 200;

class AnalysisCache {
  private cache = new Map<string, FileAnalysis>();

  get(filePath: string, content: string): FileAnalysis | null {
    const key = this.makeKey(filePath, content);
    return this.cache.get(key) || null;
  }

  set(filePath: string, content: string, analysis: FileAnalysis): void {
    const key = this.makeKey(filePath, content);

    // Evict oldest entries if cache is full
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, analysis);
  }

  invalidate(filePath: string): void {
    // Remove all entries for this file path
    for (const key of this.cache.keys()) {
      if (key.startsWith(filePath + ':')) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  private makeKey(filePath: string, content: string): string {
    return `${filePath}:${hashContent(content)}`;
  }
}

export const analysisCache = new AnalysisCache();
