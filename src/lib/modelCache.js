// IndexedDB wrapper for caching 3D model files
class ModelCache {
  constructor() {
    this.dbName = "CandyKush3DModels";
    this.storeName = "models";
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
        }
      };
    });
  }

  // Get model from cache
  async getModel(url) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.get(url);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.blob) {
          console.log("✅ Model loaded from cache:", url);
          resolve(URL.createObjectURL(result.blob));
        } else {
          console.log("❌ Model not in cache:", url);
          resolve(null);
        }
      };
    });
  }

  // Save model to cache
  async saveModel(url, blob) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);
      const data = {
        url: url,
        blob: blob,
        timestamp: Date.now(),
        size: blob.size,
      };

      const request = objectStore.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log(
          "✅ Model saved to cache:",
          url,
          `(${(blob.size / 1024 / 1024).toFixed(2)} MB)`
        );
        resolve();
      };
    });
  }

  // Download and cache model from URL
  async downloadAndCache(url) {
    try {
      console.log("📥 Downloading model from Firebase:", url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      await this.saveModel(url, blob);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error downloading model:", error);
      throw error;
    }
  }

  // Get model with caching (main function to use)
  async getCachedModel(url) {
    if (!url) return null;

    try {
      // Try to get from cache first
      const cachedUrl = await this.getModel(url);
      if (cachedUrl) {
        return cachedUrl;
      }

      // If not in cache, download and cache it
      return await this.downloadAndCache(url);
    } catch (error) {
      console.error("Error getting cached model:", error);
      // Fallback to original URL if caching fails
      return url;
    }
  }

  // Clear old cached models (optional cleanup)
  async clearOldModels(daysOld = 7) {
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
          console.log(`🗑️ Cleared ${deletedCount} old cached models`);
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
        const models = request.result;
        const totalSize = models.reduce(
          (sum, model) => sum + (model.size || 0),
          0
        );
        resolve({
          count: models.length,
          totalSize: totalSize,
          totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
          models: models.map((m) => ({
            url: m.url,
            size: (m.size / 1024 / 1024).toFixed(2) + " MB",
            timestamp: new Date(m.timestamp).toLocaleString(),
          })),
        });
      };
    });
  }

  // Clear all cached models
  async clearAll() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);
      const request = objectStore.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log("🗑️ All cached models cleared");
        resolve();
      };
    });
  }
}

// Export singleton instance
export const modelCache = new ModelCache();
