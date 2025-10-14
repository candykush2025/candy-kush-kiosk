"use client";

import { useState } from "react";
import { FaCheck, FaInfoCircle } from "react-icons/fa";
import { GiHoneyJar, GiSparkles, GiPaintBrush } from "react-icons/gi";
import { MdLayers } from "react-icons/md";
import { TbSpiral } from "react-icons/tb";

const externalOptions = [
  {
    id: "rosin-full-dip",
    name: "Rosin Coating (Full Dip)",
    description: "Entire joint dipped in premium rosin",
    price: 80,
    type: "coating",
    icon: GiHoneyJar,
    color: "from-amber-400 to-yellow-600",
  },
  {
    id: "rosin-spiral",
    name: "Rosin Spiral Wrap",
    description: "Elegant spiral rosin pattern",
    price: 60,
    type: "wrap",
    icon: TbSpiral,
    color: "from-yellow-500 to-amber-500",
  },
  {
    id: "kief-coating",
    name: "Kief Coating",
    description: "Covered in premium kief crystals",
    price: 70,
    type: "coating",
    icon: GiSparkles,
    color: "from-green-400 to-emerald-500",
  },
  {
    id: "rosin-kief-combo",
    name: "Rosin + Kief Combo",
    description: "Rosin layer with kief coating",
    price: 120,
    type: "coating",
    icon: MdLayers,
    color: "from-green-400 to-emerald-500",
  },
  {
    id: "oil-coating",
    name: "Oil Coating (Light Brush)",
    description: "Light cannabis oil application",
    price: 50,
    type: "coating",
    icon: GiPaintBrush,
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
      updateConfig("external", {
        ...config.external,
        coating: newCoating,
      });
    } else if (option.type === "wrap") {
      const newWrap = selectedWrap === option.id ? null : option;
      setSelectedWrap(newWrap?.id || null);
      updateConfig("external", {
        ...config.external,
        wrap: newWrap,
      });
    }
  };

  const totalExternalPrice =
    (config.external?.coating?.price || 0) +
    (config.external?.wrap?.price || 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">External Customization</h2>
        <p className="text-green-200">
          Add premium coatings and wraps (optional)
        </p>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-400/30">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">
            <FaInfoCircle className="text-blue-400" />
          </div>
          <div className="text-sm">
            <div className="font-bold mb-1">
              External enhancements are optional
            </div>
            <div className="text-green-200">
              These premium additions enhance potency, flavor, and appearance.
              You can select one coating and one wrap, or skip this step
              entirely.
            </div>
          </div>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 gap-4">
        {externalOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => handleOptionSelect(option)}
            className={`
              relative p-6 rounded-2xl cursor-pointer transition-all duration-300
              border-2
              ${
                (option.type === "coating" && selectedCoating === option.id) ||
                (option.type === "wrap" && selectedWrap === option.id)
                  ? "border-green-400 bg-white/20 scale-105 shadow-2xl shadow-green-500/30"
                  : "border-white/20 bg-white/5 hover:bg-white/10 hover:scale-102"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-5xl">
                  <option.icon />
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
                  <FaCheck className="text-lg" />
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
          </div>
        ))}
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
