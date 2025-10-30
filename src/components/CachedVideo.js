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
  const [videoReady, setVideoReady] = useState(false);
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
        setError(null);
        setLoadingProgress(0);

        console.log("🎬 Loading video:", src);

        // Check if video is already cached
        const cachedUrl = await videoCache.getVideo(src);

        if (cachedUrl) {
          // Video is cached, use it immediately
          console.log("✅ Using cached video");
          if (isMounted) {
            if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
              URL.revokeObjectURL(blobUrlRef.current);
            }
            blobUrlRef.current = cachedUrl;
            setCachedSrc(cachedUrl);
            setLoadingProgress(100);
          }
        } else {
          // Not cached - use original URL immediately for streaming while downloading in background
          console.log("📡 Streaming video from URL while caching...");
          if (isMounted) {
            setCachedSrc(src); // Use original URL for immediate streaming
            setLoadingProgress(0);
          }

          // Download and cache in background (don't await)
          videoCache
            .downloadAndCache(src, name, (progress) => {
              if (isMounted) {
                setLoadingProgress(progress);
                console.log(`📥 Caching progress: ${progress}%`);
              }
            })
            .then(() => {
              console.log("✅ Video cached for next time");
            })
            .catch((err) => {
              console.warn("⚠️ Background caching failed:", err);
            });
        }
      } catch (err) {
        console.error("Error loading cached video:", err);
        if (isMounted) {
          setError("Failed to load video");
          // Fallback to original URL
          setCachedSrc(src);
        }
      }
    };

    loadVideo();

    return () => {
      isMounted = false;
      // Cleanup blob URL on unmount
      if (blobUrlRef.current && blobUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [src, name]);

  if (!src) {
    return null;
  }

  return (
    <div className={`relative w-full h-full ${className}`} style={style}>
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
          autoPlay={false}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          preload="auto"
          onClick={onClick}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            backgroundColor: "#000",
            ...style,
          }}
          onLoadedMetadata={() => {
            console.log("📹 Video metadata loaded - can start buffering");
          }}
          onCanPlay={() => {
            console.log("✅ Video can play - enough buffered");

            // Video has enough data to start playing
            if (!videoReady) {
              setVideoReady(true);
              setLoading(false);

              // Try to play as soon as we can
              if (autoPlay && videoRef.current) {
                const playPromise = videoRef.current.play();

                if (playPromise !== undefined) {
                  playPromise
                    .then(() => {
                      console.log(
                        "✅ Autoplay successful - playing while buffering"
                      );
                    })
                    .catch((err) => {
                      console.error("❌ Autoplay failed:", err);
                      // Try playing muted on iOS
                      if (videoRef.current) {
                        videoRef.current.muted = true;
                        videoRef.current.play().catch((e) => {
                          console.error("❌ Muted autoplay also failed:", e);
                        });
                      }
                    });
                }
              }
            }
          }}
          onLoadedData={() => {
            console.log("✅ Video data loaded - first frame ready");
          }}
          onError={(e) => {
            console.error("❌ Video error:", e);
            console.error("Video src:", cachedSrc);
            setError("Video playback error - check console for details");
            setLoading(false);
          }}
          onCanPlayThrough={() => {
            console.log("✅ Video can play through without buffering");
          }}
          onPlay={() => {
            console.log("▶️ Video started playing");
          }}
          onPause={() => {
            console.log("⏸️ Video paused");
          }}
          onWaiting={() => {
            console.log("⏳ Video waiting/buffering");
          }}
          onPlaying={() => {
            console.log("▶️ Video is now playing");
          }}
          onProgress={() => {
            // Track buffering progress
            if (videoRef.current && videoRef.current.buffered.length > 0) {
              const bufferedEnd = videoRef.current.buffered.end(
                videoRef.current.buffered.length - 1
              );
              const duration = videoRef.current.duration;
              if (duration > 0) {
                const bufferedPercent = (bufferedEnd / duration) * 100;
                console.log(
                  `📊 Video buffered: ${bufferedPercent.toFixed(0)}%`
                );
              }
            }
          }}
          {...props}
        >
          Your browser does not support the video tag.
        </video>
      )}

      {/* Show loading until video is ready */}
      {!videoReady && cachedSrc && showLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg">Preparing video...</p>
          </div>
        </div>
      )}
    </div>
  );
}
