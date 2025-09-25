"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IdleScreen() {
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const router = useRouter();

  // Handle interaction to start kiosk
  const handleInteraction = () => {
    router.push("/scanner");
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
          <source src="/indoor-video.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
