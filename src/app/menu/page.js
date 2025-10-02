"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CustomerService,
  getTierColor,
  calculateTier,
} from "../../lib/customerService";
import {
  CategoryService,
  SubcategoryService,
  ProductService,
  CashbackService,
} from "../../lib/productService";
import { TransactionService } from "../../lib/transactionService";
import CustomerSection from "../../components/CustomerSection";
import KioskHeader from "../../components/KioskHeader";
import { VisitService } from "../../lib/visitService";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";

export default function MenuPage() {
  const [customer, setCustomer] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showQuantityPopup, setShowQuantityPopup] = useState(false);
  const [isPopupClosing, setIsPopupClosing] = useState(false);
  const [isPopupOpening, setIsPopupOpening] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
  const [selectedVariantOptions, setSelectedVariantOptions] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [cashbackPoints, setCashbackPoints] = useState(0);
  const [visitRecorded, setVisitRecorded] = useState(false);
  const [showOrderComplete, setShowOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const firstWindowRef = useRef(null);
  const [firstWindowHeight, setFirstWindowHeight] = useState(null);
  const router = useRouter();
  const { t } = useTranslation();

  // Ensure language is loaded from localStorage on page mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem("i18nextLng");
    if (storedLanguage && storedLanguage !== i18n.language) {
      i18n.changeLanguage(storedLanguage);
      console.log(`Menu page: Language changed to ${storedLanguage}`);
    }
  }, []);

  // Record visit when menu page loads (only once per session)
  useEffect(() => {
    const recordPageVisit = async () => {
      if (!visitRecorded) {
        const success = await VisitService.recordVisit(
          Math.random().toString(36).substr(2, 9)
        );
        if (success) {
          setVisitRecorded(true);
          console.log("Menu page visit recorded successfully");
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
          categoryId: category.categoryId,
          name: category.name,
          description: category.description,
          image: category.image,
          backgroundImage: category.backgroundImage,
          backgroundFit: category.backgroundFit || "contain",
          textColor: category.textColor || "#000000",
        }));

        setCategories(transformedCategories);

        // Load all subcategories and products at once
        const subcategoriesData =
          await SubcategoryService.getAllSubcategories();
        const productsData = await ProductService.getAllProducts();

        setSubcategories(subcategoriesData);

        // Map products to include categoryId from subcategory
        const productsWithCategoryId = productsData.map((product) => {
          const subcategory = subcategoriesData.find(
            (sub) => sub.id === product.subcategoryId
          );
          const mappedProduct = {
            ...product,
            categoryId: subcategory ? subcategory.categoryId : null,
          };

          // Debug log to see if categoryId is being mapped correctly
          if (
            product.name === "Testing Product" ||
            product.name.includes("Product 1")
          ) {
            console.log("🔍 Product mapping debug:", {
              productName: product.name,
              subcategoryId: product.subcategoryId,
              foundSubcategory: subcategory,
              mappedCategoryId: mappedProduct.categoryId,
            });
          }

          return mappedProduct;
        });

        console.log(
          "📦 Sample products with categoryId:",
          productsWithCategoryId.slice(0, 3)
        );
        setProducts(productsWithCategoryId);

        // Auto-select first category on initial load
        if (transformedCategories.length > 0) {
          const firstCategory = transformedCategories[0];
          setSelectedCategory(firstCategory.id);

          // Filter subcategories and products for first category
          const firstCategorySubcategories = subcategoriesData.filter(
            (sub) => sub.categoryId === firstCategory.id
          );
          const firstCategoryProducts = productsWithCategoryId.filter(
            (product) => product.categoryId === firstCategory.id
          );

          setFilteredSubcategories(firstCategorySubcategories);
          setFilteredProducts(firstCategoryProducts);

          console.log("🎯 Auto-selected first category:", firstCategory);
          console.log(
            "📂 Auto-loaded subcategories:",
            firstCategorySubcategories
          );
          console.log("📦 Auto-loaded products:", firstCategoryProducts);
        }

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

  // Measure first window height after categories are loaded
  useEffect(() => {
    if (categories.length > 0 && firstWindowRef.current) {
      const height = firstWindowRef.current.offsetHeight;
      setFirstWindowHeight(height);
    }
  }, [categories]);

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category.id); // Use category.id (database ID) for filtering

    // Filter subcategories and products based on selected category database ID
    const newFilteredSubcategories = subcategories.filter(
      (sub) => sub.categoryId === category.id
    );
    const newFilteredProducts = products.filter(
      (product) => product.categoryId === category.id
    );

    setFilteredSubcategories(newFilteredSubcategories);
    setFilteredProducts(newFilteredProducts);

    console.log("Selected category:", category);
    console.log("Filtered subcategories:", newFilteredSubcategories);
    console.log("Filtered products:", newFilteredProducts);
  };

  const handleBack = () => {
    router.push("/scanner");
  };

  const handleCart = () => {
    if (cart.length > 0) {
      setShowCart(true);
    }
  };

  // Handle product selection for quantity popup
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCurrentVariantIndex(0);
    setSelectedVariantOptions({});
    setIsPopupClosing(false);
    setShowQuantityPopup(true);

    // Trigger opening animation after a small delay
    setTimeout(() => {
      setIsPopupOpening(true);
    }, 10);
  };

  // Handle variant option selection
  const handleVariantOptionSelect = (variantIndex, option) => {
    setSelectedVariantOptions((prev) => ({
      ...prev,
      [variantIndex]: option,
    }));
  };

  // Handle next variant or add to cart
  const handleNextOrAddToCart = () => {
    if (!selectedProduct) return;

    if (
      selectedProduct.hasVariants &&
      selectedProduct.variants &&
      selectedProduct.variants.length > 0
    ) {
      const totalVariants = selectedProduct.variants.length;

      if (currentVariantIndex < totalVariants - 1) {
        // Move to next variant
        setCurrentVariantIndex(currentVariantIndex + 1);
      } else {
        // Add to cart with selected variants
        handleAddVariantToCart();
      }
    } else {
      // Simple product
      handleAddToCart();
    }
  };

  // Handle add variant product to cart
  const handleAddVariantToCart = () => {
    if (!selectedProduct || !selectedProduct.hasVariants) return;

    // Calculate total price from selected options
    let totalPrice = 0;
    Object.values(selectedVariantOptions).forEach((option) => {
      totalPrice += option.price || 0;
    });

    // Create variant description
    const variantDescription = Object.values(selectedVariantOptions)
      .map((option) => option.name)
      .join(", ");

    const cartItem = {
      id: `${selectedProduct.productId}_${Date.now()}`, // Unique ID for variant combinations
      name: `${selectedProduct.name} (${variantDescription})`,
      price: totalPrice,
      quantity: 1, // Always 1 for variants
      image: selectedProduct.mainImage,
      productId: selectedProduct.productId,
      categoryId: selectedProduct.categoryId, // Add categoryId for cashback calculation
      variants: selectedVariantOptions,
      isVariant: true,
    };

    const newCart = [...cart, cartItem];
    setCart(newCart);
    sessionStorage.setItem("cart", JSON.stringify(newCart));

    // Close popup
    closeQuantityPopup();
  };

  // Cart management functions from checkout page
  const getTotalPrice = () => {
    return cart.reduce(
      (total, item) => total + item.price * (item.quantity || 1),
      0
    );
  };

  const removeFromCart = (itemIdToRemove) => {
    const updatedCart = cart.filter((item) => item.id !== itemIdToRemove);
    setCart(updatedCart);
    sessionStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const updatedCart = cart.map((item) =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCart(updatedCart);
    sessionStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0) return;

    setProcessing(true);
    setError("");

    try {
      const transactionData = {
        items: cart,
        total: getTotalPrice(),
        paymentMethod: paymentMethod,
        customer: customer,
        cashbackEarned: cashbackPoints,
        timestamp: new Date(),
      };

      console.log("🔍 Processing payment with data:", transactionData);

      const result = await TransactionService.createTransaction(
        transactionData
      );

      console.log("💳 Transaction result:", result);

      // If we get here without error, transaction was successful
      console.log(
        "✅ Payment successful, transaction ID:",
        result.transactionId
      );

      // Update customer points if customer exists
      if (customer && cashbackPoints > 0) {
        try {
          await CustomerService.addPoints(customer.id, cashbackPoints);
          console.log(
            `Added ${cashbackPoints} points to customer ${customer.name}`
          );
        } catch (pointsError) {
          console.error("Error adding points to customer:", pointsError);
          // Don't fail the transaction if points update fails
        }
      }

      // Save order data for order-complete modal
      const orderDataForComplete = {
        id: result.transactionId,
        orderId: result.transactionId, // Use transactionId as orderId
        items: cart,
        total: getTotalPrice(),
        customer: customer,
        cashbackPoints: customer ? cashbackPoints : 0,
        transactionId: result.id,
        paymentMethod: paymentMethod,
        timestamp: new Date().toISOString(),
      };

      // Set completed order data and show modal
      setCompletedOrder(orderDataForComplete);

      // For KIOSK: After order complete, redirect to home for next customer
      setTimeout(() => {
        // Clear all session data for next customer
        sessionStorage.removeItem("cart");
        sessionStorage.removeItem("customerCode");
        sessionStorage.removeItem("currentCustomer");
        sessionStorage.removeItem("selectedPaymentMethod");
        sessionStorage.removeItem("lastOrder");
        sessionStorage.removeItem("receiptData");

        // Reset language to English default for next customer
        localStorage.removeItem("i18nextLng");
        i18n.changeLanguage("en");

        // Redirect to home page for next customer
        router.push("/");
      }, 3000); // Show success for 3 seconds then redirect

      setShowOrderComplete(true);

      // Clear cart
      setCart([]);
      sessionStorage.removeItem("cart");
      setShowCart(false);
    } catch (error) {
      console.error("Payment error:", error);
      setError("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // Calculate cashback points
  const calculateCashbackPoints = useCallback(async () => {
    if (!customer || cart.length === 0) {
      setCashbackPoints(0);
      return;
    }

    try {
      let totalCashback = 0;

      console.log("Calculating cashback for customer:", customer?.id);
      console.log("Cart items:", cart);

      // Get cashback points for each item based on its category
      for (const item of cart) {
        console.log(
          "Processing item:",
          item.name,
          "CategoryID:",
          item.categoryId
        );

        if (item.categoryId) {
          const cashbackPercentage =
            await CashbackService.getCashbackPercentage(item.categoryId);
          console.log(
            "Cashback percentage for category",
            item.categoryId,
            ":",
            cashbackPercentage
          );

          const itemTotal = item.price * (item.quantity || 1);
          const itemCashback = Math.floor(
            (itemTotal * cashbackPercentage) / 100
          );

          console.log("Item total:", itemTotal, "Item cashback:", itemCashback);
          totalCashback += itemCashback;
        } else {
          console.log("No categoryId found for item:", item.name);
        }
      }

      console.log("Total cashback calculated:", totalCashback);
      setCashbackPoints(totalCashback);
    } catch (error) {
      console.error("Error calculating cashback:", error);
      setCashbackPoints(0);
    }
  }, [customer, cart]);

  // Calculate cashback when cart or customer changes
  useEffect(() => {
    calculateCashbackPoints();
  }, [cart, customer, calculateCashbackPoints]);

  // Handle quantity change
  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (selectedProduct) {
      const cartItem = {
        id: selectedProduct.productId,
        name: selectedProduct.name,
        price: selectedProduct.price,
        quantity: quantity,
        image: selectedProduct.mainImage,
        productId: selectedProduct.productId,
        categoryId: selectedProduct.categoryId, // Add categoryId for cashback calculation
      };

      const existingItemIndex = cart.findIndex(
        (item) => item.id === cartItem.id
      );
      let newCart;

      if (existingItemIndex >= 0) {
        newCart = [...cart];
        newCart[existingItemIndex].quantity += quantity;
      } else {
        newCart = [...cart, cartItem];
      }

      setCart(newCart);
      sessionStorage.setItem("cart", JSON.stringify(newCart));

      // Close popup
      setShowQuantityPopup(false);
      setSelectedProduct(null);
      setQuantity(1);
    }
  };

  // Close quantity popup with animation
  const closeQuantityPopup = () => {
    setIsPopupClosing(true);
    setIsPopupOpening(false);
    setTimeout(() => {
      setShowQuantityPopup(false);
      setSelectedProduct(null);
      setQuantity(1);
      setCurrentVariantIndex(0);
      setSelectedVariantOptions({});
      setIsPopupClosing(false);
    }, 300); // Match animation duration
  };

  // Handle background click to close popup
  const handleBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      closeQuantityPopup();
    }
  };

  const handlePrintThermalReceipt = () => {
    // Store receipt data in session storage
    sessionStorage.setItem("receiptData", JSON.stringify(completedOrder));

    // Open thermal receipt page in a new window
    const receiptWindow = window.open(
      "/thermal-receipt",
      "thermalReceipt",
      "width=400,height=600"
    );

    // Focus the new window
    if (receiptWindow) {
      receiptWindow.focus();
    }
  };

  const handleStartNewOrder = () => {
    // Clear all session data for next customer
    sessionStorage.removeItem("lastOrder");
    sessionStorage.removeItem("cart");
    sessionStorage.removeItem("customerCode");
    sessionStorage.removeItem("currentCustomer");
    sessionStorage.removeItem("selectedPaymentMethod");
    sessionStorage.removeItem("receiptData");

    // Reset language to English default for next customer
    localStorage.removeItem("i18nextLng");
    i18n.changeLanguage("en");

    // Go back to homepage for next customer
    router.push("/");
  };

  // Get filtered data based on current selection
  const getFilteredSubcategories = () => {
    return filteredSubcategories;
  };

  const getFilteredProducts = () => {
    return filteredProducts;
  };

  // Function to translate category names
  const translateCategoryName = (categoryName) => {
    if (!categoryName) return "";
    const lowerCaseName = categoryName.toLowerCase();
    // Use the translation key if it exists, otherwise return the original name
    return t(lowerCaseName, categoryName);
  };

  // Helper function to get cart quantity for a product
  const getProductCartQuantity = (product) => {
    if (!product) return 0;

    // For simple products, check by productId
    if (!product.hasVariants) {
      const cartItem = cart.find(
        (item) => item.productId === product.productId && !item.isVariant
      );
      return cartItem ? cartItem.quantity || 0 : 0;
    } else {
      // For variant products, sum all variant quantities
      const variantItems = cart.filter(
        (item) => item.productId === product.productId && item.isVariant
      );
      return variantItems.reduce(
        (total, item) => total + (item.quantity || 0),
        0
      );
    }
  };

  // Helper function to get price range for variant products
  const getProductPriceDisplay = (product) => {
    if (
      !product.hasVariants ||
      !product.variants ||
      product.variants.length === 0
    ) {
      // Simple product - show member price if customer exists, otherwise regular price
      const price =
        customer && product.memberPrice ? product.memberPrice : product.price;
      return `฿${price}`;
    }

    // Variant product - calculate price range
    let allPrices = [];
    product.variants.forEach((variant) => {
      if (variant.options && variant.options.length > 0) {
        variant.options.forEach((option) => {
          if (option.price) {
            allPrices.push(option.price);
          }
        });
      }
    });

    if (allPrices.length === 0) {
      return "฿0";
    }

    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    if (minPrice === maxPrice) {
      return `฿${minPrice}`;
    } else {
      return `฿${minPrice} - ฿${maxPrice}`;
    }
  };

  // Removed scroll buttons per request; panes will use native scroll.

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <div className="text-xl font-semibold" style={{ color: "#959595" }}>
            {t("loading")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="h-screen flex flex-col bg-gray-50 font-['Poppins']"
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
          onCart={handleCart}
          cart={cart}
          showCart={true}
          showBack={true}
        />

        {/* Customer Section */}
        <CustomerSection customer={customer} />

        {/* Main Content - Two Floating Windows (fill remaining height) */}
        <div className="flex-1 min-h-0 p-6 flex gap-6 overflow-hidden">
          {/* Left Pane: Categories */}
          <div
            ref={firstWindowRef}
            className="w-1/5 h-full bg-white rounded-3xl shadow-lg flex flex-col"
          >
            <div
              id="kiosk-left-list"
              className="flex-1 overflow-y-auto hidden-scrollbar px-2 py-4"
            >
              {categories.map((category, index) => (
                <div key={category.id}>
                  <div
                    onClick={() => handleCategorySelect(category)}
                    className={`cursor-pointer p-4 transition-all duration-300 hover:bg-gray-50 ${
                      selectedCategory === category.id
                        ? "bg-green-50 border-2 border-green-500 border-b-8 border-b-green-600 shadow-xl transform scale-100"
                        : "hover:bg-gray-50 hover:shadow-md"
                    }`}
                    style={{
                      transformOrigin: "left center",
                      zIndex: selectedCategory === category.id ? 50 : 1,
                      position: "relative",
                      borderRadius:
                        selectedCategory === category.id ? "12px" : "8px",
                    }}
                  >
                    {/* Category Image - Smaller size */}
                    {category.image && (
                      <div
                        className={`mb-3 relative ${
                          selectedCategory === category.id
                            ? "w-full aspect-[4/3]"
                            : "w-3/4 mx-auto aspect-square"
                        }`}
                      >
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className={`rounded-lg transition-all duration-300 ${
                            selectedCategory === category.id
                              ? "object-contain"
                              : "object-contain"
                          }`}
                          style={{
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    )}

                    {/* Category Name */}
                    <div className="text-center">
                      <h4
                        className={`font-semibold transition-all duration-300 ${
                          selectedCategory === category.id
                            ? "text-base font-bold"
                            : "text-sm"
                        }`}
                        style={{
                          color:
                            selectedCategory === category.id
                              ? "#22c55e"
                              : "#959595",
                        }}
                      >
                        {translateCategoryName(category.name)}
                      </h4>
                    </div>
                  </div>
                  {/* Separator */}
                  {index < categories.length - 1 && (
                    <div className="border-b border-dashed border-gray-200"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* Right Pane: Subcategories + Products */}
          <div className="flex-1 h-full bg-white rounded-3xl shadow-lg flex flex-col">
            {selectedCategory ? (
              <div
                id="kiosk-right-list"
                className="p-6 overflow-y-auto flex-1 custom-scrollbar"
              >
                {/* Subcategories */}
                {getFilteredSubcategories().length > 0 && (
                  <div className="mb-8 space-y-4">
                    {getFilteredSubcategories().map((subcategory) => (
                      <div key={subcategory.id} className="pb-2">
                        <h5
                          className="font-medium text-lg text-start mb-2"
                          style={{ color: "#959595" }}
                        >
                          {subcategory.name}
                        </h5>
                        <div className="grid grid-cols-4 gap-4">
                          {getFilteredProducts()
                            .filter((p) => p.subcategoryId === subcategory.id)
                            .map((product) => (
                              <div
                                key={product.id}
                                className={`cursor-pointer hover:shadow-md transition-all duration-300 rounded-xl p-3 border ${
                                  selectedProduct?.id === product.id
                                    ? "transform scale-105 shadow-lg border-green-500"
                                    : "border-gray-100"
                                } `}
                                style={{
                                  backgroundImage: product.backgroundImage
                                    ? `url(${product.backgroundImage})`
                                    : "none",
                                  backgroundSize:
                                    product.backgroundFit || "cover",
                                  backgroundPosition: "center",
                                  backgroundRepeat: "no-repeat",
                                  backgroundColor: product.backgroundImage
                                    ? "transparent"
                                    : "white",
                                }}
                                onClick={() => handleProductSelect(product)}
                              >
                                {product.mainImage && (
                                  <div className="w-full aspect-[3/4] mb-2 relative">
                                    <Image
                                      src={product.mainImage}
                                      alt={product.name}
                                      fill
                                      className="object-contain rounded-lg"
                                    />
                                    {getProductCartQuantity(product) > 0 && (
                                      <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                                        {getProductCartQuantity(product)}
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="text-center space-y-1">
                                  <div
                                    className="text-xs font-medium truncate"
                                    style={{
                                      color: product.textColor || "#6b7280",
                                    }}
                                  >
                                    {product.name}
                                  </div>
                                  <div className="text-sm font-semibold text-green-600">
                                    {getProductPriceDisplay(product)}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Products without subcategory */}
                <div className="grid grid-cols-4 gap-4">
                  {getFilteredProducts()
                    .filter((p) => !p.subcategoryId)
                    .map((product) => (
                      <div
                        key={product.id}
                        className={`cursor-pointer hover:shadow-md transition-all duration-300 rounded-xl p-3 bg-white border ${
                          selectedProduct?.id === product.id
                            ? "transform scale-105 shadow-lg border-green-500"
                            : "border-gray-100"
                        } `}
                        onClick={() => handleProductSelect(product)}
                      >
                        {product.mainImage && (
                          <div className="w-full aspect-[3/4] mb-2 relative">
                            <Image
                              src={product.mainImage}
                              alt={product.name}
                              fill
                              className="object-contain rounded-lg"
                            />
                            {getProductCartQuantity(product) > 0 && (
                              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                                {getProductCartQuantity(product)}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="text-center space-y-1">
                          <div className="text-xs font-medium text-gray-500 truncate">
                            {product.name}
                          </div>
                          <div className="text-sm font-semibold text-green-600">
                            {getProductPriceDisplay(product)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                {/* Empty state */}
                {getFilteredSubcategories().length === 0 &&
                  getFilteredProducts().length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg
                          className="w-16 h-16 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 00-2-2M7 7h10"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-500 mb-2">
                        No items found
                      </h3>
                      <p className="text-gray-400">
                        This category doesn't have any subcategories or products
                        yet
                      </p>
                    </div>
                  )}
              </div>
            ) : (
              <div
                className="p-6 flex items-center justify-center flex-1"
                style={{ minHeight: "300px" }}
              >
                <div className="text-center">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="w-20 h-20 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 00-2-2M7 7h10"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-500 mb-2">
                    Choose a Category
                  </h3>
                  <p className="text-gray-400">
                    Select a category from the left to view subcategories and
                    products
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* end right pane */}
        </div>
        {/* end main content flex */}

        {/* Cancel Button under both lists */}
        <div className="px-6 pb-6">
          <button
            onClick={() => {
              setCart([]);
              router.push("/");
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-colors"
          >
            Cancel Order
          </button>
        </div>
      </div>
      {/* overlays outside container to avoid clipping */}
      {/* Quantity/Variant Popup */}
      {showQuantityPopup && selectedProduct && (
        <div
          className={`fixed inset-0 bg-black/10 flex items-end justify-center z-50 transition-opacity duration-300 ${
            isPopupClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={handleBackgroundClick}
        >
          <div
            className="bg-white shadow-2xl w-full transition-transform duration-300 ease-out"
            style={{
              height: "fit-content",
              minHeight: "300px",
              maxHeight: "70vh",
              borderTopLeftRadius: "3rem",
              borderTopRightRadius: "3rem",
              borderBottomLeftRadius: "0",
              borderBottomRightRadius: "0",
              transform: isPopupClosing
                ? "translateY(100%)"
                : isPopupOpening
                ? "translateY(0)"
                : "translateY(100%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-6"
              style={{
                borderTopLeftRadius: "3rem",
                borderTopRightRadius: "3rem",
              }}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-3xl font-bold mx-auto text-center flex-1">
                  {selectedProduct.hasVariants &&
                  selectedProduct.variants &&
                  selectedProduct.variants.length > 0
                    ? selectedProduct.variants[currentVariantIndex]
                        ?.variantName || "Select Option"
                    : "Quantity"}
                </h3>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col justify-between flex-1 overflow-y-auto">
              {selectedProduct.hasVariants &&
              selectedProduct.variants &&
              selectedProduct.variants.length > 0 ? (
                // Variant Selection
                <div className="flex-1">
                  {/* Current Variant Options */}
                  <div className="grid grid-cols-3 border border-gray-300 overflow-hidden">
                    {selectedProduct.variants[
                      currentVariantIndex
                    ]?.options?.map((option, index) => (
                      <button
                        key={index}
                        onClick={() =>
                          handleVariantOptionSelect(currentVariantIndex, option)
                        }
                        className={`p-6 transition-all duration-200 border-r border-b border-gray-300 last-in-row:border-r-0 ${
                          selectedVariantOptions[currentVariantIndex]?.id ===
                          option.id
                            ? "bg-green-50 shadow-inner"
                            : "hover:bg-gray-50"
                        }`}
                        style={{
                          borderRight:
                            (index + 1) % 3 === 0
                              ? "none"
                              : "1px solid #d1d5db",
                        }}
                      >
                        <div className="text-center">
                          {/* Option Image - 80% width, 1:1 ratio */}
                          {option.imageUrl && (
                            <div className="w-4/5 mx-auto aspect-square mb-4 relative">
                              <Image
                                src={option.imageUrl}
                                alt={option.name}
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                          <div className="text-green-600 text-2xl font-medium mb-2">
                            {option.name}
                          </div>
                          <div className="text-black text-3xl">
                            ฿{option.price}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Progress Indicator */}
                  {selectedProduct.variants.length > 1 && (
                    <div className="flex justify-center mb-6 px-8">
                      <div className="flex space-x-2">
                        {selectedProduct.variants.map((_, index) => (
                          <div
                            key={index}
                            className={`w-3 h-3 rounded-full ${
                              index === currentVariantIndex
                                ? "bg-green-500"
                                : index < currentVariantIndex
                                ? "bg-green-300"
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next/Add to Cart Button */}
                  <div className="px-8 pb-8">
                    <button
                      onClick={handleNextOrAddToCart}
                      disabled={!selectedVariantOptions[currentVariantIndex]}
                      className={`w-full py-6 text-3xl transition-colors rounded-2xl ${
                        selectedVariantOptions[currentVariantIndex]
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {selectedProduct.variants.length === 1 ||
                      currentVariantIndex ===
                        selectedProduct.variants.length - 1
                        ? "Add To Cart"
                        : "Next"}
                    </button>
                  </div>
                </div>
              ) : (
                // Simple Product Quantity Selection
                <div className="flex-1 px-8 pb-8">
                  {/* Quantity Controls */}
                  <div className="flex items-center justify-center gap-8 my-10">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      className="w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-4xl font-bold"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="text-5xl font-bold w-20 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      className="w-16 h-16 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-4xl font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-green-600 hover:bg-green-800 text-white py-8 text-4xl transition-colors rounded-full"
                  >
                    Add To Cart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Integrated Cart Display */}
      {showCart && (
        <div
          className="fixed inset-0 bg-gray-50 z-50 overflow-auto"
          style={{
            backgroundImage: "url(/background.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between">
            <button
              onClick={() => setShowCart(false)}
              className="relative bg-green-500 hover:bg-green-600 text-white px-5 py-5 rounded-lg font-bold transition-colors flex items-center"
            >
              <svg
                className="w-12 h-12"
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
            </button>
            <div className="relative">
              <Image
                alt="Logo"
                width={150}
                height={150}
                src="/logo.png"
                className="cursor-pointer object-cover"
                style={{ color: "transparent" }}
              />
            </div>
            <div className="relative bg-green-500 hover:bg-green-600 text-white px-5 py-5 rounded-lg font-bold transition-colors flex items-center">
              <div className="text-center w-12 h-12" style={{ color: "white" }}>
                <div className="text-2xl font-bold" style={{ color: "white" }}>
                  {cart.reduce(
                    (total, item) => total + (item.quantity || 1),
                    0
                  )}
                </div>
                <div className="text-s" style={{ color: "white" }}>
                  {t("itemsCount", {
                    count: cart.reduce(
                      (total, item) => total + (item.quantity || 1),
                      0
                    ),
                  })
                    .split(" ")
                    .pop()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-4">
                {t("orderSummary")}
              </h2>
              <p className="text-xl text-center text-gray-600 mb-12">
                {t("reviewBeforePayment")}
              </p>

              {/* Cart Items */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
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
                                      {variantValue?.name || variantValue}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          <div className="text-green-600 font-semibold">
                            ฿{item.price} {item.unit || "each"}
                          </div>
                          {/* Points Information */}
                          <div className="text-sm text-blue-600 mt-1">
                            +{Math.floor(item.price * 0.01)} points (
                            {(((item.price * 0.01) / item.price) * 100).toFixed(
                              1
                            )}
                            %)
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
                          <div className="text-lg font-semibold w-8 text-center">
                            {item.quantity || 1}
                          </div>
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

                        {/* Item Total */}
                        <div className="text-right min-w-[100px]">
                          <div className="text-xl font-bold text-green-600">
                            ฿{item.price * (item.quantity || 1)}
                          </div>
                          <div className="text-sm text-blue-600">
                            +
                            {Math.floor(
                              item.price * (item.quantity || 1) * 0.01
                            )}{" "}
                            pts total
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
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

                  {/* Cashback Points Display */}
                  {customer && (
                    <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-2xl">🎁</span>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-blue-700">
                            Cashback Points
                          </div>
                          <div className="text-3xl font-bold text-blue-600">
                            +{cashbackPoints} points
                          </div>
                          <div className="text-sm text-gray-600">
                            You will earn these points with this purchase
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!customer && (
                    <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200 mt-4">
                      <div className="text-center">
                        <span className="text-2xl mb-2 block">👤</span>
                        <div className="text-lg font-semibold text-yellow-700">
                          Sign in to earn points!
                        </div>
                        <div className="text-sm text-gray-600">
                          Register as a member to earn cashback points
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <h3 className="text-2xl font-bold mb-6">
                  {t("paymentMethod")}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      paymentMethod === "cash"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">💵</div>
                      <div className="text-xl font-semibold">Cash</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      paymentMethod === "card"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">💳</div>
                      <div className="text-xl font-semibold">Card</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("crypto")}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      paymentMethod === "crypto"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">₿</div>
                      <div className="text-xl font-semibold">Crypto</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="text-red-700 text-center">{error}</div>
                </div>
              )}

              {/* Add More Items and Cancel Order Buttons */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setShowCart(false)}
                  className="py-6 text-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-colors"
                >
                  Add More Items
                </button>
                <button
                  onClick={() => {
                    setCart([]);
                    sessionStorage.removeItem("cart");
                    setShowCart(false);
                  }}
                  className="py-6 text-xl font-semibold bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-colors"
                >
                  Cancel Order
                </button>
              </div>

              {/* Action Buttons */}
              <div className="">
                {/* Complete Order Button */}
                <button
                  onClick={processPayment}
                  disabled={processing}
                  className={`w-full py-8 text-3xl rounded-2xl transition-colors ${
                    processing
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {processing
                    ? t("processing")
                    : `Complete Order ฿${getTotalPrice()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Complete Modal */}
      {showOrderComplete && completedOrder && (
        <>
          {/* Thermal Receipt Layout - Hidden on screen, visible when printing */}
          <div className="print:block hidden">
            <style jsx>{`
              @media print {
                @page {
                  size: 80mm auto;
                  margin: 0;
                }
                body {
                  margin: 0;
                  padding: 0;
                  font-family: "Courier New", monospace;
                  font-size: 12px;
                  line-height: 1.2;
                }
              }
            `}</style>

            <div
              style={{
                width: "80mm",
                padding: "2mm",
                fontFamily: "Courier New, monospace",
                fontSize: "12px",
              }}
            >
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: "4mm" }}>
                <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                  CANDY KUSH
                </div>
                <div style={{ fontSize: "10px" }}>Tel: +66-xxx-xxx-xxxx</div>
                <div
                  style={{ borderTop: "1px dashed #000", margin: "2mm 0" }}
                ></div>
              </div>

              {/* Order Info */}
              <div style={{ marginBottom: "4mm" }}>
                <div>
                  {t("date")}:{" "}
                  {new Date(completedOrder.timestamp).toLocaleDateString()}
                </div>
                <div>
                  {t("time")}:{" "}
                  {new Date(completedOrder.timestamp).toLocaleTimeString()}
                </div>
                {completedOrder.transactionId && (
                  <div>ID: {completedOrder.transactionId}</div>
                )}
                <div
                  style={{ borderTop: "1px dashed #000", margin: "2mm 0" }}
                ></div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: "4mm" }}>
                {completedOrder.items.map((item, index) => (
                  <div key={index} style={{ marginBottom: "2mm" }}>
                    <div style={{ fontWeight: "bold" }}>{item.name}</div>
                    {item.variants && Object.keys(item.variants).length > 0 && (
                      <div style={{ fontSize: "10px", marginLeft: "2mm" }}>
                        {Object.entries(item.variants).map(
                          ([variantName, variantValue]) => (
                            <div key={variantName}>
                              {variantName}:{" "}
                              {variantValue?.name || variantValue}
                            </div>
                          )
                        )}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>Qty: {item.quantity || 1}</span>
                      <span>฿{item.price * (item.quantity || 1)}</span>
                    </div>
                  </div>
                ))}
                <div
                  style={{ borderTop: "1px dashed #000", margin: "2mm 0" }}
                ></div>
              </div>

              {/* Total */}
              <div style={{ marginBottom: "4mm" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  <span>{t("total")}</span>
                  <span>฿{completedOrder.total}</span>
                </div>

                {/* Payment Method */}
                <div style={{ fontSize: "12px", marginTop: "2mm" }}>
                  <div>
                    {t("paymentMethodLabel")}{" "}
                    {completedOrder.paymentMethod === "bank_transfer"
                      ? "Bank Transfer"
                      : completedOrder.paymentMethod === "crypto"
                      ? "Crypto"
                      : "Cash"}
                  </div>
                </div>

                {completedOrder.customer && (
                  <div style={{ fontSize: "10px", marginTop: "2mm" }}>
                    <div>
                      {t("customerLabel")}: {completedOrder.customer.name}
                    </div>
                    <div>
                      {t("pointsEarned")}: {completedOrder.cashbackPoints || 0}
                    </div>
                    {completedOrder.cashbackPoints > 0 && (
                      <div>
                        {t("cashbackPoints")}: {completedOrder.cashbackPoints}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: "10px",
                  marginTop: "4mm",
                }}
              >
                <div
                  style={{ borderTop: "1px dashed #000", margin: "2mm 0" }}
                ></div>
                <div>{t("thankYouPurchase")}</div>
                <div>{t("visitUsAgain")}</div>
              </div>
            </div>
          </div>

          {/* Screen Display Modal - Hidden when printing */}
          <div className="print:hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      ></path>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Order Complete!
                  </h2>
                  <p className="text-gray-600">Thank you for your purchase</p>
                </div>

                {/* Order Details */}
                <div className="border-t border-b border-gray-200 py-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">
                      {completedOrder.orderId}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(completedOrder.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">
                      {new Date(completedOrder.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Payment:</span>
                    <span className="font-medium capitalize">
                      {completedOrder.paymentMethod}
                    </span>
                  </div>
                </div>

                {/* Customer Info */}
                {completedOrder.customer && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-800 mb-2">Customer</h3>
                    <p className="text-gray-600">
                      {completedOrder.customer.name}
                    </p>
                    {completedOrder.cashbackPoints > 0 && (
                      <p className="text-green-600 font-medium">
                        Cashback: {completedOrder.cashbackPoints} points earned!
                      </p>
                    )}
                  </div>
                )}

                {/* Items */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-800 mb-3">
                    Items Ordered
                  </h3>
                  <div className="space-y-2">
                    {completedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity || 1}
                          </p>
                        </div>
                        <p className="font-medium">
                          ฿
                          {((item.price || 0) * (item.quantity || 1)).toFixed(
                            2
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 mt-3 pt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-lg">Total:</span>
                      <span className="font-bold text-lg">
                        ฿{completedOrder.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handlePrintThermalReceipt}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Print Receipt
                  </button>
                  <button
                    onClick={handleStartNewOrder}
                    className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Start New Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
