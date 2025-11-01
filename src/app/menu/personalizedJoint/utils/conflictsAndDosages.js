/**
 * Joint Builder Conflicts and Dosage Rules
 * Implements all business logic for joint customization restrictions and calculations
 */

// Paper types
export const PAPER_TYPES = {
  PRE_ROLLED_CK: "pre-rolled-ck",
  HEMP_WRAP: "hemp-wrap",
  GOLDEN_PAPER: "golden-paper",
  CUSTOM_PAPER: "custom-paper",
};

// Filter types
export const FILTER_TYPES = {
  PAPER_SMALL: "paper-small", // 2.0 cm for ≤12cm joints
  PAPER_MEDIUM: "paper-medium", // 3.5 cm for 12-16cm joints
  PAPER_LARGE: "paper-large", // 5.0 cm for 16-23cm joints
  GLASS_SMALL: "glass-10mm", // 10mm glass
  GLASS_LARGE: "glass-12mm", // 12mm glass
};

// Filter lengths for custom paper (invisible to user)
export const FILTER_LENGTHS = {
  [FILTER_TYPES.PAPER_SMALL]: 2.0,
  [FILTER_TYPES.PAPER_MEDIUM]: 3.5,
  [FILTER_TYPES.PAPER_LARGE]: 5.0,
  [FILTER_TYPES.GLASS_SMALL]: 2.0,
  [FILTER_TYPES.GLASS_LARGE]: 2.0,
};

/**
 * SECTION 1: CONFLICT RULES
 */

/**
 * Check if filter is allowed for given paper type and length
 */
export const isFilterAllowed = (paperType, filterType, jointLength = null) => {
  switch (paperType) {
    case PAPER_TYPES.PRE_ROLLED_CK:
      // Pre-rolled cones have built-in filters
      return false;

    case PAPER_TYPES.HEMP_WRAP:
      // Hemp wrap allows: large glass (12mm) or paper filter
      return (
        filterType === FILTER_TYPES.GLASS_LARGE ||
        filterType === FILTER_TYPES.PAPER_SMALL ||
        filterType === FILTER_TYPES.PAPER_MEDIUM ||
        filterType === FILTER_TYPES.PAPER_LARGE
      );

    case PAPER_TYPES.GOLDEN_PAPER:
      // Golden paper allows: paper filter or small glass (10mm)
      return (
        filterType === FILTER_TYPES.PAPER_SMALL ||
        filterType === FILTER_TYPES.PAPER_MEDIUM ||
        filterType === FILTER_TYPES.PAPER_LARGE ||
        filterType === FILTER_TYPES.GLASS_SMALL
      );

    case PAPER_TYPES.CUSTOM_PAPER:
      if (!jointLength) return false;

      // Filter availability by length
      if (jointLength <= 12) {
        return (
          filterType === FILTER_TYPES.PAPER_SMALL ||
          filterType === FILTER_TYPES.GLASS_SMALL
        );
      } else if (jointLength <= 16) {
        return filterType === FILTER_TYPES.PAPER_MEDIUM;
      } else {
        return filterType === FILTER_TYPES.PAPER_LARGE;
      }

    default:
      return true;
  }
};

/**
 * Check if internal options (worm/rosin donut) are allowed
 */
export const areInternalOptionsAllowed = (paperType) => {
  // Pre-rolled cones don't allow internal worm/donut
  return paperType !== PAPER_TYPES.PRE_ROLLED_CK;
};

/**
 * Check if multiple external top-ups are allowed
 */
export const canAddMultipleExternalTopUps = () => {
  // Only ONE external top-up is allowed at a time
  return false;
};

/**
 * Check if tobacco is required (hash-only joints)
 */
export const isTobaccoRequired = (filling) => {
  const hasHash = filling.hash && filling.hash.length > 0;
  const hasFlower = filling.flower && filling.flower.length > 0;
  const hasWorm = filling.worm !== null;

  // Tobacco required if ONLY hash (no flower, no worm)
  return hasHash && !hasFlower && !hasWorm;
};

/**
 * Calculate required tobacco for hash-only joints
 */
export const calculateRequiredTobacco = (filling) => {
  if (!isTobaccoRequired(filling)) return 0;

  const totalHash = filling.hash.reduce((sum, h) => sum + (h.weight || 0), 0);

  // 1 cigarette (~1g tobacco) per 0.5g hash
  return (totalHash / 0.5) * 1.0;
};

/**
 * SECTION 2: DOSAGE CALCULATIONS
 */

/**
 * Get pre-rolled cone weights
 */
export const getPreRolledWeights = () => {
  return [
    { size: "0.4g", weight: 0.4, label: "Small (0.4g)" },
    { size: "0.8g", weight: 0.8, label: "Medium (0.8g)" },
    { size: "1.2g", weight: 1.2, label: "Large (1.2g)" },
  ];
};

/**
 * Get filter length for custom paper based on joint length
 */
export const getFilterLengthForCustomPaper = (jointLength) => {
  if (jointLength <= 12) return FILTER_LENGTHS[FILTER_TYPES.PAPER_SMALL];
  if (jointLength <= 16) return FILTER_LENGTHS[FILTER_TYPES.PAPER_MEDIUM];
  return FILTER_LENGTHS[FILTER_TYPES.PAPER_LARGE];
};

/**
 * Calculate effective filling space for custom paper
 */
export const calculateEffectiveFillSpace = (totalLength, filterLength) => {
  return totalLength - filterLength;
};

/**
 * Calculate internal fill capacity based on effective space
 * Reference: 18cm effective space = 7.0g
 */
export const calculateInternalCapacity = (effectiveFillSpace) => {
  const REFERENCE_LENGTH = 18; // cm
  const REFERENCE_WEIGHT = 7.0; // g

  return (effectiveFillSpace / REFERENCE_LENGTH) * REFERENCE_WEIGHT;
};

/**
 * Get dosage for custom paper joint
 */
export const getCustomPaperDosage = (jointLength) => {
  const filterLength = getFilterLengthForCustomPaper(jointLength);
  const effectiveSpace = calculateEffectiveFillSpace(jointLength, filterLength);
  const capacity = calculateInternalCapacity(effectiveSpace);

  return {
    totalLength: jointLength,
    filterLength,
    effectiveSpace,
    internalCapacity: Math.round(capacity * 10) / 10, // Round to 0.1g
    minTopUp: 0.3,
    maxTopUp: 1.2,
  };
};

/**
 * Get dosage for hemp wrap
 */
export const getHempWrapDosage = () => {
  return {
    standardWeights: [1.5, 2.0],
    minTopUp: 0.3,
    maxTopUp: 1.2,
  };
};

/**
 * Get dosage for golden paper
 */
export const getGoldenPaperDosage = () => {
  return {
    baseWeight: 1.0,
    minTopUp: 0.3,
    maxTopUp: 1.2,
  };
};

/**
 * Get top-up dosage ranges
 */
export const getTopUpDosage = (jointLength = null) => {
  return {
    standard: {
      min: 0.3,
      max: 1.2,
      step: 0.1,
    },
    spiral: {
      min: 0.5,
      max: 1.2,
      step: 0.1,
    },
  };
};

/**
 * Validate if filling is within capacity
 */
export const validateFillingCapacity = (
  paperType,
  filling,
  jointLength = null,
  paperCapacity = null
) => {
  let maxCapacity = 0;

  // Normalize paper type check (handle both "custom-paper" and "rolling-paper-custom")
  const isCustomPaper =
    paperType === PAPER_TYPES.CUSTOM_PAPER ||
    paperType === "rolling-paper-custom" ||
    (paperType && paperType.includes("custom"));
  const isPreRolled =
    paperType === PAPER_TYPES.PRE_ROLLED_CK ||
    (paperType && paperType.includes("pre-rolled"));
  const isHempWrap =
    paperType === PAPER_TYPES.HEMP_WRAP ||
    (paperType && paperType.includes("hemp"));
  const isGoldenPaper =
    paperType === PAPER_TYPES.GOLDEN_PAPER ||
    (paperType && paperType.includes("golden"));
  const isStandardPaper = paperType && paperType.includes("standard");
  const isGlassCone = paperType && paperType.includes("glass");

  if (isPreRolled) {
    // Get selected cone size
    const coneWeight = filling.totalCapacity || paperCapacity || 0.4;
    maxCapacity = coneWeight;
  } else if (isHempWrap) {
    maxCapacity = filling.totalCapacity || paperCapacity || 2.0;
  } else if (isGoldenPaper) {
    maxCapacity = paperCapacity || 1.0;
  } else if (isStandardPaper) {
    maxCapacity = paperCapacity || 1.0;
  } else if (isGlassCone) {
    maxCapacity = paperCapacity || 1.0;
  } else if (isCustomPaper) {
    if (paperCapacity) {
      // Use the actual capacity from config.paper
      maxCapacity = paperCapacity;
    } else if (jointLength) {
      const dosage = getCustomPaperDosage(jointLength);
      maxCapacity = dosage.internalCapacity;
    }
  } else if (paperCapacity) {
    // Fallback: use provided capacity for any unrecognized paper type
    maxCapacity = paperCapacity;
  }

  const totalFill = calculateTotalFilling(filling);
  const tolerance = 0.1; // ±10% tolerance

  return {
    isValid: totalFill <= maxCapacity * (1 + tolerance),
    currentFill: totalFill,
    maxCapacity,
    remaining: Math.max(0, maxCapacity - totalFill),
  };
};

/**
 * Calculate total filling weight
 * Note: Worm is NOT included in capacity calculations as it sits in the center
 * and doesn't take space from the flower/hash capacity
 */
export const calculateTotalFilling = (filling) => {
  let total = 0;

  // Flower
  if (filling.flower && Array.isArray(filling.flower)) {
    total += filling.flower.reduce((sum, f) => sum + (f.weight || 0), 0);
  }

  // Hash
  if (filling.hash && Array.isArray(filling.hash)) {
    total += filling.hash.reduce((sum, h) => sum + (h.weight || 0), 0);
  }

  // Worm/Rosin - NOT included in capacity calculation
  // The worm sits in the center and doesn't take space from capacity
  // if (filling.worm && filling.worm.weight) {
  //   total += filling.worm.weight;
  // }

  return Math.round(total * 10) / 10; // Round to 0.1g
};

/**
 * Get suggested dosage examples for custom paper
 */
export const getSuggestedDosages = () => {
  return [
    { length: 23, suggestedFill: 7.0 },
    { length: 20, suggestedFill: 6.0 },
    { length: 18, suggestedFill: 5.2 },
    { length: 15, suggestedFill: 4.0 },
    { length: 10, suggestedFill: 2.5 },
    { length: 5, suggestedFill: 1.0 },
  ];
};

/**
 * Get available filters for paper type
 */
export const getAvailableFilters = (paperType, jointLength = null) => {
  const allFilters = [
    {
      type: FILTER_TYPES.PAPER_SMALL,
      name: "Paper Filter (Small)",
      length: 2.0,
    },
    {
      type: FILTER_TYPES.PAPER_MEDIUM,
      name: "Paper Filter (Medium)",
      length: 3.5,
    },
    {
      type: FILTER_TYPES.PAPER_LARGE,
      name: "Paper Filter (Large)",
      length: 5.0,
    },
    {
      type: FILTER_TYPES.GLASS_SMALL,
      name: "Glass Filter (10mm)",
      length: 2.0,
    },
    {
      type: FILTER_TYPES.GLASS_LARGE,
      name: "Glass Filter (12mm)",
      length: 2.0,
    },
  ];

  return allFilters.filter((filter) =>
    isFilterAllowed(paperType, filter.type, jointLength)
  );
};

/**
 * Validation: Check if configuration is valid
 */
export const validateConfiguration = (config) => {
  const errors = [];

  // Check paper selection
  if (!config.paper) {
    errors.push("Please select a paper type");
  }

  // Check filter (if required)
  if (
    config.paper &&
    config.paper.type !== PAPER_TYPES.PRE_ROLLED_CK &&
    !config.filter
  ) {
    errors.push("Please select a filter");
  }

  // Check filling
  if (
    !config.filling ||
    ((!config.filling.flower || config.filling.flower.length === 0) &&
      (!config.filling.hash || config.filling.hash.length === 0))
  ) {
    errors.push("Please add at least some flower or hash");
  }

  // Check tobacco requirement
  if (isTobaccoRequired(config.filling)) {
    const requiredTobacco = calculateRequiredTobacco(config.filling);
    const currentTobacco = config.filling.tobacco || 0;

    if (currentTobacco < requiredTobacco * 0.95) {
      // 5% tolerance
      errors.push(
        `Hash-only joint requires ${requiredTobacco.toFixed(1)}g of tobacco`
      );
    }
  }

  // Check capacity
  if (config.paper) {
    const validation = validateFillingCapacity(
      config.paper.type,
      config.filling,
      config.paper.customLength,
      config.paper.capacity
    );

    if (!validation.isValid) {
      errors.push(
        `Filling exceeds capacity (${validation.currentFill}g / ${validation.maxCapacity}g)`
      );
    }
  }

  // Check external top-ups (only one allowed)
  const externalCount = [
    config.external?.coating,
    config.external?.wrap,
  ].filter(Boolean).length;

  if (externalCount > 1) {
    errors.push("Only one external top-up is allowed");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
