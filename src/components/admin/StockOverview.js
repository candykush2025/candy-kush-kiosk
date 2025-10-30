"use client";

import { useState, useEffect } from "react";
import {
  Package,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react";

const POS_API_URL = "https://pos-candy-kush.vercel.app/api";

export default function StockOverview({ products }) {
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, linked, unlinked, outOfStock, lowStock

  // Fetch stock for all linked products
  const fetchAllStock = async () => {
    setLoading(true);
    setError("");

    const linkedProducts = products.filter((p) => p.posItemId);

    if (linkedProducts.length === 0) {
      setError("No products linked to POS system");
      setLoading(false);
      return;
    }

    try {
      const stockPromises = linkedProducts.map(async (product) => {
        try {
          const response = await fetch(
            `${POS_API_URL}/stock/check?itemId=${product.posItemId}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data.success) {
            return { kioskId: product.id, data: data.data };
          }
          return { kioskId: product.id, error: data.error };
        } catch (err) {
          if (err.message.includes("Failed to fetch")) {
            return {
              kioskId: product.id,
              error: "CORS Error - Cannot connect from localhost",
            };
          }
          return { kioskId: product.id, error: err.message };
        }
      });

      const results = await Promise.all(stockPromises);

      const stockMap = {};
      results.forEach((result) => {
        stockMap[result.kioskId] = result.data || { error: result.error };
      });

      setStockData(stockMap);
    } catch (err) {
      setError("Failed to fetch stock data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock on mount
  useEffect(() => {
    fetchAllStock();
  }, [products]);

  // Filter and search products
  const getFilteredProducts = () => {
    let filtered = products;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    switch (filterStatus) {
      case "linked":
        filtered = filtered.filter((p) => p.posItemId);
        break;
      case "unlinked":
        filtered = filtered.filter((p) => !p.posItemId);
        break;
      case "outOfStock":
        filtered = filtered.filter((p) => {
          const stock = stockData[p.id];
          return stock && stock.isOutOfStock;
        });
        break;
      case "lowStock":
        filtered = filtered.filter((p) => {
          const stock = stockData[p.id];
          return stock && stock.isLowStock && !stock.isOutOfStock;
        });
        break;
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  // Get stock status badge
  const getStockBadge = (product) => {
    if (!product.posItemId) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Not Linked
        </span>
      );
    }

    const stock = stockData[product.id];

    if (!stock) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Loading...
        </span>
      );
    }

    if (stock.error) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Error
        </span>
      );
    }

    if (stock.isOutOfStock) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Out of Stock
        </span>
      );
    }

    if (stock.isLowStock) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Low Stock
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        In Stock
      </span>
    );
  };

  // Calculate stats
  const stats = {
    total: products.length,
    linked: products.filter((p) => p.posItemId).length,
    outOfStock: Object.values(stockData).filter((s) => s && s.isOutOfStock)
      .length,
    lowStock: Object.values(stockData).filter(
      (s) => s && s.isLowStock && !s.isOutOfStock
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6" />
            Stock Overview
          </h2>
          <p className="text-gray-600 mt-1">
            Real-time stock levels from POS system
          </p>
        </div>
        <button
          onClick={fetchAllStock}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing..." : "Refresh Stock"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Products</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Linked to POS</div>
          <div className="text-2xl font-bold text-blue-600">{stats.linked}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Low Stock</div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats.lowStock}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Out of Stock</div>
          <div className="text-2xl font-bold text-red-600">
            {stats.outOfStock}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Products</option>
            <option value="linked">Linked Only</option>
            <option value="unlinked">Not Linked</option>
            <option value="lowStock">Low Stock</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  POS Item ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const stock = stockData[product.id];

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
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.posItemId || (
                        <span className="text-gray-400 italic">Not linked</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stock && !stock.error ? (
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900">
                            {stock.stock} units
                          </div>
                          {stock.lowStock && (
                            <div className="text-xs text-gray-500">
                              Low threshold: {stock.lowStock}
                            </div>
                          )}
                        </div>
                      ) : stock?.error ? (
                        <span className="text-sm text-red-600">
                          Error loading
                        </span>
                      ) : product.posItemId ? (
                        <span className="text-sm text-gray-400">
                          Loading...
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStockBadge(product)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stock && stock.price ? (
                        `฿${stock.price.toFixed(2)}`
                      ) : (
                        <span className="text-gray-400">-</span>
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
    </div>
  );
}
