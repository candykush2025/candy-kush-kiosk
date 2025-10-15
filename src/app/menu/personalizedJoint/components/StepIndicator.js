export default function StepIndicator({
  steps,
  currentStep,
  onStepClick,
  canNavigate,
}) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          {/* Step Circle */}
          <div
            onClick={() => canNavigate(step.number) && onStepClick(step.number)}
            className={`
              relative group
              ${
                canNavigate(step.number)
                  ? "cursor-pointer"
                  : "cursor-not-allowed"
              }
            `}
          >
            <div
              className={`
                w-16 h-16 rounded-full flex flex-col items-center justify-center
                transition-all duration-500 ease-out
                ${
                  currentStep === step.number
                    ? "bg-gradient-to-br from-green-400 to-emerald-400 scale-110 shadow-2xl shadow-green-500/50"
                    : currentStep > step.number
                    ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg"
                    : "bg-white/10 backdrop-blur-sm border-2 border-white/30"
                }
              `}
            >
              <span className="text-xl font-bold">
                {currentStep > step.number ? "✓" : step.number}
              </span>
              {currentStep === step.number && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 animate-ping opacity-20"></div>
              )}
            </div>

            {/* Tooltip */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="bg-black/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap shadow-xl">
                <div className="font-semibold">{step.title}</div>
                <div className="text-xs text-gray-300">{step.subtitle}</div>
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45"></div>
              </div>
            </div>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="w-20 h-1 mx-2 relative overflow-hidden rounded-full bg-white/10">
              <div
                className={`
                  absolute inset-0 transition-all duration-500 ease-out
                  ${
                    currentStep > step.number
                      ? "bg-gradient-to-r from-green-400 to-emerald-400 translate-x-0"
                      : "bg-gradient-to-r from-green-400 to-emerald-400 -translate-x-full"
                  }
                `}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
