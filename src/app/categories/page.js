"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getCustomer, getTierColor } from "../../lib/customerData";

const categories = [
  {
    id: "pre-rolled",
    name: "Pre-Rolled",
    description: "Ready-to-smoke cannabis products",
    icon: "🌿",
    bgColor: "bg-green-100",
    borderColor: "border-green-500",
    hoverColor: "hover:bg-green-200",
  },
  {
    id: "edible-gummies",
    name: "Edible Gummies",
    description: "Cannabis-infused gummy products",
    icon: "🍬",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-500",
    hoverColor: "hover:bg-purple-200",
  },
  {
    id: "strains",
    name: "Strains",
    description: "Various cannabis strain flowers",
    icon: "🌱",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-500",
    hoverColor: "hover:bg-blue-200",
  },
];

export default function Categories() {
  const [customer, setCustomer] = useState(null);
  const [cart, setCart] = useState([]);
  const router = useRouter();

  useEffect(() => {
    // Get customer info from session storage
    const customerCode = sessionStorage.getItem("customerCode");
    if (customerCode) {
      const customerData = getCustomer(customerCode);
      setCustomer(customerData);
    } else {
      // No customer data, redirect to scanner
      router.push("/scanner");
    }

    // Load cart from session storage
    const savedCart = sessionStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [router]);

  const handleCategorySelect = (categoryId) => {
    if (categoryId === "pre-rolled") {
      router.push("/products/pre-rolled");
    } else {
      // For now, only pre-rolled is implemented
      alert(`${categoryId} coming soon!`);
    }
  };

  const handleBack = () => {
    // Clear customer session and go back to scanner
    sessionStorage.removeItem("customerCode");
    router.push("/scanner");
  };

  const handleCheckout = () => {
    if (cart.length > 0) {
      // Save cart to session storage
      sessionStorage.setItem("cart", JSON.stringify(cart));
      router.push("/checkout");
    }
  };

  const getCartTotalQuantity = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">
            Loading customer information...
          </p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-800">
            Product Categories
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

        {/* Customer Info Section */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 m-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                Welcome, {customer.name}!
              </h2>
              <p className="text-green-100 mb-2">Member ID: {customer.id}</p>
              <div className="flex items-center space-x-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getTierColor(
                    customer.tier
                  )}`}
                >
                  {customer.tier} Member
                </span>
                <span className="text-green-100">
                  Since {customer.memberSince}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-green-100 text-sm">Points Balance</p>
                <p className="text-3xl font-bold">
                  {customer.points.toLocaleString()}
                </p>
                <p className="text-green-100 text-sm">pts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="flex-1 p-6">
          <div className="grid gap-6 max-w-2xl mx-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`${category.bgColor} ${category.borderColor} ${category.hoverColor} 
                border-2 rounded-lg p-8 transition-all duration-200 transform hover:scale-105 
                shadow-lg hover:shadow-xl text-left`}
              >
                <div className="flex items-center space-x-6">
                  {category.id === "pre-rolled" ? (
                    // 3-stacked Pre-Roll images - 1:1 square, transparent, no border
                    <div className="relative w-24 h-24 overflow-hidden">
                      <Image
                        src="/Product/SIMPLE IND.png"
                        alt="Indica"
                        width={35}
                        height={35}
                        className="absolute top-2 left-8 transform origin-bottom z-10"
                      />
                      <Image
                        src="/Product/SIMPLE HYB.png"
                        alt="Hybrid"
                        width={35}
                        height={35}
                        className="absolute top-2 left-8 transform origin-bottom rotate-[20deg]"
                      />
                      <Image
                        src="/Product/SIMPLE SAT.png"
                        alt="Sativa"
                        width={35}
                        height={35}
                        className="absolute top-2 left-8 transform origin-bottom -rotate-[20deg]"
                      />
                    </div>
                  ) : (
                    // Regular icon for other categories
                    <div className="text-6xl">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                        <svg
                          className="w-8 h-8 text-gray-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {category.id === "edible-gummies" && (
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          )}
                          {category.id === "strains" && (
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.82.62-3.49 1.64-4.83L9.5 12 8 16l4-1 4 1-1.5-4 3.86-4.83C19.38 8.51 20 10.18 20 12c0 4.41-3.59 8-8 8z" />
                          )}
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {category.name}
                    </h2>
                    <p className="text-gray-600 text-lg">
                      {category.description}
                    </p>
                  </div>
                  <div className="text-gray-400">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
