import { useState, useEffect, useCallback } from "react";
import { CustomerService } from "../lib/customerService";

export default function PointsHistory({ customerId, isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    if (isOpen && customerId) {
      loadPointsHistory();
    }
  }, [isOpen, customerId, loadPointsHistory]);

  const loadPointsHistory = useCallback(async () => {
    setLoading(true);
    try {
      const pointsHistory = await CustomerService.getCustomerPointsHistory(
        customerId
      );
      setHistory(pointsHistory);
      setTotalPoints(CustomerService.calculateTotalPoints(pointsHistory));
    } catch (error) {
      console.error("Error loading points history:", error);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeIcon = (type) => {
    if (type === "added") {
      return (
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </div>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Points History</h2>
              <p className="text-green-100">
                Total Points: {totalPoints.toLocaleString()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-green-700 rounded-full p-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading points history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Points History
              </h3>
              <p className="text-gray-600">
                You haven&apos;t earned or used any points yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg"
                >
                  {getTypeIcon(transaction.type)}

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-800">
                        {transaction.reason}
                      </h4>
                      <span
                        className={`font-bold ${
                          transaction.type === "added"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "added" ? "+" : "-"}
                        {transaction.amount} pts
                      </span>
                    </div>

                    {transaction.details && (
                      <p className="text-sm text-gray-600 mt-1">
                        {transaction.details}
                      </p>
                    )}

                    {/* Show item details if available */}
                    {transaction.items && transaction.items.length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-md">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Items:
                        </p>
                        <div className="space-y-1">
                          {transaction.items.map((item, itemIndex) => (
                            <div
                              key={itemIndex}
                              className="text-xs text-gray-600"
                            >
                              <div className="flex justify-between">
                                <span className="font-medium">
                                  {item.name} x{item.quantity || 1}
                                </span>
                                <span>
                                  ฿{((item.price || 0) / 100).toFixed(2)}
                                </span>
                              </div>
                              {/* Show variants if available */}
                              {item.variants &&
                                Object.keys(item.variants).length > 0 && (
                                  <div className="text-xs text-gray-500 ml-2">
                                    {Object.entries(item.variants).map(
                                      ([key, value]) => (
                                        <span key={key} className="mr-2">
                                          {key}: {value}
                                        </span>
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(transaction.timestamp)}
                      </span>
                      {transaction.transactionId && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          ID:{" "}
                          {transaction.transactionId.slice(-6).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
