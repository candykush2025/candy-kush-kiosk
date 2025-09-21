"use client";
import { useState, useEffect } from "react";

export default function LoyverseDebugPage() {
  const [status, setStatus] = useState({
    env: null,
    oauth: null,
    apiConnection: null,
    customerSearch: null,
    receiptCreation: null,
  });
  const [logs, setLogs] = useState([]);
  const [testCustomerEmail, setTestCustomerEmail] = useState("");
  const [testCustomerData, setTestCustomerData] = useState(null);
  const [loading, setLoading] = useState({});

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { message, type, timestamp }]);
  };

  const setLoadingState = (key, value) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  };

  const updateStatus = (key, value, message) => {
    setStatus((prev) => ({ ...prev, [key]: value }));
    addLog(message, value ? "success" : "error");
  };

  // Test environment variables
  const testEnvironment = async () => {
    setLoadingState("env", true);
    try {
      const response = await fetch("/api/debug/loyverse/env");
      const data = await response.json();

      if (data.success) {
        updateStatus("env", true, "Environment variables configured correctly");
        addLog(
          `Client ID: ${data.data.hasClientId ? "✓ Present" : "✗ Missing"}`,
          data.data.hasClientId ? "success" : "error"
        );
        addLog(
          `Client Secret: ${
            data.data.hasClientSecret ? "✓ Present" : "✗ Missing"
          }`,
          data.data.hasClientSecret ? "success" : "error"
        );
        addLog(
          `Access Token: ${
            data.data.hasAccessToken ? "✓ Present" : "✗ Missing"
          }`,
          data.data.hasAccessToken ? "success" : "error"
        );
      } else {
        updateStatus("env", false, `Environment check failed: ${data.error}`);
      }
    } catch (error) {
      updateStatus("env", false, `Environment check error: ${error.message}`);
    }
    setLoadingState("env", false);
  };

  // Test OAuth flow
  const testOAuth = async () => {
    setLoadingState("oauth", true);
    addLog("Starting OAuth flow...", "info");

    try {
      // Get client ID from environment
      const envResponse = await fetch("/api/debug/loyverse/env");
      const envData = await envResponse.json();

      if (!envData.success || !envData.data.hasClientId) {
        addLog(
          "Client ID not configured. Please check environment variables.",
          "error"
        );
        setLoadingState("oauth", false);
        return;
      }

      const clientId = envData.data.clientId;
      const redirectUri = `${window.location.origin}/api/auth/loyverse/callback`;
      const scopes = "CUSTOMERS_READ CUSTOMERS_WRITE RECEIPTS_WRITE";
      const state = Math.random().toString(36).substring(2, 15);

      // Store state for validation (in real app, use secure session storage)
      sessionStorage.setItem("oauth_state", state);

      const authUrl = `https://api.loyverse.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;

      addLog(`OAuth URL: ${authUrl}`, "info");
      addLog(
        "Opening OAuth window... Complete the authorization in the popup window.",
        "info"
      );

      // Open OAuth window and listen for completion
      const authWindow = window.open(
        authUrl,
        "loyverse_oauth",
        "width=500,height=600"
      );

      // Poll for window closure (OAuth completion)
      const pollTimer = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(pollTimer);
          addLog("OAuth window closed. Checking for authorization...", "info");
          setTimeout(() => {
            testApiConnection(); // Test if we now have access
          }, 1000);
          setLoadingState("oauth", false);
        }
      }, 1000);
    } catch (error) {
      addLog(`OAuth setup error: ${error.message}`, "error");
      setLoadingState("oauth", false);
    }
  };

  // Test API connection
  const testApiConnection = async () => {
    setLoadingState("apiConnection", true);
    try {
      const response = await fetch("/api/debug/loyverse/connection");
      const data = await response.json();

      if (data.success) {
        updateStatus("apiConnection", true, "API connection successful");
        addLog(`Response: ${JSON.stringify(data.data, null, 2)}`, "success");
      } else {
        updateStatus(
          "apiConnection",
          false,
          `API connection failed: ${data.error}`
        );
      }
    } catch (error) {
      updateStatus(
        "apiConnection",
        false,
        `API connection error: ${error.message}`
      );
    }
    setLoadingState("apiConnection", false);
  };

  // Test customer search
  const testCustomerSearch = async () => {
    if (!testCustomerEmail) {
      addLog("Please enter a customer email to test", "error");
      return;
    }

    setLoadingState("customerSearch", true);
    try {
      const response = await fetch(
        `/api/customers/search?email=${encodeURIComponent(testCustomerEmail)}`
      );
      const data = await response.json();

      if (data.success) {
        updateStatus("customerSearch", true, `Customer search successful`);
        setTestCustomerData(data.customer);
        addLog(
          `Customer found: ${data.customer?.name || "No name"} (${
            data.customer?.email || "No email"
          })`,
          "success"
        );
        addLog(`Points: ${data.customer?.total_points || 0}`, "info");
      } else {
        updateStatus(
          "customerSearch",
          false,
          `Customer search failed: ${data.error}`
        );
        setTestCustomerData(null);
      }
    } catch (error) {
      updateStatus(
        "customerSearch",
        false,
        `Customer search error: ${error.message}`
      );
      setTestCustomerData(null);
    }
    setLoadingState("customerSearch", false);
  };

  // Test receipt creation
  const testReceiptCreation = async () => {
    if (!testCustomerData) {
      addLog("Please search for a customer first", "error");
      return;
    }

    setLoadingState("receiptCreation", true);
    const testReceipt = {
      customer_id: testCustomerData.id,
      line_items: [
        {
          item_name: "Test Product",
          quantity: 1,
          price: 1000, // $10.00 in cents
          cost: 500, // $5.00 in cents
        },
      ],
      payments: [
        {
          type: "CASH",
          amount: 1000,
        },
      ],
      total_money: 1000,
    };

    try {
      const response = await fetch("/api/receipts/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testReceipt),
      });

      const data = await response.json();

      if (data.success) {
        updateStatus("receiptCreation", true, `Receipt created successfully`);
        addLog(`Receipt ID: ${data.receipt?.id}`, "success");
        addLog(`Points awarded: ${data.pointsAwarded || 0}`, "info");
      } else {
        updateStatus(
          "receiptCreation",
          false,
          `Receipt creation failed: ${data.error}`
        );
      }
    } catch (error) {
      updateStatus(
        "receiptCreation",
        false,
        `Receipt creation error: ${error.message}`
      );
    }
    setLoadingState("receiptCreation", false);
  };

  // Run all tests
  const runAllTests = async () => {
    addLog("=== Starting comprehensive Loyverse test ===", "info");
    await testEnvironment();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await testApiConnection();
  };

  useEffect(() => {
    addLog("Loyverse Debug Page initialized", "info");
    // Auto-run environment check and API connection test
    testEnvironment().then(() => {
      // If environment is configured, test API connection
      setTimeout(() => {
        testApiConnection();
      }, 1000);
    });
  }, []);

  const getStatusIcon = (value) => {
    if (value === null) return "⏳";
    return value ? "✅" : "❌";
  };

  const getStatusColor = (value) => {
    if (value === null) return "text-gray-500";
    return value ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Loyverse Integration Debug & Test
        </h1>

        {/* Status Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <div className={`text-2xl ${getStatusColor(status.env)}`}>
                {getStatusIcon(status.env)}
              </div>
              <div className="text-sm font-medium">Environment</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl ${getStatusColor(status.oauth)}`}>
                {getStatusIcon(status.oauth)}
              </div>
              <div className="text-sm font-medium">OAuth Setup</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl ${getStatusColor(status.apiConnection)}`}
              >
                {getStatusIcon(status.apiConnection)}
              </div>
              <div className="text-sm font-medium">API Connection</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl ${getStatusColor(status.customerSearch)}`}
              >
                {getStatusIcon(status.customerSearch)}
              </div>
              <div className="text-sm font-medium">Customer Search</div>
            </div>
            <div className="text-center">
              <div
                className={`text-2xl ${getStatusColor(status.receiptCreation)}`}
              >
                {getStatusIcon(status.receiptCreation)}
              </div>
              <div className="text-sm font-medium">Receipt Creation</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>

            <div className="space-y-4">
              <button
                onClick={testEnvironment}
                disabled={loading.env}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {loading.env ? "Testing..." : "Test Environment Variables"}
              </button>

              <button
                onClick={testOAuth}
                disabled={loading.oauth}
                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {loading.oauth ? "Starting..." : "Start OAuth Flow"}
              </button>

              <button
                onClick={testApiConnection}
                disabled={loading.apiConnection}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {loading.apiConnection ? "Testing..." : "Test API Connection"}
              </button>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Email (for testing)
                </label>
                <input
                  type="email"
                  value={testCustomerEmail}
                  onChange={(e) => setTestCustomerEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
                />
                <button
                  onClick={testCustomerSearch}
                  disabled={loading.customerSearch || !testCustomerEmail}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {loading.customerSearch
                    ? "Searching..."
                    : "Test Customer Search"}
                </button>
              </div>

              <button
                onClick={testReceiptCreation}
                disabled={loading.receiptCreation || !testCustomerData}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {loading.receiptCreation
                  ? "Creating..."
                  : "Test Receipt Creation"}
              </button>

              <div className="border-t pt-4">
                <button
                  onClick={runAllTests}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                >
                  Run All Tests
                </button>
              </div>
            </div>

            {/* Customer Data Display */}
            {testCustomerData && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">
                  Test Customer Data
                </h3>
                <div className="text-sm space-y-1">
                  <div>
                    <strong>ID:</strong> {testCustomerData.id}
                  </div>
                  <div>
                    <strong>Name:</strong> {testCustomerData.name || "N/A"}
                  </div>
                  <div>
                    <strong>Email:</strong> {testCustomerData.email || "N/A"}
                  </div>
                  <div>
                    <strong>Phone:</strong>{" "}
                    {testCustomerData.phone_number || "N/A"}
                  </div>
                  <div>
                    <strong>Points:</strong>{" "}
                    {testCustomerData.total_points || 0}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Activity Log</h2>
              <button
                onClick={() => setLogs([])}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>

            <div className="bg-gray-900 text-green-400 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">No activity yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-500">[{log.timestamp}]</span>
                    <span
                      className={`ml-2 ${
                        log.type === "success"
                          ? "text-green-400"
                          : log.type === "error"
                          ? "text-red-400"
                          : "text-blue-400"
                      }`}
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Setup Links */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Quick Setup Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/loyverse-setup"
              className="block bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 transition-colors"
            >
              <h3 className="font-semibold text-blue-800">Admin Setup</h3>
              <p className="text-sm text-blue-600 mt-1">
                Configure OAuth credentials
              </p>
            </a>
            <a
              href="https://developer.loyverse.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 transition-colors"
            >
              <h3 className="font-semibold text-purple-800">
                Loyverse Developer
              </h3>
              <p className="text-sm text-purple-600 mt-1">
                Create OAuth application
              </p>
            </a>
            <a
              href="/checkout"
              className="block bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 transition-colors"
            >
              <h3 className="font-semibold text-green-800">Test Checkout</h3>
              <p className="text-sm text-green-600 mt-1">
                Try customer lookup in checkout
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
