"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CompletePage() {
  const [order, setOrder] = useState(null);
  const [countdown, setCountdown] = useState(10);
  const router = useRouter();

  useEffect(() => {
    // Get order data from session storage
    const savedOrder = sessionStorage.getItem("currentOrder");

    if (savedOrder) {
      setOrder(JSON.parse(savedOrder));
    } else {
      // If no order data, redirect to categories
      router.push("/categories");
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Clear all session data and redirect to idle
          sessionStorage.clear();
          router.push("/idle");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleStartNewOrder = () => {
    // Clear session data and go to idle screen
    sessionStorage.clear();
    router.push("/idle");
  };

  const handleViewCategories = () => {
    // Keep customer data but clear order data
    sessionStorage.removeItem("currentOrder");
    sessionStorage.removeItem("cart");
    sessionStorage.removeItem("selectedPaymentMethod");
    router.push("/categories");
  };

  if (!order) {
    return (
      <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600 mb-4">
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Animation */}
          <div className="mb-8">
            <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <svg
                className="w-20 h-20 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* Main Message */}
          <div className="bg-white rounded-3xl shadow-2xl p-12 mb-8">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Order Complete! 🎉
            </h1>
            <p className="text-2xl text-gray-600 mb-8">
              Thank you for your purchase
              {order.customer ? `, ${order.customer.name}` : ""}!
            </p>

            {/* Order Summary */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 mb-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Order Number</div>
                  <div className="text-2xl font-bold text-gray-800">
                    #{order.orderNumber}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Paid</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${order.total}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-gray-600">Payment Method</div>
                  <div className="flex items-center justify-center">
                    <span className="text-3xl mr-3">
                      {order.paymentMethod.icon}
                    </span>
                    <span className="text-xl font-semibold">
                      {order.paymentMethod.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                What&apos;s Next?
              </h3>
              <div className="text-lg text-gray-600 space-y-2">
                <p>✅ Your order is being prepared</p>
                <p>✅ You&apos;ll receive an email confirmation</p>
                <p>✅ Pickup instructions will be sent shortly</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <button
                onClick={handleViewCategories}
                className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-lg transition-colors"
              >
                Order More Items
              </button>
              <button
                onClick={handleStartNewOrder}
                className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg transition-colors"
              >
                Start New Order
              </button>
            </div>

            {/* Auto redirect countdown */}
            <div className="text-center">
              <div className="inline-flex items-center bg-gray-100 rounded-full px-6 py-3">
                <svg
                  className="w-5 h-5 text-gray-600 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-600">
                  Returning to main screen in{" "}
                  <span className="font-bold text-green-600">{countdown}</span>{" "}
                  seconds
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500">
            <p className="text-lg">Thank you for choosing Candy Kush!</p>
            <p>Visit us again soon for premium cannabis products</p>
          </div>
        </div>
      </div>
    </div>
  );
}
