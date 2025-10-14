import { paperOptions } from "../data/options";
import { useState } from "react";

export default function PaperSelection({
  selectedPaper,
  setSelectedPaper,
  customLength,
  setCustomLength,
  handleStepTransition,
}) {
  const [selectedVariants, setSelectedVariants] = useState({});

  const handlePaperSelection = (paper, variant = null) => {
    if (paper.hasVariants && !variant) {
      // Don't select paper with variants until a variant is chosen
      return;
    }

    const paperToSelect = variant
      ? { ...paper, selectedVariant: variant }
      : paper;
    setSelectedPaper(paperToSelect);
  };

  const handleVariantSelection = (paper, variant) => {
    setSelectedVariants({ ...selectedVariants, [paper.id]: variant });
    handlePaperSelection(paper, variant);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          Choose Your Rolling Paper
        </h2>
        <p className="text-green-300 text-lg">
          Select the foundation for your custom joint
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-green-600 scrollbar-track-green-900/20">
        {paperOptions.map((paper) => (
          <div key={paper.id}>
            <div
              onClick={() => handlePaperSelection(paper)}
              className={`bg-gradient-to-r from-green-800/30 to-green-700/30 backdrop-blur-sm border border-green-600/30 rounded-xl p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-green-400/50 ${
                selectedPaper?.id === paper.id ||
                (paper.hasVariants && selectedVariants[paper.id])
                  ? "ring-2 ring-green-400 bg-green-600/20"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {paper.name}
                      </h3>
                      {!paper.hasVariants && (
                        <p className="text-green-300">
                          {paper.capacity}g capacity
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 mb-3">{paper.description}</p>

                  {!paper.hasVariants && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-green-400 font-semibold">
                          Material:
                        </span>
                        <p className="text-gray-300">{paper.material}</p>
                      </div>
                      <div>
                        <span className="text-green-400 font-semibold">
                          Length:
                        </span>
                        <p className="text-gray-300">{paper.length}</p>
                      </div>
                      <div>
                        <span className="text-green-400 font-semibold">
                          Burn Time:
                        </span>
                        <p className="text-gray-300">{paper.burnTime}</p>
                      </div>
                      <div>
                        <span className="text-green-400 font-semibold">
                          Price:
                        </span>
                        <p className="text-white font-bold">฿{paper.price}</p>
                      </div>
                    </div>
                  )}

                  {paper.hasVariants && (
                    <div className="mt-4">
                      <p className="text-green-400 font-semibold mb-3">
                        Choose Size:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {paper.variants.map((variant) => (
                          <div
                            key={variant.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVariantSelection(paper, variant);
                            }}
                            className={`bg-green-900/20 border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-green-800/30 ${
                              selectedVariants[paper.id]?.id === variant.id
                                ? "border-green-400 bg-green-700/30"
                                : "border-green-600/30"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="text-white font-semibold">
                                  {variant.name}
                                </h4>
                                <p className="text-gray-400 text-sm">
                                  {variant.description}
                                </p>
                                <div className="flex gap-4 mt-2 text-xs">
                                  <span className="text-green-300">
                                    Length: {variant.length}
                                  </span>
                                  <span className="text-green-300">
                                    Burn: {variant.burnTime}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-bold">
                                  ฿{variant.price}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {paper.type === "custom" && (
                  <div className="ml-4">
                    <label className="text-green-400 block mb-2">
                      Length (cm):
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="15"
                      value={customLength}
                      onChange={(e) => setCustomLength(e.target.value)}
                      className="w-full"
                    />
                    <span className="text-white text-sm">{customLength}cm</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-end mt-8">
        {selectedPaper && (
          <button
            onClick={() => handleStepTransition(2)}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
