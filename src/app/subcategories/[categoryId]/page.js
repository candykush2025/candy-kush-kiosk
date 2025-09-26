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

export default function Subcategories() {
  const [customer, setCustomer] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const router = useRouter();
  const { categoryId } = useParams();

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
            bgColor: getSubcategoryBgColor(subcategory.name),
            borderColor: getSubcategoryBorderColor(subcategory.name),
            hoverColor: getSubcategoryHoverColor(subcategory.name),
          })
        );

        console.log("✨ Transformed subcategories:", transformedSubcategories);
        setSubcategories(transformedSubcategories);

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

  if (!customer || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">
            {loading
              ? "Loading subcategories..."
              : "Loading customer information..."}
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
            Select Subcategory
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
              <p className="text-green-100 mb-2">
                Member ID: {customer.customerId}
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-green-100 text-sm">Points Balance</p>
                <p className="text-3xl font-bold">
                  {(customer.totalPoints || 0).toLocaleString()}
                </p>
                <p className="text-green-100 text-sm">pts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subcategories Grid */}
        <div className="flex-1 p-6">
          <div className="grid gap-6 max-w-2xl mx-auto">
            {subcategories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">No subcategories found</p>
                <p className="text-gray-500 mt-2">
                  This category may not have subcategories yet.
                </p>
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
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">
                          {subcategory.name}
                        </h2>
                        {subcategory.description && (
                          <p className="text-gray-600 text-sm leading-relaxed">
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
