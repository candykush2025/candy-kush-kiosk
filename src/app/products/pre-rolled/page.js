"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const strainTypes = [
  {
    id: "sativa",
    name: "Sativa",
    image: "/Product/SIMPLE SAT.png",
    color: "bg-green-100 border-green-500",
  },
  {
    id: "indica",
    name: "Indica",
    image: "/Product/SIMPLE IND.png",
    color: "bg-purple-100 border-purple-500",
  },
  {
    id: "hybrid",
    name: "Hybrid",
    image: "/Product/SIMPLE HYB.png",
    color: "bg-blue-100 border-blue-500",
  },
];

const qualityTypes = [
  {
    id: "outdoor",
    name: "Outdoor",
    description: "Sun-grown",
    prices: { small: 80, normal: 150, king: 250 },
  },
  {
    id: "indoor",
    name: "Indoor",
    description: "Climate-controlled growing",
    prices: { small: 150, normal: 250, king: 450 },
  },
  {
    id: "top-quality",
    name: "Top Quality",
    description: "Premium grade cannabis",
    prices: { normal: 500, king: 800 },
  },
];

const sizeTypes = [
  { id: "small", name: "Small", available: ["outdoor", "indoor"] },
  {
    id: "normal",
    name: "Normal",
    available: ["outdoor", "indoor", "top-quality"],
  },
  { id: "king", name: "King", available: ["outdoor", "indoor", "top-quality"] },
];

export default function PreRolledProducts() {
  const [step, setStep] = useState("strain"); // strain, quality, size
  const [selectedStrain, setSelectedStrain] = useState(null);
  const [selectedQuality, setSelectedQuality] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [currentStrainIndex, setCurrentStrainIndex] = useState(0);
  const [currentQualityIndex, setCurrentQualityIndex] = useState(0);
  const [currentSizeIndex, setCurrentSizeIndex] = useState(0);
  const [cart, setCart] = useState([]);

  // Touch/Swipe state for real slider
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isSliding, setIsSliding] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [slideOffset, setSlideOffset] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // Load cart from session storage on component mount
    const savedCart = sessionStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const handleBack = () => {
    if (step === "size") {
      setStep("quality");
      setSelectedSize(null);
    } else if (step === "quality") {
      setStep("strain");
      setSelectedQuality(null);
    } else {
      router.push("/categories");
    }
  };

  const handleStrainSelect = (strain) => {
    setSelectedStrain(strain);
    setStep("quality");
  };

  const handleQualitySelect = (quality) => {
    setSelectedQuality(quality);
    setCurrentSizeIndex(0); // Reset size index when quality changes
    setStep("size");
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    // Automatically add to cart when size is selected
    if (selectedStrain && selectedQuality) {
      const price = selectedQuality.prices[size.id];
      const product = {
        id: `${selectedStrain.id}-${selectedQuality.id}-${
          size.id
        }-${Date.now()}`,
        strain: selectedStrain.name,
        quality: selectedQuality.name,
        size: size.name,
        price: price,
        image: getProductImage(selectedStrain.id, selectedQuality.id, size.id),
      };
      setCart([...cart, product]);

      // Save updated cart to session storage
      const updatedCart = [...cart, product];
      sessionStorage.setItem("cart", JSON.stringify(updatedCart));

      // Go back to categories instead of resetting to strain selection
      router.push("/categories");
    }
  };

  const getProductImage = (strain, quality, size) => {
    const qualityName =
      quality === "top-quality" ? "top" : quality.toLowerCase();
    const sizeName = size.toLowerCase();

    // Handle special case for top quality hybrid which uses uppercase HYBRID
    let strainName = strain.toLowerCase();
    if (quality === "top-quality" && strain === "hybrid") {
      strainName = "HYBRID";
    }

    return `/Product/${qualityName} ${strainName} ${sizeName}.png`;
  };

  const getCartTotalQuantity = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const navigateStrain = (direction) => {
    if (direction === "left") {
      setCurrentStrainIndex((prev) =>
        prev > 0 ? prev - 1 : strainTypes.length - 1
      );
    } else {
      setCurrentStrainIndex((prev) =>
        prev < strainTypes.length - 1 ? prev + 1 : 0
      );
    }
  };

  const navigateQuality = (direction) => {
    if (direction === "left") {
      setCurrentQualityIndex((prev) =>
        prev > 0 ? prev - 1 : qualityTypes.length - 1
      );
    } else {
      setCurrentQualityIndex((prev) =>
        prev < qualityTypes.length - 1 ? prev + 1 : 0
      );
    }
  };

  const navigateSize = (direction) => {
    const availableSizes = getAvailableSizes();
    if (direction === "left") {
      setCurrentSizeIndex((prev) =>
        prev > 0 ? prev - 1 : availableSizes.length - 1
      );
    } else {
      setCurrentSizeIndex((prev) =>
        prev < availableSizes.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handleCheckout = () => {
    if (cart.length > 0) {
      // Save cart to session storage
      sessionStorage.setItem("cart", JSON.stringify(cart));
      router.push("/checkout");
    }
  };

  const getAvailableSizes = () => {
    if (!selectedQuality) return [];
    return sizeTypes.filter((size) =>
      size.available.includes(selectedQuality.id)
    );
  };

  // Touch event handlers for real slider
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart(touch.clientX);
    setTouchEnd(null);
    setIsDragging(true);
    setDragOffset(0);
    setHasMoved(false);
  };

  const handleTouchMove = (e) => {
    if (!touchStart || !isDragging) return;

    const touch = e.touches[0];
    const currentX = touch.clientX;
    const diff = currentX - touchStart;

    // Mark as moved if ANY movement detected (even 5px)
    if (Math.abs(diff) > 5) {
      setHasMoved(true);
    }

    setTouchEnd(currentX);
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !isDragging) {
      setIsDragging(false);
      setDragOffset(0);
      setHasMoved(false);
      return;
    }

    const distance = touchStart - (touchEnd || touchStart);
    const threshold = 100;

    // If user moved significantly, handle as swipe
    if (Math.abs(distance) > threshold) {
      const isLeftSwipe = distance > 0;

      if (step === "strain") {
        if (isLeftSwipe && currentStrainIndex < strainTypes.length - 1) {
          setCurrentStrainIndex((prev) => prev + 1);
        } else if (!isLeftSwipe && currentStrainIndex > 0) {
          setCurrentStrainIndex((prev) => prev - 1);
        }
      } else if (step === "quality") {
        if (isLeftSwipe && currentQualityIndex < qualityTypes.length - 1) {
          setCurrentQualityIndex((prev) => prev + 1);
        } else if (!isLeftSwipe && currentQualityIndex > 0) {
          setCurrentQualityIndex((prev) => prev - 1);
        }
      } else if (step === "size") {
        const availableSizes = getAvailableSizes();
        if (isLeftSwipe && currentSizeIndex < availableSizes.length - 1) {
          setCurrentSizeIndex((prev) => prev + 1);
        } else if (!isLeftSwipe && currentSizeIndex > 0) {
          setCurrentSizeIndex((prev) => prev - 1);
        }
      }
    }

    // Reset all states with delay to prevent accidental clicks after sliding
    setIsDragging(false);
    setDragOffset(0);

    // Reset hasMoved after a small delay to prevent clicks during slide release
    setTimeout(() => {
      setHasMoved(false);
    }, 100);
  };

  // Mouse events for desktop
  const handleMouseDown = (e) => {
    setTouchStart(e.clientX);
    setTouchEnd(null);
    setIsDragging(true);
    setDragOffset(0);
    setHasMoved(false);
  };

  const handleMouseMove = (e) => {
    if (!touchStart || !isDragging) return;

    const currentX = e.clientX;
    const diff = currentX - touchStart;

    // Mark as moved if ANY movement detected (even 5px)
    if (Math.abs(diff) > 5) {
      setHasMoved(true);
    }

    setTouchEnd(currentX);
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  return (
    <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
      <div className="min-h-screen bg-gray-50 flex flex-col">
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
          <h1 className="text-xl font-bold text-gray-800">
            Pre-Rolled Products
          </h1>
          <button
            onClick={handleCheckout}
            className="relative bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-bold transition-colors flex items-center"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {getCartTotalQuantity()}
              </span>
            )}
          </button>
        </div>

        {/* Progress Steps */}
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-center space-x-8">
            <div
              className={`flex items-center ${
                step === "strain"
                  ? "text-green-600"
                  : selectedStrain
                  ? "text-green-500"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                  step === "strain"
                    ? "bg-green-600 text-white"
                    : selectedStrain
                    ? "bg-green-500 text-white"
                    : "bg-gray-300"
                }`}
              >
                1
              </div>
              <span className="font-semibold">Choose Type</span>
            </div>
            <div
              className={`flex items-center ${
                step === "quality"
                  ? "text-green-600"
                  : selectedQuality
                  ? "text-green-500"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                  step === "quality"
                    ? "bg-green-600 text-white"
                    : selectedQuality
                    ? "bg-green-500 text-white"
                    : "bg-gray-300"
                }`}
              >
                2
              </div>
              <span className="font-semibold">Choose Quality</span>
            </div>
            <div
              className={`flex items-center ${
                step === "size"
                  ? "text-green-600"
                  : selectedSize
                  ? "text-green-500"
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                  step === "size"
                    ? "bg-green-600 text-white"
                    : selectedSize
                    ? "bg-green-500 text-white"
                    : "bg-gray-300"
                }`}
              >
                3
              </div>
              <span className="font-semibold">Choose Size</span>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          {/* Step 1: Choose Strain Type */}
          {step === "strain" && (
            <div className="max-w-4xl mx-auto">
              {/* Minimalistic Navigation */}
              <div className="relative">
                <div className="flex items-center justify-between">
                  {/* Left Arrow */}
                  <button
                    onClick={() => navigateStrain("left")}
                    className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                  >
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {/* Real Horizontal Slider */}
                  <div className="flex-1 mx-8 text-center relative overflow-hidden">
                    <div
                      className="relative w-full h-[1000px] cursor-grab active:cursor-grabbing select-none"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      {/* Slider Track - All Images */}
                      <div
                        className="flex items-center h-full transition-transform duration-300 ease-out"
                        style={{
                          transform: `translateX(${
                            -currentStrainIndex * 600 +
                            (isDragging ? dragOffset : 0)
                          }px)`,
                          width: `${strainTypes.length * 600}px`,
                        }}
                      >
                        {strainTypes.map((strain, index) => (
                          <div
                            key={strain.id}
                            className="flex-shrink-0 w-[600px] h-full flex items-center justify-center"
                            onClick={(e) => {
                              // Only prevent selection if user actually dragged (moved > 10px)
                              if (hasMoved) {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                              }
                              handleStrainSelect(strain);
                            }}
                          >
                            <div
                              className={`transform transition-all duration-300 ${
                                index === currentStrainIndex
                                  ? "scale-100 opacity-100"
                                  : "scale-75 opacity-60"
                              } hover:scale-105 cursor-pointer flex items-center justify-center w-full h-full`}
                            >
                              <Image
                                src={strain.image}
                                alt={strain.name}
                                width={0}
                                height={0}
                                sizes="100vw"
                                className="select-none pointer-events-none w-auto h-auto max-w-[800px] max-h-[900px]"
                                draggable={false}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Drag Indicator */}
                      {isDragging && Math.abs(dragOffset) > 30 && (
                        <div
                          className={`absolute top-4 ${
                            dragOffset > 0 ? "left-4" : "right-4"
                          } z-10`}
                        >
                          <div className="bg-green-500 text-white rounded-full p-3 shadow-xl animate-pulse">
                            <svg
                              className="w-6 h-6"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d={
                                  dragOffset > 0
                                    ? "M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                    : "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                }
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={() => navigateStrain("right")}
                    className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                  >
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Indicators */}
                <div className="flex justify-center mt-8 space-x-3">
                  {strainTypes.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStrainIndex(index)}
                      className={`w-4 h-4 rounded-full transition-colors ${
                        index === currentStrainIndex
                          ? "bg-green-500"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Choose Quality */}
          {step === "quality" && (
            <div className="max-w-4xl mx-auto">
              {/* Minimalistic Navigation */}
              <div className="relative">
                <div className="flex items-center justify-between">
                  {/* Left Arrow */}
                  <button
                    onClick={() => navigateQuality("left")}
                    className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                  >
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  {/* Real Horizontal Slider */}
                  <div className="flex-1 mx-8 text-center relative overflow-hidden">
                    <div
                      className="relative w-full h-[1000px] cursor-grab active:cursor-grabbing select-none"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      {/* Slider Track - All Images */}
                      <div
                        className="flex items-center h-full transition-transform duration-300 ease-out"
                        style={{
                          transform: `translateX(${
                            -currentQualityIndex * 600 +
                            (isDragging ? dragOffset : 0)
                          }px)`,
                          width: `${qualityTypes.length * 600}px`,
                        }}
                      >
                        {qualityTypes.map((quality, index) => (
                          <div
                            key={quality.id}
                            className="flex-shrink-0 w-[600px] h-full flex items-center justify-center"
                            onClick={(e) => {
                              // Only prevent selection if user actually dragged (moved > 10px)
                              if (hasMoved) {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                              }
                              handleQualitySelect(quality);
                            }}
                          >
                            <div
                              className={`transform transition-all duration-300 ${
                                index === currentQualityIndex
                                  ? "scale-100 opacity-100"
                                  : "scale-75 opacity-60"
                              } hover:scale-105 cursor-pointer flex items-center justify-center w-full h-full`}
                            >
                              <Image
                                src={getProductImage(
                                  selectedStrain.id,
                                  quality.id,
                                  "normal"
                                )}
                                alt={`${quality.name} ${selectedStrain.name}`}
                                width={0}
                                height={0}
                                sizes="100vw"
                                className="select-none pointer-events-none w-auto h-auto max-w-[800px] max-h-[900px]"
                                draggable={false}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Drag Indicator */}
                      {isDragging && Math.abs(dragOffset) > 30 && (
                        <div
                          className={`absolute top-4 ${
                            dragOffset > 0 ? "left-4" : "right-4"
                          } z-10`}
                        >
                          <div className="bg-green-500 text-white rounded-full p-3 shadow-xl animate-pulse">
                            <svg
                              className="w-6 h-6"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d={
                                  dragOffset > 0
                                    ? "M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                    : "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                }
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Arrow */}
                  <button
                    onClick={() => navigateQuality("right")}
                    className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                  >
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Indicators */}
                <div className="flex justify-center mt-8 space-x-3">
                  {qualityTypes.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQualityIndex(index)}
                      className={`w-4 h-4 rounded-full transition-colors ${
                        index === currentQualityIndex
                          ? "bg-green-500"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Choose Size */}
          {step === "size" && (
            <div className="max-w-4xl mx-auto">
              {getAvailableSizes().length > 0 && (
                <>
                  {/* Minimalistic Navigation */}
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      {/* Left Arrow */}
                      <button
                        onClick={() => navigateSize("left")}
                        className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                        disabled={getAvailableSizes().length <= 1}
                      >
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>

                      {/* Real Horizontal Slider */}
                      <div className="flex-1 mx-8 text-center relative overflow-hidden">
                        <div
                          className="relative w-full h-[1000px] cursor-grab active:cursor-grabbing select-none"
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          onMouseDown={handleMouseDown}
                          onMouseMove={handleMouseMove}
                          onMouseUp={handleMouseUp}
                          onMouseLeave={handleMouseUp}
                        >
                          {/* Slider Track - All Images */}
                          <div
                            className="flex items-center h-full transition-transform duration-300 ease-out"
                            style={{
                              transform: `translateX(${
                                -currentSizeIndex * 600 +
                                (isDragging ? dragOffset : 0)
                              }px)`,
                              width: `${getAvailableSizes().length * 600}px`,
                            }}
                          >
                            {getAvailableSizes().map((size, index) => (
                              <div
                                key={size.id}
                                className="flex-shrink-0 w-[600px] h-full flex items-center justify-center"
                                onClick={(e) => {
                                  // Only prevent selection if user actually dragged (moved > 10px)
                                  if (hasMoved) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    return;
                                  }
                                  handleSizeSelect(size);
                                }}
                              >
                                <div
                                  className={`transform transition-all duration-300 ${
                                    index === currentSizeIndex
                                      ? "scale-100 opacity-100"
                                      : "scale-75 opacity-60"
                                  } hover:scale-105 cursor-pointer flex items-center justify-center w-full h-full`}
                                >
                                  <Image
                                    src={getProductImage(
                                      selectedStrain.id,
                                      selectedQuality.id,
                                      size.id
                                    )}
                                    alt={`${selectedStrain.name} ${selectedQuality.name} ${size.name}`}
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    className="select-none pointer-events-none w-auto h-auto max-w-[800px] max-h-[900px]"
                                    draggable={false}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Drag Indicator */}
                          {isDragging && Math.abs(dragOffset) > 30 && (
                            <div
                              className={`absolute top-4 ${
                                dragOffset > 0 ? "left-4" : "right-4"
                              } z-10`}
                            >
                              <div className="bg-green-500 text-white rounded-full p-3 shadow-xl animate-pulse">
                                <svg
                                  className="w-6 h-6"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d={
                                      dragOffset > 0
                                        ? "M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                        : "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    }
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Arrow */}
                      <button
                        onClick={() => navigateSize("right")}
                        className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                        disabled={getAvailableSizes().length <= 1}
                      >
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Indicators */}
                    {getAvailableSizes().length > 1 && (
                      <div className="flex justify-center mt-8 space-x-3">
                        {getAvailableSizes().map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentSizeIndex(index)}
                            className={`w-4 h-4 rounded-full transition-colors ${
                              index === currentSizeIndex
                                ? "bg-green-500"
                                : "bg-gray-300 hover:bg-gray-400"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
