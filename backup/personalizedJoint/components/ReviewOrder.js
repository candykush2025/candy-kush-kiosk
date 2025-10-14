import { calculateTotal } from "../utils/pricing";

export default function ReviewOrder({
  selectedPaper,
  selectedFilter,
  fillingComposition,
  externalCustomization,
  handleStepTransition,
  router,
}) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          Review Your Custom Joint
        </h2>
        <p className="text-green-300 text-lg">
          Confirm your personalized creation
        </p>
      </div>

      {/* Joint Preview */}
      <div className="bg-gradient-to-r from-green-800/30 to-green-700/30 backdrop-blur-sm border border-green-600/30 rounded-xl p-6 mb-6">
        <h3 className="text-xl font-bold text-white mb-4 text-center">
          Your Custom Joint
        </h3>

        <div className="text-center mb-6">
          <div className="inline-block bg-gradient-to-r from-yellow-600/20 to-green-600/20 p-8 rounded-full border-4 border-green-400/30">
            <span className="text-6xl">🚬</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Configuration Summary */}
          <div className="space-y-4">
            <div>
              <h4 className="text-green-400 font-semibold">Rolling Paper:</h4>
              <p className="text-white">
                {selectedPaper?.name} ({selectedPaper?.capacity}g)
              </p>
            </div>

            <div>
              <h4 className="text-green-400 font-semibold">Filter:</h4>
              <p className="text-white">{selectedFilter?.name}</p>
            </div>

            <div>
              <h4 className="text-green-400 font-semibold">
                Filling Composition:
              </h4>
              <p className="text-white">
                {fillingComposition.flower.percentage}% Flower (
                {fillingComposition.flower.weight}g)
              </p>
              <p className="text-white">
                {fillingComposition.hash.percentage}% Hash (
                {fillingComposition.hash.weight}g)
              </p>
              {fillingComposition.worm && (
                <p className="text-yellow-400">+ Worm (Donut Style)</p>
              )}
            </div>

            {fillingComposition.flower.strains.length > 0 && (
              <div>
                <h4 className="text-green-400 font-semibold">Strains:</h4>
                {fillingComposition.flower.strains.map((strain) => (
                  <p key={strain.id} className="text-white text-sm">
                    • {strain.name} ({strain.type})
                  </p>
                ))}
              </div>
            )}

            {fillingComposition.hash.types.length > 0 && (
              <div>
                <h4 className="text-green-400 font-semibold">Hash Types:</h4>
                {fillingComposition.hash.types.map((hash) => (
                  <p key={hash.id} className="text-white text-sm">
                    • {hash.name} ({hash.grade})
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Customizations & Price */}
          <div className="space-y-4">
            {externalCustomization.length > 0 && (
              <div>
                <h4 className="text-yellow-400 font-semibold">
                  External Customizations:
                </h4>
                {externalCustomization.map((custom) => (
                  <p key={custom.id} className="text-white text-sm">
                    • {custom.name}
                  </p>
                ))}
              </div>
            )}

            <div className="bg-green-900/50 p-4 rounded-lg">
              <h4 className="text-green-400 font-semibold text-lg">
                Total Price:
              </h4>
              <p className="text-white text-3xl font-bold">
                ฿
                {calculateTotal(
                  selectedPaper,
                  selectedFilter,
                  fillingComposition,
                  externalCustomization
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => handleStepTransition(4, "left")}
          className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => {
            router.push("/menu");
          }}
          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-colors font-bold text-lg"
        >
          Add to Cart - ฿
          {calculateTotal(
            selectedPaper,
            selectedFilter,
            fillingComposition,
            externalCustomization
          )}
        </button>
      </div>
    </div>
  );
}
