"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import SmokeEffect from "./SmokeEffect";

export default function JointVisualizer({ config }) {
  const [rotate, setRotate] = useState(false);

  // Memoize config stringify to prevent unnecessary re-renders
  const configString = useMemo(() => JSON.stringify(config), [config]);

  useEffect(() => {
    // Trigger rotation animation when config changes
    setRotate(true);
    const timer = setTimeout(() => setRotate(false), 600);
    return () => clearTimeout(timer);
  }, [configString]);

  const paperType = config.paper?.type || "none";
  const filterType = config.filter?.id || "none";
  const hasWorm = config.filling?.worm !== null;
  const flowerCount = config.filling?.flower?.length || 0;
  const hashCount = config.filling?.hash?.length || 0;
  const hasCoating = config.external?.coating !== null;
  const hasWrap = config.external?.wrap !== null;

  // Calculate joint dimensions
  const baseLength = config.paper?.customLength
    ? config.paper.customLength * 10
    : 150;
  const capacity = config.paper?.capacity || 0;
  const width = Math.min(60, 30 + capacity * 8);

  // Get paper color
  const getPaperColor = () => {
    if (paperType === "golden-paper") {
      return "linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffc107 100%)";
    }
    if (paperType === "hemp-wrap") {
      return "linear-gradient(135deg, #6b4423 0%, #8b5a3c 50%, #654321 100%)";
    }
    return "linear-gradient(135deg, #f5f5f5 0%, #ffffff 50%, #e8e8e8 100%)";
  };

  // Get external effect color
  const getExternalColor = () => {
    if (config.external?.coating?.id === "rosin-kief-combo") {
      return "linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #fbbf24 100%)";
    }
    if (config.external?.coating?.id === "kief-coating") {
      return "linear-gradient(135deg, #10b981 0%, #34d399 100%)";
    }
    if (
      config.external?.coating?.id === "rosin-full-dip" ||
      config.external?.wrap?.id === "rosin-spiral"
    ) {
      return "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)";
    }
    if (config.external?.coating?.id === "oil-coating") {
      return "linear-gradient(135deg, #f97316 0%, #fb923c 100%)";
    }
    return null;
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
      <h3 className="text-xl font-bold mb-4 text-center">Live Preview</h3>

      <div className="grid grid-cols-2 gap-6 items-stretch">
        {/* Left - Visual Preview */}
        <div className="relative w-full h-[360px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-2xl">
          {/* Background ambient effect */}
          {config.paper && (flowerCount > 0 || hashCount > 0) && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="w-96 h-96 bg-green-500 rounded-full filter blur-3xl animate-pulse"></div>
            </div>
          )}

          {/* Spiral Tip Image - Absolute Top Right Corner */}
          {config.external?.wrap?.id === "rosin-spiral" && (
            <div className="absolute right-[10px] top-[10px] z-30">
              <div className="relative">
                {/* Gold/orange glow for spiral */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-transparent blur-md rounded-full scale-90"></div>
                <Image
                  src="/CustomJoint/tip-spiral.png"
                  alt="spiral rosin wrap"
                  width={50}
                  height={50}
                  style={{
                    objectFit: "contain",
                  }}
                  className="relative z-10"
                  priority
                />
              </div>
            </div>
          )}

          {/* M Tip Image - Absolute Top Right Corner (slightly lower if spiral exists) */}
          {(config.external?.wrap?.id === "hash-M" ||
            config.external?.wrap?.id === "rosin-M") && (
            <div
              className={`absolute right-[10px] z-30 ${
                config.external?.wrap?.id === "rosin-spiral"
                  ? "top-[70px]"
                  : "top-[10px]"
              }`}
            >
              <div className="relative">
                {/* Purple glow for M wrap */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-transparent blur-md rounded-full scale-90"></div>
                <Image
                  src="/CustomJoint/tip-M.png"
                  alt="M wrap"
                  width={50}
                  height={50}
                  style={{
                    objectFit: "contain",
                  }}
                  className="relative z-10"
                  priority
                />
              </div>
            </div>
          )}

          {config.paper ? (
            <div className="relative flex items-center justify-center">
              {(() => {
                // Select image based on paper type
                let src = "/CustomJoint/preroll1.png"; // default
                if (paperType.includes("hemp")) src = "/CustomJoint/hemp1.png";
                else if (
                  paperType.includes("gold") ||
                  paperType.includes("golden")
                )
                  src = encodeURI("/CustomJoint/gold foil.png");
                else if (paperType.includes("custom"))
                  src = encodeURI("/CustomJoint/custom paperfinal.png");

                // Select tip image based on filter type
                let tipSrc = null;
                if (
                  filterType.includes("glass") &&
                  filterType.includes("slim")
                ) {
                  tipSrc = "/CustomJoint/tip-slim-glass.png";
                } else if (filterType.includes("glass")) {
                  tipSrc = "/CustomJoint/tip-glass.png";
                } else if (
                  filterType.includes("paper") ||
                  filterType !== "none"
                ) {
                  tipSrc = "/CustomJoint/tip-paper.png";
                }

                return (
                  <div className="relative">
                    {/* Real Joint Image */}
                    <Image
                      src={src}
                      alt="joint preview"
                      width={350}
                      height={200}
                      style={{ objectFit: "contain" }}
                      priority
                    />

                    {/* Filter Tip Image - Rotated and styled */}
                    {tipSrc && (
                      <div className="absolute right-[50px] top-[30%] -translate-y-1/2">
                        <div className="relative">
                          {/* Green gradient glow - smaller and more subtle */}
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent blur-lg rounded-full scale-75"></div>
                          {/* Tip image rotated horizontal */}
                          <Image
                            src={tipSrc}
                            alt="filter tip"
                            width={60}
                            height={60}
                            style={{
                              objectFit: "contain",
                              transform: "rotate(-90deg)",
                            }}
                            className="relative z-10"
                            priority
                          />
                        </div>
                      </div>
                    )}

                    {/* Professional smoke effect using tsparticles library */}
                    <SmokeEffect />
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center text-green-200">
              <div className="w-24 h-24 mb-4 mx-auto flex items-center justify-center text-3xl font-bold bg-green-400/20 rounded-full animate-pulse">
                🌿
              </div>
              <p className="text-lg font-medium">
                Select a paper to start building your custom joint
              </p>
              <p className="text-sm mt-2 text-green-300">
                Choose from pre-rolled cones, hemp wraps, or custom papers
              </p>
            </div>
          )}

          {/* Length Indicator - positioned at bottom of joint */}
          {config.paper?.customLength && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[80%] flex items-center justify-center z-20">
              <div className="flex items-center gap-2 w-full">
                <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-green-400 to-green-400"></div>
                <span className="text-base font-bold px-4 py-1 bg-green-500/30 rounded-full border border-green-400/50 text-green-300 whitespace-nowrap backdrop-blur-sm">
                  {config.paper.customLength}cm
                </span>
                <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-green-400 to-green-400"></div>
              </div>
            </div>
          )}
        </div>

        {/* Right - Order Details */}
        <div className="flex flex-col">
          {/* Specifications */}
          <div className="flex-1 p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl space-y-3 text-sm border border-green-500/20 backdrop-blur-sm flex flex-col justify-center">
            <div className="flex justify-between items-center group hover:bg-white/5 p-2 rounded-lg transition-all">
              <span className="text-green-200 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                Capacity
              </span>
              <span className="font-bold text-lg">{capacity.toFixed(1)}g</span>
            </div>
            <div className="flex justify-between items-center group hover:bg-white/5 p-2 rounded-lg transition-all">
              <span className="text-green-200 flex items-center">
                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                Flower Strains
              </span>
              <span className="font-bold">{flowerCount}</span>
            </div>
            <div className="flex justify-between items-center group hover:bg-white/5 p-2 rounded-lg transition-all">
              <span className="text-green-200 flex items-center">
                <span className="w-2 h-2 bg-amber-400 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                Hash Types
              </span>
              <span className="font-bold">{hashCount}</span>
            </div>
            <div className="flex justify-between items-center group hover:bg-white/5 p-2 rounded-lg transition-all">
              <span className="text-green-200 flex items-center">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                Worm (Donut)
              </span>
              <span className="font-bold flex items-center gap-1">
                {hasWorm ? (
                  <>
                    <span className="text-green-400">✓</span> Yes
                  </>
                ) : (
                  <>
                    <span className="text-red-400">✗</span> No
                  </>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center group hover:bg-white/5 p-2 rounded-lg transition-all">
              <span className="text-green-200 flex items-center">
                <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 group-hover:scale-125 transition-transform"></span>
                External Coating
              </span>
              <span className="font-bold flex items-center gap-1">
                {hasCoating || hasWrap ? (
                  <>
                    <span className="text-green-400">✓</span> Yes
                  </>
                ) : (
                  <>
                    <span className="text-red-400">✗</span> No
                  </>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 mt-2 border-t border-green-500/30 bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-3 rounded-xl">
              <span className="text-green-300 font-semibold text-base">
                Total Price
              </span>
              <span className="font-bold text-2xl text-green-400 animate-pulse">
                ฿{config.totalPrice.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes rotate-y-180 {
            from {
              transform: rotateY(0deg);
            }
            to {
              transform: rotateY(180deg);
            }
          }
          @keyframes shimmer {
            0%,
            100% {
              opacity: 0.5;
            }
            50% {
              opacity: 0.8;
            }
          }
          @keyframes sparkle {
            0%,
            100% {
              opacity: 0;
              transform: scale(0);
            }
            50% {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes smoke {
            0% {
              opacity: 0.5;
              transform: translateY(0) translateX(0) scale(0.8);
            }
            20% {
              opacity: 0.55;
              transform: translateY(-40px) translateX(-30px) scale(1.2);
            }
            40% {
              opacity: 0.5;
              transform: translateY(-85px) translateX(35px) scale(1.6);
            }
            60% {
              opacity: 0.4;
              transform: translateY(-135px) translateX(-25px) scale(2.1);
            }
            80% {
              opacity: 0.2;
              transform: translateY(-190px) translateX(20px) scale(2.6);
            }
            100% {
              opacity: 0;
              transform: translateY(-250px) translateX(-15px) scale(3.2);
            }
          }
          @keyframes smokeParticle {
            0% {
              opacity: 0.6;
              transform: translateY(0) translateX(0) scale(1);
            }
            25% {
              opacity: 0.65;
              transform: translateY(-50px) translateX(-40px) scale(1.4);
            }
            50% {
              opacity: 0.5;
              transform: translateY(-105px) translateX(45px) scale(1.7);
            }
            75% {
              opacity: 0.3;
              transform: translateY(-165px) translateX(-35px) scale(1.5);
            }
            100% {
              opacity: 0;
              transform: translateY(-225px) translateX(30px) scale(1.2);
            }
          }
          @keyframes glow {
            0%,
            100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 0.6;
              transform: scale(1.2);
            }
          }
          .rotate-y-180 {
            animation: rotate-y-180 0.6s ease-in-out;
          }
          .animate-shimmer {
            animation: shimmer 2s ease-in-out infinite;
          }
          .animate-sparkle {
            animation: sparkle 1.5s ease-in-out infinite;
          }
          .animate-glow {
            animation: glow 1s ease-in-out infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
