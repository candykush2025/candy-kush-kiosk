"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  CustomerService,
  getTierColor,
  calculateTier,
} from "../../../lib/customerService";
import { SubcategoryService } from "../../../lib/productService";
import CustomerSection from "../../../components/CustomerSection";
import KioskHeader from "../../../components/KioskHeader";
import { useTranslation } from "react-i18next";

export default function Subcategories() {
  const [customer, setCustomer] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const router = useRouter();
  const { categoryId } = useParams();
  const { t } = useTranslation();

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
              customerData.tier = calculateTier(customerData.points || 0);
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

        // Load subcategories from Firebase
        console.log("🔍 Loading subcategories for categoryId:", categoryId);
        const subcategoriesData =
          await SubcategoryService.getSubcategoriesByCategory(categoryId);
        console.log("📦 Subcategories data received:", subcategoriesData);

        // Transform subcategories data for display
        const transformedSubcategories = subcategoriesData.map(
          (subcategory) => ({
            id: subcategory.id,
            name: subcategory.name,
            description: subcategory.description, // Include description
            image: subcategory.image, // Use uploaded image
            backgroundImage: subcategory.backgroundImage, // Include background image
            backgroundFit: subcategory.backgroundFit || "contain", // Include background fit option
            categoryId: subcategory.categoryId,
            textColor: subcategory.textColor || "#000000",
            bgColor: getSubcategoryBgColor(subcategory.name),
            borderColor: getSubcategoryBorderColor(subcategory.name),
            hoverColor: getSubcategoryHoverColor(subcategory.name),
          })
        );

        console.log("✨ Transformed subcategories:", transformedSubcategories);
        setSubcategories(transformedSubcategories);

        // Preload subcategory images (main + background) before showing UI
        if (typeof window !== "undefined") {
          const preloadPromises = [];
          transformedSubcategories.forEach((sub) => {
            [sub.image, sub.backgroundImage].filter(Boolean).forEach((src) => {
              preloadPromises.push(
                new Promise((resolve) => {
                  const img = new window.Image();
                  img.onload = () => resolve();
                  img.onerror = () => resolve(); // fail-safe
                  img.src = src;
                })
              );
            });
          });
          await Promise.race([
            Promise.all(preloadPromises),
            new Promise((resolve) => setTimeout(resolve, 4000)),
          ]);
        }

        // Load cart from session storage after data
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

    if (categoryId) {
      loadData();
    }
  }, [router, categoryId]);

  // Helper functions for subcategory styling - all same color
  const getSubcategoryBgColor = (subcategoryName) => {
    return "bg-white"; // same background for all
  };

  const getSubcategoryBorderColor = (subcategoryName) => {
    return "border-gray-300"; // same border for all
  };

  const getSubcategoryHoverColor = (subcategoryName) => {
    return "hover:bg-gray-50"; // same hover for all
  };

  const handleSubcategorySelect = (subcategoryId) => {
    // Set selected subcategory for visual feedback
    setSelectedSubcategory(subcategoryId);

    // Navigate to products page after a brief delay to show selection
    setTimeout(() => {
      router.push(`/products/${categoryId}/${subcategoryId}`);
    }, 150);
  };

  const handleBack = () => {
    // Go back to categories
    router.push("/categories");
  };

  // Skeleton loading state
  if (loading) {
    return (
      <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
        <div
          className="min-h-screen bg-gray-50 flex flex-col animate-pulse"
          style={{
            backgroundImage: "url(/background.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
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
          {/* Customer block skeleton */}
          <div className="bg-white p-6 m-4 rounded-lg shadow-sm space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-100 rounded" />
          </div>
          {/* Subcategories skeleton */}
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

        {/* Subcategories Grid */}
        <div className="flex-1 p-6">
          <div className="grid gap-6 max-w-2xl mx-auto">
            {subcategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">{t("noSubcategories")}</p>
                <p className="text-gray-500 mt-2">{t("noSubcategoriesDesc")}</p>
              </div>
            ) : (
              subcategories.map((subcategory) => {
                const isSelected = selectedSubcategory === subcategory.id;
                return (
                  <button
                    key={subcategory.id}
                    onClick={() => handleSubcategorySelect(subcategory.id)}
                    className={`${
                      isSelected
                        ? "bg-green-100 border-green-500 hover:bg-green-200"
                        : `${subcategory.bgColor} ${subcategory.borderColor} ${subcategory.hoverColor}`
                    } 
                    border-2 rounded-lg p-8 transition-all duration-200 transform hover:scale-105 
                    shadow-lg hover:shadow-xl text-left relative overflow-hidden`}
                    style={{
                      backgroundImage: subcategory.backgroundImage
                        ? `url(${subcategory.backgroundImage})`
                        : "none",
                      backgroundSize: subcategory.backgroundImage
                        ? subcategory.backgroundFit
                        : "auto",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    {/* Overlay for better text readability when background image is present */}
                    {subcategory.backgroundImage && (
                      <div className="absolute inset-0 bg-white/30 rounded-lg"></div>
                    )}
                    <div className="flex items-center space-x-2 relative z-10">
                      {subcategory.image ? (
                        // Use uploaded subcategory image
                        <div className="w-24 h-24 relative">
                          <Image
                            src={subcategory.image}
                            alt={subcategory.name}
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
                          style={{ color: subcategory.textColor || "#000000" }}
                        >
                          {subcategory.name}
                        </h2>
                        {subcategory.description && (
                          <p
                            className="text-sm leading-relaxed"
                            style={{
                              color: subcategory.textColor || "#000000",
                            }}
                          >
                            {subcategory.description}
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
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
