"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const advertisements = [
  {
    id: 1,
    title: "Premium Indoor Cannabis",
    subtitle: "Now Available",
    description:
      "Experience our finest indoor-grown cannabis products with exceptional quality and potency.",
    image: "/Product/indoor hybrid king.png",
    bgColor: "bg-gradient-to-br from-green-600 to-emerald-800",
  },
  {
    id: 2,
    title: "Top Quality Pre-Rolls",
    subtitle: "Hand-Crafted Excellence",
    description:
      "Premium pre-rolled joints made with our finest strains for the perfect smoking experience.",
    image: "/Product/top HYBRID king.png",
    bgColor: "bg-gradient-to-br from-purple-600 to-indigo-800",
  },
  {
    id: 3,
    title: "Member Rewards Program",
    subtitle: "Earn Points Every Purchase",
    description:
      "Join our loyalty program and earn points on every purchase. Redeem for exclusive products and discounts.",
    image: "/Product/outdoor sativa king.png",
    bgColor: "bg-gradient-to-br from-blue-600 to-cyan-800",
  },
  {
    id: 4,
    title: "New Outdoor Collection",
    subtitle: "Sun-Grown Quality",
    description:
      "Discover our outdoor-grown cannabis collection featuring natural, sustainable growing methods.",
    image: "/Product/outdoor indica king.png",
    bgColor: "bg-gradient-to-br from-orange-600 to-red-800",
  },
];

export default function IdleScreen() {
  const [currentAd, setCurrentAd] = useState(0);
  const [timeUntilNext, setTimeUntilNext] = useState(8);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const router = useRouter();

  // Auto advance advertisements
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % advertisements.length);
      setTimeUntilNext(8);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilNext((prev) => {
        if (prev <= 1) return 8;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const currentAdvertisement = advertisements[currentAd];

  return (
    <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
      <div
        className={`min-h-screen ${currentAdvertisement.bgColor} text-white relative overflow-hidden cursor-pointer`}
        onClick={handleInteraction}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <div className="text-center pt-8 pb-4">
            <h1 className="text-4xl font-bold mb-2">Candy Kush</h1>
            <p className="text-xl opacity-90">Premium Cannabis Dispensary</p>
          </div>

          {/* Advertisement Content */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-4xl mx-auto text-center">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Product Image */}
                <div className="order-2 md:order-1">
                  <div className="relative w-80 h-80 mx-auto bg-white bg-opacity-20 rounded-3xl p-8 backdrop-blur-sm">
                    <Image
                      src={currentAdvertisement.image}
                      alt={currentAdvertisement.title}
                      fill
                      className="object-contain p-4"
                      priority
                    />
                  </div>
                </div>

                {/* Advertisement Text */}
                <div className="order-1 md:order-2 text-left md:text-left">
                  <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8">
                    <span className="text-sm font-semibold text-green-200 uppercase tracking-wider">
                      {currentAdvertisement.subtitle}
                    </span>
                    <h2 className="text-5xl font-bold mb-6 mt-2">
                      {currentAdvertisement.title}
                    </h2>
                    <p className="text-xl opacity-90 leading-relaxed mb-8">
                      {currentAdvertisement.description}
                    </p>

                    {/* Call to Action */}
                    <div className="bg-white bg-opacity-20 rounded-xl p-6 text-center">
                      <p className="text-2xl font-bold mb-2">Ready to Order?</p>
                      <p className="text-lg opacity-90 mb-4">
                        Touch anywhere to scan your member card
                      </p>
                      <div className="flex items-center justify-center space-x-4">
                        <svg
                          className="w-8 h-8"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span className="text-xl font-semibold">
                          Tap to Start
                        </span>
                        <svg
                          className="w-8 h-8"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-black bg-opacity-30 p-6">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center space-x-8">
                <div className="text-center">
                  <p className="text-sm opacity-70">Store Hours</p>
                  <p className="font-semibold">9 AM - 10 PM Daily</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-70">Location</p>
                  <p className="font-semibold">Downtown Cannabis District</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-70">Contact</p>
                  <p className="font-semibold">(555) 420-KUSH</p>
                </div>
              </div>

              {/* Ad Progress */}
              <div className="flex items-center space-x-4">
                <div className="flex space-x-2">
                  {advertisements.map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentAd
                          ? "bg-white"
                          : "bg-white bg-opacity-30"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm opacity-70">
                  Next in {timeUntilNext}s
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
