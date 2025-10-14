"use client";

import { useState, useEffect } from "react";
import { GiPlantWatering, GiHoneyJar } from "react-icons/gi";
import { FaPlus, FaTrash, FaCheck } from "react-icons/fa";
import { MdDonutSmall } from "react-icons/md";

const strainOptions = [
  {
    id: "sativa-og",
    name: "Sativa OG",
    type: "sativa",
    pricePerGram: 150,
    thc: "22%",
  },
  {
    id: "indica-kush",
    name: "Indica Kush",
    type: "indica",
    pricePerGram: 160,
    thc: "24%",
  },
  {
    id: "hybrid-haze",
    name: "Hybrid Haze",
    type: "hybrid",
    pricePerGram: 155,
    thc: "23%",
  },
  {
    id: "green-dream",
    name: "green Dream",
    type: "hybrid",
    pricePerGram: 170,
    thc: "25%",
  },
];

const hashOptions = [
  { id: "moroccan-hash", name: "Moroccan Hash", pricePerGram: 200, thc: "40%" },
  { id: "afghan-hash", name: "Afghan Hash", pricePerGram: 220, thc: "45%" },
  { id: "ice-hash", name: "Ice Hash", pricePerGram: 250, thc: "50%" },
  { id: "bubble-hash", name: "Bubble Hash", pricePerGram: 240, thc: "48%" },
];

const wormOptions = [
  {
    id: "hash-worm",
    name: "Hash Worm (Donut Style)",
    basePrice: 100,
    description: "Hash center wrapped in flower",
  },
  {
    id: "concentrate-worm",
    name: "Concentrate Worm",
    basePrice: 150,
    description: "Concentrate core for extra potency",
  },
];

export default function FillingStep({ config, updateConfig, onNext, onPrev }) {
  const [flowerItems, setFlowerItems] = useState(config.filling.flower || []);
  const [hashItems, setHashItems] = useState(config.filling.hash || []);
  const [wormEnabled, setWormEnabled] = useState(config.filling.worm !== null);
  const [selectedWorm, setSelectedWorm] = useState(config.filling.worm || null);
  const [showAddFlower, setShowAddFlower] = useState(false);
  const [showAddHash, setShowAddHash] = useState(false);

  const totalCapacity = config.paper?.capacity || 0;
  const wormWeight = wormEnabled && selectedWorm ? totalCapacity * 0.15 : 0; // Worm takes 15% of total
  const availableCapacity = totalCapacity - wormWeight;

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Customize Your Filling</h2>
        <p className="text-green-200">Mix flower and hash to your preference</p>
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
              {remainingCapacity.toFixed(2)}g
            </div>
          </div>
        </div>

        {/* Visual Capacity Bar */}
        <div className="relative h-8 bg-white/10 rounded-full overflow-hidden">
          {wormEnabled && wormWeight > 0 && (
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber-500 to-orange-500"
              style={{ width: `${(wormWeight / totalCapacity) * 100}%` }}
            ></div>
          )}
          {flowerItems.map((item, index) => {
            const prevWeight =
              wormWeight +
              flowerItems
                .slice(0, index)
                .reduce((sum, f) => sum + f.weight, 0) +
              hashItems.reduce((sum, h) => sum + h.weight, 0);
            return (
              <div
                key={item.id}
                className="absolute top-0 h-full bg-gradient-to-r from-green-500 to-emerald-500"
                style={{
                  left: `${(prevWeight / totalCapacity) * 100}%`,
                  width: `${(item.weight / totalCapacity) * 100}%`,
                }}
              ></div>
            );
          })}
          {hashItems.map((item, index) => {
            const prevWeight =
              wormWeight +
              flowerItems.reduce((sum, f) => sum + f.weight, 0) +
              hashItems.slice(0, index).reduce((sum, h) => sum + h.weight, 0);
            return (
              <div
                key={item.id}
                className="absolute top-0 h-full bg-gradient-to-r from-yellow-600 to-amber-700"
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
        <h3 className="text-xl font-bold mb-4">Add Worm (Optional)</h3>
        <p className="text-sm text-green-200 mb-4">
          Worm runs through the center for enhanced potency (uses 15% capacity)
        </p>

        <div className="grid grid-cols-1 gap-3">
          {wormOptions.map((worm) => (
            <div
              key={worm.id}
              onClick={() => toggleWorm(worm)}
              className={`
                p-4 rounded-xl cursor-pointer transition-all duration-300
                border-2 flex items-center justify-between
                ${
                  selectedWorm?.id === worm.id
                    ? "border-amber-400 bg-gradient-to-r from-amber-500/30 to-orange-500/30"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }
              `}
            >
              <div>
                <div className="font-bold text-lg">{worm.name}</div>
                <div className="text-sm text-green-200">{worm.description}</div>
                <div className="text-xs text-amber-300 mt-1">
                  Weight: ~{wormWeight.toFixed(2)}g
                </div>
              </div>
              <div className="text-2xl font-bold text-green-400">
                ฿{worm.basePrice}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flower Selection */}
      <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Flower</h3>
          <button
            onClick={() => setShowAddFlower(!showAddFlower)}
            disabled={remainingCapacity <= 0}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-300"
          >
            + Add Strain
          </button>
        </div>

        {showAddFlower && (
          <div className="mb-4 grid grid-cols-2 gap-2 p-4 bg-white/5 rounded-xl animate-slideDown">
            {strainOptions.map((strain) => (
              <div
                key={strain.id}
                onClick={() => addFlower(strain)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-all duration-300"
              >
                <div className="font-medium">{strain.name}</div>
                <div className="text-xs text-green-200">
                  {strain.type} • THC: {strain.thc}
                </div>
                <div className="text-sm text-green-400 mt-1">
                  ฿{strain.pricePerGram}/g
                </div>
              </div>
            ))}
          </div>
        )}

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
                    <div className="text-xs text-green-200">{item.type}</div>
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

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Weight:</span>
                    <span className="font-bold">
                      {item.weight.toFixed(2)}g ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.min(
                      availableCapacity,
                      item.weight + remainingCapacity
                    )}
                    step="0.01"
                    value={item.weight}
                    onChange={(e) =>
                      updateItemWeight(
                        flowerItems,
                        setFlowerItems,
                        item.id,
                        Number(e.target.value)
                      )
                    }
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-right text-sm text-green-400">
                    ฿{(item.weight * item.pricePerGram).toFixed(0)}
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
            onClick={() => setShowAddHash(!showAddHash)}
            disabled={remainingCapacity <= 0}
            className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-medium transition-all duration-300"
          >
            + Add Hash
          </button>
        </div>

        {showAddHash && (
          <div className="mb-4 grid grid-cols-2 gap-2 p-4 bg-white/5 rounded-xl animate-slideDown">
            {hashOptions.map((hash) => (
              <div
                key={hash.id}
                onClick={() => addHash(hash)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-all duration-300"
              >
                <div className="font-medium">{hash.name}</div>
                <div className="text-xs text-green-200">THC: {hash.thc}</div>
                <div className="text-sm text-green-400 mt-1">
                  ฿{hash.pricePerGram}/g
                </div>
              </div>
            ))}
          </div>
        )}

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
                    onClick={() => removeItem(hashItems, setHashItems, item.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Weight:</span>
                    <span className="font-bold">
                      {item.weight.toFixed(2)}g ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.min(
                      availableCapacity,
                      item.weight + remainingCapacity
                    )}
                    step="0.01"
                    value={item.weight}
                    onChange={(e) =>
                      updateItemWeight(
                        hashItems,
                        setHashItems,
                        item.id,
                        Number(e.target.value)
                      )
                    }
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-right text-sm text-green-400">
                    ฿{(item.weight * item.pricePerGram).toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
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
  );
}
