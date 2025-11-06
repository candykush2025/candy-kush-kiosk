"use client";
import { useState, useEffect } from "react";
import { PrerollService } from "../../lib/prerollService";

export default function PrerollsManagement({
  prerollsConfig,
  prerollsProducts,
  onDataChange,
}) {
  const [activeSubTab, setActiveSubTab] = useState("products");
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingVariant, setEditingVariant] = useState(null); // { productId, size }

  // Debug logging
  console.log("🔍 PrerollsManagement received:");
  console.log("- Config:", prerollsConfig);
  console.log("- Products:", prerollsProducts);
  console.log("- Products count:", prerollsProducts?.length);

  // Configuration form
  const [configForm, setConfigForm] = useState({
    backgroundType: prerollsConfig?.backgroundType || "image", // "image" or "color"
    backgroundColor: prerollsConfig?.backgroundColor || "#ffffff",
    backgroundImage: prerollsConfig?.backgroundImage || "/background.jpg",
    backgroundFit: prerollsConfig?.backgroundFit || "cover",
    isActive: prerollsConfig?.isActive !== false,
  });

  // Update configForm when prerollsConfig changes
  useEffect(() => {
    if (prerollsConfig) {
      console.log(
        "🔄 Updating configForm with new prerollsConfig:",
        prerollsConfig
      );
      setConfigForm({
        backgroundType: prerollsConfig.backgroundType || "image",
        backgroundColor: prerollsConfig.backgroundColor || "#ffffff",
        backgroundImage: prerollsConfig.backgroundImage || "/background.jpg",
        backgroundFit: prerollsConfig.backgroundFit || "cover",
        isActive: prerollsConfig.isActive !== false,
      });
    }
  }, [prerollsConfig]);

  const [backgroundFile, setBackgroundFile] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [mainImageFile, setMainImageFile] = useState(null);
  const [variantImageFile, setVariantImageFile] = useState(null);
  const [cellBackgroundFile, setCellBackgroundFile] = useState(null);
  const [cellBackgroundPreview, setCellBackgroundPreview] = useState(null);

  // Fixed 3x3 grid structure - matches menu order
  const qualities = ["indoor", "outdoor", "top"];
  const strains = ["sativa", "hybrid", "indica"];
  const sizes = ["small", "normal", "king"];

  // Helper to find product by quality and strain
  const findProduct = (quality, strain) => {
    const product = prerollsProducts?.find(
      (p) => p.quality === quality && p.strain === strain
    );
    if (product) {
      console.log(`Found product for ${quality} ${strain}:`, product);
    }
    return product;
  };

  // Reset to default data
  const handleResetToDefaults = async () => {
    if (
      !confirm(
        "⚠️ WARNING: This will DELETE ALL existing products and reset to default data!\n\nAll custom images, prices, and configurations will be lost.\n\nAre you sure you want to continue?"
      )
    )
      return;
    try {
      setLoading(true);
      await PrerollService.resetToDefaultData();
      onDataChange();
      alert(
        "✅ All data reset to defaults! 9 products recreated with original settings."
      );
    } catch (error) {
      console.error("Error resetting to defaults:", error);
      alert("Failed to reset data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Configuration handlers
  const handleSaveConfiguration = async () => {
    try {
      setLoading(true);
      await PrerollService.updateConfiguration(configForm, backgroundFile);
      setBackgroundFile(null);
      setBackgroundPreview(null);
      onDataChange();
      alert("Configuration saved successfully!");
    } catch (error) {
      console.error("Error saving configuration:", error);
      alert("Failed to save configuration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackgroundFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setBackgroundPreview(previewUrl);
    }
  };

  const handleDeleteBackground = async () => {
    if (!confirm("Are you sure you want to delete the background image?"))
      return;
    try {
      setLoading(true);
      await PrerollService.deleteBackgroundImage();
      onDataChange();
      alert("Background image deleted.");
    } catch (error) {
      console.error("Error deleting background image:", error);
      alert("Failed to delete background image.");
    } finally {
      setLoading(false);
    }
  };

  // Product main image handlers
  const handleUpdateMainImage = async (productId) => {
    if (!mainImageFile) return;
    try {
      setLoading(true);
      const product = prerollsProducts.find((p) => p.id === productId);
      await PrerollService.updatePrerollProduct(
        productId,
        product,
        mainImageFile
      );
      setMainImageFile(null);
      setSelectedProduct(null);
      onDataChange();
      alert("Main image updated!");
    } catch (error) {
      console.error("Error updating main image:", error);
      alert("Failed to update main image.");
    } finally {
      setLoading(false);
    }
  };

  // Variant price update
  const handleUpdateVariantPrice = async (productId, size, newPrice) => {
    try {
      setLoading(true);
      const product = prerollsProducts.find((p) => p.id === productId);
      const updatedVariants = {
        ...product.variants,
        [size]: {
          ...product.variants[size],
          price: parseFloat(newPrice) || 0,
        },
      };

      await PrerollService.updatePrerollProduct(productId, {
        ...product,
        variants: updatedVariants,
      });
      onDataChange();
    } catch (error) {
      console.error("Error updating variant price:", error);
      alert("Failed to update variant price.");
    } finally {
      setLoading(false);
    }
  };

  // Variant image update
  const handleUpdateVariantImage = async (productId, size) => {
    if (!variantImageFile) return;
    try {
      setLoading(true);
      await PrerollService.updateVariantImage(
        productId,
        size,
        variantImageFile
      );
      setVariantImageFile(null);
      setEditingVariant(null);
      onDataChange();
      alert("Variant image updated!");
    } catch (error) {
      console.error("Error updating variant image:", error);
      alert("Failed to update variant image.");
    } finally {
      setLoading(false);
    }
  };

  // Cell background update
  const handleUpdateCellBackground = async (
    productId,
    backgroundType,
    backgroundColor = null,
    textColor = null
  ) => {
    try {
      setLoading(true);
      await PrerollService.updateCellBackground(
        productId,
        backgroundType,
        backgroundColor,
        cellBackgroundFile,
        textColor
      );
      setCellBackgroundFile(null);
      setCellBackgroundPreview(null);
      setSelectedProduct(null);
      onDataChange();
      alert("Cell background updated!");
    } catch (error) {
      console.error("Error updating cell background:", error);
      alert("Failed to update cell background.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex border-b">
        <button
          className={`px-6 py-3 font-medium ${
            activeSubTab === "products"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveSubTab("products")}
        >
          Products Grid (3×3)
        </button>
        <button
          className={`px-6 py-3 font-medium ${
            activeSubTab === "configuration"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveSubTab("configuration")}
        >
          Configuration
        </button>
      </div>

      {/* Configuration Tab */}
      {activeSubTab === "configuration" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Background Settings</h3>
          </div>

          {/* Background Type Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Background Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="backgroundType"
                  value="color"
                  checked={configForm.backgroundType === "color"}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      backgroundType: e.target.value,
                    })
                  }
                  className="w-4 h-4"
                />
                <span>Solid Color</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="backgroundType"
                  value="image"
                  checked={configForm.backgroundType === "image"}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      backgroundType: e.target.value,
                    })
                  }
                  className="w-4 h-4"
                />
                <span>Image</span>
              </label>
            </div>
          </div>

          {/* Conditional rendering based on background type */}
          {configForm.backgroundType === "color" ? (
            // Color Picker Section
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Background Color
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={configForm.backgroundColor}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        backgroundColor: e.target.value,
                      })
                    }
                    className="w-20 h-10 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={configForm.backgroundColor}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        backgroundColor: e.target.value,
                      })
                    }
                    placeholder="#ffffff"
                    className="flex-1 p-2 border rounded"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Choose a solid color for the background
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Preview
                </label>
                <div
                  className="w-full h-40 rounded border-2 border-gray-300"
                  style={{ backgroundColor: configForm.backgroundColor }}
                >
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                    Color Preview
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Image Upload Section
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Background Image
                </label>
                {(backgroundPreview || configForm.backgroundImage) && (
                  <div className="mb-2 relative h-40">
                    <img
                      src={backgroundPreview || configForm.backgroundImage}
                      alt="Background"
                      className="w-full h-40 object-cover rounded"
                    />
                    {backgroundPreview && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        New Preview
                      </div>
                    )}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundFileChange}
                  className="w-full p-2 border rounded"
                />
                {prerollsConfig?.backgroundImage && (
                  <button
                    onClick={handleDeleteBackground}
                    className="mt-2 text-red-600 text-sm hover:underline"
                    disabled={loading}
                  >
                    Delete Background Image
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Background Fit
                </label>
                <select
                  value={configForm.backgroundFit}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      backgroundFit: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded"
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="fill">Fill</option>
                </select>
              </div>
            </div>
          )}

          <button
            onClick={handleSaveConfiguration}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      )}

      {/* Products Grid Tab */}
      {activeSubTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Prerolls Products (3×3 Grid)
            </h3>
            <button
              onClick={handleResetToDefaults}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              Reset to Default Data
            </button>
          </div>

          {(!prerollsProducts || prerollsProducts.length === 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                No products found. Click &quot;Reset to Default Data&quot; to
                create the 9 products.
              </p>
            </div>
          )}

          {/* 3x3 Grid of Products */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border">
              <thead>
                <tr>
                  <th className="border p-4 text-xl font-bold text-white bg-[#e1ba41]">
                    Sativa
                  </th>
                  <th className="border p-4 text-xl font-bold text-white bg-[#7b9943]">
                    Hybrid
                  </th>
                  <th className="border p-4 text-xl font-bold text-white bg-[#4b4baf]">
                    Indica
                  </th>
                </tr>
              </thead>
              <tbody>
                {qualities.map((quality) => (
                  <tr key={quality}>
                    {strains.map((strain) => {
                      const product = findProduct(quality, strain);
                      return (
                        <td key={`${quality}-${strain}`} className="border p-2">
                          {product ? (
                            <ProductCell
                              product={product}
                              quality={quality}
                              strain={strain}
                              sizes={sizes}
                              onUpdateVariantPrice={handleUpdateVariantPrice}
                              onUpdateVariantImage={handleUpdateVariantImage}
                              onUpdateMainImage={handleUpdateMainImage}
                              onUpdateCellBackground={
                                handleUpdateCellBackground
                              }
                              selectedProduct={selectedProduct}
                              setSelectedProduct={setSelectedProduct}
                              editingVariant={editingVariant}
                              setEditingVariant={setEditingVariant}
                              mainImageFile={mainImageFile}
                              setMainImageFile={setMainImageFile}
                              variantImageFile={variantImageFile}
                              setVariantImageFile={setVariantImageFile}
                              cellBackgroundFile={cellBackgroundFile}
                              setCellBackgroundFile={setCellBackgroundFile}
                              cellBackgroundPreview={cellBackgroundPreview}
                              setCellBackgroundPreview={
                                setCellBackgroundPreview
                              }
                              loading={loading}
                            />
                          ) : (
                            <div className="text-gray-400 text-sm text-center">
                              Not initialized
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Product Cell Component
function ProductCell({
  product,
  quality,
  strain,
  sizes,
  onUpdateVariantPrice,
  onUpdateVariantImage,
  onUpdateMainImage,
  onUpdateCellBackground,
  selectedProduct,
  setSelectedProduct,
  editingVariant,
  setEditingVariant,
  mainImageFile,
  setMainImageFile,
  variantImageFile,
  setVariantImageFile,
  cellBackgroundFile,
  setCellBackgroundFile,
  cellBackgroundPreview,
  setCellBackgroundPreview,
  loading,
}) {
  const isSelected = selectedProduct === product.id;
  const [localPrices, setLocalPrices] = useState({
    small: product.variants?.small?.price || 0,
    normal: product.variants?.normal?.price || 0,
    king: product.variants?.king?.price || 0,
  });

  const [editingBackground, setEditingBackground] = useState(false);
  const [cellBgType, setCellBgType] = useState(
    product.cellBackgroundType || "color"
  );
  const [cellBgColor, setCellBgColor] = useState(
    product.cellBackgroundColor || "#ffffff"
  );
  const [cellTextColor, setCellTextColor] = useState(
    product.cellTextColor || "#000000"
  );

  return (
    <div className="space-y-2 min-w-[300px]">
      {/* Quality Label */}
      <div className="text-center mb-2">
        <span className="inline-block px-3 py-1 bg-gray-800 text-white text-xs font-bold rounded-full">
          {quality === "top"
            ? "Top Quality"
            : quality.charAt(0).toUpperCase() + quality.slice(1)}
        </span>
      </div>

      {/* Main Image */}
      <div className="text-center">
        <p className="text-xs font-semibold mb-1">Main Image</p>
        {product.mainImage || product.variants?.king?.image ? (
          <div className="relative h-24 mb-1">
            <img
              src={product.mainImage || product.variants?.king?.image}
              alt={`${quality} ${strain}`}
              className="w-full h-24 object-contain"
            />
          </div>
        ) : (
          <div className="h-24 bg-gray-100 flex items-center justify-center mb-1">
            <span className="text-gray-400 text-xs">No image</span>
          </div>
        )}
        {isSelected ? (
          <div className="space-y-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setMainImageFile(e.target.files[0])}
              className="text-xs w-full"
            />
            <div className="flex gap-1">
              <button
                onClick={() => onUpdateMainImage(product.id)}
                disabled={!mainImageFile || loading}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded disabled:opacity-50 flex-1"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setSelectedProduct(null);
                  setMainImageFile(null);
                }}
                className="text-xs px-2 py-1 bg-gray-400 text-white rounded flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSelectedProduct(product.id)}
            className="text-xs text-blue-600 hover:underline"
          >
            Change Image
          </button>
        )}
      </div>

      {/* Variants */}
      <div className="border-t pt-2">
        <p className="text-xs font-semibold mb-2">Variants:</p>
        {sizes.map((size) => {
          const variant = product.variants?.[size];
          const isEditingThis =
            editingVariant?.productId === product.id &&
            editingVariant?.size === size;

          return (
            <div key={size} className="mb-2 p-2 bg-gray-50 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium capitalize">{size}</span>
                {isEditingThis ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        if (variantImageFile) {
                          onUpdateVariantImage(product.id, size);
                        }
                        setEditingVariant(null);
                        setVariantImageFile(null);
                      }}
                      disabled={loading}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingVariant(null);
                        setVariantImageFile(null);
                      }}
                      className="text-xs px-2 py-1 bg-gray-400 text-white rounded"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() =>
                      setEditingVariant({ productId: product.id, size })
                    }
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit Image
                  </button>
                )}
              </div>

              {/* Variant Image */}
              {variant?.image ? (
                <div className="relative h-16 mb-1">
                  <img
                    src={variant.image}
                    alt={`${size} variant`}
                    className="w-full h-16 object-contain"
                  />
                </div>
              ) : (
                <div className="h-16 bg-gray-200 flex items-center justify-center mb-1">
                  <span className="text-gray-400 text-xs">No image</span>
                </div>
              )}

              {isEditingThis && (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setVariantImageFile(e.target.files[0])}
                  className="text-xs w-full mb-1"
                />
              )}

              {/* Price Input */}
              <div className="flex items-center gap-2">
                <label className="text-xs">Price:</label>
                <input
                  type="number"
                  value={localPrices[size]}
                  onChange={(e) => {
                    const newPrice = e.target.value;
                    setLocalPrices({ ...localPrices, [size]: newPrice });
                  }}
                  onBlur={(e) => {
                    const newPrice = e.target.value;
                    if (newPrice !== variant?.price?.toString()) {
                      onUpdateVariantPrice(product.id, size, newPrice);
                    }
                  }}
                  className="text-xs p-1 border rounded w-20"
                />
                <span className="text-xs">THB</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cell Background */}
      <div className="border-t pt-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold">Cell Background:</p>
          {!editingBackground ? (
            <button
              onClick={() => setEditingBackground(true)}
              className="text-xs text-blue-600 hover:underline"
            >
              Edit Background
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingBackground(false);
                setCellBackgroundFile(null);
                setCellBackgroundPreview(null);
              }}
              className="text-xs text-gray-600 hover:underline"
            >
              Cancel
            </button>
          )}
        </div>

        {editingBackground && (
          <div className="space-y-2 bg-gray-50 p-2 rounded">
            {/* Background Type Selector */}
            <div className="flex gap-2 text-xs">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`bg-type-${product.id}`}
                  value="color"
                  checked={cellBgType === "color"}
                  onChange={(e) => setCellBgType(e.target.value)}
                  className="w-3 h-3"
                />
                Color
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`bg-type-${product.id}`}
                  value="image"
                  checked={cellBgType === "image"}
                  onChange={(e) => setCellBgType(e.target.value)}
                  className="w-3 h-3"
                />
                Image
              </label>
            </div>

            {/* Color Picker or Image Upload */}
            {cellBgType === "color" ? (
              <div>
                <label className="text-xs font-medium">Background Color:</label>
                <div className="flex gap-2 items-center mb-2">
                  <input
                    type="color"
                    value={cellBgColor}
                    onChange={(e) => setCellBgColor(e.target.value)}
                    className="w-12 h-8 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={cellBgColor}
                    onChange={(e) => setCellBgColor(e.target.value)}
                    className="flex-1 text-xs p-1 border rounded"
                  />
                </div>

                <label className="text-xs font-medium">Text Color:</label>
                <div className="flex gap-2 items-center mb-2">
                  <input
                    type="color"
                    value={cellTextColor}
                    onChange={(e) => setCellTextColor(e.target.value)}
                    className="w-12 h-8 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={cellTextColor}
                    onChange={(e) => setCellTextColor(e.target.value)}
                    className="flex-1 text-xs p-1 border rounded"
                  />
                </div>

                <button
                  onClick={() =>
                    onUpdateCellBackground(
                      product.id,
                      "color",
                      cellBgColor,
                      cellTextColor
                    )
                  }
                  disabled={loading}
                  className="w-full text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Save Colors
                </button>
              </div>
            ) : (
              <div>
                {(cellBackgroundPreview || product.cellBackgroundImage) && (
                  <div className="mb-1 relative h-16">
                    <img
                      src={cellBackgroundPreview || product.cellBackgroundImage}
                      alt="Cell background"
                      className="w-full h-16 object-cover rounded"
                    />
                    {cellBackgroundPreview && (
                      <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-1 rounded">
                        New
                      </div>
                    )}
                  </div>
                )}
                <label className="text-xs font-medium">Background Image:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setCellBackgroundFile(file);
                      setCellBackgroundPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="text-xs w-full mb-2"
                />

                <label className="text-xs font-medium">Text Color:</label>
                <div className="flex gap-2 items-center mb-2">
                  <input
                    type="color"
                    value={cellTextColor}
                    onChange={(e) => setCellTextColor(e.target.value)}
                    className="w-12 h-8 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={cellTextColor}
                    onChange={(e) => setCellTextColor(e.target.value)}
                    className="flex-1 text-xs p-1 border rounded"
                  />
                </div>

                <button
                  onClick={() =>
                    onUpdateCellBackground(
                      product.id,
                      "image",
                      null,
                      cellTextColor
                    )
                  }
                  disabled={!cellBackgroundFile || loading}
                  className="w-full text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Save Image & Text Color
                </button>
              </div>
            )}
          </div>
        )}

        {/* Current Background Display */}
        {!editingBackground && (
          <div className="text-xs text-gray-600 space-y-1">
            {product.cellBackgroundType === "image" &&
            product.cellBackgroundImage ? (
              <div className="flex items-center gap-1">
                <span>🖼️ Image</span>
                <img
                  src={product.cellBackgroundImage}
                  alt="Current background"
                  className="w-12 h-8 object-cover rounded border"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span>🎨 BG:</span>
                <div
                  className="w-8 h-4 border rounded"
                  style={{
                    backgroundColor: product.cellBackgroundColor || "#ffffff",
                  }}
                />
                <span>{product.cellBackgroundColor || "#ffffff"}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span>📝 Text:</span>
              <div
                className="w-8 h-4 border rounded"
                style={{
                  backgroundColor: product.cellTextColor || "#000000",
                }}
              />
              <span>{product.cellTextColor || "#000000"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
