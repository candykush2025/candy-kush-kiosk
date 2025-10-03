"use client";
import { useState, useEffect } from "react";
import { PendingPointsService } from "../../../lib/pendingPointsService";
import { CustomerService } from "../../../lib/customerService";

export default function PendingPointsPage() {
  const [pendingPoints, setPendingPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadPendingPoints();
  }, []);

  const loadPendingPoints = async () => {
    try {
      setLoading(true);
      const data = await PendingPointsService.getAllPendingPoints();
      setPendingPoints(data);
    } catch (error) {
      console.error("Error loading pending points:", error);
      setError("Failed to load pending points");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredPendingPoints.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredPendingPoints.map((item) => item.id));
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleBatchApprove = async () => {
    if (selectedItems.length === 0) return;

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const results = await PendingPointsService.batchApprovePendingPoints(
        selectedItems,
        "admin-user", // In real app, get from auth context
        CustomerService
      );

      const successCount = results.filter(
        (r) => r.status === "approved"
      ).length;
      const errorCount = results.filter((r) => r.status === "error").length;

      if (errorCount > 0) {
        setError(`${successCount} approved, ${errorCount} failed`);
      } else {
        setSuccess(`Successfully approved ${successCount} pending points`);
      }

      setSelectedItems([]);
      await loadPendingPoints();
    } catch (error) {
      setError("Failed to approve points: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleBatchDiscard = async () => {
    if (selectedItems.length === 0) return;

    setProcessing(true);
    setError("");
    setSuccess("");

    try {
      const results = await PendingPointsService.batchDiscardPendingPoints(
        selectedItems,
        "admin-user" // In real app, get from auth context
      );

      const successCount = results.filter(
        (r) => r.status === "discarded"
      ).length;
      const errorCount = results.filter((r) => r.status === "error").length;

      if (errorCount > 0) {
        setError(`${successCount} discarded, ${errorCount} failed`);
      } else {
        setSuccess(`Successfully discarded ${successCount} pending points`);
      }

      setSelectedItems([]);
      await loadPendingPoints();
    } catch (error) {
      setError("Failed to discard points: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSingleApprove = async (itemId) => {
    setProcessing(true);
    try {
      await PendingPointsService.approvePendingPoints(
        itemId,
        "admin-user",
        CustomerService
      );
      setSuccess("Points approved successfully");
      await loadPendingPoints();
    } catch (error) {
      setError("Failed to approve points: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSingleDiscard = async (itemId) => {
    setProcessing(true);
    try {
      await PendingPointsService.discardPendingPoints(itemId, "admin-user");
      setSuccess("Points discarded successfully");
      await loadPendingPoints();
    } catch (error) {
      setError("Failed to discard points: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredPendingPoints = pendingPoints.filter((item) => {
    if (filter === "all") return true;
    if (filter === "high") return item.pointsAmount >= 50;
    if (filter === "medium")
      return item.pointsAmount >= 20 && item.pointsAmount < 50;
    if (filter === "low") return item.pointsAmount < 20;
    return true;
  });

  const totalPendingPoints = filteredPendingPoints.reduce(
    (sum, item) => sum + item.pointsAmount,
    0
  );
  const selectedPointsTotal = filteredPendingPoints
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.pointsAmount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-gray-700">
            Loading pending points...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Pending Points Management
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={loadPendingPoints}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">
                Total Pending
              </div>
              <div className="text-2xl font-bold text-blue-800">
                {filteredPendingPoints.length}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">
                Total Points
              </div>
              <div className="text-2xl font-bold text-green-800">
                {totalPendingPoints}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">
                Selected Items
              </div>
              <div className="text-2xl font-bold text-purple-800">
                {selectedItems.length}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-orange-600 font-medium">
                Selected Points
              </div>
              <div className="text-2xl font-bold text-orange-800">
                {selectedPointsTotal}
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">All Points</option>
                <option value="high">High (50+ points)</option>
                <option value="medium">Medium (20-49 points)</option>
                <option value="low">Low (&lt;20 points)</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleBatchApprove}
                disabled={selectedItems.length === 0 || processing}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Approve Selected ({selectedItems.length})
              </button>
              <button
                onClick={handleBatchDiscard}
                disabled={selectedItems.length === 0 || processing}
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Discard Selected ({selectedItems.length})
              </button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Pending Points Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={
                  selectedItems.length === filteredPendingPoints.length &&
                  filteredPendingPoints.length > 0
                }
                onChange={handleSelectAll}
                className="mr-3"
              />
              <span className="font-medium">Select All</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Select
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Points
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Purchase Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPendingPoints.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {item.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Code: {item.customerCode}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-lg font-bold text-green-600">
                        {item.pointsAmount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {item.orderId}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      ฿{item.purchaseAmount}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {item.createdAt?.toDate?.()?.toLocaleDateString() ||
                        "N/A"}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.source || "kiosk"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSingleApprove(item.id)}
                          disabled={processing}
                          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 py-1 text-sm rounded transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleSingleDiscard(item.id)}
                          disabled={processing}
                          className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-1 text-sm rounded transition-colors"
                        >
                          Discard
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPendingPoints.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">No pending points found</div>
              <div className="text-sm text-gray-500">
                All points have been processed or no points are pending approval
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
