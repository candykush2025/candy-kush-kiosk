"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StepProgress from "./components/StepProgress";
import PaperSelection from "./components/PaperSelection";
import FilterSelection from "./components/FilterSelection";
import FillingComposition from "./components/FillingComposition";
import ExternalCustomization from "./components/ExternalCustomization";
import ReviewOrder from "./components/ReviewOrder";
import PriceDisplay from "./components/PriceDisplay";
import JointPreview from "./components/JointPreview";

export default function PersonalizedJointBuilder() {
  const router = useRouter();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Joint configuration state
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [fillingComposition, setFillingComposition] = useState({
    flower: { percentage: 70, strains: [], weight: 0 },
    hash: { percentage: 30, types: [], weight: 0 },
    worm: false,
  });
  const [externalCustomization, setExternalCustomization] = useState([]);
  const [customLength, setCustomLength] = useState(10);

  // Animation states
  const [isTransitioning, setIsTransitioning] = useState(false);

  const steps = [
    {
      id: 1,
      title: "Rolling Paper",
      description: "Choose your foundation",
    },
    {
      id: 2,
      title: "Filter Selection",
      description: "Select your filter type",
    },
    {
      id: 3,
      title: "Filling Composition",
      description: "Mix your blend",
    },
    {
      id: 4,
      title: "External Coating",
      description: "Add special touches",
    },
    {
      id: 5,
      title: "Review & Order",
      description: "Finalize your creation",
    },
  ];

  // Update filling weights when paper capacity changes
  useEffect(() => {
    if (selectedPaper) {
      const totalCapacity =
        selectedPaper.selectedVariant?.capacity || selectedPaper.capacity;
      setFillingComposition((prev) => ({
        ...prev,
        flower: {
          ...prev.flower,
          weight: ((totalCapacity * prev.flower.percentage) / 100).toFixed(2),
        },
        hash: {
          ...prev.hash,
          weight: ((totalCapacity * prev.hash.percentage) / 100).toFixed(2),
        },
      }));
    }
  }, [
    selectedPaper,
    fillingComposition.flower.percentage,
    fillingComposition.hash.percentage,
  ]);

  const handleStepTransition = (nextStep, direction = "right") => {
    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentStep(nextStep);
      if (nextStep > currentStep && !completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }
      setIsTransitioning(false);
    }, 300);
  };

  const renderStepContent = () => {
    const commonProps = {
      selectedPaper,
      selectedFilter,
      fillingComposition,
      setFillingComposition,
      externalCustomization,
      setExternalCustomization,
      customLength,
      setCustomLength,
      handleStepTransition,
    };

    switch (currentStep) {
      case 1:
        return (
          <PaperSelection
            {...commonProps}
            setSelectedPaper={setSelectedPaper}
          />
        );
      case 2:
        return (
          <FilterSelection
            {...commonProps}
            setSelectedFilter={setSelectedFilter}
          />
        );
      case 3:
        return <FillingComposition {...commonProps} />;
      case 4:
        return <ExternalCustomization {...commonProps} />;
      case 5:
        return <ReviewOrder {...commonProps} router={router} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-transparent to-black/40"></div>

      {/* Floating Animation Elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-green-400/30 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-green-500/20 rounded-full animate-bounce delay-1000"></div>
      <div className="absolute bottom-20 left-1/4 w-3 h-3 bg-green-300/40 rounded-full animate-ping delay-500"></div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 text-center py-4 px-4">
          <button
            onClick={() => router.push("/menu")}
            className="absolute top-4 left-4 bg-green-700/50 backdrop-blur-sm border border-green-600/30 text-white px-4 py-2 rounded-lg hover:bg-green-600/50 transition-colors"
          >
            ← Back to Menu
          </button>

          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-green-300 to-green-500 mb-2">
            Custom Joint Builder
          </h1>
          <p className="text-green-300 text-lg">Create Your Perfect Joint</p>
        </div>

        {/* Progress Steps */}
        <div className="flex-shrink-0 px-4">
          <StepProgress
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Main Content Area - Two Column Layout */}
        <div className="flex-1 flex gap-6 px-4 pb-4 overflow-hidden">
          {/* Left Column - Step Content */}
          <div className="flex-1 overflow-y-auto">
            <div
              className={`transition-all duration-300 ${
                isTransitioning
                  ? "opacity-0 transform translate-x-8"
                  : "opacity-100 transform translate-x-0"
              }`}
            >
              {renderStepContent()}
            </div>
          </div>

          {/* Right Column - Live Preview */}
          <div className="w-80 flex-shrink-0">
            <JointPreview
              selectedPaper={selectedPaper}
              selectedFilter={selectedFilter}
              fillingComposition={fillingComposition}
              externalCustomization={externalCustomization}
              customLength={customLength}
            />
          </div>
        </div>

        {/* Floating Price Display */}
        <PriceDisplay
          selectedPaper={selectedPaper}
          selectedFilter={selectedFilter}
          fillingComposition={fillingComposition}
          externalCustomization={externalCustomization}
        />
      </div>
    </div>
  );
}
