"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CustomerLookup from "../../components/CustomerLookup";
import { CustomerService } from "../../lib/customerService";
import { CashbackService } from "../../lib/productService";

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [cashbackPoints, setCashbackPoints] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Load cart from session storage
    const savedCart = sessionStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    // Load customer from session storage
    const loadCustomer = async () => {
      const customerCode = sessionStorage.getItem("customerCode");
      if (customerCode) {
        try {
          const customerData = await CustomerService.getCustomerByMemberId(
            customerCode
          );
          if (customerData) {
            setCustomer(customerData);
          }
        } catch (error) {
          console.error("Error loading customer:", error);
        }
      }
    };

    loadCustomer();
  }, []);

  const getTotalPrice = () => {
    return cart.reduce(
      (total, item) => total + item.price * (item.quantity || 1),
      0
    );
  };

  const handleCustomerSelect = (selectedCustomer) => {
    setCustomer(selectedCustomer);
    setShowCustomerLookup(false);

    // Record visit if customer is selected
    if (selectedCustomer) {
      CustomerService.recordVisit(selectedCustomer.id).catch(console.error);
    }
  };

  const calculateCashbackPoints = async () => {
    if (!customer || cart.length === 0) {
      setCashbackPoints(0);
      return;
    }

    try {
      let totalCashback = 0;

      // Get cashback points for each item based on its category
      for (const item of cart) {
        if (item.categoryId) {
          const cashbackPercentage =
            await CashbackService.getCashbackPercentage(item.categoryId);
          const itemTotal = item.price * (item.quantity || 1);
          const itemCashback = Math.floor(
            (itemTotal * cashbackPercentage) / 100
          );
          totalCashback += itemCashback;
        }
      }

      setCashbackPoints(totalCashback);
    } catch (error) {
      console.error("Error calculating cashback:", error);
      setCashbackPoints(0);
    }
  };

  // Calculate cashback when cart or customer changes
  useEffect(() => {
    calculateCashbackPoints();
  }, [cart, customer]);

  const processPayment = async () => {
    if (cart.length === 0) {
      setError("Cart is empty");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const totalAmount = getTotalPrice() * 100; // Convert to cents

      // Record transaction if customer is selected
      let transactionData = null;
      if (customer) {
        transactionData = await CustomerService.recordTransaction(customer.id, {
          amount: totalAmount,
          items: cart.map((item) => ({
            name: item.name, // Use the actual product name
            price: item.price * 100, // Convert to cents for database storage
            quantity: item.quantity || 1,
            categoryId: item.categoryId, // Include categoryId for cashback tracking
            productId: item.productId, // Include productId for reference
            variants: item.variants, // Include variant information
          })),
          paymentMethod,
          cashbackPoints: cashbackPoints,
        });
      }

      // Clear cart and redirect to success
      sessionStorage.removeItem("cart");
      sessionStorage.setItem(
        "lastOrder",
        JSON.stringify({
          items: cart,
          total: getTotalPrice(),
          customer: customer,
          cashbackPoints: customer ? cashbackPoints : 0,
          transactionId: transactionData?.id,
          paymentMethod: paymentMethod,
          timestamp: new Date().toISOString(),
        })
      );

      router.push("/order-complete");
    } catch (err) {
      setError(err.message || "Payment processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    router.push("/categories");
  };

  const removeFromCart = (itemIdToRemove) => {
    const updatedCart = cart.filter((item) => item.id !== itemIdToRemove);
    setCart(updatedCart);
    sessionStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map((item) =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    sessionStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600 mb-4">
            Your cart is empty
          </div>
          <button
            onClick={() => router.push("/products/pre-rolled")}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            Continue Shopping
          </button>
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
            Back to Products
          </button>
          <h1 className="text-xl font-bold text-gray-800">Checkout Summary</h1>
          <div className="text-green-600 font-bold">
            {cart.length} item{cart.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4">
              Order Summary
            </h2>
            <p className="text-xl text-center text-gray-600 mb-12">
              Review your items before proceeding to payment
            </p>

            {/* Cart Items */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h3 className="text-2xl font-bold mb-6">Your Items</h3>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={`${item.name} ${Object.values(
                            item.variants || {}
                          ).join(" ")}`}
                          width={80}
                          height={80}
                          className="rounded-lg mr-4"
                        />
                      )}
                      <div>
                        <div className="font-semibold text-lg">{item.name}</div>
                        {item.variants &&
                          Object.keys(item.variants).length > 0 && (
                            <div className="text-gray-600">
                              {Object.entries(item.variants).map(
                                ([variantName, variantValue]) => (
                                  <div key={variantName}>
                                    {variantName}: {variantValue}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        <div className="text-green-600 font-bold">
                          ฿{item.price} each
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, (item.quantity || 1) - 1)
                          }
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <div className="text-lg font-semibold w-8 text-center">
                          {item.quantity || 1}
                        </div>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, (item.quantity || 1) + 1)
                          }
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right min-w-[100px]">
                        <div className="text-xl font-bold text-green-600">
                          ฿{item.price * (item.quantity || 1)}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grand Total */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg p-8 mb-8 border-2 border-green-200">
              <div className="text-center">
                <div className="text-lg text-gray-600 mb-2">Grand Total</div>
                <div className="text-6xl font-bold text-green-600 mb-4">
                  ฿{getTotalPrice()}
                </div>
                <div className="text-gray-600">
                  {cart.length} item{cart.length !== 1 ? "s" : ""} •{" "}
                  {cart.reduce(
                    (total, item) => total + (item.quantity || 1),
                    0
                  )}{" "}
                  total quantity
                </div>

                {/* Cashback Points Display */}
                {customer && (
                  <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <div className="text-yellow-800 font-semibold">
                      🎉 Cashback Reward
                    </div>
                    <div className="text-lg font-bold text-yellow-900">
                      {cashbackPoints} points will be added to your account!
                    </div>
                    {cashbackPoints === 0 && (
                      <div className="text-xs text-yellow-600 mt-1">
                        (Add items from categories with cashback to earn points)
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h3 className="text-2xl font-bold mb-4">Payment Method</h3>
              <div className="grid grid-cols-3 gap-4">
                <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-500"
                  />
                  <span className="font-medium">Cash</span>
                </label>
                <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="crypto"
                    checked={paymentMethod === "crypto"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-500"
                  />
                  <span className="font-medium">Crypto</span>
                </label>
                <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="bank_transfer"
                    checked={paymentMethod === "bank_transfer"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-green-500"
                  />
                  <span className="font-medium">Bank Transfer</span>
                </label>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleBack}
                className="px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold text-lg transition-colors"
              >
                Add More Items
              </button>
              <button
                onClick={processPayment}
                disabled={processing}
                className="px-8 py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg transition-colors"
              >
                {processing
                  ? "Processing..."
                  : `Complete Order - $${getTotalPrice()}`}
              </button>
            </div>
          </div>
        </div>

        {/* Customer Lookup Modal */}
        {showCustomerLookup && (
          <CustomerLookup
            onCustomerFound={handleCustomerFound}
            onClose={() => setShowCustomerLookup(false)}
          />
        )}
      </div>
    </div>
  );
}
