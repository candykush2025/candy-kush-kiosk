"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CustomerService,
  getTierColor,
  calculateTier,
} from "../../src/lib/customerService";
import {
  CategoryService,
  SubcategoryService,
  ProductService,
  CashbackService,
} from "../../src/lib/productService";
import { TransactionService } from "../../src/lib/transactionService";
import CustomerSection from "../../src/components/CustomerSection";
import KioskHeader from "../../src/components/KioskHeader";
import CustomerLookup from "../../src/components/CustomerLookup";
import { VisitService } from "../../src/lib/visitService";
import { useTranslation } from "react-i18next";
import i18n from "../../src/i18n";

export default function ShopPage() {
  const router = useRouter();
  const { t } = useTranslation();

  // Navigation state
  const [currentView, setCurrentView] = useState("categories"); // categories, subcategories, products, checkout, order-complete
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  // Data states - loaded once and reused
  const [customer, setCustomer] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visitRecorded, setVisitRecorded] = useState(false);

  // Modal states for product variants (EXACT copy from products page)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [currentVariantStep, setCurrentVariantStep] = useState(0);

  // Checkout states (EXACT copy from checkout page)
  const [showCustomerLookup, setShowCustomerLookup] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [cashbackPoints, setCashbackPoints] = useState(0);

  // useCallback hooks must be declared before useEffect hooks
  const calculateCashbackPoints = useCallback(async () => {
    if (!customer || cart.length === 0) {
      setCashbackPoints(0);
      return;
    }

    try {
      let totalCashback = 0;
      const itemCashbackDetails = [];

      // Get cashback points for each item based on its category
      for (const item of cart) {
        if (item.categoryId) {
          const cashbackPercentage =
            await CashbackService.getCashbackPercentage(item.categoryId);
          const itemTotal = item.price * (item.quantity || 1);
          const itemCashback = Math.floor(
            (itemTotal * cashbackPercentage) / 100
          );

          // Store detailed cashback info for this item
          itemCashbackDetails.push({
            productId: item.productId || item.id,
            name: item.name,
            quantity: item.quantity || 1,
            price: item.price,
            itemTotal: itemTotal,
            cashbackPercentage: cashbackPercentage,
            pointsEarned: itemCashback,
            categoryId: item.categoryId,
          });

          totalCashback += itemCashback;
        }
      }

      setCashbackPoints(totalCashback);

      // Store detailed cashback info for later use in transaction
      window.shopCashbackDetails = itemCashbackDetails;
    } catch (error) {
      console.error("Error calculating cashback:", error);
      setCashbackPoints(0);
      window.shopCashbackDetails = [];
    }
  }, [customer, cart]);

  // Ensure language is loaded from localStorage on page mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem("i18nextLng");
    if (storedLanguage && storedLanguage !== i18n.language) {
      i18n.changeLanguage(storedLanguage);
      console.log(`Shop page: Language changed to ${storedLanguage}`);
    }
  }, []);

  // Record visit when shop page loads (only once per session)
  useEffect(() => {
    const recordPageVisit = async () => {
      if (!visitRecorded) {
        const success = await VisitService.recordVisit(
          Math.random().toString(36).substr(2, 9)
        );
        if (success) {
          setVisitRecorded(true);
          console.log("Shop page visit recorded successfully");
        }
      }
    };

    recordPageVisit();
  }, [visitRecorded]);

  // Load all data once on component mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);

        // Check customer authentication
        const customerCode = sessionStorage.getItem("customerCode");
        if (!customerCode) {
          router.push("/scanner");
          return;
        }

        // Load customer data
        const customerData = await CustomerService.getCustomerByMemberId(
          customerCode
        );
        if (customerData) {
          if (!customerData.tier) {
            customerData.tier = calculateTier(customerData.points);
          }
          customerData.totalPoints = CustomerService.calculateTotalPoints(
            customerData.points
          );
          setCustomer(customerData);
        } else {
          router.push("/scanner");
          return;
        }

        // Load all shop data in parallel for instant navigation
        const [categoriesData, subcategoriesData, productsData] =
          await Promise.all([
            CategoryService.getAllCategories(),
            SubcategoryService.getAllSubcategories(),
            ProductService.getAllProducts(),
          ]);

        // Transform categories data (same as original categories page)
        const transformedCategories = categoriesData.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description,
          image: category.image,
          backgroundImage: category.backgroundImage,
          backgroundFit: category.backgroundFit || "contain",
          textColor: category.textColor || "#000000",
          bgColor: getCategoryBgColor(category.name),
          borderColor: getCategoryBorderColor(category.name),
          hoverColor: getCategoryHoverColor(category.name),
        }));

        setCategories(transformedCategories);
        setSubcategories(subcategoriesData);
        setProducts(productsData);

        // Preload all images to prevent re-loading on navigation
        const imagesToPreload = [];

        // Add main background image
        imagesToPreload.push("/background.jpg");

        // Add category images
        transformedCategories.forEach((category) => {
          if (category.image) imagesToPreload.push(category.image);
          if (category.backgroundImage)
            imagesToPreload.push(category.backgroundImage);
        });

        // Add subcategory images
        subcategoriesData.forEach((subcategory) => {
          if (subcategory.image) imagesToPreload.push(subcategory.image);
          if (subcategory.backgroundImage)
            imagesToPreload.push(subcategory.backgroundImage);
        });

        // Add product images
        productsData.forEach((product) => {
          if (product.image) imagesToPreload.push(product.image);
          if (product.mainImage) imagesToPreload.push(product.mainImage);
          if (product.backgroundImage)
            imagesToPreload.push(product.backgroundImage);
          if (product.images && Array.isArray(product.images)) {
            product.images.forEach((img) => imagesToPreload.push(img));
          }
        });

        // Preload all images
        if (imagesToPreload.length > 0) {
          const preloadPromises = imagesToPreload.map((src) => {
            return new Promise((resolve) => {
              const img = document.createElement("img");
              img.onload = () => resolve();
              img.onerror = () => resolve(); // Don't fail if image doesn't load
              img.src = src;
            });
          });

          // Wait for all images to preload (or timeout after 10 seconds)
          await Promise.race([
            Promise.all(preloadPromises),
            new Promise((resolve) => setTimeout(resolve, 10000)),
          ]);

          console.log(
            `Preloaded ${imagesToPreload.length} images for instant navigation`
          );
        }

        // Load cart from session storage
        const savedCart = sessionStorage.getItem("cart");
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error("Error loading shop data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, [router]);

  // Calculate cashback when cart or customer changes
  useEffect(() => {
    calculateCashbackPoints();
  }, [cart, customer, calculateCashbackPoints]);

  // Category helper functions (EXACT copy from categories page)
  const getCategoryIcon = (categoryName) => {
    return "🌿"; // same icon for all
  };

  const getCategoryBgColor = (categoryName) => {
    return "bg-white/80"; // semi-transparent background for all
  };

  const getCategoryBorderColor = (categoryName) => {
    return "border-gray-300"; // same border for all
  };

  const getCategoryHoverColor = (categoryName) => {
    return "hover:bg-white/90"; // slightly more opaque on hover
  };

  // Helper functions for subcategory styling (EXACT copy from subcategories page)
  const getSubcategoryBgColor = (subcategoryName) => {
    return "bg-white/80"; // semi-transparent background for all
  };

  const getSubcategoryBorderColor = (subcategoryName) => {
    return "border-gray-300"; // same border for all
  };

  const getSubcategoryHoverColor = (subcategoryName) => {
    return "hover:bg-white/90"; // slightly more opaque on hover
  };

  // Function to translate category names (EXACT copy from categories page)
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

  // Navigation functions (instant, no page reloads)
  const handleCategorySelect = (categoryId) => {
    // Set selected category for visual feedback
    setSelectedCategory(categoryId);

    // Navigate to subcategories view after a brief delay to show selection
    setTimeout(() => {
      setCurrentView("subcategories");
    }, 150);
  };

  const handleSubcategorySelect = (subcategoryId) => {
    // Set selected subcategory for visual feedback
    setSelectedSubcategory(subcategoryId);

    // Navigate to products view after a brief delay to show selection
    setTimeout(() => {
      setCurrentView("products");
    }, 150);
  };

  const handleBack = () => {
    if (currentView === "subcategories") {
      setCurrentView("categories");
      setSelectedCategory(null);
    } else if (currentView === "products") {
      setCurrentView("subcategories");
      setSelectedSubcategory(null);
    } else if (currentView === "checkout") {
      setCurrentView("products");
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCurrentView("checkout");
  };

  // Cart functions
  const addToCart = (product, quantity = 1) => {
    const existingItem = cart.find((item) => item.id === product.id);
    let newCart;

    if (existingItem) {
      newCart = cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity }];
    }

    setCart(newCart);
    sessionStorage.setItem("cart", JSON.stringify(newCart));
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const newCart = cart.map((item) =>
      item.id === productId ? { ...item, quantity } : item
    );
    setCart(newCart);
    sessionStorage.setItem("cart", JSON.stringify(newCart));
  };

  const removeFromCart = (productId) => {
    const newCart = cart.filter((item) => item.id !== productId);
    setCart(newCart);
    sessionStorage.setItem("cart", JSON.stringify(newCart));
  };

  // Get filtered data based on current selection
  const getFilteredSubcategories = () => {
    if (!selectedCategory) return [];
    return subcategories.filter((sub) => sub.categoryId === selectedCategory);
  };

  const getFilteredProducts = () => {
    if (!selectedSubcategory) return [];
    return products.filter(
      (product) =>
        product.categoryId === selectedCategory &&
        product.subcategoryId === selectedSubcategory
    );
  };

  // Skeleton loading state (EXACT copy from categories page)
  if (loading) {
    return (
      <div className="kiosk-container min-h-screen portrait:max-w-md mx-auto">
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
          <div className="bg-white/80 p-6 m-4 rounded-lg shadow-sm space-y-4">
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

  // Render categories view (EXACT copy from categories page)
  const renderCategories = () => (
    <div className="kiosk-container min-h-screen portrait:max-w-md mx-auto">
      <div
        className="min-h-screen flex flex-col"
        style={{
          backgroundImage: "url(/background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Header */}
        <KioskHeader
          onBack={() => router.push("/scanner")}
          cart={cart}
          onCart={() => setCurrentView("checkout")}
        />

        {/* Customer Info Section */}
        <CustomerSection customer={customer} />

        {/* Categories Grid */}
        <div className="flex-1 p-6 pb-24">
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

        {/* Cancel Order Button - Inside background */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
            <div className="kiosk-container portrait:max-w-md mx-auto">
              <button
                onClick={handleCancelToHome}
                className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                {t("cancelOrder") || "Cancel Order"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render subcategories view (EXACT copy from subcategories page)
  const renderSubcategories = () => {
    const filteredSubcategories = getFilteredSubcategories();

    return (
      <div className="kiosk-container min-h-screen portrait:max-w-md mx-auto">
        <div
          className="min-h-screen flex flex-col"
          style={{
            backgroundImage: "url(/background.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Header */}
          <KioskHeader
            onBack={handleBack}
            cart={cart}
            onCart={() => setCurrentView("checkout")}
          />

          {/* Customer Info Section */}
          <CustomerSection customer={customer} />

          {/* Subcategories Grid */}
          <div className="flex-1 p-6 pb-24">
            <div className="grid gap-6 max-w-2xl mx-auto">
              {filteredSubcategories.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-600">
                    {t("noSubcategories")}
                  </p>
                  <p className="text-gray-500 mt-2">
                    {t("noSubcategoriesDesc")}
                  </p>
                </div>
              ) : (
                filteredSubcategories.map((subcategory) => {
                  const isSelected = selectedSubcategory === subcategory.id;
                  return (
                    <button
                      key={subcategory.id}
                      onClick={() => handleSubcategorySelect(subcategory.id)}
                      className={`${
                        isSelected
                          ? "bg-green-100 border-green-500 hover:bg-green-200"
                          : `${getSubcategoryBgColor(
                              subcategory.name
                            )} ${getSubcategoryBorderColor(
                              subcategory.name
                            )} ${getSubcategoryHoverColor(subcategory.name)}`
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
                            style={{
                              color: subcategory.textColor || "#000000",
                            }}
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

          {/* Cancel Order Button - Inside background */}
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
              <div className="kiosk-container portrait:max-w-md mx-auto">
                <button
                  onClick={handleCancelToHome}
                  className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  {t("cancelOrder") || "Cancel Order"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render products view (instant load, same layout as original products page)
  const renderProducts = () => {
    const filteredProducts = products.filter(
      (product) =>
        product.categoryId === selectedCategory &&
        product.subcategoryId === selectedSubcategory
    );

    // Helper functions from products page (EXACT copy)
    const getCartQuantity = (product) => {
      // Only show quantity for products without variants
      if (product.variants && product.variants.length > 0) {
        return 0; // Don't show quantity controls for products with variants
      }

      const cartItem = cart.find(
        (item) =>
          item.productId === product.id &&
          (!item.variants || Object.keys(item.variants).length === 0)
      );
      return cartItem ? cartItem.quantity : 0;
    };

    const updateCartQuantity = (product, newQuantity) => {
      // Only allow quantity updates for products without variants
      if (product.variants && product.variants.length > 0) {
        return; // Don't allow direct quantity updates for products with variants
      }

      if (newQuantity <= 0) {
        // Remove from cart (exclude the matching simple product item)
        setCart((prevCart) => {
          const newCart = prevCart.filter(
            (item) =>
              !(
                item.productId === product.id &&
                (!item.variants || Object.keys(item.variants).length === 0)
              )
          );
          sessionStorage.setItem("cart", JSON.stringify(newCart));
          return newCart;
        });
      } else {
        const existingItemIndex = cart.findIndex(
          (item) =>
            item.productId === product.id &&
            (!item.variants || Object.keys(item.variants).length === 0)
        );
        if (existingItemIndex >= 0) {
          // Update existing item
          setCart((prevCart) => {
            const newCart = [...prevCart];
            newCart[existingItemIndex] = {
              ...newCart[existingItemIndex],
              quantity: newQuantity,
            };
            sessionStorage.setItem("cart", JSON.stringify(newCart));
            return newCart;
          });
        } else {
          // Add new item to cart
          const cartItem = {
            id: `${product.id}_${Date.now()}`,
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: newQuantity,
            variants: {},
            image: product.mainImage || product.image,
            categoryId: selectedCategory,
            subcategoryId: selectedSubcategory,
          };
          setCart((prevCart) => {
            const newCart = [...prevCart, cartItem];
            sessionStorage.setItem("cart", JSON.stringify(newCart));
            return newCart;
          });
        }
      }
    };

    const getProductPriceDisplay = (product) => {
      if (product.variants && product.variants.length > 0) {
        // Get all variant option prices
        const prices = [];
        product.variants.forEach((variant) => {
          if (variant.options) {
            variant.options.forEach((option) => {
              if (option.price && option.price > 0) {
                prices.push(option.price);
              }
            });
          }
        });

        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          if (minPrice === maxPrice) {
            return `฿${minPrice.toLocaleString()}`;
          } else {
            return `฿${minPrice.toLocaleString()} - ฿${maxPrice.toLocaleString()}`;
          }
        }
      }
      return product.price
        ? `฿${product.price.toLocaleString()}`
        : "Price not available";
    };

    const handleProductSelect = (product) => {
      setSelectedProduct(product);
      setSelectedVariants({});
      setCurrentVariantStep(0);

      // Check if product has variants
      if (product.variants && product.variants.length > 0) {
        // Open modal for variant selection
        setIsModalOpen(true);
      } else {
        // Add directly to cart
        addToCart(product, {}, 1);
      }
    };

    const addToCart = (product, variants, qty) => {
      const cartItem = {
        id: `${product.id}_${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: getSelectedPrice(product, variants),
        quantity: qty,
        variants: variants,
        image: product.mainImage || product.image,
        categoryId: selectedCategory,
        subcategoryId: selectedSubcategory,
      };

      const newCart = [...cart, cartItem];
      setCart(newCart);
      sessionStorage.setItem("cart", JSON.stringify(newCart));

      // Show success message or close modal
      setIsModalOpen(false);
      setSelectedProduct(null);
    };

    const getSelectedPrice = (product, variants) => {
      if (product.variants && Object.keys(variants).length > 0) {
        // Find the price based on selected variants
        for (const variant of product.variants) {
          const selectedOption = variants[variant.variantName];
          if (selectedOption && variant.options) {
            const option = variant.options.find(
              (opt) => opt.name === selectedOption
            );
            if (option && option.price) {
              return option.price;
            }
          }
        }
      }
      return product.price || 0;
    };

    return (
      <div className="kiosk-container min-h-screen portrait:max-w-md mx-auto">
        <div
          className="min-h-screen flex flex-col"
          style={{
            backgroundImage: "url(/background.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Header */}
          <KioskHeader
            onBack={() => setCurrentView("subcategories")}
            cart={cart}
            onCart={() => setCurrentView("checkout")}
          />

          {/* Customer Info Section */}
          <CustomerSection customer={customer} />

          {/* Products Grid */}
          <div className="flex-1 p-6 pb-24">
            <div className="grid gap-6 max-w-2xl mx-auto">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-600">No products available</p>
                  <p className="text-gray-500 mt-2">Please check back later</p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const cartQuantity = getCartQuantity(product);
                  const hasVariants =
                    product.variants && product.variants.length > 0;
                  return (
                    <div
                      key={product.id}
                      className="bg-white/80 border-2 border-gray-200 hover:border-green-500 rounded-lg p-8 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden"
                      style={{
                        backgroundImage: product.backgroundImage
                          ? `url(${product.backgroundImage})`
                          : "none",
                        backgroundSize: product.backgroundImage
                          ? product.backgroundFit === "stretch"
                            ? "100% 100%"
                            : product.backgroundFit || "contain"
                          : "auto",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }}
                    >
                      {product.backgroundImage && (
                        <div className="absolute inset-0 bg-white/30 rounded-lg"></div>
                      )}
                      <div className="flex items-center space-x-2 relative z-10">
                        {product.mainImage || product.image ? (
                          <div className="w-24 h-24 relative overflow-hidden rounded-lg">
                            <Image
                              src={product.mainImage || product.image}
                              alt={product.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24"></div>
                        )}
                        <button
                          onClick={() => handleProductSelect(product)}
                          className="flex-1 text-left"
                        >
                          <h3
                            className="text-2xl font-bold mb-1"
                            style={{ color: product.textColor || "#000000" }}
                          >
                            {product.name}
                          </h3>
                          {product.description && (
                            <p
                              className="text-sm leading-relaxed"
                              style={{ color: product.textColor || "#000000" }}
                            >
                              {product.description}
                            </p>
                          )}
                          <p
                            className="font-bold text-lg mt-2"
                            style={{ color: product.textColor || "#000000" }}
                          >
                            {getProductPriceDisplay(product)}
                          </p>
                        </button>
                        <div className="flex items-center gap-2">
                          {!hasVariants && cartQuantity > 0 ? (
                            <>
                              <button
                                onClick={() =>
                                  updateCartQuantity(product, cartQuantity - 1)
                                }
                                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
                              >
                                -
                              </button>
                              <span
                                className="w-8 text-center font-semibold"
                                style={{
                                  color: product.textColor || "#000000",
                                }}
                              >
                                {cartQuantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateCartQuantity(product, cartQuantity + 1)
                                }
                                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
                              >
                                +
                              </button>
                            </>
                          ) : (
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
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Cancel Order Button - Inside background */}
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
              <div className="kiosk-container portrait:max-w-md mx-auto">
                <button
                  onClick={handleCancelToHome}
                  className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  {t("cancelOrder") || "Cancel Order"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Checkout functions (EXACT copy from checkout page)
  const getTotalPrice = () => {
    return cart.reduce(
      (total, item) => total + item.price * (item.quantity || 1),
      0
    );
  };

  const handleCustomerSelect = (selectedCustomer) => {
    setCustomer(selectedCustomer);
    setShowCustomerLookup(false);

    // Record visit if customer is selected
    if (selectedCustomer) {
      CustomerService.recordVisit(selectedCustomer.id).catch(console.error);
    }
  };

  const processPayment = async () => {
    setProcessing(true);
    setError("");

    try {
      const totalPrice = getTotalPrice();
      const orderNumber = `ORDER-${Date.now()}`;

      // Create transaction data for Firebase
      const transactionData = {
        customerId: customer?.id || null,
        customerName: customer
          ? `${customer.name} ${customer.lastName || ""}`.trim()
          : "Guest",
        orderNumber: orderNumber,
        items: cart.map((item) => ({
          productId: item.productId || item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          variants: item.variants || {},
          categoryId: item.categoryId,
          subcategoryId: item.subcategoryId,
          total: item.price * (item.quantity || 1),
        })),
        subtotal: totalPrice,
        tax: 0, // Add tax calculation if needed
        discount: 0, // Add discount calculation if needed
        total: totalPrice,
        paymentMethod: paymentMethod,
        paymentStatus: "completed",
        transactionType: "sale",
        status: "completed",
        cashier: "Kiosk",
        location: "Self-Service Kiosk",
        notes: `Cashback points earned: ${cashbackPoints}`,
        refundReason: "",
        originalTransactionId: null,
        // Add point details
        pointsEarned: cashbackPoints,
        pointDetails: window.shopCashbackDetails || [],
        pointCalculation: {
          totalPointsEarned: cashbackPoints,
          calculationMethod: "category-based",
          items: window.shopCashbackDetails || [],
        },
      };

      // Record transaction to Firebase
      console.log("Recording transaction to Firebase:", transactionData);
      const transactionResult = await TransactionService.createTransaction(
        transactionData
      );
      console.log("Transaction recorded successfully:", transactionResult);

      // Update customer points if customer exists
      if (customer && cashbackPoints > 0) {
        try {
          const pointTransactionDetails = {
            transactionId: transactionResult.transactionId,
            orderId: orderNumber,
            reason: "Purchase Cashback",
            details: `Earned ${cashbackPoints} points from shop purchase`,
            items: window.shopCashbackDetails || [],
            pointCalculation: {
              totalPointsEarned: cashbackPoints,
              calculationMethod: "category-based",
              breakdown: window.shopCashbackDetails || [],
            },
            purchaseAmount: totalPrice,
            paymentMethod: paymentMethod,
          };

          await CustomerService.addPoints(
            customer.id,
            cashbackPoints,
            pointTransactionDetails
          );
          console.log(
            `Added ${cashbackPoints} points to customer ${customer.name}`
          );
        } catch (pointsError) {
          console.error("Error adding points to customer:", pointsError);
          // Don't fail the transaction if points update fails
        }
      }

      // Create order object for session storage (for order-complete page)
      const order = {
        id: transactionResult.transactionId,
        orderId: orderNumber,
        items: cart,
        total: totalPrice,
        customer: customer,
        paymentMethod: paymentMethod,
        timestamp: new Date().toISOString(),
        cashbackPoints: cashbackPoints,
        transactionId: transactionResult.id,
      };

      // Save order to session storage for order-complete page
      sessionStorage.setItem("lastOrder", JSON.stringify(order));

      // Clear cart
      sessionStorage.removeItem("cart");
      setCart([]);

      // Navigate to order complete
      router.push("/order-complete");
    } catch (error) {
      console.error("Payment processing error:", error);
      setError(`Payment failed: ${error.message || "Please try again."}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelOrder = () => {
    // Clear cart and go back to categories
    sessionStorage.removeItem("cart");
    setCart([]);
    setCurrentView("categories");
  };

  const handleCancelToHome = () => {
    // Clear cart and go to home page
    sessionStorage.removeItem("cart");
    setCart([]);
    router.push("/");
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      // Remove item from cart
      setCart((prevCart) => {
        const newCart = prevCart.filter((item) => item.id !== itemId);
        sessionStorage.setItem("cart", JSON.stringify(newCart));
        return newCart;
      });
    } else {
      // Update quantity
      setCart((prevCart) => {
        const newCart = prevCart.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        );
        sessionStorage.setItem("cart", JSON.stringify(newCart));
        return newCart;
      });
    }
  };

  const handleCustomerFound = (foundCustomer) => {
    handleCustomerSelect(foundCustomer);
  };

  const handleBackFromCheckout = () => {
    setCurrentView("products");
  };

  // Render checkout view (EXACT copy from checkout page)
  const renderCheckout = () => {
    return (
      <div className="kiosk-container min-h-screen portrait:max-w-md mx-auto">
        <div
          className="min-h-screen flex flex-col"
          style={{
            backgroundImage: "url(/background.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Header */}
          <KioskHeader
            showBack={true}
            showCart={false}
            onBack={handleBackFromCheckout}
          />

          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-4">
                {t("orderSummary")}
              </h2>
              <p className="text-xl text-center text-gray-600 mb-12">
                {t("reviewBeforePayment")}
              </p>

              {/* Cart Items */}
              <div className="bg-white/80 rounded-2xl shadow-lg p-6 mb-8">
                <h3 className="text-2xl font-bold mb-6">{t("yourItems")}</h3>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={`${item.name} ${Object.values(
                              item.variants || {}
                            ).join(" ")}`}
                            width={80}
                            height={80}
                            className="rounded-lg mr-4"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-lg">
                            {item.name}
                          </div>
                          {item.variants &&
                            Object.keys(item.variants).length > 0 && (
                              <div className="text-gray-600">
                                {Object.entries(item.variants).map(
                                  ([variantName, variantValue]) => (
                                    <div key={variantName}>
                                      {variantName}:{" "}
                                      {variantValue?.name ||
                                        (typeof variantValue === "string"
                                          ? variantValue
                                          : JSON.stringify(variantValue))}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          <div className="text-green-600 font-bold">
                            ฿{item.price} each
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, (item.quantity || 1) - 1)
                            }
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <span className="w-8 text-center font-semibold">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, (item.quantity || 1) + 1)
                            }
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Price and Remove */}
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            ฿{(item.price * (item.quantity || 1)).toFixed(2)}
                          </div>
                          <button
                            onClick={() => updateQuantity(item.id, 0)}
                            className="text-red-500 hover:text-red-700 text-sm transition-colors"
                          >
                            {t("remove")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand Total */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-lg p-8 mb-8 border-2 border-green-200">
                <div className="text-center">
                  <div className="text-lg text-gray-600 mb-2">
                    {t("grandTotal")}
                  </div>
                  <div className="text-6xl font-bold text-green-600 mb-4">
                    ฿{getTotalPrice()}
                  </div>
                  <div className="text-gray-600">
                    {t("itemsCount", { count: cart.length })} •{" "}
                    {cart.reduce(
                      (total, item) => total + (item.quantity || 1),
                      0
                    )}{" "}
                    {t("totalQuantity")}
                  </div>

                  {/* Cashback Points Display */}
                  {customer && (
                    <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                      <div className="text-yellow-800 font-semibold flex items-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {t("cashbackReward")}
                      </div>
                      <div className="text-lg font-bold text-yellow-900">
                        {t("cashbackPointsAdded", { points: cashbackPoints })}
                      </div>
                      {cashbackPoints === 0 && (
                        <div className="text-xs text-yellow-600 mt-1">
                          {t("cashbackNoPointsHint")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white/80 rounded-2xl shadow-lg p-6 mb-8">
                <h3 className="text-2xl font-bold mb-4">
                  {t("paymentMethod")}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-green-500"
                    />
                    <span className="font-medium">{t("cash")}</span>
                  </label>
                  <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="crypto"
                      checked={paymentMethod === "crypto"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-green-500"
                    />
                    <span className="font-medium">{t("crypto")}</span>
                  </label>
                  <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="bank_transfer"
                      checked={paymentMethod === "bank_transfer"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-green-500"
                    />
                    <span className="font-medium">{t("bankTransfer")}</span>
                  </label>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  onClick={handleBackFromCheckout}
                  disabled={processing}
                  className="px-8 py-4 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg transition-colors"
                >
                  {t("addMoreItems")}
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={processing}
                  className="px-8 py-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-xl font-bold text-lg transition-colors"
                >
                  {t("cancelOrder") || "Cancel Order"}
                </button>
              </div>
              <button
                onClick={processPayment}
                disabled={processing}
                className="w-full px-8 py-5 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-xl font-bold text-2xl transition-colors"
              >
                {processing
                  ? t("processingEllipsis")
                  : t("completeOrder", { total: getTotalPrice() })}
              </button>
            </div>
          </div>

          {/* Customer Lookup Modal */}
          {showCustomerLookup && (
            <CustomerLookup
              onCustomerFound={handleCustomerFound}
              onClose={() => setShowCustomerLookup(false)}
            />
          )}
        </div>
      </div>
    );
  };

  // Main render function
  const renderCurrentView = () => {
    switch (currentView) {
      case "categories":
        return renderCategories();
      case "subcategories":
        return renderSubcategories();
      case "products":
        return renderProducts();
      case "checkout":
        return renderCheckout();
      default:
        return renderCategories();
    }
  };

  return renderCurrentView();
}
