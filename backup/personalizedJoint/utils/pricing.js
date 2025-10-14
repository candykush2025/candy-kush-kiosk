// Calculate total price for the custom joint
export const calculateTotal = (
  selectedPaper,
  selectedFilter,
  fillingComposition,
  externalCustomization
) => {
  let total = 0;

  if (selectedPaper) {
    total += selectedPaper.selectedVariant?.price || selectedPaper.price;
  }
  if (selectedFilter) total += selectedFilter.price;

  fillingComposition.flower.strains.forEach((strain) => {
    const strainWeight =
      fillingComposition.flower.weight /
      fillingComposition.flower.strains.length;
    total += strain.price * strainWeight;
  });

  fillingComposition.hash.types.forEach((hash) => {
    const hashWeight =
      fillingComposition.hash.weight / fillingComposition.hash.types.length;
    total += hash.price * hashWeight;
  });

  if (fillingComposition.worm) {
    total += 30; // Worm donut style fee
  }

  externalCustomization.forEach((custom) => {
    total += custom.price;
  });

  return total.toFixed(0);
};
