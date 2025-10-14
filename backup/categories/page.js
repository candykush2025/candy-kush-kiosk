"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CustomerService,
  getTierColor,
  calculateTier,
} from "../../lib/customerService";
import { CategoryService } from "../../lib/productService";
import CustomerSection from "../../components/CustomerSection";
import KioskHeader from "../../components/KioskHeader";
import { VisitService } from "../../lib/visitService";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";

export default function Categories() {
  const [customer, setCustomer] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [visitRecorded, setVisitRecorded] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  // Ensure language is loaded from localStorage on page mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem("i18nextLng");
    if (storedLanguage && storedLanguage !== i18n.language) {
      i18n.changeLanguage(storedLanguage);
      console.log(`Categories page: Language changed to ${storedLanguage}`);
    }
  }, []);

  // Record visit when categories page loads (only once per session)
  useEffect(() => {
    const recordPageVisit = async () => {
      if (!visitRecorded) {
        const success = await VisitService.recordVisit(
          Math.random().toString(36).substr(2, 9)
        );
        if (success) {
          setVisitRecorded(true);
          console.log("Categories page visit recorded successfully");
        }
      }
    };

    recordPageVisit();
  }, [visitRecorded]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get customer info from session storage
        const customerCode = sessionStorage.getItem("customerCode");
        if (customerCode) {
          const customerData = await CustomerService.getCustomerByMemberId(
            customerCode
          );
          if (customerData) {
            // Calculate tier if not present
            if (!customerData.tier) {
              customerData.tier = calculateTier(customerData.points);
            }
            // Calculate total points from transactions array
            customerData.totalPoints = CustomerService.calculateTotalPoints(
              customerData.points
            );
            setCustomer(customerData);
          }
        } else {
          // No customer data, redirect to scanner
          router.push("/scanner");
          return;
        }

        // Load categories from Firebase
        const categoriesData = await CategoryService.getAllCategories();

        // Transform categories data for display
        const transformedCategories = categoriesData.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description, // Include description
          image: category.image, // Use uploaded image
          backgroundImage: category.backgroundImage, // Include background image
          backgroundFit: category.backgroundFit || "contain", // Include background fit option
          textColor: category.textColor || "#000000",
          bgColor: getCategoryBgColor(category.name),
          borderColor: getCategoryBorderColor(category.name),
          hoverColor: getCategoryHoverColor(category.name),
        }));

        setCategories(transformedCategories);

        // Load cart from session storage
        const savedCart = sessionStorage.getItem("cart");
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  // Helper functions for category styling - all same color
  const getCategoryIcon = (categoryName) => {
    return "🌿"; // same icon for all
  };

  const getCategoryBgColor = (categoryName) => {
    return "bg-white"; // same background for all
  };

  const getCategoryBorderColor = (categoryName) => {
    return "border-gray-300"; // same border for all
  };

  const getCategoryHoverColor = (categoryName) => {
    return "hover:bg-gray-50"; // same hover for all
  };

  const handleCategorySelect = (categoryId) => {
    // Set selected category for visual feedback
    setSelectedCategory(categoryId);

    // Navigate to subcategories page after a brief delay to show selection
    setTimeout(() => {
      router.push(`/subcategories/${categoryId}`);
    }, 150);
  };

  // Function to translate category names
  const translateCategoryName = (categoryName) => {
    if (!categoryName) return "";

    // Convert category name to translation key
    const normalizedName = categoryName
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/-/g, "");

    // Map common category names to translation keys
    const categoryKeyMap = {
      indoor: "indoor",
      outdoor: "outdoor",
      prerolled: "preRolled",
      "pre-rolled": "preRolled",
      flower: "flower",
      flowers: "flower",
      edibles: "edibles",
      edible: "edibles",
      vape: "vape",
      vapes: "vape",
      concentrates: "concentrates",
      concentrate: "concentrates",
      accessories: "accessories",
      accessory: "accessories",
    };

    // Try to find a matching translation key
    const translationKey = categoryKeyMap[normalizedName];

    // If we have a translation, use it; otherwise, return original name
    return translationKey ? t(translationKey) : categoryName;
  };

  const handleBack = () => {
    // Clear customer session and go back to scanner
    sessionStorage.removeItem("customerCode");
    // Reset language to English default
    localStorage.removeItem("i18nextLng");
    i18n.changeLanguage("en");
    router.push("/scanner");
  };

  // Skeleton while loading (waits for data + images)
  if (loading) {
    return (
      <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
        <div className="min-h-screen bg-gray-50 flex flex-col animate-pulse">
          {/* Header skeleton */}
          <div className="p-4 flex items-center justify-between">
            {/* Back button skeleton */}
            <div className="bg-gray-200 px-5 py-5 rounded-lg">
              <div className="w-12 h-12 bg-gray-300 rounded" />
            </div>
            {/* Logo skeleton */}
            <div className="relative">
              <div className="w-32 h-32 bg-gray-200 rounded-lg" />
            </div>
            {/* Cart button skeleton */}
            <div className="bg-gray-200 px-5 py-5 rounded-lg">
              <div className="w-12 h-12 bg-gray-300 rounded" />
            </div>
          </div>
          {/* Customer card skeleton */}
          <div className="bg-white p-6 m-4 rounded-lg shadow-sm space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-100 rounded" />
          </div>
          {/* Categories grid skeleton */}
          <div className="flex-1 p-6">
            <div className="grid gap-6 max-w-2xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="border-2 border-gray-200 rounded-lg p-8 shadow-sm bg-white relative overflow-hidden"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <div className="h-6 w-2/3 bg-gray-200 rounded" />
                      <div className="h-4 w-5/6 bg-gray-200 rounded" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded" />
                    </div>
                    <div className="w-8 h-8 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
      <div
        className="min-h-screen bg-gray-50 flex flex-col"
        style={{
          backgroundImage: "url(/background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Header */}
        <KioskHeader onBack={handleBack} cart={cart} />

        {/* Customer Info Section */}
        <CustomerSection customer={customer} />

        {/* Categories Grid */}
        <div className="flex-1 p-6">
          <div className="grid gap-6 max-w-2xl mx-auto">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`${
                    isSelected
                      ? "bg-green-100 border-green-500 hover:bg-green-200"
                      : `${category.bgColor} ${category.borderColor} ${category.hoverColor}`
                  } 
                  border-2 rounded-lg p-8 transition-all duration-200 transform hover:scale-105 
                  shadow-lg hover:shadow-xl text-left relative overflow-hidden`}
                  style={{
                    backgroundImage: category.backgroundImage
                      ? `url(${category.backgroundImage})`
                      : "none",
                    backgroundSize: category.backgroundImage
                      ? category.backgroundFit
                      : "auto",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {/* Overlay for better text readability when background image is present */}
                  {category.backgroundImage && (
                    <div className="absolute inset-0 bg-white/30 rounded-lg"></div>
                  )}
                  <div className="flex items-center space-x-2 relative z-10">
                    {category.image ? (
                      // Use uploaded category image
                      <div className="w-24 h-24 relative">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-contain rounded-lg"
                        />
                      </div>
                    ) : (
                      // Empty space to maintain layout consistency
                      <div className="w-24 h-24"></div>
                    )}
                    <div className="flex-1 text-left">
                      <h2
                        className="text-2xl font-bold mb-1"
                        style={{ color: category.textColor || "#000000" }}
                      >
                        {translateCategoryName(category.name)}
                      </h2>
                      {category.description && (
                        <p
                          className="text-sm leading-relaxed"
                          style={{ color: category.textColor || "#000000" }}
                        >
                          {category.description}
                        </p>
                      )}
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
