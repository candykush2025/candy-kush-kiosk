import { calculateTotal } from "../utils/pricing";

export default function PriceDisplay({
  selectedPaper,
  selectedFilter,
  fillingComposition,
  externalCustomization,
}) {
  const hasSelections =
    selectedPaper ||
    selectedFilter ||
    fillingComposition.flower.strains.length > 0 ||
    fillingComposition.hash.types.length > 0 ||
    externalCustomization.length > 0;

  if (!hasSelections) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-full shadow-xl border border-green-400/30 backdrop-blur-sm">
      <div className="text-sm text-green-200">Current Total:</div>
      <div className="text-xl font-bold">
        ฿
        {calculateTotal(
          selectedPaper,
          selectedFilter,
          fillingComposition,
          externalCustomization
        )}
      </div>
    </div>
  );
}
