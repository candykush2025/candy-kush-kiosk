"use client";

import { useState, useEffect } from "react";
import { modelCache } from "@/lib/modelCache";

export default function ModelViewer({
  modelUrl,
  rotationX = 90,
  rotationY = 75,
  rotationZ = 4.0,
  autoRotate = false,
  className = "",
  style = {},
}) {
  const [cachedUrl, setCachedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      if (!modelUrl) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setLoadingProgress(0);

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setLoadingProgress((prev) => {
            if (prev >= 90) return prev;
            return prev + 10;
          });
        }, 100);

        // Get cached model or download
        const url = await modelCache.getCachedModel(modelUrl);

        clearInterval(progressInterval);
        setLoadingProgress(100);

        if (isMounted) {
          setCachedUrl(url);
          // Small delay to show 100% before hiding loader
          setTimeout(() => {
            setLoading(false);
          }, 200);
        }
      } catch (err) {
        console.error("Error loading 3D model:", err);
        if (isMounted) {
          setError("Failed to load 3D model");
          setLoading(false);
          // Fallback to original URL
          setCachedUrl(modelUrl);
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, [modelUrl]);

  if (!modelUrl) {
    return null;
  }

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Loading Overlay with Blur Background */}
      {loading && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          {/* 3D Cube Loading Animation */}
          <div className="relative w-24 h-24 mb-4">
            <div className="absolute inset-0 animate-spin-slow">
              <div className="w-full h-full border-4 border-green-500 border-t-transparent border-r-transparent rounded-lg transform rotate-45"></div>
            </div>
            <div className="absolute inset-0 animate-spin-slow animation-delay-150">
              <div className="w-full h-full border-4 border-green-400 border-b-transparent border-l-transparent rounded-lg transform -rotate-45"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-center">
            <p className="text-white font-medium mb-2">Loading 3D Model</p>

            {/* Progress Bar */}
            <div className="w-48 h-2 bg-gray-700 bg-opacity-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>

            {/* Progress Percentage */}
            <p className="text-xs text-gray-300 mt-2">{loadingProgress}%</p>
          </div>

          {/* Animated Dots */}
          <div className="flex gap-1 mt-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce animation-delay-100"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce animation-delay-200"></div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg">
          <div className="text-center p-4">
            <svg
              className="w-12 h-12 text-red-500 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Model Viewer */}
      {cachedUrl && (
        <model-viewer
          src={cachedUrl}
          alt="3D Model"
          camera-controls
          auto-rotate={autoRotate}
          camera-orbit={`${rotationX || 90}deg ${rotationY || 75}deg ${
            rotationZ || 4.0
          }m`}
          interaction-prompt="none"
          shadow-intensity="1"
          environment-image="neutral"
          exposure="1"
          loading="eager"
          reveal="auto"
          min-camera-orbit="auto auto 0.5m"
          max-camera-orbit="auto auto 50m"
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "transparent",
          }}
        ></model-viewer>
      )}
    </div>
  );
}
