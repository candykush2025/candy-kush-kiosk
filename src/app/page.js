"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VisitService } from "../lib/visitService";

export default function Home() {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [visitRecorded, setVisitRecorded] = useState(false);
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

  const selectLanguage = (language) => {
    setSelectedLanguage(language);
    setShowLanguageDropdown(false);
  };

  const getLanguageIcon = (lang) => {
    switch (lang) {
      case "English":
        return "🇺🇸";
      case "Spanish":
        return "🇪🇸";
      case "French":
        return "🇫🇷";
      default:
        return "🌐";
    }
  };

  const languages = ["English", "Spanish", "French"];

  return (
    <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Video Player - Full width, no margins */}
        <div className="flex-1 relative bg-white overflow-hidden mb-5">
          <video
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/indoor-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Bottom Actions - Only bottom padding */}
        <div className="bg-white pb-6 px-6">
          <div className="flex items-center space-x-4">
            {/* Order Now Button */}
            <button
              onClick={handleOrderNow}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg"
            >
              Order Now
            </button>

            {/* Language Icon with Dropdown - ICON ONLY */}
            <div className="relative">
              <button
                onClick={toggleLanguageDropdown}
                className="flex items-center justify-center w-16 h-16 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors duration-200"
              >
                <span className="text-3xl">
                  {getLanguageIcon(selectedLanguage)}
                </span>
              </button>

              {/* Dropdown - ICONS ONLY */}
              {showLanguageDropdown && (
                <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-300 rounded-lg shadow-lg py-2 min-w-[60px] z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => selectLanguage(lang)}
                      className={`w-full flex items-center justify-center px-3 py-3 hover:bg-gray-50 ${
                        selectedLanguage === lang ? "bg-green-50" : ""
                      }`}
                    >
                      <span className="text-2xl">{getLanguageIcon(lang)}</span>
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
