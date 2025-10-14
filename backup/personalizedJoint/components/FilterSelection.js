import { filterOptions } from "../data/options";

export default function FilterSelection({
  selectedFilter,
  setSelectedFilter,
  handleStepTransition,
}) {
  const handleFilterSelection = (filter) => {
    setSelectedFilter(filter);
    // Removed automatic transition - user must click Next button
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          Choose Your Filter
        </h2>
        <p className="text-green-300 text-lg">
          Select your preferred filter type
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filterOptions.map((filter) => (
          <div
            key={filter.id}
            onClick={() => handleFilterSelection(filter)}
            className={`bg-gradient-to-r from-green-800/30 to-green-700/30 backdrop-blur-sm border border-green-600/30 rounded-xl p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-green-400/50 ${
              selectedFilter?.id === filter.id
                ? "ring-2 ring-green-400 bg-green-600/20"
                : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{filter.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {filter.name}
                  </h3>
                  <p className="text-green-300 mb-2">{filter.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-400 font-semibold">
                        Material:
                      </span>
                      <p className="text-gray-300">{filter.material}</p>
                    </div>
                    <div>
                      <span className="text-green-400 font-semibold">
                        Airflow:
                      </span>
                      <p className="text-gray-300">{filter.airflow}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-white font-bold text-xl">
                  {filter.price === 0 ? "Free" : `฿${filter.price}`}
                </p>
                {filter.reusable && (
                  <span className="text-green-400 text-sm">Reusable</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => handleStepTransition(1, "left")}
          className="flex-1 bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
        >
          ← Back
        </button>
        {selectedFilter && (
          <button
            onClick={() => handleStepTransition(3)}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
