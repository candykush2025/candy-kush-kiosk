"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = sessionStorage.getItem("adminAuthenticated");
      const loginTime = sessionStorage.getItem("adminLoginTime");

      if (authenticated === "true" && loginTime) {
        // Check if session is still valid (24 hours)
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          setIsAuthenticated(true);
        } else {
          // Session expired - clear all admin session data
          sessionStorage.removeItem("adminAuthenticated");
          sessionStorage.removeItem("adminLoginTime");
          sessionStorage.removeItem("adminEmail");
          sessionStorage.removeItem("adminType");
          sessionStorage.removeItem("adminId");
          sessionStorage.removeItem("adminPermissions");
          router.push("/admin/login");
        }
      } else {
        router.push("/admin/login");
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <svg
            className="animate-spin h-8 w-8 text-green-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return children;
}
