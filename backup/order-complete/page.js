"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import i18n from "../../src/i18n";

export default function OrderCompletePage() {
  const [orderData, setOrderData] = useState(null);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    // Get the last order from session storage
    const lastOrder = sessionStorage.getItem("lastOrder");
    if (lastOrder) {
      setOrderData(JSON.parse(lastOrder));
    }
  }, []);

  const handlePrintReceipt = () => {
    if (orderData) {
      // Store receipt data in session storage
      sessionStorage.setItem("receiptData", JSON.stringify(orderData));

      // Open thermal receipt page in a new window
      const receiptWindow = window.open(
        "/thermal-receipt",
        "thermalReceipt",
        "width=400,height=600"
      );

      // Focus the new window
      if (receiptWindow) {
        receiptWindow.focus();
      }
    }
  };

  const startNewOrder = () => {
    // Clear all session data for next customer
    sessionStorage.removeItem("lastOrder");
    sessionStorage.removeItem("cart");
    sessionStorage.removeItem("customerCode");
    sessionStorage.removeItem("currentCustomer");
    sessionStorage.removeItem("selectedPaymentMethod");
    sessionStorage.removeItem("receiptData");

    // Reset language to English default for next customer
    localStorage.removeItem("i18nextLng");
    i18n.changeLanguage("en");

    // Go back to homepage for next customer
    router.push("/");
  };

  if (!orderData) {
    return (
      <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              {t("loading")}
            </h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Thermal Receipt Layout - Hidden on screen, visible when printing */}
      <div className="print:block hidden">
        <style jsx>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: "Courier New", monospace;
              font-size: 12px;
              line-height: 1.2;
            }
          }
        `}</style>

        <div
          style={{
            width: "80mm",
            padding: "2mm",
            fontFamily: "Courier New, monospace",
            fontSize: "12px",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "4mm" }}>
            <div style={{ fontSize: "16px", fontWeight: "bold" }}>
              CANDY KUSH
            </div>
            <div style={{ fontSize: "10px" }}>Tel: +66-xxx-xxx-xxxx</div>
            <div
              style={{ borderTop: "1px dashed #000", margin: "2mm 0" }}
            ></div>
          </div>

          {/* Order Info */}
          <div style={{ marginBottom: "4mm" }}>
            <div>
              {t("date")}: {new Date(orderData?.timestamp).toLocaleDateString()}
            </div>
            <div>
              {t("time")}: {new Date(orderData?.timestamp).toLocaleTimeString()}
            </div>
            {orderData?.transactionId && (
              <div>ID: {orderData.transactionId}</div>
            )}
            <div
              style={{ borderTop: "1px dashed #000", margin: "2mm 0" }}
            ></div>
          </div>

          {/* Items */}
          <div style={{ marginBottom: "4mm" }}>
            {orderData?.items.map((item, index) => (
              <div key={index} style={{ marginBottom: "2mm" }}>
                <div style={{ fontWeight: "bold" }}>{item.name}</div>
                {item.variants && Object.keys(item.variants).length > 0 && (
                  <div style={{ fontSize: "10px", marginLeft: "2mm" }}>
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
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>Qty: {item.quantity || 1}</span>
                  <span>฿{item.price * (item.quantity || 1)}</span>
                </div>
              </div>
            ))}
            <div
              style={{ borderTop: "1px dashed #000", margin: "2mm 0" }}
            ></div>
          </div>

          {/* Total */}
          <div style={{ marginBottom: "4mm" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              <span>{t("total")}</span>
              <span>฿{orderData?.total}</span>
            </div>

            {/* Payment Method */}
            <div style={{ fontSize: "12px", marginTop: "2mm" }}>
              <div>
                {t("paymentMethodLabel")}{" "}
                {orderData?.paymentMethod === "bank_transfer"
                  ? "Bank Transfer"
                  : orderData?.paymentMethod === "crypto"
                  ? "Crypto"
                  : "Cash"}
              </div>
            </div>

            {orderData?.customer && (
              <div style={{ fontSize: "10px", marginTop: "2mm" }}>
                <div>
                  {t("customerLabel")}: {orderData.customer.name}
                </div>
                <div>
                  {t("pointsEarned")}: {orderData.cashbackPoints || 0}
                </div>
                {orderData.cashbackPoints > 0 && (
                  <div>
                    {t("cashbackPoints")}: {orderData.cashbackPoints}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{ textAlign: "center", fontSize: "10px", marginTop: "4mm" }}
          >
            <div
              style={{ borderTop: "1px dashed #000", margin: "2mm 0" }}
            ></div>
            <div>{t("thankYouPurchase")}</div>
            <div>{t("visitUsAgain")}</div>
          </div>
        </div>
      </div>

      {/* Screen Display - Hidden when printing */}
      <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto print:hidden">
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
              {t("orderComplete")}
            </h1>
            <p className="text-gray-600 mb-6">{t("thankYouPurchase")}</p>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-bold text-lg mb-3">{t("orderSummary")}</h3>
              <div className="space-y-2">
                {orderData?.items.map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-700 font-medium">
                        {item.name}
                      </span>
                      <span className="font-medium">
                        ฿{item.price * (item.quantity || 1)}
                      </span>
                    </div>
                    {item.variants && Object.keys(item.variants).length > 0 && (
                      <div className="text-sm text-gray-500 ml-2">
                        {Object.entries(item.variants).map(
                          ([variantName, variantValue]) => (
                            <div key={variantName}>
                              {variantName}:{" "}
                              {variantValue?.name || variantValue}
                            </div>
                          )
                        )}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 ml-2">
                      Quantity: {item.quantity || 1}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 mt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>{t("total")}</span>
                  <span className="text-green-600">฿{orderData?.total}</span>
                </div>

                {/* Payment Method */}
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>{t("paymentMethodLabel")}</span>
                  <span>
                    {orderData?.paymentMethod === "bank_transfer"
                      ? "Bank Transfer"
                      : orderData?.paymentMethod === "crypto"
                      ? "Crypto"
                      : "Cash"}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            {orderData?.customer && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-bold text-lg mb-2">{t("customerLabel")}</h3>
                <p className="text-gray-700">{orderData.customer.name}</p>
                {(orderData.cashbackPoints || 0) > 0 && (
                  <p className="text-green-600 font-medium">
                    {t("pointsEarned")}: {orderData.cashbackPoints || 0}
                  </p>
                )}
                {orderData.cashbackPoints > 0 && (
                  <p className="text-yellow-600 font-medium">
                    {t("cashbackPoints")}: {orderData.cashbackPoints}
                  </p>
                )}
              </div>
            )}

            {/* Order Details */}
            <div className="text-sm text-gray-500 mb-6">
              <p>{t("orderCompletedAt")}</p>
              <p>{new Date(orderData?.timestamp).toLocaleString()}</p>
              {orderData?.transactionId && (
                <p className="mt-1">
                  {t("transactionId")} {orderData.transactionId}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handlePrintReceipt}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {t("printReceipt")}
              </button>
              <button
                onClick={startNewOrder}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Start New Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
