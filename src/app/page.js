"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { VisitService } from "../lib/visitService";
import { CustomerService } from "../lib/customerService";
import { useTranslation } from "react-i18next";
import i18n, { supportedLanguages } from "../i18n";

export default function Home() {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(
    i18n.language || "en"
  );
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [visitRecorded, setVisitRecorded] = useState(false);

  // Barcode scanning state (hidden from UI)
  const bufferRef = useRef("");
  const lastKeyTimeRef = useRef(Date.now());

  const router = useRouter();

  // Record visit when page loads (only once per session)
  useEffect(() => {
    const recordPageVisit = async () => {
      if (!visitRecorded) {
        const success = await VisitService.recordVisit(
          Math.random().toString(36).substr(2, 9)
        );
        if (success) {
          setVisitRecorded(true);
          console.log("Page visit recorded successfully");
        }
      }
    };

    recordPageVisit();
  }, [visitRecorded]); // Auto redirect to idle screen after 30 seconds of inactivity
  useEffect(() => {
    const checkInactivity = () => {
      if (Date.now() - lastInteraction > 30000) {
        // 30 seconds
        router.push("/idle");
      }
    };

    const interval = setInterval(checkInactivity, 1000);

    const handleInteraction = () => {
      setLastInteraction(Date.now());
    };

    // Track user interactions
    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);
    document.addEventListener("mousemove", handleInteraction);
    document.addEventListener("keydown", handleInteraction);

    return () => {
      clearInterval(interval);
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
      document.removeEventListener("mousemove", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, [lastInteraction, router]);

  // Barcode scanner processing function (hidden from UI) - Works like scanner page
  const processBarcodeScn = async (value) => {
    console.log("🔍 Homepage: Barcode scan detected:", value);

    // Same validation as scanner page
    if (!(value && value.startsWith("CK-") && value.length >= 7)) {
      console.log("❌ Homepage: Invalid barcode format:", value);
      return;
    }

    console.log(
      "✅ Homepage: Valid barcode format, checking customer in database..."
    );

    try {
      // Same database check as scanner page
      const customer = await CustomerService.getCustomerByMemberId(value);
      if (customer) {
        console.log("🎉 Homepage: Customer found in database:", {
          name: customer.name,
          id: customer.customerId,
          points: customer.totalPoints || 0,
        });

        // Same session storage as scanner page
        sessionStorage.setItem("customerCode", value);
        console.log("� Homepage: Customer code saved to session storage");

        // Same navigation delay as scanner page
        setTimeout(() => {
          console.log("🚀 Homepage: Navigating to categories page...");
          router.push("/categories");
        }, 600);
      } else {
        console.log(
          "❌ Homepage: Customer not found in database for barcode:",
          value
        );
      }
    } catch (err) {
      console.error("💥 Homepage: Error validating customer in database:", err);
    }
  };

  // Global barcode scanner listener (hidden functionality) - Same as scanner page
  useEffect(() => {
    const handleBarcodeKey = (e) => {
      const now = Date.now();

      // If long pause, reset buffer (same as scanner page)
      if (now - lastKeyTimeRef.current > 200) {
        if (bufferRef.current) {
          console.log(
            "🔄 Homepage: Buffer reset due to timeout, was:",
            bufferRef.current
          );
        }
        bufferRef.current = "";
      }
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        const value = bufferRef.current;
        console.log("⏎ Homepage: Enter pressed, processing buffer:", value);
        bufferRef.current = "";
        if (value.trim()) {
          processBarcodeScn(value.trim());
        }
        return;
      }

      // Ignore control keys, only capture single characters (same as scanner page)
      if (e.key.length === 1) {
        bufferRef.current += e.key.toUpperCase();
        console.log("📝 Homepage: Buffer updated:", bufferRef.current);

        // Auto-process if pattern matches expected length (same logic as scanner page)
        if (
          bufferRef.current.startsWith("CK-") &&
          bufferRef.current.length >= 7
        ) {
          console.log(
            "🔄 Homepage: Auto-processing buffer (length match):",
            bufferRef.current
          );
          clearTimeout(processTimer);
          processTimer = setTimeout(() => {
            processBarcodeScn(bufferRef.current);
            bufferRef.current = "";
          }, 80);
        }
      }
    };

    let processTimer;
    console.log(
      "👂 Homepage: Barcode scanner listener activated (same as scanner page)"
    );
    window.addEventListener("keydown", handleBarcodeKey);

    return () => {
      console.log("🔇 Homepage: Barcode scanner listener deactivated");
      window.removeEventListener("keydown", handleBarcodeKey);
      clearTimeout(processTimer);
    };
  }, [router]);

  const handleOrderNow = async () => {
    // Record order start
    await VisitService.recordOrderStart(
      Math.random().toString(36).substr(2, 9)
    );
    console.log("Order start recorded");

    // Navigate to scanner
    router.push("/scanner");
  };

  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown(!showLanguageDropdown);
  };

  const selectLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setSelectedLanguage(lng);
    setShowLanguageDropdown(false);
    // Persist language selection to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("i18nextLng", lng);
    }
  };

  const getLanguageIcon = (lng) => {
    const map = {
      en: "🇺🇸",
      th: "🇹🇭",
      es: "🇪🇸",
      fr: "🇫🇷",
      de: "🇩🇪",
      it: "🇮🇹",
      ja: "🇯🇵",
      zh: "🇨🇳",
      ru: "🇷🇺",
      pt: "🇵🇹",
      hi: "🇮🇳",
      ko: "🇰🇷",
      nl: "🇳🇱",
      tr: "🇹🇷",
    };
    return map[lng] || "🌐";
  };

  return (
    <div className="kiosk-container h-screen bg-white portrait:max-w-md mx-auto">
      <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
        {/* Video Section fills remaining space above fixed action bar */}
        <div className="flex-1 relative bg-white overflow-hidden">
          <video
            className="w-full h-full object-fill"
            autoPlay
            loop
            muted
            playsInline
            onClick={handleOrderNow}
          >
            <source
              src="https://firebasestorage.googleapis.com/v0/b/candy-kush.firebasestorage.app/o/video%2Fidle.MOV?alt=media&token=cd8923fa-fb9c-4793-aa81-ccac28a5ce27"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Bottom Actions - bigger buttons with more space */}
        <div className="bg-white px-6 pb-8 pt-6 shrink-0">
          <div className="flex items-center space-x-6">
            {/* Order Now Button - Made bigger */}
            <button
              onClick={handleOrderNow}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-6 px-12 rounded-xl text-2xl transition-colors duration-200 shadow-lg"
            >
              {t("orderNow")}
            </button>

            {/* Language Icon with Dropdown - Made bigger */}
            <div className="relative">
              <button
                onClick={toggleLanguageDropdown}
                className="flex items-center justify-center w-20 h-20 bg-gray-100 hover:bg-gray-200 rounded-xl border border-gray-300 transition-colors duration-200"
              >
                <span className="text-4xl">
                  {getLanguageIcon(selectedLanguage)}
                </span>
              </button>

              {/* Dropdown - Made bigger icons */}
              {showLanguageDropdown && (
                <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-300 rounded-lg shadow-lg py-2 min-w-[80px] z-50 max-h-80 overflow-y-auto">
                  {supportedLanguages.map((lng) => (
                    <button
                      key={lng}
                      onClick={() => selectLanguage(lng)}
                      className={`w-full flex items-center justify-center px-4 py-4 hover:bg-gray-50 ${
                        selectedLanguage === lng ? "bg-green-50" : ""
                      }`}
                    >
                      <span className="text-3xl" title={lng}>
                        {getLanguageIcon(lng)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
