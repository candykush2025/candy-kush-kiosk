"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const paymentMethods = [
  {
    id: "cash",
    name: "Cash Payment",
    description: "Pay with cash at pickup",
    icon: "💵",
    color: "bg-green-100 border-green-500 text-green-800",
    available: true,
  },
  {
    id: "crypto",
    name: "Cryptocurrency",
    description: "Bitcoin, Ethereum, or other crypto",
    icon: "₿",
    color: "bg-orange-100 border-orange-500 text-orange-800",
    available: true,
  },
  {
    id: "bank",
    name: "Bank Transfer",
    description: "Direct bank transfer",
    icon: "🏦",
    color: "bg-blue-100 border-blue-500 text-blue-800",
    available: true,
  },
];

export default function PaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [currentMethodIndex, setCurrentMethodIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Get cart and customer data from session storage
    const savedCart = sessionStorage.getItem("cart");
    const savedCustomer = sessionStorage.getItem("currentCustomer");

    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    if (savedCustomer) {
      setCustomer(JSON.parse(savedCustomer));
    }

    // If no cart, redirect back to checkout
    if (!savedCart) {
      router.push("/checkout");
    }
  }, [router]);

  const getTotalPrice = () => {
    return cart.reduce(
      (total, item) => total + item.price * (item.quantity || 1),
      0
    );
  };

  const handleBack = () => {
    router.push("/checkout");
  };

  const navigateMethod = (direction) => {
    if (direction === "left") {
      setCurrentMethodIndex((prev) =>
        prev > 0 ? prev - 1 : paymentMethods.length - 1
      );
    } else {
      setCurrentMethodIndex((prev) =>
        prev < paymentMethods.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  const proceedToOrder = () => {
    if (selectedMethod) {
      // Save payment method to session storage
      sessionStorage.setItem(
        "selectedPaymentMethod",
        JSON.stringify(selectedMethod)
      );
      router.push("/order");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600 mb-4">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-800">Payment Method</h1>
          <div className="text-green-600 font-bold">
            Total: ${getTotalPrice()}
          </div>
        </div>

        {/* Customer Info (if available) */}
        {customer && (
          <div className="bg-white border-b p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Welcome back, {customer.name}!
                  </h2>
                  <p className="text-gray-600">
                    Member ID: {customer.id} • Tier: {customer.tier} • Points:{" "}
                    {customer.totalPoints || customer.points || 0}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Cart Items</div>
                  <div className="text-xl font-bold text-gray-800">
                    {cart.length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4">
              Choose Payment Method
            </h2>
            <p className="text-xl text-center text-gray-600 mb-12">
              Select how you&apos;d like to pay for your order
            </p>

            {/* Single Payment Method with Navigation */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-8">
              <div className="flex items-center justify-between">
                {/* Left Arrow */}
                <button
                  onClick={() => navigateMethod("left")}
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg"
                >
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* Payment Method Display */}
                <div className="flex-1 mx-8 text-center">
                  <div className="mb-8">
                    <div className="text-8xl mb-4">
                      {paymentMethods[currentMethodIndex].icon}
                    </div>
                  </div>

                  <div
                    className={`p-8 rounded-xl border-2 ${paymentMethods[currentMethodIndex].color}`}
                  >
                    <h3 className="text-4xl font-bold mb-4">
                      {paymentMethods[currentMethodIndex].name}
                    </h3>
                    <p className="text-xl mb-6">
                      {paymentMethods[currentMethodIndex].description}
                    </p>

                    {/* Price Display */}
                    <div className="bg-white bg-opacity-50 p-4 rounded-lg mb-6">
                      <div className="text-sm text-gray-600">Total Amount</div>
                      <div className="text-3xl font-bold text-gray-800">
                        ${getTotalPrice()}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleMethodSelect(paymentMethods[currentMethodIndex])
                      }
                      className="bg-green-500 hover:bg-green-600 text-white px-12 py-4 rounded-xl font-bold text-xl transition-colors shadow-lg"
                    >
                      Select {paymentMethods[currentMethodIndex].name}
                    </button>
                  </div>
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() => navigateMethod("right")}
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg"
                >
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Indicators */}
              <div className="flex justify-center mt-8 space-x-3">
                {paymentMethods.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMethodIndex(index)}
                    className={`w-4 h-4 rounded-full transition-colors ${
                      index === currentMethodIndex
                        ? "bg-green-500"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4">Order Summary</h3>
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-semibold">
                        {item.strain} {item.quality} {item.size}
                      </div>
                      <div className="text-sm text-gray-600">
                        Quantity: {item.quantity || 1}
                      </div>
                    </div>
                    <div className="text-green-600 font-bold">
                      ${item.price * (item.quantity || 1)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">${getTotalPrice()}</span>
                </div>
              </div>
            </div>

            {/* Proceed Button */}
            {selectedMethod && (
              <div className="mt-8 text-center">
                <button
                  onClick={proceedToOrder}
                  className="bg-green-500 hover:bg-green-600 text-white px-16 py-6 rounded-xl font-bold text-2xl transition-colors shadow-lg"
                >
                  Proceed to Order Confirmation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
