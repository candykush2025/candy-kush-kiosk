"use client";

import { useState, useEffect } from "react";
import StepIndicator from "../app/menu/personalizedJoint/components/StepIndicator";
import PaperStep from "../app/menu/personalizedJoint/components/PaperStep";
import FilterStep from "../app/menu/personalizedJoint/components/FilterStep";
import FillingStep from "../app/menu/personalizedJoint/components/FillingStep";
import ExternalStep from "../app/menu/personalizedJoint/components/ExternalStep";
import ReviewStep from "../app/menu/personalizedJoint/components/ReviewStep";
import JointVisualizer from "../app/menu/personalizedJoint/components/JointVisualizer";

export default function CustomJointBuilder({ onComplete, onCancel }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [jointConfig, setJointConfig] = useState({
    // Paper Configuration
    paper: null, // { type, capacity, customLength }

    // Filter Configuration
    filter: null, // { type, name, price }

    // Filling Configuration
    filling: {
      totalCapacity: 0,
      flower: [], // [{ strain, percentage, weight }]
      hash: [], // [{ type, percentage, weight }]
      worm: null, // { enabled, type, weight }
    },

    // External Configuration
    external: {
      coating: null, // { type, name, price }
      wrap: null, // { type, name, price }
    },

    // Pricing
    totalPrice: 0,
  });

  const steps = [
    { number: 1, title: "Rolling Paper", subtitle: "Select capacity & type" },
    { number: 2, title: "Filter", subtitle: "Choose filter type" },
    { number: 3, title: "Filling", subtitle: "Customize composition" },
    { number: 4, title: "External", subtitle: "Add coatings & wraps" },
    { number: 5, title: "Review", subtitle: "Confirm your joint" },
  ];

  // Calculate total price whenever relevant config sections change
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

    // Filling prices (flower)
    if (jointConfig.filling.flower) {
      jointConfig.filling.flower.forEach((item) => {
        total += (item.weight || 0) * (item.pricePerGram || 0);
      });
    }

    // Filling prices (hash)
    if (jointConfig.filling.hash) {
      jointConfig.filling.hash.forEach((item) => {
        total += (item.weight || 0) * (item.pricePerGram || 0);
      });
    }

    // Worm price
    if (jointConfig.filling.worm) {
      total += jointConfig.filling.worm.basePrice || 0;
    }

    // External coating
    if (jointConfig.external.coating) {
      total += jointConfig.external.coating.price || 0;
    }

    // External wrap
    if (jointConfig.external.wrap) {
      total += jointConfig.external.wrap.price || 0;
    }

    // Only update if the price actually changed
    if (total !== jointConfig.totalPrice) {
      setJointConfig((prev) => ({ ...prev, totalPrice: total }));
    }
  }, [
    jointConfig.paper,
    jointConfig.filter,
    jointConfig.filling,
    jointConfig.external,
  ]);

  const updateConfig = (section, data) => {
    setJointConfig((prev) => ({
      ...prev,
      [section]: data,
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return jointConfig.paper !== null;
      case 2:
        return jointConfig.filter !== null;
      case 3:
        return (
          jointConfig.filling.flower.length > 0 ||
          jointConfig.filling.hash.length > 0
        );
      case 4:
        return true; // External is optional
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(jointConfig);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 text-white relative">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-lime-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 pt-6 pb-4 text-center">
        <div className="mb-2">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-200 via-emerald-200 to-lime-200 flex items-center justify-center gap-3">
            <span className="text-green-400">🌿</span>
            Custom Joint Builder
            <span className="text-green-400">🌿</span>
          </h1>
        </div>
        <p className="text-green-200 text-base">
          Craft your perfect joint, step by step
        </p>
      </div>

      {/* Step Indicator */}
      <div className="relative z-10 px-6 mb-6">
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          canNavigate={(step) => step <= currentStep}
        />
      </div>

      {/* Live Preview Section */}
      <div className="relative z-10 px-6 mb-6">
        <div className="mx-auto">
          <JointVisualizer config={jointConfig} />
        </div>
      </div>

      {/* Main Content Area - Configuration Steps */}
      <div className="relative z-10 px-6 pb-6">
        <div className="mx-auto">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
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
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-300 border border-white/20"
                >
                  ← Previous
                </button>
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
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
  );
}
