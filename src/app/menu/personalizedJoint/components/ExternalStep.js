"use client";

import { useState, useEffect } from "react";
import { getExternalOptions } from "@/lib/jointBuilderService";

export default function ExternalStep({ config, updateConfig, onNext, onPrev }) {
  const [coatingOptions, setCoatingOptions] = useState([]);
  const [wrapOptions, setWrapOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoating, setSelectedCoating] = useState(
    config.external?.coating?.id || null
  );
  const [selectedWrap, setSelectedWrap] = useState(
    config.external?.wrap?.id || null
  );

  // Fetch external options from Firebase
  useEffect(() => {
    const fetchExternalOptions = async () => {
      try {
        const [coatings, wraps] = await Promise.all([
          getExternalOptions("coating"),
          getExternalOptions("wrap"),
        ]);
        setCoatingOptions(coatings);
        setWrapOptions(wraps);
      } catch (error) {
        console.error("Error fetching external options:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExternalOptions();
  }, []);

  const handleOptionSelect = (option) => {
    // Use 'category' field from Firebase instead of 'type'
    if (option.category === "coating") {
      const newCoating = selectedCoating === option.id ? null : option;
      setSelectedCoating(newCoating?.id || null);

      // Clear wrap when selecting coating (only one external allowed)
      if (newCoating) {
        setSelectedWrap(null);
      }

      updateConfig("external", {
        coating: newCoating,
        wrap: newCoating ? null : config.external?.wrap, // Clear wrap if selecting coating
      });
    } else if (option.category === "wrap") {
      const newWrap = selectedWrap === option.id ? null : option;
      setSelectedWrap(newWrap?.id || null);

      // Clear coating when selecting wrap (only one external allowed)
      if (newWrap) {
        setSelectedCoating(null);
      }

      updateConfig("external", {
        coating: newWrap ? null : config.external?.coating, // Clear coating if selecting wrap
        wrap: newWrap,
      });
    }
  };

  const totalExternalPrice =
    (config.external?.coating?.price || 0) +
    (config.external?.wrap?.price || 0);

  // Check if any external option is selected
  const hasExternalSelected = selectedCoating || selectedWrap;

  // Combine coating and wrap options for display
  const allExternalOptions = [...coatingOptions, ...wrapOptions];

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-green-400">Loading external options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 flex items-center justify-between">
          <span>External Customization</span>
          <span className="text-sm font-normal px-3 py-1 bg-blue-500/20 rounded-full border border-blue-400/30">
            Select max 1 option
          </span>
        </h2>
        <p className="text-green-200">
          Add premium coatings and wraps (optional)
        </p>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-400/30">
        <div className="flex items-start space-x-3">
          <div className="text-2xl text-blue-400">ℹ️</div>
          <div className="text-sm">
            <div className="font-bold mb-1">
              External enhancements are optional
            </div>
            <div>
              These premium additions enhance potency, flavor, and appearance.
              You can select only ONE external option (coating OR wrap), or skip
              this step entirely. entirely.
            </div>
          </div>
        </div>
      </div>

      {/* Options Grid - 2 columns x 4 rows */}
      <div className="grid grid-cols-2 gap-4">
        {allExternalOptions.map((option) => {
          const isSelected =
            (option.category === "coating" && selectedCoating === option.id) ||
            (option.category === "wrap" && selectedWrap === option.id);

          // Disable if another option is selected (only one external allowed)
          const isDisabled = hasExternalSelected && !isSelected;

          return (
            <div
              key={option.id}
              onClick={() => !isDisabled && handleOptionSelect(option)}
              className={`
                relative p-6 rounded-2xl transition-all duration-300
                border-2
                ${
                  isSelected
                    ? "border-green-400 bg-white/20 scale-105 shadow-2xl shadow-green-500/30"
                    : isDisabled
                    ? "border-white/10 bg-white/5 opacity-50 cursor-not-allowed"
                    : "border-white/20 bg-white/5 hover:bg-white/10 hover:scale-102 cursor-pointer"
                }
              `}
            >
              <div className="flex flex-col space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{option.name}</h3>
                    <p className="text-sm text-green-200 mt-1">
                      {option.description}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-lg animate-scaleIn ml-2">
                      <span className="text-sm">✓</span>
                    </div>
                  )}
                </div>
                <div className="text-2xl font-bold text-green-400">
                  ฿{option.price}
                </div>
              </div>

              {/* Disabled overlay message */}
              {isDisabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl">
                  <div className="text-center">
                    <div className="text-white font-bold mb-1">
                      Option Locked
                    </div>
                    <div className="text-sm text-gray-300">
                      Only one external enhancement allowed
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
