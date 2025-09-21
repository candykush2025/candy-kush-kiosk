"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrderCompletePage() {
  const [orderData, setOrderData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Get the last order from session storage
    const lastOrder = sessionStorage.getItem("lastOrder");
    if (lastOrder) {
      setOrderData(JSON.parse(lastOrder));
    }
  }, []);

  const startNewOrder = () => {
    // Clear any session data and go back to categories
    sessionStorage.removeItem("lastOrder");
    router.push("/categories");
  };

  if (!orderData) {
    return (
      <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Loading...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-10 h-10 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Order Complete!
          </h1>
          <p className="text-gray-600 mb-6">Thank you for your purchase</p>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-bold text-lg mb-3">Order Summary</h3>
            <div className="space-y-2">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-gray-700">
                    {item.strain} {item.quality} {item.size}
                  </span>
                  <span className="font-medium">${item.price}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 mt-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-green-600">${orderData.total}</span>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="text-sm text-gray-500 mb-6">
            <p>Order completed at:</p>
            <p>{new Date(orderData.timestamp).toLocaleString()}</p>
          </div>

          {/* Action Button */}
          <button
            onClick={startNewOrder}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Start New Order
          </button>
        </div>
      </div>
    </div>
  );
}
