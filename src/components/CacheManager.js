"use client";

import { useState } from "react";
import { modelCache } from "@/lib/modelCache";
import { imageCache } from "@/lib/imageCache";
import { videoCache } from "@/lib/videoCache";

export default function CacheManager() {
  const [modelStats, setModelStats] = useState(null);
  const [imageStats, setImageStats] = useState(null);
  const [videoStats, setVideoStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadAllStats = async () => {
    setLoading(true);
    try {
      const [models, images, videos] = await Promise.all([
        modelCache.getCacheStats(),
        imageCache.getCacheStats(),
        videoCache.getCacheStats(),
      ]);
      setModelStats(models);
      setImageStats(images);
      setVideoStats(videos);
    } catch (error) {
      console.error("Error loading cache stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllCaches = async () => {
    if (
      confirm(
        "Are you sure you want to clear ALL cached data (models, images, and videos)?"
      )
    ) {
      setLoading(true);
      try {
        await Promise.all([
          modelCache.clearAll(),
          imageCache.clearAll(),
          videoCache.clearAll(),
        ]);
        alert("All caches cleared successfully!");
        await loadAllStats();
      } catch (error) {
        console.error("Error clearing caches:", error);
        alert("Failed to clear caches");
      } finally {
        setLoading(false);
      }
    }
  };
  const clearModelCache = async () => {
    if (confirm("Clear all cached 3D models?")) {
      setLoading(true);
      try {
        await modelCache.clearAll();
        alert("Model cache cleared!");
        await loadAllStats();
      } catch (error) {
        console.error("Error clearing model cache:", error);
        alert("Failed to clear model cache");
      } finally {
        setLoading(false);
      }
    }
  };

  const clearImageCache = async () => {
    if (confirm("Clear all cached images?")) {
      setLoading(true);
      try {
        await imageCache.clearAll();
        alert("Image cache cleared!");
        await loadAllStats();
      } catch (error) {
        console.error("Error clearing image cache:", error);
        alert("Failed to clear image cache");
      } finally {
        setLoading(false);
      }
    }
  };

  const clearVideoCache = async () => {
    if (confirm("Clear all cached videos?")) {
      setLoading(true);
      try {
        await videoCache.clearAll();
        alert("Video cache cleared!");
        await loadAllStats();
      } catch (error) {
        console.error("Error clearing video cache:", error);
        alert("Failed to clear video cache");
      } finally {
        setLoading(false);
      }
    }
  };

  const clearOldData = async () => {
    if (confirm("Clear data older than 7 days?")) {
      setLoading(true);
      try {
        const [modelCount, imageCount, videoCount] = await Promise.all([
          modelCache.clearOldModels(7),
          imageCache.clearOldImages(7),
          videoCache.clearOldVideos(7),
        ]);
        alert(
          `Cleared ${modelCount} old models, ${imageCount} old images, and ${videoCount} old videos`
        );
        await loadAllStats();
      } catch (error) {
        console.error("Error clearing old data:", error);
        alert("Failed to clear old data");
      } finally {
        setLoading(false);
      }
    }
  };

  const totalCacheSize = (
    parseFloat(modelStats?.totalSizeMB || 0) +
    parseFloat(imageStats?.totalSizeMB || 0) +
    parseFloat(videoStats?.totalSizeMB || 0)
  ).toFixed(2);

  const totalCacheCount =
    (modelStats?.count || 0) +
    (imageStats?.count || 0) +
    (videoStats?.count || 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Cache Manager</h2>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={loadAllStats}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Loading..." : "Load Cache Stats"}
        </button>
        <button
          onClick={clearOldData}
          disabled={loading || !modelStats}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 transition-colors"
        >
          Clear Old Data (7+ days)
        </button>
        <button
          onClick={clearAllCaches}
          disabled={loading || !modelStats}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          Clear All Caches
        </button>
      </div>

      {/* Overall Stats */}
      {(modelStats || imageStats || videoStats) && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Overall Statistics</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Items</p>
              <p className="text-4xl font-bold text-green-600">
                {totalCacheCount}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Size</p>
              <p className="text-4xl font-bold text-blue-600">
                {totalCacheSize} MB
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* 3D Models Cache */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">3D Models Cache</h3>
            <button
              onClick={clearModelCache}
              disabled={loading || !modelStats}
              className="text-xs px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
            >
              Clear
            </button>
          </div>

          {modelStats && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Models</p>
                  <p className="text-2xl font-bold text-green-600">
                    {modelStats.count}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Size</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {modelStats.totalSizeMB} MB
                  </p>
                </div>
              </div>

              {modelStats.models.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Cached Files:
                  </p>
                  {modelStats.models.map((model, index) => (
                    <div
                      key={index}
                      className="text-xs bg-gray-50 p-2 rounded border border-gray-200"
                    >
                      <p className="font-mono truncate text-gray-600">
                        {model.url.split("/").pop()}
                      </p>
                      <div className="flex justify-between mt-1 text-gray-500">
                        <span>{model.size}</span>
                        <span>{model.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Images Cache */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Images Cache</h3>
            <button
              onClick={clearImageCache}
              disabled={loading || !imageStats}
              className="text-xs px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
            >
              Clear
            </button>
          </div>

          {imageStats && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-purple-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Images</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {imageStats.count}
                  </p>
                </div>
                <div className="bg-pink-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Size</p>
                  <p className="text-2xl font-bold text-pink-600">
                    {imageStats.totalSizeMB} MB
                  </p>
                </div>
              </div>

              {/* By Type Breakdown */}
              {imageStats.byType && (
                <div className="mb-4 p-3 bg-gray-50 rounded">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    By Type:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(imageStats.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="text-gray-600 capitalize">
                          {type}:
                        </span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {imageStats.images.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Recent Files:
                  </p>
                  {imageStats.images.slice(0, 10).map((image, index) => (
                    <div
                      key={index}
                      className="text-xs bg-gray-50 p-2 rounded border border-gray-200"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                          {image.type}
                        </span>
                        <p className="font-mono truncate text-gray-600 flex-1">
                          {image.url.split("/").pop()?.substring(0, 30)}...
                        </p>
                      </div>
                      <div className="flex justify-between mt-1 text-gray-500">
                        <span>{image.size}</span>
                        <span>{image.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Videos Cache */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Videos Cache</h3>
            <button
              onClick={clearVideoCache}
              disabled={loading || !videoStats}
              className="text-xs px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
            >
              Clear
            </button>
          </div>

          {videoStats && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-orange-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Videos</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {videoStats.count}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <p className="text-xs text-gray-600">Size</p>
                  <p className="text-2xl font-bold text-red-600">
                    {videoStats.totalSizeMB} MB
                  </p>
                </div>
              </div>

              {videoStats.videos.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-2">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Cached Files:
                  </p>
                  {videoStats.videos.map((video, index) => (
                    <div
                      key={index}
                      className="text-xs bg-gray-50 p-2 rounded border border-gray-200"
                    >
                      <p className="font-mono truncate text-gray-600">
                        {video.name}
                      </p>
                      <div className="flex justify-between mt-1 text-gray-500">
                        <span>{video.size}</span>
                        <span>{video.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2">ℹ️ About Caching</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>
            All images, videos, and 3D models are cached automatically on first
            load
          </li>
          <li>Cache persists across browser sessions using IndexedDB</li>
          <li>Reduces server requests and improves loading speed</li>
          <li>Clear cache if experiencing loading issues</li>
          <li>Old data cleanup removes files older than 7 days</li>
        </ul>
      </div>
    </div>
  );
}
