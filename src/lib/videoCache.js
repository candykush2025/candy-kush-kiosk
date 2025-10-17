// IndexedDB wrapper for caching video files
class VideoCache {
  constructor() {
    this.dbName = "CandyKushVideos";
    this.storeName = "videos";
    this.version = 1;
    this.db = null;
    this.blobUrlCache = new Map(); // Cache blob URLs to avoid recreating them
  }

  // Initialize IndexedDB
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, {
            keyPath: "url",
          });
          objectStore.createIndex("timestamp", "timestamp", { unique: false });
          objectStore.createIndex("name", "name", { unique: false });
        }
      };
    });
  }

  // Get video from cache
  async getVideo(url) {
    if (!this.db) await this.init();

    // Check if we already have a blob URL cached in memory
    if (this.blobUrlCache.has(url)) {
      console.log("✅ Video blob URL from memory cache:", url);
      return this.blobUrlCache.get(url);
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(url);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.blob) {
          console.log("✅ Video loaded from IndexedDB:", url);
          const blobUrl = URL.createObjectURL(result.blob);
          // Cache the blob URL in memory to avoid recreating it
          this.blobUrlCache.set(url, blobUrl);
          resolve(blobUrl);
        } else {
          console.log("❌ Video not in cache:", url);
          resolve(null);
        }
      };
    });
  }

  // Save video to cache
  async saveVideo(url, blob, name = "video") {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);
      const data = {
        url: url,
        blob: blob,
        name: name,
        timestamp: Date.now(),
        size: blob.size,
      };

      const request = objectStore.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(
          "✅ Video saved to cache:",
          url,
          `(${(blob.size / 1024 / 1024).toFixed(2)} MB)`
        );
        resolve();
      };
    });
  }

  // Download and cache video from URL with progress callback
  async downloadAndCache(url, name = "video", onProgress = null) {
    try {
      console.log("📥 Downloading video from Firebase:", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get content length for progress tracking
      const contentLength = response.headers.get("content-length");
      const total = parseInt(contentLength, 10);

      let loaded = 0;
      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        loaded += value.length;

        // Report progress
        if (onProgress && total) {
          const progress = Math.round((loaded / total) * 100);
          onProgress(progress);
        }
      }

      // Combine chunks into blob
      const blob = new Blob(chunks, { type: "video/mp4" });
      await this.saveVideo(url, blob, name);
      const blobUrl = URL.createObjectURL(blob);
      // Cache the blob URL in memory
      this.blobUrlCache.set(url, blobUrl);
      return blobUrl;
    } catch (error) {
      console.error("Error downloading video:", error);
      throw error;
    }
  }

  // Get video with caching (main function to use)
  async getCachedVideo(url, name = "video", onProgress = null) {
    if (!url) return null;

    try {
      // Try to get from cache first
      const cachedUrl = await this.getVideo(url);
      if (cachedUrl) {
        if (onProgress) onProgress(100);
        return cachedUrl;
      }

      // If not in cache, download and cache it
      return await this.downloadAndCache(url, name, onProgress);
    } catch (error) {
      console.error("Error getting cached video:", error);
      // Fallback to original URL if caching fails
      return url;
    }
  }

  // Clear old cached videos (optional cleanup)
  async clearOldVideos(daysOld = 7) {
    if (!this.db) await this.init();

    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index("timestamp");
      const range = IDBKeyRange.upperBound(cutoffTime);
      const request = index.openCursor(range);

      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          objectStore.delete(cursor.primaryKey);
          deletedCount++;
          cursor.continue();
        } else {
          console.log(`🗑️ Cleared ${deletedCount} old cached videos`);
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Get cache statistics
  async getCacheStats() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const videos = request.result;
        const totalSize = videos.reduce((sum, vid) => sum + (vid.size || 0), 0);

        resolve({
          count: videos.length,
          totalSize: totalSize,
          totalSizeKB: (totalSize / 1024).toFixed(2),
          totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
          videos: videos.map((vid) => ({
            url: vid.url,
            name: vid.name,
            size: (vid.size / 1024 / 1024).toFixed(2) + " MB",
            timestamp: new Date(vid.timestamp).toLocaleString(),
          })),
        });
      };
    });
  }

  // Clear blob URLs from memory
  clearBlobUrls() {
    for (const blobUrl of this.blobUrlCache.values()) {
      URL.revokeObjectURL(blobUrl);
    }
    this.blobUrlCache.clear();
    console.log("🗑️ All blob URLs revoked");
  }

  // Clear all cached videos
  async clearAll() {
    if (!this.db) await this.init();

    // Clear blob URLs first
    this.clearBlobUrls();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log("🗑️ All cached videos cleared");
        resolve();
      };
    });
  }
}

// Export singleton instance
export const videoCache = new VideoCache();
