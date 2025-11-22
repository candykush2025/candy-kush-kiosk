"use client";
import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import CachedImage from "../../components/CachedImage";
import CustomJointBuilder from "../../components/CustomJointBuilder";
import ModelViewer from "../../components/ModelViewer";
import MenuPreloader from "./preloader";
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
  NonMemberCategoriesService,
} from "../../lib/productService";
import { PrerollService } from "../../lib/prerollService";
import { TransactionService } from "../../lib/transactionService";
import { PendingPointsService } from "../../lib/pendingPointsService";
import StockMovementService from "../../lib/stockMovementService";
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
  const [expandedSubcategory, setExpandedSubcategory] = useState(null);
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
  const [showPersonalizedJoints, setShowPersonalizedJoints] = useState(false);
  const [selectedJointType, setSelectedJointType] = useState(null);
  const [showJointPopup, setShowJointPopup] = useState(false);
  const [showCustomJointBuilder, setShowCustomJointBuilder] = useState(false);

  // Image zoom states
  const [zoomedImage, setZoomedImage] = useState(null);

  // 3D Model view toggle
  const [show3DView, setShow3DView] = useState(false);

  // Selected size for preroll popup
  const [selectedSize, setSelectedSize] = useState(null);

  // Prerolls dynamic data states
  const [prerollsConfig, setPrerollsConfig] = useState(null);
  const [prerollsQualityTypes, setPrerollsQualityTypes] = useState([]);
  const [prerollsStrainTypes, setPrerollsStrainTypes] = useState([]);
  const [prerollsProducts, setPrerollsProducts] = useState([]);
  const [prerollsSizePrices, setPrerollsSizePrices] = useState({
    small: 100,
    normal: 150,
    king: 200,
  });
  const [dataNotInitialized, setDataNotInitialized] = useState(false);
  const [isLoadingPrerolls, setIsLoadingPrerolls] = useState(true);

  // Track previous section for cart navigation
  const [previousSection, setPreviousSection] = useState("main"); // 'main' or 'prerolls'
  const firstWindowRef = useRef(null);
  const [firstWindowHeight, setFirstWindowHeight] = useState(null);
  const [cartTimer, setCartTimer] = useState(60);
  const cartTimerRef = useRef(null);
  const [sessionTimer, setSessionTimer] = useState(60); // 60 seconds = 1 minute
  const sessionTimerRef = useRef(null);
  const sessionCountdownRef = useRef(null);

  // Language and modal states
  const [selectedLanguage, setSelectedLanguage] = useState(
    i18n.language || "en"
  );
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showBackModal, setShowBackModal] = useState(false);
  const [showSessionExpiryModal, setShowSessionExpiryModal] = useState(false);
  const [sessionModalCountdown, setSessionModalCountdown] = useState(60);

  // Add to cart animation states
  const [showCartAnimation, setShowCartAnimation] = useState(false);
  const [animationProduct, setAnimationProduct] = useState(null);

  // Points usage states
  const [pointsUsagePercentage, setPointsUsagePercentage] = useState(0); // 0, 25, 50, 75, 100
  const [pointsToUse, setPointsToUse] = useState(0);
  const [pointsValue, setPointsValue] = useState(0); // Monetary value of points

  // Cashback percentages for categories
  const [categoryPercentages, setCategoryPercentages] = useState({});

  // Helper function to format price without unnecessary decimals
  const formatPrice = (price) => {
    return price % 1 === 0 ? price.toString() : price.toFixed(2);
  };

  // Handle subcategory expansion toggle
  const handleSubcategoryToggle = (subcategoryId) => {
    setExpandedSubcategory(
      expandedSubcategory === subcategoryId ? null : subcategoryId
    );
  };

  // Stock alerts
  const [stockAlerts, setStockAlerts] = useState([]);
  const [stockCalculations, setStockCalculations] = useState({});
  const [stockCalculationsLoaded, setStockCalculationsLoaded] = useState(false);

  // Real-time POS stock
  const [posStock, setPosStock] = useState({}); // {productId: stockLevel}
  const [posStockLoading, setPosStockLoading] = useState(false);

  // Crypto payment states
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [currencyMinimums, setCurrencyMinimums] = useState({});
  const [loadingCrypto, setLoadingCrypto] = useState(false);
  const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState(null);
  const [bathToUsdRate, setBathToUsdRate] = useState(0.029); // Default rate, will be loaded from settings

  // Payment processing states
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Non member payment settings
  const [nonMemberPaymentSettings, setNonMemberPaymentSettings] = useState({
    cash: true,
    card: true,
    crypto: true,
  });
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [creatingPayment, setCreatingPayment] = useState(false);

  // Personalized Joints product images mapping (will be loaded from Firebase)
  const [personalizedJointsImages, setPersonalizedJointsImages] = useState({
    outdoor: {
      sativa: "/Product/outdoor sativa king.png",
      hybrid: "/Product/outdoor hybrid king.png",
      indica: "/Product/outdoor indica king.png",
    },
    indoor: {
      sativa: "/Product/indoor sativa king.png",
      hybrid: "/Product/indoor hybrid king.png",
      indica: "/Product/indoor indica king.png",
    },
    top: {
      sativa: "/Product/top sativa king.png",
      hybrid: "/Product/top HYBRID king.png",
      indica: "/Product/top indica king.png",
    },
  });
  const [paymentError, setPaymentError] = useState(null);

  // Payment monitoring states
  const [paymentStatusTimer, setPaymentStatusTimer] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [cryptoPaymentData, setCryptoPaymentData] = useState(null);

  // Dev mode state to show/hide Personalized Joints button
  const [isDev, setIsDev] = useState(false);

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

  // Bath to USD conversion helper
  const convertBathToUsd = (bathAmount) => {
    return bathAmount * bathToUsdRate;
  };

  const convertUsdToBath = (usdAmount) => {
    return usdAmount / bathToUsdRate;
  };

  // Send order to POS API
  const sendOrderToPOS = async (orderData) => {
    try {
      const posApiUrl =
        process.env.NEXT_PUBLIC_POS_API_URL ||
        "https://pos-candy-kush.vercel.app";
      const apiKey = process.env.NEXT_PUBLIC_KIOSK_API_KEY || "";

      console.log("📤 Sending order to POS:", posApiUrl);

      const response = await fetch(`${posApiUrl}/api/orders/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Kiosk-ID": process.env.NEXT_PUBLIC_KIOSK_ID || "KIOSK-001",
          ...(apiKey && { "X-API-Key": apiKey }),
        },
        body: JSON.stringify({ orderData }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to submit order to POS");
      }

      console.log("✅ Order submitted to POS successfully:", result.data);
      return result.data;
    } catch (error) {
      console.error("❌ Failed to send order to POS:", error);
      // Don't throw error - order is already saved in Firebase
      // Just log for monitoring
      return null;
    }
  };

  // Load Bath to USD rate and non-member payment settings from settings
  const loadBathToUsdRate = async () => {
    try {
      const { collection, getDocs, query, limit } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../../lib/firebase");

      const settingsDoc = await getDocs(
        query(collection(db, "settings"), limit(1))
      );
      if (!settingsDoc.empty) {
        const settings = settingsDoc.docs[0].data();
        setBathToUsdRate(settings.bathToUsdRate || 0.029);

        // Load non-member payment settings
        setNonMemberPaymentSettings({
          cash:
            settings.nonMemberPaymentCash !== undefined
              ? settings.nonMemberPaymentCash
              : true,
          card:
            settings.nonMemberPaymentCard !== undefined
              ? settings.nonMemberPaymentCard
              : true,
          crypto:
            settings.nonMemberPaymentCrypto !== undefined
              ? settings.nonMemberPaymentCrypto
              : true,
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setBathToUsdRate(0.029); // Fallback to default
      setNonMemberPaymentSettings({
        cash: true,
        card: true,
        crypto: true,
      });
    }
  };

  // Crypto API functions
  const fetchAvailableCurrencies = async () => {
    try {
      const response = await fetch("/api/crypto/currencies");

      if (!response.ok) {
        throw new Error("Failed to fetch currencies");
      }

      const data = await response.json();
      console.log("Crypto API Response:", data);

      // The NOWPayments API might return currencies in different formats
      // Let's handle both possible structures
      let currencies = [];
      if (data.currencies && Array.isArray(data.currencies)) {
        currencies = data.currencies;
      } else if (Array.isArray(data)) {
        currencies = data;
      }

      console.log("Processed currencies:", currencies.slice(0, 5)); // Log first 5 for debugging

      return currencies;
    } catch (error) {
      console.error("Error fetching currencies:", error);
      return [];
    }
  };

  const fetchMinimumAmount = async (currencyFrom, totalUsd) => {
    console.log("fetchMinimumAmount called with:", { currencyFrom, type: typeof currencyFrom, totalUsd });
    try {
      const response = await fetch(
        `/api/crypto/min-amount?currency_from=${currencyFrom}&currency_to=trx&fiat_equivalent=usd&is_fixed_rate=false&is_fee_paid_by_user=false`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch minimum amount");
      }

      const data = await response.json();
      return {
        minAmount: data.min_amount || 0,
        fiatEquivalent: data.fiat_equivalent || 0,
      };
    } catch (error) {
      console.error("Error fetching minimum amount:", error);
      return { minAmount: 0, fiatEquivalent: 0 };
    }
  };

  // Helper function to get standardized crypto symbol for icons
  const getCryptoIconSymbol = (currency) => {
    const code = (currency.code || currency.currency).toLowerCase();

    // Map some currencies to their standard icon names
    const iconMapping = {
      usdt: "usdt",
      usdttrc20: "usdt",
      usdterc20: "usdt",
      usdcbsc: "usdc",
      usdcsol: "usdc",
      usdtbsc: "usdt",
      bnbbsc: "bnb",
      maticmainnet: "matic",
      avaxc: "avax",
    };

    return iconMapping[code] || code;
  };

  const loadCryptoData = async () => {
    setLoadingCrypto(true);
    try {
      // Fetch available currencies
      const currencies = await fetchAvailableCurrencies();
      setAvailableCurrencies(currencies);

      // Calculate total: Bath -> USD conversion
      const totalOrderInBath = getTotalPrice();
      const totalOrderInUsd = convertBathToUsd(totalOrderInBath);

      console.log("Order totals:", {
        bathAmount: totalOrderInBath.toFixed(2),
        usdAmount: totalOrderInUsd.toFixed(2),
        exchangeRate: bathToUsdRate,
      });

      // Fetch minimum amounts for ordered currencies
      const orderedCurrencies = [
        { code: "usdterc20", displayName: "USDT (ERC)", network: "ERC20" },
        { code: "usdttrc20", displayName: "USDT (TRC)", network: "TRC20" },
        { code: "btc", displayName: "BTC", network: null },
        { code: "eth", displayName: "ETH", network: null },
        { code: "xrp", displayName: "XRP", network: null },
        { code: "trx", displayName: "TRX", network: null },
        { code: "usdc", displayName: "USDC (ERC)", network: "ERC20" },
        { code: "sol", displayName: "SOL", network: null },
      ];
      const minimums = {};

      for (const item of orderedCurrencies) {
        console.log("Processing item:", item, "item.code:", item.code, "type of item.code:", typeof item.code);
        const currency = String(item.code).toLowerCase(); // Ensure it's always a string
        console.log("currency set to:", currency, "type:", typeof currency);
        const currencyData = currencies.find(
          (c) =>
            (c.code && c.code.toLowerCase() === currency) ||
            (c.currency && c.currency.toLowerCase() === currency)
        );
        if (currencyData) {
          const minData = await fetchMinimumAmount(currency, totalOrderInUsd);
          minimums[currency] = {
            minAmount: minData.minAmount,
            minAmountInBath: convertUsdToBath(minData.fiatEquivalent),
            fiatEquivalent: minData.fiatEquivalent,
            displayName: item.displayName,
            network: item.network,
            available: currencyData,
          };

          console.log(`${currency.toUpperCase()} minimum:`, {
            minAmountCrypto: minData.minAmount,
            minAmountUsd: minData.fiatEquivalent?.toFixed(2),
            minAmountBath: convertUsdToBath(minData.fiatEquivalent)?.toFixed(2),
            orderMeetsMinimum: totalOrderInUsd >= minData.fiatEquivalent,
          });
        }
      }

      setCurrencyMinimums(minimums);
    } catch (error) {
      console.error("Error loading crypto data:", error);
    } finally {
      setLoadingCrypto(false);
    }
  };

  // Create crypto payment
  const createCryptoPayment = async (selectedCurrency) => {
    setCreatingPayment(true);
    setPaymentError(null);

    try {
      const totalOrderInBath = getTotalPrice();
      const totalOrderInUsd = convertBathToUsd(totalOrderInBath);
      const currencyCode = (
        selectedCurrency.code || selectedCurrency.currency
      ).toLowerCase();

      // Create order ID
      const orderId = `CK-${Date.now()}`;

      const paymentRequest = {
        price_amount: totalOrderInUsd,
        price_currency: "usd",
        pay_currency: currencyCode,
        order_id: orderId,
        order_description: `Candy Kush Order - ${cart.length} items`,
        ipn_callback_url: `${window.location.origin}/api/crypto/callback`,
        is_fixed_rate: true,
        is_fee_paid_by_user: false,
      };

      console.log("Creating payment request:", paymentRequest);

      const response = await fetch("/api/crypto/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment");
      }

      const paymentData = await response.json();
      console.log("Payment created:", paymentData);

      // Save payment data for later use in POS submission
      setCryptoPaymentData(paymentData);

      // Save payment to Firebase for history
      await saveCryptoPaymentToFirebase(paymentData, selectedCurrency);

      setPaymentDetails(paymentData);
      setPaymentStatus(paymentData);
      setShowPaymentModal(true);

      // Start monitoring payment status
      startPaymentMonitoring(paymentData.payment_id);
    } catch (error) {
      console.error("Error creating payment:", error);
      setPaymentError(error.message);
    } finally {
      setCreatingPayment(false);
    }
  };

  // Save crypto payment to Firebase
  const saveCryptoPaymentToFirebase = async (paymentData, selectedCurrency) => {
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../../lib/firebase");

      const cryptoPaymentData = {
        payment_id: paymentData.payment_id,
        order_id: paymentData.order_id,
        payment_status: paymentData.payment_status,
        pay_address: paymentData.pay_address,
        price_amount: paymentData.price_amount,
        price_currency: paymentData.price_currency,
        pay_amount: paymentData.pay_amount,
        pay_currency: paymentData.pay_currency,
        customer_id: customer?.id || null,
        customer_name: customer
          ? customer.isNoMember
            ? "No Member"
            : `${customer.name} ${customer.lastName || ""}`.trim()
          : "",
        cart_items: cart,
        total_bath: getTotalPrice(),
        total_usd: convertBathToUsd(getTotalPrice()),
        selected_currency: selectedCurrency,
        created_at: new Date(),
        updated_at: new Date(),
        expiration_date: paymentData.expiration_estimate_date
          ? new Date(paymentData.expiration_estimate_date)
          : null,
      };

      const docRef = await addDoc(
        collection(db, "crypto_payments"),
        cryptoPaymentData
      );
      console.log("Crypto payment saved to Firebase:", docRef.id);
    } catch (error) {
      console.error("Error saving crypto payment to Firebase:", error);
    }
  };

  // Start payment monitoring
  const startPaymentMonitoring = (paymentId) => {
    // Clear existing timer
    if (paymentStatusTimer) {
      clearInterval(paymentStatusTimer);
    }

    // Check immediately
    checkPaymentStatus(paymentId);

    // Set up interval to check every 5 seconds
    const timer = setInterval(() => {
      checkPaymentStatus(paymentId);
    }, 5000);

    setPaymentStatusTimer(timer);
  };

  // Check payment status
  const checkPaymentStatus = async (paymentId) => {
    if (checkingStatus) return; // Prevent multiple simultaneous checks

    setCheckingStatus(true);
    try {
      const response = await fetch(`/api/crypto/payment/${paymentId}`);

      if (!response.ok) {
        throw new Error("Failed to check payment status");
      }

      const statusData = await response.json();
      console.log("Payment status update:", statusData);

      setPaymentStatus(statusData);

      // Update payment details with latest status
      setPaymentDetails((prev) => ({
        ...prev,
        payment_status: statusData.payment_status,
        actually_paid: statusData.actually_paid,
        outcome_amount: statusData.outcome_amount,
        outcome_currency: statusData.outcome_currency,
      }));

      // If payment is completed, process the transaction
      if (
        statusData.payment_status === "finished" ||
        statusData.payment_status === "confirmed"
      ) {
        await completeCryptoTransaction(statusData);
      }

      // Stop monitoring if payment is final
      if (
        ["finished", "failed", "refunded", "expired"].includes(
          statusData.payment_status
        )
      ) {
        if (paymentStatusTimer) {
          clearInterval(paymentStatusTimer);
          setPaymentStatusTimer(null);
        }
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Complete crypto transaction
  const completeCryptoTransaction = async (statusData) => {
    try {
      const originalTotal = getTotalPrice();
      const finalTotal = getTotalPriceAfterPoints();

      const transactionData = {
        customerId: customer?.id || null,
        customerName: customer
          ? customer.isNoMember
            ? "No Member"
            : `${customer.name} ${customer.lastName || ""}`.trim()
          : "",
        items: cart,
        originalTotal: originalTotal,
        total: finalTotal,
        paymentMethod: "crypto",
        cashbackEarned: customer?.isNoMember ? 0 : cashbackPoints,
        timestamp: new Date(),
        pointsUsed: pointsToUse,
        pointsUsedValue: pointsValue,
        pointsUsagePercentage: pointsUsagePercentage,
        pointsEarned: customer?.isNoMember ? 0 : cashbackPoints,
        pointDetails: customer?.isNoMember
          ? []
          : window.menuCashbackDetails || [],
        pointCalculation: {
          totalPointsEarned: customer?.isNoMember ? 0 : cashbackPoints,
          calculationMethod: customer?.isNoMember ? "none" : "category-based",
          items: customer?.isNoMember ? [] : window.menuCashbackDetails || [],
          totalPointsEarned: customer?.isNoMember ? 0 : cashbackPoints,
        },
        // Crypto specific details
        cryptoDetails: {
          payment_id: statusData.payment_id,
          pay_currency: statusData.pay_currency,
          pay_amount: statusData.pay_amount,
          actually_paid: statusData.actually_paid,
          pay_address: statusData.pay_address,
          price_amount_usd: statusData.price_amount,
          outcome_amount: statusData.outcome_amount,
          outcome_currency: statusData.outcome_currency,
          payin_hash: statusData.payin_hash,
          payout_hash: statusData.payout_hash,
          payment_status: statusData.payment_status,
          created_at: statusData.created_at,
          updated_at: statusData.updated_at,
        },
      };

      console.log(
        "🔍 Processing crypto transaction with data:",
        transactionData
      );

      const { TransactionService } = await import(
        "../../lib/transactionService"
      );
      const transactionId = await TransactionService.createTransaction(
        transactionData
      );

      if (transactionId) {
        console.log(
          "✅ Crypto transaction successful, transaction ID:",
          transactionId
        );

        // Handle points transactions (same as regular payments)
        if (pointsToUse > 0 && customer && !customer.isNoMember) {
          const { CustomerService } = await import("../../lib/customerService");
          await CustomerService.deductPoints(customer.id, pointsToUse, {
            transactionId: transactionId,
            description: `Points deduction for order payment`,
            originalAmount: originalTotal,
            pointsUsed: pointsToUse,
            finalAmount: finalTotal,
            paymentMethod: "crypto",
          });
        }

        // Clear payment monitoring
        if (paymentStatusTimer) {
          clearInterval(paymentStatusTimer);
          setPaymentStatusTimer(null);
        }

        // Show success and redirect
        setShowPaymentModal(false);
        setShowOrderComplete(true);
        setCompletedOrder({
          id: transactionId,
          ...transactionData,
          customer: customer,
        });
      } else {
        throw new Error("Failed to create transaction record");
      }
    } catch (error) {
      console.error("Crypto transaction error:", error);
      setPaymentError(
        "Transaction completed but failed to record. Please contact support."
      );
    }
  };

  // Load stock alerts from Firebase
  const loadStockAlerts = async () => {
    try {
      const { collection, getDocs, query, orderBy } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../../lib/firebase");

      const alertsRef = collection(db, "StockAlert");
      const q = query(alertsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const alerts = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() || {};
        alerts.push({
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt && data.createdAt.toDate
              ? data.createdAt.toDate()
              : data.createdAt || null,
          updatedAt:
            data.updatedAt && data.updatedAt.toDate
              ? data.updatedAt.toDate()
              : data.updatedAt || null,
        });
      });

      setStockAlerts(alerts);
      console.log("📊 Stock alerts loaded:", alerts.length);
    } catch (error) {
      console.error("Error loading stock alerts:", error);
    }
  };

  // Fetch real-time stock from POS API for linked products
  const fetchPOSStock = async (productsToFetch) => {
    const POS_API_URL = "https://pos-candy-kush.vercel.app/api";
    setPosStockLoading(true);

    try {
      const stockData = {};

      // Get products that have posItemId linked
      const linkedProducts = productsToFetch.filter((p) => p.posItemId);

      console.log(
        `📊 Fetching POS stock for ${linkedProducts.length} linked products`
      );

      // Fetch stock for each linked product
      const stockPromises = linkedProducts.map(async (product) => {
        try {
          const response = await fetch(
            `${POS_API_URL}/stock/check?itemId=${product.posItemId}`
          );

          if (!response.ok) {
            console.warn(`Failed to fetch stock for ${product.name}`);
            return null;
          }

          const data = await response.json();

          if (data.success && data.data) {
            return {
              productId: product.id,
              stock: data.data.stock || 0,
              isLowStock: data.data.isLowStock || false,
              isOutOfStock: data.data.isOutOfStock || false,
            };
          }

          return null;
        } catch (err) {
          console.warn(
            `Error fetching stock for ${product.name}:`,
            err.message
          );
          return null;
        }
      });

      const results = await Promise.all(stockPromises);

      // Build stock map
      results.forEach((result) => {
        if (result) {
          stockData[result.productId] = result.stock;
        }
      });

      setPosStock(stockData);
      console.log(
        `✅ POS stock loaded for ${Object.keys(stockData).length} products`
      );
    } catch (error) {
      console.error("Error fetching POS stock:", error);
    } finally {
      setPosStockLoading(false);
    }
  };

  // Load stock calculations from StockMovement collection (same as admin panel)
  const loadStockCalculations = async () => {
    try {
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("../../lib/firebase");

      // Get all stock movements
      const querySnapshot = await getDocs(collection(db, "StockMovement"));
      const stockSummary = {};

      console.log(
        "📊 Menu: Total StockMovement documents found:",
        querySnapshot.size
      );

      // Process each stock movement
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const productId = data.productId;
        const variantId = data.variantId || "";
        const quantity = data.quantity || 0;
        const status = data.status;

        // Create key for this product/variant combination
        const key = variantId ? `${productId}-${variantId}` : productId;

        // Initialize if not exists
        if (!stockSummary[key]) {
          stockSummary[key] = { stock: 0 };
        }

        // Calculate stock: add "purchasing", subtract "sales"
        if (status === "purchasing") {
          stockSummary[key].stock += quantity;
        } else if (status === "sales") {
          stockSummary[key].stock -= quantity;
        }
      });

      console.log("✅ Menu: Final stock calculations:", stockSummary);
      console.log(
        "📋 Menu: Stock calculation keys:",
        Object.keys(stockSummary)
      );

      // Update state with calculated stock
      setStockCalculations(stockSummary);
      setStockCalculationsLoaded(true);
      console.log("🔄 Menu: Stock calculations state updated");
    } catch (error) {
      console.error("❌ Menu: Error loading stock calculations:", error);
      setStockCalculationsLoaded(false);
    }
  };

  // Check for dev parameter in URL on page mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const devParam = urlParams.get("dev");
    setIsDev(devParam === "true");
  }, []);

  // Load prerolls dynamic data
  const loadPrerollsData = async () => {
    console.log("🔄 Loading prerolls data from Firebase...");

    // Load config and products
    const [config, products] = await Promise.all([
      PrerollService.getConfiguration(),
      PrerollService.getAllPrerolls(),
    ]);

    console.log("📦 Raw data from Firebase:");
    console.log("- Config:", config);
    console.log("- Products:", products);

    // Check if data is initialized
    if (!products || products.length === 0) {
      setDataNotInitialized(true);
      setIsLoadingPrerolls(false);
      return;
    }

    setDataNotInitialized(false);

    // Set config and products
    setPrerollsConfig(config);
    setPrerollsProducts(products);

    // Extract unique quality types and strain types from products
    const qualitySet = new Set();
    const strainSet = new Set();
    products.forEach((p) => {
      qualitySet.add(p.quality);
      strainSet.add(p.strain);
    });

    // Hardcoded quality/strain info for display (order matters for grid)
    const qualityOrder = ["indoor", "outdoor", "top"];
    const strainOrder = ["sativa", "hybrid", "indica"];

    // Color mappings
    const qualityColors = {
      outdoor: "#06B6D4", // Cyan
      indoor: "#6B7280", // Gray
      top: "#000000", // Black
    };

    const strainColors = {
      sativa: "#e1ba41", // Golden Yellow
      hybrid: "#7b9943", // Olive Green
      indica: "#4b4baf", // Purple Blue
    };

    const qualityTypes = qualityOrder
      .filter((q) => qualitySet.has(q))
      .map((q) => ({
        id: q,
        key: q,
        name:
          q === "top" ? "Top Quality" : q.charAt(0).toUpperCase() + q.slice(1),
        color: qualityColors[q] || "#000000",
      }));

    const strainTypes = strainOrder
      .filter((s) => strainSet.has(s))
      .map((s) => ({
        id: s,
        key: s,
        name: s.charAt(0).toUpperCase() + s.slice(1),
        color: strainColors[s] || "#000000",
      }));

    setPrerollsQualityTypes(qualityTypes);
    setPrerollsStrainTypes(strainTypes);

    // Build personalizedJointsImages from products (use mainImage or fallback)
    const imagesMap = {};
    qualityTypes.forEach((quality) => {
      if (!imagesMap[quality.key]) {
        imagesMap[quality.key] = {};
      }
      strainTypes.forEach((strain) => {
        // Find product for this combination
        const product = products.find(
          (p) => p.quality === quality.key && p.strain === strain.key
        );

        // Use product mainImage if exists, otherwise fallback to old path
        if (product && product.mainImage) {
          imagesMap[quality.key][strain.key] = product.mainImage;
        } else {
          // Fallback to old static path
          imagesMap[quality.key][
            strain.key
          ] = `/Product/${quality.key} ${strain.key} king.png`;
        }
      });
    });

    setPersonalizedJointsImages(imagesMap);
    console.log("✅ Prerolls data loaded successfully");
    console.log("Quality types:", qualityTypes);
    console.log("Strain types:", strainTypes);
    console.log("Products:", products);
    console.log("Images map:", imagesMap);
  };

  // Ensure language is loaded from localStorage on page mount
  useEffect(() => {
    const storedLanguage = localStorage.getItem("i18nextLng");
    if (storedLanguage && storedLanguage !== i18n.language) {
      i18n.changeLanguage(storedLanguage);
      console.log(`Menu page: Language changed to ${storedLanguage}`);
    }
  }, []);

  // Load Bath to USD rate from settings on page mount
  useEffect(() => {
    loadBathToUsdRate();
  }, []);

  // Set default payment method when customer or settings change
  useEffect(() => {
    setDefaultPaymentMethod();
  }, [customer, nonMemberPaymentSettings]);

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

  // Refresh POS stock periodically (every 30 seconds)
  useEffect(() => {
    if (products.length === 0) return;

    const interval = setInterval(() => {
      console.log("🔄 Refreshing POS stock...");
      fetchPOSStock(products);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [products]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get customer info from session storage
        const customerCode = sessionStorage.getItem("customerCode");
        const noMember = sessionStorage.getItem("noMember");
        let customerData = null;

        if (customerCode) {
          customerData = await CustomerService.getCustomerByMemberId(
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
          customerData = {
            name: "No Member",
            memberId: null,
            tier: null,
            points: 0,
            totalPoints: 0,
            isNoMember: true,
          };
          setCustomer(customerData);
        } else {
          // No customer data and no "No Member" flag, redirect to scanner
          router.push("/scanner");
          return;
        }

        // Load categories from Firebase
        const categoriesData = await CategoryService.getAllCategories();

        // Filter categories based on customer permissions
        let allowedCategoryIds = [];

        if (
          customerData &&
          customerData.allowedCategories &&
          !customerData.isNoMember
        ) {
          // Member: Use customer's allowed categories
          allowedCategoryIds = customerData.allowedCategories;
          console.log("🔐 Member categories:", allowedCategoryIds);
        } else if (
          noMember === "true" ||
          (customerData && customerData.isNoMember)
        ) {
          // Non-member: Use NonMemberCategories from admin settings
          try {
            allowedCategoryIds =
              await NonMemberCategoriesService.getNonMemberCategories();
            console.log("👤 Non-member categories:", allowedCategoryIds);
          } catch (error) {
            console.error("Error loading non-member categories:", error);
            allowedCategoryIds = []; // Show nothing if error
          }
        } else {
          // No customer data, no categories allowed
          allowedCategoryIds = [];
          console.log("❌ No customer data, no categories shown");
        }

        // Filter categories to only show allowed ones
        const filteredCategoriesData = categoriesData.filter((category) =>
          allowedCategoryIds.includes(category.id)
        );

        // Transform filtered categories data for display
        const transformedCategories = filteredCategoriesData.map(
          (category) => ({
            id: category.id,
            categoryId: category.categoryId,
            name: category.name,
            description: category.description,
            image: category.image,
            backgroundImage: category.backgroundImage,
            backgroundFit: category.backgroundFit || "contain",
            textColor: category.textColor || "#000000",
            specialPage: category.specialPage, // Add specialPage field
          })
        );

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

          return mappedProduct;
        });

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
        }

        // Load cart from session storage
        const savedCart = sessionStorage.getItem("cart");
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }

        // Load stock alerts and stock calculations
        await loadStockAlerts();
        await loadStockCalculations();

        // Fetch real-time POS stock for linked products
        await fetchPOSStock(productsWithCategoryId);

        // Load prerolls dynamic data
        await loadPrerollsData();
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
    }
  }, [router]);

  // Measure first window height after categories are loaded
  useEffect(() => {
    if (categories.length > 0 && firstWindowRef.current) {
      const height = firstWindowRef.current.offsetHeight;
      setFirstWindowHeight(height);
    }
  }, [categories]);

  // Load model-viewer script
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if script is already loaded
      if (!document.querySelector('script[src*="model-viewer"]')) {
        const script = document.createElement("script");
        script.type = "module";
        script.src =
          "https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js";
        document.head.appendChild(script);
      }
    }
  }, []);

  // Handle category selection
  const handleCategorySelect = (category) => {
    resetSessionTimer(); // Reset session timer on user interaction

    console.log("Category clicked:", category.name);
    console.log("Special page field:", category.specialPage);
    console.log("Available fields:", Object.keys(category));

    // Check if this category has a special page
    if (category.specialPage === "Prerolled Page") {
      console.log("✅ Navigating to prerolls section");
      setShowPersonalizedJoints(true);
      setShowCustomJointBuilder(false); // Close custom joint builder
      setSelectedCategory(null);
      return;
    }

    // Check if this is a Custom Joint Builder category
    if (category.specialPage === "Custom Joint Builder") {
      console.log(
        "✅ Opening Custom Joint Builder - Navigating to full screen"
      );
      router.push("/menu/personalizedJoint");
      return;
    }

    // Regular category - close all special pages
    setShowCustomJointBuilder(false);
    setShowPersonalizedJoints(false);
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

    // Auto-expand the first subcategory when category is selected
    if (newFilteredSubcategories.length > 0) {
      setExpandedSubcategory(newFilteredSubcategories[0].id);
    } else {
      setExpandedSubcategory(null);
    }
  };

  const handleBack = () => {
    if (cart.length > 0) {
      setShowBackModal(true);
    } else {
      router.push("/scanner");
    }
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
    setExpandedSubcategory(null); // Reset expanded subcategory when leaving
    router.push("/scanner");
  };

  const handleCancelOrder = () => {
    // Always show confirmation modal to avoid accidental navigation
    setShowCancelModal(true);
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

  // Session expiry modal handlers
  const handleSessionContinue = () => {
    setShowSessionExpiryModal(false);
    setSessionModalCountdown(60);

    // Clear existing timers
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }
    if (sessionCountdownRef.current) {
      clearInterval(sessionCountdownRef.current);
    }
    if (cartTimerRef.current) {
      clearTimeout(cartTimerRef.current);
    }

    // If cart is open, restart cart timer
    if (showCart) {
      setCartTimer(60);

      // Start cart countdown interval
      const countdownInterval = setInterval(() => {
        setCartTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            if (cartTimerRef.current) {
              clearTimeout(cartTimerRef.current);
              cartTimerRef.current = null;
            }
            setShowSessionExpiryModal(true);
            setSessionModalCountdown(60);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set cart timeout
      cartTimerRef.current = setTimeout(() => {
        clearInterval(countdownInterval);
        setShowSessionExpiryModal(true);
        setSessionModalCountdown(60);
      }, 60000);
    } else {
      // Restart the session timer for main menu
      setSessionTimer(60);

      // Start new countdown interval
      sessionCountdownRef.current = setInterval(() => {
        setSessionTimer((prev) => {
          if (prev <= 1) {
            clearInterval(sessionCountdownRef.current);
            setShowSessionExpiryModal(true);
            setSessionModalCountdown(60);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set new timeout for 60 seconds
      sessionTimerRef.current = setTimeout(() => {
        clearInterval(sessionCountdownRef.current);
        setShowSessionExpiryModal(true);
        setSessionModalCountdown(60);
      }, 60000);
    }
  };

  const handleSessionTimeout = () => {
    // Clear all session data and go to homepage
    sessionStorage.removeItem("cart");
    sessionStorage.removeItem("customerCode");
    sessionStorage.removeItem("currentCustomer");
    sessionStorage.removeItem("selectedPaymentMethod");
    sessionStorage.removeItem("lastOrder");
    sessionStorage.removeItem("receiptData");

    setShowSessionExpiryModal(false);
    setCart([]);
    setCustomer(null);
    router.push("/");
  };

  const handleCart = () => {
    resetSessionTimer(); // Reset session timer on user interaction
    if (cart.length > 0) {
      setPreviousSection("main");
      setShowCart(true);
    }
  };

  // Handle product selection for quantity popup
  const handleProductSelect = (product) => {
    resetSessionTimer(); // Reset session timer on user interaction

    // Check if this is a custom joint product
    if (
      product.productId === "customjoint" ||
      product.name?.toLowerCase().includes("custom joint")
    ) {
      router.push("/menu/personalizedJoint");
      return;
    }

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

  // Handle custom joint builder completion
  const handleCustomJointComplete = (jointConfig) => {
    // Build detailed description for the custom joint
    const details = [];

    // Paper details
    if (jointConfig.paper) {
      details.push(
        `Paper: ${jointConfig.paper.name} (${jointConfig.paper.capacity}g capacity)`
      );
    }

    // Filter details
    if (jointConfig.filter) {
      details.push(`Filter: ${jointConfig.filter.name}`);
    }

    // Flower details
    if (jointConfig.filling.flower && jointConfig.filling.flower.length > 0) {
      const flowerDetails = jointConfig.filling.flower
        .map((f) => `${f.name} (${f.type}, ${f.weight}g)`)
        .join(", ");
      details.push(`Flower: ${flowerDetails}`);
    }

    // Hash details
    if (jointConfig.filling.hash && jointConfig.filling.hash.length > 0) {
      const hashDetails = jointConfig.filling.hash
        .map((h) => `${h.name} (${h.weight}g)`)
        .join(", ");
      details.push(`Hash: ${hashDetails}`);
    }

    // Worm details
    if (jointConfig.filling.worm) {
      details.push(`Worm: ${jointConfig.filling.worm.name}`);
    }

    // Coating details
    if (jointConfig.external.coating) {
      details.push(`Coating: ${jointConfig.external.coating.name}`);
    }

    // Wrap details
    if (jointConfig.external.wrap) {
      details.push(`Wrap: ${jointConfig.external.wrap.name}`);
    }

    // Add the custom joint to cart
    const customJoint = {
      id: `customjoint_${Date.now()}`,
      name: "Custom Joint",
      price: jointConfig.totalPrice,
      quantity: 1,
      image: "/Product/custom-joint.png",
      productId: "customjoint",
      isCustomJoint: true,
      config: jointConfig,
      details: details, // Readable details for display
      detailsText: details.join(" | "), // Single line for thermal receipt
    };

    setCart([...cart, customJoint]);
    setShowCustomJointBuilder(false);
    setShowCart(true);
  };

  // Handle custom joint builder cancel
  const handleCustomJointCancel = () => {
    setShowCustomJointBuilder(false);
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

    // Create variant ID from selected options for stock checking
    const variantOptions = Object.values(selectedVariantOptions);
    if (variantOptions.length > 0) {
      const variantId = `${variantOptions[0].variantId}-${variantOptions[0].id}`;
      const stockCheck = canAddToCart(selectedProduct, 1, variantId);
      if (!stockCheck.canAdd) {
        alert(`Cannot add to cart: ${stockCheck.reason}`);
        return;
      }
    }

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

    const cartItem = {
      id: `${selectedProduct.productId}_${Date.now()}`, // Unique ID for variant combinations
      name: `${selectedProduct.name} (${variantDescription})`,
      price: totalPrice,
      quantity: 1, // Always 1 for variants
      image: selectedProduct.mainImage,
      productId: selectedProduct.productId,
      categoryId: selectedProduct.categoryId, // Add categoryId for cashback calculation
      cashbackEnabled: selectedProduct.cashbackEnabled,
      cashbackType: selectedProduct.cashbackType,
      cashbackValue: selectedProduct.cashbackValue,
      cashbackMinPurchase: selectedProduct.cashbackMinPurchase,
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

  // Image zoom handlers
  const handleImageClick = (imageKey) => {
    resetSessionTimer(); // Reset session timer on user interaction
    setZoomedImage(zoomedImage === imageKey ? null : imageKey);
    // Also trigger the joint popup for selection
    setSelectedJointType(imageKey);
    setSelectedSize(null); // Reset selected size when opening popup
    setShowJointPopup(true);
  };

  // Handle preroll size selection and add to cart
  const handlePrerollSizeSelect = (size) => {
    resetSessionTimer(); // Reset session timer on user interaction
    setSelectedSize(size);
  };

  const handleAddPrerollToCart = () => {
    if (!selectedJointType || !selectedSize) return;

    const [quality, strain] = selectedJointType.split("-");

    // Find the product for this quality/strain combination
    const product = prerollsProducts.find(
      (p) => p.quality === quality && p.strain === strain
    );

    if (!product) {
      console.error("Product not found for:", quality, strain);
      return;
    }

    // Get variant data (price and image)
    const variant = product.variants?.[selectedSize];
    if (!variant) {
      console.error("Variant not found for size:", selectedSize);
      return;
    }

    const prerollItem = {
      id: `${selectedJointType}_${selectedSize}_${Date.now()}`,
      name: `Prerolls - ${
        quality.charAt(0).toUpperCase() + quality.slice(1)
      } - ${strain.charAt(0).toUpperCase() + strain.slice(1)} - ${
        selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)
      }`,
      price: variant.price || 100,
      quantity: 1,
      image:
        variant.image || `/Product/${quality} ${strain} ${selectedSize}.png`,
      categoryId: "prerolls",
      size: selectedSize,
    };

    const newCart = [...cart, prerollItem];
    setCart(newCart);
    sessionStorage.setItem("cart", JSON.stringify(newCart));
    setShowJointPopup(false);
    setSelectedSize(null);
  };

  // Points usage calculation functions
  const calculatePointsToUse = (percentage) => {
    if (!customer || customer.isNoMember || !customer.totalPoints) return 0;
    const maxPoints = customer.totalPoints;
    return Math.floor((maxPoints * percentage) / 100);
  };

  const calculatePointsValue = (points) => {
    // Assuming 1 point = 1 baht (adjust conversion rate as needed)
    return points;
  };

  const getMaxPointsPercentageForTotal = () => {
    if (!customer || customer.isNoMember) return 0;
    const totalPrice = getTotalPrice();
    const maxPointsValue = calculatePointsValue(customer.totalPoints || 0);

    // Don't allow points to exceed the total price
    if (maxPointsValue >= totalPrice) {
      return Math.floor((totalPrice / maxPointsValue) * 100);
    }
    return 100;
  };

  const handlePointsSliderChange = (percentage) => {
    const maxAllowedPercentage = getMaxPointsPercentageForTotal();
    let actualPercentage = Math.min(percentage, maxAllowedPercentage);

    // Smart snapping: snap to nearest quarter increment if within threshold
    const snapThreshold = 4; // 4% threshold for snapping
    const snapPoints = [0, 25, 50, 75, 100];

    // Find the closest snap point
    let closestSnapPoint = null;
    let minDistance = Infinity;

    for (const snapPoint of snapPoints) {
      const distance = Math.abs(actualPercentage - snapPoint);
      if (distance <= snapThreshold && distance < minDistance) {
        minDistance = distance;
        closestSnapPoint = snapPoint;
      }
    }

    // Apply snapping if we found a close snap point
    if (closestSnapPoint !== null) {
      actualPercentage = Math.min(closestSnapPoint, maxAllowedPercentage);
    }

    setPointsUsagePercentage(actualPercentage);
    const pointsToUse = calculatePointsToUse(actualPercentage);
    setPointsToUse(pointsToUse);
    setPointsValue(calculatePointsValue(pointsToUse));
  };

  const getTotalPriceAfterPoints = () => {
    return Math.max(0, getTotalPrice() - pointsValue);
  };

  // Check if current percentage is near a snap point for visual feedback
  const isNearSnapPoint = (percentage) => {
    const snapThreshold = 4;
    const snapPoints = [0, 25, 50, 75, 100];
    return snapPoints.some(
      (snapPoint) => Math.abs(percentage - snapPoint) <= snapThreshold
    );
  };

  // Get cashback percentage for a category
  const getCashbackPercentageForCategory = async (categoryId) => {
    try {
      const percentage = await CashbackService.getCashbackPercentage(
        categoryId
      );
      return percentage;
    } catch (error) {
      console.error(
        "Error getting cashback percentage for category:",
        categoryId,
        error
      );
      return 0;
    }
  };

  // Helper function to get available payment methods based on customer type and settings
  const getAvailablePaymentMethods = () => {
    // If customer is a member (not no member), show all payment methods
    if (customer && !customer.isNoMember) {
      return {
        cash: true,
        card: true,
        crypto: true,
      };
    }

    // If no customer or customer is no member, use non-member settings
    return nonMemberPaymentSettings;
  };

  // Helper function to automatically set default payment method when settings change
  const setDefaultPaymentMethod = () => {
    const availableMethods = getAvailablePaymentMethods();

    // If current payment method is not available, switch to first available
    if (!availableMethods[paymentMethod]) {
      if (availableMethods.cash) {
        setPaymentMethod("cash");
      } else if (availableMethods.card) {
        setPaymentMethod("card");
      } else if (availableMethods.crypto) {
        setPaymentMethod("crypto");
      }
    }
  };

  // Helper function to get the complete order button text
  const getCompleteOrderButtonText = () => {
    const availableMethods = getAvailablePaymentMethods();
    const hasAnyMethod =
      availableMethods.cash || availableMethods.card || availableMethods.crypto;
    return hasAnyMethod
      ? t("completeOrder", { total: getTotalPriceAfterPoints() })
      : "Complete Order - ฿" + getTotalPriceAfterPoints().toFixed(2);
  };

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0) return;

    // Check available payment methods
    const availablePaymentMethods = getAvailablePaymentMethods();
    const hasAnyPaymentMethod =
      availablePaymentMethods.cash ||
      availablePaymentMethods.card ||
      availablePaymentMethods.crypto;

    // If no payment methods are available (for non-members), proceed without payment method validation
    let finalPaymentMethod = paymentMethod;
    if (!hasAnyPaymentMethod) {
      finalPaymentMethod = ""; // Empty payment method for non-members when all methods are disabled
    }

    // Check if crypto payment is selected but no currency is chosen
    if (paymentMethod === "crypto" && !selectedCryptoCurrency) {
      setShowCryptoModal(true);
      loadCryptoData();
      return;
    }

    // If crypto payment, create the payment and show modal
    if (paymentMethod === "crypto" && selectedCryptoCurrency) {
      await createCryptoPayment(selectedCryptoCurrency);
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const originalTotal = getTotalPrice();
      const finalTotal = getTotalPriceAfterPoints();

      const transactionData = {
        customerId: customer?.id || null,
        customerName: customer
          ? customer.isNoMember
            ? "No Member"
            : `${customer.name} ${customer.lastName || ""}`.trim()
          : "",
        items: cart,
        originalTotal: originalTotal,
        total: finalTotal,
        paymentMethod: finalPaymentMethod,
        cashbackEarned: customer?.isNoMember ? 0 : cashbackPoints,
        timestamp: new Date(),
        // Points usage information
        pointsUsed: pointsToUse,
        pointsUsedValue: pointsValue,
        pointsUsagePercentage: pointsUsagePercentage,
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

      // Send order to POS API for cashier confirmation
      try {
        await sendOrderToPOS({
          transactionId: result.transactionId,
          orderNumber: result.transactionId,
          kioskId: process.env.NEXT_PUBLIC_KIOSK_ID || "KIOSK-001",

          customer: {
            id: customer?.id || null,
            customerId: customer?.customerId || null,
            name: customer?.name || "",
            lastName: customer?.lastName || "",
            fullName: customer
              ? customer.isNoMember
                ? "No Member"
                : `${customer.name} ${customer.lastName || ""}`.trim()
              : "Guest",
            email: customer?.email || "",
            phone: customer?.cell || "",
            isNoMember: customer?.isNoMember !== false,
            currentPoints: customer?.customPoints || 0,
          },

          items: cart.map((item) => ({
            id: item.id,
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
            categoryId: item.categoryId,
            categoryName: item.categoryName || "",
            subtotal: item.price * item.quantity,
            cashbackEnabled: item.cashbackEnabled || false,
            cashbackType: item.cashbackType || "",
            cashbackValue: item.cashbackValue || 0,
          })),

          pricing: {
            subtotal: originalTotal,
            tax: 0,
            discount: 0,
            pointsUsed: pointsToUse,
            pointsUsedValue: pointsValue,
            total: finalTotal,
          },

          payment: {
            method: finalPaymentMethod,
            status:
              finalPaymentMethod === "crypto"
                ? "pending_confirmation"
                : "completed",
            cryptoDetails:
              finalPaymentMethod === "crypto" && cryptoPaymentData
                ? {
                    currency:
                      cryptoPaymentData.currency || selectedCryptoCurrency,
                    paymentId: cryptoPaymentData.payment_id || "",
                    amount: cryptoPaymentData.pay_amount || 0,
                    amountInCrypto: cryptoPaymentData.pay_amount || 0,
                    network: cryptoPaymentData.network || "",
                    address: cryptoPaymentData.pay_address || "",
                    transactionHash: null,
                    paymentUrl: cryptoPaymentData.invoice_url || "",
                  }
                : null,
          },

          points: {
            earned: customer?.isNoMember ? 0 : cashbackPoints,
            used: pointsToUse,
            usedValue: pointsValue,
            usagePercentage: pointsUsagePercentage,
            details: customer?.isNoMember
              ? []
              : window.menuCashbackDetails || [],
            calculation: {
              totalPointsEarned: customer?.isNoMember ? 0 : cashbackPoints,
              calculationMethod: customer?.isNoMember
                ? "none"
                : "category-based",
              items: customer?.isNoMember
                ? []
                : window.menuCashbackDetails || [],
            },
          },

          metadata: {
            source: "kiosk",
            kioskId: process.env.NEXT_PUBLIC_KIOSK_ID || "KIOSK-001",
            kioskLocation: "Main Store",
            orderCompletedAt: new Date().toISOString(),
            requiresConfirmation: true,
            notes: "",
          },
        });

        console.log("✅ Order sent to POS successfully");
      } catch (posError) {
        console.error("❌ Failed to send order to POS:", posError);
        // Don't fail the transaction - order is already saved in Firebase
      }

      // Create stock movements for each cart item
      try {
        for (const item of cart) {
          // Find the product document to get the correct document ID
          const product = products.find((p) => p.productId === item.productId);
          if (product) {
            const stockMovementData = {
              productId: product.id, // Use document ID for stock movement system
              productName: item.name,
              variantId:
                item.isVariant && item.variants
                  ? Object.keys(item.variants)[0]
                  : "",
              variantName:
                item.isVariant && item.variants
                  ? Object.values(item.variants)
                      .map((v) => v.name)
                      .join(", ")
                  : "",
              quantity: item.quantity,
              price: item.price,
              status: "sales",
              notes: `Kiosk sale - Transaction: ${result.transactionId}`,
              createdBy: "kiosk-system",
              skipStockUpdate: true, // Let admin system handle stock calculations
            };

            await StockMovementService.addStockMovement(stockMovementData);
            console.log(
              `📦 Stock movement created for product ${product.id} (PRD: ${item.productId}), quantity: -${item.quantity}`
            );
          } else {
            console.warn(
              `⚠️ Product not found for productId: ${item.productId}`
            );
          }
        }
      } catch (stockError) {
        console.error("Error creating stock movements:", stockError);
        // Don't fail the transaction if stock movement creation fails
      }

      // Update customer points if customer exists and is not "No Member"
      if (customer && !customer.isNoMember) {
        try {
          // Create pending points for cashback if earned
          if (cashbackPoints > 0) {
            const cashbackPointData = {
              customerId: customer.id,
              customerName: `${customer.name} ${
                customer.lastName || ""
              }`.trim(),
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
              purchaseAmount: originalTotal,
              paymentMethod: paymentMethod,
              source: "kiosk",
            };

            await PendingPointsService.createPendingPoints(cashbackPointData);
            console.log(
              `Created pending points (${cashbackPoints}) for customer ${customer.name} - requires admin approval`
            );
          }

          // Deduct used points if any (immediate deduction)
          if (pointsToUse > 0) {
            const pointsUsageData = {
              customerId: customer.id,
              customerName: `${customer.name} ${
                customer.lastName || ""
              }`.trim(),
              customerCode: customer.customerCode || "",
              pointsAmount: -pointsToUse, // Negative to deduct points
              transactionId: result.transactionId,
              orderId: result.transactionId,
              reason: "Points Used - Order Purchase",
              details: `Used ${pointsUsagePercentage}% of available points (${pointsToUse} points worth $${pointsValue.toFixed(
                2
              )})`,
              items: [
                {
                  description: `Points deduction for order payment`,
                  points: -pointsToUse,
                  value: pointsValue,
                  percentage: pointsUsagePercentage,
                },
              ],
              purchaseAmount: originalTotal,
              finalAmount: finalTotal,
              pointsValue: pointsValue,
              paymentMethod: paymentMethod,
              source: "kiosk",
            };

            await PendingPointsService.createPendingPoints(pointsUsageData);
            console.log(
              `Deducted ${pointsToUse} points (${pointsUsagePercentage}%, $${pointsValue.toFixed(
                2
              )}) from customer ${customer.name}`
            );
          }
        } catch (pointsError) {
          console.error("Error updating customer points:", pointsError);
          // Don't fail the transaction if points operations fail
        }
      }

      // Save order data for order-complete modal
      const orderDataForComplete = {
        id: result.transactionId,
        orderId: result.transactionId, // Use transactionId as orderId
        items: cart,
        originalTotal: originalTotal,
        total: finalTotal,
        customer: customer,
        cashbackPoints: customer?.isNoMember ? 0 : cashbackPoints,
        pointsUsed: pointsToUse,
        pointsUsedValue: pointsValue,
        pointsUsagePercentage: pointsUsagePercentage,
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

      // Refresh stock calculations to update stock warnings immediately
      await loadStockCalculations();

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
      // Use the new product-level cashback calculation
      const result = await CashbackService.calculateCartCashback(cart);

      const totalCashback = Math.floor(result.totalCashback);

      // Transform the result to match the existing format
      const itemCashbackDetails = result.itemsWithCashback.map((item) => ({
        productId: item.productId,
        name: item.productName,
        quantity:
          cart.find((c) => (c.productId || c.id) === item.productId)
            ?.quantity || 1,
        price:
          cart.find((c) => (c.productId || c.id) === item.productId)?.price ||
          0,
        itemTotal:
          (cart.find((c) => (c.productId || c.id) === item.productId)?.price ||
            0) *
          (cart.find((c) => (c.productId || c.id) === item.productId)
            ?.quantity || 1),
        pointsEarned: Math.floor(item.cashback),
        appliedRule: item.appliedRule, // 'product' or 'category'
        cashbackType: item.ruleType, // 'percentage' or 'fixed'
        cashbackValue: item.ruleValue,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
      }));

      // Log cashback rules for debugging
      console.log("🎁 CASHBACK CALCULATION SUMMARY:");
      console.log(`   Total Cashback: ฿${totalCashback}`);
      console.log(
        `   Items with cashback: ${itemCashbackDetails.length}/${cart.length}`
      );

      if (itemCashbackDetails.length > 0) {
        console.log("\n📋 CASHBACK DETAILS BY ITEM:");
        itemCashbackDetails.forEach((item, index) => {
          console.log(`\n   ${index + 1}. ${item.name}`);
          console.log(`      • Quantity: ${item.quantity}`);
          console.log(`      • Price: ฿${item.price} each`);
          console.log(`      • Total: ฿${item.itemTotal}`);
          console.log(
            `      • Rule Applied: ${
              item.appliedRule === "product"
                ? "🎯 PRODUCT CASHBACK"
                : "📂 CATEGORY CASHBACK"
            }`
          );
          if (item.appliedRule === "product") {
            console.log(
              `      • Type: ${
                item.cashbackType === "percentage"
                  ? "Percentage"
                  : "Fixed Amount"
              }`
            );
            console.log(
              `      • Value: ${
                item.cashbackType === "percentage"
                  ? `${item.cashbackValue}%`
                  : `฿${item.cashbackValue} per item`
              }`
            );
          } else if (item.appliedRule === "category") {
            console.log(
              `      • Category: ${item.categoryName || item.categoryId}`
            );
            console.log(`      • Percentage: ${item.cashbackValue || "N/A"}%`);
          }
          console.log(`      • Cashback Earned: ฿${item.pointsEarned}`);
        });
      }

      const itemsWithoutCashback = cart.length - itemCashbackDetails.length;
      if (itemsWithoutCashback > 0) {
        console.log(
          `\n   ⚠️ ${itemsWithoutCashback} item(s) have no cashback rules`
        );
      }
      console.log("\n" + "=".repeat(50));

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

  // Load cashback percentages for categories
  useEffect(() => {
    const loadCashbackPercentages = async () => {
      if (categories.length > 0 && customer && !customer.isNoMember) {
        const percentages = {};
        for (const category of categories) {
          const percentage = await getCashbackPercentageForCategory(
            category.id
          );
          percentages[category.id] = percentage;
        }
        setCategoryPercentages(percentages);
      } else {
        setCategoryPercentages({});
      }
    };
    loadCashbackPercentages();
  }, [categories, customer]);

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

            // Show "Are you still there?" modal instead of direct redirect
            setShowSessionExpiryModal(true);
            setSessionModalCountdown(60);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set timeout for 60 seconds
      cartTimerRef.current = setTimeout(() => {
        clearInterval(countdownInterval);

        // Show "Are you still there?" modal instead of direct redirect
        setShowSessionExpiryModal(true);
        setSessionModalCountdown(60);
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
        sessionCountdownRef.current = setInterval(() => {
          setSessionTimer((prev) => {
            if (prev <= 1) {
              clearInterval(sessionCountdownRef.current);
              // Show "Are you still there?" modal instead of direct redirect
              setShowSessionExpiryModal(true);
              setSessionModalCountdown(60); // 60 seconds for modal countdown
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Set timeout for 60 seconds
        sessionTimerRef.current = setTimeout(() => {
          clearInterval(sessionCountdownRef.current);
          // Show modal instead of direct redirect
          setShowSessionExpiryModal(true);
          setSessionModalCountdown(60);
        }, 60000); // 60 seconds

        // Store interval reference for cleanup
        return sessionCountdownRef.current;
      };

      const sessionCountdownInterval = startSessionTimer();

      // Cleanup function
      return () => {
        if (sessionCountdownRef.current) {
          clearInterval(sessionCountdownRef.current);
        }
        if (sessionTimerRef.current) {
          clearTimeout(sessionTimerRef.current);
          sessionTimerRef.current = null;
        }
      };
    } else {
      // Start session timer for order summary (cart view) with same timeout
      const startOrderSummarySessionTimer = () => {
        // Clear any existing timers
        if (sessionTimerRef.current) {
          clearTimeout(sessionTimerRef.current);
        }
        if (sessionCountdownRef.current) {
          clearInterval(sessionCountdownRef.current);
        }

        // Start countdown for order summary
        setSessionTimer(60); // 60 seconds for order summary too

        // Create timer that decrements every second
        sessionCountdownRef.current = setInterval(() => {
          setSessionTimer((prev) => {
            if (prev <= 1) {
              clearInterval(sessionCountdownRef.current);
              // Show "Are you still there?" modal
              setShowSessionExpiryModal(true);
              setSessionModalCountdown(60);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Set timeout for 60 seconds
        sessionTimerRef.current = setTimeout(() => {
          clearInterval(sessionCountdownRef.current);
          // Show modal
          setShowSessionExpiryModal(true);
          setSessionModalCountdown(60);
        }, 60000); // 60 seconds

        return sessionCountdownRef.current;
      };

      const orderSummaryCountdownInterval = startOrderSummarySessionTimer();

      // Cleanup function
      return () => {
        if (orderSummaryCountdownInterval) {
          clearInterval(orderSummaryCountdownInterval);
        }
        if (sessionTimerRef.current) {
          clearTimeout(sessionTimerRef.current);
          sessionTimerRef.current = null;
        }
      };
    }
  }, [showCart, router]);

  // Session expiry modal countdown timer
  useEffect(() => {
    let modalCountdownInterval;

    if (showSessionExpiryModal) {
      modalCountdownInterval = setInterval(() => {
        setSessionModalCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(modalCountdownInterval);
            // Use setTimeout to avoid calling setState during render
            setTimeout(() => handleSessionTimeout(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (modalCountdownInterval) {
        clearInterval(modalCountdownInterval);
      }
    };
  }, [showSessionExpiryModal]);

  // Reset session timer on user interactions
  const resetSessionTimer = useCallback(() => {
    // Clear existing timers
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }
    if (sessionCountdownRef.current) {
      clearInterval(sessionCountdownRef.current);
    }
    if (cartTimerRef.current) {
      clearTimeout(cartTimerRef.current);
    }

    // If cart is open, restart cart timer
    if (showCart) {
      setCartTimer(60);

      // Start cart countdown interval
      const countdownInterval = setInterval(() => {
        setCartTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setShowSessionExpiryModal(true);
            setSessionModalCountdown(60);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set timeout for 60 seconds
      cartTimerRef.current = setTimeout(() => {
        clearInterval(countdownInterval);
        setShowSessionExpiryModal(true);
        setSessionModalCountdown(60);
      }, 60000);
    } else {
      // Restart the session timer for main menu
      setSessionTimer(60);

      // Start new countdown interval with stored reference
      const newCountdownInterval = setInterval(() => {
        setSessionTimer((prev) => {
          if (prev <= 1) {
            clearInterval(newCountdownInterval);
            setShowSessionExpiryModal(true);
            setSessionModalCountdown(60);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Store the interval reference
      sessionCountdownRef.current = newCountdownInterval;

      // Set new timeout for 60 seconds
      sessionTimerRef.current = setTimeout(() => {
        clearInterval(newCountdownInterval);
        setShowSessionExpiryModal(true);
        setSessionModalCountdown(60);
      }, 60000);
    }
  }, [showCart]);

  // Cleanup payment monitoring on component unmount
  useEffect(() => {
    return () => {
      if (paymentStatusTimer) {
        clearInterval(paymentStatusTimer);
      }
    };
  }, [paymentStatusTimer]);

  // Handle quantity change
  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;

    if (newQuantity < 1) return; // Don't allow quantity below 1

    // If increasing quantity, check stock limits
    if (change > 0 && selectedProduct) {
      const stockCheck = canAddToCart(
        selectedProduct,
        newQuantity - getProductCartQuantity(selectedProduct)
      );
      if (!stockCheck.canAdd) {
        alert(`Cannot increase quantity: ${stockCheck.reason}`);
        return;
      }
    }

    setQuantity(newQuantity);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    resetSessionTimer(); // Reset session timer on user interaction
    if (selectedProduct) {
      // Check stock limits first
      const stockCheck = canAddToCart(selectedProduct, quantity);
      if (!stockCheck.canAdd) {
        alert(`Cannot add to cart: ${stockCheck.reason}`);
        return;
      }

      // Trigger animation first
      setAnimationProduct({
        name: selectedProduct.name,
        image: selectedProduct.mainImage,
        quantity: quantity,
      });
      setShowCartAnimation(true);

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
        cashbackEnabled: selectedProduct.cashbackEnabled,
        cashbackType: selectedProduct.cashbackType,
        cashbackValue: selectedProduct.cashbackValue,
        cashbackMinPurchase: selectedProduct.cashbackMinPurchase,
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
      setShow3DView(false); // Reset 3D view toggle
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
              <div className="text-lg text-gray-500 text-center">
                <span className="ml-1">฿{product.memberPrice} : MEMBER</span>
              </div>
            </div>
          );
        } else {
          // No member price available, just show regular price
          return `฿${product.price}`;
        }
      } else if (customer && !customer.isNoMember) {
        // Regular member - show member price prominently with crossed out regular price if different
        if (product.memberPrice && product.memberPrice !== product.price) {
          return (
            <div className="flex flex-col items-center">
              <span className="text-green-600 font-semibold text-lg">
                ฿{product.memberPrice}
              </span>
              <div className="text-gray-500 text-lg">
                <span className="line-through">฿{product.price}</span>
              </div>
            </div>
          );
        } else {
          // No member price available or same price, just show regular price
          return `฿${product.price}`;
        }
      } else {
        // Fallback - show regular price
        return `฿${product.price}`;
      }
    }

    // Variant product - calculate price range
    let allPrices = [];
    let allRegularPrices = [];
    let hasMemberPrice = false;

    product.variants.forEach((variant) => {
      if (variant.options && variant.options.length > 0) {
        variant.options.forEach((option) => {
          // Always collect regular prices
          if (option.price) {
            allRegularPrices.push(option.price);
          }

          // Check if member prices exist and are different
          if (option.memberPrice && option.memberPrice !== option.price) {
            hasMemberPrice = true;
          }

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
    const minRegularPrice = Math.min(...allRegularPrices);
    const maxRegularPrice = Math.max(...allRegularPrices);

    const priceRangeText =
      minPrice === maxPrice ? `฿${minPrice}` : `฿${minPrice} - ฿${maxPrice}`;
    const regularPriceRangeText =
      minRegularPrice === maxRegularPrice
        ? `฿${minRegularPrice}`
        : `฿${minRegularPrice} - ฿${maxRegularPrice}`;

    // If customer is a no-member and there are member prices
    if (customer && customer.isNoMember && hasMemberPrice) {
      return (
        <div className="flex flex-col items-center">
          <span className="text-green-600 font-semibold text-lg">
            {regularPriceRangeText}
          </span>
          <div className="text-lg text-gray-500 text-center">
            <span className="ml-1">{priceRangeText} : MEMBER</span>
          </div>
        </div>
      );
    }

    // If customer is a regular member and there are member prices
    if (customer && !customer.isNoMember && hasMemberPrice) {
      return (
        <div className="flex flex-col items-center">
          <span className="text-green-600 font-semibold text-lg">
            {priceRangeText}
          </span>
          <div className="text-gray-500 text-lg">
            <span className="line-through">{regularPriceRangeText}</span>
          </div>
        </div>
      );
    }

    // Fallback - just show the price range
    return priceRangeText;
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

  // Helper function to get cashback percentage for a product card
  const getProductCashbackPercentage = (product) => {
    // Don't show cashback for non-members
    if (!customer || customer.isNoMember) {
      return 0;
    }

    // Priority 1: Product-level cashback
    if (product.cashbackEnabled && product.cashbackValue > 0) {
      if (product.cashbackType === "percentage") {
        return product.cashbackValue;
      } else if (product.cashbackType === "fixed") {
        // For fixed cashback, we can't show a percentage on the card
        // but we can indicate there's cashback available
        return "fixed";
      }
    }

    // Priority 2: Category-level cashback
    if (product.categoryId && categoryPercentages[product.categoryId]) {
      return categoryPercentages[product.categoryId];
    }

    return 0;
  };

  // Stock alert helper functions
  const getProductStockAlert = (productId) => {
    return stockAlerts.find(
      (alert) => alert.productId === productId && alert.isActive
    );
  };

  const getCurrentStock = (product, variantId = null) => {
    if (!product) return 0;

    // PRIORITY 1: Check POS stock if product is linked
    if (product.posItemId && posStock[product.id] !== undefined) {
      return posStock[product.id];
    }

    // PRIORITY 2: If stock calculations are loaded, use them (old system)
    if (
      stockCalculationsLoaded &&
      stockCalculations &&
      Object.keys(stockCalculations).length > 0
    ) {
      // If variantId is provided, get stock for specific variant
      if (variantId) {
        const key = `${product.id}-${variantId}`;
        const stockData = stockCalculations[key];
        return stockData ? stockData.stock || 0 : 0;
      }

      // Check if product has variants - sum all variant stock
      if (
        product.variants &&
        Array.isArray(product.variants) &&
        product.variants.length > 0
      ) {
        let totalStock = 0;
        product.variants.forEach((variant) => {
          if (variant.options && Array.isArray(variant.options)) {
            variant.options.forEach((option) => {
              const key = `${product.id}-${variant.id}-${option.id}`;
              const stockData = stockCalculations[key];
              const variantStock = stockData ? stockData.stock || 0 : 0;
              totalStock += variantStock;
            });
          }
        });
        return totalStock;
      } else {
        // Product without variants (or empty variants array)
        const key = product.id;
        const stockData = stockCalculations[key];
        const stock = stockData ? stockData.stock || 0 : 0;
        return stock;
      }
    }

    // Fallback to old system if stock calculations not loaded
    if (variantId && product.variants && Array.isArray(product.variants)) {
      // For variant products, get specific variant stock
      const [vId, oId] = variantId.split("-");

      // Find the variant
      const variant = product.variants.find((v) => v.id === vId);
      if (!variant) return 0;

      // If variant has options, find the specific option
      if (variant.options && Array.isArray(variant.options) && oId) {
        const option = variant.options.find((o) => o.id === oId);
        return option ? option.quantity || 0 : 0;
      }

      // If no options, use variant quantity directly
      return variant.quantity || 0;
    }

    // For simple products or when no variant is specified
    return product.quantity || 0;
  };

  const getStockWarningText = (product) => {
    // Check if product has alertKioskLevel set (new system)
    const alertLevel = product.alertKioskLevel;

    // Fallback to old StockAlert collection
    const stockAlert = getProductStockAlert(product.id);

    // If no alert level defined in either system, no warning
    if (alertLevel === undefined && !stockAlert) {
      return null;
    }

    const currentStock = getCurrentStock(product);
    const threshold =
      alertLevel !== undefined ? alertLevel : stockAlert?.alertKioskLevel || 0;

    if (currentStock <= threshold && currentStock > 0) {
      console.log(`  ✅ Showing warning: Stock ${currentStock} left!`);
      return `Stock ${currentStock} left!`;
    }
    console.log(`  ❌ No warning needed`);
    return null;
  };

  const canAddToCart = (product, requestedQuantity = 1, variantId = null) => {
    // Check if product has alertKioskLevel set (new system)
    const alertLevel = product.alertKioskLevel;

    // Fallback to old StockAlert collection
    const stockAlert = getProductStockAlert(product.id);

    // If no stock alert in either system, allow unlimited
    if (alertLevel === undefined && !stockAlert) {
      return { canAdd: true, reason: null };
    }

    const currentStock = getCurrentStock(product, variantId);
    const currentCartQty = getProductCartQuantity(product);
    const totalRequestedQty = currentCartQty + requestedQuantity;

    if (currentStock <= 0) {
      return { canAdd: false, reason: "Out of stock" };
    }

    if (totalRequestedQty > currentStock) {
      return {
        canAdd: false,
        reason: `Only ${currentStock} available (${currentCartQty} already in cart)`,
      };
    }

    return { canAdd: true, reason: null };
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

  // Show Personalized Joints page as separate layout
  if (showPersonalizedJoints) {
    // Determine background style based on configuration
    const backgroundStyle = {};

    if (prerollsConfig?.backgroundType === "color") {
      // Use solid color background
      backgroundStyle.backgroundColor =
        prerollsConfig.backgroundColor || "#ffffff";
    } else {
      // Use image background (default)
      backgroundStyle.backgroundImage = `url(${
        prerollsConfig?.backgroundImage || "/background.jpg"
      })`;
      backgroundStyle.backgroundSize = prerollsConfig?.backgroundFit || "cover";
      backgroundStyle.backgroundPosition = "center";
      backgroundStyle.backgroundRepeat = "no-repeat";
    }

    return (
      <div
        className="h-screen flex flex-col bg-gray-50 font-['Poppins']"
        style={backgroundStyle}
      >
        {/* Header for Personalized Joints */}
        <div className="p-4 flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPersonalizedJoints(false);
              setSelectedCategory(null);
            }}
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

          {/* Logo with Smoke Effect - Center */}
          <div className="ml-20 flex flex-col items-center">
            <div className="relative">
              {/* Smoke SVG Animation */}
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
                        fill="#FFFFFF"
                        filter="url(#smokeFilter)"
                        d="M75.25,176.65c-1.7,1.31-5.55-0.58-7.11-1.49c-2.12-1.23-4.1-2.93-5.51-4.95 c-2.21-3.19-3.13-7.06-4.23-10.77c-0.96-3.23-2.11-6.43-3.65-9.44c-1.56-3.06-3.88-5.45-5.64-8.34 c-0.01-0.01,2.57,0.18,2.84,0.25c0.84,0.23,1.67,0.57,2.46,0.93c1.67,0.76,3.21,1.79,4.59,2.99c2.84,2.49,5,5.75,6.29,9.29 c1.69,4.64,2.05,9.76,4.33,14.14C71.1,172.09,73.62,174.02,75.25,176.65z"
                        className="smoke-path-1"
                      />
                      <path
                        fill="#FFFFFF"
                        filter="url(#smokeFilter)"
                        d="M32.97,140.33c-1.99,0.35-4.27-4.02-5.02-5.32c-1.46-2.52-2.58-5.24-3.17-8.1 c-0.91-4.42-0.5-9.17,1.59-13.17c2.55-4.88,7.2-8.11,10.36-12.53c1.71-2.39,2.84-5.13,3.67-7.94c0.8-2.69,0.9-5.88,1.95-8.42 c1.91,3.13,2.59,8.08,2.72,11.7c0.14,4.09-0.82,8.13-3.08,11.57c-2.25,3.41-5.59,6.05-7.58,9.62c-1.68,3.01-2.29,6.51-2.3,9.95 c-0.01,3.6,0.66,7.1,1.24,10.63C33.58,139.69,33.38,140.25,32.97,140.33z"
                        className="smoke-path-2"
                      />
                      <path
                        fill="#FFFFFF"
                        filter="url(#smokeFilter)"
                        d="M14.35,88.29c1.35-3.51,4.36-6.23,6.51-9.25c2.23-3.14,3.32-7.08,2.97-10.92 c-0.53-5.86-4.07-10.79-6.54-15.95c-2.57-5.37-4.23-11.41-3.27-17.39c0.76-4.77,3.29-9.14,6.88-12.36 c2.57-2.3,9.11-6.09,12.57-5.63c-1.14,2.51-4.27,4.09-6.22,5.97c-3.18,3.05-5.13,7.34-5.35,11.74 c-0.54,10.93,8.97,20.17,9.53,31.09c0.27,5.17-1.65,10.21-4.75,14.29c-1.59,2.1-3.61,4.11-5.71,5.69 C19.18,86.91,16.65,88.4,14.35,88.29z"
                        className="smoke-path-3"
                      />
                    </g>
                  </g>
                </g>
              </svg>

              {/* Logo */}
              <Image
                src="/logo.png"
                alt="Logo"
                width={150}
                height={150}
                className="cursor-pointer object-cover"
              />
            </div>

            {/* Session Timer */}
            <div className="mt-2">
              <div className="inline-flex items-center rounded-lg px-3 py-1 transition-colors duration-200 bg-red-100 border border-red-300">
                <svg
                  className="w-4 h-4 mr-2 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium text-sm text-red-800">
                  Session expires: {Math.floor(sessionTimer / 60)}:
                  {String(sessionTimer % 60).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>

          {/* Right Section: Language and Cart */}
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

            {/* Cart Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                resetSessionTimer(); // Reset session timer on user interaction
                if (cart.length > 0) {
                  setPreviousSection("prerolls");
                  setShowPersonalizedJoints(false); // Close prerolls section
                  setShowCart(true); // Open cart
                } else {
                  // Optional: show message or do nothing if cart is empty
                  console.log("Cart is empty");
                }
              }}
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

        {/* Main Content - Two Panes Layout like main menu */}
        <div className="flex-1 min-h-0 p-6 flex gap-6 overflow-hidden">
          {/* Left Pane: Categories Menu */}
          <div className="w-1/5 h-full bg-white rounded-3xl shadow-lg flex flex-col">
            <div className="flex-1 overflow-y-auto hidden-scrollbar px-2 py-4">
              {categories.map((category, index) => (
                <div key={category.id}>
                  <div
                    onClick={() => {
                      setShowPersonalizedJoints(false);
                      handleCategorySelect(category);
                    }}
                    className="cursor-pointer p-4 transition-all duration-300 hover:bg-gray-50 hover:shadow-md"
                    style={{
                      borderRadius: "8px",
                    }}
                  >
                    {/* Category Image */}
                    {category.image && (
                      <div className="mb-3 relative w-3/4 mx-auto aspect-square">
                        <CachedImage
                          src={category.image}
                          alt={category.name}
                          type="category"
                          fill
                          className="rounded-lg object-contain"
                          showLoading={false}
                        />
                        {/* Cashback Badge - only show for members */}
                        {customer &&
                          !customer.isNoMember &&
                          categoryPercentages[category.id] > 0 && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-18 h-8 flex items-center justify-center border-2 border-white shadow-lg">
                              up to {categoryPercentages[category.id]}%
                            </div>
                          )}
                      </div>
                    )}

                    {/* Category Name */}
                    <div className="text-center">
                      <h4 className="font-semibold text-sm text-gray-600">
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

          {/* Right Pane: Prerolls Content */}
          <div className="flex-1 h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              {/* Strain Headers - Top Row */}
              <div className="grid grid-cols-3 gap-0">
                {prerollsStrainTypes.map((strain, index) => {
                  // Map strain key to logo file
                  const logoMap = {
                    sativa: "/sativa logo.svg",
                    hybrid: "/hybrid logo.svg",
                    indica: "/indica logo.svg",
                  };

                  return (
                    <div
                      key={strain.id}
                      className={`h-24 flex items-center justify-center gap-1 ${
                        index === 0 ? "rounded-tl-3xl" : ""
                      } ${
                        index === prerollsStrainTypes.length - 1
                          ? "rounded-tr-3xl"
                          : ""
                      }`}
                      style={{ backgroundColor: strain.color || "#000000" }}
                    >
                      {/* Strain Logo */}
                      <img
                        src={logoMap[strain.key]}
                        alt={`${strain.name} logo`}
                        className="h-12 w-auto"
                      />
                      {/* Strain Name */}
                      <h2 className="text-5xl font-bold text-white">
                        {strain.name}
                      </h2>
                    </div>
                  );
                })}
              </div>

              {/* 3x3 Grid - Products arranged by quality (rows) and strain (columns) */}
              {prerollsQualityTypes.length === 0 ||
              prerollsStrainTypes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-2xl mx-auto">
                    <h3 className="text-2xl font-bold text-yellow-800 mb-4">
                      ⚠️ Prerolls Data Not Initialized
                    </h3>
                    <p className="text-yellow-700 mb-4">
                      The prerolls special page has not been set up yet.
                    </p>
                    <p className="text-yellow-700 mb-4">
                      Please ask an administrator to:
                    </p>
                    <ol className="text-left text-yellow-700 mb-4 list-decimal list-inside space-y-2">
                      <li>Go to Admin Panel → Prerolls Special tab</li>
                      <li>Click &quot;Reset to Default Data&quot; button</li>
                      <li>
                        Configure quality types, strain types, and products
                      </li>
                    </ol>
                    <p className="text-sm text-yellow-600">
                      This will create the default prerolls grid with
                      Outdoor/Indoor/Top Quality and Sativa/Hybrid/Indica
                      options.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Quality Rows: Indoor (row 1), Outdoor (row 2), Top Quality (row 3) */}
                  {prerollsQualityTypes.map((quality, qualityIndex) => (
                    <div
                      key={`quality-row-${quality.id}`}
                      className="grid grid-cols-3 gap-0"
                    >
                      {/* Each row has 3 strain columns */}
                      {prerollsStrainTypes.map((strain, strainIndex) => {
                        const itemKey = `${quality.key}-${strain.key}`;
                        const isSelected = selectedJointType === itemKey;
                        const isZoomed = zoomedImage === itemKey;
                        const isLastRow =
                          qualityIndex === prerollsQualityTypes.length - 1;
                        const isFirstColumn = strainIndex === 0;
                        const isLastColumn =
                          strainIndex === prerollsStrainTypes.length - 1;

                        // Find the product for this cell to get its background
                        const currentProduct = prerollsProducts.find(
                          (p) =>
                            p.quality === quality.key && p.strain === strain.key
                        );

                        // Determine cell background style
                        const cellBackgroundStyle = {};
                        if (
                          currentProduct?.cellBackgroundType === "image" &&
                          currentProduct?.cellBackgroundImage
                        ) {
                          cellBackgroundStyle.backgroundImage = `url(${currentProduct.cellBackgroundImage})`;
                          cellBackgroundStyle.backgroundSize = "cover";
                          cellBackgroundStyle.backgroundPosition = "center";
                          cellBackgroundStyle.backgroundRepeat = "no-repeat";
                        } else if (currentProduct?.cellBackgroundColor) {
                          cellBackgroundStyle.backgroundColor =
                            currentProduct.cellBackgroundColor;
                        } else {
                          // Default white background
                          cellBackgroundStyle.backgroundColor = "#ffffff";
                        }

                        return (
                          <div
                            key={itemKey}
                            className={`relative cursor-pointer transition-all duration-300 flex flex-col items-center justify-between border border-gray-300 hover:border-green-400 ${
                              isSelected || isZoomed
                                ? "ring-4 ring-green-500 shadow-2xl z-10"
                                : ""
                            } ${
                              isLastRow && isFirstColumn ? "rounded-bl-3xl" : ""
                            } ${
                              isLastRow && isLastColumn ? "rounded-br-3xl" : ""
                            }`}
                            style={{
                              height: "220px",
                              ...cellBackgroundStyle,
                            }}
                            onClick={() => handleImageClick(itemKey)}
                          >
                            {/* Product Image */}
                            <div className="flex-1 w-full flex items-center justify-center p-4">
                              <div className="relative w-full h-full">
                                <Image
                                  src={
                                    personalizedJointsImages[quality.key]?.[
                                      strain.key
                                    ] || "/Product/placeholder.png"
                                  }
                                  alt={`${quality.name} ${strain.name}`}
                                  fill
                                  className="object-contain"
                                />
                              </div>
                            </div>

                            {/* Product Name */}
                            <div className="w-full py-2 text-center">
                              <p
                                className="text-sm font-semibold"
                                style={{
                                  color:
                                    currentProduct?.cellTextColor || "#000000",
                                }}
                              >
                                {quality.name} {strain.name}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Joint Selection Popup - Bottom Popup like variant selection */}
        {showJointPopup && selectedJointType && (
          <div
            className="fixed inset-0 bg-black/10 flex items-end justify-center z-50 transition-opacity duration-300"
            onClick={() => setShowJointPopup(false)}
          >
            <div
              className="bg-white shadow-2xl w-full transition-transform duration-300 ease-out"
              style={{
                height: "fit-content",
                minHeight: "400px",
                maxHeight: "70vh",
                borderTopLeftRadius: "3rem",
                borderTopRightRadius: "3rem",
                borderBottomLeftRadius: "0",
                borderBottomRightRadius: "0",
                transform: showJointPopup
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
                    Size
                  </h3>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col justify-between flex-1 overflow-y-auto p-6">
                {/* Size Selection */}
                <div className="grid grid-cols-3 gap-0">
                  {(() => {
                    // Get current product prices based on selectedJointType
                    const [quality, strain] = selectedJointType
                      ? selectedJointType.split("-")
                      : ["", ""];
                    const currentProduct = prerollsProducts.find(
                      (p) => p.quality === quality && p.strain === strain
                    );
                    const variantPrices = {
                      small:
                        currentProduct?.variants?.small?.price ||
                        prerollsSizePrices.small ||
                        100,
                      normal:
                        currentProduct?.variants?.normal?.price ||
                        prerollsSizePrices.normal ||
                        150,
                      king:
                        currentProduct?.variants?.king?.price ||
                        prerollsSizePrices.king ||
                        200,
                    };

                    return (
                      <>
                        {/* Small Size */}
                        <div
                          className={`cursor-pointer border-2 p-6 text-center transition-all duration-200 ${
                            selectedSize === "small"
                              ? "border-green-500 bg-green-50 transform scale-105"
                              : "border-gray-200 hover:border-green-300"
                          }`}
                          onClick={() => handlePrerollSizeSelect("small")}
                        >
                          <div className="w-32 h-32 mx-auto mb-3 relative">
                            {selectedJointType && (
                              <Image
                                src={`/Product/${
                                  selectedJointType.split("-")[0]
                                } ${selectedJointType.split("-")[1]} small.png`}
                                alt="Small"
                                fill
                                className="object-contain"
                              />
                            )}
                          </div>
                          <div className="font-bold text-gray-800 text-xl">
                            Small
                          </div>
                          <div className="text-green-600 font-semibold text-lg">
                            ฿{variantPrices.small}
                          </div>
                        </div>

                        {/* Normal Size */}
                        <div
                          className={`cursor-pointer border-2 p-6 text-center transition-all duration-200 ${
                            selectedSize === "normal"
                              ? "border-green-500 bg-green-50 transform scale-105"
                              : "border-gray-200 hover:border-green-300"
                          }`}
                          onClick={() => handlePrerollSizeSelect("normal")}
                        >
                          <div className="w-32 h-32 mx-auto mb-3 relative">
                            {selectedJointType && (
                              <Image
                                src={`/Product/${
                                  selectedJointType.split("-")[0]
                                } ${
                                  selectedJointType.split("-")[1]
                                } normal.png`}
                                alt="Normal"
                                fill
                                className="object-contain"
                              />
                            )}
                          </div>
                          <div className="font-bold text-gray-800 text-xl">
                            Normal
                          </div>
                          <div className="text-green-600 font-semibold text-lg">
                            ฿{variantPrices.normal}
                          </div>
                        </div>

                        {/* King Size */}
                        <div
                          className={`cursor-pointer border-2 p-6 text-center transition-all duration-200 ${
                            selectedSize === "king"
                              ? "border-green-500 bg-green-50 transform scale-105"
                              : "border-gray-200 hover:border-green-300"
                          }`}
                          onClick={() => handlePrerollSizeSelect("king")}
                        >
                          <div className="w-32 h-32 mx-auto mb-3 relative">
                            {selectedJointType && (
                              <Image
                                src={`/Product/${
                                  selectedJointType.split("-")[0]
                                } ${selectedJointType.split("-")[1]} king.png`}
                                alt="King"
                                fill
                                className="object-contain"
                              />
                            )}
                          </div>
                          <div className="font-bold text-gray-800 text-xl">
                            King
                          </div>
                          <div className="text-green-600 font-semibold text-lg">
                            ฿{variantPrices.king}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleAddPrerollToCart}
                    disabled={!selectedSize}
                    className={`w-[90%] py-4 px-8 rounded-full font-bold text-2xl transition-colors ${
                      selectedSize
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Preload all images and assets for offline use */}
      <MenuPreloader categories={categories} products={products} />

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
                    {t("sessionExpires")}: {Math.floor(sessionTimer / 60)}:
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
                        <CachedImage
                          src={category.image}
                          alt={category.name}
                          type="category"
                          fill
                          className={`rounded-lg transition-all duration-300 ${
                            selectedCategory === category.id
                              ? "object-contain"
                              : "object-contain"
                          }`}
                          style={{
                            objectFit: "contain",
                          }}
                          showLoading={false}
                        />
                        {/* Cashback Badge - only show for members */}
                        {customer &&
                          !customer.isNoMember &&
                          categoryPercentages[category.id] > 0 && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-18 h-8 flex items-center justify-center border-2 border-white shadow-lg">
                              up to {categoryPercentages[category.id]}%
                            </div>
                          )}
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
          <div className="flex-1 h-full">
            {showPersonalizedJoints ? (
              renderPersonalizedJoints()
            ) : showCustomJointBuilder ? (
              <div className="h-full bg-white rounded-3xl shadow-lg flex flex-col overflow-hidden">
                <CustomJointBuilder
                  onComplete={handleCustomJointComplete}
                  onCancel={handleCustomJointCancel}
                />
              </div>
            ) : (
              <div className="h-full bg-white rounded-3xl shadow-lg flex flex-col overflow-hidden">
                {selectedCategory ? (
                  <div
                    id="kiosk-right-list"
                    className="p-6 overflow-y-auto flex-1 custom-scrollbar rounded-3xl"
                    style={{
                      backgroundImage: categories.find(
                        (cat) => cat.id === selectedCategory
                      )?.backgroundImage
                        ? `url(${
                            categories.find(
                              (cat) => cat.id === selectedCategory
                            ).backgroundImage
                          })`
                        : "none",
                      backgroundSize:
                        categories.find((cat) => cat.id === selectedCategory)
                          ?.backgroundFit || "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    {/* Subcategories */}
                    {getFilteredSubcategories().length > 0 && (
                      <div className="mb-8 space-y-4">
                        {getFilteredSubcategories().map((subcategory) => {
                          const isExpanded =
                            expandedSubcategory === subcategory.id;
                          const subcategoryProducts =
                            getFilteredProducts().filter(
                              (p) => p.subcategoryId === subcategory.id
                            );

                          return (
                            <div
                              key={subcategory.id}
                              className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                                isExpanded ? "shadow-lg" : "shadow-sm"
                              }`}
                              style={{
                                backgroundImage: subcategory.backgroundImage
                                  ? `url(${subcategory.backgroundImage})`
                                  : "none",
                                backgroundSize:
                                  subcategory.backgroundFit || "cover",
                                backgroundPosition: "center",
                                backgroundRepeat: "no-repeat",
                                backgroundColor: subcategory.backgroundImage
                                  ? "transparent"
                                  : "white",
                              }}
                            >
                              {/* Green Header with Title */}
                              <div
                                className="bg-green-600 px-8 py-6"
                                style={{
                                  borderTopLeftRadius: "1rem",
                                  borderTopRightRadius: "1rem",
                                }}
                              >
                                <h5 className="font-bold text-4xl text-white text-center">
                                  {subcategory.name}
                                </h5>
                              </div>

                              {/* Clickable Subcategory Header */}
                              <button
                                onClick={() =>
                                  handleSubcategoryToggle(subcategory.id)
                                }
                                className="flex items-center mb-2 w-full text-left hover:bg-black/10 p-8 transition-all duration-200"
                              >
                                <div className="flex-1 flex items-center justify-end">
                                  <span
                                    className="text-xs px-2 py-1 rounded-full font-medium mr-2"
                                    style={{
                                      color: subcategory.textColor || "#6b7280",
                                      backgroundColor:
                                        subcategory.backgroundImage
                                          ? "rgba(255,255,255,0.8)"
                                          : "#f3f4f6",
                                      textShadow: subcategory.backgroundImage
                                        ? "1px 1px 2px rgba(0,0,0,0.5)"
                                        : "none",
                                    }}
                                  >
                                    {subcategoryProducts.length} products
                                  </span>
                                  <svg
                                    className={`w-5 h-5 transform transition-transform duration-200 ${
                                      isExpanded ? "rotate-180" : "rotate-0"
                                    }`}
                                    style={{
                                      color: subcategory.textColor || "#6b7280",
                                      filter: subcategory.backgroundImage
                                        ? "drop-shadow(1px 1px 2px rgba(0,0,0,0.7))"
                                        : "none",
                                    }}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </div>
                              </button>

                              {/* Expandable Products Grid */}
                              <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                  isExpanded
                                    ? "max-h-screen opacity-100 mb-4"
                                    : "max-h-0 opacity-0"
                                }`}
                              >
                                <div className="grid grid-cols-4 gap-4 p-2">
                                  {getFilteredProducts()
                                    .filter(
                                      (p) => p.subcategoryId === subcategory.id
                                    )
                                    .map((product) => (
                                      <div
                                        key={product.id}
                                        className={`cursor-pointer hover:shadow-md transition-all duration-300 rounded-xl p-3 border relative ${
                                          selectedProduct?.id === product.id
                                            ? "transform scale-105 shadow-lg border-green-500"
                                            : "border-gray-100"
                                        } `}
                                        style={{
                                          backgroundColor:
                                            product.backgroundImage
                                              ? "transparent"
                                              : "rgba(255, 255, 255, 0.8)",
                                        }}
                                        onClick={() =>
                                          handleProductSelect(product)
                                        }
                                      >
                                        {/* Background Image with 80% Opacity */}
                                        {product.backgroundImage && (
                                          <div
                                            className="absolute inset-0 rounded-xl -z-10"
                                            style={{
                                              backgroundImage: `url(${product.backgroundImage})`,
                                              backgroundSize:
                                                product.backgroundFit ||
                                                "cover",
                                              backgroundPosition: "center",
                                              backgroundRepeat: "no-repeat",
                                              opacity: 0.8,
                                            }}
                                          ></div>
                                        )}

                                        {product.mainImage && (
                                          <div className="w-full aspect-[3/4] mb-2 relative">
                                            <CachedImage
                                              src={product.mainImage}
                                              alt={product.name}
                                              type="product"
                                              fill
                                              className="object-contain rounded-lg"
                                              showLoading={false}
                                            />
                                            {getProductCartQuantity(product) >
                                              0 && (
                                              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-lg font-bold shadow-lg">
                                                {getProductCartQuantity(
                                                  product
                                                )}
                                              </div>
                                            )}
                                            {/* Cashback Badge */}
                                            {getProductCashbackPercentage(
                                              product
                                            ) > 0 && (
                                              <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-2 py-1 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
                                                {getProductCashbackPercentage(
                                                  product
                                                ) === "fixed"
                                                  ? "💰"
                                                  : `+${getProductCashbackPercentage(
                                                      product
                                                    )}%`}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        <div className="text-center space-y-1">
                                          <div
                                            className="text-lg font-medium truncate"
                                            style={{
                                              color:
                                                product.textColor || "#6b7280",
                                            }}
                                          >
                                            {product.name}
                                          </div>
                                          <div
                                            className="text-lg font-semibold"
                                            style={{
                                              color:
                                                product.textColor || "#059669",
                                            }}
                                          >
                                            {getProductPriceDisplay(product)}
                                          </div>
                                          {getStockWarningText(product) && (
                                            <div className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full mt-1 animate-pulse">
                                              {getStockWarningText(product)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Products without subcategory */}
                    {getFilteredProducts().filter((p) => !p.subcategoryId)
                      .length > 0 && (
                      <div className="grid grid-cols-4 gap-4">
                        {getFilteredProducts()
                          .filter((p) => !p.subcategoryId)
                          .map((product) => (
                            <div
                              key={product.id}
                              className={`cursor-pointer hover:shadow-md transition-all duration-300 rounded-xl p-3 border relative ${
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
                                  <CachedImage
                                    src={product.mainImage}
                                    alt={product.name}
                                    type="product"
                                    fill
                                    className="object-contain rounded-lg"
                                    showLoading={false}
                                  />
                                  {getProductCartQuantity(product) > 0 && (
                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-lg font-bold shadow-lg">
                                      {getProductCartQuantity(product)}
                                    </div>
                                  )}
                                  {/* Cashback Badge */}
                                  {getProductCashbackPercentage(product) >
                                    0 && (
                                    <div className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full px-2 py-1 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white">
                                      {getProductCashbackPercentage(product) ===
                                      "fixed"
                                        ? "💰"
                                        : `+${getProductCashbackPercentage(
                                            product
                                          )}%`}
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
                                {getStockWarningText(product) && (
                                  <div className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full mt-1 animate-pulse">
                                    {getStockWarningText(product)}
                                  </div>
                                )}
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
                        Select a category from the left to view subcategories
                        and products
                      </p>
                    </div>
                  </div>
                )}
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
            className="w-full bg-red-600 hover:bg-red-700 text-white py-7 px-6 rounded-xl font-semibold text-3xl transition-colors"
          >
            Cancel Order
          </button>
        </div>
      </div>
      {/* overlays outside container to avoid clipping */}

      {/* Quantity/Variant Popup */}
      {showQuantityPopup && selectedProduct && (
        <div
          className={`fixed inset-0 flex items-end justify-center z-50 transition-opacity duration-300 ${
            isPopupClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={handleBackgroundClick}
        >
          {/* Blurred Background Layer with 50% Opacity */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          ></div>

          {/* Close Button - Top Right */}
          <button
            onClick={closeQuantityPopup}
            className="absolute top-8 right-8 bg-red-600 hover:bg-red-700 text-white w-24 h-24 rounded-full font-bold text-4xl transition-all duration-200 shadow-lg z-20 flex items-center justify-center"
          >
            X
          </button>

          {/* Background Content - 3D Model OR Image (Clear and Normal, No Blur) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {selectedProduct.modelUrl ? (
              // Show 3D Model if available with caching and loading animation
              <ModelViewer
                modelUrl={selectedProduct.modelUrl}
                rotationX={selectedProduct.modelRotationX || 90}
                rotationY={selectedProduct.modelRotationY || 75}
                rotationZ={selectedProduct.modelRotationZ || 4.0}
                autoRotate={true}
                className="w-full h-full"
              />
            ) : selectedProduct.mainImage ? (
              // Show large product image if no 3D model
              <CachedImage
                src={selectedProduct.mainImage}
                alt={selectedProduct.name}
                type="product"
                fill
                className="object-contain"
                showLoading={true}
              />
            ) : null}
          </div>

          {/* Quantity Popup - Now Smaller Without Image */}
          <div
            className="bg-white shadow-2xl w-full transition-transform duration-300 ease-out relative z-10"
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
                <div className="flex-1 flex flex-col">
                  {/* Current Variant Options - Scrollable */}
                  <div className="grid grid-cols-3 border border-gray-300 overflow-y-auto max-h-[50vh]">
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
                              // Member with discount - show member price with crossed-out regular price
                              <>
                                <span className="text-green-600 font-semibold text-lg">
                                  ฿{option.memberPrice}
                                </span>
                                <div className="text-gray-500 text-lg">
                                  <span className="line-through">
                                    ฿{option.price}
                                  </span>
                                </div>
                              </>
                            ) : (
                              // No member or no discount - show regular price with member price info
                              <>
                                <span className="text-green-600 font-semibold text-lg">
                                  ฿{option.price}
                                </span>
                                {option.memberPrice &&
                                  option.memberPrice < option.price && (
                                    <div className="text-lg text-gray-500 text-center">
                                      <span className="ml-1">
                                        ฿{option.memberPrice} : MEMBER
                                      </span>
                                    </div>
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
              onClick={() => {
                setShowCart(false);
                if (previousSection === "prerolls") {
                  setShowPersonalizedJoints(true);
                }
              }}
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
                      {t("sessionExpires")}: {Math.floor(cartTimer / 60)}:
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
                  <div className="text-s" style={{ color: "white" }}>
                    {t("itemsCount", {
                      count: cart.reduce(
                        (total, item) => total + (item.quantity || 1),
                        0
                      ),
                    })}
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

                          {/* Custom Joint Details */}
                          {item.isCustomJoint && item.details && (
                            <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                              {item.details.map((detail, idx) => (
                                <div key={idx} className="text-xs">
                                  • {detail}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Regular Product Variants */}
                          {item.variants &&
                            Object.keys(item.variants).length > 0 && (
                              <div className="text-gray-600">
                                {Object.entries(item.variants).map(
                                  ([variantName, variantValue]) => (
                                    <div key={variantName}>
                                      {variantValue?.name ||
                                        (typeof variantValue === "string"
                                          ? variantValue
                                          : JSON.stringify(variantValue))}
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
                  {/* Show breakdown if points are being used */}
                  {pointsToUse > 0 ? (
                    <div className="space-y-3">
                      <div className="text-lg text-gray-600">
                        {t("orderTotal")}
                      </div>
                      <div className="text-3xl font-semibold text-gray-700">
                        ฿{getTotalPrice().toFixed(2)}
                      </div>
                      <div className="text-lg text-green-600">
                        - ฿{pointsValue.toFixed(2)} ({t("pointsDiscount")})
                      </div>
                      <div className="border-t border-gray-300 pt-3">
                        <div className="text-lg text-gray-600 mb-2">
                          {t("finalTotal")}
                        </div>
                        <div className="text-6xl font-bold text-green-600">
                          ฿{formatPrice(getTotalPriceAfterPoints())}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-lg text-gray-600 mb-2">
                        {t("grandTotal")}
                      </div>
                      <div className="text-6xl font-bold text-green-600 mb-4">
                        ฿{formatPrice(getTotalPrice())}
                      </div>
                    </div>
                  )}

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
              {(() => {
                const availablePaymentMethods = getAvailablePaymentMethods();
                const hasAnyPaymentMethod =
                  availablePaymentMethods.cash ||
                  availablePaymentMethods.card ||
                  availablePaymentMethods.crypto;

                if (!hasAnyPaymentMethod) return null;

                return (
                  <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <h3 className="text-2xl font-bold mb-6">
                      {t("paymentMethod")}
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {availablePaymentMethods.cash && (
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
                            <div className="text-xl font-semibold">
                              {t("cash")}
                            </div>
                          </div>
                        </button>
                      )}
                      {availablePaymentMethods.card && (
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
                            <div className="text-xl font-semibold">
                              {t("card")}
                            </div>
                          </div>
                        </button>
                      )}
                      {availablePaymentMethods.crypto && (
                        <button
                          onClick={() => {
                            setPaymentMethod("crypto");
                            setShowCryptoModal(true);
                            loadCryptoData();
                          }}
                          className={`p-6 rounded-xl border-2 transition-all ${
                            paymentMethod === "crypto"
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-4xl mb-2">₿</div>
                            <div className="text-xl font-semibold">
                              {t("crypto")}
                            </div>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Selected Cryptocurrency Display */}
                    {paymentMethod === "crypto" && selectedCryptoCurrency && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 mr-3">
                            <img
                              src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${getCryptoIconSymbol(
                                selectedCryptoCurrency
                              )}.svg`}
                              alt={selectedCryptoCurrency.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                            <div
                              className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-sm font-bold text-white"
                              style={{ display: "none" }}
                            >
                              {(
                                selectedCryptoCurrency.code ||
                                selectedCryptoCurrency.currency
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold text-blue-800">
                              Selected:{" "}
                              {(
                                selectedCryptoCurrency.code ||
                                selectedCryptoCurrency.currency
                              ).toUpperCase()}
                            </div>
                            <div className="text-sm text-blue-600">
                              {selectedCryptoCurrency.name ||
                                "Cryptocurrency Payment"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Points Usage Section - Only show for members */}
              {customer && !customer.isNoMember && customer.totalPoints > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">{t("usePoints")}</h3>
                    <div className="text-lg font-semibold text-green-600">
                      -{pointsToUse} {t("points")}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-2">
                      {t("availablePoints")}: {customer.totalPoints}{" "}
                      {t("points")}
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      {t("pointsValue")}: ฿{pointsValue}
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">
                        Slide to adjust
                      </span>
                      <span
                        className={`text-sm font-medium px-2 py-1 rounded transition-colors ${
                          isNearSnapPoint(pointsUsagePercentage)
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {pointsUsagePercentage}%
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={pointsUsagePercentage}
                        onChange={(e) =>
                          handlePointsSliderChange(parseInt(e.target.value))
                        }
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${pointsUsagePercentage}%, #e5e7eb ${pointsUsagePercentage}%, #e5e7eb 100%)`,
                        }}
                      />
                      {/* Tick marks for snap points */}
                      <div className="absolute top-0 w-full h-3 pointer-events-none">
                        {[25, 50, 75, 100].map((snapPoint) => {
                          const isNear =
                            Math.abs(pointsUsagePercentage - snapPoint) <= 4;
                          return (
                            <div
                              key={snapPoint}
                              className={`absolute top-1/2 transform -translate-y-1/2 w-0.5 h-3 transition-all duration-200 ${
                                isNear
                                  ? "bg-green-400 shadow-sm shadow-green-400 opacity-90"
                                  : "bg-gray-400 opacity-50"
                              }`}
                              style={{ left: `${snapPoint}%` }}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick selection buttons */}
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 25, 50, 75, 100].map((percentage) => (
                      <button
                        key={percentage}
                        onClick={() => handlePointsSliderChange(percentage)}
                        className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                          pointsUsagePercentage === percentage
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {percentage}%
                      </button>
                    ))}
                  </div>

                  {pointsValue > 0 && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-sm text-green-800">
                        {t("savingWithPoints")}: ฿{pointsValue}
                      </div>
                      <div className="text-sm text-green-600">
                        {t("newTotal")}: ฿{getTotalPriceAfterPoints()}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  {processing ? t("processing") : getCompleteOrderButtonText()}
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
                              {variantValue?.name ||
                                (typeof variantValue === "string"
                                  ? variantValue
                                  : JSON.stringify(variantValue))}
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
                {/* Show original total if points were used */}
                {(completedOrder.pointsUsed || 0) > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                    }}
                  >
                    <span>Subtotal</span>
                    <span>
                      ฿
                      {(
                        completedOrder.originalTotal ||
                        completedOrder.total ||
                        0
                      ).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Show points usage if any */}
                {(completedOrder.pointsUsed || 0) > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#059669",
                    }}
                  >
                    <span>Points Used (-{completedOrder.pointsUsed || 0})</span>
                    <span>
                      -฿{(completedOrder.pointsUsedValue || 0).toFixed(2)}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    fontWeight: "bold",
                    borderTop:
                      (completedOrder.pointsUsed || 0) > 0
                        ? "1px solid #000"
                        : "none",
                    paddingTop:
                      (completedOrder.pointsUsed || 0) > 0 ? "2mm" : "0",
                  }}
                >
                  <span>{t("total")}</span>
                  <span>฿{(completedOrder.total || 0).toFixed(2)}</span>
                </div>

                {/* Payment Method */}
                <div style={{ fontSize: "12px", marginTop: "2mm" }}>
                  <div>
                    {t("paymentMethodLabel")}{" "}
                    {completedOrder.paymentMethod === "bank_transfer"
                      ? t("bankTransfer")
                      : completedOrder.paymentMethod === "crypto"
                      ? t("crypto")
                      : completedOrder.paymentMethod === "card"
                      ? t("card")
                      : t("cash")}
                  </div>
                </div>

                {completedOrder.customer &&
                  !completedOrder.customer.isNoMember && (
                    <div style={{ fontSize: "10px", marginTop: "2mm" }}>
                      <div>
                        {t("customerLabel")}: {completedOrder.customer.name}
                      </div>
                      {(completedOrder.pointsUsed || 0) > 0 && (
                        <div>
                          Points Used: {completedOrder.pointsUsed || 0} (
                          {completedOrder.pointsUsagePercentage || 0}%)
                        </div>
                      )}
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
                      {(completedOrder.pointsUsed || 0) > 0 && (
                        <p className="text-blue-600 font-medium">
                          Points Used: {completedOrder.pointsUsed || 0} points
                        </p>
                      )}
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
                    {/* Show original total if points were used */}
                    {(completedOrder.pointsUsed || 0) > 0 && (
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>
                          ฿
                          {(
                            completedOrder.originalTotal ||
                            completedOrder.total ||
                            0
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Show points usage if any */}
                    {(completedOrder.pointsUsed || 0) > 0 && (
                      <>
                        <div className="flex justify-between mb-2 text-green-600">
                          <span>
                            Points Used ({completedOrder.pointsUsed || 0} pts):
                          </span>
                          <span>
                            -฿{(completedOrder.pointsUsedValue || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between mb-2 text-sm text-gray-500">
                          <span>
                            {completedOrder.pointsUsagePercentage || 0}% of
                            available points
                          </span>
                          <span></span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between border-t border-gray-200 pt-2">
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

      {/* Session Expiry Modal */}
      {showSessionExpiryModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 m-4 max-w-md w-full border-2 border-red-200">
            <div className="text-center">
              <div className="text-6xl mb-4">⏰</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                {t("areYouStillThere")}
              </h3>
              <p className="text-gray-600 mb-6 text-lg">
                {t("sessionExpiryMessage")}
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleSessionContinue}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-bold text-lg transition-colors"
                >
                  {t("yes")}
                </button>
                <button
                  onClick={handleSessionTimeout}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-bold text-lg transition-colors"
                >
                  {t("no")} ({sessionModalCountdown})
                </button>
              </div>
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

      {/* Crypto Payment Modal */}
      {showCryptoModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 m-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Select Cryptocurrency
              </h3>
              <button
                onClick={() => {
                  setShowCryptoModal(false);
                  setPaymentMethod("cash"); // Reset to cash if modal is closed
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {loadingCrypto ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <div className="text-lg text-gray-600">
                  Loading available cryptocurrencies...
                </div>
              </div>
            ) : creatingPayment ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <div className="text-lg text-gray-600">Creating payment...</div>
                <div className="text-sm text-gray-500 mt-2">
                  Please wait while we generate your payment details
                </div>
              </div>
            ) : (
              <div>
                {/* Payment Error */}
                {paymentError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                      <div className="text-red-600 text-2xl mr-3">⚠️</div>
                      <div>
                        <div className="font-semibold text-red-800">
                          Payment Creation Failed
                        </div>
                        <div className="text-red-600 text-sm">
                          {paymentError}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Order Total:</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ฿{getTotalPrice().toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Currency Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[
                    { code: "usdterc20", displayName: "USDT (ERC)" },
                    { code: "usdttrc20", displayName: "USDT (TRC)" },
                    { code: "btc", displayName: "BTC" },
                    { code: "eth", displayName: "ETH" },
                    { code: "xrp", displayName: "XRP" },
                    { code: "trx", displayName: "TRX" },
                    { code: "usdc", displayName: "USDC (ERC)" },
                    { code: "sol", displayName: "SOL" },
                  ].map((item) => {
                    const currencyCode = item.code.toLowerCase();
                    const minimum = currencyMinimums[currencyCode];
                    const totalOrderInBath = getTotalPrice();
                    const totalOrderInUsd = convertBathToUsd(totalOrderInBath);

                    // Find currency in available currencies
                    const currency = availableCurrencies.find(
                      (c) =>
                        (c.code && c.code.toLowerCase() === currencyCode) ||
                        (c.currency &&
                          c.currency.toLowerCase() === currencyCode)
                    );

                    // Check if order meets minimum requirement
                    const meetsMinimum = minimum
                      ? totalOrderInUsd >= minimum.fiatEquivalent
                      : false;

                    const isDisabled = !currency || !meetsMinimum;

                    return (
                      <button
                        key={item.code}
                        onClick={() => {
                          if (!isDisabled && currency) {
                            setSelectedCryptoCurrency(currency);
                            setShowCryptoModal(false);
                            console.log("Selected crypto currency:", currency);
                          }
                        }}
                        disabled={isDisabled}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isDisabled
                            ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                            : "border-gray-200 hover:border-green-500 hover:bg-green-50 cursor-pointer"
                        }`}
                      >
                        <div className="text-center">
                          {/* Currency Logo */}
                          <div className="w-12 h-12 mx-auto mb-2 relative">
                            {currency ? (
                              <>
                                <img
                                  src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${getCryptoIconSymbol(
                                    { code: currencyCode }
                                  )}.svg`}
                                  alt={item.displayName}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                                <div
                                  className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg"
                                  style={{ display: "none" }}
                                >
                                  {currencyCode.charAt(0).toUpperCase()}
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold text-gray-500">
                                {currencyCode.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Currency Info */}
                          <div className="font-semibold text-lg">
                            {item.displayName}
                          </div>

                          {/* Status and Minimum Amount */}
                          {isDisabled ? (
                            <div className="mt-2">
                              <div className="text-xs text-red-600 font-semibold">
                                Unavailable
                              </div>
                              {minimum && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Min: ฿
                                  {minimum.minAmountInBath?.toFixed(0) || "N/A"}
                                </div>
                              )}
                            </div>
                          ) : (
                            minimum && (
                              <div className="text-xs text-green-600 mt-2">
                                Min: ฿
                                {minimum.minAmountInBath?.toFixed(0) || "N/A"}
                              </div>
                            )
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Information Note */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <div className="font-semibold mb-2">
                      📝 Important Notes:
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      <li>All prices are displayed in Thai Baht (฿)</li>
                      <li>
                        Minimum payment amounts are required for each
                        cryptocurrency
                      </li>
                      <li>
                        Transaction fees may apply depending on the selected
                        currency
                      </li>
                      <li>
                        Payment processing may take a few minutes to confirm
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {showPaymentModal && paymentDetails && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 m-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Complete Your Payment
              </h3>
              <div className="text-lg text-green-600 font-semibold">
                {(
                  selectedCryptoCurrency?.code ||
                  selectedCryptoCurrency?.currency ||
                  ""
                ).toUpperCase()}{" "}
                Payment
              </div>
            </div>

            {/* Payment Status */}
            <div
              className={`rounded-lg p-4 mb-6 ${
                paymentStatus?.payment_status === "finished" ||
                paymentStatus?.payment_status === "confirmed"
                  ? "bg-green-50 border border-green-200"
                  : paymentStatus?.payment_status === "failed" ||
                    paymentStatus?.payment_status === "expired" ||
                    paymentStatus?.payment_status === "refunded"
                  ? "bg-red-50 border border-red-200"
                  : paymentStatus?.payment_status === "confirming" ||
                    paymentStatus?.payment_status === "sending"
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              <div className="flex items-center justify-center">
                <div
                  className={`text-2xl mr-3 ${
                    paymentStatus?.payment_status === "finished" ||
                    paymentStatus?.payment_status === "confirmed"
                      ? "text-green-600"
                      : paymentStatus?.payment_status === "failed" ||
                        paymentStatus?.payment_status === "expired" ||
                        paymentStatus?.payment_status === "refunded"
                      ? "text-red-600"
                      : paymentStatus?.payment_status === "confirming" ||
                        paymentStatus?.payment_status === "sending"
                      ? "text-blue-600"
                      : "text-yellow-600"
                  }`}
                >
                  {paymentStatus?.payment_status === "finished" ||
                  paymentStatus?.payment_status === "confirmed"
                    ? "✅"
                    : paymentStatus?.payment_status === "failed" ||
                      paymentStatus?.payment_status === "expired" ||
                      paymentStatus?.payment_status === "refunded"
                    ? "❌"
                    : paymentStatus?.payment_status === "confirming" ||
                      paymentStatus?.payment_status === "sending"
                    ? "🔄"
                    : "⏳"}
                </div>
                <div>
                  <div
                    className={`font-semibold ${
                      paymentStatus?.payment_status === "finished" ||
                      paymentStatus?.payment_status === "confirmed"
                        ? "text-green-800"
                        : paymentStatus?.payment_status === "failed" ||
                          paymentStatus?.payment_status === "expired" ||
                          paymentStatus?.payment_status === "refunded"
                        ? "text-red-800"
                        : paymentStatus?.payment_status === "confirming" ||
                          paymentStatus?.payment_status === "sending"
                        ? "text-blue-800"
                        : "text-yellow-800"
                    }`}
                  >
                    Payment Status:{" "}
                    {paymentStatus?.payment_status ||
                      paymentDetails.payment_status}
                  </div>
                  <div
                    className={`text-sm ${
                      paymentStatus?.payment_status === "finished" ||
                      paymentStatus?.payment_status === "confirmed"
                        ? "text-green-700"
                        : paymentStatus?.payment_status === "failed" ||
                          paymentStatus?.payment_status === "expired" ||
                          paymentStatus?.payment_status === "refunded"
                        ? "text-red-700"
                        : paymentStatus?.payment_status === "confirming" ||
                          paymentStatus?.payment_status === "sending"
                        ? "text-blue-700"
                        : "text-yellow-700"
                    }`}
                  >
                    {paymentStatus?.payment_status === "finished"
                      ? "Payment completed successfully!"
                      : paymentStatus?.payment_status === "confirmed"
                      ? "Payment confirmed, processing..."
                      : paymentStatus?.payment_status === "confirming"
                      ? "Transaction being processed on blockchain..."
                      : paymentStatus?.payment_status === "sending"
                      ? "Funds being sent to wallet..."
                      : paymentStatus?.payment_status === "failed"
                      ? "Payment failed. Please try again."
                      : paymentStatus?.payment_status === "expired"
                      ? "Payment expired. Please create a new payment."
                      : paymentStatus?.payment_status === "refunded"
                      ? "Payment has been refunded."
                      : "Waiting for your payment..."}
                  </div>
                  {checkingStatus && (
                    <div className="text-xs text-gray-500 mt-1">
                      🔄 Checking status...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">
                Order Summary
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="font-mono text-sm">
                    {paymentDetails.order_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-semibold">
                    ฿{getTotalPrice().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>USD Equivalent:</span>
                  <span>${paymentDetails.price_amount}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Pay Amount:</span>
                  <span className="text-green-600">
                    {paymentDetails.pay_amount}{" "}
                    {paymentDetails.pay_currency.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code and Payment Address */}
            <div className="text-center mb-6">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
                <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${paymentDetails.pay_address}`}
                    alt="Payment QR Code"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div
                    className="w-full h-full flex items-center justify-center text-gray-500 text-sm"
                    style={{ display: "none" }}
                  >
                    QR Code unavailable
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-2">Payment Address:</div>
              <div className="bg-gray-100 p-3 rounded-lg border">
                <div className="font-mono text-sm break-all">
                  {paymentDetails.pay_address}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(paymentDetails.pay_address);
                    // You could add a toast notification here
                  }}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  Copy Address
                </button>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">
                Payment Instructions:
              </h4>
              <ol className="list-decimal list-inside text-blue-700 text-sm space-y-1">
                <li>Scan the QR code with your crypto wallet</li>
                <li>Or copy the payment address above</li>
                <li>
                  Send exactly{" "}
                  <strong>
                    {paymentDetails.pay_amount}{" "}
                    {paymentDetails.pay_currency.toUpperCase()}
                  </strong>
                </li>
                <li>Wait for payment confirmation</li>
              </ol>
            </div>

            {/* Important Notes */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-red-800 mb-2">⚠️ Important:</h4>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                <li>
                  Send only {paymentDetails.pay_currency.toUpperCase()} to this
                  address
                </li>
                <li>
                  Send the exact amount: {paymentDetails.pay_amount}{" "}
                  {paymentDetails.pay_currency.toUpperCase()}
                </li>
                <li>
                  Payment expires on:{" "}
                  {new Date(
                    paymentDetails.expiration_estimate_date
                  ).toLocaleString()}
                </li>
                <li>Do not send from an exchange - use your personal wallet</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              {paymentStatus?.payment_status === "finished" ||
              paymentStatus?.payment_status === "confirmed" ? (
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    // Transaction is already processed by completeCryptoTransaction
                  }}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  ✅ Payment Complete - Continue
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      // Clear payment monitoring
                      if (paymentStatusTimer) {
                        clearInterval(paymentStatusTimer);
                        setPaymentStatusTimer(null);
                      }
                      setShowPaymentModal(false);
                      setPaymentDetails(null);
                      setPaymentStatus(null);
                      setSelectedCryptoCurrency(null);
                      setPaymentMethod("cash"); // Reset to cash
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    Cancel Payment
                  </button>
                  <button
                    onClick={() => {
                      if (paymentDetails?.payment_id) {
                        checkPaymentStatus(paymentDetails.payment_id);
                      }
                    }}
                    disabled={checkingStatus}
                    className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                      checkingStatus
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    {checkingStatus ? "🔄 Checking..." : "🔍 Check Status Now"}
                  </button>
                </>
              )}
            </div>

            {/* Auto-refresh indicator */}
            <div className="text-center mt-4">
              <div className="text-xs text-gray-500">
                {paymentStatusTimer ? (
                  <>
                    🔄 Auto-checking every 5 seconds • Last check:{" "}
                    {new Date().toLocaleTimeString()}
                  </>
                ) : (
                  "Monitoring stopped"
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
