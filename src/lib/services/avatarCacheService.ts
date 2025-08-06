/**
 * Avatar Cache Service
 * 
 * Handles preloading and caching of avatar images to prevent flickering
 * during header animations and scroll events.
 */

interface CachedAvatar {
  url: string;
  blob: Blob;
  cachedAt: number;
  objectUrl: string;
}

class AvatarCacheService {
  private cache = new Map<string, CachedAvatar>();
  private preloadPromises = new Map<string, Promise<string>>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 100; // Maximum number of cached avatars

  /**
   * Preload and cache an avatar image
   */
  async preloadAvatar(url: string): Promise<string> {
    if (!url) return '';

    // Return cached version if available and fresh
    const cached = this.cache.get(url);
    if (cached && this.isCacheFresh(cached)) {
      return cached.objectUrl;
    }

    // Return existing preload promise if in progress
    if (this.preloadPromises.has(url)) {
      return this.preloadPromises.get(url)!;
    }

    // Start new preload
    const preloadPromise = this.fetchAndCacheAvatar(url);
    this.preloadPromises.set(url, preloadPromise);

    try {
      const objectUrl = await preloadPromise;
      this.preloadPromises.delete(url);
      return objectUrl;
    } catch (error) {
      this.preloadPromises.delete(url);
      console.warn('[AvatarCache] Failed to preload avatar:', url, error);
      return url; // Return original URL as fallback
    }
  }

  /**
   * Get cached avatar URL or return original
   */
  getCachedAvatarUrl(url: string): string {
    if (!url) return '';

    const cached = this.cache.get(url);
    if (cached && this.isCacheFresh(cached)) {
      return cached.objectUrl;
    }

    // Start preloading in background if not cached
    this.preloadAvatar(url).catch(() => {
      // Ignore errors in background preloading
    });

    return url; // Return original URL while preloading
  }

  /**
   * Preload multiple avatars (for batch operations)
   */
  async preloadAvatars(urls: string[]): Promise<void> {
    const uniqueUrls = [...new Set(urls.filter(Boolean))];
    
    // Limit concurrent preloads to prevent overwhelming the browser
    const BATCH_SIZE = 5;
    for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
      const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(url => this.preloadAvatar(url))
      );
    }
  }

  /**
   * Clear expired cache entries
   */
  cleanupCache(): void {
    const expiredKeys: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (!this.isCacheFresh(cached)) {
        expiredKeys.push(key);
        // Revoke object URL to free memory
        URL.revokeObjectURL(cached.objectUrl);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    // If still over limit, remove oldest entries
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.cachedAt - b.cachedAt);
      
      const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key, cached]) => {
        URL.revokeObjectURL(cached.objectUrl);
        this.cache.delete(key);
      });
    }

    console.log(`[AvatarCache] Cleanup complete. Cache size: ${this.cache.size}`);
  }

  /**
   * Clear all cached avatars
   */
  clearCache(): void {
    for (const cached of this.cache.values()) {
      URL.revokeObjectURL(cached.objectUrl);
    }
    this.cache.clear();
    this.preloadPromises.clear();
    console.log('[AvatarCache] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      activePreloads: this.preloadPromises.size,
      urls: Array.from(this.cache.keys())
    };
  }

  private async fetchAndCacheAvatar(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        mode: 'cors',
        cache: 'force-cache', // Use browser cache if available
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      
      // Verify it's an image
      if (!blob.type.startsWith('image/')) {
        throw new Error(`Invalid content type: ${blob.type}`);
      }

      const objectUrl = URL.createObjectURL(blob);
      
      // Cache the result
      const cached: CachedAvatar = {
        url,
        blob,
        cachedAt: Date.now(),
        objectUrl
      };

      // Clean up old entry if exists
      const existing = this.cache.get(url);
      if (existing) {
        URL.revokeObjectURL(existing.objectUrl);
      }

      this.cache.set(url, cached);
      
      // Trigger cleanup if cache is getting large
      if (this.cache.size > this.MAX_CACHE_SIZE * 1.2) {
        this.cleanupCache();
      }

      console.log(`[AvatarCache] Cached avatar: ${url}`);
      return objectUrl;

    } catch (error) {
      console.warn(`[AvatarCache] Failed to fetch avatar: ${url}`, error);
      throw error;
    }
  }

  private isCacheFresh(cached: CachedAvatar): boolean {
    return Date.now() - cached.cachedAt < this.CACHE_DURATION;
  }
}

// Export singleton instance
export const avatarCacheService = new AvatarCacheService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    avatarCacheService.clearCache();
  });

  // Periodic cleanup
  setInterval(() => {
    avatarCacheService.cleanupCache();
  }, 5 * 60 * 1000); // Every 5 minutes
}
