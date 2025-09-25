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
  const inputRef = useRef(null);
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

  // Keep input focused at all times
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Focus initially
    focusInput();

    // Re-focus if focus is lost
    const interval = setInterval(focusInput, 100);

    // Focus on any click
    document.addEventListener("click", focusInput);
    document.addEventListener("touchstart", focusInput);

    return () => {
      clearInterval(interval);
      document.removeEventListener("click", focusInput);
      document.removeEventListener("touchstart", focusInput);
    };
  }, []);

  // Handle barcode scan input
  const handleInputChange = async (e) => {
    const value = e.target.value;
    setScannedCode(value);
    setError("");

    // Process when we have a valid customer code (CK-XXXX format)
    if (value.length >= 7 && value.startsWith("CK-")) {
      setIsProcessing(true);

      try {
        // Validate customer exists in Firebase
        const customer = await CustomerService.getCustomerByMemberId(value);

        if (customer) {
          // Store customer info and redirect to categories
          sessionStorage.setItem("customerCode", value);

          // Small delay for UX
          setTimeout(() => {
            router.push("/categories");
          }, 1000);
        } else {
          setError("Customer not found. Please check your member ID.");
          setIsProcessing(false);
          setScannedCode("");
        }
      } catch (error) {
        console.error("Error validating customer:", error);
        setError("Error validating customer. Please try again.");
        setIsProcessing(false);
        setScannedCode("");
      }
    }
  };

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

          {/* QR Scanner Input Section */}
          {!isProcessing && (
            <div className="w-full max-w-md">
              {/* Input Field */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={scannedCode}
                  onChange={handleInputChange}
                  placeholder="CK-0001"
                  className="w-full px-6 py-4 text-2xl text-center font-mono bg-white border-4 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none focus:ring-4 focus:ring-green-200 transition-all duration-200"
                  autoComplete="off"
                  autoFocus
                />

                {/* Input Label */}
                <div className="mt-4 text-center">
                  <p className="text-lg text-gray-600">
                    Enter Member ID (e.g., CK-0001)
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    QR scanner input will appear here automatically
                  </p>
                </div>
              </div>

              {/* Example Format */}
              <div className="mt-8 bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Member ID Format:
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                    CK-0001
                  </span>
                  <span className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                    CK-0042
                  </span>
                  <span className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                    CK-0199
                  </span>
                </div>
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
