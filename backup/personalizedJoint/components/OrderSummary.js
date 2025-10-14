"use client";

import { useState } from "react";

export default function OrderSummary({ jointConfig, prevStep }) {
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const calculateItemizedPricing = () => {
    const items = [];

    // Base paper
    if (jointConfig.paperType) {
      items.push({
        name: jointConfig.paperType.name,
        description: jointConfig.capacity
          ? `${jointConfig.capacity}g capacity`
          : "",
        price: jointConfig.paperType.price,
        category: "Paper",
      });
    }

    // Filter
    if (jointConfig.filterType && jointConfig.filterType.price > 0) {
      items.push({
        name: jointConfig.filterType.name,
        description: "Premium filter tip",
        price: jointConfig.filterType.price,
        category: "Filter",
      });
    }

    // Flower strains
    if (jointConfig.filling?.flower?.strains) {
      jointConfig.filling.flower.strains.forEach((strain) => {
        const weight = strain.weight || 0;
        const price = weight * strain.pricePerGram;
        items.push({
          name: strain.name,
          description: `${weight.toFixed(2)}g ${strain.type} flower`,
          price: price,
          category: "Flower",
        });
      });
    }

    // Hash types
    if (jointConfig.filling?.hash?.types) {
      jointConfig.filling.hash.types.forEach((hash) => {
        const weight = hash.weight || 0;
        const price = weight * hash.pricePerGram;
        items.push({
          name: hash.name,
          description: `${weight.toFixed(2)}g premium hash`,
          price: price,
          category: "Hash",
        });
      });
    }

    // Worm
    if (jointConfig.filling?.worm?.enabled && jointConfig.filling.worm.type) {
      const wormWeight = jointConfig.filling.worm.weight || 0;
      const wormPrice = wormWeight * jointConfig.filling.worm.type.pricePerGram;
      items.push({
        name: `${jointConfig.filling.worm.type.name} Worm`,
        description: `${wormWeight.toFixed(2)}g donut-style core`,
        price: wormPrice,
        category: "Enhancement",
      });
    }

    // External enhancements
    if (jointConfig.external) {
      const externalMap = {
        "rosin-coating": { name: "Rosin Coating (Full Dip)", price: 100 },
        "rosin-spiral": { name: "Rosin Spiral Wrap", price: 150 },
        "kief-coating": { name: "Kief Coating", price: 75 },
        "rosin-kief-combo": { name: "Rosin + Kief Combo", price: 200 },
        "oil-coating": { name: "Oil Coating (Light Brush)", price: 50 },
      };

      Object.keys(jointConfig.external).forEach((key) => {
        if (jointConfig.external[key] && externalMap[key]) {
          items.push({
            name: externalMap[key].name,
            description: "External enhancement",
            price: externalMap[key].price,
            category: "Enhancement",
          });
        }
      });
    }

    return items;
  };

  const itemizedItems = calculateItemizedPricing();
  const subtotal = itemizedItems.reduce((sum, item) => sum + item.price, 0);
  const total = subtotal * quantity;

  const handleAddToCart = async () => {
    setAddingToCart(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Here you would add the joint to the cart
    const jointItem = {
      id: `custom-joint-${Date.now()}`,
      name: "Custom Joint",
      description: getJointDescription(),
      price: subtotal,
      quantity: quantity,
      image: "/Product/custom-joint.png", // You'd generate this or use a default
      isCustomJoint: true,
      configuration: jointConfig,
      itemizedBreakdown: itemizedItems,
    };

    console.log("Adding to cart:", jointItem);

    // Reset and redirect
    setAddingToCart(false);
    // Here you would typically navigate back to the main menu or cart
  };

  const getJointDescription = () => {
    const parts = [];

    if (jointConfig.paperType) {
      parts.push(jointConfig.paperType.name);
    }

    if (jointConfig.capacity) {
      parts.push(`${jointConfig.capacity}g`);
    }

    if (jointConfig.filling?.flower?.strains?.length) {
      parts.push(
        `${jointConfig.filling.flower.strains.length} flower strain${
          jointConfig.filling.flower.strains.length > 1 ? "s" : ""
        }`
      );
    }

    if (jointConfig.filling?.hash?.types?.length) {
      parts.push(
        `${jointConfig.filling.hash.types.length} hash type${
          jointConfig.filling.hash.types.length > 1 ? "s" : ""
        }`
      );
    }

    if (jointConfig.filling?.worm?.enabled) {
      parts.push("worm style");
    }

    const externalCount = Object.keys(jointConfig.external || {}).filter(
      (key) => jointConfig.external[key]
    ).length;
    if (externalCount > 0) {
      parts.push(`${externalCount} enhancement${externalCount > 1 ? "s" : ""}`);
    }

    return parts.join(" • ");
  };

  const groupItemsByCategory = () => {
    const grouped = {};
    itemizedItems.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });
    return grouped;
  };

  const groupedItems = groupItemsByCategory();

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto bg-white/95 backdrop-blur-lg relative">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4 drop-shadow-sm">
          Order Summary
        </h2>
        <p className="text-gray-600 text-xl">
          Review your custom joint before adding to cart
        </p>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-8">
        {/* Left Column - Configuration Summary */}
        <div className="space-y-6">
          {/* Joint Info Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-4">
              Your Custom Joint
            </h3>
            <p className="text-white/70 text-lg mb-4">
              {getJointDescription()}
            </p>

            {/* Key Specs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-white/60 text-sm">Total Weight</div>
                <div className="text-2xl font-bold text-green-400">
                  {jointConfig.capacity}g
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center">
                <div className="text-white/60 text-sm">Components</div>
                <div className="text-2xl font-bold text-blue-400">
                  {itemizedItems.length}
                </div>
              </div>
            </div>
          </div>

          {/* Filling Breakdown */}
          {(jointConfig.filling?.flower?.strains?.length > 0 ||
            jointConfig.filling?.hash?.types?.length > 0) && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h4 className="text-xl font-bold text-white mb-4">
                Filling Composition
              </h4>

              {/* Visual Ratio */}
              <div className="mb-4">
                <div className="flex rounded-lg overflow-hidden h-8 bg-white/10">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold"
                    style={{
                      width: `${jointConfig.filling?.flower?.percentage || 0}%`,
                    }}
                  >
                    {jointConfig.filling?.flower?.percentage > 20 && "Flower"}
                  </div>
                  <div
                    className="bg-gradient-to-r from-amber-600 to-orange-600 flex items-center justify-center text-white text-sm font-bold"
                    style={{
                      width: `${
                        100 - (jointConfig.filling?.flower?.percentage || 0)
                      }%`,
                    }}
                  >
                    {100 - (jointConfig.filling?.flower?.percentage || 0) >
                      20 && "Hash"}
                  </div>
                </div>
              </div>

              {/* Strain List */}
              {jointConfig.filling?.flower?.strains?.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-green-300 font-semibold mb-2">
                    Flower Strains:
                  </h5>
                  {jointConfig.filling.flower.strains.map((strain, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm mb-1"
                    >
                      <span className="text-white">{strain.name}</span>
                      <span className="text-green-300">
                        {(strain.weight || 0).toFixed(2)}g
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Hash List */}
              {jointConfig.filling?.hash?.types?.length > 0 && (
                <div>
                  <h5 className="text-orange-300 font-semibold mb-2">
                    Hash Types:
                  </h5>
                  {jointConfig.filling.hash.types.map((hash, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between text-sm mb-1"
                    >
                      <span className="text-white">{hash.name}</span>
                      <span className="text-orange-300">
                        {(hash.weight || 0).toFixed(2)}g
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Enhancements */}
          {Object.keys(jointConfig.external || {}).some(
            (key) => jointConfig.external[key]
          ) && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h4 className="text-xl font-bold text-white mb-4">
                External Enhancements
              </h4>
              <div className="space-y-2">
                {Object.keys(jointConfig.external || {}).map((key) => {
                  if (!jointConfig.external[key]) return null;

                  const enhancementNames = {
                    "rosin-coating": "💧 Rosin Coating (Full Dip)",
                    "rosin-spiral": "Rosin Spiral Wrap",
                    "kief-coating": "Kief Coating",
                    "rosin-kief-combo": "👑 Rosin + Kief Combo",
                    "oil-coating": "Oil Coating (Light Brush)",
                  };

                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-white">
                        {enhancementNames[key] || key}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Pricing Breakdown */}
        <div className="space-y-6">
          {/* Quantity Selector */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h4 className="text-xl font-bold text-white mb-4">Quantity</h4>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xl transition-all duration-200"
              >
                -
              </button>
              <span className="text-3xl font-bold text-white w-16 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xl transition-all duration-200"
              >
                +
              </button>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h4 className="text-xl font-bold text-white mb-4">
              Pricing Breakdown
            </h4>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category}>
                  <h5 className="text-lg font-semibold text-white/80 mb-2 border-b border-white/20 pb-1">
                    {category}
                  </h5>
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start mb-2 pl-4"
                    >
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-white/60 text-sm">
                            {item.description}
                          </div>
                        )}
                      </div>
                      <div className="text-green-400 font-bold ml-4">
                        ฿{item.price.toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-white/20 pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-lg">
                <span className="text-white">Subtotal (per joint):</span>
                <span className="text-green-400 font-bold">
                  ฿{subtotal.toFixed(0)}
                </span>
              </div>
              {quantity > 1 && (
                <div className="flex justify-between text-sm text-white/70">
                  <span>× {quantity} joints</span>
                  <span>฿{total.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold border-t border-white/20 pt-2">
                <span className="text-white">Total:</span>
                <span className="text-green-400">฿{total.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className={`w-full py-6 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
              addingToCart
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            }`}
          >
            {addingToCart ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Adding to Cart...</span>
              </div>
            ) : (
              `Add ${quantity} Joint${
                quantity > 1 ? "s" : ""
              } to Cart - ฿${total.toFixed(0)}`
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={prevStep}
          className="bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300"
        >
          ← Back to Externals
        </button>

        <div className="text-center">
          <p className="text-white/60 text-sm">
            Build another joint or continue shopping after adding to cart
          </p>
        </div>
      </div>
    </div>
  );
}
