"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import i18n from "../../i18n";

export default function IdleScreen() {
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const router = useRouter();

  // Handle interaction to start kiosk
  const handleInteraction = () => {
    // Reset language to English when going back to homepage
    console.log(
      "🔄 Idle: Resetting language to English for new customer session"
    );
    i18n.changeLanguage("en");

    // Clear language preference from localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("i18nextLng", "en");
    }

    router.push("/");
  };

  // Touch/click anywhere to start
  useEffect(() => {
    const handleTouch = () => {
      setLastInteraction(Date.now());
    };

    document.addEventListener("click", handleTouch);
    document.addEventListener("touchstart", handleTouch);
    document.addEventListener("keydown", handleTouch);

    return () => {
      document.removeEventListener("click", handleTouch);
      document.removeEventListener("touchstart", handleTouch);
      document.removeEventListener("keydown", handleTouch);
    };
  }, []);

  return (
    <div className="kiosk-container min-h-screen bg-black portrait:max-w-md mx-auto">
      <div
        className="min-h-screen relative overflow-hidden cursor-pointer"
        onClick={handleInteraction}
      >
        {/* Full Screen Video */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source
            src="https://firebasestorage.googleapis.com/v0/b/candy-kush.firebasestorage.app/o/video%2Fidle.MOV?alt=media&token=cd8923fa-fb9c-4793-aa81-ccac28a5ce27"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
