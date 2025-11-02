"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getFillingOptions } from "@/lib/jointBuilderService";

export default function FillingStep({ config, updateConfig, onNext, onPrev }) {
  const [strainOptions, setStrainOptions] = useState([]);
  const [hashOptions, setHashOptions] = useState([]);
  const [wormOptions, setWormOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flowerItems, setFlowerItems] = useState(config.filling.flower || []);
  const [hashItems, setHashItems] = useState(config.filling.hash || []);
  const [wormEnabled, setWormEnabled] = useState(config.filling.worm !== null);
  const [selectedWorm, setSelectedWorm] = useState(config.filling.worm || null);
  const [showAddFlower, setShowAddFlower] = useState(false);
  const [showAddHash, setShowAddHash] = useState(false);
  const [showWormModal, setShowWormModal] = useState(false);
  const [showFlowerModal, setShowFlowerModal] = useState(false);
  const [showHashModal, setShowHashModal] = useState(false);

  // Fetch filling options from Firebase
  useEffect(() => {
    const fetchFillingOptions = async () => {
      try {
        const [flowers, hashes, worms] = await Promise.all([
          getFillingOptions("flower"),
          getFillingOptions("hash"),
          getFillingOptions("worm"),
        ]);
        setStrainOptions(flowers);
        setHashOptions(hashes);
        setWormOptions(worms);
      } catch (error) {
        console.error("Error fetching filling options:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFillingOptions();
  }, []);

  const totalCapacity = config.paper?.capacity || 0;

  // Worm weight is calculated separately and does NOT take space from capacity
  // It's an addition on top of the capacity
  const wormWeight = wormEnabled && selectedWorm ? totalCapacity * 0.15 : 0;

  // Available capacity is the FULL capacity (worm doesn't reduce it)
  const availableCapacity = totalCapacity;

  const usedCapacity = [...flowerItems, ...hashItems].reduce(
    (sum, item) => sum + (item.weight || 0),
    0
  );
  const remainingCapacity = Math.max(0, availableCapacity - usedCapacity);

  useEffect(() => {
    updateConfig("filling", {
      totalCapacity,
      flower: flowerItems,
      hash: hashItems,
      worm:
        wormEnabled && selectedWorm
          ? { ...selectedWorm, weight: wormWeight }
          : null,
    });
  }, [flowerItems, hashItems, wormEnabled, selectedWorm, wormWeight]);

  const addFlower = (strain) => {
    const weight = remainingCapacity > 0 ? Math.min(0.2, remainingCapacity) : 0;
    setFlowerItems([
      ...flowerItems,
      {
        id: `${strain.id}-${Date.now()}`,
        strain: strain.id,
        name: strain.name,
        type: strain.type,
        weight,
        percentage: (weight / availableCapacity) * 100,
        pricePerGram: strain.pricePerGram,
      },
    ]);
    setShowAddFlower(false);
  };

  const addHash = (hash) => {
    const weight = remainingCapacity > 0 ? Math.min(0.2, remainingCapacity) : 0;
    setHashItems([
      ...hashItems,
      {
        id: `${hash.id}-${Date.now()}`,
        hashType: hash.id,
        name: hash.name,
        weight,
        percentage: (weight / availableCapacity) * 100,
        pricePerGram: hash.pricePerGram,
      },
    ]);
    setShowAddHash(false);
  };

  const updateItemWeight = (items, setItems, id, newWeight) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              weight: newWeight,
              percentage: (newWeight / availableCapacity) * 100,
            }
          : item
      )
    );
  };

  const removeItem = (items, setItems, id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const toggleWorm = (worm) => {
    if (selectedWorm?.id === worm.id) {
      setWormEnabled(false);
      setSelectedWorm(null);
    } else {
      setWormEnabled(true);
      setSelectedWorm(worm);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-green-400">Loading filling options...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Customize Your Filling</h2>
          <p className="text-green-200">
            Mix flower and hash to your preference
          </p>
        </div>

        {/* Capacity Overview */}
        <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="text-sm text-green-200">Total Capacity</div>
              <div className="text-3xl font-bold">
                {totalCapacity.toFixed(1)}g
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-200">Remaining</div>
              <div className="text-3xl font-bold text-green-400">
                {remainingCapacity.toFixed(1)}g
              </div>
            </div>
          </div>

          {/* Visual Capacity Bar */}
          <div className="relative h-8 bg-white/10 rounded-full overflow-hidden">
            {/* Worm is NOT shown in capacity bar as it doesn't take space */}
            {flowerItems.map((item, index) => {
              const prevWeight = flowerItems
                .slice(0, index)
                .reduce((sum, f) => sum + f.weight, 0);
              return (
                <div
                  key={item.id}
                  className="absolute top-1/2 -translate-y-1/2 h-full bg-gradient-to-r from-green-500 to-emerald-500"
                  style={{
                    left: `${(prevWeight / totalCapacity) * 100}%`,
                    width: `${(item.weight / totalCapacity) * 100}%`,
                  }}
                ></div>
              );
            })}
            {hashItems.map((item, index) => {
              const prevWeight =
                flowerItems.reduce((sum, f) => sum + f.weight, 0) +
                hashItems.slice(0, index).reduce((sum, h) => sum + h.weight, 0);
              return (
                <div
                  key={item.id}
                  className="absolute top-1/2 -translate-y-1/2 h-full bg-gradient-to-r from-yellow-600 to-amber-700"
                  style={{
                    left: `${(prevWeight / totalCapacity) * 100}%`,
                    width: `${(item.weight / totalCapacity) * 100}%`,
                  }}
                ></div>
              );
            })}
          </div>

          <div className="flex justify-between mt-2 text-xs text-green-200">
            <span>0g</span>
            <span>{totalCapacity.toFixed(1)}g</span>
          </div>
        </div>

        {/* Worm Option */}
        <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold">Add Worm (Optional)</h3>
              <p className="text-sm text-green-200">
                Worm runs through the center for enhanced potency
              </p>
            </div>
            <button
              onClick={() => setShowWormModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg font-medium transition-all duration-300"
            >
              {selectedWorm ? "Change Worm" : "+ Add Worm"}
            </button>
          </div>

          {selectedWorm && (
            <div className="p-4 bg-gradient-to-r from-amber-500/30 to-orange-500/30 rounded-xl border-2 border-amber-400">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-lg">{selectedWorm.name}</div>
                  <div className="text-sm text-green-200">
                    {selectedWorm.description}
                  </div>
                  <div className="text-xs text-amber-300 mt-1">
                    Weight: ~{wormWeight.toFixed(2)}g
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    ฿{selectedWorm.basePrice}
                  </div>
                  <button
                    onClick={() => {
                      setWormEnabled(false);
                      setSelectedWorm(null);
                    }}
                    className="text-red-400 hover:text-red-300 text-sm mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Flower and Hash Selection - Side by Side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Flower Selection */}
          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Flower</h3>
              <button
                onClick={() => setShowFlowerModal(true)}
                disabled={remainingCapacity <= 0}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-300"
              >
                + Add Strain
              </button>
            </div>

            {flowerItems.length === 0 ? (
              <div className="text-center text-green-200 py-4">
                No flower added yet
              </div>
            ) : (
              <div className="space-y-3">
                {flowerItems.map((item) => (
                  <div key={item.id} className="p-4 bg-white/10 rounded-xl">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className="font-bold">{item.name}</div>
                        <div className="text-xs text-green-200">
                          {item.type}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          removeItem(flowerItems, setFlowerItems, item.id)
                        }
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-200">Weight:</span>
                        <span className="font-bold text-white">
                          {item.weight.toFixed(2)}g (
                          {item.percentage.toFixed(1)}
                          %)
                        </span>
                      </div>

                      {/* Modern Slider */}
                      <div className="relative pt-1">
                        <input
                          type="range"
                          min="0"
                          max={availableCapacity}
                          step="0.01"
                          value={item.weight}
                          onChange={(e) => {
                            const newWeight = Number(e.target.value);
                            const maxAllowed = item.weight + remainingCapacity;
                            const clampedWeight = Math.min(
                              newWeight,
                              maxAllowed
                            );
                            updateItemWeight(
                              flowerItems,
                              setFlowerItems,
                              item.id,
                              clampedWeight
                            );
                          }}
                          className="modern-slider w-full h-3 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-full appearance-none cursor-pointer border border-green-500/20"
                          style={{
                            background: `linear-gradient(to right, 
                          rgb(34 197 94) 0%, 
                          rgb(16 185 129) ${
                            (item.weight / availableCapacity) * 100
                          }%, 
                          rgba(255 255 255 / 0.1) ${
                            (item.weight / availableCapacity) * 100
                          }%, 
                          rgba(255 255 255 / 0.1) 100%)`,
                          }}
                        />
                        {/* Slider Track Labels */}
                        <div className="flex justify-between text-xs text-green-300 mt-1 px-1">
                          <span>0g</span>
                          <span className="text-green-400 font-medium">
                            {item.weight.toFixed(2)}g
                          </span>
                          <span>{availableCapacity.toFixed(1)}g</span>
                        </div>
                      </div>

                      <div className="text-right text-sm font-medium">
                        <span className="text-green-200">Price: </span>
                        <span className="text-green-400 text-lg">
                          ฿{(item.weight * item.pricePerGram).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hash Selection */}
          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Hash</h3>
              <button
                onClick={() => setShowHashModal(true)}
                disabled={remainingCapacity <= 0}
                className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-300"
              >
                + Add Hash
              </button>
            </div>

            {hashItems.length === 0 ? (
              <div className="text-center text-green-200 py-4">
                No hash added yet
              </div>
            ) : (
              <div className="space-y-3">
                {hashItems.map((item) => (
                  <div key={item.id} className="p-4 bg-white/10 rounded-xl">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <div className="font-bold">{item.name}</div>
                      </div>
                      <button
                        onClick={() =>
                          removeItem(hashItems, setHashItems, item.id)
                        }
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-200">Weight:</span>
                        <span className="font-bold text-white">
                          {item.weight.toFixed(2)}g (
                          {item.percentage.toFixed(1)}
                          %)
                        </span>
                      </div>

                      {/* Modern Slider */}
                      <div className="relative pt-1">
                        <input
                          type="range"
                          min="0"
                          max={availableCapacity}
                          step="0.01"
                          value={item.weight}
                          onChange={(e) => {
                            const newWeight = Number(e.target.value);
                            const maxAllowed = item.weight + remainingCapacity;
                            const clampedWeight = Math.min(
                              newWeight,
                              maxAllowed
                            );
                            updateItemWeight(
                              hashItems,
                              setHashItems,
                              item.id,
                              clampedWeight
                            );
                          }}
                          className="modern-slider w-full h-3 bg-gradient-to-r from-amber-900/30 to-yellow-900/30 rounded-full appearance-none cursor-pointer border border-amber-500/20"
                          style={{
                            background: `linear-gradient(to right, 
                          rgb(245 158 11) 0%, 
                          rgb(251 191 36) ${
                            (item.weight / availableCapacity) * 100
                          }%, 
                          rgba(255 255 255 / 0.1) ${
                            (item.weight / availableCapacity) * 100
                          }%, 
                          rgba(255 255 255 / 0.1) 100%)`,
                          }}
                        />
                        {/* Slider Track Labels */}
                        <div className="flex justify-between text-xs text-amber-300 mt-1 px-1">
                          <span>0g</span>
                          <span className="text-amber-400 font-medium">
                            {item.weight.toFixed(2)}g
                          </span>
                          <span>{availableCapacity.toFixed(1)}g</span>
                        </div>
                      </div>

                      <div className="text-right text-sm font-medium">
                        <span className="text-green-200">Price: </span>
                        <span className="text-amber-400 text-lg">
                          ฿{(item.weight * item.pricePerGram).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <style jsx>{`
          /* Modern Slider Styles */
          .modern-slider {
            -webkit-appearance: none;
            appearance: none;
            outline: none;
            transition: all 0.2s ease;
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

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-slideDown {
            animation: slideDown 0.3s ease-out;
          }
        `}</style>
      </div>

      {/* Worm Modal */}
      {showWormModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowWormModal(false);
              }
            }}
          >
            <div
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border-2 border-amber-400/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Select Worm</h3>
                <button
                  onClick={() => setShowWormModal(false)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                >
                  <span className="text-2xl text-white">×</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {wormOptions.map((worm) => (
                  <div
                    key={worm.id}
                    onClick={() => {
                      toggleWorm(worm);
                      setShowWormModal(false);
                    }}
                    className={`
                    p-5 rounded-xl cursor-pointer transition-all duration-300
                    border-2 flex items-center justify-between
                    ${
                      selectedWorm?.id === worm.id
                        ? "border-amber-400 bg-gradient-to-r from-amber-500/30 to-orange-500/30 scale-105"
                        : "border-white/20 bg-white/5 hover:bg-white/10"
                    }
                  `}
                  >
                    <div>
                      <div className="font-bold text-xl text-white">
                        {worm.name}
                      </div>
                      <div className="text-sm text-green-200">
                        {worm.description}
                      </div>
                      <div className="text-xs text-amber-300 mt-1">
                        Weight: ~{wormWeight.toFixed(2)}g
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-green-400">
                      ฿{worm.basePrice}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Flower Modal */}
      {showFlowerModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowFlowerModal(false);
              }
            }}
          >
            <div
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border-2 border-green-400/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Select Flower Strain
                </h3>
                <button
                  onClick={() => setShowFlowerModal(false)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                >
                  <span className="text-2xl text-white">×</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {strainOptions.map((strain) => (
                  <div
                    key={strain.id}
                    onClick={() => {
                      addFlower(strain);
                      setShowFlowerModal(false);
                    }}
                    className="p-5 bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer transition-all duration-300 border-2 border-white/20 hover:border-green-400"
                  >
                    <div className="font-bold text-lg text-white">
                      {strain.name}
                    </div>
                    <div className="text-sm text-green-200 mt-1">
                      {strain.type} • THC: {strain.thc}
                    </div>
                    <div className="text-xl font-bold text-green-400 mt-2">
                      ฿{strain.pricePerGram}/g
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Hash Modal */}
      {showHashModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowHashModal(false);
              }
            }}
          >
            <div
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto border-2 border-amber-400/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Select Hash Type
                </h3>
                <button
                  onClick={() => setShowHashModal(false)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                >
                  <span className="text-2xl text-white">×</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {hashOptions.map((hash) => (
                  <div
                    key={hash.id}
                    onClick={() => {
                      addHash(hash);
                      setShowHashModal(false);
                    }}
                    className="p-5 bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer transition-all duration-300 border-2 border-white/20 hover:border-amber-400"
                  >
                    <div className="font-bold text-lg text-white">
                      {hash.name}
                    </div>
                    <div className="text-sm text-green-200 mt-1">
                      THC: {hash.thc}
                    </div>
                    <div className="text-xl font-bold text-amber-400 mt-2">
                      ฿{hash.pricePerGram}/g
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
