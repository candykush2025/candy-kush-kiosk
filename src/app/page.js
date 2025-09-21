"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const products = [
  { name: "Indoor Hybrid King", image: "/Product/indoor hybrid king.png" },
  { name: "Indoor Indica King", image: "/Product/indoor indica king.png" },
  { name: "Indoor Sativa King", image: "/Product/indoor sativa king.png" },
  { name: "Outdoor Hybrid King", image: "/Product/outdoor hybrid king.png" },
  { name: "Outdoor Indica King", image: "/Product/outdoor indica king.png" },
  { name: "Outdoor Sativa King", image: "/Product/outdoor sativa king.png" },
  { name: "Top Hybrid King", image: "/Product/top HYBRID king.png" },
  { name: "Top Indica King", image: "/Product/top indica king.png" },
  { name: "Top Sativa King", image: "/Product/top sativa king.png" },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % products.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto redirect to idle screen after 30 seconds of inactivity
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

  const handleOrderNow = () => {
    router.push("/scanner");
  };

  const languages = ["English", "Spanish", "French"];

  return (
    <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Image Carousel - 80% of screen */}
        <div
          className="flex-1 relative bg-white rounded-lg m-4 shadow-lg overflow-hidden"
          style={{ height: "80vh" }}
        >
          <div className="relative w-full h-full">
            {products.map((product, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain p-8"
                  priority={index === 0}
                />
              </div>
            ))}
          </div>

          {/* Carousel indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {products.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? "bg-green-500" : "bg-gray-300"
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>

        {/* Bottom Actions - 20% of screen */}
        <div className="bg-white mx-4 mb-4 rounded-lg shadow-lg p-6">
          <div className="flex flex-col space-y-4">
            {/* Language Selector */}
            <div className="flex justify-center">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Order Now Button */}
            <button
              onClick={handleOrderNow}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg"
            >
              Order Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
