"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";

const paperOptions = [
  {
    id: "pre-rolled-ck",
    name: "Pre-Rolled Cone",
    description: "Classic cone shape, ready to fill",
    variants: [
      { id: "small", capacity: 0.4, price: 1, label: "Small (0.4g)" },
      { id: "medium", capacity: 0.8, price: 3, label: "Medium (0.8g)" },
      { id: "big", capacity: 1.2, price: 5, label: "Big (1.2g)" },
    ],
    color: "from-amber-100 to-amber-200",
    icon: "CONE",
  },
  {
    id: "blunt-hemp-wrap",
    name: "Blunt/Hemp Wraps",
    description: "Natural hemp leaf wrap",
    variants: [
      { id: "standard", capacity: 1.5, price: 60, label: "Standard (1.5g)" },
      { id: "blackwood", capacity: 2.0, price: 95, label: "Blackwood (2.0g)" },
      { id: "hemp-cone", capacity: 1.0, price: 25, label: "Hemp Cone (1.0g)" },
    ],
    color: "from-green-700 to-green-800",
    icon: "HEMP",
  },
  {
    id: "standard-rolling-paper",
    name: "Standard Rolling Paper",
    description: "Various flavored rolling papers",
    variants: [
      { id: "weed-th", capacity: 1.0, price: 5, label: "Weed TH (1.0g)" },
      { id: "elements", capacity: 1.0, price: 5, label: "Elements (1.0g)" },
      {
        id: "smoking-blue",
        capacity: 1.5,
        price: 5,
        label: "Smoking Blue (1.5g)",
      },
      {
        id: "orange-flavour",
        capacity: 1.0,
        price: 5,
        label: "Orange Flavour (1.0g)",
      },
      {
        id: "watermelon-flavour",
        capacity: 1.0,
        price: 5,
        label: "Watermelon Flavour (1.0g)",
      },
      {
        id: "chocolate-flavour",
        capacity: 1.0,
        price: 5,
        label: "Chocolate Flavour (1.0g)",
      },
    ],
    color: "from-blue-100 to-blue-200",
    icon: "PAPER",
  },
  {
    id: "rolling-paper-custom",
    name: "Rolling Paper (Custom)",
    description: "Adjust length for custom capacity (2g+)",
    isCustom: true,
    basePrice: 20,
    pricePerCm: 3,
    minLength: 7,
    maxLength: 20,
    color: "from-gray-100 to-gray-200",
    icon: "PAPER",
  },
  {
    id: "golden-paper",
    name: "Golden Rolling Paper",
    description: "Premium gold-infused paper",
    variants: [
      { id: "premium", capacity: 1.0, price: 150, label: "Premium (1.0g)" },
    ],
    color: "from-yellow-400 to-amber-500",
    icon: "GOLD",
  },
  {
    id: "glass-cone",
    name: "Glass Cone",
    description: "Premium glass cone",
    variants: [
      { id: "glass", capacity: 1.0, price: 150, label: "Glass (1.0g)" },
    ],
    color: "from-cyan-200 to-blue-300",
    icon: "CONE",
  },
];

export default function PaperStep({ config, updateConfig, onNext }) {
  const backdropRef = useRef(null);
  const [selectedType, setSelectedType] = useState(config.paper?.type || null);
  const [selectedVariant, setSelectedVariant] = useState(
    config.paper?.variant || null
  );
  const [customLength, setCustomLength] = useState(
    config.paper?.customLength || 7
  );
  const [showSelectionModal, setShowSelectionModal] = useState(false);

  const handleTypeSelect = (paperType) => {
    // If selecting the same paper type again, keep existing values
    if (selectedType === paperType.id) {
      // Keep existing variant and customLength - just reopen modal
      setShowSelectionModal(true);
    } else {
      // New paper type - reset values to defaults
      setSelectedType(paperType.id);
      setSelectedVariant(null);
      setCustomLength(paperType.isCustom ? config.paper?.customLength || 7 : 7);
      setShowSelectionModal(true);
    }
  };

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    const paperType = paperOptions.find((p) => p.id === selectedType);
    updateConfig("paper", {
      type: selectedType,
      name: paperType.name,
      variant: variant,
      capacity: variant.capacity,
      price: variant.price,
    });
    setShowSelectionModal(false);
  };

  const handleCustomLengthChange = (length) => {
    console.log("📏 handleCustomLengthChange called:", length);
    setCustomLength(length);
    const paperType = paperOptions.find((p) => p.id === selectedType);
    const capacity = (length / 7) * 2; // Base 7cm = 2g, scale linearly
    const price = paperType.basePrice + length * paperType.pricePerCm;

    updateConfig("paper", {
      type: selectedType,
      name: paperType.name,
      customLength: length,
      capacity: capacity,
      price: price,
    });
    // DON'T close modal here - let user adjust freely
    // setShowSelectionModal(false);
  };

  const handleCustomLengthConfirm = () => {
    console.log("✅ Confirming custom length selection");
    setShowSelectionModal(false);
  };

  const selectedPaperType = paperOptions.find((p) => p.id === selectedType);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Select Rolling Paper</h2>
          <p className="text-green-200">Choose your paper type and capacity</p>
        </div>

        {/* Paper Type Selection */}
        <div className="grid grid-cols-2 gap-4">
          {paperOptions.map((paper) => (
            <div
              key={paper.id}
              onClick={() => handleTypeSelect(paper)}
              className={`
              relative p-6 rounded-2xl cursor-pointer transition-all duration-300
              border-2
              ${
                selectedType === paper.id
                  ? "border-green-400 bg-white/20 scale-105 shadow-2xl shadow-green-500/30"
                  : "border-white/20 bg-white/5 hover:bg-white/10 hover:scale-102"
              }
            `}
            >
              <h3 className="text-xl font-bold mb-1">{paper.name}</h3>
              <p className="text-sm text-green-200">{paper.description}</p>

              {selectedType === paper.id && (
                <div className="absolute top-4 right-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-sm">✓</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Card */}
        {config.paper && (
          <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30 animate-slideIn">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-200 mb-1">
                  Selected Paper
                </div>
                <div className="text-2xl font-bold">{config.paper.name}</div>
                {config.paper.customLength && (
                  <div className="text-sm text-green-200">
                    Length: {config.paper.customLength}cm
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-green-200 mb-1">Capacity</div>
                <div className="text-3xl font-bold text-green-300">
                  {config.paper.capacity.toFixed(1)}g
                </div>
                <div className="text-xl font-bold text-green-400 mt-1">
                  ฿{config.paper.price}
                </div>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out;
          }
          .animate-slideIn {
            animation: slideIn 0.5s ease-out;
          }

          .modern-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
            cursor: pointer;
            border: 3px solid rgba(34, 197, 94, 0.8);
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2),
              0 4px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.2s ease;
          }

          .modern-slider::-webkit-slider-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.3),
              0 6px 12px rgba(0, 0, 0, 0.4);
          }

          .modern-slider::-webkit-slider-thumb:active {
            transform: scale(1.05);
            box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.4),
              0 2px 4px rgba(0, 0, 0, 0.3);
          }

          .modern-slider::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fff 0%, #e0e0e0 100%);
            cursor: pointer;
            border: 3px solid rgba(34, 197, 94, 0.8);
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2),
              0 4px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.2s ease;
          }

          .modern-slider::-moz-range-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.3),
              0 6px 12px rgba(0, 0, 0, 0.4);
          }

          .modern-slider::-moz-range-thumb:active {
            transform: scale(1.05);
            box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.4),
              0 2px 4px rgba(0, 0, 0, 0.3);
          }
        `}</style>
      </div>

      {/* Selection Modal - Rendered outside main container using Portal */}
      {showSelectionModal &&
        selectedPaperType &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={backdropRef}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onMouseDown={(e) => {
              console.log("🔴 BACKDROP onMouseDown", {
                target: e.target,
                backdropRef: backdropRef.current,
                isBackdrop: e.target === backdropRef.current,
                targetClass: e.target.className,
              });
              // Only close if mousedown started directly on backdrop
              if (e.target === backdropRef.current) {
                console.log("✅ CLOSING MODAL - clicked backdrop");
                setShowSelectionModal(false);
              } else {
                console.log("❌ NOT CLOSING - clicked inside modal");
              }
            }}
            onTouchStart={(e) => {
              console.log("🔴 BACKDROP onTouchStart", {
                target: e.target,
                backdropRef: backdropRef.current,
                isBackdrop: e.target === backdropRef.current,
              });
              // Only close if touch started directly on backdrop
              if (e.target === backdropRef.current) {
                console.log("✅ CLOSING MODAL - touched backdrop");
                setShowSelectionModal(false);
              } else {
                console.log("❌ NOT CLOSING - touched inside modal");
              }
            }}
          >
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border-2 border-green-400/30">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  {selectedPaperType.isCustom
                    ? "Adjust Length"
                    : "Select Capacity"}
                </h3>
                <button
                  onClick={() => setShowSelectionModal(false)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                >
                  <span className="text-2xl text-white">×</span>
                </button>
              </div>

              {selectedPaperType.isCustom ? (
                <div className="space-y-6">
                  {/* Custom Length Slider */}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-white">
                      Length:
                    </span>
                    <span className="text-3xl font-bold text-green-300">
                      {customLength} cm
                    </span>
                  </div>

                  <div className="relative pt-1">
                    <input
                      type="range"
                      min={selectedPaperType.minLength}
                      max={selectedPaperType.maxLength}
                      step="1"
                      value={customLength}
                      onChange={(e) => {
                        console.log("🔵 SLIDER onChange", e.target.value);
                        handleCustomLengthChange(Number(e.target.value));
                      }}
                      onMouseDown={(e) => {
                        console.log(
                          "🟢 SLIDER onMouseDown - stopping propagation"
                        );
                        e.stopPropagation();
                      }}
                      onTouchStart={(e) => {
                        console.log(
                          "🟢 SLIDER onTouchStart - stopping propagation"
                        );
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        console.log("🟢 SLIDER onClick - stopping propagation");
                        e.stopPropagation();
                      }}
                      className="modern-slider w-full h-3 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-full appearance-none cursor-pointer border border-green-500/20"
                      style={{
                        background: `linear-gradient(to right, 
                        rgb(34 197 94) 0%, 
                        rgb(16 185 129) ${
                          ((customLength - selectedPaperType.minLength) /
                            (selectedPaperType.maxLength -
                              selectedPaperType.minLength)) *
                          100
                        }%, 
                        rgba(16 185 129 / 0.2) ${
                          ((customLength - selectedPaperType.minLength) /
                            (selectedPaperType.maxLength -
                              selectedPaperType.minLength)) *
                          100
                        }%, 
                        rgba(5 150 105 / 0.15) 100%)`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-sm text-green-200">
                    <span>{selectedPaperType.minLength}cm</span>
                    <span>{selectedPaperType.maxLength}cm</span>
                  </div>

                  {/* Capacity & Price Display */}
                  <div className="mt-4 p-6 bg-gradient-to-r from-green-500/30 to-emerald-500/30 rounded-xl border border-green-400/50">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-green-200 mb-1">
                          Capacity
                        </div>
                        <div className="text-3xl font-bold text-white">
                          {((customLength / 7) * 2).toFixed(1)}g
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-green-200 mb-1">Price</div>
                        <div className="text-3xl font-bold text-green-400">
                          ฿
                          {selectedPaperType.basePrice +
                            customLength * selectedPaperType.pricePerCm}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCustomLengthConfirm}
                    className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                  >
                    Confirm Selection
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto">
                  {selectedPaperType.variants.map((variant) => (
                    <div
                      key={variant.id || variant.capacity}
                      onClick={() => handleVariantSelect(variant)}
                      className={`
                      p-5 rounded-xl cursor-pointer transition-all duration-300
                      flex items-center justify-between
                      border-2
                      ${
                        selectedVariant?.capacity === variant.capacity
                          ? "border-green-400 bg-gradient-to-r from-green-500/30 to-emerald-500/30 scale-105"
                          : "border-white/20 bg-white/5 hover:bg-white/10"
                      }
                    `}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`
                          w-4 h-4 rounded-full transition-all duration-300
                          ${
                            selectedVariant?.capacity === variant.capacity
                              ? "bg-green-400 shadow-lg shadow-green-500/50"
                              : "bg-white/30"
                          }
                        `}
                        ></div>
                        <div>
                          <div className="font-bold text-xl text-white">
                            {variant.label}
                          </div>
                          <div className="text-sm text-green-200">
                            Holds up to {variant.capacity}g
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-400">
                          ฿{variant.price}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
