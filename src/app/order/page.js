"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function OrderPage() {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Get all data from session storage
    const savedCart = sessionStorage.getItem("cart");
    const savedCustomer = sessionStorage.getItem("currentCustomer");
    const savedPaymentMethod = sessionStorage.getItem("selectedPaymentMethod");

    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    if (savedCustomer) {
      const customerData = JSON.parse(savedCustomer);
      // Calculate total points from transactions array
      if (Array.isArray(customerData.points)) {
        customerData.totalPoints = customerData.points.reduce(
          (total, transaction) => {
            if (transaction.type === "added") {
              return total + (transaction.amount || 0);
            } else if (transaction.type === "minus") {
              return total - (transaction.amount || 0);
            }
            return total;
          },
          0
        );
      } else {
        customerData.totalPoints = customerData.points || 0;
      }
      setCustomer(customerData);
    }

    if (savedPaymentMethod) {
      setPaymentMethod(JSON.parse(savedPaymentMethod));
    }

    // Generate order number
    const orderNum = `CK-${Date.now().toString().slice(-6)}`;
    setOrderNumber(orderNum);

    // If missing cart or payment method, redirect back
    if (!savedCart || !savedPaymentMethod) {
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
    router.push("/payment");
  };

  const handleConfirmOrder = async () => {
    setIsProcessing(true);

    // Simulate order processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Save order data
    const orderData = {
      orderNumber,
      customer,
      cart,
      paymentMethod,
      total: getTotalPrice(),
      timestamp: new Date().toISOString(),
      status: "confirmed",
    };

    sessionStorage.setItem("currentOrder", JSON.stringify(orderData));

    // Clear cart
    sessionStorage.removeItem("cart");

    setIsProcessing(false);
    router.push("/receipt");
  };

  const handleEditCart = () => {
    router.push("/checkout");
  };

  const handleChangePayment = () => {
    router.push("/payment");
  };

  if (cart.length === 0 || !paymentMethod) {
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
            disabled={isProcessing}
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
          <h1 className="text-xl font-bold text-gray-800">
            Order Confirmation
          </h1>
          <div className="text-green-600 font-bold">Order #{orderNumber}</div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4">
              Confirm Your Order
            </h2>
            <p className="text-xl text-center text-gray-600 mb-8">
              Please review your order details before confirming
            </p>

            <div className="grid gap-6">
              {/* Customer Information (if available) */}
              {customer && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-2xl font-bold mb-4 flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Name</div>
                      <div className="text-lg font-semibold">
                        {customer.name}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Member ID</div>
                      <div className="text-lg font-semibold">{customer.id}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Tier</div>
                      <div
                        className={`text-lg font-semibold ${customer.tierColor}`}
                      >
                        {customer.tier}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">
                        Points Balance
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {customer.totalPoints || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    Order Items ({cart.length})
                  </h3>
                  <button
                    onClick={handleEditCart}
                    className="text-green-600 hover:text-green-700 font-semibold"
                    disabled={isProcessing}
                  >
                    Edit Cart
                  </button>
                </div>

                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={`${item.strain} ${item.quality} ${item.size}`}
                            width={60}
                            height={60}
                            className="rounded-lg mr-4"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-lg">
                            {item.strain} {item.quality}
                          </div>
                          <div className="text-gray-600">
                            Size: {item.size} • Qty: {item.quantity || 1}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">
                          ${item.price * (item.quantity || 1)}
                        </div>
                        <div className="text-sm text-gray-600">
                          ${item.price} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between text-2xl font-bold">
                    <span>Subtotal:</span>
                    <span className="text-green-600">${getTotalPrice()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold flex items-center">
                    <svg
                      className="w-6 h-6 mr-2 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Payment Method
                  </h3>
                  <button
                    onClick={handleChangePayment}
                    className="text-green-600 hover:text-green-700 font-semibold"
                    disabled={isProcessing}
                  >
                    Change Method
                  </button>
                </div>

                <div
                  className={`p-4 rounded-lg border-2 ${paymentMethod.color}`}
                >
                  <div className="flex items-center">
                    <div className="text-4xl mr-4">{paymentMethod.icon}</div>
                    <div>
                      <div className="text-xl font-bold">
                        {paymentMethod.name}
                      </div>
                      <div className="text-gray-600">
                        {paymentMethod.description}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Total */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg p-8 border-2 border-green-200">
                <div className="text-center">
                  <div className="text-lg text-gray-600 mb-2">Total Amount</div>
                  <div className="text-5xl font-bold text-green-600 mb-4">
                    ${getTotalPrice()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Order #{orderNumber} • {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <div className="text-center">
                <button
                  onClick={handleConfirmOrder}
                  disabled={isProcessing}
                  className={`px-16 py-6 rounded-xl font-bold text-2xl transition-colors shadow-lg ${
                    isProcessing
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin w-6 h-6 mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing Order...
                    </div>
                  ) : (
                    "Confirm & Place Order"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
