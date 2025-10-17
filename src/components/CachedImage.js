"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { imageCache } from "@/lib/imageCache";

export default function CachedImage({
  src,
  alt,
  type = "product",
  fill = false,
  width,
  height,
  className = "",
  style = {},
  priority = false,
  showLoading = true,
  ...props
}) {
  const [cachedSrc, setCachedSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!src) {
        setLoading(false);
        return;
      }

      // If it's a local image (starts with /), don't cache
      if (src.startsWith("/")) {
        setCachedSrc(src);
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
        }, 50);

        // Get cached image or download
        const url = await imageCache.getCachedImage(src, type);

        clearInterval(progressInterval);
        setLoadingProgress(100);

        if (isMounted) {
          setCachedSrc(url);
          // Small delay to show 100% before hiding loader
          setTimeout(() => {
            setLoading(false);
          }, 100);
        }
      } catch (err) {
        console.error("Error loading cached image:", err);
        if (isMounted) {
          setError("Failed to load image");
          setLoading(false);
          // Fallback to original URL
          setCachedSrc(src);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [src, type]);

  if (!src) {
    return null;
  }

  return (
    <div className={`relative ${fill ? "w-full h-full" : ""}`}>
      {/* Loading Overlay with Blur Background */}
      {loading && showLoading && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
          }}
        >
          {/* Simple Spinner */}
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 animate-spin">
              <div className="w-full h-full border-4 border-green-500 border-t-transparent rounded-full"></div>
            </div>
          </div>

          {/* Progress Percentage */}
          {loadingProgress > 0 && (
            <p className="text-xs text-white mt-2 font-medium">
              {loadingProgress}%
            </p>
          )}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center p-2">
            <svg
              className="w-8 h-8 text-gray-400 mx-auto mb-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-500 text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Image */}
      {cachedSrc && (
        <Image
          src={cachedSrc}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          className={className}
          style={style}
          priority={priority}
          {...props}
        />
      )}
    </div>
  );
}
