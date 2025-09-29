import { useState, useEffect, useCallback } from "react";
import { CustomerService } from "../lib/customerService";

export default function PointsHistory({ customerId, isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

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

  useEffect(() => {
    if (isOpen && customerId) {
      loadPointsHistory();
    }
  }, [isOpen, customerId, loadPointsHistory]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="bg-green-600 text-white p-6" style={{ color: "white" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: "white" }}>
                Points Statement
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-green-700 rounded-full p-2 transition-colors"
              style={{ color: "white" }}
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
                No Transaction History
              </h3>
              <p className="text-gray-600">
                Your points statement is empty. Start shopping to earn points!
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {/* Statement Header */}
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                <div className="grid grid-cols-3 gap-4 text-sm font-semibold text-gray-700">
                  <div>Transaction ID</div>
                  <div>Date</div>
                  <div className="text-right">Points</div>
                </div>
              </div>

              {/* Statement Rows */}
              {history.map((transaction, index) => (
                <div
                  key={index}
                  className="px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="font-mono text-gray-800">
                      {transaction.transactionId
                        ? transaction.transactionId.slice(-6).toUpperCase()
                        : `${(646363 + index).toString()}`}
                    </div>
                    <div className="text-gray-700">
                      {formatDate(transaction.timestamp)}
                    </div>
                    <div className="text-right">
                      <span
                        className="font-bold text-base"
                        style={{
                          color:
                            transaction.type === "added"
                              ? "#059669"
                              : "#dc2626",
                        }}
                      >
                        {transaction.type === "added" ? "+" : "-"}
                        {transaction.amount} point
                        {transaction.amount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Statement Footer */}
              <div className="bg-green-50 px-4 py-3 border-t-2 border-green-200">
                <div className="grid grid-cols-3 gap-4 text-sm font-semibold">
                  <div className="col-span-2 text-gray-700">
                    Current Balance:
                  </div>
                  <div className="text-right text-green-700 text-lg">
                    {totalPoints.toLocaleString()} point
                    {totalPoints !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
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
