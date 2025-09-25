"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { VisitService } from "../lib/visitService";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

// Complete list of all available product images
const allProducts = [
  { name: "Indoor Hybrid King", image: "/Product/indoor hybrid king.png" },
  { name: "Indoor Hybrid Normal", image: "/Product/indoor hybrid normal.png" },
  { name: "Indoor Hybrid Small", image: "/Product/indoor hybrid small.png" },
  { name: "Indoor Indica King", image: "/Product/indoor indica king.png" },
  { name: "Indoor Indica Normal", image: "/Product/indoor indica normal.png" },
  { name: "Indoor Indica Small", image: "/Product/indoor indica small.png" },
  { name: "Indoor Sativa King", image: "/Product/indoor sativa king.png" },
  { name: "Indoor Sativa Normal", image: "/Product/indoor sativa normal.png" },
  { name: "Indoor Sativa Small", image: "/Product/indoor sativa small.png" },
  { name: "Outdoor Hybrid King", image: "/Product/outdoor hybrid king.png" },
  {
    name: "Outdoor Hybrid Normal",
    image: "/Product/outdoor hybrid normal.png",
  },
  { name: "Outdoor Hybrid Small", image: "/Product/outdoor hybrid small.png" },
  { name: "Outdoor Indica King", image: "/Product/outdoor indica king.png" },
  {
    name: "Outdoor Indica Normal",
    image: "/Product/outdoor indica normal.png",
  },
  { name: "Outdoor Indica Small", image: "/Product/outdoor indica small.png" },
  { name: "Outdoor Sativa King", image: "/Product/outdoor sativa king.png" },
  {
    name: "Outdoor Sativa Normal",
    image: "/Product/outdoor sativa normal.png",
  },
  { name: "Outdoor Sativa Small", image: "/Product/outdoor sativa small.png" },
  { name: "Simple Hybrid", image: "/Product/SIMPLE HYB.png" },
  { name: "Simple Indica", image: "/Product/SIMPLE IND.png" },
  { name: "Simple Sativa", image: "/Product/SIMPLE SAT.png" },
  { name: "Top Hybrid King", image: "/Product/top HYBRID king.png" },
  { name: "Top Hybrid Normal", image: "/Product/top HYBRID normal.png" },
  { name: "Top Indica King", image: "/Product/top indica king.png" },
  { name: "Top Indica Normal", image: "/Product/top indica normal.png" },
  { name: "Top Sativa King", image: "/Product/top sativa king.png" },
  { name: "Top Sativa Normal", image: "/Product/top sativa normal.png" },
];

// Function to shuffle array randomly
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function Home() {
  const [products, setProducts] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [visitRecorded, setVisitRecorded] = useState(false);
  const router = useRouter();

  // Initialize with shuffled products on component mount
  useEffect(() => {
    const shuffledProducts = shuffleArray(allProducts);
    setProducts(shuffledProducts);
  }, []);

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
        {/* Swiper Carousel - 80% of screen */}
        <div
          className="flex-1 relative bg-white rounded-lg m-4 shadow-lg overflow-hidden"
          style={{ height: "80vh" }}
        >
          {products.length > 0 && (
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={0}
              slidesPerView={1}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
                bulletClass: "swiper-pagination-bullet",
                bulletActiveClass: "swiper-pagination-bullet-active",
              }}
              className="w-full h-full"
              style={{
                "--swiper-pagination-color": "#22c55e",
                "--swiper-pagination-bullet-inactive-color": "#d1d5db",
                "--swiper-pagination-bullet-size": "12px",
                "--swiper-pagination-bullet-horizontal-gap": "6px",
              }}
            >
              {products.map((product, index) => (
                <SwiperSlide key={`${product.name}-${index}`}>
                  <div className="w-full h-full flex items-center justify-center bg-white p-12">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="object-contain"
                      style={{
                        width: "auto",
                        height: "auto",
                        maxWidth: "70%",
                        maxHeight: "70%",
                      }}
                      onLoad={() => console.log(`✅ Loaded: ${product.image}`)}
                      onError={(e) => {
                        console.error(`❌ Failed to load: ${product.image}`);
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML = `
                          <div class="flex items-center justify-center h-full">
                            <div class="text-center p-8">
                              <div class="w-24 h-24 mx-auto mb-4 bg-gray-300 rounded-lg flex items-center justify-center">
                                <svg class="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                              </div>
                              <p class="text-gray-600 font-semibold text-xl mb-2">${product.name}</p>
                              <p class="text-gray-500 text-sm">Image not found</p>
                            </div>
                          </div>
                        `;
                      }}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        {/* Bottom Actions - 20% of screen */}
        <div className="bg-white mx-4 mb-4 rounded-lg shadow-lg p-6">
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
