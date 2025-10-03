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
import { PendingPointsService } from "../../lib/pendingPointsService";
import CustomerSection from "../../components/CustomerSection";
import KioskHeader from "../../components/KioskHeader";
import { VisitService } from "../../lib/visitService";
import { useTranslation } from "react-i18next";
import i18n, { supportedLanguages } from "../../i18n/index";
import ReactCountryFlag from "react-country-flag";

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
  const [itemCashbackDetails, setItemCashbackDetails] = useState([]);
  const [visitRecorded, setVisitRecorded] = useState(false);
  const [showOrderComplete, setShowOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const firstWindowRef = useRef(null);
  const [firstWindowHeight, setFirstWindowHeight] = useState(null);
  const [cartTimer, setCartTimer] = useState(60);
  const cartTimerRef = useRef(null);
  const [sessionTimer, setSessionTimer] = useState(60); // 60 seconds = 1 minute
  const sessionTimerRef = useRef(null);

  // Language and modal states
  const [selectedLanguage, setSelectedLanguage] = useState(
    i18n.language || "en"
  );
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);

  // Add to cart animation states
  const [showCartAnimation, setShowCartAnimation] = useState(false);
  const [animationProduct, setAnimationProduct] = useState(null);

  const router = useRouter();
  const { t } = useTranslation();

  // Language helper functions
  const getLanguageData = (lng) => {
    const map = {
      en: { countryCode: "GB", name: "English" },
      th: { countryCode: "TH", name: "Thai" },
      es: { countryCode: "ES", name: "Spanish" },
      fr: { countryCode: "FR", name: "French" },
      de: { countryCode: "DE", name: "German" },
      it: { countryCode: "IT", name: "Italian" },
      ja: { countryCode: "JP", name: "Japanese" },
      zh: { countryCode: "CN", name: "Chinese" },
      ru: { countryCode: "RU", name: "Russian" },
      pt: { countryCode: "PT", name: "Portuguese" },
      hi: { countryCode: "IN", name: "Hindi" },
      ko: { countryCode: "KR", name: "Korean" },
      nl: { countryCode: "NL", name: "Dutch" },
      tr: { countryCode: "TR", name: "Turkish" },
    };
    return map[lng] || { countryCode: "UN", name: "Unknown" };
  };

  const toggleLanguageDropdown = () => {
    resetSessionTimer(); // Reset session timer on user interaction
    setShowLanguageDropdown(!showLanguageDropdown);
  };

  const selectLanguage = (lng) => {
    resetSessionTimer(); // Reset session timer on user interaction
    setSelectedLanguage(lng);
    i18n.changeLanguage(lng);
    localStorage.setItem("i18nextLng", lng);
    setShowLanguageDropdown(false);
    console.log(`Menu page: Language changed to ${lng}`);
  };

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
        const noMember = sessionStorage.getItem("noMember");

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
        } else if (noMember === "true") {
          // Set "No Member" customer state
          setCustomer({
            name: "No Member",
            memberId: null,
            tier: null,
            points: 0,
            totalPoints: 0,
            isNoMember: true,
          });
        } else {
          // No customer data and no "No Member" flag, redirect to scanner
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

        // Map products to include categoryId from subcategory or direct categoryId
        const productsWithCategoryId = productsData.map((product) => {
          const subcategory = subcategoriesData.find(
            (sub) => sub.id === product.subcategoryId
          );

          // Use categoryId from subcategory if exists, otherwise use direct categoryId from product
          const mappedProduct = {
            ...product,
            categoryId: subcategory
              ? subcategory.categoryId
              : product.categoryId,
          };

          // Debug log to see if categoryId is being mapped correctly
          if (
            product.name === "Testing Product" ||
            product.name.includes("Product 1") ||
            product.name === "Product Without Subcategory"
          ) {
            console.log("🔍 Product mapping debug:", {
              productName: product.name,
              subcategoryId: product.subcategoryId,
              directCategoryId: product.categoryId,
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

    // Make TransactionService available for debugging
    if (typeof window !== "undefined") {
      window.TransactionService = TransactionService;
      console.log("🔧 TransactionService available globally for debugging");
      console.log("🧪 Try: window.TransactionService.testFirebaseWrite()");
      console.log("🧪 Try: window.TransactionService.createTestTransaction()");
    }
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
    resetSessionTimer(); // Reset session timer on user interaction

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
    console.log("handleBack called, cart length:", cart.length);
    // Temporarily always show modal for testing
    console.log("Showing back modal (test mode)");
    setShowBackModal(true);
    console.log("showBackModal state after setting:", showBackModal);

    // Original logic:
    // if (cart.length > 0) {
    //   console.log("Showing back modal");
    //   setShowBackModal(true);
    //   console.log("showBackModal state after setting:", showBackModal);
    // } else {
    //   console.log("Going to scanner page");
    //   router.push("/scanner");
    // }
  };

  const confirmBack = () => {
    // Clear cart timer
    if (cartTimerRef.current) {
      clearTimeout(cartTimerRef.current);
      cartTimerRef.current = null;
    }
    setCartTimer(0);

    // Clear session data
    sessionStorage.removeItem("cart");
    sessionStorage.removeItem("customerCode");
    sessionStorage.removeItem("currentCustomer");
    sessionStorage.removeItem("selectedPaymentMethod");
    sessionStorage.removeItem("lastOrder");
    sessionStorage.removeItem("receiptData");

    setShowBackModal(false);
    router.push("/scanner");
  };

  const handleCancelOrder = () => {
    if (cart.length > 0) {
      setShowCancelModal(true);
    } else {
      router.push("/");
    }
  };

  const confirmCancelOrder = () => {
    // Clear cart timer
    if (cartTimerRef.current) {
      clearTimeout(cartTimerRef.current);
      cartTimerRef.current = null;
    }
    setCartTimer(0);

    // Clear all data
    setCart([]);
    sessionStorage.removeItem("cart");
    sessionStorage.removeItem("customerCode");
    sessionStorage.removeItem("currentCustomer");
    sessionStorage.removeItem("selectedPaymentMethod");
    sessionStorage.removeItem("lastOrder");
    sessionStorage.removeItem("receiptData");

    setShowCancelModal(false);
    router.push("/");
  };

  const handleCart = () => {
    resetSessionTimer(); // Reset session timer on user interaction
    if (cart.length > 0) {
      setShowCart(true);
    }
  };

  // Handle product selection for quantity popup
  const handleProductSelect = (product) => {
    resetSessionTimer(); // Reset session timer on user interaction
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

    // Trigger animation first
    setAnimationProduct({
      name: `${selectedProduct.name} (${variantDescription})`,
      image: selectedProduct.mainImage,
      quantity: 1,
    });
    setShowCartAnimation(true);
    console.log(
      "🎬 Add to cart animation triggered for variant:",
      selectedProduct.name
    );

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

    // Close popup after animation starts
    setTimeout(() => {
      closeQuantityPopup();
    }, 200);

    // Hide animation after it completes
    setTimeout(() => {
      setShowCartAnimation(false);
      setAnimationProduct(null);
    }, 1000);
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
        customerId: customer?.id || null,
        customerName: customer
          ? customer.isNoMember
            ? "No Member"
            : `${customer.name} ${customer.lastName || ""}`.trim()
          : "",
        items: cart,
        total: getTotalPrice(),
        paymentMethod: paymentMethod,
        cashbackEarned: customer?.isNoMember ? 0 : cashbackPoints,
        timestamp: new Date(),
        // Add point details
        pointsEarned: customer?.isNoMember ? 0 : cashbackPoints,
        pointDetails: customer?.isNoMember
          ? []
          : window.menuCashbackDetails || [],
        pointCalculation: {
          totalPointsEarned: customer?.isNoMember ? 0 : cashbackPoints,
          calculationMethod: customer?.isNoMember ? "none" : "category-based",
          items: customer?.isNoMember ? [] : window.menuCashbackDetails || [],
        },
      };

      console.log("🔍 Processing payment with data:", transactionData);

      const result = await TransactionService.createTransaction(
        transactionData
      );

      console.log("💳 Transaction result:", result);
      console.log("🆔 Transaction ID from result:", result.transactionId);
      console.log("🔧 Firebase document ID:", result.id);

      // Debug: Check what we're actually using for orderId
      console.log("🎯 Will use for orderId:", result.transactionId);
      console.log("🎯 Will use for internal transactionId:", result.id);

      // If we get here without error, transaction was successful
      console.log(
        "✅ Payment successful, transaction ID:",
        result.transactionId
      );

      // Update customer points if customer exists and is not "No Member"
      if (customer && !customer.isNoMember && cashbackPoints > 0) {
        try {
          // Create pending points instead of directly adding to customer
          const pendingPointData = {
            customerId: customer.id,
            customerName: `${customer.name} ${customer.lastName || ""}`.trim(),
            customerCode: customer.customerCode || "",
            pointsAmount: cashbackPoints,
            transactionId: result.transactionId,
            orderId: result.transactionId,
            reason: "Purchase Cashback",
            details: `Earned ${cashbackPoints} points from kiosk purchase`,
            items: window.menuCashbackDetails || [],
            pointCalculation: {
              totalPointsEarned: cashbackPoints,
              calculationMethod: "category-based",
              breakdown: window.menuCashbackDetails || [],
            },
            purchaseAmount: getTotalPrice(),
            paymentMethod: paymentMethod,
            source: "kiosk",
          };

          await PendingPointsService.createPendingPoints(pendingPointData);
          console.log(
            `Created pending points (${cashbackPoints}) for customer ${customer.name} - requires admin approval`
          );
        } catch (pointsError) {
          console.error("Error creating pending points:", pointsError);
          // Don't fail the transaction if pending points creation fails
        }
      }

      // Save order data for order-complete modal
      const orderDataForComplete = {
        id: result.transactionId,
        orderId: result.transactionId, // Use transactionId as orderId
        items: cart,
        total: getTotalPrice(),
        customer: customer,
        cashbackPoints: customer?.isNoMember ? 0 : cashbackPoints,
        transactionId: result.id,
        paymentMethod: paymentMethod,
        timestamp: new Date().toISOString(),
      };

      // Debug: Log what we're setting as orderId
      console.log("🎯 Setting orderId to:", orderDataForComplete.orderId);
      console.log("🎯 Complete order data:", orderDataForComplete);

      // Set completed order data and show modal
      setCompletedOrder(orderDataForComplete);

      // For KIOSK: After order complete, redirect to home for next customer
      setTimeout(() => {
        // Clear cart timer
        if (cartTimerRef.current) {
          clearTimeout(cartTimerRef.current);
          cartTimerRef.current = null;
        }
        setCartTimer(0);

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
      }, 60000); // Show success for 60 seconds then redirect

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
    if (!customer || cart.length === 0 || customer.isNoMember) {
      setCashbackPoints(0);
      return;
    }

    try {
      let totalCashback = 0;
      const itemCashbackDetails = [];

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

          console.log("Item total:", itemTotal, "Item cashback:", itemCashback);
          totalCashback += itemCashback;
        } else {
          console.log("No categoryId found for item:", item.name);
        }
      }

      console.log("Total cashback calculated:", totalCashback);
      setCashbackPoints(totalCashback);
      setItemCashbackDetails(itemCashbackDetails);

      // Store detailed cashback info for later use in transaction
      window.menuCashbackDetails = itemCashbackDetails;
    } catch (error) {
      console.error("Error calculating cashback:", error);
      setCashbackPoints(0);
      setItemCashbackDetails([]);
      window.menuCashbackDetails = [];
    }
  }, [customer, cart]);

  // Calculate cashback when cart or customer changes
  useEffect(() => {
    calculateCashbackPoints();
  }, [cart, customer, calculateCashbackPoints]);

  // Cart timer - 60 second timeout when cart is open
  useEffect(() => {
    if (showCart) {
      // Clear any existing timer
      if (cartTimerRef.current) {
        clearTimeout(cartTimerRef.current);
      }

      // Start countdown
      setCartTimer(60);

      // Create timer that decrements every second
      const countdownInterval = setInterval(() => {
        setCartTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            // Clear the timeout timer as well
            if (cartTimerRef.current) {
              clearTimeout(cartTimerRef.current);
              cartTimerRef.current = null;
            }

            // Clear all session data
            sessionStorage.removeItem("cart");
            sessionStorage.removeItem("customerCode");
            sessionStorage.removeItem("currentCustomer");
            sessionStorage.removeItem("selectedPaymentMethod");
            sessionStorage.removeItem("lastOrder");
            sessionStorage.removeItem("receiptData");

            // Reset state and schedule navigation
            setShowCart(false);
            setCustomer(null);
            setCart([]);
            setSelectedProduct(null);

            // Use setTimeout to avoid setState during render
            setTimeout(() => {
              router.push("/");
            }, 0);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set timeout for 60 seconds
      cartTimerRef.current = setTimeout(() => {
        clearInterval(countdownInterval);

        // Clear all session data
        sessionStorage.removeItem("cart");
        sessionStorage.removeItem("customerCode");
        sessionStorage.removeItem("currentCustomer");
        sessionStorage.removeItem("selectedPaymentMethod");
        sessionStorage.removeItem("lastOrder");
        sessionStorage.removeItem("receiptData");

        // Reset state and go back to home page
        setShowCart(false);
        setCustomer(null);
        setCart([]);
        setSelectedProduct(null);
        router.push("/");
      }, 60000);

      // Cleanup function
      return () => {
        clearInterval(countdownInterval);
        if (cartTimerRef.current) {
          clearTimeout(cartTimerRef.current);
          cartTimerRef.current = null;
        }
      };
    } else {
      // Clear timer when cart is closed
      if (cartTimerRef.current) {
        clearTimeout(cartTimerRef.current);
        cartTimerRef.current = null;
      }
      setCartTimer(0);
    }
  }, [showCart]);

  // Session timer - 5 minute timeout for main menu
  useEffect(() => {
    if (!showCart) {
      // Start session timer only when not in cart
      const startSessionTimer = () => {
        // Clear any existing timer
        if (sessionTimerRef.current) {
          clearTimeout(sessionTimerRef.current);
        }

        // Start countdown
        setSessionTimer(60); // 5 minutes = 300 seconds

        // Create timer that decrements every second
        const sessionCountdownInterval = setInterval(() => {
          setSessionTimer((prev) => {
            if (prev <= 1) {
              clearInterval(sessionCountdownInterval);

              // Clear all session data
              sessionStorage.removeItem("cart");
              sessionStorage.removeItem("customerCode");
              sessionStorage.removeItem("currentCustomer");
              sessionStorage.removeItem("selectedPaymentMethod");
              sessionStorage.removeItem("lastOrder");
              sessionStorage.removeItem("receiptData");

              // Reset state and go to home
              setCustomer(null);
              setCart([]);
              setSelectedProduct(null);

              // Use setTimeout to avoid setState during render
              setTimeout(() => {
                router.push("/");
              }, 0);

              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Set timeout for 5 minutes
        sessionTimerRef.current = setTimeout(() => {
          clearInterval(sessionCountdownInterval);

          // Clear all session data
          sessionStorage.removeItem("cart");
          sessionStorage.removeItem("customerCode");
          sessionStorage.removeItem("currentCustomer");
          sessionStorage.removeItem("selectedPaymentMethod");
          sessionStorage.removeItem("lastOrder");
          sessionStorage.removeItem("receiptData");

          // Reset state and go to home
          setCustomer(null);
          setCart([]);
          setSelectedProduct(null);
          router.push("/");
        }, 60000); // 5 minutes

        // Store interval reference for cleanup
        return sessionCountdownInterval;
      };

      const sessionCountdownInterval = startSessionTimer();

      // Cleanup function
      return () => {
        if (sessionCountdownInterval) {
          clearInterval(sessionCountdownInterval);
        }
        if (sessionTimerRef.current) {
          clearTimeout(sessionTimerRef.current);
          sessionTimerRef.current = null;
        }
      };
    } else {
      // Clear session timer when cart is open
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      setSessionTimer(0);
    }
  }, [showCart, router]);

  // Reset session timer on user interactions
  const resetSessionTimer = useCallback(() => {
    if (!showCart && sessionTimerRef.current) {
      setSessionTimer(60); // Reset to 60 seconds
    }
  }, [showCart]);

  // Handle quantity change
  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  // Handle add to cart
  const handleAddToCart = () => {
    resetSessionTimer(); // Reset session timer on user interaction
    if (selectedProduct) {
      // Trigger animation first
      setAnimationProduct({
        name: selectedProduct.name,
        image: selectedProduct.mainImage,
        quantity: quantity,
      });
      setShowCartAnimation(true);
      console.log(
        "🎬 Add to cart animation triggered for:",
        selectedProduct.name
      );

      // Determine the correct price based on customer status
      let productPrice = selectedProduct.price;
      if (customer && !customer.isNoMember && selectedProduct.memberPrice) {
        productPrice = selectedProduct.memberPrice;
      }

      const cartItem = {
        id: selectedProduct.productId,
        name: selectedProduct.name,
        price: productPrice,
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

      // Close popup after animation starts
      setTimeout(() => {
        setShowQuantityPopup(false);
        setSelectedProduct(null);
        setQuantity(1);
      }, 200);

      // Hide animation after it completes
      setTimeout(() => {
        setShowCartAnimation(false);
        setAnimationProduct(null);
      }, 1000);
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
    // Clear cart timer
    if (cartTimerRef.current) {
      clearTimeout(cartTimerRef.current);
      cartTimerRef.current = null;
    }
    setCartTimer(0);

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
      // Simple product - handle different pricing scenarios
      if (customer && customer.isNoMember) {
        // No member - show regular price with member price information if available
        if (product.memberPrice && product.memberPrice !== product.price) {
          return (
            <div className="flex flex-col items-center">
              <span className="text-green-600 font-semibold text-lg">
                ฿{product.price}
              </span>
              <div className="text-lg text-orange-600 text-center">
                <span className="line-through">฿{product.price}</span>
                <span className="ml-1">→ ฿{product.memberPrice}</span>
              </div>
              <span className="text-base text-orange-600">with membership</span>
            </div>
          );
        } else {
          // No member price available, just show regular price
          return `฿${product.price}`;
        }
      } else if (customer && !customer.isNoMember) {
        // Regular member - show member price if available, otherwise regular price
        const price = product.memberPrice ? product.memberPrice : product.price;
        return `฿${price}`;
      } else {
        // Fallback - show regular price
        return `฿${product.price}`;
      }
    }

    // Variant product - calculate price range
    let allPrices = [];
    product.variants.forEach((variant) => {
      if (variant.options && variant.options.length > 0) {
        variant.options.forEach((option) => {
          let priceToUse = option.price;

          // If customer is a member and member price is available and lower, use member price
          if (
            customer &&
            !customer.isNoMember &&
            option.memberPrice &&
            option.memberPrice < option.price
          ) {
            priceToUse = option.memberPrice;
          }

          if (priceToUse) {
            allPrices.push(priceToUse);
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

  // Helper function to get cashback details for a specific cart item
  const getItemCashbackInfo = (cartItem) => {
    const cashbackDetail = itemCashbackDetails.find(
      (detail) =>
        detail.productId === cartItem.productId ||
        detail.productId === cartItem.id
    );

    if (cashbackDetail) {
      return {
        pointsPerUnit: Math.floor(
          (cartItem.price * cashbackDetail.cashbackPercentage) / 100
        ),
        totalPoints: cashbackDetail.pointsEarned,
        percentage: cashbackDetail.cashbackPercentage,
      };
    }

    // Fallback to 0 if no cashback data found
    return {
      pointsPerUnit: 0,
      totalPoints: 0,
      percentage: 0,
    };
  };

  // Removed scroll buttons per request; panes will use native scroll.

  if (loading) {
    return (
      <div
        className="h-screen flex flex-col bg-gray-50 font-['Poppins']"
        style={{
          backgroundImage: "url(/background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Header Skeleton */}
        <div className="p-4 flex items-center justify-between">
          <div className="bg-gray-300 rounded-lg w-20 h-20 animate-pulse"></div>
          <div className="bg-gray-300 rounded-lg w-32 h-32 animate-pulse"></div>
          <div className="flex items-center space-x-4">
            <div className="bg-gray-300 rounded-lg w-20 h-20 animate-pulse"></div>
            <div className="bg-gray-300 rounded-lg w-20 h-20 animate-pulse"></div>
          </div>
        </div>

        {/* Customer Section Skeleton */}
        <div className="px-6 py-4">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-300 rounded-full w-16 h-16 animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="bg-gray-300 h-6 w-48 animate-pulse rounded"></div>
                <div className="bg-gray-300 h-4 w-32 animate-pulse rounded"></div>
              </div>
              <div className="bg-gray-300 h-10 w-24 animate-pulse rounded"></div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 min-h-0 p-6 flex gap-6 overflow-hidden">
          {/* Left Panel Skeleton */}
          <div className="w-1/5 h-full bg-white rounded-3xl shadow-lg p-4">
            <div className="space-y-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="space-y-3">
                  <div className="bg-gray-300 w-full aspect-square animate-pulse rounded-lg"></div>
                  <div className="bg-gray-300 h-4 w-3/4 mx-auto animate-pulse rounded"></div>
                  {index < 5 && (
                    <div className="border-b border-dashed border-gray-200"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel Skeleton */}
          <div className="flex-1 h-full bg-white rounded-3xl shadow-lg p-6">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(12)].map((_, index) => (
                <div key={index} className="space-y-3">
                  <div className="bg-gray-300 w-full aspect-[3/4] animate-pulse rounded-lg"></div>
                  <div className="bg-gray-300 h-4 w-full animate-pulse rounded"></div>
                  <div className="bg-gray-300 h-4 w-2/3 animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cancel Button Skeleton */}
        <div className="px-6 pb-6">
          <div className="bg-gray-300 w-full h-16 animate-pulse rounded-xl"></div>
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
        {/* Custom Header with Language Selector */}
        <div className="p-4 flex items-center justify-between">
          {/* Back Button - Left */}
          <button
            onClick={handleBack}
            className="bg-green-500 hover:bg-green-600 text-white px-5 py-5 rounded-lg font-bold transition-colors flex items-center"
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
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>

          {/* Logo - Center */}
          <div className="ml-20 flex flex-col items-center">
            <div className="relative">
              <style jsx>{`
                @keyframes smokeFloat1 {
                  0% {
                    opacity: 0.6;
                    transform: translateY(0px) translateX(0px) scale(0.8)
                      rotate(0deg);
                  }
                  25% {
                    opacity: 0.8;
                    transform: translateY(-8px) translateX(2px) scale(0.9)
                      rotate(3deg);
                  }
                  50% {
                    opacity: 0.7;
                    transform: translateY(-18px) translateX(-1px) scale(1.1)
                      rotate(-2deg);
                  }
                  75% {
                    opacity: 0.4;
                    transform: translateY(-30px) translateX(3px) scale(1.3)
                      rotate(5deg);
                  }
                  100% {
                    opacity: 0;
                    transform: translateY(-45px) translateX(-2px) scale(1.6)
                      rotate(-3deg);
                  }
                }

                @keyframes smokeFloat2 {
                  0% {
                    opacity: 0.5;
                    transform: translateY(0px) translateX(0px) scale(0.7)
                      rotate(0deg);
                  }
                  20% {
                    opacity: 0.9;
                    transform: translateY(-5px) translateX(-2px) scale(0.85)
                      rotate(-4deg);
                  }
                  40% {
                    opacity: 0.8;
                    transform: translateY(-12px) translateX(1px) scale(1)
                      rotate(2deg);
                  }
                  60% {
                    opacity: 0.6;
                    transform: translateY(-22px) translateX(-3px) scale(1.2)
                      rotate(-6deg);
                  }
                  80% {
                    opacity: 0.3;
                    transform: translateY(-35px) translateX(2px) scale(1.4)
                      rotate(4deg);
                  }
                  100% {
                    opacity: 0;
                    transform: translateY(-50px) translateX(-1px) scale(1.7)
                      rotate(-2deg);
                  }
                }

                @keyframes smokeFloat3 {
                  0% {
                    opacity: 0.7;
                    transform: translateY(0px) translateX(0px) scale(0.9)
                      rotate(0deg);
                  }
                  30% {
                    opacity: 0.85;
                    transform: translateY(-10px) translateX(3px) scale(1)
                      rotate(6deg);
                  }
                  60% {
                    opacity: 0.5;
                    transform: translateY(-25px) translateX(-2px) scale(1.25)
                      rotate(-4deg);
                  }
                  100% {
                    opacity: 0;
                    transform: translateY(-42px) translateX(4px) scale(1.8)
                      rotate(8deg);
                  }
                }

                @keyframes smokeDrift {
                  0%,
                  100% {
                    transform: translateX(0px);
                  }
                  50% {
                    transform: translateX(3px);
                  }
                }

                .smoke-path-1 {
                  animation: smokeFloat1 6s ease-out infinite,
                    smokeDrift 3s ease-in-out infinite;
                  filter: blur(1px);
                  opacity: 0.6;
                }

                .smoke-path-2 {
                  animation: smokeFloat2 7s ease-out infinite 1.5s,
                    smokeDrift 4s ease-in-out infinite 0.5s;
                  filter: blur(0.8px);
                  opacity: 0.5;
                }

                .smoke-path-3 {
                  animation: smokeFloat3 5.5s ease-out infinite 3s,
                    smokeDrift 3.5s ease-in-out infinite 1s;
                  filter: blur(1.2px);
                  opacity: 0.7;
                }

                .smoke-container {
                  animation: smokeDrift 8s ease-in-out infinite;
                }
              `}</style>
              <svg
                version="1.1"
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                x="0px"
                y="0px"
                viewBox="0 0 94.62 192.14"
                enableBackground="new 0 0 94.62 192.14"
                xmlSpace="preserve"
                className="absolute w-16 h-16 top-10 -left-3 smoke-container"
              >
                <defs>
                  <filter id="smokeFilter">
                    <feTurbulence
                      baseFrequency="0.02 0.1"
                      numOctaves="3"
                      result="turbulence"
                    />
                    <feDisplacementMap
                      in="SourceGraphic"
                      in2="turbulence"
                      scale="2"
                    />
                  </filter>
                </defs>
                <g id="Layer_1">
                  <g>
                    <g>
                      <path
                        className="smoke-path-1"
                        fill="#FFFFFF"
                        filter="url(#smokeFilter)"
                        d="M75.25,176.65c-1.7,1.31-5.55-0.58-7.11-1.49c-2.12-1.23-4.1-2.93-5.51-4.95 c-2.21-3.19-3.13-7.06-4.23-10.77c-0.96-3.23-2.11-6.43-3.65-9.44c-1.56-3.06-3.88-5.45-5.64-8.34 c-0.01-0.01,2.57,0.18,2.84,0.25c0.84,0.23,1.67,0.57,2.46,0.93c1.67,0.76,3.21,1.79,4.59,2.99c2.84,2.49,5,5.75,6.29,9.29 c1.69,4.64,2.05,9.76,4.33,14.14C71.1,172.09,73.62,174.02,75.25,176.65z"
                      ></path>
                      <path
                        className="smoke-path-2"
                        fill="#FFFFFF"
                        filter="url(#smokeFilter)"
                        d="M32.97,140.33c-1.99,0.35-4.27-4.02-5.02-5.32c-1.46-2.52-2.58-5.24-3.17-8.1 c-0.91-4.42-0.5-9.17,1.59-13.17c2.55-4.88,7.2-8.11,10.36-12.53c1.71-2.39,2.84-5.13,3.67-7.94c0.8-2.69,0.9-5.88,1.95-8.42 c1.91,3.13,2.59,8.08,2.72,11.7c0.14,4.09-0.82,8.13-3.08,11.57c-2.25,3.41-5.59,6.05-7.58,9.62c-1.68,3.01-2.29,6.51-2.3,9.95 c-0.01,3.6,0.66,7.1,1.24,10.63C33.58,139.69,33.38,140.25,32.97,140.33z"
                      ></path>
                      <path
                        className="smoke-path-3"
                        fill="#FFFFFF"
                        filter="url(#smokeFilter)"
                        d="M14.35,88.29c1.35-3.51,4.36-6.23,6.51-9.25c2.23-3.14,3.32-7.08,2.97-10.92 c-0.53-5.86-4.07-10.79-6.54-15.95c-2.57-5.37-4.23-11.41-3.27-17.39c0.76-4.77,3.29-9.14,6.88-12.36 c2.57-2.3,9.11-6.09,12.57-5.63c-1.14,2.51-4.27,4.09-6.22,5.97c-3.18,3.05-5.13,7.34-5.35,11.74 c-0.54,10.93,8.97,20.17,9.53,31.09c0.27,5.17-1.65,10.21-4.75,14.29c-1.59,2.1-3.61,4.11-5.71,5.69 C19.18,86.91,16.65,88.4,14.35,88.29z"
                      ></path>
                    </g>
                  </g>
                </g>
              </svg>
              <Image
                alt="Logo"
                width={150}
                height={150}
                src="/logo.png"
                className="cursor-pointer object-cover"
                style={{ color: "transparent" }}
              />
            </div>
            {/* Session Timer Display */}
            {!showCart && sessionTimer > 0 && (
              <div className="mt-2">
                <div
                  className={`inline-flex items-center rounded-lg px-3 py-1 transition-colors duration-200 ${
                    sessionTimer <= 60
                      ? "bg-red-100 border border-red-300"
                      : sessionTimer <= 180
                      ? "bg-orange-100 border border-orange-300"
                      : "bg-blue-100 border border-blue-300"
                  }`}
                >
                  <svg
                    className={`w-4 h-4 mr-2 ${
                      sessionTimer <= 60
                        ? "text-red-600"
                        : sessionTimer <= 180
                        ? "text-orange-600"
                        : "text-blue-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span
                    className={`font-medium text-sm ${
                      sessionTimer <= 60
                        ? "text-red-800"
                        : sessionTimer <= 180
                        ? "text-orange-800"
                        : "text-blue-800"
                    }`}
                  >
                    Session expires in: {Math.floor(sessionTimer / 60)}:
                    {(sessionTimer % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Section: Language + Cart */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={toggleLanguageDropdown}
                className="flex items-center justify-center px-5 py-5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
                  <ReactCountryFlag
                    countryCode={getLanguageData(selectedLanguage).countryCode}
                    svg
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              </button>

              {/* Language Dropdown */}
              {showLanguageDropdown && (
                <div className="absolute top-full mt-2 right-0 bg-white border border-gray-300 rounded-lg shadow-lg py-4 min-w-[400px] z-50">
                  <div className="grid grid-cols-2 gap-2 px-3">
                    {supportedLanguages.map((lng) => {
                      const langData = getLanguageData(lng);
                      return (
                        <button
                          key={lng}
                          onClick={() => selectLanguage(lng)}
                          className={`flex items-center px-3 py-3 hover:bg-gray-50 text-left space-x-3 rounded-md transition-colors ${
                            selectedLanguage === lng
                              ? "bg-green-50 border border-green-200"
                              : ""
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                            <ReactCountryFlag
                              countryCode={langData.countryCode}
                              svg
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700 flex-1">
                            {langData.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Button (cart icon restored) */}
            <button
              onClick={handleCart}
              className="relative bg-green-500 hover:bg-green-600 text-white px-5 py-5 rounded-lg font-bold transition-colors flex items-center"
            >
              <svg
                className="w-12 h-12"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
              </svg>

              {/* Notification Badge */}
              {cart.length > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cart.reduce(
                    (total, item) => total + (item.quantity || 1),
                    0
                  )}
                </div>
              )}
            </button>
          </div>
        </div>

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
                                      <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-lg font-bold shadow-lg">
                                        {getProductCartQuantity(product)}
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="text-center space-y-1">
                                  <div
                                    className="text-lg font-medium truncate"
                                    style={{
                                      color: product.textColor || "#6b7280",
                                    }}
                                  >
                                    {product.name}
                                  </div>
                                  <div
                                    className="text-lg font-semibold"
                                    style={{
                                      color: product.textColor || "#059669",
                                    }}
                                  >
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
                {getFilteredProducts().filter((p) => !p.subcategoryId).length >
                  0 && (
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
                                <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-lg font-bold shadow-lg">
                                  {getProductCartQuantity(product)}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="text-center space-y-1">
                            <div
                              className="text-lg font-medium truncate"
                              style={{
                                color: product.textColor || "#6b7280",
                              }}
                            >
                              {product.name}
                            </div>
                            <div
                              className="text-lg font-semibold"
                              style={{
                                color: product.textColor || "#059669",
                              }}
                            >
                              {getProductPriceDisplay(product)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

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
                        This category doesn&apos;t have any subcategories or
                        products yet
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
            onClick={handleCancelOrder}
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

                          {/* Price Display */}
                          <div className="flex flex-col items-center">
                            {customer &&
                            !customer.isNoMember &&
                            option.memberPrice &&
                            option.memberPrice < option.price ? (
                              // Member with discount - show only member price (no promotional text)
                              <>
                                <span className="text-green-600 font-semibold text-lg">
                                  ฿{option.memberPrice}
                                </span>
                              </>
                            ) : (
                              // No member or no discount - show regular price with membership promotion
                              <>
                                <span className="text-green-600 font-semibold text-lg">
                                  ฿{option.price}
                                </span>
                                {option.memberPrice &&
                                  option.memberPrice < option.price && (
                                    <>
                                      <div className="text-lg text-orange-600 text-center">
                                        <span className="line-through">
                                          ฿{option.price}
                                        </span>
                                        <span className="ml-1">
                                          → ฿{option.memberPrice}
                                        </span>
                                      </div>
                                      <span className="text-base text-orange-600">
                                        with membership
                                      </span>
                                    </>
                                  )}
                              </>
                            )}
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
            {/* Back Button - Left */}
            <button
              onClick={() => setShowCart(false)}
              className="bg-green-500 hover:bg-green-600 text-white px-5 py-5 rounded-lg font-bold transition-colors flex items-center"
              aria-label="Back to menu"
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
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
            </button>

            {/* Logo - Center */}
            <div className="ml-20 flex flex-col items-center">
              <div className="relative">
                <style jsx>{`
                  @keyframes smokeFloat1 {
                    0% {
                      opacity: 0.6;
                      transform: translateY(0px) translateX(0px) scale(0.8)
                        rotate(0deg);
                    }
                    25% {
                      opacity: 0.8;
                      transform: translateY(-8px) translateX(2px) scale(0.9)
                        rotate(3deg);
                    }
                    50% {
                      opacity: 0.7;
                      transform: translateY(-18px) translateX(-1px) scale(1.1)
                        rotate(-2deg);
                    }
                    75% {
                      opacity: 0.4;
                      transform: translateY(-30px) translateX(3px) scale(1.3)
                        rotate(5deg);
                    }
                    100% {
                      opacity: 0;
                      transform: translateY(-45px) translateX(-2px) scale(1.6)
                        rotate(-3deg);
                    }
                  }

                  @keyframes smokeFloat2 {
                    0% {
                      opacity: 0.5;
                      transform: translateY(0px) translateX(0px) scale(0.7)
                        rotate(0deg);
                    }
                    20% {
                      opacity: 0.9;
                      transform: translateY(-5px) translateX(-2px) scale(0.85)
                        rotate(-4deg);
                    }
                    40% {
                      opacity: 0.8;
                      transform: translateY(-12px) translateX(1px) scale(1)
                        rotate(2deg);
                    }
                    60% {
                      opacity: 0.6;
                      transform: translateY(-22px) translateX(-3px) scale(1.2)
                        rotate(-6deg);
                    }
                    80% {
                      opacity: 0.3;
                      transform: translateY(-35px) translateX(2px) scale(1.4)
                        rotate(4deg);
                    }
                    100% {
                      opacity: 0;
                      transform: translateY(-50px) translateX(-1px) scale(1.7)
                        rotate(-2deg);
                    }
                  }

                  @keyframes smokeFloat3 {
                    0% {
                      opacity: 0.7;
                      transform: translateY(0px) translateX(0px) scale(0.9)
                        rotate(0deg);
                    }
                    30% {
                      opacity: 0.85;
                      transform: translateY(-10px) translateX(3px) scale(1)
                        rotate(6deg);
                    }
                    60% {
                      opacity: 0.5;
                      transform: translateY(-25px) translateX(-2px) scale(1.25)
                        rotate(-4deg);
                    }
                    100% {
                      opacity: 0;
                      transform: translateY(-42px) translateX(4px) scale(1.8)
                        rotate(8deg);
                    }
                  }

                  @keyframes smokeDrift {
                    0%,
                    100% {
                      transform: translateX(0px);
                    }
                    50% {
                      transform: translateX(3px);
                    }
                  }

                  .smoke-path-1 {
                    animation: smokeFloat1 6s ease-out infinite,
                      smokeDrift 3s ease-in-out infinite;
                    filter: blur(1px);
                    opacity: 0.6;
                  }

                  .smoke-path-2 {
                    animation: smokeFloat2 7s ease-out infinite 1.5s,
                      smokeDrift 4s ease-in-out infinite 0.5s;
                    filter: blur(0.8px);
                    opacity: 0.5;
                  }

                  .smoke-path-3 {
                    animation: smokeFloat3 5.5s ease-out infinite 3s,
                      smokeDrift 3.5s ease-in-out infinite 1s;
                    filter: blur(1.2px);
                    opacity: 0.7;
                  }

                  .smoke-container {
                    animation: smokeDrift 8s ease-in-out infinite;
                  }
                `}</style>
                <svg
                  version="1.1"
                  id="Layer_1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  x="0px"
                  y="0px"
                  viewBox="0 0 94.62 192.14"
                  enableBackground="new 0 0 94.62 192.14"
                  xmlSpace="preserve"
                  className="absolute w-16 h-16 top-10 -left-3 smoke-container"
                >
                  <defs>
                    <filter id="smokeFilter">
                      <feTurbulence
                        baseFrequency="0.02 0.1"
                        numOctaves="3"
                        result="turbulence"
                      />
                      <feDisplacementMap
                        in="SourceGraphic"
                        in2="turbulence"
                        scale="2"
                      />
                    </filter>
                  </defs>
                  <g id="Layer_1">
                    <g>
                      <g>
                        <path
                          className="smoke-path-1"
                          fill="#FFFFFF"
                          filter="url(#smokeFilter)"
                          d="M75.25,176.65c-1.7,1.31-5.55-0.58-7.11-1.49c-2.12-1.23-4.1-2.93-5.51-4.95 c-2.21-3.19-3.13-7.06-4.23-10.77c-0.96-3.23-2.11-6.43-3.65-9.44c-1.56-3.06-3.88-5.45-5.64-8.34 c-0.01-0.01,2.57,0.18,2.84,0.25c0.84,0.23,1.67,0.57,2.46,0.93c1.67,0.76,3.21,1.79,4.59,2.99c2.84,2.49,5,5.75,6.29,9.29 c1.69,4.64,2.05,9.76,4.33,14.14C71.1,172.09,73.62,174.02,75.25,176.65z"
                        ></path>
                        <path
                          className="smoke-path-2"
                          fill="#FFFFFF"
                          filter="url(#smokeFilter)"
                          d="M32.97,140.33c-1.99,0.35-4.27-4.02-5.02-5.32c-1.46-2.52-2.58-5.24-3.17-8.1 c-0.91-4.42-0.5-9.17,1.59-13.17c2.55-4.88,7.2-8.11,10.36-12.53c1.71-2.39,2.84-5.13,3.67-7.94c0.8-2.69,0.9-5.88,1.95-8.42 c1.91,3.13,2.59,8.08,2.72,11.7c0.14,4.09-0.82,8.13-3.08,11.57c-2.25,3.41-5.59,6.05-7.58,9.62c-1.68,3.01-2.29,6.51-2.3,9.95 c-0.01,3.6,0.66,7.1,1.24,10.63C33.58,139.69,33.38,140.25,32.97,140.33z"
                        ></path>
                        <path
                          className="smoke-path-3"
                          fill="#FFFFFF"
                          filter="url(#smokeFilter)"
                          d="M14.35,88.29c1.35-3.51,4.36-6.23,6.51-9.25c2.23-3.14,3.32-7.08,2.97-10.92 c-0.53-5.86-4.07-10.79-6.54-15.95c-2.57-5.37-4.23-11.41-3.27-17.39c0.76-4.77,3.29-9.14,6.88-12.36 c2.57-2.3,9.11-6.09,12.57-5.63c-1.14,2.51-4.27,4.09-6.22,5.97c-3.18,3.05-5.13,7.34-5.35,11.74 c-0.54,10.93,8.97,20.17,9.53,31.09c0.27,5.17-1.65,10.21-4.75,14.29c-1.59,2.1-3.61,4.11-5.71,5.69 C19.18,86.91,16.65,88.4,14.35,88.29z"
                        ></path>
                      </g>
                    </g>
                  </g>
                </svg>
                <Image
                  alt="Logo"
                  width={150}
                  height={150}
                  src="/logo.png"
                  className="cursor-pointer object-cover"
                  style={{ color: "transparent" }}
                />
                {/* Remove the simple smoke animation and replace with complete smoke effect from above */}
              </div>
              {/* Session Timer Display */}
              {cartTimer > 0 && (
                <div className="mt-2">
                  <div
                    className={`inline-flex items-center rounded-lg px-3 py-1 transition-colors duration-200 ${
                      cartTimer <= 20
                        ? "bg-red-100 border border-red-300"
                        : cartTimer <= 40
                        ? "bg-orange-100 border border-orange-300"
                        : "bg-blue-100 border border-blue-300"
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 mr-2 ${
                        cartTimer <= 20
                          ? "text-red-600"
                          : cartTimer <= 40
                          ? "text-orange-600"
                          : "text-blue-600"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span
                      className={`font-medium text-sm ${
                        cartTimer <= 20
                          ? "text-red-800"
                          : cartTimer <= 40
                          ? "text-orange-800"
                          : "text-blue-800"
                      }`}
                    >
                      Session expires in: {Math.floor(cartTimer / 60)}:
                      {(cartTimer % 60).toString().padStart(2, "0")}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Section: Language + Cart */}
            <div className="flex items-center space-x-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={toggleLanguageDropdown}
                  className="flex items-center justify-center px-5 py-5 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
                    <ReactCountryFlag
                      countryCode={
                        getLanguageData(selectedLanguage).countryCode
                      }
                      svg
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                </button>

                {/* Language Dropdown */}
                {showLanguageDropdown && (
                  <div className="absolute top-full mt-2 right-0 bg-white border border-gray-300 rounded-lg shadow-lg py-4 min-w-[400px] z-50">
                    <div className="grid grid-cols-2 gap-2 px-3">
                      {supportedLanguages.map((lng) => {
                        const langData = getLanguageData(lng);
                        return (
                          <button
                            key={lng}
                            onClick={() => selectLanguage(lng)}
                            className={`flex items-center px-3 py-3 hover:bg-gray-50 text-left space-x-3 rounded-md transition-colors ${
                              selectedLanguage === lng
                                ? "bg-green-50 border border-green-200"
                                : ""
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                              <ReactCountryFlag
                                countryCode={langData.countryCode}
                                svg
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700 flex-1">
                              {langData.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Button */}
              <button className="relative bg-green-500 hover:bg-green-600 text-white px-5 py-5 rounded-lg font-bold transition-colors flex items-center">
                <div
                  className="text-center w-12 h-12"
                  style={{ color: "white" }}
                >
                  <div
                    className="text-2xl font-bold"
                    style={{ color: "white" }}
                  >
                    {cart.reduce(
                      (total, item) => total + (item.quantity || 1),
                      0
                    )}
                  </div>
                  <div className="text-s" style={{ color: "white" }}>
                    {cart.reduce(
                      (total, item) => total + (item.quantity || 1),
                      0
                    ) === 1
                      ? "item"
                      : "items"}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex-1 p-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-4">
                {t("orderSummary")}
              </h2>
              <p className="text-xl text-center text-gray-600 mb-4">
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
                                      {variantValue?.name || (typeof variantValue === 'string' ? variantValue : JSON.stringify(variantValue))}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          <div className="text-green-600 font-semibold">
                            ฿{item.price} {item.unit || "each"}
                          </div>
                          {/* Points Information - only show if points > 0 */}
                          {customer &&
                            !customer.isNoMember &&
                            getItemCashbackInfo(item).pointsPerUnit > 0 && (
                              <div className="text-sm text-blue-600 mt-1">
                                +{getItemCashbackInfo(item).pointsPerUnit}{" "}
                                points (
                                {getItemCashbackInfo(item).percentage.toFixed(
                                  1
                                )}
                                %)
                              </div>
                            )}
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
                          {/* Total points - only show if points > 0 */}
                          {customer &&
                            !customer.isNoMember &&
                            getItemCashbackInfo(item).totalPoints > 0 && (
                              <div className="text-sm text-blue-600">
                                +{getItemCashbackInfo(item).totalPoints} pts
                                total
                              </div>
                            )}
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
                            {t("cashbackPoints")}
                          </div>
                          <div className="text-3xl font-bold text-blue-600">
                            +{cashbackPoints} {t("points")}
                          </div>
                          <div className="text-sm text-gray-600">
                            {t("earnPointsWithPurchase")}
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
                          {t("signInToEarnPoints")}
                        </div>
                        <div className="text-sm text-gray-600">
                          {t("registerToEarnCashback")}
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
                  {t("addMoreItems")}
                </button>
                <button
                  onClick={handleCancelOrder}
                  className="py-6 text-xl font-semibold bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-colors"
                >
                  {t("cancelOrder")}
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
                    : t("completeOrder", { total: getTotalPrice() })}
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
                {completedOrder.orderId && (
                  <div>ID: {completedOrder.orderId}</div>
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
                              {variantValue?.name || (typeof variantValue === 'string' ? variantValue : JSON.stringify(variantValue))}
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

                {completedOrder.customer &&
                  !completedOrder.customer.isNoMember && (
                    <div style={{ fontSize: "10px", marginTop: "2mm" }}>
                      <div>
                        {t("customerLabel")}: {completedOrder.customer.name}
                      </div>
                      <div>
                        {t("pointsEarned")}:{" "}
                        {completedOrder.cashbackPoints || 0}
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
                {completedOrder.customer &&
                  completedOrder.customer.name !== "No Member" &&
                  !completedOrder.customer.isNoMember && (
                    <div className="mb-4">
                      <h3 className="font-medium text-gray-800 mb-2">
                        Customer
                      </h3>
                      <p className="text-gray-600">
                        {completedOrder.customer.name}
                      </p>
                      {completedOrder.cashbackPoints > 0 && (
                        <p className="text-green-600 font-medium">
                          Cashback: {completedOrder.cashbackPoints} points
                          earned!
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

      {/* Back Confirmation Modal */}
      {showBackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          {console.log("Back modal is rendering!")}
          <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {t("confirmBack")}
            </h3>
            <p className="text-gray-600 mb-6">{t("confirmBackMessage")}</p>
            <div className="flex space-x-4">
              <button
                onClick={confirmBack}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {t("yes")}
              </button>
              <button
                onClick={() => setShowBackModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {t("no")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              {t("confirmCancelOrder")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("confirmCancelOrderMessage")}
            </p>
            <div className="flex space-x-4">
              <button
                onClick={confirmCancelOrder}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {t("yes")}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {t("no")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Cart Animation */}
      {showCartAnimation && animationProduct && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Main product item */}
          <div
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation:
                "whooshToCart 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards",
            }}
          >
            <div className="flex items-center bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[120px]">
              {animationProduct.image && (
                <div className="w-8 h-8 relative">
                  <Image
                    src={animationProduct.image}
                    alt={animationProduct.name}
                    fill
                    className="object-contain rounded"
                  />
                </div>
              )}
              <div className="ml-2 text-xs font-semibold text-gray-800">
                +{animationProduct.quantity}
              </div>
            </div>
          </div>

          {/* Whoosh trail effect */}
          <div
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation:
                "whooshTrail 0.8s cubic-bezier(0.23, 1, 0.32, 1) forwards",
            }}
          >
            <div className="flex space-x-1">
              <div
                className="w-2 h-2 bg-green-500 rounded-full"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-green-400 rounded-full"
                style={{ animationDelay: "0.15s" }}
              ></div>
              <div
                className="w-1 h-1 bg-green-300 rounded-full"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-1 h-1 bg-green-200 rounded-full"
                style={{ animationDelay: "0.25s" }}
              ></div>
            </div>
          </div>

          {/* Speed lines */}
          <div
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation: "speedLines 0.8s ease-out forwards",
            }}
          >
            <div className="space-y-1">
              <div
                className="h-px bg-gradient-to-r from-transparent via-green-500 to-transparent w-20"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="h-px bg-gradient-to-r from-transparent via-green-400 to-transparent w-16"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="h-px bg-gradient-to-r from-transparent via-green-300 to-transparent w-12"
                style={{ animationDelay: "0.3s" }}
              ></div>
            </div>
          </div>

          <style jsx>{`
            @keyframes whooshToCart {
              0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
              }
              20% {
                transform: translate(-30%, -60%) scale(0.9);
                opacity: 1;
              }
              60% {
                transform: translate(calc(45vw - 50%), calc(-45vh - 50%))
                  scale(0.6);
                opacity: 0.8;
              }
              100% {
                transform: translate(calc(47vw - 50%), calc(-47vh - 50%))
                  scale(0.2);
                opacity: 0;
              }
            }

            @keyframes whooshTrail {
              0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 0.8;
              }
              30% {
                transform: translate(-25%, -65%) scale(0.8);
                opacity: 0.6;
              }
              70% {
                transform: translate(calc(44vw - 50%), calc(-46vh - 50%))
                  scale(0.5);
                opacity: 0.3;
              }
              100% {
                transform: translate(calc(46vw - 50%), calc(-48vh - 50%))
                  scale(0.1);
                opacity: 0;
              }
            }

            @keyframes speedLines {
              0% {
                transform: translate(-50%, -50%) scaleX(0);
                opacity: 0;
              }
              20% {
                transform: translate(-35%, -60%) scaleX(1);
                opacity: 0.8;
              }
              60% {
                transform: translate(calc(40vw - 50%), calc(-45vh - 50%))
                  scaleX(1.5);
                opacity: 0.6;
              }
              100% {
                transform: translate(calc(45vw - 50%), calc(-47vh - 50%))
                  scaleX(0.5);
                opacity: 0;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
