"use client";

import { useState } from "react";

const paperOptions = [
  {
    id: "prerolled-cone",
    name: "Pre-Rolled Cone",
    description: "Classic cone shape, ready to fill",
    variants: [
      { capacity: 0.4, price: 15, label: "Small (0.4g)" },
      { capacity: 0.8, price: 25, label: "Medium (0.8g)" },
      { capacity: 1.2, price: 35, label: "Large (1.2g)" },
    ],
    color: "from-amber-100 to-amber-200",
    icon: "CONE",
  },
  {
    id: "hemp-wrap",
    name: "Hemp Wrap",
    description: "Natural hemp leaf wrap",
    variants: [
      { capacity: 1.5, price: 45, label: "Standard (1.5g)" },
      { capacity: 2.0, price: 55, label: "Large (2.0g)" },
    ],
    color: "from-green-700 to-green-800",
    icon: "HEMP",
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
    variants: [{ capacity: 1.0, price: 80, label: "Premium (1.0g)" }],
    color: "from-yellow-400 to-amber-500",
    icon: "GOLD",
  },
];

export default function PaperStep({ config, updateConfig, onNext }) {
  const [selectedType, setSelectedType] = useState(config.paper?.type || null);
  const [selectedVariant, setSelectedVariant] = useState(
    config.paper?.variant || null
  );
  const [customLength, setCustomLength] = useState(
    config.paper?.customLength || 7
  );

  const handleTypeSelect = (paperType) => {
    setSelectedType(paperType.id);
    setSelectedVariant(null);
    setCustomLength(7);
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
  };

  const handleCustomLengthChange = (length) => {
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
  };

  const selectedPaperType = paperOptions.find((p) => p.id === selectedType);

  return (
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

      {/* Variant/Capacity Selection */}
      {selectedType && selectedPaperType && (
        <div className="mt-6 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 animate-fadeIn">
          <h3 className="text-xl font-bold mb-4">
            {selectedPaperType.isCustom ? "Adjust Length" : "Select Capacity"}
          </h3>

          {selectedPaperType.isCustom ? (
            <div className="space-y-4">
              {/* Custom Length Slider */}
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Length:</span>
                <span className="text-2xl font-bold text-green-300">
                  {customLength} cm
                </span>
              </div>

              <input
                type="range"
                min={selectedPaperType.minLength}
                max={selectedPaperType.maxLength}
                value={customLength}
                onChange={(e) =>
                  handleCustomLengthChange(Number(e.target.value))
                }
                className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-500"
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${
                    ((customLength - selectedPaperType.minLength) /
                      (selectedPaperType.maxLength -
                        selectedPaperType.minLength)) *
                    100
                  }%, rgba(255,255,255,0.1) ${
                    ((customLength - selectedPaperType.minLength) /
                      (selectedPaperType.maxLength -
                        selectedPaperType.minLength)) *
                    100
                  }%, rgba(255,255,255,0.1) 100%)`,
                }}
              />

              <div className="flex justify-between text-sm text-green-200">
                <span>{selectedPaperType.minLength}cm</span>
                <span>{selectedPaperType.maxLength}cm</span>
              </div>

              {/* Capacity & Price Display */}
              <div className="mt-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-green-200">Capacity</div>
                    <div className="text-2xl font-bold">
                      {((customLength / 7) * 2).toFixed(1)}g
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-200">Price</div>
                    <div className="text-2xl font-bold text-green-400">
                      ฿
                      {selectedPaperType.basePrice +
                        customLength * selectedPaperType.pricePerCm}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {selectedPaperType.variants.map((variant) => (
                <div
                  key={variant.capacity}
                  onClick={() => handleVariantSelect(variant)}
                  className={`
                    p-4 rounded-xl cursor-pointer transition-all duration-300
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
                        w-3 h-3 rounded-full transition-all duration-300
                        ${
                          selectedVariant?.capacity === variant.capacity
                            ? "bg-green-400 shadow-lg shadow-green-500/50"
                            : "bg-white/30"
                        }
                      `}
                    ></div>
                    <div>
                      <div className="font-bold text-lg">{variant.label}</div>
                      <div className="text-sm text-green-200">
                        Holds up to {variant.capacity}g
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      ฿{variant.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Card */}
      {config.paper && (
        <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30 animate-slideIn">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-200 mb-1">Selected Paper</div>
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
      `}</style>
    </div>
  );
}
