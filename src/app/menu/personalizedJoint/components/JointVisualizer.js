"use client";

import { useEffect, useState } from "react";
import { GiPlantWatering } from "react-icons/gi";
import { FaCheck, FaTimes } from "react-icons/fa";

export default function JointVisualizer({ config }) {
  const [rotate, setRotate] = useState(false);

  useEffect(() => {
    // Trigger rotation animation when config changes
    setRotate(true);
    const timer = setTimeout(() => setRotate(false), 600);
    return () => clearTimeout(timer);
  }, [config]);

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
    <div className="sticky top-8">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-center">Live Preview</h3>

        {/* 3D Joint Visualization */}
        <div className="relative h-[500px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-2xl">
          {/* Background ambient effect */}
          {config.paper && (flowerCount > 0 || hashCount > 0) && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <div className="w-96 h-96 bg-green-500 rounded-full filter blur-3xl animate-pulse"></div>
            </div>
          )}

          {config.paper ? (
            <div
              className={`transition-all duration-600 ${
                rotate ? "rotate-y-180" : ""
              }`}
              style={{
                transformStyle: "preserve-3d",
                perspective: "1000px",
                filter: "drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4))",
              }}
            >
              {/* Joint Body */}
              <div className="relative">
                {/* Filter */}
                <div
                  className="absolute -left-8 top-1/2 transform -translate-y-1/2 z-10"
                  style={{
                    width: filterType === "wide-glass" ? "40px" : "30px",
                    height: "80px",
                  }}
                >
                  <div
                    className="w-full h-full rounded-lg shadow-xl relative overflow-hidden"
                    style={{
                      background:
                        filterType === "paper-filter"
                          ? "linear-gradient(180deg, #d4a574 0%, #c19a6b 50%, #a0826d 100%)"
                          : filterType === "slim-glass"
                          ? "linear-gradient(180deg, rgba(96, 165, 250, 0.9) 0%, rgba(147, 197, 253, 0.95) 50%, rgba(191, 219, 254, 0.9) 100%)"
                          : "linear-gradient(180deg, rgba(129, 140, 248, 0.9) 0%, rgba(165, 180, 252, 0.95) 50%, rgba(199, 210, 254, 0.9) 100%)",
                      boxShadow:
                        filterType !== "paper-filter"
                          ? "0 0 30px rgba(96, 165, 250, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.3)"
                          : "inset 0 2px 6px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3)",
                      border:
                        filterType !== "paper-filter"
                          ? "2px solid rgba(147, 197, 253, 0.5)"
                          : "none",
                    }}
                  >
                    {/* Glass shine effect */}
                    {filterType !== "paper-filter" && (
                      <div
                        className="absolute inset-0 opacity-40"
                        style={{
                          background:
                            "linear-gradient(45deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%)",
                          transform: "translateX(-100%)",
                        }}
                      ></div>
                    )}

                    {/* Spiral pattern for paper filter */}
                    {filterType === "paper-filter" && (
                      <div className="absolute inset-2 opacity-20">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute inset-x-0 h-px bg-black"
                            style={{ top: `${i * 25}%` }}
                          ></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Joint Body */}
                <div
                  className="relative rounded-r-full shadow-2xl overflow-hidden"
                  style={{
                    width: `${baseLength}px`,
                    height: `${width}px`,
                    background: getPaperColor(),
                    boxShadow:
                      "0 10px 40px rgba(0, 0, 0, 0.3), inset 0 2px 10px rgba(255, 255, 255, 0.1), inset 0 -2px 10px rgba(0, 0, 0, 0.2)",
                  }}
                >
                  {/* 3D highlight effect */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0%, transparent 30%, transparent 70%, rgba(0, 0, 0, 0.2) 100%)",
                    }}
                  ></div>
                  {/* Worm visualization (center line) */}
                  {hasWorm && (
                    <div
                      className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2"
                      style={{
                        height: "8px",
                        background:
                          "linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)",
                        boxShadow: "0 0 10px rgba(245, 158, 11, 0.6)",
                      }}
                    ></div>
                  )}

                  {/* Filling layers visualization */}
                  <div className="absolute inset-2 flex">
                    {/* Show filling composition as color layers */}
                    {config.filling?.flower?.map((flower, index) => {
                      const startPercent = config.filling.flower
                        .slice(0, index)
                        .reduce((sum, f) => sum + f.percentage, 0);
                      return (
                        <div
                          key={flower.id}
                          className="absolute inset-y-0"
                          style={{
                            left: `${startPercent}%`,
                            width: `${flower.percentage}%`,
                            background:
                              flower.type === "sativa"
                                ? "linear-gradient(180deg, #10b981 0%, #34d399 100%)"
                                : flower.type === "indica"
                                ? "linear-gradient(180deg, #8b5cf6 0%, #a78bfa 100%)"
                                : "linear-gradient(180deg, #f59e0b 0%, #fbbf24 100%)",
                            opacity: 0.6,
                            filter: "blur(2px)",
                          }}
                        ></div>
                      );
                    })}
                    {config.filling?.hash?.map((hash, index) => {
                      const flowerPercent = config.filling.flower.reduce(
                        (sum, f) => sum + f.percentage,
                        0
                      );
                      const startPercent =
                        flowerPercent +
                        config.filling.hash
                          .slice(0, index)
                          .reduce((sum, h) => sum + h.percentage, 0);
                      return (
                        <div
                          key={hash.id}
                          className="absolute inset-y-0"
                          style={{
                            left: `${startPercent}%`,
                            width: `${hash.percentage}%`,
                            background:
                              "linear-gradient(180deg, #78350f 0%, #92400e 100%)",
                            opacity: 0.8,
                            filter: "blur(1px)",
                          }}
                        ></div>
                      );
                    })}
                  </div>

                  {/* External coating overlay */}
                  {hasCoating &&
                    config.external?.coating?.id !== "rosin-spiral" && (
                      <div
                        className="absolute inset-0 opacity-70 animate-shimmer"
                        style={{
                          background: getExternalColor(),
                          mixBlendMode: "overlay",
                        }}
                      ></div>
                    )}

                  {/* Spiral wrap effect */}
                  {config.external?.wrap?.id === "rosin-spiral" && (
                    <div className="absolute inset-0">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute h-2 opacity-70"
                          style={{
                            left: `${i * 12}%`,
                            top: `${20 + i * 5}%`,
                            width: "15%",
                            background: getExternalColor(),
                            transform: `rotate(${-30 + i * 5}deg)`,
                            boxShadow: "0 0 10px rgba(245, 158, 11, 0.6)",
                          }}
                        ></div>
                      ))}
                    </div>
                  )}

                  {/* Sparkle effects for special coatings */}
                  {(config.external?.coating?.id === "kief-coating" ||
                    config.external?.coating?.id === "rosin-kief-combo") && (
                    <div className="absolute inset-0">
                      {[...Array(15)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-white rounded-full animate-sparkle"
                          style={{
                            left: `${Math.random() * 90 + 5}%`,
                            top: `${Math.random() * 90 + 5}%`,
                            animationDelay: `${Math.random() * 2}s`,
                          }}
                        ></div>
                      ))}
                    </div>
                  )}

                  {/* Twist lines for realism */}
                  <div className="absolute inset-0 opacity-20">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute h-px bg-black/30"
                        style={{
                          left: "0",
                          right: "0",
                          top: `${20 + i * 15}%`,
                          transform: `rotate(${-2 + i * 0.5}deg)`,
                        }}
                      ></div>
                    ))}
                  </div>

                  {/* Burning tip (if filled) */}
                  {(flowerCount > 0 || hashCount > 0) && (
                    <div className="absolute -right-2 top-1/2 transform -translate-y-1/2">
                      <div className="relative">
                        {/* Cherry (burning tip) */}
                        <div className="w-8 h-8 bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 rounded-full animate-pulse shadow-2xl shadow-orange-500/50">
                          <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-400 rounded-full animate-ping opacity-75"></div>
                          <div className="absolute inset-1 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full blur-sm"></div>
                        </div>

                        {/* Multiple smoke streams - ENHANCED VISIBILITY */}
                        {[...Array(7)].map((_, i) => {
                          const xOffset = (i - 3) * 8;
                          return (
                            <div
                              key={i}
                              className="absolute animate-smoke"
                              style={{
                                bottom: "100%",
                                left: `calc(50% + ${xOffset}px)`,
                                width: `${6 + i * 3}px`,
                                height: `${60 + i * 25}px`,
                                background: `linear-gradient(to top, 
                                  rgba(220, 220, 230, ${0.95 - i * 0.1}), 
                                  rgba(200, 210, 220, ${0.7 - i * 0.08}), 
                                  rgba(180, 190, 200, ${0.4 - i * 0.05}), 
                                  transparent)`,
                                filter: `blur(${4 + i * 2}px)`,
                                animationDelay: `${i * 0.15}s`,
                                animationDuration: `${2.5 + i * 0.4}s`,
                                transform: "translateX(-50%)",
                                boxShadow: `0 0 ${
                                  8 + i * 2
                                }px rgba(255, 255, 255, 0.3)`,
                              }}
                            ></div>
                          );
                        })}

                        {/* Wispy smoke particles - ENHANCED VISIBILITY */}
                        {[...Array(12)].map((_, i) => {
                          const xOffset = ((i % 3) - 1) * 15 + Math.sin(i) * 10;
                          const particleSize = 5 + (i % 3) * 2;
                          return (
                            <div
                              key={`particle-${i}`}
                              className="absolute animate-smokeParticle"
                              style={{
                                width: `${particleSize}px`,
                                height: `${particleSize}px`,
                                borderRadius: "50%",
                                background: `radial-gradient(circle, rgba(240, 240, 250, ${
                                  0.85 - i * 0.04
                                }), rgba(200, 210, 220, ${0.5 - i * 0.03}))`,
                                bottom: "100%",
                                left: `calc(50% + ${xOffset}px)`,
                                filter: `blur(${2 + (i % 3)}px)`,
                                animationDelay: `${i * 0.25}s`,
                                animationDuration: `${3.5 + (i % 4) * 0.5}s`,
                                boxShadow: `0 0 ${
                                  4 + (i % 2) * 2
                                }px rgba(255, 255, 255, 0.4)`,
                              }}
                            ></div>
                          );
                        })}

                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-orange-400 rounded-full blur-md opacity-50 animate-glow"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-green-200">
              <GiPlantWatering className="w-24 h-24 mb-4 mx-auto text-green-400 animate-pulse" />
              <p className="text-lg font-medium">
                Select a paper to start building your custom joint
              </p>
              <p className="text-sm mt-2 text-green-300">
                Choose from pre-rolled cones, hemp wraps, or custom papers
              </p>
            </div>
          )}
        </div>

        {/* Specifications */}
        <div className="mt-6 p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl space-y-3 text-sm border border-green-500/20 backdrop-blur-sm">
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
                  <FaCheck className="text-green-400" /> Yes
                </>
              ) : (
                <>
                  <FaTimes className="text-red-400" /> No
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
                  <FaCheck className="text-green-400" /> Yes
                </>
              ) : (
                <>
                  <FaTimes className="text-red-400" /> No
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
            opacity: 1;
            transform: translateY(0) scale(0.7) rotate(0deg);
          }
          20% {
            opacity: 0.85;
            transform: translateY(-25px) scale(1.1) rotate(10deg);
          }
          40% {
            opacity: 0.65;
            transform: translateY(-50px) scale(1.5) rotate(-5deg);
          }
          60% {
            opacity: 0.45;
            transform: translateY(-80px) scale(2) rotate(15deg);
          }
          80% {
            opacity: 0.2;
            transform: translateY(-110px) scale(2.5) rotate(-10deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-140px) scale(3) rotate(5deg);
          }
        }
        @keyframes smokeParticle {
          0% {
            opacity: 0.9;
            transform: translateY(0) translateX(0) scale(1) rotate(0deg);
          }
          25% {
            opacity: 0.7;
            transform: translateY(-30px) translateX(var(--drift, 10px))
              scale(1.4) rotate(120deg);
          }
          50% {
            opacity: 0.5;
            transform: translateY(-65px) translateX(var(--drift, 20px))
              scale(1.7) rotate(240deg);
          }
          75% {
            opacity: 0.25;
            transform: translateY(-100px) translateX(var(--drift, 30px))
              scale(1.3) rotate(360deg);
          }
          100% {
            opacity: 0;
            transform: translateY(-130px) translateX(var(--drift, 35px))
              scale(0.8) rotate(480deg);
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
        .animate-smoke {
          animation: smoke ease-out infinite;
        }
        .animate-smokeParticle {
          animation: smokeParticle ease-out infinite;
          --drift: ${Math.random() * 30 - 15}px;
        }
        .animate-glow {
          animation: glow 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
