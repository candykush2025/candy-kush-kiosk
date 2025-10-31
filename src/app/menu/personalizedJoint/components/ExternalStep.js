"use client";

import { useState } from "react";

const externalOptions = [
  {
    id: "rosin-full-dip",
    name: "Rosin Coating (Full Dip)",
    description: "Entire joint dipped in premium rosin",
    price: 80,
    type: "coating",
    icon: "ROSIN",
    color: "from-amber-400 to-yellow-600",
  },
  {
    id: "rosin-spiral",
    name: "Rosin Spiral Wrap",
    description: "Elegant spiral rosin pattern",
    price: 60,
    type: "wrap",
    icon: "SPIRAL",
    color: "from-yellow-500 to-amber-500",
  },
  {
    id: "hash-M",
    name: "Hash M Wrap",
    description: "Premium hash in M pattern",
    price: 70,
    type: "wrap",
    icon: "M",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "rosin-M",
    name: "Rosin M Wrap",
    description: "Premium rosin in M pattern",
    price: 80,
    type: "wrap",
    icon: "M",
    color: "from-purple-400 to-indigo-500",
  },
  {
    id: "kief-coating",
    name: "Kief Coating",
    description: "Covered in premium kief crystals",
    price: 70,
    type: "coating",
    icon: "KIEF",
    color: "from-green-400 to-emerald-500",
  },
  {
    id: "rosin-kief-combo",
    name: "Rosin + Kief Combo",
    description: "Rosin layer with kief coating",
    price: 120,
    type: "coating",
    icon: "COMBO",
    color: "from-green-400 to-emerald-500",
  },
  {
    id: "oil-coating",
    name: "Oil Coating (Light Brush)",
    description: "Light cannabis oil application",
    price: 50,
    type: "coating",
    icon: "OIL",
    color: "from-orange-400 to-red-500",
  },
];

export default function ExternalStep({ config, updateConfig, onNext, onPrev }) {
  const [selectedCoating, setSelectedCoating] = useState(
    config.external?.coating?.id || null
  );
  const [selectedWrap, setSelectedWrap] = useState(
    config.external?.wrap?.id || null
  );

  const handleOptionSelect = (option) => {
    if (option.type === "coating") {
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
    } else if (option.type === "wrap") {
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

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-4">
        {externalOptions.map((option) => {
          const isSelected =
            (option.type === "coating" && selectedCoating === option.id) ||
            (option.type === "wrap" && selectedWrap === option.id);

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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 flex items-center justify-center bg-white/10 rounded-lg text-xs font-bold">
                    {option.icon}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold">{option.name}</h3>
                      <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                        {option.type}
                      </span>
                    </div>
                    <p className="text-green-200 mt-1">{option.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    ฿{option.price}
                  </div>
                </div>
              </div>

              {((option.type === "coating" && selectedCoating === option.id) ||
                (option.type === "wrap" && selectedWrap === option.id)) && (
                <div className="absolute top-6 right-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-lg animate-scaleIn">
                    <span className="text-lg">✓</span>
                  </div>
                </div>
              )}

              {/* Visual Effect Preview */}
              <div className="mt-4 flex justify-center">
                <div className="relative">
                  {option.id === "rosin-full-dip" && (
                    <div className="w-32 h-4 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-full shadow-lg opacity-80"></div>
                  )}
                  {option.id === "rosin-spiral" && (
                    <div className="w-32 h-4 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full opacity-60"></div>
                      <div className="absolute inset-0 flex space-x-1">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-yellow-400 rounded-full"
                            style={{ opacity: 0.8 - i * 0.1 }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  )}
                  {option.id === "kief-coating" && (
                    <div className="w-32 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg opacity-80 relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                    </div>
                  )}
                  {option.id === "rosin-kief-combo" && (
                    <div className="w-32 h-4 bg-gradient-to-r from-green-400 via-emerald-500 to-yellow-500 rounded-full shadow-xl opacity-80 relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/40 animate-shimmer"></div>
                    </div>
                  )}
                  {option.id === "oil-coating" && (
                    <div className="w-32 h-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-full shadow-lg opacity-70"></div>
                  )}
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

      {/* Skip Option */}
      <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 text-center">
        <div className="text-green-200 mb-2">No external additions?</div>
        <button
          onClick={() => {
            setSelectedCoating(null);
            setSelectedWrap(null);
            updateConfig("external", { coating: null, wrap: null });
          }}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-all duration-300"
        >
          Clear All Selections
        </button>
      </div>

      {/* Selection Summary */}
      {(config.external?.coating || config.external?.wrap) && (
        <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30 animate-slideIn">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-green-200">
                External Enhancements
              </div>
              <div className="text-2xl font-bold text-green-400">
                ฿{totalExternalPrice}
              </div>
            </div>
            {config.external?.coating && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-2xl">{config.external.coating.icon}</span>
                <span className="font-medium">
                  {config.external.coating.name}
                </span>
                <span className="text-green-200">
                  (฿{config.external.coating.price})
                </span>
              </div>
            )}
            {config.external?.wrap && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-2xl">{config.external.wrap.icon}</span>
                <span className="font-medium">{config.external.wrap.name}</span>
                <span className="text-green-200">
                  (฿{config.external.wrap.price})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

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
