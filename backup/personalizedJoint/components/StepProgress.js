export default function StepProgress({ steps, currentStep, completedSteps }) {
  return (
    <div className="flex items-center justify-between mb-8 bg-black/20 backdrop-blur-sm border border-green-600/30 rounded-xl p-4">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              currentStep === step.id
                ? "bg-green-500 text-black animate-pulse"
                : completedSteps.includes(step.id)
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-400"
            }`}
          >
            {completedSteps.includes(step.id) ? "✓" : step.id}
          </div>
          <div className="ml-2 hidden md:block">
            <p
              className={`text-sm font-semibold ${
                currentStep === step.id ? "text-green-400" : "text-gray-400"
              }`}
            >
              {step.title}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-8 h-0.5 mx-4 transition-colors duration-300 ${
                completedSteps.includes(step.id)
                  ? "bg-green-500"
                  : "bg-gray-700"
              }`}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
}
