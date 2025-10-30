"use client";

import { useState, useEffect } from "react";
import {
  Link2,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Search,
} from "lucide-react";

const POS_API_URL = "https://pos-candy-kush.vercel.app/api";

export default function StockLinking({ products, onSaveLinks }) {
  const [posProducts, setPosProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [posSearchTerms, setPosSearchTerms] = useState({}); // Track search for each dropdown
  const [openDropdown, setOpenDropdown] = useState(null); // Track which dropdown is open

  // Store product links {kioskProductId: posItemId}
  const [productLinks, setProductLinks] = useState({});

  // Store alert levels {kioskProductId: alertLevel}
  const [alertLevels, setAlertLevels] = useState({});

  // Load existing links and alert levels from products
  useEffect(() => {
    const links = {};
    const levels = {};
    products.forEach((product) => {
      if (product.posItemId) {
        links[product.id] = product.posItemId;
      }
      // Load existing alert level if it exists
      if (product.alertKioskLevel !== undefined) {
        levels[product.id] = product.alertKioskLevel;
      }
    });
    setProductLinks(links);
    setAlertLevels(levels);
  }, [products]);

  // Fetch POS products
  const fetchPOSProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${POS_API_URL}/products/list`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setPosProducts(data.data);
        setSuccess(`Loaded ${data.count} products from POS`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to load POS products");
      }
    } catch (err) {
      if (err.message.includes("Failed to fetch")) {
        setError(
          "❌ CORS Error: Cannot connect to POS API from localhost. Please deploy the kiosk or configure CORS on POS system."
        );
      } else {
        setError("Failed to connect to POS system: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load POS products on mount
  useEffect(() => {
    fetchPOSProducts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest(".relative")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  // Handle link change
  const handleLinkChange = (kioskProductId, posItemId) => {
    setProductLinks((prev) => ({
      ...prev,
      [kioskProductId]: posItemId || null,
    }));
    // Close dropdown and clear search
    setOpenDropdown(null);
    setPosSearchTerms((prev) => ({ ...prev, [kioskProductId]: "" }));
  };

  // Filter POS products for dropdown
  const getFilteredPosProducts = (kioskProductId) => {
    const searchQuery = posSearchTerms[kioskProductId] || "";
    if (!searchQuery) return posProducts;

    return posProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.itemId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Save all links
  const handleSaveLinks = async () => {
    setSaving(true);
    setError("");
    try {
      await onSaveLinks(productLinks, alertLevels);
      setSuccess("Product links and alert levels saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save links: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Link2 className="w-6 h-6" />
            Stock Linking
          </h2>
          <p className="text-gray-600 mt-1">
            Link kiosk products with POS inventory system
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchPOSProducts}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh POS
          </button>
          <button
            onClick={handleSaveLinks}
            disabled={saving}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Links"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <input
          type="text"
          placeholder="Search kiosk products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Product Links Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kiosk Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kiosk ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  POS Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alert Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const linkedPosId = productLinks[product.id];
                const posProduct = posProducts.find(
                  (p) => p.itemId === linkedPosId
                );

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                        )}
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        {/* Current Selection Display */}
                        <button
                          onClick={() =>
                            setOpenDropdown(
                              openDropdown === product.id ? null : product.id
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-left bg-white flex items-center justify-between"
                        >
                          <span className="truncate">
                            {linkedPosId
                              ? posProducts.find(
                                  (p) => p.itemId === linkedPosId
                                )?.name || "-- Not Linked --"
                              : "-- Not Linked --"}
                          </span>
                          <svg
                            className={`w-4 h-4 transition-transform ${
                              openDropdown === product.id ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {openDropdown === product.id && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                            {/* Search Input */}
                            <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Search POS products..."
                                  value={posSearchTerms[product.id] || ""}
                                  onChange={(e) =>
                                    setPosSearchTerms((prev) => ({
                                      ...prev,
                                      [product.id]: e.target.value,
                                    }))
                                  }
                                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>

                            {/* Options List */}
                            <div className="overflow-y-auto max-h-60">
                              {/* Not Linked Option */}
                              <button
                                onClick={() => handleLinkChange(product.id, "")}
                                className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2"
                              >
                                <span className="text-gray-500">
                                  -- Not Linked --
                                </span>
                              </button>

                              {/* POS Products */}
                              {getFilteredPosProducts(product.id).map(
                                (posProduct) => (
                                  <button
                                    key={posProduct.itemId}
                                    onClick={() =>
                                      handleLinkChange(
                                        product.id,
                                        posProduct.itemId
                                      )
                                    }
                                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 text-sm ${
                                      linkedPosId === posProduct.itemId
                                        ? "bg-blue-50"
                                        : ""
                                    }`}
                                  >
                                    <div className="font-medium">
                                      {posProduct.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {posProduct.sku || posProduct.itemId}
                                    </div>
                                  </button>
                                )
                              )}

                              {/* No Results */}
                              {getFilteredPosProducts(product.id).length ===
                                0 && (
                                <div className="px-3 py-4 text-center text-sm text-gray-500">
                                  No products found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Alert Stock Level */}
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        placeholder="Alert level"
                        value={alertLevels[product.id] || ""}
                        onChange={(e) => {
                          const value =
                            e.target.value === ""
                              ? ""
                              : parseInt(e.target.value);
                          setAlertLevels((prev) => ({
                            ...prev,
                            [product.id]: value,
                          }));
                        }}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Alert when stock ≤ this
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {linkedPosId ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Linked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Not Linked
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No products found
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Kiosk Products</div>
          <div className="text-2xl font-bold text-gray-900">
            {products.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Linked Products</div>
          <div className="text-2xl font-bold text-green-600">
            {Object.values(productLinks).filter(Boolean).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">POS Products Available</div>
          <div className="text-2xl font-bold text-blue-600">
            {posProducts.length}
          </div>
        </div>
      </div>
    </div>
  );
}
