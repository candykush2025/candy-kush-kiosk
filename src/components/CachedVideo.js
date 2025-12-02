"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const [retryCount, setRetryCount] = useState(0);
  const [videoKey, setVideoKey] = useState(0); // Force re-mount video element
  const videoRef = useRef(null);
  const blobUrlRef = useRef(null); // Keep track of blob URL for cleanup
  const healthCheckIntervalRef = useRef(null);
  const stallTimeoutRef = useRef(null);
  const lastPlaybackTimeRef = useRef(0);
  const maxRetries = 10; // Max retries before full page reload
  const retryDelayMs = 2000; // Wait 2 seconds before retry

  // Function to restart video playback
  const restartVideo = useCallback(() => {
    // Clear any existing timeouts
    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = null;
    }

    if (videoRef.current) {
      try {
        // Reset video to beginning
        videoRef.current.currentTime = 0;
        videoRef.current.load();

        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setError(null);
              lastPlaybackTimeRef.current = 0;
            })
            .catch(() => {
              // Try muted play
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current.play().catch(() => {
                  // Force re-mount
                  setVideoKey((prev) => prev + 1);
                });
              }
            });
        }
      } catch (err) {
        // Force re-mount video element
        setVideoKey((prev) => prev + 1);
      }
    }
  }, []);

  // Function to handle video recovery
  const recoverVideo = useCallback(() => {
    setError(null);
    setLoading(true);
    setVideoReady(false);

    if (retryCount >= maxRetries) {
      // Full page reload as last resort for kiosk stability
      window.location.reload();
      return;
    }

    setRetryCount((prev) => prev + 1);

    // Force re-mount video element with new key
    setTimeout(() => {
      setVideoKey((prev) => prev + 1);
    }, retryDelayMs);
  }, [retryCount, maxRetries]);

  // Health check - monitor video playback progress
  useEffect(() => {
    if (!videoReady || !videoRef.current) return;

    // Clear any existing interval
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }

    // Check every 5 seconds if video is progressing
    healthCheckIntervalRef.current = setInterval(() => {
      if (videoRef.current) {
        const currentTime = videoRef.current.currentTime;
        const isPaused = videoRef.current.paused;
        const isEnded = videoRef.current.ended;

        // If video should be playing but hasn't progressed
        if (!isPaused && !isEnded && autoPlay) {
          if (currentTime === lastPlaybackTimeRef.current && currentTime > 0) {
            restartVideo();
          }
        }

        lastPlaybackTimeRef.current = currentTime;

        // Also check if video is paused when it shouldn't be
        if (isPaused && autoPlay && !isEnded) {
          videoRef.current.play().catch(() => {
            restartVideo();
          });
        }
      }
    }, 5000);

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [videoReady, autoPlay, restartVideo]);

  // Auto-recover from error state
  useEffect(() => {
    if (error) {
      const recoveryTimer = setTimeout(() => {
        recoverVideo();
      }, retryDelayMs);

      return () => clearTimeout(recoveryTimer);
    }
  }, [error, recoverVideo]);

  // Visibility change handler - restart video when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        videoRef.current &&
        autoPlay
      ) {
        if (videoRef.current.paused) {
          videoRef.current.play().catch(() => {
            restartVideo();
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [autoPlay, restartVideo]);

  // Memory management - periodically clean up and refresh video source
  useEffect(() => {
    // Every 30 minutes, refresh the video to prevent memory buildup
    const memoryRefreshInterval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const currentTime = videoRef.current.currentTime;
        videoRef.current.load();
        videoRef.current.currentTime = currentTime;
        videoRef.current.play().catch(() => {
          restartVideo();
        });
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(memoryRefreshInterval);
  }, [restartVideo]);

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

        // Check if video is already cached
        const cachedUrl = await videoCache.getVideo(src);

        if (cachedUrl) {
          // Video is cached, use it immediately
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
          if (isMounted) {
            setCachedSrc(src); // Use original URL for immediate streaming
            setLoadingProgress(0);
          }

          // Download and cache in background (don't await)
          videoCache
            .downloadAndCache(src, name, (progress) => {
              if (isMounted) {
                setLoadingProgress(progress);
              }
            })
            .then(() => {
              // Video cached for next time
            })
            .catch(() => {
              // Background caching failed - will retry next time
            });
        }
      } catch (err) {
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
      // Cleanup stall timeout
      if (stallTimeoutRef.current) {
        clearTimeout(stallTimeoutRef.current);
        stallTimeoutRef.current = null;
      }
      // Cleanup health check interval
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }
    };
  }, [src, name, videoKey]); // Added videoKey to re-run when video element is remounted

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

      {/* Error State - Now shows recovery message */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center p-4">
            <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Recovering video...</p>
            <p className="text-gray-400 text-sm mt-2">
              Attempt {retryCount}/{maxRetries}
            </p>
          </div>
        </div>
      )}

      {/* Video */}
      {cachedSrc && (
        <video
          key={videoKey}
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
            // Video metadata loaded - can start buffering
          }}
          onCanPlay={() => {
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
                      // Autoplay successful
                    })
                    .catch(() => {
                      // Try playing muted on iOS
                      if (videoRef.current) {
                        videoRef.current.muted = true;
                        videoRef.current.play().catch(() => {
                          // Muted autoplay also failed - will recover automatically
                        });
                      }
                    });
                }
              }
            }
          }}
          onLoadedData={() => {
            // Video data loaded - first frame ready
          }}
          onError={() => {
            setError("Video playback error - recovering...");
            setLoading(false);
            // Don't need to call recoverVideo here - the useEffect watching error state will handle it
          }}
          onStalled={() => {
            // Set a timeout to recover if stall persists
            if (stallTimeoutRef.current) {
              clearTimeout(stallTimeoutRef.current);
            }
            stallTimeoutRef.current = setTimeout(() => {
              restartVideo();
            }, 5000);
          }}
          onCanPlayThrough={() => {
            // Clear stall timeout if video can play through
            if (stallTimeoutRef.current) {
              clearTimeout(stallTimeoutRef.current);
              stallTimeoutRef.current = null;
            }
          }}
          onEnded={() => {
            // If loop is enabled but video ended, restart it manually as backup
            if (loop && videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.play().catch(() => {
                restartVideo();
              });
            }
          }}
          onPlay={() => {
            // Reset retry count on successful play
            setRetryCount(0);
          }}
          onPause={() => {
            // Video paused
          }}
          onWaiting={() => {
            // Video waiting/buffering
          }}
          onPlaying={() => {
            // Video is now playing
          }}
          onProgress={() => {
            // Track buffering progress - no logging for stability
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
