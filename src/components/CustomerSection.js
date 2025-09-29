"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import PointsHistory from "./PointsHistory";

export default function CustomerSection({ customer }) {
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const { t } = useTranslation();

  if (!customer) return null;

  return (
    <>
      {/* Customer Info Section */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 m-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              {t("welcomeUser", { name: customer.name })}
            </h2>
            <p className="text-green-100 mb-2">
              {t("memberIdLabel")} {customer.customerId}
            </p>
          </div>
          <div className="text-right">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <p className="text-green-100 text-sm">{t("pointsBalance")}</p>
              <p className="text-3xl font-bold">
                {(customer.totalPoints || 0).toLocaleString()}
              </p>
              <button
                onClick={() => setShowPointsHistory(true)}
                className="mt-2 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full transition-colors font-medium"
              >
                {t("viewHistory")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Points History Modal */}
      <PointsHistory
        customerId={customer.id}
        isOpen={showPointsHistory}
        onClose={() => setShowPointsHistory(false)}
      />
    </>
  );
}
