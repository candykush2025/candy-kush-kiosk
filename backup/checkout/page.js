"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CustomerLookup from "../../src/components/CustomerLookup";
import KioskHeader from "../../src/components/KioskHeader";
import { CustomerService } from "../../src/lib/customerService";
import { CashbackService } from "../../src/lib/productService";
import { TransactionService } from "../../src/lib/transactionService";
import { useTranslation } from "react-i18next";

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [cashbackPoints, setCashbackPoints] = useState(0);
  const router = useRouter();
  const { t } = useTranslation();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Session timer states
  const [sessionTimer, setSessionTimer] = useState(60); // 60 seconds = 1 minute
  const sessionTimerRef = useRef(null);
  const [showSessionExpiryModal, setShowSessionExpiryModal] = useState(false);
  const [sessionModalCountdown, setSessionModalCountdown] = useState(60);

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

  const calculateCashbackPoints = useCallback(async () => {
    if (!customer || cart.length === 0) {
      setCashbackPoints(0);
      return;
    }

    try {
      let totalCashback = 0;
      const itemCashbackDetails = [];

      // Get cashback points for each item based on its category
      for (const item of cart) {
        if (item.categoryId) {
          const cashbackPercentage =
            await CashbackService.getCashbackPercentage(item.categoryId);
          const itemTotal = item.price * (item.quantity || 1);
          const itemCashback = Math.floor(
            (itemTotal * cashbackPercentage) / 100
          );

          // Store detailed cashback info for this item
          itemCashbackDetails.push({
            productId: item.productId || item.id,
            name: item.name,
            quantity: item.quantity || 1,
            price: item.price,
            itemTotal: itemTotal,
            cashbackPercentage: cashbackPercentage,
            pointsEarned: itemCashback,
            categoryId: item.categoryId,
          });

          totalCashback += itemCashback;
        }
      }

      setCashbackPoints(totalCashback);

      // Store detailed cashback info for later use in transaction
      window.lastCashbackDetails = itemCashbackDetails;
    } catch (error) {
      console.error("Error calculating cashback:", error);
      setCashbackPoints(0);
      window.lastCashbackDetails = [];
    }
  }, [customer, cart]);

  // Calculate cashback when cart or customer changes
  useEffect(() => {
    calculateCashbackPoints();
  }, [cart, customer, calculateCashbackPoints]);

  // Session timer useEffect
  useEffect(() => {
    // Start session timer when component mounts
    setSessionTimer(60);

    sessionTimerRef.current = setTimeout(() => {
      setShowSessionExpiryModal(true);
      setSessionModalCountdown(60);
    }, 60000);

    // Cleanup on unmount
    return () => {
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }
    };
  }, []);

  // Session expiry modal countdown timer
  useEffect(() => {
    let modalCountdownInterval;

    if (showSessionExpiryModal) {
      setSessionModalCountdown(60);
      modalCountdownInterval = setInterval(() => {
        setSessionModalCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(modalCountdownInterval);
            handleSessionTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (modalCountdownInterval) {
        clearInterval(modalCountdownInterval);
      }
    };
  }, [showSessionExpiryModal, handleSessionTimeout]);

  const processPayment = async () => {
    resetSessionTimer(); // Reset session timer on user interaction

    if (cart.length === 0) {
      setError(t("cartEmpty"));
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const totalAmount = getTotalPrice();
      const orderNumber = `ORDER-${Date.now()}`;

      // Create transaction data for Firebase
      const transactionData = {
        customerId: customer?.id || null,
        customerName: customer
          ? `${customer.name} ${customer.lastName || ""}`.trim()
          : "Guest",
        orderNumber: orderNumber,
        items: cart.map((item) => ({
          productId: item.productId || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          variants: item.variants || {},
          categoryId: item.categoryId,
          subcategoryId: item.subcategoryId,
          total: item.price * (item.quantity || 1),
        })),
        subtotal: totalAmount,
        tax: 0, // Add tax calculation if needed
        discount: 0, // Add discount calculation if needed
        total: totalAmount,
        paymentMethod: paymentMethod,
        paymentStatus: "completed",
        transactionType: "sale",
        status: "completed",
        cashier: "Checkout",
        location: "Main Checkout",
        notes: `Cashback points earned: ${cashbackPoints}`,
        refundReason: "",
        originalTransactionId: null,
        // Add point details
        pointsEarned: cashbackPoints,
        pointDetails: window.lastCashbackDetails || [],
        pointCalculation: {
          totalPointsEarned: cashbackPoints,
          calculationMethod: "category-based",
          items: window.lastCashbackDetails || [],
        },
      };

      // Record transaction to Firebase using TransactionService
      console.log("Recording transaction to Firebase:", transactionData);
      const transactionResult = await TransactionService.createTransaction(
        transactionData
      );
      console.log("Transaction recorded successfully:", transactionResult);

      // Update customer points if customer exists
      if (customer && cashbackPoints > 0) {
        try {
          const pointTransactionDetails = {
            transactionId: transactionResult.transactionId,
            orderId: orderNumber,
            reason: "Purchase Cashback",
            details: `Earned ${cashbackPoints} points from purchase`,
            items: window.lastCashbackDetails || [],
            pointCalculation: {
              totalPointsEarned: cashbackPoints,
              calculationMethod: "category-based",
              breakdown: window.lastCashbackDetails || [],
            },
            purchaseAmount: totalAmount,
            paymentMethod: paymentMethod,
          };

          await CustomerService.addPoints(
            customer.id,
            cashbackPoints,
            pointTransactionDetails
          );
          console.log(
            `Added ${cashbackPoints} points to customer ${customer.name}`
          );
        } catch (pointsError) {
          console.error("Error adding points to customer:", pointsError);
          // Don't fail the transaction if points update fails
        }
      }

      // Clear cart and redirect to success
      sessionStorage.removeItem("cart");
      sessionStorage.setItem(
        "lastOrder",
        JSON.stringify({
          id: transactionResult.transactionId,
          orderId: orderNumber,
          items: cart,
          total: totalAmount,
          customer: customer,
          cashbackPoints: customer ? cashbackPoints : 0,
          transactionId: transactionResult.id,
          paymentMethod: paymentMethod,
          timestamp: new Date().toISOString(),
        })
      );

      router.push("/order-complete");
    } catch (err) {
      console.error("Payment processing error:", err);
      setError(err.message || "Payment processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleBack = () => {
    resetSessionTimer(); // Reset session timer on user interaction
    router.push("/categories");
  };

  const handleCancelOrder = () => {
    resetSessionTimer(); // Reset session timer on user interaction
    // Show confirmation modal instead of immediate navigation
    setShowCancelConfirm(true);
  };

  const confirmCancelOrder = () => {
    // Clear cart and return to home screen
    sessionStorage.removeItem("cart");
    setCart([]);
    setShowCancelConfirm(false);
    router.push("/");
  };

  const cancelCancelOrder = () => {
    setShowCancelConfirm(false);
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

  // Session timer functions
  const handleSessionContinue = () => {
    setShowSessionExpiryModal(false);
    setSessionModalCountdown(60);

    // Clear existing timer
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }

    // Restart the session timer
    setSessionTimer(60);

    // Set new timeout for 60 seconds
    sessionTimerRef.current = setTimeout(() => {
      setShowSessionExpiryModal(true);
      setSessionModalCountdown(60);
    }, 60000);
  };

  const handleSessionTimeout = useCallback(() => {
    // Clear all session data and go to homepage
    sessionStorage.removeItem("cart");
    sessionStorage.removeItem("customerCode");
    sessionStorage.removeItem("currentCustomer");
    sessionStorage.removeItem("selectedPaymentMethod");
    sessionStorage.removeItem("lastOrder");
    sessionStorage.removeItem("receiptData");

    setShowSessionExpiryModal(false);
    setCart([]);
    setCustomer(null);
    router.push("/");
  }, [router]);

  // Reset session timer on user interactions
  const resetSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      setSessionTimer(60); // Reset to 60 seconds

      // Set new timeout for 60 seconds
      sessionTimerRef.current = setTimeout(() => {
        setShowSessionExpiryModal(true);
        setSessionModalCountdown(60);
      }, 60000);
    }
  }, []);

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600 mb-4">
            {t("cartEmpty")}
          </div>
          <button
            onClick={() => router.push("/")}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            {t("continueShopping")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
      <div
        className="min-h-screen bg-gray-50 flex flex-col"
        style={{
          backgroundImage: "url(/background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="relative bg-green-500 hover:bg-green-600 text-white px-5 py-5 rounded-lg font-bold transition-colors flex items-center"
          >
            <svg
              className="w-12 h-12"
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
          </button>
          <div className="relative">
            <style jsx>{`
              @keyframes smokeFloat1 {
                0% {
                  opacity: 0.6;
                  transform: translateY(0px) translateX(0px) scale(0.8)
                    rotate(0deg);
                }
                25% {
                  opacity: 0.8;
                  transform: translateY(-8px) translateX(2px) scale(0.9)
                    rotate(3deg);
                }
                50% {
                  opacity: 0.7;
                  transform: translateY(-18px) translateX(-1px) scale(1.1)
                    rotate(-2deg);
                }
                75% {
                  opacity: 0.4;
                  transform: translateY(-30px) translateX(3px) scale(1.3)
                    rotate(5deg);
                }
                100% {
                  opacity: 0;
                  transform: translateY(-45px) translateX(-2px) scale(1.6)
                    rotate(-3deg);
                }
              }

              @keyframes smokeFloat2 {
                0% {
                  opacity: 0.5;
                  transform: translateY(0px) translateX(0px) scale(0.7)
                    rotate(0deg);
                }
                20% {
                  opacity: 0.9;
                  transform: translateY(-5px) translateX(-2px) scale(0.85)
                    rotate(-4deg);
                }
                40% {
                  opacity: 0.8;
                  transform: translateY(-12px) translateX(1px) scale(1)
                    rotate(2deg);
                }
                60% {
                  opacity: 0.6;
                  transform: translateY(-22px) translateX(-3px) scale(1.2)
                    rotate(-6deg);
                }
                80% {
                  opacity: 0.3;
                  transform: translateY(-35px) translateX(2px) scale(1.4)
                    rotate(4deg);
                }
                100% {
                  opacity: 0;
                  transform: translateY(-50px) translateX(-1px) scale(1.7)
                    rotate(-2deg);
                }
              }

              @keyframes smokeFloat3 {
                0% {
                  opacity: 0.7;
                  transform: translateY(0px) translateX(0px) scale(0.9)
                    rotate(0deg);
                }
                30% {
                  opacity: 0.85;
                  transform: translateY(-10px) translateX(3px) scale(1)
                    rotate(6deg);
                }
                60% {
                  opacity: 0.5;
                  transform: translateY(-25px) translateX(-2px) scale(1.25)
                    rotate(-4deg);
                }
                100% {
                  opacity: 0;
                  transform: translateY(-42px) translateX(4px) scale(1.8)
                    rotate(8deg);
                }
              }

              @keyframes smokeDrift {
                0%,
                100% {
                  transform: translateX(0px);
                }
                50% {
                  transform: translateX(3px);
                }
              }

              .smoke-path-1 {
                animation: smokeFloat1 6s ease-out infinite,
                  smokeDrift 3s ease-in-out infinite;
                filter: blur(1px);
                opacity: 0.6;
              }

              .smoke-path-2 {
                animation: smokeFloat2 7s ease-out infinite 1.5s,
                  smokeDrift 4s ease-in-out infinite 0.5s;
                filter: blur(0.8px);
                opacity: 0.5;
              }

              .smoke-path-3 {
                animation: smokeFloat3 5.5s ease-out infinite 3s,
                  smokeDrift 3.5s ease-in-out infinite 1s;
                filter: blur(1.2px);
                opacity: 0.7;
              }

              .smoke-container {
                animation: smokeDrift 8s ease-in-out infinite;
              }
            `}</style>
            <svg
              version="1.1"
              id="Layer_1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              x="0px"
              y="0px"
              viewBox="0 0 94.62 192.14"
              enableBackground="new 0 0 94.62 192.14"
              xmlSpace="preserve"
              className="absolute w-16 h-16 top-10 -left-3 smoke-container"
            >
              <defs>
                <filter id="smokeFilter">
                  <feTurbulence
                    baseFrequency="0.02 0.1"
                    numOctaves="3"
                    result="turbulence"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="turbulence"
                    scale="2"
                  />
                </filter>
              </defs>
              <g id="Layer_1">
                <g>
                  <g>
                    <path
                      className="smoke-path-1"
                      fill="#FFFFFF"
                      filter="url(#smokeFilter)"
                      d="M75.25,176.65c-1.7,1.31-5.55-0.58-7.11-1.49c-2.12-1.23-4.1-2.93-5.51-4.95 c-2.21-3.19-3.13-7.06-4.23-10.77c-0.96-3.23-2.11-6.43-3.65-9.44c-1.56-3.06-3.88-5.45-5.64-8.34 c-0.01-0.01,2.57,0.18,2.84,0.25c0.84,0.23,1.67,0.57,2.46,0.93c1.67,0.76,3.21,1.79,4.59,2.99c2.84,2.49,5,5.75,6.29,9.29 c1.69,4.64,2.05,9.76,4.33,14.14C71.1,172.09,73.62,174.02,75.25,176.65z"
                    ></path>
                    <path
                      className="smoke-path-2"
                      fill="#FFFFFF"
                      filter="url(#smokeFilter)"
                      d="M32.97,140.33c-1.99,0.35-4.27-4.02-5.02-5.32c-1.46-2.52-2.58-5.24-3.17-8.1 c-0.91-4.42-0.5-9.17,1.59-13.17c2.55-4.88,7.2-8.11,10.36-12.53c1.71-2.39,2.84-5.13,3.67-7.94c0.8-2.69,0.9-5.88,1.95-8.42 c1.91,3.13,2.59,8.08,2.72,11.7c0.14,4.09-0.82,8.13-3.08,11.57c-2.25,3.41-5.59,6.05-7.58,9.62c-1.68,3.01-2.29,6.51-2.3,9.95 c-0.01,3.6,0.66,7.1,1.24,10.63C33.58,139.69,33.38,140.25,32.97,140.33z"
                    ></path>
                    <path
                      className="smoke-path-3"
                      fill="#FFFFFF"
                      filter="url(#smokeFilter)"
                      d="M14.35,88.29c1.35-3.51,4.36-6.23,6.51-9.25c2.23-3.14,3.32-7.08,2.97-10.92 c-0.53-5.86-4.07-10.79-6.54-15.95c-2.57-5.37-4.23-11.41-3.27-17.39c0.76-4.77,3.29-9.14,6.88-12.36 c2.57-2.3,9.11-6.09,12.57-5.63c-1.14,2.51-4.27,4.09-6.22,5.97c-3.18,3.05-5.13,7.34-5.35,11.74 c-0.54,10.93,8.97,20.17,9.53,31.09c0.27,5.17-1.65,10.21-4.75,14.29c-1.59,2.1-3.61,4.11-5.71,5.69 C19.18,86.91,16.65,88.4,14.35,88.29z"
                    ></path>
                  </g>
                </g>
              </g>
            </svg>
            <Image
              alt="Logo"
              width={150}
              height={150}
              src="/logo.png"
              className="cursor-pointer object-cover"
              style={{ color: "transparent" }}
            />
          </div>
          <div className="flex items-center space-x-4">
            {/* Session Timer */}
            <div className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
              {t("sessionExpiresIn")}: {Math.floor(sessionTimer / 60)}:
              {(sessionTimer % 60).toString().padStart(2, "0")}
            </div>
            <div className="relative bg-green-500 hover:bg-green-600 text-white px-5 py-5 rounded-lg font-bold transition-colors flex items-center">
              <div className="text-center w-12 h-12" style={{ color: "white" }}>
                <div className="text-2xl font-bold" style={{ color: "white" }}>
                  {cart.reduce(
                    (total, item) => total + (item.quantity || 1),
                    0
                  )}
                </div>
                <div className="text-s" style={{ color: "white" }}>
                  {t("itemsCount", {
                    count: cart.reduce(
                      (total, item) => total + (item.quantity || 1),
                      0
                    ),
                  })
                    .split(" ")
                    .pop()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cancel confirmation modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-bold mb-2">
                {t("confirmCancelOrder")}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {t("confirmCancelOrderMessage")}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelCancelOrder}
                  className="px-4 py-2 border rounded bg-gray-100"
                >
                  {t("no")}
                </button>
                <button
                  onClick={confirmCancelOrder}
                  className="px-4 py-2 bg-red-500 text-white rounded"
                >
                  {t("yes")}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4">
              {t("orderSummary")}
            </h2>
            <p className="text-xl text-center text-gray-600 mb-12">
              {t("reviewBeforePayment")}
            </p>

            {/* Cart Items */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h3 className="text-2xl font-bold mb-6">{t("yourItems")}</h3>
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
                                    {variantName}:{" "}
                                    {variantValue?.name ||
                                      (typeof variantValue === "string"
                                        ? variantValue
                                        : JSON.stringify(variantValue))}
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
                <div className="text-lg text-gray-600 mb-2">
                  {t("grandTotal")}
                </div>
                <div className="text-6xl font-bold text-green-600 mb-4">
                  ฿{getTotalPrice()}
                </div>
                <div className="text-gray-600">
                  {t("itemsCount", { count: cart.length })} •{" "}
                  {cart.reduce(
                    (total, item) => total + (item.quantity || 1),
                    0
                  )}{" "}
                  {t("totalQuantity")}
                </div>

                {/* Cashback Points Display */}
                {customer && (
                  <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <div className="text-yellow-800 font-semibold flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t("cashbackReward")}
                    </div>
                    <div className="text-lg font-bold text-yellow-900">
                      {t("cashbackPointsAdded", { points: cashbackPoints })}
                    </div>
                    {cashbackPoints === 0 && (
                      <div className="text-xs text-yellow-600 mt-1">
                        {t("cashbackNoPointsHint")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h3 className="text-2xl font-bold mb-4">{t("paymentMethod")}</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => {
                      resetSessionTimer();
                      setPaymentMethod(e.target.value);
                    }}
                    className="text-green-500"
                  />
                  <span className="font-medium">{t("cash")}</span>
                </label>
                <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => {
                      resetSessionTimer();
                      setPaymentMethod(e.target.value);
                    }}
                    className="text-green-500"
                  />
                  <span className="font-medium">{t("card")}</span>
                </label>
                <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="crypto"
                    checked={paymentMethod === "crypto"}
                    onChange={(e) => {
                      resetSessionTimer();
                      setPaymentMethod(e.target.value);
                    }}
                    className="text-green-500"
                  />
                  <span className="font-medium">{t("crypto")}</span>
                </label>
                <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                  <input
                    type="radio"
                    name="payment"
                    value="bank_transfer"
                    checked={paymentMethod === "bank_transfer"}
                    onChange={(e) => {
                      resetSessionTimer();
                      setPaymentMethod(e.target.value);
                    }}
                    className="text-green-500"
                  />
                  <span className="font-medium">{t("bankTransfer")}</span>
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
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={handleBack}
                disabled={processing}
                className="px-8 py-4 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg transition-colors"
              >
                {t("addMoreItems")}
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={processing}
                className="px-8 py-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-xl font-bold text-lg transition-colors"
              >
                {t("cancelOrder") || "Cancel Order"}
              </button>
            </div>
            <button
              onClick={processPayment}
              disabled={processing}
              className="w-full px-8 py-5 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-xl font-bold text-2xl transition-colors"
            >
              {processing
                ? t("processingEllipsis")
                : t("completeOrder", { total: getTotalPrice() })}
            </button>
          </div>
        </div>

        {/* Customer Lookup Modal */}
        {showCustomerLookup && (
          <CustomerLookup
            onCustomerFound={handleCustomerFound}
            onClose={() => setShowCustomerLookup(false)}
          />
        )}

        {/* Session Expiry Modal */}
        {showSessionExpiryModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 m-4 max-w-md w-full border-2 border-red-200">
              <div className="text-center">
                <div className="text-6xl mb-4">⏰</div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">
                  {t("areYouStillThere")}
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  {t("sessionExpiryMessage")}
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={handleSessionContinue}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-bold text-lg transition-colors"
                  >
                    {t("yes")}
                  </button>
                  <button
                    onClick={handleSessionTimeout}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-bold text-lg transition-colors"
                  >
                    {t("no")} ({sessionModalCountdown})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
