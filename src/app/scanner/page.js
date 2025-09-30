"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomerService } from "../../lib/customerService";
import { VisitService } from "../../lib/visitService";
import { useTranslation } from "react-i18next";
import KioskHeader from "../../components/KioskHeader";

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
        sessionStorage.setItem("customerCode", value);
        setTimeout(() => {
          router.push("/categories");
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
  }, [isProcessing, isDev]);

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col">
        {/* Header */}
        <KioskHeader onBack={handleBack} showCart={false} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Top Text */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-800 text-center mb-4">
              {t("scanMemberCard")}
            </h2>
            <p className="text-xl text-gray-600 text-center">
              {t("useScannerOrEnter")}
            </p>
          </div>

          {/* Large QR Code Icon */}
          <div className="mb-12">
            <div className="w-48 h-48 bg-white rounded-2xl shadow-xl flex items-center justify-center border-4 border-gray-200">
              <svg
                className="w-32 h-32 text-gray-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                {/* QR Code Icon */}
                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zM3 15h6v6H3v-6zm2 2v2h2v-2H5zM15 3h6v6h-6V3zm2 2v2h2V5h-2z" />
                <path d="M13 13h2v2h-2v-2zM15 15h2v2h-2v-2zM17 13h2v2h-2v-2zM19 15h2v2h-2v-2z" />
                <path d="M13 17h2v2h-2v-2zM17 17h2v2h-2v-2zM15 19h2v2h-2v-2zM19 19h2v2h-2v-2z" />
                <path d="M11 11h2v2h-2v-2zM11 15h2v2h-2v-2zM13 11h2v2h-2v-2z" />
              </svg>
            </div>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="mb-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-xl text-green-600 font-semibold">
                {t("processing")}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-8 w-full max-w-md">
              <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-red-700 text-center font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Scanner status or Dev Manual Entry */}
          {!isProcessing && !isDev && (
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl p-8 border-4 border-dashed border-gray-300 shadow-inner">
                <p className="text-center text-xl text-gray-700 font-semibold mb-2">
                  {t("readyToScan")}
                </p>
                <p className="text-center text-gray-500 mb-4">
                  {t("presentCode")}
                </p>
                {scannedCode && !isProcessing && (
                  <div className="text-center">
                    <p className="text-sm text-gray-400">
                      {t("reading")} {scannedCode}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isProcessing && isDev && (
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl p-8 border-4 border-blue-300 shadow-inner">
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
        <div className="bg-white border-t p-4 text-center">
          <p className="text-gray-600">{t("havingTrouble")}</p>
        </div>
      </div>
    </div>
  );
}
