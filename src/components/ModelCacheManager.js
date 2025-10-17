"use client";

import { useState } from "react";
import { modelCache } from "@/lib/modelCache";

export default function ModelCacheManager() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const cacheStats = await modelCache.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error("Error loading cache stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async () => {
    if (confirm("Are you sure you want to clear all cached 3D models?")) {
      setLoading(true);
      try {
        await modelCache.clearAll();
        alert("Cache cleared successfully!");
        await loadStats();
      } catch (error) {
        console.error("Error clearing cache:", error);
        alert("Failed to clear cache");
      } finally {
        setLoading(false);
      }
    }
  };

  const clearOldModels = async () => {
    if (confirm("Clear models older than 7 days from cache?")) {
      setLoading(true);
      try {
        const count = await modelCache.clearOldModels(7);
        alert(`Cleared ${count} old models from cache`);
        await loadStats();
      } catch (error) {
        console.error("Error clearing old models:", error);
        alert("Failed to clear old models");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">3D Model Cache Manager</h2>

      <div className="space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={loadStats}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load Cache Stats"}
          </button>
          <button
            onClick={clearOldModels}
            disabled={loading || !stats}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            Clear Old Models (7+ days)
          </button>
          <button
            onClick={clearCache}
            disabled={loading || !stats}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            Clear All Cache
          </button>
        </div>

        {/* Cache Stats */}
        {stats && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Cache Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Models</p>
                <p className="text-2xl font-bold">{stats.count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Size</p>
                <p className="text-2xl font-bold">{stats.totalSizeMB} MB</p>
              </div>
            </div>

            {/* Model List */}
            {stats.models.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Cached Models:</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {stats.models.map((model, index) => (
                    <div
                      key={index}
                      className="text-xs bg-gray-50 p-2 rounded border border-gray-200"
                    >
                      <p className="font-mono truncate text-gray-600">
                        {model.url}
                      </p>
                      <div className="flex justify-between mt-1 text-gray-500">
                        <span>Size: {model.size}</span>
                        <span>Cached: {model.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">ℹ️ About Cache</p>
          <ul className="list-disc list-inside space-y-1">
            <li>3D models are automatically cached for faster loading</li>
            <li>Cache is stored in your browser&apos;s IndexedDB</li>
            <li>Models are cached when first viewed or edited</li>
            <li>Clear cache if having loading issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
