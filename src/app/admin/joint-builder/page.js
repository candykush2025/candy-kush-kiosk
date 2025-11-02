"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
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

export default function JointBuilderAdmin() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("papers");
  const [loading, setLoading] = useState(true);

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
        papersData,
        filtersData,
        flowersData,
        hashesData,
        wormsData,
        coatingsData,
        wrapsData,
      ] = await Promise.all([
        getAllPaperOptions(),
        getAllFilterOptions(),
        getAllFillingOptions("flower"),
        getAllFillingOptions("hash"),
        getAllFillingOptions("worm"),
        getAllExternalOptions("coating"),
        getAllExternalOptions("wrap"),
      ]);

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

  const renderItemsList = (items, type) => {
    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border-2 ${
              item.active
                ? "bg-white border-green-200"
                : "bg-gray-100 border-gray-300 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  {!item.active && (
                    <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>

                {/* Price/Variants Display */}
                <div className="mt-2 text-sm">
                  {item.selectionType === "variant" && item.variants && (
                    <div className="text-gray-700">
                      <strong>Variants:</strong> {item.variants.length} options
                    </div>
                  )}
                  {item.selectionType === "slider" && item.sliderConfig && (
                    <div className="text-gray-700">
                      <strong>Range:</strong> {item.sliderConfig.minValue}-
                      {item.sliderConfig.maxValue}
                      {item.sliderConfig.unit}
                      {" | Base: ฿"}
                      {item.sliderConfig.basePrice}
                    </div>
                  )}
                  {item.price !== undefined && (
                    <div className="text-green-600 font-semibold">
                      Price: ฿{item.price}
                    </div>
                  )}
                  {item.pricePerGram !== undefined && (
                    <div className="text-green-600 font-semibold">
                      ฿{item.pricePerGram}/g
                    </div>
                  )}
                  {item.basePrice !== undefined && (
                    <div className="text-green-600 font-semibold">
                      Base: ฿{item.basePrice}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(item, type)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id, type)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading joint builder data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">
              Joint Builder Management
            </h1>
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Admin
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: "papers", label: "Papers", count: papers.length },
              { id: "filters", label: "Filters", count: filters.length },
              { id: "flowers", label: "Flowers", count: flowers.length },
              { id: "hashes", label: "Hash", count: hashes.length },
              { id: "worms", label: "Worms", count: worms.length },
              { id: "coatings", label: "Coatings", count: coatings.length },
              { id: "wraps", label: "Wraps", count: wraps.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <button
            onClick={() => handleAdd(activeTab.replace(/s$/, ""))}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
          >
            + Add New{" "}
            {activeTab.replace(/s$/, "").charAt(0).toUpperCase() +
              activeTab.replace(/s$/, "").slice(1)}
          </button>
        </div>

        {activeTab === "papers" && renderItemsList(papers, "paper")}
        {activeTab === "filters" && renderItemsList(filters, "filter")}
        {activeTab === "flowers" && renderItemsList(flowers, "flower")}
        {activeTab === "hashes" && renderItemsList(hashes, "hash")}
        {activeTab === "worms" && renderItemsList(worms, "worm")}
        {activeTab === "coatings" && renderItemsList(coatings, "coating")}
        {activeTab === "wraps" && renderItemsList(wraps, "wrap")}
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
