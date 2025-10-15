"use client";

import { useState } from "react";

const filterOptions = [
  {
    id: "paper-filter",
    name: "Paper Filter",
    description: "Classic cardboard tip, smooth draw",
    price: 5,
    icon: "PAPER",
    color: "from-amber-50 to-amber-100",
  },
  {
    id: "slim-glass",
    name: "Slim Glass Filter",
    description: "Elegant glass tip, cooler smoke",
    price: 25,
    icon: "SLIM",
    color: "from-blue-200 to-cyan-200",
  },
  {
    id: "wide-glass",
    name: "Wide Glass Filter",
    description: "Premium wide glass, maximum airflow",
    price: 35,
    icon: "WIDE",
    color: "from-indigo-200 to-green-200",
  },
];

export default function FilterStep({ config, updateConfig, onNext, onPrev }) {
  const [selectedFilter, setSelectedFilter] = useState(
    config.filter?.id || null
  );

  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter.id);
    updateConfig("filter", {
      id: filter.id,
      name: filter.name,
      type: filter.id,
      price: filter.price,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Choose Your Filter</h2>
        <p className="text-green-200">
          Select the filter tip for optimal airflow
        </p>
      </div>

      {/* Filter Options Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filterOptions.map((filter) => (
          <div
            key={filter.id}
            onClick={() => handleFilterSelect(filter)}
            className={`
              relative p-6 rounded-2xl cursor-pointer transition-all duration-300
              border-2
              ${
                selectedFilter === filter.id
                  ? "border-green-400 bg-white/20 scale-105 shadow-2xl shadow-green-500/30"
                  : "border-white/20 bg-white/5 hover:bg-white/10 hover:scale-102"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 flex items-center justify-center bg-white/10 rounded-lg text-sm font-bold">
                  {filter.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">{filter.name}</h3>
                  <p className="text-green-200">{filter.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">
                  ฿{filter.price}
                </div>
              </div>
            </div>

            {selectedFilter === filter.id && (
              <div className="absolute top-6 right-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center shadow-lg animate-scaleIn">
                  <span className="text-lg">✓</span>
                </div>
              </div>
            )}

            {/* Visual Representation */}
            <div className="mt-4 flex justify-center">
              <div className="relative">
                {filter.id === "paper-filter" && (
                  <div className="w-12 h-32 bg-gradient-to-b from-amber-100 to-amber-200 rounded-lg shadow-inner"></div>
                )}
                {filter.id === "slim-glass" && (
                  <div className="w-8 h-32 bg-gradient-to-b from-blue-200 to-cyan-300 rounded-lg shadow-lg opacity-80"></div>
                )}
                {filter.id === "wide-glass" && (
                  <div className="w-16 h-32 bg-gradient-to-b from-indigo-200 to-green-300 rounded-lg shadow-lg opacity-80"></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Comparison */}
      <div className="mt-6 p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
        <h3 className="text-xl font-bold mb-4">Filter Comparison</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-200">Coolest Smoke:</span>
            <span className="font-medium">
              Wide Glass {">"} Slim Glass {">"} Paper
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-200">Airflow:</span>
            <span className="font-medium">
              Wide Glass {">"} Slim Glass {">"} Paper
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-200">Reusability:</span>
            <span className="font-medium">Glass filters can be cleaned</span>
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      {config.filter && (
        <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30 animate-slideIn">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-200 mb-1">Selected Filter</div>
              <div className="text-2xl font-bold">{config.filter.name}</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-400">
                ฿{config.filter.price}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
