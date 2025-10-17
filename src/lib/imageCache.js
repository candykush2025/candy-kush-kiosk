// IndexedDB wrapper for caching image files
class ImageCache {
  constructor() {
    this.dbName = "CandyKushImages";
    this.storeName = "images";
    this.version = 1;
    this.db = null;
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
          objectStore.createIndex("type", "type", { unique: false });
        }
      };
    });
  }

  // Get image from cache
  async getImage(url) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(url);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.blob) {
          console.log("✅ Image loaded from cache:", url);
          resolve(URL.createObjectURL(result.blob));
        } else {
          console.log("❌ Image not in cache:", url);
          resolve(null);
        }
      };
    });
  }

  // Save image to cache
  async saveImage(url, blob, type = "product") {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);
      const data = {
        url: url,
        blob: blob,
        type: type, // 'product', 'category', 'background', etc.
        timestamp: Date.now(),
        size: blob.size,
      };

      const request = objectStore.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(
          "✅ Image saved to cache:",
          url,
          `(${(blob.size / 1024).toFixed(2)} KB)`
        );
        resolve();
      };
    });
  }

  // Download and cache image from URL
  async downloadAndCache(url, type = "product") {
    try {
      console.log("📥 Downloading image from Firebase:", url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      await this.saveImage(url, blob, type);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error downloading image:", error);
      throw error;
    }
  }

  // Get image with caching (main function to use)
  async getCachedImage(url, type = "product") {
    if (!url) return null;

    try {
      // Try to get from cache first
      const cachedUrl = await this.getImage(url);
      if (cachedUrl) {
        return cachedUrl;
      }

      // If not in cache, download and cache it
      return await this.downloadAndCache(url, type);
    } catch (error) {
      console.error("Error getting cached image:", error);
      // Fallback to original URL if caching fails
      return url;
    }
  }

  // Clear old cached images (optional cleanup)
  async clearOldImages(daysOld = 30) {
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
          console.log(`🗑️ Cleared ${deletedCount} old cached images`);
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
        const images = request.result;
        const totalSize = images.reduce((sum, img) => sum + (img.size || 0), 0);

        // Group by type
        const byType = images.reduce((acc, img) => {
          acc[img.type] = (acc[img.type] || 0) + 1;
          return acc;
        }, {});

        resolve({
          count: images.length,
          totalSize: totalSize,
          totalSizeKB: (totalSize / 1024).toFixed(2),
          totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
          byType: byType,
          images: images.map((img) => ({
            url: img.url,
            type: img.type,
            size: (img.size / 1024).toFixed(2) + " KB",
            timestamp: new Date(img.timestamp).toLocaleString(),
          })),
        });
      };
    });
  }

  // Clear images by type
  async clearByType(type) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index("type");
      const request = index.openCursor(IDBKeyRange.only(type));

      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          objectStore.delete(cursor.primaryKey);
          deletedCount++;
          cursor.continue();
        } else {
          console.log(`🗑️ Cleared ${deletedCount} ${type} images from cache`);
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Clear all cached images
  async clearAll() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log("🗑️ All cached images cleared");
        resolve();
      };
    });
  }

  // Preload images for faster access
  async preloadImages(urls, type = "product") {
    const promises = urls.map((url) => this.getCachedImage(url, type));
    const results = await Promise.allSettled(promises);
    const successful = results.filter((r) => r.status === "fulfilled").length;
    console.log(`📦 Preloaded ${successful}/${urls.length} images`);
    return successful;
  }
}

// Export singleton instance
export const imageCache = new ImageCache();
