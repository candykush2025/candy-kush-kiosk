"use client";

import { useState, useEffect, useRef } from "react";
import { videoCache } from "@/lib/videoCache";

export default function CachedVideo({
  src,
  name = "video",
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
  className = "",
  style = {},
  onClick,
  showLoading = true,
  ...props
}) {
  const [cachedSrc, setCachedSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const videoRef = useRef(null);
  const blobUrlRef = useRef(null); // Keep track of blob URL for cleanup

  useEffect(() => {
    let isMounted = true;

    const loadVideo = async () => {
      if (!src) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setLoadingProgress(0);

        console.log("🎬 Loading video:", src);

        // Get cached video or download with progress
        const url = await videoCache.getCachedVideo(src, name, (progress) => {
          if (isMounted) {
            setLoadingProgress(progress);
          }
        });

        if (isMounted) {
          // Revoke old blob URL if exists
          if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
            URL.revokeObjectURL(blobUrlRef.current);
          }
          
          blobUrlRef.current = url;
          setCachedSrc(url);
          setLoadingProgress(100);

          // Small delay to show 100% before hiding loader
          setTimeout(() => {
            setLoading(false);
          }, 300);
        }
      } catch (err) {
        console.error("Error loading cached video:", err);
        if (isMounted) {
          setError("Failed to load video");
          setLoading(false);
          // Fallback to original URL
          setCachedSrc(src);
        }
      }
    };

    loadVideo();

    return () => {
      isMounted = false;
      // Cleanup blob URL on unmount
      if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [src, name]);

  if (!src) {
    return null;
  }

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Loading Overlay with Blur Background */}
      {loading && showLoading && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          {/* Loading Animation */}
          <div className="relative w-24 h-24 mb-4">
            <div className="absolute inset-0 animate-spin-slow">
              <div className="w-full h-full border-4 border-green-500 border-t-transparent rounded-full"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-center">
            <p className="text-white font-medium mb-2 text-xl">Loading Video</p>

            {/* Progress Bar */}
            <div className="w-64 h-3 bg-gray-700 bg-opacity-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>

            {/* Progress Percentage */}
            <p className="text-sm text-gray-300 mt-2 font-semibold">
              {loadingProgress}%
            </p>
          </div>

          {/* Animated Dots */}
          <div className="flex gap-1 mt-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce animation-delay-100"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-bounce animation-delay-200"></div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center p-4">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p className="text-white text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Video */}
      {cachedSrc && (
        <video
          ref={videoRef}
          src={cachedSrc}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          onClick={onClick}
          className={className}
          style={style}
          {...props}
        >
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
