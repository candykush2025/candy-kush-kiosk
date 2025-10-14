import { customizationOptions } from "../data/options";

export default function ExternalCustomization({
  externalCustomization,
  setExternalCustomization,
  handleStepTransition,
}) {
  const toggleCustomization = (customization) => {
    setExternalCustomization((prev) => {
      const exists = prev.find((c) => c.id === customization.id);
      if (exists) {
        return prev.filter((c) => c.id !== customization.id);
      } else {
        return [...prev, customization];
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          External Customization
        </h2>
        <p className="text-green-300 text-lg">
          Add special coatings and enhancements
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {customizationOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => toggleCustomization(option)}
            className={`bg-gradient-to-r from-yellow-800/30 to-yellow-700/30 backdrop-blur-sm border border-yellow-600/30 rounded-xl p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-yellow-400/50 ${
              externalCustomization.find((c) => c.id === option.id)
                ? "ring-2 ring-yellow-400 bg-yellow-600/20"
                : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{option.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {option.name}
                  </h3>
                  <p className="text-yellow-300 mb-2">{option.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-yellow-400 font-semibold">
                        Effect:
                      </span>
                      <p className="text-gray-300">{option.effect}</p>
                    </div>
                    <div>
                      <span className="text-yellow-400 font-semibold">
                        Visual:
                      </span>
                      <p className="text-gray-300">{option.visual}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-white font-bold text-xl">฿{option.price}</p>
                {externalCustomization.find((c) => c.id === option.id) && (
                  <span className="text-green-400 text-sm">✓ Selected</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => handleStepTransition(3, "left")}
          className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => handleStepTransition(5)}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
