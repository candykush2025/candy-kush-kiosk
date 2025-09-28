"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CustomerService } from "../../lib/customerService";
import { VisitService } from "../../lib/visitService";

export default function QRScanner() {
  const [scannedCode, setScannedCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [visitRecorded, setVisitRecorded] = useState(false);
  // Internal buffer for keystroke-based scanner capture
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(Date.now());
  const router = useRouter();

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
        setError("Customer not found. Please check your member ID.");
        setIsProcessing(false);
        setScannedCode("");
        bufferRef.current = "";
      }
    } catch (err) {
      console.error("Error validating customer:", err);
      setError("Error validating customer. Please try again.");
      setIsProcessing(false);
      setScannedCode("");
      bufferRef.current = "";
    }
  };

  // Global key listener to capture hardware scanner without triggering virtual keyboard
  useEffect(() => {
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
  }, [isProcessing]);

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col">
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
          <h1 className="text-2xl font-bold text-gray-800">Member Access</h1>
          <div className="w-16"></div> {/* Spacer */}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Top Text */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-800 text-center mb-4">
              Scan Member Card
            </h2>
            <p className="text-xl text-gray-600 text-center">
              Use your QR code scanner or enter your member ID
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
                Processing Member Card...
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

          {/* Scanner status (no focused input -> prevents on-screen keyboard) */}
          {!isProcessing && (
            <div className="w-full max-w-md">
              <div className="bg-white rounded-2xl p-8 border-4 border-dashed border-gray-300 shadow-inner">
                <p className="text-center text-xl text-gray-700 font-semibold mb-2">
                  Ready to Scan
                </p>
                <p className="text-center text-gray-500 mb-4">
                  Present member QR / barcode to the scanner
                </p>
                {scannedCode && !isProcessing && (
                  <div className="text-center">
                    <p className="text-sm text-gray-400">
                      Reading... {scannedCode}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-white border-t p-4 text-center">
          <p className="text-gray-600">
            Having trouble? Please ask our staff for assistance
          </p>
        </div>
      </div>
    </div>
  );
}
