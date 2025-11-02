"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "./components/StepIndicator";
import PaperStep from "./components/PaperStep";
import FilterStep from "./components/FilterStep";
import FillingStep from "./components/FillingStep";
import ExternalStep from "./components/ExternalStep";
import ReviewStep from "./components/ReviewStep";
import JointVisualizer from "./components/JointVisualizer";
import {
  validateConfiguration,
  isTobaccoRequired,
  calculateRequiredTobacco,
  validateFillingCapacity,
  areInternalOptionsAllowed,
  isFilterAllowed,
  PAPER_TYPES,
} from "./utils/conflictsAndDosages";

export default function CustomJointBuilder() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Session timer states
  const [sessionTimer, setSessionTimer] = useState(300); // 5 minutes in seconds
  const [showSessionExpiryModal, setShowSessionExpiryModal] = useState(false);
  const [sessionModalCountdown, setSessionModalCountdown] = useState(60);
  const sessionTimerRef = useRef(null);
  const sessionCountdownRef = useRef(null);

  // Back confirmation modal state
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);

  const [jointConfig, setJointConfig] = useState({
    // Paper Configuration
    paper: null, // { type, capacity, customLength, name, price }

    // Filter Configuration
    filter: null, // { type, name, price }

    // Filling Configuration
    filling: {
      totalCapacity: 0,
      flower: [], // [{ strain, percentage, weight, pricePerGram }]
      hash: [], // [{ type, percentage, weight, pricePerGram }]
      worm: null, // { enabled, type, weight, price }
      tobacco: 0, // Tobacco amount in grams (for hash-only joints)
    },

    // External Configuration
    external: {
      coating: null, // { type, name, price, weight }
      wrap: null, // { type, name, price, weight }
    },

    // Pricing
    totalPrice: 0,
  });

  // Validation and alerts state
  const [validationErrors, setValidationErrors] = useState([]);
  const [showTobaccoAlert, setShowTobaccoAlert] = useState(false);
  const [requiredTobacco, setRequiredTobacco] = useState(0);

  const steps = [
    { number: 1, title: "Rolling Paper", subtitle: "Select capacity & type" },
    { number: 2, title: "Filter", subtitle: "Choose filter type" },
    { number: 3, title: "Filling", subtitle: "Customize composition" },
    { number: 4, title: "External", subtitle: "Add coatings & wraps" },
    { number: 5, title: "Review", subtitle: "Confirm your joint" },
  ];

  // Set 5-minute timeout for this page, restore 1-minute on unmount
  useEffect(() => {
    // Set session timeout to 5 minutes for this page
    localStorage.setItem("idleTimeout", "300000"); // 5 minutes in milliseconds
    console.log("Session timeout extended to 5 minutes");

    // Cleanup: Reset to 1 minute when leaving this page
    return () => {
      localStorage.setItem("idleTimeout", "60000"); // 1 minute in milliseconds
      console.log("Session timeout reset to 1 minute");
    };
  }, []);

  // Calculate total price whenever relevant config changes
  useEffect(() => {
    let total = 0;

    // Paper price
    if (jointConfig.paper) {
      total += jointConfig.paper.price || 0;
    }

    // Filter price
    if (jointConfig.filter) {
      total += jointConfig.filter.price || 0;
    }

    // Filling prices
    jointConfig.filling.flower.forEach((f) => {
      total += (f.pricePerGram || 0) * (f.weight || 0);
    });
    jointConfig.filling.hash.forEach((h) => {
      total += (h.pricePerGram || 0) * (h.weight || 0);
    });
    if (jointConfig.filling.worm) {
      total += jointConfig.filling.worm.price || 0;
    }

    // External prices
    if (jointConfig.external.coating) {
      total += jointConfig.external.coating.price || 0;
    }
    if (jointConfig.external.wrap) {
      total += jointConfig.external.wrap.price || 0;
    }

    // Only update if price actually changed
    if (total !== jointConfig.totalPrice) {
      setJointConfig((prev) => ({ ...prev, totalPrice: total }));
    }
  }, [
    jointConfig.paper,
    jointConfig.filter,
    jointConfig.filling,
    jointConfig.external,
    jointConfig.totalPrice,
  ]);

  // Validate configuration and check for conflicts
  useEffect(() => {
    const validation = validateConfiguration(jointConfig);
    setValidationErrors(validation.errors);

    // Check tobacco requirement for hash-only joints
    if (isTobaccoRequired(jointConfig.filling)) {
      const required = calculateRequiredTobacco(jointConfig.filling);
      setRequiredTobacco(required);
      setShowTobaccoAlert(jointConfig.filling.tobacco < required * 0.95);
    } else {
      setShowTobaccoAlert(false);
      setRequiredTobacco(0);
    }
  }, [jointConfig]);

  // Session timer - 5 minute timeout with activity reset
  useEffect(() => {
    const startSessionTimer = () => {
      // Clear existing timers
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }
      if (sessionCountdownRef.current) {
        clearInterval(sessionCountdownRef.current);
      }

      // Reset timer
      setSessionTimer(300); // 5 minutes = 300 seconds

      // Start countdown interval
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

      // Set timeout for 5 minutes
      sessionTimerRef.current = setTimeout(() => {
        clearInterval(sessionCountdownRef.current);
        setShowSessionExpiryModal(true);
        setSessionModalCountdown(60);
      }, 300000); // 5 minutes in milliseconds
    };

    startSessionTimer();

    // Cleanup on unmount
    return () => {
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }
      if (sessionCountdownRef.current) {
        clearInterval(sessionCountdownRef.current);
      }
    };
  }, []);

  // Reset session timer on user interactions
  const resetSessionTimer = useCallback(() => {
    // Clear existing timers
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }
    if (sessionCountdownRef.current) {
      clearInterval(sessionCountdownRef.current);
    }

    // Reset timer to 5 minutes
    setSessionTimer(300);

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

    // Set new timeout for 5 minutes
    sessionTimerRef.current = setTimeout(() => {
      clearInterval(sessionCountdownRef.current);
      setShowSessionExpiryModal(true);
      setSessionModalCountdown(60);
    }, 300000);
  }, []);

  const handleSessionTimeout = useCallback(() => {
    // Clear all session data and go back to menu
    setShowSessionExpiryModal(false);
    router.push("/menu");
  }, [router]);

  const handleSessionContinue = useCallback(() => {
    setShowSessionExpiryModal(false);
    setSessionModalCountdown(60);
    resetSessionTimer();
  }, [resetSessionTimer]);

  // Session expiry modal countdown timer
  useEffect(() => {
    let modalCountdownInterval;

    if (showSessionExpiryModal) {
      modalCountdownInterval = setInterval(() => {
        setSessionModalCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(modalCountdownInterval);
            handleSessionTimeout();
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
  }, [showSessionExpiryModal, handleSessionTimeout]);

  const updateConfig = (key, value) => {
    resetSessionTimer(); // Reset timer on any config change
    setJointConfig((prev) => {
      const updated = { ...prev, [key]: value };

      // Update filling capacity when paper changes
      if (key === "paper" && value) {
        updated.filling = {
          ...prev.filling,
          totalCapacity: value.capacity || 0,
        };
      }

      return updated;
    });
  };

  const nextStep = () => {
    resetSessionTimer(); // Reset timer on step change
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    resetSessionTimer(); // Reset timer on step change
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return jointConfig.paper !== null;
      case 2:
        // Skip filter step if pre-rolled (has built-in filter)
        if (jointConfig.paper?.type === PAPER_TYPES.PRE_ROLLED_CK) {
          return true;
        }
        return jointConfig.filter !== null;
      case 3:
        // Check if filling exists
        const hasFilling =
          jointConfig.filling.flower.length > 0 ||
          jointConfig.filling.hash.length > 0;

        // Check tobacco requirement for hash-only joints
        if (isTobaccoRequired(jointConfig.filling)) {
          const required = calculateRequiredTobacco(jointConfig.filling);
          const hasEnoughTobacco =
            jointConfig.filling.tobacco >= required * 0.95;
          return hasFilling && hasEnoughTobacco;
        }

        return hasFilling;
      case 4:
        return true; // External is optional
      case 5:
        return validationErrors.length === 0;
      default:
        return false;
    }
  };

  const handleBack = () => {
    resetSessionTimer(); // Reset timer on interaction
    // Show confirmation modal instead of going back directly
    setShowBackConfirmation(true);
  };

  const confirmBack = () => {
    setShowBackConfirmation(false);
    router.push("/menu");
  };

  const cancelBack = () => {
    setShowBackConfirmation(false);
  };

  const handleComplete = () => {
    resetSessionTimer(); // Reset timer on interaction
    // Handle the completed joint configuration
    console.log("Joint configuration completed:", jointConfig);

    // Generate detailed description for cart display
    const details = [];

    // Paper details
    if (jointConfig.paper) {
      details.push(
        `Paper: ${jointConfig.paper.name}${
          jointConfig.paper.customLength
            ? ` (${jointConfig.paper.customLength}cm)`
            : ""
        }`
      );
      details.push(`Capacity: ${jointConfig.paper.capacity.toFixed(1)}g`);
    }

    // Filter details
    if (jointConfig.filter) {
      details.push(`Filter: ${jointConfig.filter.name}`);
    }

    // Filling details
    if (jointConfig.filling) {
      // Worm
      if (jointConfig.filling.worm) {
        details.push(`Worm: ${jointConfig.filling.worm.name}`);
      }

      // Flower strains
      if (jointConfig.filling.flower && jointConfig.filling.flower.length > 0) {
        jointConfig.filling.flower.forEach((f) => {
          details.push(`Flower: ${f.name} (${f.weight.toFixed(1)}g)`);
        });
      }

      // Hash
      if (jointConfig.filling.hash && jointConfig.filling.hash.length > 0) {
        jointConfig.filling.hash.forEach((h) => {
          details.push(`Hash: ${h.name} (${h.weight.toFixed(1)}g)`);
        });
      }
    }

    // External details
    if (jointConfig.external) {
      if (jointConfig.external.coating) {
        details.push(`Coating: ${jointConfig.external.coating.name}`);
      }
      if (jointConfig.external.wrap) {
        details.push(`Wrap: ${jointConfig.external.wrap.name}`);
      }
    }

    // Add the custom joint to cart
    const cartItem = {
      id: `custom-joint-${Date.now()}`, // Unique ID for custom joint
      name: "Custom Joint",
      price: jointConfig.totalPrice,
      quantity: 1,
      image: "/Product/indoor hybrid normal.png", // Default joint image
      productId: `custom-joint-${Date.now()}`,
      categoryId: "custom-joint",
      cashbackEnabled: false, // Custom joints don't have cashback
      isCustomJoint: true, // Flag to identify custom joints
      config: jointConfig, // Store the full configuration
      details: details, // Detailed breakdown for cart display
    };

    // Get existing cart from sessionStorage
    const existingCart = JSON.parse(sessionStorage.getItem("cart") || "[]");

    // Add custom joint to cart
    const newCart = [...existingCart, cartItem];

    // Save to sessionStorage
    sessionStorage.setItem("cart", JSON.stringify(newCart));

    console.log("Custom joint added to cart:", cartItem);

    // Redirect back to main kiosk menu
    router.push("/menu");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 overscroll-none"
      onClick={resetSessionTimer}
      onMouseMove={resetSessionTimer}
      onKeyDown={resetSessionTimer}
      onTouchStart={(e) => {
        resetSessionTimer();
        // Prevent pull-to-refresh and swipe gestures
        if (e.touches.length > 1) return;
        const touch = e.touches[0];
        const target = e.target;
        // Only prevent if not on a slider or interactive element
        if (
          !target.closest('input[type="range"]') &&
          !target.closest("button")
        ) {
          if (touch.clientX < 50 || touch.clientX > window.innerWidth - 50) {
            e.preventDefault();
          }
        }
      }}
      onTouchMove={(e) => {
        // Don't prevent touch move on sliders
        if (!e.target.closest('input[type="range"]')) {
          const touch = e.touches[0];
          if (touch.clientX < 50 || touch.clientX > window.innerWidth - 50) {
            e.preventDefault();
          }
        }
      }}
      style={{ touchAction: "pan-y" }}
    >
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 z-[60] p-6 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-xl font-medium transition-all duration-300 border border-white/20 text-white shadow-lg hover:shadow-xl flex items-center gap-2 group"
      >
        <svg
          className="w-10 h-10 transition-transform group-hover:-translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      </button>

      {/* Session Timer Display */}
      <div className="absolute top-6 right-6 z-[60] p-6 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 text-white shadow-lg">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5"
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
          <span className="font-medium text-3xl">
            {Math.floor(sessionTimer / 60)}:
            {(sessionTimer % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Full Screen Joint Builder */}
      <div className="w-full h-full pt-20 overflow-y-auto">
        {/* Animated Background */}
        <div className="fixed inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-lime-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 pt-8 pb-6 text-center text-white">
          <h1 className="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-200 via-emerald-200 to-lime-200 flex items-center justify-center gap-4">
            <span className="text-green-400">🌿</span>
            Custom Joint Builder
            <span className="text-green-400">🌿</span>
          </h1>
          <p className="text-green-200 text-lg">
            Craft your perfect joint, step by step
          </p>
        </div>

        {/* Step Indicator */}
        <div className="relative z-10 px-8 mb-8">
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
            canNavigate={(step) => step <= currentStep}
          />
        </div>

        {/* Live Preview Section */}
        <div className="relative z-10 px-8 mb-8">
          <div className="max-w-7xl mx-auto">
            <JointVisualizer config={jointConfig} />
          </div>
        </div>

        {/* Main Content Area - Configuration Steps */}
        <div className="relative z-10 px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl text-white">
              <div className="transition-all duration-500 ease-in-out">
                {currentStep === 1 && (
                  <PaperStep
                    config={jointConfig}
                    updateConfig={updateConfig}
                    onNext={nextStep}
                  />
                )}
                {currentStep === 2 && (
                  <FilterStep
                    config={jointConfig}
                    updateConfig={updateConfig}
                    onNext={nextStep}
                    onPrev={prevStep}
                  />
                )}
                {currentStep === 3 && (
                  <FillingStep
                    config={jointConfig}
                    updateConfig={updateConfig}
                    onNext={nextStep}
                    onPrev={prevStep}
                  />
                )}
                {currentStep === 4 && (
                  <ExternalStep
                    config={jointConfig}
                    updateConfig={updateConfig}
                    onNext={nextStep}
                    onPrev={prevStep}
                  />
                )}
                {currentStep === 5 && (
                  <ReviewStep
                    config={jointConfig}
                    onPrev={prevStep}
                    onComplete={handleComplete}
                  />
                )}
              </div>

              {/* Navigation Buttons (for steps that need manual navigation) */}
              {currentStep !== 5 && (
                <div className="flex justify-between mt-8 pt-6 border-t border-white/20">
                  <button
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-300 border border-white/20 text-white"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!canProceed()}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl text-white"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add custom animations */}
        <style jsx global>{`
          /* Force white text for this page */
          body {
            color: white !important;
            overscroll-behavior: none !important;
            overflow-x: hidden !important;
          }

          /* Prevent pull-to-refresh and swipe navigation */
          html {
            overscroll-behavior: none !important;
            overflow-x: hidden !important;
          }

          /* Disable swipe-to-navigate on Chrome */
          * {
            overscroll-behavior-x: none !important;
          }

          @keyframes blob {
            0% {
              transform: translate(0px, 0px) scale(1);
            }
            33% {
              transform: translate(30px, -50px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
            100% {
              transform: translate(0px, 0px) scale(1);
            }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}</style>
      </div>

      {/* Tobacco Requirement Alert */}
      {showTobaccoAlert && currentStep === 3 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[60] max-w-2xl mx-4">
          <div className="bg-amber-500 text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-amber-400 flex items-center gap-4">
            <svg
              className="w-8 h-8 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <h4 className="font-bold text-lg mb-1">Tobacco Required</h4>
              <p className="text-sm">
                Hash-only joints require tobacco. Please add at least{" "}
                <strong>{requiredTobacco.toFixed(1)}g of tobacco</strong> to
                proceed.
                <br />
                <span className="text-xs opacity-90">
                  (1 cigarette ≈ 1g per 0.5g hash)
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors Display */}
      {validationErrors.length > 0 && currentStep === 5 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[60] max-w-2xl mx-4">
          <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-red-400">
            <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Configuration Errors
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Session Expiry Modal */}
      {showSessionExpiryModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                <svg
                  className="h-8 w-8 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Session Expiring
              </h3>
              <p className="text-gray-600 mb-6">
                Your session will expire in{" "}
                <span className="font-bold text-yellow-600">
                  {sessionModalCountdown}
                </span>{" "}
                seconds. Do you want to continue?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleSessionTimeout}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition-all"
                >
                  Exit
                </button>
                <button
                  onClick={handleSessionContinue}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                >
                  Continue ({sessionModalCountdown}s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Confirmation Modal */}
      {showBackConfirmation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Discard Custom Joint?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to go back? All your customization
                progress will be lost.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={cancelBack}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-xl font-medium hover:bg-gray-300 transition-all"
                >
                  Stay Here
                </button>
                <button
                  onClick={confirmBack}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
                >
                  Discard & Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
