"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { CustomerService } from "../../lib/customerService";
import { VisitService } from "../../lib/visitService";
import { useTranslation } from "react-i18next";
import KioskHeader from "../../components/KioskHeader";
import i18n from "../../i18n/index";

export default function QRScanner() {
  const [scannedCode, setScannedCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [visitRecorded, setVisitRecorded] = useState(false);
  // Internal buffer for keystroke-based scanner capture
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(Date.now());
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDev = searchParams.get("dev") === "true"; // dev mode: show manual input
  const { t } = useTranslation();

  // Record visit when scanner page loads (only once per session)
  useEffect(() => {
    const recordPageVisit = async () => {
      if (!visitRecorded) {
        const success = await VisitService.recordVisit(
          Math.random().toString(36).substr(2, 9)
        );
        if (success) {
          setVisitRecorded(true);
          console.log("Scanner page visit recorded successfully");
        }
      }
    };

    recordPageVisit();
  }, [visitRecorded]);

  // Process a completed scan value
  const processScan = async (value) => {
    if (isProcessing) return;
    if (!(value && value.startsWith("CK-") && value.length >= 7)) return;
    setError("");
    setIsProcessing(true);
    try {
      const customer = await CustomerService.getCustomerByMemberId(value);
      if (customer) {
        // Save customer code and customer data to session storage
        sessionStorage.setItem("customerCode", value);
        sessionStorage.setItem("currentCustomer", JSON.stringify(customer));
        console.log(
          "Scanner: Customer found and saved to session:",
          customer.name
        );

        setTimeout(() => {
          router.push("/menu");
        }, 600);
      } else {
        setError(t("customerNotFound"));
        setIsProcessing(false);
        setScannedCode("");
        bufferRef.current = "";
      }
    } catch (err) {
      console.error("Error validating customer:", err);
      setError(t("errorValidatingCustomer"));
      setIsProcessing(false);
      setScannedCode("");
      bufferRef.current = "";
    }
  };

  // Global key listener to capture hardware scanner without triggering virtual keyboard
  useEffect(() => {
    if (isDev) return; // In dev manual mode we skip hardware listener to avoid conflicts
    const handleKey = (e) => {
      if (isProcessing) return;
      const now = Date.now();
      // If long pause, reset buffer
      if (now - lastKeyTimeRef.current > 200) {
        bufferRef.current = "";
      }
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const value = bufferRef.current;
        setScannedCode(value);
        bufferRef.current = "";
        processScan(value.trim());
        return;
      }

      // Ignore control keys
      if (e.key.length === 1) {
        bufferRef.current += e.key.toUpperCase();
        setScannedCode(bufferRef.current);
        // Auto-process early if pattern matches expected length
        if (
          bufferRef.current.startsWith("CK-") &&
          bufferRef.current.length >= 7
        ) {
          // Some scanners don't send Enter; small debounce before processing
          clearTimeout(processTimer);
          processTimer = setTimeout(() => {
            processScan(bufferRef.current);
          }, 80);
        }
      }
    };
    let processTimer;
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      clearTimeout(processTimer);
    };
  }, [isProcessing, isDev, processScan]);

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="kiosk-container min-h-screen portrait:max-w-md mx-auto">
      <div
        className="min-h-screen flex flex-col"
        style={{
          backgroundImage: "url(/background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Header */}
        <KioskHeader onBack={handleBack} showCart={false} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Top Text - All Caps and Green */}
          <div className="mb-12">
            <h2 className="text-7xl font-bold text-green-600 text-center mb-4 uppercase tracking-wide">
              {t("scanMemberCard")}
            </h2>
          </div>

          {/* QR Code Section with Logo */}
          <div className="mb-12 text-center">
            {/* Green rounded box with gradient */}
            <div className="w-96 h-96 bg-gradient-to-br from-green-400 to-green-600 rounded-4xl shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
              {/* White gradient overlay in center */}
              <div className="absolute inset-0 bg-gradient-radial from-white/20 via-transparent to-transparent"></div>

              {/* QR Logo */}
              <Image
                src="/qrlogo.png"
                alt="QR Logo"
                width={240}
                height={240}
                className="w-60 h-60 mb-3 relative z-10"
              />

              {/* Text inside the box */}
              <p className="text-white font-semibold text-3xl mt-6 relative z-10">
                {t("presentMemberQr")}
              </p>
            </div>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="mb-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
              <p className="text-xl text-white font-semibold bg-green-600/80 px-6 py-2 rounded-lg">
                {t("processing")}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-8 w-full max-w-md">
              <div className="p-4 bg-red-500/90 border border-red-400 rounded-lg">
                <p className="text-white text-center font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Continue Without Member Button */}
          {!isProcessing && (
            <div className="mb-8">
              <button
                onClick={() => {
                  // Clear any customer data and set "No Member" state
                  sessionStorage.removeItem("customerCode");
                  sessionStorage.removeItem("currentCustomer");
                  sessionStorage.setItem("noMember", "true");
                  router.push("/menu");
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-colors duration-200 text-xl"
              >
                {t("continueWithoutMember")}
              </button>
            </div>
          )}

          {/* Scanner status or Dev Manual Entry */}
          {!isProcessing && isDev && (
            <div className="w-full max-w-md">
              <div className="bg-white/90 rounded-2xl p-8 border-4 border-blue-300 shadow-inner">
                <p className="text-center text-xl text-blue-700 font-semibold mb-4">
                  {t("devManualEntryMode")}
                </p>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  {t("memberIdFormatInput")}
                </label>
                <input
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder={t("memberIdPlaceholder")}
                  value={scannedCode}
                  onChange={(e) => {
                    setScannedCode(e.target.value.toUpperCase());
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      processScan(scannedCode.trim().toUpperCase());
                    }
                  }}
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() =>
                      processScan(scannedCode.trim().toUpperCase())
                    }
                    disabled={isProcessing || !scannedCode}
                    className="flex-1 bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 rounded-lg shadow hover:bg-blue-700 transition-colors"
                  >
                    {t("process")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScannedCode("");
                      bufferRef.current = "";
                      setError("");
                    }}
                    className="px-4 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium"
                  >
                    {t("clear")}
                  </button>
                </div>
                {scannedCode && !scannedCode.startsWith("CK-") && (
                  <p className="mt-3 text-xs text-red-500 font-medium">
                    {t("idShouldStartWith")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-green-600/90 border-t border-green-500 p-4 text-center">
          <p className="text-white text-4xl">{t("havingTrouble")}</p>
        </div>
      </div>
    </div>
  );
}
