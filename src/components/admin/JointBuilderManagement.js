"use client";

import { useState, useEffect } from "react";
import {
  getJointBuilderSteps,
  getAllPaperOptions,
  getAllFilterOptions,
  getAllFillingOptions,
  getAllExternalOptions,
  savePaperOption,
  saveFilterOption,
  saveFillingOption,
  saveExternalOption,
  deletePaperOption,
  deleteFilterOption,
  deleteFillingOption,
  deleteExternalOption,
} from "@/lib/jointBuilderService";

export default function JointBuilderManagement() {
  const [loading, setLoading] = useState(true);

  // Steps data
  const [steps, setSteps] = useState([]);
  // Data states
  const [papers, setPapers] = useState([]);
  const [filters, setFilters] = useState([]);
  const [flowers, setFlowers] = useState([]);
  const [hashes, setHashes] = useState([]);
  const [worms, setWorms] = useState([]);
  const [coatings, setCoatings] = useState([]);
  const [wraps, setWraps] = useState([]);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingType, setEditingType] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        stepsData,
        papersData,
        filtersData,
        flowersData,
        hashesData,
        wormsData,
        coatingsData,
        wrapsData,
      ] = await Promise.all([
        getJointBuilderSteps(),
        getAllPaperOptions(),
        getAllFilterOptions(),
        getAllFillingOptions("flower"),
        getAllFillingOptions("hash"),
        getAllFillingOptions("worm"),
        getAllExternalOptions("coating"),
        getAllExternalOptions("wrap"),
      ]);

      setSteps(stepsData);
      setPapers(papersData);
      setFilters(filtersData);
      setFlowers(flowersData);
      setHashes(hashesData);
      setWorms(wormsData);
      setCoatings(coatingsData);
      setWraps(wrapsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Error loading data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item, type) => {
    setEditingItem({ ...item });
    setEditingType(type);
    setShowEditModal(true);
  };

  const handleAdd = (type) => {
    const newItem = {
      id: `new-${Date.now()}`,
      name: "",
      description: "",
      active: true,
      sortOrder: 999,
    };

    // Add type-specific fields
    switch (type) {
      case "paper":
        newItem.selectionType = "variant";
        newItem.variants = [];
        newItem.hasBuiltInFilter = false;
        newItem.sliderConfig = {
          minValue: 7,
          maxValue: 20,
          step: 1,
          unit: "cm",
          basePrice: 20,
          pricePerUnit: 3,
          capacityFormula: "value * 0.28",
        };
        break;
      case "filter":
        newItem.selectionType = "direct";
        newItem.price = 0;
        newItem.variants = [];
        break;
      case "flower":
      case "hash":
      case "worm":
        newItem.category =
          type === "flower" ? "flower" : type === "hash" ? "hash" : "worm";
        newItem.pricePerGram = 0;
        if (type === "worm") {
          newItem.basePrice = 0;
        }
        break;
      case "coating":
      case "wrap":
        newItem.category = type;
        newItem.price = 0;
        break;
    }

    setEditingItem(newItem);
    setEditingType(type);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      let saveFunction;

      switch (editingType) {
        case "paper":
          saveFunction = savePaperOption;
          break;
        case "filter":
          saveFunction = saveFilterOption;
          break;
        case "flower":
        case "hash":
        case "worm":
          saveFunction = saveFillingOption;
          break;
        case "coating":
        case "wrap":
          saveFunction = saveExternalOption;
          break;
      }

      await saveFunction(editingItem);
      setShowEditModal(false);
      setEditingItem(null);
      setEditingType(null);
      await fetchAllData();
      alert("Saved successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving: " + error.message);
    }
  };

  const handleDelete = async (id, type) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      let deleteFunction;

      switch (type) {
        case "paper":
          deleteFunction = deletePaperOption;
          break;
        case "filter":
          deleteFunction = deleteFilterOption;
          break;
        case "flower":
        case "hash":
        case "worm":
          deleteFunction = deleteFillingOption;
          break;
        case "coating":
        case "wrap":
          deleteFunction = deleteExternalOption;
          break;
      }

      await deleteFunction(id);
      await fetchAllData();
      alert("Deleted successfully!");
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading joint builder data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500 p-6 rounded-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Joint Builder Configuration
        </h2>
        <p className="text-gray-600">
          Manage each step of the custom joint building process. Click on any
          step below to expand and edit options.
        </p>
      </div>

      {/* STEP 1: Paper Selection */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white text-green-600 rounded-full flex items-center justify-center font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold">Rolling Paper Selection</h3>
                <p className="text-green-100 mt-1">
                  Customer chooses paper type and size - this determines joint
                  capacity
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{papers.length}</div>
              <div className="text-green-100 text-sm">Paper Types</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">
                Active:{" "}
                <span className="text-green-600 font-bold">
                  {papers.filter((p) => p.active).length}
                </span>{" "}
                | Inactive:{" "}
                <span className="text-gray-500 font-bold">
                  {papers.filter((p) => !p.active).length}
                </span>
              </span>
            </div>
            <button
              onClick={() => handleAdd("paper")}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold shadow-md"
            >
              + Add New Paper
            </button>
          </div>

          {/* Papers List */}
          <div className="grid grid-cols-1 gap-4">
            {papers.map((paper, index) => (
              <div
                key={paper.id}
                className={`border-2 rounded-lg p-4 relative ${
                  paper.active
                    ? "bg-white border-green-200"
                    : "bg-gray-50 border-gray-300 opacity-60"
                }`}
              >
                {/* Action buttons - Top Right */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => handleEdit(paper, "paper")}
                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors shadow-md"
                    title="Edit"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(paper.id, "paper")}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow-md"
                    title="Delete"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex items-start gap-4 pr-28">
                  <div className="text-2xl font-bold text-gray-400">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-gray-800">
                        {paper.name}
                      </h4>
                      {!paper.active && (
                        <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded font-medium">
                          INACTIVE
                        </span>
                      )}
                      {paper.hasBuiltInFilter && (
                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded font-medium">
                          Built-in Filter
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {paper.description}
                    </p>

                    {/* Variant Type Display */}
                    {paper.selectionType === "variant" && paper.variants && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-xs font-semibold text-blue-700 mb-2">
                          VARIANT OPTIONS ({paper.variants.length})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {paper.variants.map((variant, vIdx) => (
                            <div
                              key={vIdx}
                              className="bg-white p-2 rounded border border-blue-200"
                            >
                              <div className="font-medium text-gray-800">
                                {variant.name}
                              </div>
                              <div className="flex justify-between text-sm mt-1">
                                <span className="text-gray-600">
                                  Capacity: {variant.capacity}g
                                </span>
                                <span className="text-green-600 font-bold">
                                  ฿{variant.price}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Slider Type Display */}
                    {paper.selectionType === "slider" && paper.sliderConfig && (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-xs font-semibold text-purple-700 mb-2">
                          CUSTOM RANGE (SLIDER)
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <div className="text-gray-600">Range</div>
                            <div className="font-bold text-gray-800">
                              {paper.sliderConfig.minValue}-
                              {paper.sliderConfig.maxValue}
                              {paper.sliderConfig.unit}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Base Price</div>
                            <div className="font-bold text-green-600">
                              ฿{paper.sliderConfig.basePrice}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">
                              Per {paper.sliderConfig.unit}
                            </div>
                            <div className="font-bold text-green-600">
                              ฿{paper.sliderConfig.pricePerUnit}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600">Formula</div>
                            <div className="font-mono text-xs text-gray-800">
                              {paper.sliderConfig.capacityFormula}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 2: Filter Selection */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold">Filter Selection</h3>
                <p className="text-blue-100 mt-1">
                  Customer chooses filter type and size (if paper doesn&apos;t
                  have built-in filter)
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{filters.length}</div>
              <div className="text-blue-100 text-sm">Filter Types</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">
                Active:{" "}
                <span className="text-green-600 font-bold">
                  {filters.filter((f) => f.active).length}
                </span>{" "}
                | Inactive:{" "}
                <span className="text-gray-500 font-bold">
                  {filters.filter((f) => !f.active).length}
                </span>
              </span>
            </div>
            <button
              onClick={() => handleAdd("filter")}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold shadow-md"
            >
              + Add New Filter
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filters.map((filter, index) => (
              <div
                key={filter.id}
                className={`border-2 rounded-lg p-4 relative ${
                  filter.active
                    ? "bg-white border-blue-200"
                    : "bg-gray-50 border-gray-300 opacity-60"
                }`}
              >
                {/* Action buttons - Top Right */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={() => handleEdit(filter, "filter")}
                    className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors shadow-md"
                    title="Edit"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(filter.id, "filter")}
                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors shadow-md"
                    title="Delete"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex items-start gap-4 pr-28">
                  <div className="text-2xl font-bold text-gray-400">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-gray-800">
                        {filter.name}
                      </h4>
                      {!filter.active && (
                        <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded font-medium">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {filter.description}
                    </p>

                    {/* Direct Price */}
                    {filter.selectionType === "direct" && (
                      <div className="bg-green-50 p-3 rounded-lg inline-block">
                        <div className="text-xs font-semibold text-green-700 mb-1">
                          PRICE
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          ฿{filter.price}
                        </div>
                      </div>
                    )}

                    {/* Variant Sizes */}
                    {filter.selectionType === "variant" && filter.variants && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-xs font-semibold text-blue-700 mb-2">
                          SIZE OPTIONS ({filter.variants.length})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {filter.variants.map((variant, vIdx) => (
                            <div
                              key={vIdx}
                              className="bg-white p-2 rounded border border-blue-200"
                            >
                              <div className="font-medium text-gray-800">
                                {variant.label}
                              </div>
                              <div className="text-green-600 font-bold">
                                ฿{variant.price}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 3: Filling Selection */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white text-purple-600 rounded-full flex items-center justify-center font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold">Filling Selection</h3>
                <p className="text-purple-100 mt-1">
                  Customer chooses worm, flower strains, and hash - capacity
                  based on paper
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {worms.length + flowers.length + hashes.length}
              </div>
              <div className="text-purple-100 text-sm">Total Options</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Worms Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold text-gray-800">
                Worms ({worms.length})
              </h4>
              <button
                onClick={() => handleAdd("worm")}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
              >
                + Add Worm
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {worms.map((worm, index) => (
                <div
                  key={worm.id}
                  className={`border-2 rounded-lg p-3 relative ${
                    worm.active
                      ? "bg-white border-purple-200"
                      : "bg-gray-50 border-gray-300 opacity-60"
                  }`}
                >
                  {/* Action buttons - Top Right */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleEdit(worm, "worm")}
                      className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="Edit"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(worm.id, "worm")}
                      className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="pr-20">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <h5 className="font-bold text-gray-800">{worm.name}</h5>
                      {!worm.active && (
                        <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {worm.description}
                    </p>
                    <div className="text-lg font-bold text-green-600">
                      ฿{worm.basePrice}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flowers Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold text-gray-800">
                Flowers ({flowers.length})
              </h4>
              <button
                onClick={() => handleAdd("flower")}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
              >
                + Add Flower
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {flowers.map((flower, index) => (
                <div
                  key={flower.id}
                  className={`border-2 rounded-lg p-3 relative ${
                    flower.active
                      ? "bg-white border-green-200"
                      : "bg-gray-50 border-gray-300 opacity-60"
                  }`}
                >
                  {/* Action buttons - Top Right */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleEdit(flower, "flower")}
                      className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="Edit"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(flower.id, "flower")}
                      className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="pr-20">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <h5 className="font-bold text-gray-800">{flower.name}</h5>
                      {!flower.active && (
                        <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {flower.description}
                    </p>
                    <div className="text-lg font-bold text-green-600">
                      ฿{flower.pricePerGram}/g
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hash Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold text-gray-800">
                Hash ({hashes.length})
              </h4>
              <button
                onClick={() => handleAdd("hash")}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
              >
                + Add Hash
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {hashes.map((hash, index) => (
                <div
                  key={hash.id}
                  className={`border-2 rounded-lg p-3 relative ${
                    hash.active
                      ? "bg-white border-amber-200"
                      : "bg-gray-50 border-gray-300 opacity-60"
                  }`}
                >
                  {/* Action buttons - Top Right */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleEdit(hash, "hash")}
                      className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="Edit"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(hash.id, "hash")}
                      className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="pr-20">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <h5 className="font-bold text-gray-800">{hash.name}</h5>
                      {!hash.active && (
                        <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {hash.description}
                    </p>
                    <div className="text-lg font-bold text-green-600">
                      ฿{hash.pricePerGram}/g
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 4: External Customization */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white text-orange-600 rounded-full flex items-center justify-center font-bold text-xl">
                4
              </div>
              <div>
                <h3 className="text-2xl font-bold">External Customization</h3>
                <p className="text-orange-100 mt-1">
                  Customer adds coating or wrap (optional extras)
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">
                {coatings.length + wraps.length}
              </div>
              <div className="text-orange-100 text-sm">Total Options</div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Coatings Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold text-gray-800">
                Coatings ({coatings.length})
              </h4>
              <button
                onClick={() => handleAdd("coating")}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
              >
                + Add Coating
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {coatings.map((coating, index) => (
                <div
                  key={coating.id}
                  className={`border-2 rounded-lg p-3 relative ${
                    coating.active
                      ? "bg-white border-orange-200"
                      : "bg-gray-50 border-gray-300 opacity-60"
                  }`}
                >
                  {/* Action buttons - Top Right */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleEdit(coating, "coating")}
                      className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="Edit"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(coating.id, "coating")}
                      className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="pr-20">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <h5 className="font-bold text-gray-800">
                        {coating.name}
                      </h5>
                      {!coating.active && (
                        <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {coating.description}
                    </p>
                    <div className="text-lg font-bold text-green-600">
                      ฿{coating.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Wraps Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-bold text-gray-800">
                Wraps ({wraps.length})
              </h4>
              <button
                onClick={() => handleAdd("wrap")}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
              >
                + Add Wrap
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {wraps.map((wrap, index) => (
                <div
                  key={wrap.id}
                  className={`border-2 rounded-lg p-3 relative ${
                    wrap.active
                      ? "bg-white border-orange-200"
                      : "bg-gray-50 border-gray-300 opacity-60"
                  }`}
                >
                  {/* Action buttons - Top Right */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleEdit(wrap, "wrap")}
                      className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title="Edit"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(wrap.id, "wrap")}
                      className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="pr-20">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <h5 className="font-bold text-gray-800">{wrap.name}</h5>
                      {!wrap.active && (
                        <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {wrap.description}
                    </p>
                    <div className="text-lg font-bold text-green-600">
                      ฿{wrap.price}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 5: Review */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white text-gray-700 rounded-full flex items-center justify-center font-bold text-xl">
                5
              </div>
              <div>
                <h3 className="text-2xl font-bold">Review & Confirm</h3>
                <p className="text-gray-300 mt-1">
                  Automatic step - shows summary and total price
                </p>
              </div>
            </div>
            <div className="text-6xl"></div>
          </div>
        </div>

        <div className="p-6 bg-gray-50">
          <div className="text-center py-8">
            <p className="text-gray-600 text-lg mb-3">
              This step is automatically generated and displays:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <div className="text-2xl mb-2"></div>
                <div className="font-semibold text-gray-800">
                  Configuration Summary
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  All selected options
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <div className="text-2xl mb-2"></div>
                <div className="font-semibold text-gray-800">Total Price</div>
                <div className="text-sm text-gray-600 mt-1">
                  Calculated automatically
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <div className="text-2xl mb-2"></div>
                <div className="font-semibold text-gray-800">Add to Cart</div>
                <div className="text-sm text-gray-600 mt-1">
                  Final confirmation button
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <EditModal
          item={editingItem}
          type={editingType}
          onSave={handleSave}
          onCancel={() => {
            setShowEditModal(false);
            setEditingItem(null);
            setEditingType(null);
          }}
          onChange={setEditingItem}
        />
      )}
    </div>
  );
}

// Edit Modal Component
function EditModal({ item, type, onSave, onCancel, onChange }) {
  const updateField = (field, value) => {
    onChange({ ...item, [field]: value });
  };

  const updateVariant = (index, field, value) => {
    const newVariants = [...item.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    onChange({ ...item, variants: newVariants });
  };

  const addVariant = () => {
    const newVariants = [
      ...(item.variants || []),
      {
        id: `var-${Date.now()}`,
        name: "",
        capacity: 0,
        price: 0,
        label: "",
        sortOrder: item.variants?.length || 0,
      },
    ];
    onChange({ ...item, variants: newVariants });
  };

  const removeVariant = (index) => {
    const newVariants = item.variants.filter((_, i) => i !== index);
    onChange({ ...item, variants: newVariants });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {item.id.startsWith("new-") ? "Add" : "Edit"}{" "}
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </h2>

          <div className="space-y-4">
            {/* Basic Fields */}
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={item.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="w-full px-3 py-2 border rounded"
                rows="2"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={item.active}
                onChange={(e) => updateField("active", e.target.checked)}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium">Active</label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={item.sortOrder}
                onChange={(e) =>
                  updateField("sortOrder", Number(e.target.value))
                }
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            {/* Type-specific fields */}
            {type === "paper" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Selection Type
                  </label>
                  <select
                    value={item.selectionType}
                    onChange={(e) =>
                      updateField("selectionType", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="variant">Variant (Multiple Options)</option>
                    <option value="slider">Slider (Range)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.hasBuiltInFilter}
                    onChange={(e) =>
                      updateField("hasBuiltInFilter", e.target.checked)
                    }
                    className="w-4 h-4"
                  />
                  <label className="text-sm font-medium">
                    Has Built-in Filter
                  </label>
                </div>

                {item.selectionType === "variant" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Variants
                    </label>
                    {item.variants?.map((variant, index) => (
                      <div
                        key={index}
                        className="flex gap-2 mb-2 p-3 bg-gray-50 rounded"
                      >
                        <input
                          type="text"
                          placeholder="ID"
                          value={variant.id}
                          onChange={(e) =>
                            updateVariant(index, "id", e.target.value)
                          }
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Name"
                          value={variant.name}
                          onChange={(e) =>
                            updateVariant(index, "name", e.target.value)
                          }
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Capacity (g)"
                          value={variant.capacity}
                          onChange={(e) =>
                            updateVariant(
                              index,
                              "capacity",
                              Number(e.target.value)
                            )
                          }
                          className="w-24 px-2 py-1 border rounded text-sm"
                          step="0.1"
                        />
                        <input
                          type="number"
                          placeholder="Price (฿)"
                          value={variant.price}
                          onChange={(e) =>
                            updateVariant(
                              index,
                              "price",
                              Number(e.target.value)
                            )
                          }
                          className="w-24 px-2 py-1 border rounded text-sm"
                        />
                        <button
                          onClick={() => removeVariant(index)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addVariant}
                      className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
                    >
                      + Add Variant
                    </button>
                  </div>
                )}

                {item.selectionType === "slider" && (
                  <div className="space-y-3">
                    <h3 className="font-medium">Slider Configuration</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1">Min Value</label>
                        <input
                          type="number"
                          value={item.sliderConfig?.minValue || 7}
                          onChange={(e) =>
                            updateField("sliderConfig", {
                              ...item.sliderConfig,
                              minValue: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Max Value</label>
                        <input
                          type="number"
                          value={item.sliderConfig?.maxValue || 20}
                          onChange={(e) =>
                            updateField("sliderConfig", {
                              ...item.sliderConfig,
                              maxValue: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Base Price (฿)
                        </label>
                        <input
                          type="number"
                          value={item.sliderConfig?.basePrice || 20}
                          onChange={(e) =>
                            updateField("sliderConfig", {
                              ...item.sliderConfig,
                              basePrice: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">
                          Price Per Unit (฿)
                        </label>
                        <input
                          type="number"
                          value={item.sliderConfig?.pricePerUnit || 3}
                          onChange={(e) =>
                            updateField("sliderConfig", {
                              ...item.sliderConfig,
                              pricePerUnit: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 border rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {type === "filter" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Selection Type
                  </label>
                  <select
                    value={item.selectionType}
                    onChange={(e) =>
                      updateField("selectionType", e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="direct">Direct (Single Price)</option>
                    <option value="variant">Variant (Multiple Sizes)</option>
                  </select>
                </div>

                {item.selectionType === "variant" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Size Variants
                    </label>
                    {item.variants?.map((variant, index) => (
                      <div
                        key={index}
                        className="flex gap-2 mb-2 p-3 bg-gray-50 rounded"
                      >
                        <input
                          type="text"
                          placeholder="ID (e.g., small)"
                          value={variant.id}
                          onChange={(e) =>
                            updateVariant(index, "id", e.target.value)
                          }
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Label (e.g., Small)"
                          value={variant.label}
                          onChange={(e) =>
                            updateVariant(index, "label", e.target.value)
                          }
                          className="flex-1 px-2 py-1 border rounded text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Price (฿)"
                          value={variant.price}
                          onChange={(e) =>
                            updateVariant(
                              index,
                              "price",
                              Number(e.target.value)
                            )
                          }
                          className="w-24 px-2 py-1 border rounded text-sm"
                        />
                        <button
                          onClick={() => removeVariant(index)}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addVariant}
                      className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
                    >
                      + Add Size
                    </button>
                  </div>
                )}

                {item.selectionType === "direct" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Price (฿)
                    </label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updateField("price", Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border rounded"
                    />
                  </div>
                )}
              </>
            )}

            {(type === "flower" || type === "hash") && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Price Per Gram (฿)
                </label>
                <input
                  type="number"
                  value={item.pricePerGram}
                  onChange={(e) =>
                    updateField("pricePerGram", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            )}

            {type === "worm" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Base Price (฿)
                </label>
                <input
                  type="number"
                  value={item.basePrice}
                  onChange={(e) =>
                    updateField("basePrice", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            )}

            {(type === "coating" || type === "wrap") && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Price (฿)
                </label>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) => updateField("price", Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={onSave}
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
