"use client";

import { useEffect, useState } from "react";
import { calculateTotal } from "../utils/pricing";

export default function JointPreview({
  selectedPaper,
  selectedFilter,
  fillingComposition,
  externalCustomization,
  customLength,
}) {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    // Cycle through animation phases for the floating effect
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 3);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const getJointLength = () => {
    if (!selectedPaper) return 100;

    if (selectedPaper.type === "custom") {
      return Math.min(200, customLength * 8); // Scale for display
    }

    // Handle variant-based papers
    if (selectedPaper.selectedVariant) {
      const capacity = selectedPaper.selectedVariant.capacity;
      return capacity <= 0.5 ? 80 : capacity <= 1.0 ? 100 : 120;
    }

    const lengthMap = {
      "hemp-wrap-15": 130,
      "hemp-wrap-20": 140,
      "golden-paper": 110,
    };

    return lengthMap[selectedPaper.id] || 100;
  };

  const getJointWidth = () => {
    if (!selectedPaper) return 8;
    const capacity =
      selectedPaper.selectedVariant?.capacity || selectedPaper.capacity;
    return Math.max(6, Math.min(14, capacity * 8));
  };

  const hasExternalCoating = () => {
    return externalCustomization && externalCustomization.length > 0;
  };

  const getExternalEffect = () => {
    if (!externalCustomization || externalCustomization.length === 0)
      return "none";

    // Check for specific effects in priority order
    if (externalCustomization.find((c) => c.id === "rosin-kief-combo"))
      return "combo";
    if (externalCustomization.find((c) => c.id === "rosin-dip")) return "rosin";
    if (externalCustomization.find((c) => c.id === "rosin-spiral"))
      return "spiral";
    if (externalCustomization.find((c) => c.id === "kief-coating"))
      return "kief";
    if (externalCustomization.find((c) => c.id === "oil-brush")) return "oil";

    return "none";
  };

  const getFillerColors = () => {
    const flowerPercentage = fillingComposition?.flower?.percentage || 70;
    const hashPercentage = fillingComposition?.hash?.percentage || 30;

    return {
      flower: `${flowerPercentage}%`,
      hash: `${hashPercentage}%`,
    };
  };

  const getPaperColor = () => {
    if (!selectedPaper) return "linear-gradient(45deg, #f7fafc, #edf2f7)";

    // Handle variant-based papers (Pre-rolled cones use default white)
    if (selectedPaper.id === "pre-rolled-cone") {
      return "linear-gradient(45deg, #f7fafc, #edf2f7)";
    }

    switch (selectedPaper.id) {
      case "golden-paper":
        return "linear-gradient(45deg, #ffd700, #ffed4a)";
      case "hemp-wrap-15":
      case "hemp-wrap-20":
        return "linear-gradient(45deg, #8b5a3c, #a0522d)";
      default:
        return "linear-gradient(45deg, #f7fafc, #edf2f7)";
    }
  };

  const getFilterColor = () => {
    if (!selectedFilter) return "#f7fafc";

    switch (selectedFilter.id) {
      case "paper-filter":
        return "#f7fafc";
      case "slim-glass":
        return "linear-gradient(45deg, #a0aec0, #cbd5e0)";
      case "wide-glass":
        return "linear-gradient(45deg, #4a5568, #718096)";
      default:
        return "#f7fafc";
    }
  };

  const jointLength = getJointLength();
  const jointWidth = getJointWidth();
  const externalEffect = getExternalEffect();
  const fillerColors = getFillerColors();
  const paperColor = getPaperColor();
  const filterColor = getFilterColor();

  return (
    <div className="bg-gradient-to-br from-green-800/30 to-green-700/30 backdrop-blur-sm border border-green-600/30 rounded-xl p-6 h-full">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Live Preview</h3>
        <p className="text-green-300 text-sm">Watch your joint come to life</p>
      </div>

      {/* Joint Display */}
      <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 mb-6 min-h-[200px] flex items-center justify-center relative overflow-hidden border border-green-500/20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-transparent"></div>
          <div className="absolute top-4 left-4 w-2 h-2 bg-green-400/30 rounded-full animate-pulse"></div>
          <div className="absolute bottom-4 right-4 w-1 h-1 bg-green-300/40 rounded-full animate-ping delay-1000"></div>
        </div>

        <div className="relative z-10">
          {/* Simplified Joint Body */}
          <div
            className="relative transition-all duration-500 shadow-lg"
            style={{
              width: `${Math.min(jointLength * 0.8, 120)}px`,
              height: `${Math.min(jointWidth * 1.5, 16)}px`,
            }}
          >
            {/* Simple Joint Paper */}
            <div
              className="absolute inset-0 rounded-full border border-white/30"
              style={{
                background: paperColor,
              }}
            >
              {/* Simple Filling Visualization */}
              <div className="absolute inset-1 rounded-full overflow-hidden">
                {/* Flower Content */}
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: fillerColors.flower }}
                ></div>

                {/* Hash Content */}
                <div
                  className="absolute top-0 right-0 h-full bg-amber-600 transition-all duration-500"
                  style={{ width: fillerColors.hash }}
                ></div>

                {/* Worm Core */}
                {fillingComposition?.worm && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-full bg-red-700 rounded-full"></div>
                )}
              </div>
            </div>

            {/* External Effects */}
            {externalEffect === "rosin" && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/60 to-orange-500/60 animate-pulse"></div>
            )}

            {externalEffect === "kief" && (
              <div className="absolute inset-0 rounded-full">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-pulse"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  ></div>
                ))}
              </div>
            )}

            {externalEffect === "spiral" && (
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-400/40 to-transparent transform rotate-45 animate-spin-slow"></div>
              </div>
            )}

            {externalEffect === "combo" && (
              <div className="absolute inset-0 rounded-full">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/60 to-orange-500/60 animate-pulse"></div>
                {[...Array(15)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-200 rounded-full animate-pulse"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  ></div>
                ))}
              </div>
            )}

            {externalEffect === "oil" && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-green-400/30 to-transparent animate-pulse"></div>
            )}

            {/* Filter End - More Realistic */}
            <div
              className="absolute left-0 top-1/2 transform -translate-y-1/2 shadow-lg border border-white/20"
              style={{
                width: selectedFilter?.type === "glass" ? "8px" : "6px",
                height: selectedFilter?.type === "glass" ? "22px" : "18px",
                background: filterColor,
                borderRadius:
                  selectedFilter?.type === "glass"
                    ? "2px 8px 8px 2px"
                    : "1px 6px 6px 1px",
                boxShadow:
                  selectedFilter?.type === "glass"
                    ? "0 0 6px rgba(160, 174, 192, 0.4)"
                    : "none",
              }}
            >
              {/* Filter Interior */}
              <div
                className="absolute inset-1 opacity-60"
                style={{
                  background:
                    selectedFilter?.type === "glass"
                      ? "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)"
                      : "linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 100%)",
                  borderRadius: "inherit",
                }}
              ></div>

              {/* Glass Filter Reflection */}
              {selectedFilter?.type === "glass" && (
                <div className="absolute top-1 left-1 w-1 h-4 bg-white/40 rounded-full"></div>
              )}
            </div>

            {/* Twisted Paper Tip - More Realistic */}
            <div
              className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-2"
              style={{
                clipPath: "polygon(0% 0%, 85% 35%, 100% 50%, 85% 65%, 0% 100%)",
              }}
            >
              <div className="w-full h-full bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-200 shadow-sm"></div>
              {/* Twist lines */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-1/3 w-px h-full bg-amber-300/40 transform rotate-12"></div>
                <div className="absolute top-0 left-2/3 w-px h-full bg-amber-300/40 transform -rotate-12"></div>
              </div>
            </div>

            {/* Joint Seam */}
            <div className="absolute top-1/2 left-6 right-3 h-px bg-white/20 transform -translate-y-1/2"></div>
          </div>

          {/* Simple Smoke Effect */}
          <div className="absolute -top-4 right-1">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse opacity-60"></div>
            <div className="absolute -top-1 left-0.5 w-0.5 h-0.5 bg-gray-300 rounded-full animate-bounce opacity-40"></div>
            <div className="absolute -top-2 left-1 w-0.5 h-0.5 bg-gray-200 rounded-full animate-ping opacity-30"></div>
          </div>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="space-y-4">
        <div className="border-t border-green-500/20 pt-4">
          <h4 className="text-lg font-semibold text-white mb-3">
            Configuration
          </h4>

          <div className="grid grid-cols-1 gap-3 text-sm">
            {selectedPaper && (
              <div className="bg-green-900/30 rounded-lg p-3 border border-green-600/20">
                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-medium">Paper:</span>
                  <span className="text-white">
                    {selectedPaper.name}
                    {selectedPaper.selectedVariant &&
                      ` - ${selectedPaper.selectedVariant.name}`}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-green-300 text-xs">Capacity:</span>
                  <span className="text-green-200 text-xs">
                    {selectedPaper.selectedVariant?.capacity ||
                      selectedPaper.capacity}
                    g
                  </span>
                </div>
              </div>
            )}

            {selectedFilter && (
              <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-600/20">
                <div className="flex items-center justify-between">
                  <span className="text-blue-400 font-medium">Filter:</span>
                  <span className="text-white">{selectedFilter.name}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-blue-300 text-xs">Material:</span>
                  <span className="text-blue-200 text-xs">
                    {selectedFilter.material}
                  </span>
                </div>
              </div>
            )}

            {fillingComposition && (
              <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-600/20">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-medium">
                      Composition:
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-300">Flower:</span>
                    <span className="text-green-200">
                      {fillingComposition.flower.percentage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-300">Hash:</span>
                    <span className="text-amber-200">
                      {fillingComposition.hash.percentage}%
                    </span>
                  </div>
                  {fillingComposition.worm && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-orange-300">Worm:</span>
                      <span className="text-orange-200">✓ Added</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {externalCustomization && externalCustomization.length > 0 && (
              <div className="bg-yellow-900/30 rounded-lg p-3 border border-yellow-600/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-yellow-400 font-medium">Coatings:</span>
                  <span className="text-yellow-200 text-xs">
                    {externalCustomization.length} applied
                  </span>
                </div>
                <div className="space-y-1">
                  {externalCustomization.slice(0, 2).map((coating) => (
                    <div
                      key={coating.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-yellow-300">
                        {coating.name.split(" ")[0]}:
                      </span>
                      <span className="text-yellow-200">฿{coating.price}</span>
                    </div>
                  ))}
                  {externalCustomization.length > 2 && (
                    <div className="text-yellow-300 text-xs">
                      +{externalCustomization.length - 2} more...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Total Price */}
            <div className="bg-gradient-to-r from-green-600/30 to-green-700/30 rounded-lg p-3 border border-green-400/30">
              <div className="flex items-center justify-between">
                <span className="text-green-300 font-medium">Total Price:</span>
                <span className="text-white font-bold text-lg">
                  ฿
                  {calculateTotal(
                    selectedPaper,
                    selectedFilter,
                    fillingComposition,
                    externalCustomization
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
