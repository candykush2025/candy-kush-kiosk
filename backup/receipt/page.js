"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ReceiptPage() {
  const [order, setOrder] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Get order data from session storage
    const savedOrder = sessionStorage.getItem("currentOrder");

    if (savedOrder) {
      setOrder(JSON.parse(savedOrder));
    } else {
      // If no order data, redirect to categories
      router.push("/categories");
    }
  }, [router]);

  const handlePrintReceipt = () => {
    setIsPrinting(true);

    // Simulate printing delay
    setTimeout(() => {
      setIsPrinting(false);
      // After printing, go to completion page
      router.push("/complete");
    }, 2000);
  };

  const handleEmailReceipt = () => {
    // Simulate email sending
    alert("Receipt sent to your email address!");
  };

  const handleContinue = () => {
    router.push("/complete");
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="w-8 h-8 text-green-600 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xl font-bold text-gray-800">
              Order Complete
            </span>
          </div>
          <div className="text-green-600 font-bold">#{order.orderNumber}</div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            {/* Success Message */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-green-600"
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
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Thank You!
              </h1>
              <p className="text-xl text-gray-600">
                Your order has been confirmed and is being processed
              </p>
            </div>

            {/* Receipt */}
            <div
              className="bg-white rounded-2xl shadow-2xl p-8 mb-8"
              id="receipt"
            >
              {/* Receipt Header */}
              <div className="text-center border-b pb-6 mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Candy Kush
                </h2>
                <p className="text-gray-600">Dispensary</p>
                <p className="text-sm text-gray-500 mt-2">
                  123 St, Weed City, WC 12345
                </p>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-600">Order Number</div>
                  <div className="font-bold text-lg">{order.orderNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Date & Time</div>
                  <div className="font-bold">{formatDate(order.timestamp)}</div>
                </div>
                {order.customer && (
                  <>
                    <div>
                      <div className="text-sm text-gray-600">Customer</div>
                      <div className="font-bold">{order.customer.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Member ID</div>
                      <div className="font-bold">{order.customer.id}</div>
                    </div>
                  </>
                )}
                {!order.customer && (
                  <div className="col-span-2">
                    <div className="text-sm text-gray-600">Customer</div>
                    <div className="font-bold">Guest Order</div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="border-t border-b py-6 mb-6">
                <h3 className="font-bold text-lg mb-4">Items Ordered</h3>
                <div className="space-y-3">
                  {order.cart.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold">
                          {item.strain} {item.quality} {item.size}
                        </div>
                        <div className="text-sm text-gray-600">
                          ${item.price} × {item.quantity || 1}
                        </div>
                      </div>
                      <div className="font-bold">
                        ${item.price * (item.quantity || 1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Info */}
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-2">Payment Method</h3>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">
                    {order.paymentMethod.icon}
                  </span>
                  <div>
                    <div className="font-semibold">
                      {order.paymentMethod.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.paymentMethod.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center text-2xl font-bold">
                  <span>Total Amount:</span>
                  <span className="text-green-600">${order.total}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-8 pt-6 border-t text-sm text-gray-500">
                <p>Thank you for choosing Candy Kush!</p>
                <p>Please keep this receipt for your records</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handlePrintReceipt}
                disabled={isPrinting}
                className={`flex items-center justify-center px-6 py-4 rounded-xl font-bold transition-colors ${
                  isPrinting
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                {isPrinting ? (
                  <div className="flex items-center">
                    <svg
                      className="animate-spin w-5 h-5 mr-2"
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
                    Printing...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Print Receipt
                  </div>
                )}
              </button>

              <button
                onClick={handleEmailReceipt}
                className="flex items-center justify-center px-6 py-4 rounded-xl font-bold bg-purple-500 hover:bg-purple-600 text-white transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Email Receipt
              </button>

              <button
                onClick={handleContinue}
                className="flex items-center justify-center px-6 py-4 rounded-xl font-bold bg-green-500 hover:bg-green-600 text-white transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
