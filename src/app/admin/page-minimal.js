"use client";

import { useState } from "react";
import AdminAuthGuard from "../../../components/AdminAuthGuard";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <AdminAuthGuard>
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-8 max-w-none">
              <h1>Admin Dashboard - {activeTab}</h1>
              <p>Minimal version to test structure</p>
            </div>
          </main>
        </div>
      </div>
    </AdminAuthGuard>
  );
}
