"use client";
import { useState } from "react";
import { CustomerService } from "../lib/customerService";

export default function CustomerLookup({ onCustomerSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    memberId: "",
    email: "",
    phone: "",
  });

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      // Search by member ID first
      let customer = await CustomerService.getCustomerByMemberId(
        searchTerm.trim()
      );

      if (customer) {
        setSearchResults([customer]);
      } else {
        // If not found by member ID, search all customers by name/email
        const allCustomers = await CustomerService.getAllCustomers();
        const filtered = allCustomers.filter(
          (c) =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.email &&
              c.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error("Error searching customers:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();

    if (!newCustomer.name || !newCustomer.memberId) {
      alert("Name and Member ID are required!");
      return;
    }

    setLoading(true);
    try {
      const customer = await CustomerService.createCustomer(newCustomer);
      onCustomerSelect(customer);
      onClose();
    } catch (error) {
      console.error("Error creating customer:", error);
      alert("Error creating customer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Customer Lookup</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {!showNewCustomerForm ? (
          <>
            {/* Search Section */}
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Enter member ID, name, or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? "..." : "Search"}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Select Customer:
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {searchResults.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => {
                        onCustomerSelect(customer);
                        onClose();
                      }}
                      className="p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">
                            {customer.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            ID: {customer.memberId}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">
                            {customer.points} pts
                          </p>
                          <p className="text-xs text-gray-500">
                            ${((customer.totalSpent || 0) / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNewCustomerForm(true)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                New Customer
              </button>
              <button
                onClick={() => onCustomerSelect(null)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Guest Checkout
              </button>
            </div>
          </>
        ) : (
          /* New Customer Form */
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member ID *
              </label>
              <input
                type="text"
                value={newCustomer.memberId}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, memberId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={newCustomer.phone}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowNewCustomerForm(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create & Select"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
