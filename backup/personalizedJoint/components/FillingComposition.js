import Image from "next/image";
import { strainOptions, hashOptions } from "../data/options";

export default function FillingComposition({
  selectedPaper,
  fillingComposition,
  setFillingComposition,
  handleStepTransition,
}) {
  const handleCompositionChange = (type, percentage) => {
    const otherType = type === "flower" ? "hash" : "flower";
    const otherPercentage = 100 - percentage;

    setFillingComposition((prev) => ({
      ...prev,
      [type]: { ...prev[type], percentage },
      [otherType]: { ...prev[otherType], percentage: otherPercentage },
    }));
  };

  const addStrain = (strain) => {
    if (!fillingComposition.flower.strains.find((s) => s.id === strain.id)) {
      setFillingComposition((prev) => ({
        ...prev,
        flower: {
          ...prev.flower,
          strains: [...prev.flower.strains, strain],
        },
      }));
    }
  };

  const removeStrain = (strainId) => {
    setFillingComposition((prev) => ({
      ...prev,
      flower: {
        ...prev.flower,
        strains: prev.flower.strains.filter((s) => s.id !== strainId),
      },
    }));
  };

  const addHash = (hash) => {
    if (!fillingComposition.hash.types.find((h) => h.id === hash.id)) {
      setFillingComposition((prev) => ({
        ...prev,
        hash: {
          ...prev.hash,
          types: [...prev.hash.types, hash],
        },
      }));
    }
  };

  const removeHash = (hashId) => {
    setFillingComposition((prev) => ({
      ...prev,
      hash: {
        ...prev.hash,
        types: prev.hash.types.filter((h) => h.id !== hashId),
      },
    }));
  };

  const toggleWorm = () => {
    setFillingComposition((prev) => ({
      ...prev,
      worm: !prev.worm,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          Filling Composition
        </h2>
        <p className="text-green-300 text-lg">
          Total Capacity: {selectedPaper?.capacity}g
        </p>
      </div>

      {/* Composition Slider */}
      <div className="bg-gradient-to-r from-green-800/30 to-green-700/30 backdrop-blur-sm border border-green-600/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Flower vs Hash Ratio
        </h3>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-400">
              Flower: {fillingComposition.flower.percentage}% (
              {fillingComposition.flower.weight}g)
            </span>
            <span className="text-purple-400">
              Hash: {fillingComposition.hash.percentage}% (
              {fillingComposition.hash.weight}g)
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={fillingComposition.flower.percentage}
            onChange={(e) =>
              handleCompositionChange("flower", parseInt(e.target.value))
            }
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />

          <div className="flex justify-between mt-2">
            <span className="text-green-400 text-sm">100% Flower</span>
            <span className="text-purple-400 text-sm">100% Hash</span>
          </div>
        </div>

        {/* Worm Option */}
        <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={fillingComposition.worm}
              onChange={toggleWorm}
              className="w-5 h-5 text-yellow-600"
            />
            <div>
              <span className="text-yellow-400 font-semibold">
                Add Worm (Donut Style) +฿30
              </span>
              <p className="text-gray-300 text-sm">
                Concentrated hash core through the center
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Flower Selection */}
      {fillingComposition.flower.percentage > 0 && (
        <div className="bg-gradient-to-r from-green-800/30 to-green-700/30 backdrop-blur-sm border border-green-600/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            Select Flower Strains
          </h3>

          {fillingComposition.flower.strains.length > 0 && (
            <div className="mb-4">
              <h4 className="text-green-400 mb-2">Selected Strains:</h4>
              <div className="flex flex-wrap gap-2">
                {fillingComposition.flower.strains.map((strain) => (
                  <div
                    key={strain.id}
                    className="bg-green-700/50 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    <span className="text-white text-sm">{strain.name}</span>
                    <button
                      onClick={() => removeStrain(strain.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
            {strainOptions.map((strain) => (
              <div
                key={strain.id}
                onClick={() => addStrain(strain)}
                className={`p-4 border border-green-600/30 rounded-lg cursor-pointer transition-all duration-200 hover:border-green-400/50 ${
                  fillingComposition.flower.strains.find(
                    (s) => s.id === strain.id
                  )
                    ? "bg-green-600/20 border-green-400"
                    : "bg-green-800/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={strain.image}
                    alt={strain.name}
                    width={40}
                    height={40}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <h4 className="text-white font-semibold">{strain.name}</h4>
                    <p className="text-green-300 text-sm">
                      {strain.type} • THC: {strain.thc}
                    </p>
                    <p className="text-gray-400 text-xs">{strain.flavor}</p>
                  </div>
                  <span className="text-white font-bold">
                    ฿{strain.price}/g
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hash Selection */}
      {fillingComposition.hash.percentage > 0 && (
        <div className="bg-gradient-to-r from-purple-800/30 to-purple-700/30 backdrop-blur-sm border border-purple-600/30 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">
            Select Hash Types
          </h3>

          {fillingComposition.hash.types.length > 0 && (
            <div className="mb-4">
              <h4 className="text-purple-400 mb-2">Selected Hash:</h4>
              <div className="flex flex-wrap gap-2">
                {fillingComposition.hash.types.map((hash) => (
                  <div
                    key={hash.id}
                    className="bg-purple-700/50 px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    <span className="text-white text-sm">{hash.name}</span>
                    <button
                      onClick={() => removeHash(hash.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
            {hashOptions.map((hash) => (
              <div
                key={hash.id}
                onClick={() => addHash(hash)}
                className={`p-4 border border-purple-600/30 rounded-lg cursor-pointer transition-all duration-200 hover:border-purple-400/50 ${
                  fillingComposition.hash.types.find((h) => h.id === hash.id)
                    ? "bg-purple-600/20 border-purple-400"
                    : "bg-purple-800/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-semibold">{hash.name}</h4>
                    <p className="text-purple-300 text-sm">
                      {hash.grade} • THC: {hash.thc}
                    </p>
                    <p className="text-gray-400 text-xs">{hash.description}</p>
                  </div>
                  <span className="text-white font-bold">฿{hash.price}/g</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => handleStepTransition(2, "left")}
          className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => handleStepTransition(4)}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Continue →
        </button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #10b981, #34d399);
          cursor: pointer;
          border: 2px solid #065f46;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #10b981, #34d399);
          cursor: pointer;
          border: 2px solid #065f46;
        }
      `}</style>
    </div>
  );
}
