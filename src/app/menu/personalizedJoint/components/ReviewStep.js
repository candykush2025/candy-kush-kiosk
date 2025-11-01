"use client";

export default function ReviewStep({ config, onPrev, onComplete }) {
  const handleAddToCart = () => {
    if (onComplete) {
      onComplete(config);
    } else {
      // Fallback if onComplete is not provided
      console.log("Adding to cart:", config);
      alert("Joint added to cart!");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Review Your Custom Joint</h2>
        <p className="text-green-200">
          Double-check everything before adding to cart
        </p>
      </div>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Paper Section */}
        <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
          <h3 className="text-xl font-bold mb-4">Rolling Paper</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-green-200">Type:</span>
              <span className="font-medium">{config.paper?.name}</span>
            </div>
            {config.paper?.customLength && (
              <div className="flex justify-between">
                <span className="text-green-200">Length:</span>
                <span className="font-medium">
                  {config.paper.customLength}cm
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-green-200">Capacity:</span>
              <span className="font-medium">
                {config.paper?.capacity.toFixed(1)}g
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-200">Price:</span>
              <span className="font-bold text-green-400">
                ฿{config.paper?.price}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
          <h3 className="text-xl font-bold mb-4">Filter</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-green-200">Type:</span>
              <span className="font-medium">{config.filter?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-200">Price:</span>
              <span className="font-bold text-green-400">
                ฿{config.filter?.price}
              </span>
            </div>
          </div>
        </div>

        {/* Filling Section */}
        <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
          <h3 className="text-xl font-bold mb-4">Filling Composition</h3>

          {/* Worm */}
          {config.filling?.worm && (
            <div className="mb-4 p-4 bg-amber-500/10 rounded-xl border border-amber-400/30">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{config.filling.worm.name}</div>
                  <div className="text-sm text-green-200">
                    Weight: {config.filling.worm.weight.toFixed(2)}g
                  </div>
                </div>
                <div className="font-bold text-green-400">
                  ฿{config.filling.worm.basePrice}
                </div>
              </div>
            </div>
          )}

          {/* Flower */}
          {config.filling?.flower?.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-bold text-green-200 mb-2">
                Flower:
              </div>
              <div className="space-y-2">
                {config.filling.flower.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-green-200">
                        {item.weight.toFixed(2)}g ({item.percentage.toFixed(1)}
                        %)
                      </div>
                    </div>
                    <div className="font-bold text-green-400">
                      ฿{(item.weight * item.pricePerGram).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hash */}
          {config.filling?.hash?.length > 0 && (
            <div>
              <div className="text-sm font-bold text-green-200 mb-2">Hash:</div>
              <div className="space-y-2">
                {config.filling.hash.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-yellow-600/10 rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-green-200">
                        {item.weight.toFixed(2)}g ({item.percentage.toFixed(1)}
                        %)
                      </div>
                    </div>
                    <div className="font-bold text-green-400">
                      ฿{(item.weight * item.pricePerGram).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* External Section */}
        {(config.external?.coating || config.external?.wrap) && (
          <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
            <h3 className="text-xl font-bold mb-4">External Enhancements</h3>
            <div className="space-y-2">
              {config.external.coating && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {config.external.coating.name}
                  </span>
                  <span className="font-bold text-green-400">
                    ฿{config.external.coating.price}
                  </span>
                </div>
              )}
              {config.external.wrap && (
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {config.external.wrap.name}
                  </span>
                  <span className="font-bold text-green-400">
                    ฿{config.external.wrap.price}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Total Price */}
      <div className="p-8 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-2xl border-2 border-green-400/50 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-green-200 mb-1">Total Price</div>
            <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-emerald-300">
              ฿{config.totalPrice.toFixed(0)}
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-start pt-6">
        <button
          onClick={onPrev}
          className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-all duration-300 border border-white/20"
        >
          ← Back to External
        </button>
      </div>
    </div>
  );
}
