"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  getFilterOptions,
  getCompatibilityRules,
} from "@/lib/jointBuilderService";

export default function FilterStep({ config, updateConfig, onNext, onPrev }) {
  const [filterOptions, setFilterOptions] = useState([]);
  const [compatibilityRules, setCompatibilityRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const backdropRef = useRef(null);
  const [selectedFilter, setSelectedFilter] = useState(
    config.filter?.id || null
  );
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedFilterForModal, setSelectedFilterForModal] = useState(null);

  // Fetch filter options and compatibility rules from Firebase
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [filters, rules] = await Promise.all([
          getFilterOptions(),
          getCompatibilityRules(config.paper?.type),
        ]);
        setFilterOptions(filters);
        setCompatibilityRules(rules);
      } catch (error) {
        console.error("Error fetching filter data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterData();
  }, [config.paper?.type]);

  // Check if paper type is pre-rolled or glass cone (built-in filter)
  const isPreRolled = config.paper?.type === "pre-rolled-ck";
  const isGlassCone = config.paper?.type === "glass-cone";
  const hasBuiltInFilter = isPreRolled || isGlassCone;
  const paperType = config.paper?.type;
  const customLength = config.paper?.customLength || 0;

  console.log(
    "FilterStep - paperType:",
    paperType,
    "isPreRolled:",
    isPreRolled
  );

  // Filter available options based on compatibility rules from Firebase
  const availableFilters = useMemo(() => {
    if (!paperType || compatibilityRules.length === 0) return filterOptions;

    // Find the rule for the current paper type
    const rule = compatibilityRules.find((r) => r.paperType === paperType);
    if (!rule) return filterOptions;

    // Apply the rule
    return filterOptions.filter((filter) => {
      // Check if filter is allowed
      const isAllowed = rule.allowedFilters.includes(filter.id);

      // For custom paper, also check length restrictions
      if (paperType === "rolling-paper-custom" && customLength > 0) {
        if (customLength <= 12) {
          return filter.id === "paper-filter" || filter.glassSize === "10mm";
        } else if (customLength <= 16) {
          return filter.id === "paper-filter";
        } else {
          return filter.id === "paper-filter";
        }
      }

      return isAllowed;
    });
  }, [paperType, customLength, filterOptions, compatibilityRules]);

  const handleFilterSelect = (filter) => {
    // If filter has sizes, open modal
    if (filter.hasSizes) {
      setSelectedFilterForModal(filter);
      setShowSizeModal(true);
    } else {
      // Glass filters - select directly
      setSelectedFilter(filter.id);
      updateConfig("filter", {
        id: filter.id,
        name: filter.name,
        type: filter.id,
        price: filter.price,
      });
    }
  };

  const handleSizeSelect = (size) => {
    const filter = selectedFilterForModal;
    setSelectedFilter(filter.id);
    updateConfig("filter", {
      id: filter.id,
      name: `${filter.name} (${size.label})`,
      type: filter.id,
      size: size.id,
      price: size.price,
    });
    setShowSizeModal(false);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-green-400">Loading filter options...</p>
        </div>
      </div>
    );
  }

  // If pre-rolled or glass cone, show message and skip this step
  if (hasBuiltInFilter) {
    return (
      <div className="space-y-6">
        <div className="p-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30 text-center">
          <div className="text-6xl mb-4">✓</div>
          <h2 className="text-3xl font-bold mb-2">Filter Already Included</h2>
          <p className="text-green-200 text-lg">
            {isGlassCone
              ? "Glass cones come with a built-in glass filter. No need to select one!"
              : "Pre-rolled cones come with a built-in filter. No need to select one!"}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <button
            onClick={onPrev}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition-all duration-300 border border-white/20"
          >
            ← Back to Paper
          </button>
          <button
            onClick={onNext}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl"
          >
            Continue to Filling →
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold mb-2">Choose Your Filter</h2>
          <p className="text-green-200">
            Select the filter tip for optimal airflow
          </p>
        </div>

        {/* Filter Options Grid */}
        <div className="grid grid-cols-1 gap-4">
          {availableFilters.map((filter) => (
            <div
              key={filter.id}
              onClick={() => handleFilterSelect(filter)}
              className={`
              relative p-6 rounded-2xl cursor-pointer transition-all duration-300
              border-2
              ${
                selectedFilter === filter.id
                  ? "border-green-400 bg-white/20 scale-105 shadow-2xl shadow-green-500/30"
                  : "border-white/20 bg-white/5 hover:bg-white/10 hover:scale-102"
              }
            `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{filter.name}</h3>
                    <p className="text-green-200">{filter.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400">
                    ฿{filter.price}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Comparison */}
        <div className="mt-6 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
          <h3 className="text-xl font-bold mb-4">Filter Comparison</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-200">Coolest Smoke:</span>
              <span className="font-medium">
                Wide Glass {">"} Slim Glass {">"} Paper
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-200">Airflow:</span>
              <span className="font-medium">
                Wide Glass {">"} Slim Glass {">"} Paper
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-200">Reusability:</span>
              <span className="font-medium">Glass filters can be cleaned</span>
            </div>
          </div>
        </div>

        {/* Selection Summary */}
        {config.filter && (
          <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30 animate-slideIn">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-200 mb-1">
                  Selected Filter
                </div>
                <div className="text-2xl font-bold">{config.filter.name}</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">
                  ฿{config.filter.price}
                </div>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes scaleIn {
            from {
              transform: scale(0);
            }
            to {
              transform: scale(1);
            }
          }
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-scaleIn {
            animation: scaleIn 0.3s ease-out;
          }
          .animate-slideIn {
            animation: slideIn 0.5s ease-out;
          }
        `}</style>
      </div>

      {/* Size Selection Modal */}
      {showSizeModal &&
        selectedFilterForModal &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            ref={backdropRef}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === backdropRef.current) {
                setShowSizeModal(false);
              }
            }}
          >
            <div
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border-2 border-green-400/30"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">Select Size</h3>
                <button
                  onClick={() => setShowSizeModal(false)}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                >
                  <span className="text-2xl text-white">×</span>
                </button>
              </div>

              <div className="space-y-3">
                {selectedFilterForModal.sizes.map((size) => (
                  <div
                    key={size.id}
                    onClick={() => handleSizeSelect(size)}
                    className="p-5 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-between border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-green-400/50"
                  >
                    <div>
                      <div className="font-bold text-xl text-white">
                        {size.label}
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-green-400">
                      ฿{size.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
