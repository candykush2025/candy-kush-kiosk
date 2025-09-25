"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminAuthGuard from "../../components/AdminAuthGuard";
import { CustomerService } from "../../lib/customerService";
import { TransactionService } from "../../lib/transactionService";
import {
  ProductService,
  CategoryService,
  SubcategoryService,
  CashbackService,
} from "../../lib/productService";
import { VisitService } from "../../lib/visitService";
import { countries } from "../../lib/countries";
import {
  Users,
  ShoppingBag,
  DollarSign,
  BarChart,
  Star,
  TrendingUp,
  User,
  Plus,
  X,
  Trash2,
  ChevronRight,
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalRevenue: 0,
    todayVisits: 0,
    totalTransactions: 0,
    totalProducts: 0,
  });
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCashback, setEditingCashback] = useState(null);

  // Add/Edit states
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);
  const [showAddCashback, setShowAddCashback] = useState(false);

  // Delete loading states
  const [deletingTransactionIndex, setDeletingTransactionIndex] =
    useState(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState(null);

  // Loading states
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [updatingCustomer, setUpdatingCustomer] = useState(false);

  // Transaction details modal states
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransactionDetails, setSelectedTransactionDetails] =
    useState(null);

  // Nationality dropdown states
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [nationalitySearch, setNationalitySearch] = useState("");
  const [showEditNationalityDropdown, setShowEditNationalityDropdown] =
    useState(false);
  const [editNationalitySearch, setEditNationalitySearch] = useState("");

  // Form states
  const [newCustomer, setNewCustomer] = useState({
    nationality: "",
    name: "",
    lastName: "",
    nickname: "",
    email: "",
    cell: "",
    isActive: true,
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    categoryId: "",
    categoryName: "",
    subcategoryId: "",
    subcategoryName: "",
    hasVariants: false,
    price: 0,
    variants: [],
    barcode: "",
    supplier: "",
    mainImage: "",
    images: [],
    isActive: true,
    isFeatured: false,
    tags: [],
    notes: "",
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  const [newSubcategory, setNewSubcategory] = useState({
    name: "",
    description: "",
    categoryId: "",
    isActive: true,
  });

  // Form states for editing/adding
  const [customerForm, setCustomerForm] = useState({
    nationality: "",
    name: "",
    lastName: "",
    nickname: "",
    email: "",
    cell: "",
    isActive: true,
  });

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    subcategoryId: "",
    hasVariants: false,
    price: 0,
    isActive: true,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });

  const [subcategoryForm, setSubcategoryForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    isActive: true,
  });

  const [cashbackForm, setCashbackForm] = useState({
    name: "",
    description: "",
    type: "percentage",
    rate: 0,
    minPurchase: 0,
    isActive: true,
  });

  // Loading states
  const [isCustomerSaving, setIsCustomerSaving] = useState(false);
  const [isProductSaving, setIsProductSaving] = useState(false);
  const [isCategorySaving, setIsCategorySaving] = useState(false);
  const [isLoadingSubcategory, setIsLoadingSubcategory] = useState(false);

  // Product variant states
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([]);
  const [productImageFile, setProductImageFile] = useState(null);
  const [optionImageFile, setOptionImageFile] = useState(null);

  // Country search
  const [countrySearch, setCountrySearch] = useState("");

  // Cashback states
  const [cashbackRules, setCashbackRules] = useState([]);
  const [editingCashbackRule, setEditingCashbackRule] = useState(null);

  // Customer points history
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [selectedCustomerForPoints, setSelectedCustomerForPoints] =
    useState(null);

  // Extract transactions from customer points data
  const extractTransactionsFromCustomers = (customers) => {
    console.log("Processing customers:", customers.length);
    const allTransactions = [];

    customers.forEach((customer) => {
      if (customer.points && Array.isArray(customer.points)) {
        console.log(
          `Customer ${customer.name} has ${customer.points.length} point records`
        );
        customer.points.forEach((pointRecord, index) => {
          // Use existing transactionId or create one based on index
          const transactionId =
            pointRecord.transactionId || `${customer.customerId}-${index}`;

          const transaction = {
            transactionId: transactionId,
            customerId: customer.customerId,
            customerName: customer.name,
            customerEmail: customer.email,
            totalSpent: pointRecord.totalSpent || 0,
            amount: pointRecord.amount || 0,
            createdAt: pointRecord.createdAt,
            status: "completed",
            source: pointRecord.source || "purchase",
          };
          allTransactions.push(transaction);
        });
      }
    });

    console.log("Total transactions extracted:", allTransactions.length);
    return allTransactions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  };

  const loadDashboardData = useCallback(async () => {
    try {
      const customersData = await CustomerService.getAllCustomers();
      const productsData = await ProductService.getAllProducts();
      const productStats = await ProductService.getProductStats();
      const categoriesData = await CategoryService.getAllCategories();
      const subcategoriesData = await SubcategoryService.getAllSubcategories();
      const cashbackRulesData = await CashbackService.getAllCashbackRules();

      setCustomers(customersData);

      // Extract transactions from customer points data
      const extractedTransactions =
        extractTransactionsFromCustomers(customersData);
      setTransactions(extractedTransactions);

      setProducts(productsData);
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
      setCashbackRules(cashbackRulesData);

      // Calculate transaction stats from customer points
      const totalRevenue = extractedTransactions.reduce(
        (sum, t) => sum + (t.totalSpent || 0),
        0
      );

      // Get today's visits from the new visit tracking system
      const todayVisits = await VisitService.getTodayVisits();

      setStats({
        totalCustomers: customersData.length,
        totalTransactions: extractedTransactions.length,
        totalProducts: productStats.totalProducts || 0,
        totalRevenue: totalRevenue,
        todayVisits: todayVisits,
      });

      console.log("Dashboard data loaded successfully");
      console.log("Customers:", customersData.length);
      console.log("Transactions extracted:", extractedTransactions.length);
      console.log("Products:", productsData.length);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Customer handlers
  const handleAddCustomer = () => {
    setShowAddCustomer(true);
  };

  const handleCancelAddCustomer = () => {
    setShowAddCustomer(false);
    setShowNationalityDropdown(false);
    setNationalitySearch("");
    setCustomerForm({
      nationality: "",
      name: "",
      lastName: "",
      nickname: "",
      email: "",
      cell: "",
      isActive: true,
    });
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (isCustomerSaving) {
      return;
    }

    try {
      setIsCustomerSaving(true);
      if (editingCustomer) {
        // Validate required fields for editing too
        if (!customerForm.name.trim() || !customerForm.nationality.trim()) {
          alert("Please fill in all required fields (Name and Nationality)");
          return;
        }

        await CustomerService.updateCustomer(editingCustomer.id, customerForm);
        setEditingCustomer(null);
        // Reset form after editing
        setCustomerForm({
          nationality: "",
          name: "",
          lastName: "",
          nickname: "",
          email: "",
          cell: "",
          isActive: true,
        });
      } else {
        // Validate required fields
        if (!customerForm.name.trim() || !customerForm.nationality.trim()) {
          alert("Please fill in all required fields (Name and Nationality)");
          return;
        }

        await CustomerService.createCustomer(customerForm);
        handleCancelAddCustomer();
      }
      await loadDashboardData();
    } catch (error) {
      console.error("Error saving customer:", error);
      alert("Error saving customer. Please try again.");
    } finally {
      setIsCustomerSaving(false);
    }
  };

  const handleDeleteCustomer = async (customer) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to delete customer "${customer.name} ${
        customer.lastName || ""
      }"?\n\nThis action cannot be undone and will:\n- Delete all customer data\n- Remove transaction history\n- Remove points history\n\nThis is permanent!`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingCustomerId(customer.id);
      await CustomerService.deleteCustomer(customer.id);
      await loadDashboardData();

      // Show success message
      alert(
        `Customer "${customer.name} ${
          customer.lastName || ""
        }" has been successfully deleted.`
      );
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Failed to delete customer. Please try again.");
    } finally {
      setDeletingCustomerId(null);
    }
  };

  const handleToggleCustomerStatus = async (customer) => {
    try {
      const updatedCustomer = { ...customer, isActive: !customer.isActive };
      await CustomerService.updateCustomer(customer.id, updatedCustomer);
      await loadDashboardData();
    } catch (error) {
      console.error("Error updating customer status:", error);
    }
  };

  // Product handlers
  const handleSaveProduct = async () => {
    try {
      setIsProductSaving(true);

      if (hasVariants && variants.length > 0) {
        newProduct.hasVariants = true;
        newProduct.variants = variants;
      } else {
        newProduct.hasVariants = false;
        newProduct.variants = [];
      }

      if (editingProduct) {
        await ProductService.updateProduct(editingProduct.id, editingProduct);
        setEditingProduct(null);
      } else {
        const imageFiles = productImageFile ? [productImageFile] : [];
        await ProductService.createProduct(newProduct, imageFiles);
        setNewProduct({
          name: "",
          description: "",
          categoryId: "",
          categoryName: "",
          subcategoryId: "",
          subcategoryName: "",
          hasVariants: false,
          price: 0,
          variants: [],
          barcode: "",
          supplier: "",
          mainImage: "",
          images: [],
          isActive: true,
          isFeatured: false,
          tags: [],
          notes: "",
        });
        setHasVariants(false);
        setVariants([]);
        setProductImageFile(null);
        setOptionImageFile(null);
        setShowAddProduct(false);
      }
      await loadDashboardData();
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setIsProductSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await ProductService.deleteProduct(productId);
      await loadDashboardData();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleToggleProductStatus = async (product) => {
    try {
      const updatedProduct = { ...product, isActive: !product.isActive };
      await ProductService.updateProduct(product.id, updatedProduct);
      await loadDashboardData();
    } catch (error) {
      console.error("Error updating product status:", error);
    }
  };

  // Category handlers
  const handleSaveCategory = async () => {
    try {
      setIsCategorySaving(true);
      await CategoryService.createCategory(newCategory);
      setNewCategory({
        name: "",
        description: "",
        isActive: true,
      });
      setShowAddCategory(false);
      await loadDashboardData();
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsCategorySaving(false);
    }
  };

  // Subcategory handlers
  const handleSaveSubcategory = async () => {
    try {
      setIsLoadingSubcategory(true);
      await SubcategoryService.createSubcategory(newSubcategory);
      setNewSubcategory({
        name: "",
        description: "",
        categoryId: "",
        isActive: true,
      });
      setShowAddSubcategory(false);
      await loadDashboardData();
    } catch (error) {
      console.error("Error saving subcategory:", error);
    } finally {
      setIsLoadingSubcategory(false);
    }
  };

  // Cashback handlers
  const handleAddCashbackRule = () => {
    setEditingCashbackRule({
      categoryId: "",
      categoryName: "",
      cashbackPercentage: 0,
      isActive: true,
    });
  };

  const handleSaveCashback = async (e) => {
    e.preventDefault();
    try {
      if (editingCashbackRule.id) {
        await CashbackService.updateCashbackRule(
          editingCashbackRule.id,
          editingCashbackRule
        );
      } else {
        await CashbackService.createCashbackRule(editingCashbackRule);
      }
      setEditingCashbackRule(null);
      await loadDashboardData();
    } catch (error) {
      console.error("Error saving cashback rule:", error);
    }
  };

  const handleDeleteCashbackRule = async (ruleId) => {
    try {
      await CashbackService.deleteCashbackRule(ruleId);
      await loadDashboardData();
    } catch (error) {
      console.error("Error deleting cashback rule:", error);
    }
  };

  // Points history handlers
  const handleViewPointsHistory = (customer) => {
    setSelectedCustomerForPoints(customer);
    setShowPointsHistory(true);
  };

  const handleClosePointsHistory = () => {
    setShowPointsHistory(false);
    setSelectedCustomerForPoints(null);
  };

  const handleDeletePointTransaction = async (customer, pointIndex) => {
    const point = customer.points[pointIndex];
    const pointsAmount = point.amount || 0;
    const transactionId = point.transactionId
      ? point.transactionId.substring(0, 8) + "..."
      : "N/A";

    // Show detailed confirmation dialog
    const confirmMessage =
      `⚠️ DELETE TRANSACTION CONFIRMATION ⚠️\n\n` +
      `Customer: ${customer.name} ${customer.lastName || ""}\n` +
      `Transaction ID: ${transactionId}\n` +
      `Points: +${pointsAmount}\n` +
      `Date: ${
        point.createdAt ? new Date(point.createdAt).toLocaleDateString() : "N/A"
      }\n\n` +
      `This action CANNOT be undone!\n\n` +
      `Are you sure you want to DELETE this transaction?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Set loading state for this specific transaction
    setDeletingTransactionIndex(pointIndex);

    try {
      console.log(
        "Deleting transaction at index:",
        pointIndex,
        "for customer:",
        customer.name
      );

      // Create a new points array without the selected point
      const updatedPoints = [...customer.points];
      updatedPoints.splice(pointIndex, 1);

      console.log(
        "Original points:",
        customer.points.length,
        "Updated points:",
        updatedPoints.length
      );

      // Update the customer with the filtered points
      const updatedCustomer = {
        ...customer,
        points: updatedPoints,
      };

      await CustomerService.updateCustomer(customer.id, updatedCustomer);

      // Refresh the dashboard data
      await loadDashboardData();

      // Update the selected customer for points if it's still open
      if (
        selectedCustomerForPoints &&
        selectedCustomerForPoints.id === customer.id
      ) {
        setSelectedCustomerForPoints(updatedCustomer);
      }

      console.log("Transaction deleted successfully");

      // Show success message
      alert("✅ Transaction deleted successfully!");
    } catch (error) {
      console.error("Error deleting point transaction:", error);
      alert("❌ Failed to delete transaction. Please try again.");
    } finally {
      // Clear loading state
      setDeletingTransactionIndex(null);
    }
  };

  return (
    <AdminAuthGuard>
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        {/* Sidebar */}
        <div className="flex-shrink-0 w-64 bg-white shadow-lg flex flex-col">
          <div className="flex-shrink-0 p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">
              Candy Kush Admin
            </h1>
          </div>

          <nav className="flex-1 overflow-y-auto">
            <div className="px-4 py-4 space-y-2">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "dashboard"
                    ? "bg-green-100 text-green-700 border-r-4 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <BarChart className="w-5 h-5 mr-3" />
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab("customers")}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "customers"
                    ? "bg-green-100 text-green-700 border-r-4 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Users className="w-5 h-5 mr-3" />
                Customers
              </button>

              <button
                onClick={() => setActiveTab("products")}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "products"
                    ? "bg-green-100 text-green-700 border-r-4 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <ShoppingBag className="w-5 h-5 mr-3" />
                Products
              </button>

              <button
                onClick={() => setActiveTab("transactions")}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "transactions"
                    ? "bg-green-100 text-green-700 border-r-4 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <DollarSign className="w-5 h-5 mr-3" />
                Transactions
              </button>

              <button
                onClick={() => setActiveTab("cashback")}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "cashback"
                    ? "bg-green-100 text-green-700 border-r-4 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Star className="w-5 h-5 mr-3" />
                Cashback
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "settings"
                    ? "bg-green-100 text-green-700 border-r-4 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <User className="w-5 h-5 mr-3" />
                Settings
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 capitalize">
                    {activeTab === "dashboard"
                      ? "Dashboard"
                      : activeTab === "customers"
                      ? "Customer Management"
                      : activeTab === "products"
                      ? "Product Management"
                      : activeTab === "transactions"
                      ? "Transaction History"
                      : activeTab === "cashback"
                      ? "Cashback Management"
                      : activeTab === "settings"
                      ? "Settings"
                      : activeTab}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {activeTab === "dashboard"
                      ? "Overview of your business metrics"
                      : activeTab === "customers"
                      ? "Manage customer accounts and information"
                      : activeTab === "products"
                      ? "Manage your product inventory and pricing"
                      : activeTab === "transactions"
                      ? "Transaction history and details"
                      : activeTab === "cashback"
                      ? "Configure cashback rules and percentages"
                      : activeTab === "settings"
                      ? "System configuration and preferences"
                      : "Admin management"}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-8 max-w-none">
              {/* Dashboard Tab */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Customers
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {stats.totalCustomers}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Revenue
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            ฿{stats.totalRevenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <ShoppingBag className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Active Products
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {products.filter((p) => p.isActive).length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Transactions
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {stats.totalTransactions}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Recent Transactions
                      </h3>
                    </div>
                    <div className="p-6">
                      {transactions.slice(0, 5).length > 0 ? (
                        <div className="space-y-4">
                          {transactions.slice(0, 5).map((transaction) => (
                            <div
                              key={transaction.transactionId}
                              onClick={() => {
                                // Find the full customer data to get transaction details
                                const customer = customers.find(
                                  (c) =>
                                    c.name === transaction.customerName ||
                                    c.customerName === transaction.customerName
                                );

                                if (customer) {
                                  // Find the specific transaction in customer's points array
                                  const transactionDetail =
                                    customer.points?.find(
                                      (p) =>
                                        p.transactionId ===
                                        transaction.transactionId
                                    );

                                  if (transactionDetail) {
                                    setSelectedTransactionDetails({
                                      ...transactionDetail,
                                      customerName: customer.name,
                                      customerEmail: customer.email,
                                      customerId: customer.customerId,
                                    });
                                    setShowTransactionDetails(true);
                                  }
                                }
                              }}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {transaction.customerName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Transaction:{" "}
                                  {transaction.transactionId.substring(0, 8)}...
                                </p>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <p className="font-semibold text-green-600">
                                    ฿
                                    {(() => {
                                      // Find customer and calculate total from items
                                      const customer = customers.find(
                                        (c) =>
                                          c.name === transaction.customerName ||
                                          c.customerName ===
                                            transaction.customerName
                                      );

                                      if (customer) {
                                        const transactionDetail =
                                          customer.points?.find(
                                            (p) =>
                                              p.transactionId ===
                                              transaction.transactionId
                                          );

                                        if (
                                          transactionDetail &&
                                          transactionDetail.items
                                        ) {
                                          // Calculate total from items (price is in cents, convert to baht)
                                          const total =
                                            transactionDetail.items.reduce(
                                              (sum, item) => {
                                                return (
                                                  sum +
                                                  item.price * item.quantity
                                                );
                                              },
                                              0
                                            );

                                          return (total / 100).toLocaleString(
                                            "en-US",
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          );
                                        }
                                      }

                                      // Fallback to totalSpent if available
                                      if (
                                        transaction.totalSpent &&
                                        transaction.totalSpent > 0
                                      ) {
                                        return (
                                          transaction.totalSpent / 100
                                        ).toLocaleString("en-US", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        });
                                      }

                                      return "0.00";
                                    })()}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {(() => {
                                      if (transaction.createdAt) {
                                        if (transaction.createdAt.seconds) {
                                          return new Date(
                                            transaction.createdAt.seconds * 1000
                                          ).toLocaleDateString();
                                        } else if (
                                          transaction.createdAt instanceof Date
                                        ) {
                                          return transaction.createdAt.toLocaleDateString();
                                        } else if (
                                          typeof transaction.createdAt ===
                                          "string"
                                        ) {
                                          return new Date(
                                            transaction.createdAt
                                          ).toLocaleDateString();
                                        }
                                      }
                                      return "Recent";
                                    })()}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          No recent transactions
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Customers Tab */}
              {activeTab === "customers" && (
                <div className="space-y-6">
                  {/* Customer Stats and Add Button */}
                  <div className="flex justify-between items-center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 mr-6">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <Users className="w-8 h-8 text-blue-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Total Customers
                            </p>
                            <p className="text-xl font-semibold text-gray-900">
                              {stats.totalCustomers}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Active Members
                            </p>
                            <p className="text-xl font-semibold text-gray-900">
                              {customers.filter((c) => c.isActive).length}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <Star className="w-8 h-8 text-purple-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Today&apos;s Visits
                            </p>
                            <p className="text-xl font-semibold text-gray-900">
                              {stats.todayVisits}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleAddCustomer}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Add Customer
                    </button>
                  </div>

                  {/* Search */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <input
                      type="text"
                      placeholder="Search customers by name, email, or member ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Customers Table */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Member ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Spent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {customers
                            .filter(
                              (customer) =>
                                customer.name
                                  ?.toLowerCase()
                                  .includes(searchTerm.toLowerCase()) ||
                                customer.email
                                  ?.toLowerCase()
                                  .includes(searchTerm.toLowerCase()) ||
                                customer.customerId
                                  ?.toLowerCase()
                                  .includes(searchTerm.toLowerCase())
                            )
                            .map((customer) => (
                              <tr
                                key={customer.id}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {customer.name} {customer.lastName}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {customer.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {customer.customerId || customer.memberId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {customer.cell}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="font-medium text-green-600">
                                    ฿
                                    {(() => {
                                      // If customer has totalSpent field and it's > 0, use it
                                      if (
                                        customer.totalSpent &&
                                        customer.totalSpent > 0
                                      ) {
                                        return (
                                          customer.totalSpent / 100
                                        ).toLocaleString("en-US", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        });
                                      }
                                      // Otherwise, calculate from points array
                                      if (
                                        customer.points &&
                                        Array.isArray(customer.points)
                                      ) {
                                        const total = customer.points.reduce(
                                          (sum, point) => {
                                            // If point has totalSpent, use it (convert from cents to baht)
                                            if (
                                              point.totalSpent &&
                                              point.totalSpent > 0
                                            ) {
                                              return (
                                                sum + point.totalSpent / 100
                                              );
                                            }
                                            // Check other possible amount fields
                                            if (
                                              point.purchaseAmount &&
                                              point.purchaseAmount > 0
                                            ) {
                                              return (
                                                sum + point.purchaseAmount / 100
                                              );
                                            }
                                            if (
                                              point.transactionAmount &&
                                              point.transactionAmount > 0
                                            ) {
                                              return (
                                                sum +
                                                point.transactionAmount / 100
                                              );
                                            }
                                            // Last resort: calculate from points (1 point = 1 baht spent)
                                            return sum + (point.amount || 0);
                                          },
                                          0
                                        );
                                        return total.toLocaleString("en-US", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        });
                                      }
                                      return "0.00";
                                    })()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      customer.isActive
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {customer.isActive ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                  <button
                                    onClick={() =>
                                      handleViewPointsHistory(customer)
                                    }
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Points
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCustomerForm({
                                        nationality: customer.nationality || "",
                                        name: customer.name || "",
                                        lastName: customer.lastName || "",
                                        nickname: customer.nickname || "",
                                        email: customer.email || "",
                                        cell: customer.cell || "",
                                        isActive:
                                          customer.isActive !== undefined
                                            ? customer.isActive
                                            : true,
                                      });
                                      setEditingCustomer(customer);
                                    }}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleToggleCustomerStatus(customer)
                                    }
                                    className="text-yellow-600 hover:text-yellow-900"
                                  >
                                    {customer.isActive
                                      ? "Deactivate"
                                      : "Activate"}
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteCustomer(customer)
                                    }
                                    disabled={
                                      deletingCustomerId === customer.id
                                    }
                                    className={`${
                                      deletingCustomerId === customer.id
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-red-600 hover:text-red-900"
                                    }`}
                                    title={
                                      deletingCustomerId === customer.id
                                        ? "Deleting..."
                                        : "Delete customer permanently"
                                    }
                                  >
                                    {deletingCustomerId === customer.id ? (
                                      <div className="flex items-center space-x-1">
                                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                        <span>Deleting...</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-1">
                                        <Trash2 className="w-4 h-4" />
                                        <span>Delete</span>
                                      </div>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Products Tab */}
              {activeTab === "products" && (
                <div className="space-y-6">
                  {/* Product Stats and Add Buttons */}
                  <div className="flex justify-between items-center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 mr-6">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <ShoppingBag className="w-8 h-8 text-purple-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Total Products
                            </p>
                            <p className="text-xl font-semibold text-gray-900">
                              {products.length}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <TrendingUp className="w-8 h-8 text-green-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Active Products
                            </p>
                            <p className="text-xl font-semibold text-gray-900">
                              {products.filter((p) => p.isActive).length}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center">
                          <BarChart className="w-8 h-8 text-blue-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Categories
                            </p>
                            <p className="text-xl font-semibold text-gray-900">
                              {categories.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowAddCategory(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                      >
                        Add Category
                      </button>
                      <button
                        onClick={() => setShowAddSubcategory(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center"
                      >
                        Add Subcategory
                      </button>
                      <button
                        onClick={() => setShowAddProduct(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                      >
                        Add Product
                      </button>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <input
                      type="text"
                      placeholder="Search products by name or category..."
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Products Table */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price (฿)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {products
                            .filter(
                              (product) =>
                                product.name
                                  ?.toLowerCase()
                                  .includes(productSearchTerm.toLowerCase()) ||
                                product.categoryName
                                  ?.toLowerCase()
                                  .includes(productSearchTerm.toLowerCase())
                            )
                            .map((product) => {
                              const category = categories.find(
                                (c) => c.id === product.categoryId
                              );
                              const subcategory = subcategories.find(
                                (s) => s.id === product.subcategoryId
                              );

                              return (
                                <tr
                                  key={product.id}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      {product.mainImage && (
                                        <img
                                          className="h-10 w-10 rounded-lg object-cover mr-4"
                                          src={product.mainImage}
                                          alt={product.name}
                                        />
                                      )}
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {product.name}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <div>
                                      <div>{category?.name || "N/A"}</div>
                                      {subcategory && (
                                        <div className="text-xs text-gray-500">
                                          {subcategory.name}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.hasVariants ? (
                                      <span className="text-blue-600">
                                        Variable
                                      </span>
                                    ) : (
                                      <span>
                                        ฿{(product.price || 0).toFixed(2)}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        product.isActive
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {product.isActive ? "Active" : "Inactive"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button
                                      onClick={() =>
                                        setSelectedProduct(product)
                                      }
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      View
                                    </button>
                                    <button
                                      onClick={() => setEditingProduct(product)}
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleToggleProductStatus(product)
                                      }
                                      className="text-yellow-600 hover:text-yellow-900"
                                    >
                                      {product.isActive
                                        ? "Deactivate"
                                        : "Activate"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Tab */}
              {activeTab === "transactions" && (
                <div className="space-y-6">
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                    <div className="px-8 py-6 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Transaction History
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Recent transactions from customer purchases (Total:{" "}
                        {transactions.length})
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                              Transaction ID
                            </th>
                            <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                              Points
                            </th>
                            <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-8 py-6 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {transactions.length === 0 ? (
                            <tr>
                              <td
                                colSpan="6"
                                className="px-6 py-5 text-center text-gray-500"
                              >
                                No transactions found
                              </td>
                            </tr>
                          ) : (
                            transactions.map((transaction) => (
                              <tr
                                key={transaction.transactionId}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-5 whitespace-nowrap text-base font-medium text-gray-900">
                                  {transaction.transactionId}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                  <div>
                                    <div className="text-base font-medium text-gray-900">
                                      {transaction.customerName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {transaction.customerEmail}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-base font-semibold text-green-600">
                                  ฿
                                  {(
                                    (transaction.totalSpent || 0) / 100
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-base font-semibold text-blue-600">
                                  +{transaction.amount || 0}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-base text-gray-900">
                                  {transaction.createdAt
                                    ? new Date(
                                        transaction.createdAt
                                      ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "N/A"}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-base font-medium">
                                  <button
                                    onClick={() =>
                                      setSelectedTransaction(transaction)
                                    }
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Cashback Tab */}
              {activeTab === "cashback" && (
                <div className="space-y-6">
                  {/* Cashback Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <Star className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Active Rules
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {cashbackRules.length}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Points Earned
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {customers
                              .reduce(
                                (total, customer) =>
                                  total + (customer.totalEarned || 0),
                                0
                              )
                              .toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Avg Points per Transaction
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {transactions.length > 0
                              ? Math.round(
                                  stats.totalTransactions > 0
                                    ? customers.reduce(
                                        (total, customer) =>
                                          total + (customer.totalEarned || 0),
                                        0
                                      ) / stats.totalTransactions
                                    : 0
                                )
                              : 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add Rule Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowAddCashback(true)}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add Cashback Rule
                    </button>
                  </div>

                  {/* Cashback Rules Table */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Cashback Rules
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rule Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rate
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Min Purchase
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {cashbackRules.map((rule) => (
                            <tr key={rule.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {rule.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {rule.description}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {rule.type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {rule.type === "percentage"
                                  ? `${rule.rate}%`
                                  : `฿${rule.rate}`}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ฿{rule.minPurchase || 0}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    rule.isActive
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {rule.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button
                                  onClick={() => setEditingCashback(rule)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleToggleCashbackStatus(rule)
                                  }
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  {rule.isActive ? "Deactivate" : "Activate"}
                                </button>
                                <button
                                  onClick={() => handleDeleteCashback(rule.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === "settings" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                      System Settings
                    </h3>

                    <div className="space-y-6">
                      {/* General Settings */}
                      <div className="border-b border-gray-200 pb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">
                          General
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Store Name
                            </label>
                            <input
                              type="text"
                              defaultValue="Candy Kush Dispensary"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Contact Email
                            </label>
                            <input
                              type="email"
                              defaultValue="admin@candykush.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Point System Settings */}
                      <div className="border-b border-gray-200 pb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">
                          Points System
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Points per ฿1 spent
                            </label>
                            <input
                              type="number"
                              defaultValue="1"
                              min="0"
                              step="0.1"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Point Redemption Value (฿)
                            </label>
                            <input
                              type="number"
                              defaultValue="0.01"
                              min="0"
                              step="0.001"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Display Settings */}
                      <div className="border-b border-gray-200 pb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">
                          Display
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="showStock"
                              defaultChecked={false}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor="showStock"
                              className="ml-2 block text-sm text-gray-700"
                            >
                              Show stock levels on products
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="showPrices"
                              defaultChecked={true}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor="showPrices"
                              className="ml-2 block text-sm text-gray-700"
                            >
                              Show prices to customers
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="enableCashback"
                              defaultChecked={true}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor="enableCashback"
                              className="ml-2 block text-sm text-gray-700"
                            >
                              Enable cashback system
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end">
                        <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
                          Save Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Add Customer Modal */}
        {showAddCustomer && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add New Customer
                  </h3>
                  <button
                    onClick={handleCancelAddCustomer}
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
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSaveCustomer}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nationality *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search nationality..."
                          value={nationalitySearch || customerForm.nationality}
                          onChange={(e) => {
                            setNationalitySearch(e.target.value);
                            setShowNationalityDropdown(true);
                          }}
                          onFocus={() => setShowNationalityDropdown(true)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />

                        {showNationalityDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowNationalityDropdown(false)}
                            ></div>
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {countries
                                .filter((country) =>
                                  country
                                    .toLowerCase()
                                    .includes(
                                      (
                                        nationalitySearch ||
                                        customerForm.nationality ||
                                        ""
                                      ).toLowerCase()
                                    )
                                )
                                .slice(0, 10)
                                .map((country, index) => (
                                  <div
                                    key={index}
                                    onClick={() => {
                                      setCustomerForm({
                                        ...customerForm,
                                        nationality: country,
                                      });
                                      setNationalitySearch("");
                                      setShowNationalityDropdown(false);
                                    }}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  >
                                    {country}
                                  </div>
                                ))}
                              {countries.filter((country) =>
                                country
                                  .toLowerCase()
                                  .includes(
                                    (
                                      nationalitySearch ||
                                      customerForm.nationality ||
                                      ""
                                    ).toLowerCase()
                                  )
                              ).length === 0 && (
                                <div className="px-3 py-2 text-gray-500 text-sm">
                                  No countries found
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={customerForm.name}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={customerForm.lastName}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            lastName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nickname
                      </label>
                      <input
                        type="text"
                        value={customerForm.nickname}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            nickname: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={customerForm.email}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cell
                      </label>
                      <input
                        type="tel"
                        value={customerForm.cell}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            cell: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={
                        !isCustomerSaving ? handleCancelAddCustomer : undefined
                      }
                      disabled={isCustomerSaving}
                      className={`px-4 py-2 text-sm font-medium text-gray-700 rounded-md ${
                        isCustomerSaving
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCustomerSaving}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center ${
                        isCustomerSaving
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {isCustomerSaving ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                          Adding...
                        </>
                      ) : (
                        "Add Customer"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {editingCustomer && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Customer
                  </h3>
                  <button
                    onClick={() => {
                      setEditingCustomer(null);
                      setShowEditNationalityDropdown(false);
                      setEditNationalitySearch("");
                      setCustomerForm({
                        nationality: "",
                        name: "",
                        lastName: "",
                        nickname: "",
                        email: "",
                        cell: "",
                        isActive: true,
                      });
                    }}
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
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSaveCustomer}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nationality *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search nationality..."
                          value={
                            editNationalitySearch || customerForm.nationality
                          }
                          onChange={(e) => {
                            setEditNationalitySearch(e.target.value);
                            setShowEditNationalityDropdown(true);
                          }}
                          onFocus={() => setShowEditNationalityDropdown(true)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />

                        {showEditNationalityDropdown && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() =>
                                setShowEditNationalityDropdown(false)
                              }
                            ></div>
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                              {countries
                                .filter((country) =>
                                  country
                                    .toLowerCase()
                                    .includes(
                                      (
                                        editNationalitySearch ||
                                        customerForm.nationality ||
                                        ""
                                      ).toLowerCase()
                                    )
                                )
                                .slice(0, 10)
                                .map((country, index) => (
                                  <div
                                    key={index}
                                    onClick={() => {
                                      setCustomerForm({
                                        ...customerForm,
                                        nationality: country,
                                      });
                                      setEditNationalitySearch("");
                                      setShowEditNationalityDropdown(false);
                                    }}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                  >
                                    {country}
                                  </div>
                                ))}
                              {countries.filter((country) =>
                                country
                                  .toLowerCase()
                                  .includes(
                                    (
                                      editNationalitySearch ||
                                      customerForm.nationality ||
                                      ""
                                    ).toLowerCase()
                                  )
                              ).length === 0 && (
                                <div className="px-3 py-2 text-gray-500 text-sm">
                                  No countries found
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={customerForm.name}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={customerForm.lastName}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            lastName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nickname
                      </label>
                      <input
                        type="text"
                        value={customerForm.nickname}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            nickname: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={customerForm.email}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cell
                      </label>
                      <input
                        type="tel"
                        value={customerForm.cell}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            cell: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCustomer(null);
                        setShowEditNationalityDropdown(false);
                        setEditNationalitySearch("");
                        setCustomerForm({
                          nationality: "",
                          name: "",
                          lastName: "",
                          nickname: "",
                          email: "",
                          cell: "",
                          isActive: true,
                        });
                      }}
                      disabled={isCustomerSaving}
                      className={`px-4 py-2 text-sm font-medium text-gray-700 rounded-md ${
                        isCustomerSaving
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCustomerSaving}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center ${
                        isCustomerSaving
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {isCustomerSaving ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                          Updating...
                        </>
                      ) : (
                        "Update Customer"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add New Category
                </h3>
                <form onSubmit={handleSaveCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          name: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          description: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      rows="3"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Add Category
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Subcategory Modal */}
        {showAddSubcategory && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add New Subcategory
                </h3>
                <form onSubmit={handleSaveSubcategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Parent Category
                    </label>
                    <select
                      value={subcategoryForm.categoryId}
                      onChange={(e) =>
                        setSubcategoryForm({
                          ...subcategoryForm,
                          categoryId: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Subcategory Name
                    </label>
                    <input
                      type="text"
                      value={subcategoryForm.name}
                      onChange={(e) =>
                        setSubcategoryForm({
                          ...subcategoryForm,
                          name: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={subcategoryForm.description}
                      onChange={(e) =>
                        setSubcategoryForm({
                          ...subcategoryForm,
                          description: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      rows="3"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddSubcategory(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
                    >
                      Add Subcategory
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add New Product
                </h3>
                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          name: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        value={productForm.categoryId}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            categoryId: e.target.value,
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Subcategory
                      </label>
                      <select
                        value={productForm.subcategoryId}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            subcategoryId: e.target.value,
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select Subcategory</option>
                        {subcategories
                          .filter(
                            (sub) => sub.categoryId === productForm.categoryId
                          )
                          .map((subcategory) => (
                            <option key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          description: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      rows="3"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hasVariants"
                      checked={productForm.hasVariants}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          hasVariants: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="hasVariants"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      This product has variants (different sizes/types)
                    </label>
                  </div>

                  {!productForm.hasVariants && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Price (฿)
                      </label>
                      <input
                        type="number"
                        value={productForm.price}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddProduct(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                    >
                      Add Product
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Edit Product
                </h3>
                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          name: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        value={productForm.categoryId}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            categoryId: e.target.value,
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Subcategory
                      </label>
                      <select
                        value={productForm.subcategoryId}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            subcategoryId: e.target.value,
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select Subcategory</option>
                        {subcategories
                          .filter(
                            (sub) => sub.categoryId === productForm.categoryId
                          )
                          .map((subcategory) => (
                            <option key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          description: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      rows="3"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editHasVariants"
                      checked={productForm.hasVariants}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          hasVariants: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="editHasVariants"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      This product has variants (different sizes/types)
                    </label>
                  </div>

                  {!productForm.hasVariants && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Price (฿)
                      </label>
                      <input
                        type="number"
                        value={productForm.price}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                    >
                      Update Product
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Cashback Rule Modal */}
        {showAddCashback && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Add Cashback Rule
                </h3>
                <form onSubmit={handleSaveCashback} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Rule Name
                    </label>
                    <input
                      type="text"
                      value={cashbackForm.name}
                      onChange={(e) =>
                        setCashbackForm({
                          ...cashbackForm,
                          name: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={cashbackForm.description}
                      onChange={(e) =>
                        setCashbackForm({
                          ...cashbackForm,
                          description: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      value={cashbackForm.type}
                      onChange={(e) =>
                        setCashbackForm({
                          ...cashbackForm,
                          type: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="points">Points</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {cashbackForm.type === "percentage"
                        ? "Percentage (%)"
                        : cashbackForm.type === "fixed"
                        ? "Amount (฿)"
                        : "Points per ฿1"}
                    </label>
                    <input
                      type="number"
                      value={cashbackForm.rate}
                      onChange={(e) =>
                        setCashbackForm({
                          ...cashbackForm,
                          rate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      min="0"
                      step={cashbackForm.type === "percentage" ? "1" : "0.01"}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Minimum Purchase (฿)
                    </label>
                    <input
                      type="number"
                      value={cashbackForm.minPurchase}
                      onChange={(e) =>
                        setCashbackForm({
                          ...cashbackForm,
                          minPurchase: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddCashback(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                    >
                      Add Rule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Cashback Rule Modal */}
        {editingCashback && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Edit Cashback Rule
                </h3>
                <form onSubmit={handleSaveCashback} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Rule Name
                    </label>
                    <input
                      type="text"
                      value={cashbackForm.name}
                      onChange={(e) =>
                        setCashbackForm({
                          ...cashbackForm,
                          name: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={cashbackForm.description}
                      onChange={(e) =>
                        setCashbackForm({
                          ...cashbackForm,
                          description: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      value={cashbackForm.type}
                      onChange={(e) =>
                        setCashbackForm({
                          ...cashbackForm,
                          type: e.target.value,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                      <option value="points">Points</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {cashbackForm.type === "percentage"
                        ? "Percentage (%)"
                        : cashbackForm.type === "fixed"
                        ? "Amount (฿)"
                        : "Points per ฿1"}
                    </label>
                    <input
                      type="number"
                      value={cashbackForm.rate}
                      onChange={(e) =>
                        setCashbackForm({
                          ...cashbackForm,
                          rate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      min="0"
                      step={cashbackForm.type === "percentage" ? "1" : "0.01"}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Minimum Purchase (฿)
                    </label>
                    <input
                      type="number"
                      value={cashbackForm.minPurchase}
                      onChange={(e) =>
                        setCashbackForm({
                          ...cashbackForm,
                          minPurchase: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditingCashback(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                    >
                      Update Rule
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Product Details Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Product Details
                  </h3>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {selectedProduct.mainImage && (
                      <img
                        src={selectedProduct.mainImage}
                        alt={selectedProduct.name}
                        className="w-full h-64 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      {selectedProduct.name}
                    </h4>
                    <p className="text-gray-600 mb-4">
                      {selectedProduct.description}
                    </p>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Category:</span>{" "}
                        {categories.find(
                          (c) => c.id === selectedProduct.categoryId
                        )?.name || "N/A"}
                      </p>
                      {selectedProduct.subcategoryId && (
                        <p>
                          <span className="font-medium">Subcategory:</span>{" "}
                          {subcategories.find(
                            (s) => s.id === selectedProduct.subcategoryId
                          )?.name || "N/A"}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Status:</span>
                        <span
                          className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                            selectedProduct.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {selectedProduct.isActive ? "Active" : "Inactive"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-lg font-medium text-gray-900 mb-4">
                      Pricing & Variants
                    </h5>
                    {selectedProduct.hasVariants ? (
                      <div className="space-y-4">
                        <p className="text-gray-600">
                          This product has multiple variants with different
                          prices.
                        </p>
                        {selectedProduct.variants &&
                        selectedProduct.variants.length > 0 ? (
                          <div className="space-y-2">
                            {selectedProduct.variants.map((variant, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                              >
                                <span className="font-medium">
                                  {variant.name}
                                </span>
                                <span className="text-green-600 font-semibold">
                                  ฿{variant.price?.toFixed(2) || "0.00"}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">
                            No variants configured yet.
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          ฿{(selectedProduct.price || 0).toFixed(2)}
                        </p>
                        <p className="text-gray-600">Fixed price product</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Points History Modal */}
        {selectedCustomerForPoints && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Points History - {selectedCustomerForPoints.name}{" "}
                    {selectedCustomerForPoints.lastName}
                  </h3>
                  <button
                    onClick={() => setSelectedCustomerForPoints(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Points Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-600">
                      Current Points
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {selectedCustomerForPoints.currentPoints ||
                        selectedCustomerForPoints.points?.reduce(
                          (total, point) => total + (point.amount || 0),
                          0
                        ) ||
                        0}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-600">
                      Total Earned
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {selectedCustomerForPoints.totalEarned ||
                        selectedCustomerForPoints.points?.reduce(
                          (total, point) => total + (point.amount || 0),
                          0
                        ) ||
                        0}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-purple-600">
                      Total Spent
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      ฿
                      {(() => {
                        // If customer has totalSpent field and it's > 0, use it
                        if (
                          selectedCustomerForPoints.totalSpent &&
                          selectedCustomerForPoints.totalSpent > 0
                        ) {
                          return (
                            selectedCustomerForPoints.totalSpent / 100
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          });
                        }
                        // Otherwise, calculate from points array
                        if (
                          selectedCustomerForPoints.points &&
                          Array.isArray(selectedCustomerForPoints.points)
                        ) {
                          const total = selectedCustomerForPoints.points.reduce(
                            (sum, point) => {
                              // If point has totalSpent and it's > 0, use it (convert from cents to baht)
                              if (point.totalSpent && point.totalSpent > 0) {
                                return sum + point.totalSpent / 100;
                              }
                              // Check other possible amount fields
                              if (
                                point.purchaseAmount &&
                                point.purchaseAmount > 0
                              ) {
                                return sum + point.purchaseAmount / 100;
                              }
                              if (
                                point.transactionAmount &&
                                point.transactionAmount > 0
                              ) {
                                return sum + point.transactionAmount / 100;
                              }
                              // Last resort: calculate from points (1 point = 1 baht spent)
                              return sum + (point.amount || 0);
                            },
                            0
                          );
                          return total.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          });
                        }
                        return "0.00";
                      })()}
                    </p>
                  </div>
                </div>

                {/* Points History Table */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Transaction History
                    </h4>
                  </div>
                  <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transaction ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Points
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedCustomerForPoints.points &&
                        selectedCustomerForPoints.points.length > 0 ? (
                          selectedCustomerForPoints.points.map(
                            (point, index) => (
                              <tr
                                key={point.transactionId || `point-${index}`}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {point.createdAt
                                    ? (() => {
                                        const date = point.createdAt.seconds
                                          ? new Date(
                                              point.createdAt.seconds * 1000
                                            )
                                          : new Date(point.createdAt);
                                        return date.toLocaleDateString(
                                          "en-US",
                                          {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          }
                                        );
                                      })()
                                    : "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {point.transactionId
                                    ? point.transactionId.substring(0, 8) +
                                      "..."
                                    : "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  ฿
                                  {(() => {
                                    // If totalSpent is available, use it (convert from cents to baht)
                                    if (
                                      point.totalSpent &&
                                      point.totalSpent > 0
                                    ) {
                                      return (
                                        point.totalSpent / 100
                                      ).toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      });
                                    }
                                    // If totalSpent is 0, try to find the shopping amount from other fields
                                    // Check if there's a purchaseAmount, transactionAmount, or similar field
                                    if (
                                      point.purchaseAmount &&
                                      point.purchaseAmount > 0
                                    ) {
                                      return (
                                        point.purchaseAmount / 100
                                      ).toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      });
                                    }
                                    if (
                                      point.transactionAmount &&
                                      point.transactionAmount > 0
                                    ) {
                                      return (
                                        point.transactionAmount / 100
                                      ).toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      });
                                    }
                                    // Last resort: calculate from points (assuming 1 point = 1 baht spent)
                                    if (point.amount && point.amount > 0) {
                                      return (
                                        point.amount * 1.0
                                      ).toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      });
                                    }
                                    return "0.00";
                                  })()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                                  +{point.amount || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                    {point.source || "purchase"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() =>
                                      handleDeletePointTransaction(
                                        selectedCustomerForPoints,
                                        index
                                      )
                                    }
                                    disabled={
                                      deletingTransactionIndex === index
                                    }
                                    className={`p-1 ${
                                      deletingTransactionIndex === index
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-red-600 hover:text-red-900"
                                    }`}
                                    title={
                                      deletingTransactionIndex === index
                                        ? "Deleting..."
                                        : "Delete transaction"
                                    }
                                  >
                                    {deletingTransactionIndex === index ? (
                                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </td>
                              </tr>
                            )
                          )
                        ) : (
                          <tr>
                            <td
                              colSpan="6"
                              className="px-6 py-4 text-center text-gray-500"
                            >
                              No transaction history available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Transaction Details Modal */}
        {showTransactionDetails && selectedTransactionDetails && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Transaction Details
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Transaction ID: {selectedTransactionDetails.transactionId}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowTransactionDetails(false);
                      setSelectedTransactionDetails(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">
                      Customer Information
                    </h4>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Name:</span>{" "}
                        {selectedTransactionDetails.customerName}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {selectedTransactionDetails.customerEmail}
                      </p>
                      <p>
                        <span className="font-medium">Customer ID:</span>{" "}
                        {selectedTransactionDetails.customerId}
                      </p>
                    </div>
                  </div>

                  {/* Transaction Info */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">
                      Transaction Summary
                    </h4>
                    <div className="space-y-2">
                      <p>
                        <span className="font-medium">Date:</span>{" "}
                        {selectedTransactionDetails.timestamp
                          ? new Date(
                              selectedTransactionDetails.timestamp
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Points Earned:</span>{" "}
                        {selectedTransactionDetails.amount || 0}
                      </p>
                      <p className="text-lg">
                        <span className="font-medium">Total Amount:</span>
                        <span className="font-bold text-green-600 ml-2">
                          ฿
                          {(() => {
                            if (selectedTransactionDetails.items) {
                              const total =
                                selectedTransactionDetails.items.reduce(
                                  (sum, item) => {
                                    return sum + item.price * item.quantity;
                                  },
                                  0
                                );
                              return (total / 100).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              });
                            }
                            return "0.00";
                          })()}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                {selectedTransactionDetails.items &&
                  selectedTransactionDetails.items.length > 0 && (
                    <div className="bg-white border rounded-lg">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h4 className="text-md font-semibold text-gray-900">
                          Items Purchased
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Product
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Variants
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Subtotal
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedTransactionDetails.items.map(
                              (item, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      ID: {item.productId}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {item.variants &&
                                        Object.entries(item.variants).map(
                                          ([key, value]) => (
                                            <span
                                              key={key}
                                              className="inline-block bg-gray-100 rounded-full px-2 py-1 text-xs mr-1 mb-1"
                                            >
                                              {key}: {value}
                                            </span>
                                          )
                                        )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ฿
                                    {(item.price / 100).toLocaleString(
                                      "en-US",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {item.quantity}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    ฿
                                    {(
                                      (item.price * item.quantity) /
                                      100
                                    ).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                {/* Transaction Details */}
                {selectedTransactionDetails.details && (
                  <div className="bg-yellow-50 rounded-lg p-4 mt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">
                      Transaction Details
                    </h4>
                    <p className="text-sm text-gray-700">
                      {selectedTransactionDetails.details}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transaction Details Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Transaction Details
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Transaction ID: {selectedTransaction.transactionId}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTransaction(null)}
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

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Customer Information
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-700">
                          Name:{" "}
                        </span>
                        <span>{selectedTransaction.customerName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Member ID:{" "}
                        </span>
                        <span>{selectedTransaction.customerId}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Email:{" "}
                        </span>
                        <span>{selectedTransaction.customerEmail}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Transaction Summary
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium text-gray-700">
                          Total Amount:{" "}
                        </span>
                        <span className="text-lg font-semibold text-green-600">
                          ฿
                          {(
                            (selectedTransaction.totalSpent || 0) / 100
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Points Earned:{" "}
                        </span>
                        <span className="text-lg font-semibold text-blue-600">
                          +{selectedTransaction.amount || 0} points
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Date:{" "}
                        </span>
                        <span>
                          {selectedTransaction.createdAt
                            ? new Date(
                                selectedTransaction.createdAt
                              ).toLocaleString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Source:{" "}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {selectedTransaction.source || "purchase"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedTransaction(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminAuthGuard>
  );
}
