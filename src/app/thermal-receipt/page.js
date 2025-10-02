"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function ThermalReceiptPage() {
  const [orderData, setOrderData] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Get the order data from session storage
    const orderString = sessionStorage.getItem("receiptData");
    if (orderString) {
      setOrderData(JSON.parse(orderString));
      // Auto-print when page loads
      setTimeout(() => {
        window.print();
      }, 500);
    }

    // Listen for print events
    const handleAfterPrint = () => {
      // Close the window after printing
      setTimeout(() => {
        window.close();
      }, 1000);
    };

    const handleBeforePrint = () => {
      console.log("Print dialog opened");
    };

    // Add event listeners
    window.addEventListener("afterprint", handleAfterPrint);
    window.addEventListener("beforeprint", handleBeforePrint);

    // Cleanup event listeners
    return () => {
      window.removeEventListener("afterprint", handleAfterPrint);
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, []);

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
                          {variantName}: {variantValue?.name || variantValue}
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
    </>
  );
}
