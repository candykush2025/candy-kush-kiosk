"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminAuthGuard from "../../components/AdminAuthGuard";
import { CustomerService } from "../../lib/customerService";
import { TransactionService, OrderService } from "../../lib/transactionService";
import {
  ProductService,
  CategoryService,
  SubcategoryService,
  CashbackService,
} from "../../lib/productService";
import { countries } from "../../lib/countries";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    todayVisits: 0,
    totalTransactions: 0,
    totalProducts: 0,
    lowStockProducts: 0,
  });
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);

  // Cashback Management states
  const [cashbackRules, setCashbackRules] = useState([]);

  // Points History Management states
  const [showPointsHistory, setShowPointsHistory] = useState(false);
  const [selectedCustomerForPoints, setSelectedCustomerForPoints] =
    useState(null);
  const [customerPointsHistory, setCustomerPointsHistory] = useState([]);
  const [loadingPointsHistory, setLoadingPointsHistory] = useState(false);
  const [showAddCashbackRule, setShowAddCashbackRule] = useState(false);
  const [editingCashbackRule, setEditingCashbackRule] = useState(null);
  const [newCashbackRule, setNewCashbackRule] = useState({
    categoryId: "",
    categoryName: "",
    percentage: 0,
    isActive: true,
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    isActive: true,
  });
  const [newSubcategory, setNewSubcategory] = useState({
    name: "",
    categoryId: "",
    categoryName: "",
    isActive: true,
  });

  // Image upload states
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  const [subcategoryImageFile, setSubcategoryImageFile] = useState(null);
  const [productImageFiles, setProductImageFiles] = useState([]);

  // Loading states
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [isLoadingSubcategory, setIsLoadingSubcategory] = useState(false);
  const [isLoadingCashback, setIsLoadingCashback] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(null); // Track which product status is being toggled

  // Tree expansion states
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState(new Set());
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  // Product form states
  const [prefilledCategory, setPrefilledCategory] = useState(null);
  const [prefilledSubcategory, setPrefilledSubcategory] = useState(null);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([]);
  const [productUnit, setProductUnit] = useState("pcs");
  const [productImageFile, setProductImageFile] = useState(null);
  const [optionImageFile, setOptionImageFile] = useState(null);
  const [isProductSaving, setIsProductSaving] = useState(false);

  const [newCustomer, setNewCustomer] = useState({
    nationality: "",
    name: "",
    lastName: "",
    nickname: "",
    email: "",
    cell: "",
  });
  const [newOrder, setNewOrder] = useState({
    customerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    items: [],
    total: 0,
    orderType: "pickup",
    orderStatus: "pending",
    paymentStatus: "pending",
  });
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    categoryId: "",
    categoryName: "",
    subcategoryId: "",
    subcategoryName: "",
    hasVariants: false,

    // For products without variants
    price: 0,
    stock: 0,

    // For products with variants
    variants: [],

    // Common fields
    sku: "",
    barcode: "",
    supplier: "",
    minStock: 5,
    mainImage: "",
    images: [],
    isActive: true,
    isFeatured: false,
    tags: [],
    notes: "",
  });
  const [countrySearch, setCountrySearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const customersData = await CustomerService.getAllCustomers();
      const ordersData = await OrderService.getAllOrders();
      const transactionsData = await TransactionService.getAllTransactions();
      const transactionStats = await TransactionService.getTransactionStats();
      const productsData = await ProductService.getAllProducts();
      const productStats = await ProductService.getProductStats();
      const categoriesData = await CategoryService.getAllCategories();
      const subcategoriesData = await SubcategoryService.getAllSubcategories();
      const cashbackRulesData = await CashbackService.getAllCashbackRules();

      setCustomers(customersData);
      setOrders(ordersData);
      setTransactions(transactionsData);
      setProducts(productsData);
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
      setCashbackRules(cashbackRulesData);

      setStats({
        totalCustomers: customersData.length,
        totalOrders: ordersData.length,
        totalTransactions: transactionsData.length,
        totalProducts: productStats.totalProducts || 0,
        lowStockProducts: productStats.lowStockProducts || 0,
        totalRevenue: transactionStats.totalRevenue || 0,
        todayVisits: customersData.filter((customer) => {
          if (!customer.lastVisit) return false;
          const today = new Date().toDateString();
          return new Date(customer.lastVisit).toDateString() === today;
        }).length,
      });
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setShowAddCustomer(true);
  };

  const handleCancelAddCustomer = () => {
    setShowAddCustomer(false);
    setNewCustomer({
      nationality: "",
      name: "",
      lastName: "",
      nickname: "",
      email: "",
      cell: "",
    });
    setCountrySearch("");
  };

  const handleSaveNewCustomer = async () => {
    try {
      if (!newCustomer.name.trim()) {
        alert("Customer name is required");
        return;
      }

      await CustomerService.createCustomer(newCustomer);
      await loadDashboardData();
      handleCancelAddCustomer();
    } catch (error) {
      console.error("Failed to create customer:", error);
      alert("Failed to create customer. Please try again.");
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer({ ...customer });
  };

  const handleSaveCustomer = async () => {
    try {
      await CustomerService.updateCustomer(editingCustomer.id, editingCustomer);
      await loadDashboardData();
      setEditingCustomer(null);
    } catch (error) {
      console.error("Failed to update customer:", error);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        await CustomerService.deleteCustomer(customerId);
        await loadDashboardData();
      } catch (error) {
        console.error("Failed to delete customer:", error);
      }
    }
  };

  // Points History Management Functions
  const handleViewPointsHistory = async (customer) => {
    try {
      setSelectedCustomerForPoints(customer);
      setLoadingPointsHistory(true);
      setShowPointsHistory(true);

      const pointsHistory = await CustomerService.getCustomerPointsHistory(
        customer.id
      );
      setCustomerPointsHistory(pointsHistory);
    } catch (error) {
      console.error("Failed to load points history:", error);
      alert("Failed to load points history");
    } finally {
      setLoadingPointsHistory(false);
    }
  };

  const handleDeletePointTransaction = async (transactionIndex) => {
    if (
      !selectedCustomerForPoints ||
      !confirm("Are you sure you want to delete this point transaction?")
    ) {
      return;
    }

    try {
      const customer = await CustomerService.getCustomerById(
        selectedCustomerForPoints.id
      );
      if (!customer) {
        alert("Customer not found");
        return;
      }

      // Remove the transaction from the points array
      const updatedPoints = [...(customer.points || [])];
      updatedPoints.splice(transactionIndex, 1);

      // Update customer with new points array
      await CustomerService.updateCustomer(selectedCustomerForPoints.id, {
        points: updatedPoints,
      });

      // Reload points history
      const pointsHistory = await CustomerService.getCustomerPointsHistory(
        selectedCustomerForPoints.id
      );
      setCustomerPointsHistory(pointsHistory);

      // Reload dashboard data to update customer totals
      await loadDashboardData();

      alert("Point transaction deleted successfully");
    } catch (error) {
      console.error("Failed to delete point transaction:", error);
      alert("Failed to delete point transaction");
    }
  };

  const handleClosePointsHistory = () => {
    setShowPointsHistory(false);
    setSelectedCustomerForPoints(null);
    setCustomerPointsHistory([]);
  };

  // Cashback Management Functions
  const handleAddCashbackRule = () => {
    setShowAddCashbackRule(true);
  };

  const handleCancelAddCashbackRule = () => {
    setShowAddCashbackRule(false);
    setNewCashbackRule({
      categoryId: "",
      categoryName: "",
      percentage: 0,
      isActive: true,
    });
    setEditingCashbackRule(null);
  };

  const handleSaveCashbackRule = async () => {
    if (isLoadingCashback) return; // Prevent double submission

    try {
      setIsLoadingCashback(true);

      if (!newCashbackRule.categoryId) {
        alert("Please select a category");
        return;
      }

      if (newCashbackRule.percentage < 0 || newCashbackRule.percentage > 100) {
        alert("Percentage must be between 0 and 100");
        return;
      }

      if (editingCashbackRule) {
        // Update existing rule
        await CashbackService.updateCashbackRule(editingCashbackRule.id, {
          categoryId: newCashbackRule.categoryId,
          categoryName: newCashbackRule.categoryName,
          percentage: parseFloat(newCashbackRule.percentage),
          isActive: newCashbackRule.isActive,
        });
      } else {
        // Create new rule
        await CashbackService.createCashbackRule({
          categoryId: newCashbackRule.categoryId,
          categoryName: newCashbackRule.categoryName,
          percentage: parseFloat(newCashbackRule.percentage),
          isActive: newCashbackRule.isActive,
        });
      }

      await loadDashboardData();
      handleCancelAddCashbackRule();
    } catch (error) {
      console.error("Failed to save cashback rule:", error);
      alert(error.message || "Failed to save cashback rule. Please try again.");
    } finally {
      setIsLoadingCashback(false);
    }
  };

  const handleEditCashbackRule = (rule) => {
    setEditingCashbackRule(rule);
    setNewCashbackRule({
      categoryId: rule.categoryId,
      categoryName: rule.categoryName,
      percentage: rule.percentage,
      isActive: rule.isActive,
    });
    setShowAddCashbackRule(true);
  };

  const handleDeleteCashbackRule = async (ruleId) => {
    if (confirm("Are you sure you want to delete this cashback rule?")) {
      try {
        await CashbackService.deleteCashbackRule(ruleId);
        await loadDashboardData();
      } catch (error) {
        console.error("Failed to delete cashback rule:", error);
        alert("Failed to delete cashback rule. Please try again.");
      }
    }
  };

  const handleToggleCashbackRuleStatus = async (ruleId, currentStatus) => {
    try {
      await CashbackService.toggleCashbackRuleStatus(ruleId, !currentStatus);
      await loadDashboardData();
    } catch (error) {
      console.error("Failed to toggle cashback rule status:", error);
      alert("Failed to update cashback rule status. Please try again.");
    }
  };

  // Tree expansion toggle functions
  const toggleCategoryExpansion = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubcategoryExpansion = (subcategoryId) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategoryId)) {
      newExpanded.delete(subcategoryId);
    } else {
      newExpanded.add(subcategoryId);
    }
    setExpandedSubcategories(newExpanded);
  };

  const toggleProductExpansion = (productId) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  // Category management functions
  const handleAddCategory = () => {
    setShowAddCategory(true);
  };

  const handleSaveCategory = async () => {
    if (isLoadingCategory) return; // Prevent double submission

    try {
      setIsLoadingCategory(true);

      if (!newCategory.name.trim()) {
        alert("Category name is required");
        return;
      }

      await CategoryService.createCategory(newCategory, categoryImageFile);
      await loadDashboardData();
      setNewCategory({
        name: "",
        isActive: true,
      });
      setCategoryImageFile(null);
      setShowAddCategory(false);
    } catch (error) {
      console.error("Failed to create category:", error);
      alert("Failed to create category. Please try again.");
    } finally {
      setIsLoadingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (
      confirm(
        "Are you sure you want to delete this category? All products in this category will need to be reassigned."
      )
    ) {
      try {
        await ProductService.deleteCategory(categoryId);
        await loadDashboardData();
      } catch (error) {
        console.error("Failed to delete category:", error);
        alert("Failed to delete category. Please try again.");
      }
    }
  };

  // Subcategory management functions
  const handleAddSubcategory = () => {
    setShowAddSubcategory(true);
  };

  const handleSaveSubcategory = async () => {
    if (isLoadingSubcategory) return; // Prevent double submission

    try {
      setIsLoadingSubcategory(true);

      if (!newSubcategory.name.trim()) {
        alert("Subcategory name is required");
        return;
      }
      if (!newSubcategory.categoryId) {
        alert("Please select a category");
        return;
      }

      const selectedCategory = categories.find(
        (cat) => cat.id === newSubcategory.categoryId
      );
      if (selectedCategory) {
        newSubcategory.categoryName = selectedCategory.name;
      }

      await SubcategoryService.createSubcategory(
        newSubcategory,
        subcategoryImageFile
      );
      await loadDashboardData();
      setNewSubcategory({
        name: "",
        categoryId: "",
        categoryName: "",
        isActive: true,
      });
      setSubcategoryImageFile(null);
      setShowAddSubcategory(false);
    } catch (error) {
      console.error("Failed to create subcategory:", error);
      alert("Failed to create subcategory. Please try again.");
    } finally {
      setIsLoadingSubcategory(false);
    }
  };

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (
      confirm(
        "Are you sure you want to delete this subcategory? All products in this subcategory will need to be reassigned."
      )
    ) {
      try {
        await ProductService.deleteSubcategory(subcategoryId);
        await loadDashboardData();
      } catch (error) {
        console.error("Failed to delete subcategory:", error);
        alert("Failed to delete subcategory. Please try again.");
      }
    }
  };

  // Product handling functions
  const handleAddProduct = () => {
    setShowAddProduct(true);
  };

  const handleSaveProduct = async () => {
    if (isProductSaving) return; // Prevent double submission

    try {
      setIsProductSaving(true);

      if (!newProduct.name.trim()) {
        alert("Product name is required");
        return;
      }
      if (!newProduct.categoryId) {
        alert("Please select a category");
        return;
      }

      // Set category and subcategory names
      const selectedCategory = categories.find(
        (cat) => cat.id === newProduct.categoryId
      );
      if (selectedCategory) {
        newProduct.categoryName = selectedCategory.name;
      }

      if (newProduct.subcategoryId) {
        const selectedSubcategory = subcategories.find(
          (sub) => sub.id === newProduct.subcategoryId
        );
        if (selectedSubcategory) {
          newProduct.subcategoryName = selectedSubcategory.name;
        }
      }

      // Handle variant products
      if (hasVariants) {
        if (variants.length === 0) {
          alert("Please add at least one variant group for variant products");
          return;
        }

        // Validate that the last variant group has at least one option with price > 0
        const lastVariantGroup = variants[variants.length - 1];
        const hasPositivePrice = lastVariantGroup.options.some(
          (option) => option.price > 0
        );
        if (!hasPositivePrice) {
          alert(
            "The last variant group must have at least one option with price > 0"
          );
          return;
        }

        // Validate that all variant groups have at least one option
        for (let i = 0; i < variants.length; i++) {
          if (variants[i].options.length === 0) {
            alert(
              `Variant group "${variants[i].variantName}" must have at least one option`
            );
            return;
          }
        }

        // Upload variant option images and clean variants data
        const cleanedVariants = [];

        for (const variantGroup of variants) {
          const cleanedOptions = [];

          for (const option of variantGroup.options) {
            let imageUrl = "";

            // Upload option image if exists
            if (option.image && option.image instanceof File) {
              try {
                const imagePath = `products/variant-options/${option.id}/${option.image.name}`;
                imageUrl = await CategoryService.uploadImage(
                  option.image,
                  imagePath
                );
              } catch (error) {
                console.error("Failed to upload variant option image:", error);
                // Continue without image if upload fails
              }
            }

            cleanedOptions.push({
              id: option.id,
              name: option.name,
              price: option.price,
              unit: option.unit,
              isActive: option.isActive,
              imageUrl: imageUrl,
            });
          }

          cleanedVariants.push({
            ...variantGroup,
            options: cleanedOptions,
          });
        }

        newProduct.hasVariants = true;
        newProduct.variants = cleanedVariants;
        // Set stock to 0 for variant products as stock is managed per variant
        newProduct.stock = 0;
      } else {
        // Simple product
        newProduct.hasVariants = false;
        newProduct.variants = [];
      }

      if (editingProduct) {
        await ProductService.updateProduct(editingProduct.id, editingProduct);
        setEditingProduct(null);
      } else {
        // Create product with image
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
          stock: 0,
          variants: [],
          sku: "",
          barcode: "",
          supplier: "",
          minStock: 5,
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
      console.error("Failed to save product:", error);
      alert("Failed to save product. Please try again.");
    } finally {
      setIsProductSaving(false);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct({ ...product });
  };

  const handleDeleteProduct = async (productId) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await ProductService.deleteProduct(productId);
        await loadDashboardData();
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  const handleToggleProductStatus = async (product) => {
    if (isTogglingStatus === product.id) return; // Prevent multiple clicks

    setIsTogglingStatus(product.id);
    try {
      const updatedProduct = {
        ...product,
        isActive: product.isActive !== undefined ? !product.isActive : true, // Default to true if undefined
      };
      await ProductService.updateProduct(product.id, updatedProduct);
      await loadDashboardData();
    } catch (error) {
      console.error("Failed to toggle product status:", error);
    } finally {
      setIsTogglingStatus(null);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
  );

  const filteredCountries = countries.filter((country) =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const StatCard = ({ title, value, icon, color = "bg-blue-500" }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center">
        <div className={`${color} rounded-lg p-3`}>{icon}</div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminAuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Loading...
            </h1>
          </div>
        </div>
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard>
      <div className="h-screen bg-gray-50 flex overflow-hidden">
        {/* Desktop Sidebar - Fixed Width */}
        <div className="flex-shrink-0 w-64 bg-white shadow-lg flex flex-col">
          {/* Sidebar Header */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">
              Candy Kush Admin
            </h1>
            <p className="text-sm text-gray-500 mt-1">Management Panel</p>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-6">
            <div className="px-6 space-y-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`${
                  activeTab === "dashboard"
                    ? "bg-green-100 text-green-700 border-r-2 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors`}
              >
                <svg
                  className="mr-3 h-5 w-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z"
                  />
                </svg>
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab("customers")}
                className={`${
                  activeTab === "customers"
                    ? "bg-green-100 text-green-700 border-r-2 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors`}
              >
                <svg
                  className="mr-3 h-5 w-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Customers
              </button>

              <button
                onClick={() => setActiveTab("products")}
                className={`${
                  activeTab === "products"
                    ? "bg-green-100 text-green-700 border-r-2 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors`}
              >
                <svg
                  className="mr-3 h-5 w-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Products
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                className={`${
                  activeTab === "orders"
                    ? "bg-green-100 text-green-700 border-r-2 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors`}
              >
                <svg
                  className="mr-3 h-5 w-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                Orders
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={`${
                  activeTab === "analytics"
                    ? "bg-green-100 text-green-700 border-r-2 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors`}
              >
                <svg
                  className="mr-3 h-5 w-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Analytics
              </button>

              <button
                onClick={() => setActiveTab("transactions")}
                className={`${
                  activeTab === "transactions"
                    ? "bg-green-100 text-green-700 border-r-2 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors`}
              >
                <svg
                  className="mr-3 h-5 w-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
                Transactions
              </button>

              <button
                onClick={() => setActiveTab("cashback")}
                className={`${
                  activeTab === "cashback"
                    ? "bg-green-100 text-green-700 border-r-2 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors`}
              >
                <svg
                  className="mr-3 h-5 w-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Cashback
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`${
                  activeTab === "settings"
                    ? "bg-green-100 text-green-700 border-r-2 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left transition-colors`}
              >
                <svg
                  className="mr-3 h-5 w-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Settings
              </button>
            </div>
          </nav>

          {/* Logout Button */}
          <div className="flex-shrink-0 p-6 border-t border-gray-200">
            <button
              onClick={() => {
                sessionStorage.removeItem("adminAuthenticated");
                router.push("/admin/login");
              }}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <svg
                className="mr-3 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 capitalize">
                    {activeTab}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {activeTab === "dashboard" &&
                      "Monitor your business performance and key metrics"}
                    {activeTab === "customers" &&
                      "Manage customer database and information"}
                    {activeTab === "orders" &&
                      "View and manage customer orders"}
                    {activeTab === "analytics" &&
                      "Detailed insights into your business performance"}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-8 max-w-none">
              {/* Dashboard Content */}
              {activeTab === "dashboard" && (
                <div className="space-y-8">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                      title="Total Customers"
                      value={stats.totalCustomers}
                      icon={<span className="text-white text-xl">👥</span>}
                      color="bg-blue-500"
                    />
                    <StatCard
                      title="Total Orders"
                      value={stats.totalOrders}
                      icon={<span className="text-white text-xl">📦</span>}
                      color="bg-green-500"
                    />
                    <StatCard
                      title="Revenue"
                      value={`$${stats.totalRevenue.toFixed(2)}`}
                      icon={<span className="text-white text-xl">💰</span>}
                      color="bg-yellow-500"
                    />
                    <StatCard
                      title="Today's Visits"
                      value={stats.todayVisits}
                      icon={<span className="text-white text-xl">📊</span>}
                      color="bg-purple-500"
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setActiveTab("customers")}
                        className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <h4 className="font-medium text-gray-900">
                          Manage Customers
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Add, edit, or view customer information
                        </p>
                      </button>
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <h4 className="font-medium text-gray-900">
                          View Orders
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Monitor recent orders and transactions
                        </p>
                      </button>
                      <button
                        onClick={() => setActiveTab("analytics")}
                        className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <h4 className="font-medium text-gray-900">Analytics</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          View detailed business insights
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Customers Content */}
              {activeTab === "customers" && (
                <div className="space-y-6">
                  {/* Customer Management Header */}
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Customer Database
                        </h3>
                        <button
                          onClick={handleAddCustomer}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Add Customer
                        </button>
                      </div>
                    </div>
                    <div className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="Search customers by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Customer Table */}
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nationality
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCustomers.map((customer) => (
                          <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.name} {customer.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {customer.nickname && `"${customer.nickname}"`}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {customer.email || "No email"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {customer.cell || "No phone"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {customer.nationality || "Not specified"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {customer.customerId || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() =>
                                  handleViewPointsHistory(customer)
                                }
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                View Points
                              </button>
                              <button
                                onClick={() => handleEditCustomer(customer)}
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteCustomer(customer.id)
                                }
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
              )}

              {/* Products Content */}
              {activeTab === "products" && (
                <div className="space-y-6">
                  {/* Products Header */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Product Management
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Manage your cannabis product inventory and pricing
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowAddCategory(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add Category
                      </button>
                      <button
                        onClick={() => setShowAddSubcategory(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 flex items-center"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add Subcategory
                      </button>
                      <button
                        onClick={() => setShowAddProduct(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add Product
                      </button>
                    </div>
                  </div>

                  {/* Product Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <svg
                            className="w-6 h-6 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Products
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {stats.totalProducts}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <svg
                            className="w-6 h-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
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
                          <svg
                            className="w-6 h-6 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Low Stock
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {stats.lowStockProducts}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <svg
                            className="w-6 h-6 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Value
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            ฿
                            {products
                              .reduce((sum, p) => sum + p.price * p.stock, 0)
                              .toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Hierarchy Tree */}
                  <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl shadow-lg border border-gray-200/60 backdrop-blur-sm">
                    <div className="px-8 py-6 border-b border-gray-200/80 bg-gradient-to-r from-indigo-50 to-purple-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm border border-indigo-200">
                            <svg
                              className="w-6 h-6 text-indigo-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              Product Hierarchy
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {categories.length} categories •{" "}
                              {subcategories.length} subcategories •{" "}
                              {products.length} products
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setShowAddCategory(true)}
                            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Add Category
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 max-h-[700px] overflow-y-auto custom-scrollbar">
                      {categories.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                            <svg
                              className="w-12 h-12 text-indigo-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                              />
                            </svg>
                          </div>
                          <h4 className="text-xl font-bold text-gray-900 mb-3">
                            Build Your Product Catalog
                          </h4>
                          <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                            Create your first category to start organizing your
                            cannabis products. Build a structured hierarchy for
                            better management.
                          </p>
                          <button
                            onClick={() => setShowAddCategory(true)}
                            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          >
                            <svg
                              className="w-5 h-5 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Create First Category
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {categories.map((category) => {
                            const categorySubcategories = subcategories.filter(
                              (sub) => sub.categoryId === category.id
                            );
                            const isExpanded = expandedCategories.has(
                              category.id
                            );

                            return (
                              <div
                                key={category.id}
                                className="group bg-white rounded-xl border border-gray-200/80 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                              >
                                {/* Category Level */}
                                <div
                                  className="flex items-center space-x-4 p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50/50 cursor-pointer transition-all duration-200"
                                  onClick={() =>
                                    toggleCategoryExpansion(category.id)
                                  }
                                >
                                  <div className="flex items-center space-x-4">
                                    <div
                                      className={`transform transition-transform duration-200 ${
                                        isExpanded ? "rotate-90" : ""
                                      }`}
                                    >
                                      <svg
                                        className="w-5 h-5 text-gray-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 5l7 7-7 7"
                                        />
                                      </svg>
                                    </div>
                                    <div className="relative group">
                                      {category.image ? (
                                        <img
                                          src={category.image}
                                          alt={category.name}
                                          className="w-16 h-16 object-cover rounded-xl border-2 border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-200"
                                        />
                                      ) : (
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center border-2 border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-200">
                                          <svg
                                            className="w-8 h-8 text-indigo-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xl font-bold text-gray-900 mb-1">
                                      {category.name}
                                    </h4>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                      <span className="flex items-center">
                                        <svg
                                          className="w-4 h-4 mr-1"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                          />
                                        </svg>
                                        {categorySubcategories.length}{" "}
                                        subcategories
                                      </span>
                                      <span className="flex items-center">
                                        <svg
                                          className="w-4 h-4 mr-1"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                          />
                                        </svg>
                                        {
                                          products.filter(
                                            (p) => p.categoryId === category.id
                                          ).length
                                        }{" "}
                                        products
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span
                                      className={`px-4 py-2 text-sm font-medium rounded-full ${
                                        category.isActive
                                          ? "bg-green-100 text-green-800 border border-green-200"
                                          : "bg-red-100 text-red-800 border border-red-200"
                                      }`}
                                    >
                                      {category.isActive
                                        ? "Active"
                                        : "Inactive"}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCategory(category.id);
                                      }}
                                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                    >
                                      <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                </div>

                                {/* Subcategories Level */}
                                {isExpanded && (
                                  <div className="border-t border-gray-200/60 bg-gradient-to-r from-gray-50/50 to-indigo-50/30">
                                    {categorySubcategories.length === 0 ? (
                                      <div className="p-8 text-center">
                                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
                                          <svg
                                            className="w-8 h-8 text-purple-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                            />
                                          </svg>
                                        </div>
                                        <h5 className="text-lg font-semibold text-gray-900 mb-2">
                                          No subcategories yet
                                        </h5>
                                        <p className="text-gray-600 mb-6">
                                          Create your first subcategory in this
                                          category
                                        </p>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setNewSubcategory((prev) => ({
                                              ...prev,
                                              categoryId: category.id,
                                              categoryName: category.name,
                                            }));
                                            setShowAddSubcategory(true);
                                          }}
                                          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                        >
                                          <svg
                                            className="w-4 h-4 mr-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                            />
                                          </svg>
                                          Add Subcategory
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="p-4 space-y-3">
                                        {categorySubcategories.map(
                                          (subcategory) => {
                                            const subcategoryProducts =
                                              products.filter(
                                                (prod) =>
                                                  prod.subcategoryId ===
                                                  subcategory.id
                                              );
                                            const isSubExpanded =
                                              expandedSubcategories.has(
                                                subcategory.id
                                              );

                                            return (
                                              <div
                                                key={subcategory.id}
                                                className="bg-white rounded-lg border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ml-8"
                                              >
                                                {/* Subcategory Level */}
                                                <div
                                                  className="flex items-center space-x-4 p-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-purple-50/30 cursor-pointer"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSubcategoryExpansion(
                                                      subcategory.id
                                                    );
                                                  }}
                                                >
                                                  <div className="flex items-center space-x-3">
                                                    <div
                                                      className={`transform transition-transform duration-200 ${
                                                        isSubExpanded
                                                          ? "rotate-90"
                                                          : ""
                                                      }`}
                                                    >
                                                      <svg
                                                        className="w-4 h-4 text-gray-500"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                      >
                                                        <path
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          strokeWidth={2}
                                                          d="M9 5l7 7-7 7"
                                                        />
                                                      </svg>
                                                    </div>
                                                    {subcategory.image ? (
                                                      <img
                                                        src={subcategory.image}
                                                        alt={subcategory.name}
                                                        className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                                                      />
                                                    ) : (
                                                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                                                        <svg
                                                          className="w-6 h-6 text-purple-600"
                                                          fill="none"
                                                          stroke="currentColor"
                                                          viewBox="0 0 24 24"
                                                        >
                                                          <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                          />
                                                        </svg>
                                                      </div>
                                                    )}
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <h5 className="text-lg font-semibold text-gray-900 mb-1">
                                                      {subcategory.name}
                                                    </h5>
                                                    <p className="text-sm text-gray-600 flex items-center">
                                                      <svg
                                                        className="w-4 h-4 mr-1"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                      >
                                                        <path
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          strokeWidth={2}
                                                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                                        />
                                                      </svg>
                                                      {
                                                        subcategoryProducts.length
                                                      }{" "}
                                                      products
                                                    </p>
                                                  </div>
                                                  <div className="flex items-center space-x-2">
                                                    <span
                                                      className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                                                        subcategory.isActive
                                                          ? "bg-green-100 text-green-800 border border-green-200"
                                                          : "bg-red-100 text-red-800 border border-red-200"
                                                      }`}
                                                    >
                                                      {subcategory.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                    </span>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteSubcategory(
                                                          subcategory.id
                                                        );
                                                      }}
                                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                    >
                                                      <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                      >
                                                        <path
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                          strokeWidth={2}
                                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                      </svg>
                                                    </button>
                                                  </div>
                                                </div>

                                                {/* Products Level */}
                                                {isSubExpanded && (
                                                  <div className="border-t border-gray-200/50 bg-gradient-to-r from-indigo-50/30 to-blue-50/30">
                                                    {subcategoryProducts.length ===
                                                    0 ? (
                                                      <div className="p-8 text-center ml-12">
                                                        <div className="mx-auto w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
                                                          <svg
                                                            className="w-7 h-7 text-green-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                          >
                                                            <path
                                                              strokeLinecap="round"
                                                              strokeLinejoin="round"
                                                              strokeWidth={2}
                                                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                                            />
                                                          </svg>
                                                        </div>
                                                        <h6 className="text-base font-semibold text-gray-900 mb-2">
                                                          No products yet
                                                        </h6>
                                                        <p className="text-gray-600 mb-4 text-sm">
                                                          Add your first product
                                                          to this subcategory
                                                        </p>
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPrefilledCategory(
                                                              category
                                                            );
                                                            setPrefilledSubcategory(
                                                              subcategory
                                                            );
                                                            setNewProduct(
                                                              (prev) => ({
                                                                ...prev,
                                                                categoryId:
                                                                  category.id,
                                                                categoryName:
                                                                  category.name,
                                                                subcategoryId:
                                                                  subcategory.id,
                                                                subcategoryName:
                                                                  subcategory.name,
                                                              })
                                                            );
                                                            setShowAddProduct(
                                                              true
                                                            );
                                                          }}
                                                          className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                                                        >
                                                          <svg
                                                            className="w-4 h-4 mr-2"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                          >
                                                            <path
                                                              strokeLinecap="round"
                                                              strokeLinejoin="round"
                                                              strokeWidth={2}
                                                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                            />
                                                          </svg>
                                                          Add Product
                                                        </button>
                                                      </div>
                                                    ) : (
                                                      <div className="p-3 space-y-2 ml-12">
                                                        {subcategoryProducts.map(
                                                          (product) => {
                                                            const isProductExpanded =
                                                              expandedProducts.has(
                                                                product.id
                                                              );

                                                            return (
                                                              <div
                                                                key={product.id}
                                                                className="bg-white rounded-lg border border-gray-200/70 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                                              >
                                                                {/* Product Level */}
                                                                <div
                                                                  className="flex items-center space-x-3 p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50/30 cursor-pointer"
                                                                  onClick={(
                                                                    e
                                                                  ) => {
                                                                    e.stopPropagation();
                                                                    toggleProductExpansion(
                                                                      product.id
                                                                    );
                                                                  }}
                                                                >
                                                                  <div className="flex items-center space-x-3">
                                                                    <div
                                                                      className={`transform transition-transform duration-200 ${
                                                                        isProductExpanded
                                                                          ? "rotate-90"
                                                                          : ""
                                                                      }`}
                                                                    >
                                                                      <svg
                                                                        className="w-4 h-4 text-gray-500"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                      >
                                                                        <path
                                                                          strokeLinecap="round"
                                                                          strokeLinejoin="round"
                                                                          strokeWidth={
                                                                            2
                                                                          }
                                                                          d="M9 5l7 7-7 7"
                                                                        />
                                                                      </svg>
                                                                    </div>
                                                                    <div className="relative">
                                                                      {product.mainImage ? (
                                                                        <img
                                                                          src={
                                                                            product.mainImage
                                                                          }
                                                                          alt={
                                                                            product.name
                                                                          }
                                                                          className="w-10 h-10 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                                                                        />
                                                                      ) : (
                                                                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                                                                          <svg
                                                                            className="w-5 h-5 text-green-600"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                          >
                                                                            <path
                                                                              strokeLinecap="round"
                                                                              strokeLinejoin="round"
                                                                              strokeWidth={
                                                                                2
                                                                              }
                                                                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                                                            />
                                                                          </svg>
                                                                        </div>
                                                                      )}
                                                                      {product.hasVariants && (
                                                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                                          <svg
                                                                            className="w-2.5 h-2.5 text-white"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                          >
                                                                            <path
                                                                              strokeLinecap="round"
                                                                              strokeLinejoin="round"
                                                                              strokeWidth={
                                                                                3
                                                                              }
                                                                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                                            />
                                                                          </svg>
                                                                        </div>
                                                                      )}
                                                                    </div>
                                                                  </div>
                                                                  <div className="flex-1 min-w-0">
                                                                    <h6 className="font-semibold text-gray-900 text-base truncate mb-1">
                                                                      {
                                                                        product.name
                                                                      }
                                                                    </h6>
                                                                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                                                                      {product.hasVariants ? (
                                                                        <>
                                                                          <span className="flex items-center">
                                                                            <svg
                                                                              className="w-3 h-3 mr-1"
                                                                              fill="none"
                                                                              stroke="currentColor"
                                                                              viewBox="0 0 24 24"
                                                                            >
                                                                              <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                  2
                                                                                }
                                                                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                                                              />
                                                                            </svg>
                                                                            Variable
                                                                            Product
                                                                          </span>
                                                                          <span className="text-indigo-600 font-medium">
                                                                            {product
                                                                              .variants
                                                                              ?.length ||
                                                                              0}{" "}
                                                                            variants
                                                                          </span>
                                                                        </>
                                                                      ) : (
                                                                        <>
                                                                          <span className="flex items-center font-medium text-green-600">
                                                                            <svg
                                                                              className="w-3 h-3 mr-1"
                                                                              fill="none"
                                                                              stroke="currentColor"
                                                                              viewBox="0 0 24 24"
                                                                            >
                                                                              <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                  2
                                                                                }
                                                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                                                              />
                                                                            </svg>
                                                                            ฿
                                                                            {(
                                                                              product.price ||
                                                                              0
                                                                            ).toFixed(
                                                                              2
                                                                            )}
                                                                          </span>
                                                                          <span className="flex items-center">
                                                                            <svg
                                                                              className="w-3 h-3 mr-1"
                                                                              fill="none"
                                                                              stroke="currentColor"
                                                                              viewBox="0 0 24 24"
                                                                            >
                                                                              <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                  2
                                                                                }
                                                                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                                                              />
                                                                            </svg>
                                                                            Stock:{" "}
                                                                            {product.stock ||
                                                                              0}
                                                                          </span>
                                                                        </>
                                                                      )}
                                                                    </div>
                                                                  </div>
                                                                  <div className="flex items-center space-x-2">
                                                                    <button
                                                                      onClick={(
                                                                        e
                                                                      ) => {
                                                                        e.stopPropagation();
                                                                        handleToggleProductStatus(
                                                                          product
                                                                        );
                                                                      }}
                                                                      disabled={
                                                                        isTogglingStatus ===
                                                                        product.id
                                                                      }
                                                                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed ${
                                                                        (
                                                                          product.isActive !==
                                                                          undefined
                                                                            ? product.isActive
                                                                            : false
                                                                        )
                                                                          ? "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
                                                                          : "bg-red-100 text-red-800 border border-red-200 hover:bg-red-200"
                                                                      }`}
                                                                      title="Click to toggle status"
                                                                    >
                                                                      {isTogglingStatus ===
                                                                      product.id ? (
                                                                        <div className="flex items-center space-x-1">
                                                                          <svg
                                                                            className="animate-spin h-3 w-3"
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
                                                                          <span>
                                                                            ...
                                                                          </span>
                                                                        </div>
                                                                      ) : (
                                                                          product.isActive !==
                                                                          undefined
                                                                            ? product.isActive
                                                                            : false
                                                                        ) ? (
                                                                        "Active"
                                                                      ) : (
                                                                        "Inactive"
                                                                      )}
                                                                    </button>
                                                                    <button
                                                                      onClick={(
                                                                        e
                                                                      ) => {
                                                                        e.stopPropagation();
                                                                        setEditingProduct(
                                                                          product
                                                                        );
                                                                      }}
                                                                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                                                                    >
                                                                      <svg
                                                                        className="w-4 h-4"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                      >
                                                                        <path
                                                                          strokeLinecap="round"
                                                                          strokeLinejoin="round"
                                                                          strokeWidth={
                                                                            2
                                                                          }
                                                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                        />
                                                                      </svg>
                                                                    </button>
                                                                    <button
                                                                      onClick={(
                                                                        e
                                                                      ) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteProduct(
                                                                          product.id
                                                                        );
                                                                      }}
                                                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                                    >
                                                                      <svg
                                                                        className="w-4 h-4"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                      >
                                                                        <path
                                                                          strokeLinecap="round"
                                                                          strokeLinejoin="round"
                                                                          strokeWidth={
                                                                            2
                                                                          }
                                                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                        />
                                                                      </svg>
                                                                    </button>
                                                                  </div>
                                                                </div>

                                                                {/* Variants Level */}
                                                                {isProductExpanded &&
                                                                  product.hasVariants &&
                                                                  product.variants &&
                                                                  product
                                                                    .variants
                                                                    .length >
                                                                    0 && (
                                                                    <div className="border-t border-gray-200/50 bg-gradient-to-r from-blue-50/40 to-indigo-50/40">
                                                                      <div className="p-4 space-y-3">
                                                                        <div className="flex items-center space-x-2 mb-3">
                                                                          <svg
                                                                            className="w-4 h-4 text-indigo-600"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                          >
                                                                            <path
                                                                              strokeLinecap="round"
                                                                              strokeLinejoin="round"
                                                                              strokeWidth={
                                                                                2
                                                                              }
                                                                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                                                            />
                                                                          </svg>
                                                                          <h7 className="text-sm font-semibold text-gray-800">
                                                                            Product
                                                                            Variants
                                                                          </h7>
                                                                        </div>
                                                                        {product.variants.map(
                                                                          (
                                                                            variantGroup,
                                                                            groupIndex
                                                                          ) => (
                                                                            <div
                                                                              key={
                                                                                groupIndex
                                                                              }
                                                                              className="bg-white rounded-lg border border-gray-200/80 shadow-sm p-3"
                                                                            >
                                                                              <div className="flex items-center space-x-2 mb-3">
                                                                                <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                                                  {groupIndex +
                                                                                    1}
                                                                                </div>
                                                                                <h8 className="font-semibold text-gray-800 text-sm">
                                                                                  {
                                                                                    variantGroup.variantName
                                                                                  }
                                                                                </h8>
                                                                              </div>
                                                                              <div className="grid grid-cols-1 gap-2">
                                                                                {variantGroup.options.map(
                                                                                  (
                                                                                    option,
                                                                                    optionIndex
                                                                                  ) => (
                                                                                    <div
                                                                                      key={
                                                                                        optionIndex
                                                                                      }
                                                                                      className="flex items-center space-x-3 p-2 bg-gray-50/50 rounded-lg border border-gray-200/50 hover:bg-white hover:border-indigo-200 transition-all duration-200"
                                                                                    >
                                                                                      {option.imageUrl ? (
                                                                                        <img
                                                                                          src={
                                                                                            option.imageUrl
                                                                                          }
                                                                                          alt={
                                                                                            option.name
                                                                                          }
                                                                                          className="w-8 h-8 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                                                                                        />
                                                                                      ) : (
                                                                                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                                                                                          <svg
                                                                                            className="w-4 h-4 text-yellow-600"
                                                                                            fill="none"
                                                                                            stroke="currentColor"
                                                                                            viewBox="0 0 24 24"
                                                                                          >
                                                                                            <path
                                                                                              strokeLinecap="round"
                                                                                              strokeLinejoin="round"
                                                                                              strokeWidth={
                                                                                                2
                                                                                              }
                                                                                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                                                                            />
                                                                                          </svg>
                                                                                        </div>
                                                                                      )}
                                                                                      <div className="flex-1 min-w-0">
                                                                                        <div className="flex items-center space-x-2">
                                                                                          <span className="font-medium text-gray-800 text-sm truncate">
                                                                                            {
                                                                                              option.name
                                                                                            }
                                                                                          </span>
                                                                                          {option.price >
                                                                                            0 && (
                                                                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                                                              ฿
                                                                                              {(
                                                                                                option.price ||
                                                                                                0
                                                                                              ).toFixed(
                                                                                                2
                                                                                              )}
                                                                                            </span>
                                                                                          )}
                                                                                          {option.unit && (
                                                                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                                                                              {
                                                                                                option.unit
                                                                                              }
                                                                                            </span>
                                                                                          )}
                                                                                        </div>
                                                                                      </div>
                                                                                    </div>
                                                                                  )
                                                                                )}
                                                                              </div>
                                                                            </div>
                                                                          )
                                                                        )}
                                                                      </div>
                                                                    </div>
                                                                  )}
                                                              </div>
                                                            );
                                                          }
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Search and Filters */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Search products by name, category, or SKU..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="">All Categories</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="">All Status</option>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="low-stock">Low Stock</option>
                          <option value="out-of-stock">Out of Stock</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Products Table */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Product Inventory
                      </h3>
                    </div>
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
                              Subcategory
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Size
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Price (฿)
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Stock
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
                                categories
                                  .find((cat) => cat.id === product.categoryId)
                                  ?.name?.toLowerCase()
                                  .includes(productSearchTerm.toLowerCase()) ||
                                subcategories
                                  .find(
                                    (sub) => sub.id === product.subcategoryId
                                  )
                                  ?.name?.toLowerCase()
                                  .includes(productSearchTerm.toLowerCase())
                            )
                            .map((product) => {
                              const category = categories.find(
                                (cat) => cat.id === product.categoryId
                              );
                              const subcategory = subcategories.find(
                                (sub) => sub.id === product.subcategoryId
                              );
                              const hasVariantsWithPrice =
                                product.hasVariants &&
                                product.variants?.some((variant) =>
                                  variant.options?.some(
                                    (option) => option.price > 0
                                  )
                                );
                              const firstVariantWithPrice = hasVariantsWithPrice
                                ? product.variants
                                    ?.find((variant) =>
                                      variant.options?.some(
                                        (option) => option.price > 0
                                      )
                                    )
                                    ?.options?.find(
                                      (option) => option.price > 0
                                    )
                                : null;

                              return (
                                <tr
                                  key={product.id}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="h-10 w-10 flex-shrink-0">
                                        {product.mainImage ? (
                                          <img
                                            src={product.mainImage}
                                            alt={product.name}
                                            className="h-10 w-10 rounded-lg object-cover"
                                          />
                                        ) : (
                                          <div className="h-10 w-10 rounded-lg bg-gray-300 flex items-center justify-center">
                                            <span className="text-gray-600 text-xs font-medium">
                                              {product.name?.charAt(0)}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                          {product.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                          {product.hasVariants
                                            ? "Variable Product"
                                            : "Simple Product"}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {category?.name || "N/A"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {subcategory?.name || "N/A"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.hasVariants ? (
                                      <div>
                                        {product.variants?.map(
                                          (variant, idx) => (
                                            <div
                                              key={idx}
                                              className="text-xs text-gray-600"
                                            >
                                              {variant.variantName}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      product.size || "N/A"
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.hasVariants ? (
                                      <div>
                                        {firstVariantWithPrice ? (
                                          <span>
                                            ฿
                                            {firstVariantWithPrice.price.toFixed(
                                              2
                                            )}
                                            +
                                          </span>
                                        ) : (
                                          <span className="text-gray-400">
                                            No pricing
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span>
                                        ฿{(product.price || 0).toFixed(2)}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.hasVariants ? (
                                      <span className="text-blue-600">
                                        Variable
                                      </span>
                                    ) : (
                                      <span
                                        className={`${
                                          product.stock <=
                                          (product.minStock || 0)
                                            ? "text-red-600 font-medium"
                                            : "text-gray-900"
                                        }`}
                                      >
                                        {product.stock || 0}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                      onClick={() =>
                                        handleToggleProductStatus(product)
                                      }
                                      disabled={isTogglingStatus === product.id}
                                      className={`relative px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed ${
                                        (
                                          product.isActive !== undefined
                                            ? product.isActive
                                            : false
                                        )
                                          ? "bg-green-100 text-green-800 hover:bg-green-200 border border-green-200"
                                          : "bg-red-100 text-red-800 hover:bg-red-200 border border-red-200"
                                      }`}
                                      title="Click to toggle status"
                                    >
                                      {isTogglingStatus === product.id ? (
                                        <div className="flex items-center space-x-1">
                                          <svg
                                            className="animate-spin h-3 w-3"
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
                                          <span>Updating...</span>
                                        </div>
                                      ) : (
                                          product.isActive !== undefined
                                            ? product.isActive
                                            : false
                                        ) ? (
                                        "Active"
                                      ) : (
                                        "Inactive"
                                      )}
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() =>
                                          setSelectedProduct(product)
                                        }
                                        className="text-green-600 hover:text-green-900"
                                      >
                                        View
                                      </button>
                                      <button
                                        onClick={() =>
                                          setEditingProduct(product)
                                        }
                                        className="text-blue-600 hover:text-blue-900"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteProduct(product.id)
                                        }
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        Delete
                                      </button>
                                    </div>
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

              {/* Orders Content */}
              {activeTab === "orders" && (
                <div className="space-y-6">
                  {/* Orders Header */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Order Management
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Track and manage customer orders
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddOrder(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      New Order
                    </button>
                  </div>

                  {/* Order Status Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <svg
                            className="w-5 h-5 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-yellow-600">
                            Pending
                          </p>
                          <p className="text-xl font-semibold text-yellow-900">
                            {
                              orders.filter((o) => o.orderStatus === "pending")
                                .length
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-blue-600">
                            Confirmed
                          </p>
                          <p className="text-xl font-semibold text-blue-900">
                            {
                              orders.filter(
                                (o) => o.orderStatus === "confirmed"
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <svg
                            className="w-5 h-5 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-purple-600">
                            Preparing
                          </p>
                          <p className="text-xl font-semibold text-purple-900">
                            {
                              orders.filter(
                                (o) => o.orderStatus === "preparing"
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-600">
                            Ready
                          </p>
                          <p className="text-xl font-semibold text-green-900">
                            {
                              orders.filter((o) => o.orderStatus === "ready")
                                .length
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <svg
                            className="w-5 h-5 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">
                            Completed
                          </p>
                          <p className="text-xl font-semibold text-gray-900">
                            {
                              orders.filter(
                                (o) => o.orderStatus === "completed"
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Search and Filters */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Search orders by ID, customer name, or phone..."
                          value={orderSearchTerm}
                          onChange={(e) => setOrderSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <select className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="">All Types</option>
                          <option value="pickup">Pickup</option>
                          <option value="delivery">Delivery</option>
                          <option value="in-store">In-store</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Recent Orders
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Order ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orders
                            .filter(
                              (order) =>
                                order.orderId
                                  ?.toLowerCase()
                                  .includes(orderSearchTerm.toLowerCase()) ||
                                order.customerName
                                  ?.toLowerCase()
                                  .includes(orderSearchTerm.toLowerCase()) ||
                                order.customerPhone?.includes(orderSearchTerm)
                            )
                            .map((order) => (
                              <tr key={order.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {order.orderId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {order.customerName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {order.customerPhone}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="capitalize">
                                    {order.orderType}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  ${(order.total || 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      order.orderStatus === "completed"
                                        ? "bg-green-100 text-green-800"
                                        : order.orderStatus === "ready"
                                        ? "bg-blue-100 text-blue-800"
                                        : order.orderStatus === "preparing"
                                        ? "bg-purple-100 text-purple-800"
                                        : order.orderStatus === "confirmed"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : order.orderStatus === "pending"
                                        ? "bg-gray-100 text-gray-800"
                                        : order.orderStatus === "cancelled"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {order.orderStatus}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      order.paymentStatus === "paid"
                                        ? "bg-green-100 text-green-800"
                                        : order.paymentStatus === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : order.paymentStatus === "refunded"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {order.paymentStatus}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {order.createdAt
                                    ? new Date(
                                        order.createdAt
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => setSelectedOrder(order)}
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      View
                                    </button>
                                    {order.orderStatus !== "completed" &&
                                      order.orderStatus !== "cancelled" && (
                                        <button className="text-blue-600 hover:text-blue-900">
                                          Edit
                                        </button>
                                      )}
                                    {order.orderStatus === "pending" && (
                                      <button className="text-red-600 hover:text-red-900">
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Content */}
              {activeTab === "analytics" && (
                <div className="space-y-8">
                  {/* Analytics Stats Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <span className="text-blue-600 text-xl">📈</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Monthly Growth
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            +12.5%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <span className="text-green-600 text-xl">💳</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Avg. Order Value
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            $
                            {orders.length > 0
                              ? (
                                  stats.totalRevenue / stats.totalOrders
                                ).toFixed(2)
                              : "0.00"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <span className="text-purple-600 text-xl">🔄</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Return Rate
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {
                              customers.filter((c) => c.visits && c.visits > 1)
                                .length
                            }
                            %
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <span className="text-yellow-600 text-xl">⭐</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Customer Rating
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            4.8/5
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sales Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Sales Overview
                      </h3>
                      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-4xl mb-2">📊</div>
                          <p className="text-gray-600">
                            Sales chart visualization
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Shows daily/weekly sales trends
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Growth Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Customer Growth
                      </h3>
                      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-4xl mb-2">👥</div>
                          <p className="text-gray-600">
                            Customer growth over time
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Track new customer acquisitions
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Analytics Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top Customers */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Top Customers
                      </h3>
                      <div className="space-y-4">
                        {customers.slice(0, 5).map((customer, index) => (
                          <div
                            key={customer.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {index + 1}
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">
                                  {customer.name} {customer.lastName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {customer.email}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                {customer.totalOrders || 0} orders
                              </p>
                              <p className="text-sm text-gray-600">
                                ${customer.totalSpent || "0.00"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Recent Activity
                      </h3>
                      <div className="space-y-4">
                        {customers.slice(0, 5).map((customer, index) => (
                          <div
                            key={customer.id}
                            className="flex items-center p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">👤</span>
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {customer.name} {customer.lastName} registered
                              </p>
                              <p className="text-xs text-gray-600">
                                {customer.createdAt
                                  ? new Date(
                                      customer.createdAt
                                    ).toLocaleDateString()
                                  : "Recently"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Customer Demographics */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                      Customer Demographics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Nationality Distribution */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">
                          Top Nationalities
                        </h4>
                        <div className="space-y-2">
                          {(() => {
                            const nationalityCount = customers.reduce(
                              (acc, customer) => {
                                const nationality =
                                  customer.nationality || "Unknown";
                                acc[nationality] = (acc[nationality] || 0) + 1;
                                return acc;
                              },
                              {}
                            );

                            return Object.entries(nationalityCount)
                              .sort(([, a], [, b]) => b - a)
                              .slice(0, 5)
                              .map(([nationality, count]) => (
                                <div
                                  key={nationality}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="text-gray-600">
                                    {nationality}
                                  </span>
                                  <span className="font-medium">{count}</span>
                                </div>
                              ));
                          })()}
                        </div>
                      </div>

                      {/* Visit Frequency */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">
                          Visit Frequency
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              First-time visitors
                            </span>
                            <span className="font-medium">
                              {
                                customers.filter(
                                  (c) => !c.visits || c.visits === 1
                                ).length
                              }
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              Return customers
                            </span>
                            <span className="font-medium">
                              {
                                customers.filter(
                                  (c) => c.visits && c.visits > 1
                                ).length
                              }
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              VIP customers (5+ visits)
                            </span>
                            <span className="font-medium">
                              {
                                customers.filter(
                                  (c) => c.visits && c.visits >= 5
                                ).length
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Customer Status */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">
                          Customer Status
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Active</span>
                            <span className="font-medium text-green-600">
                              {
                                customers.filter(
                                  (c) => c.status === "active" || !c.status
                                ).length
                              }
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Inactive</span>
                            <span className="font-medium text-yellow-600">
                              {
                                customers.filter((c) => c.status === "inactive")
                                  .length
                              }
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Blocked</span>
                            <span className="font-medium text-red-600">
                              {
                                customers.filter((c) => c.status === "blocked")
                                  .length
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Content */}
              {activeTab === "transactions" && (
                <div className="space-y-6">
                  {/* Transactions Header */}
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Transaction History
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Manage and track all transaction records
                      </p>
                    </div>
                  </div>

                  {/* Transaction Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <svg
                            className="w-6 h-6 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                            />
                          </svg>
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

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <svg
                            className="w-6 h-6 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Revenue
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            ${stats.totalRevenue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <svg
                            className="w-6 h-6 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Avg Transaction
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            $
                            {stats.totalTransactions > 0
                              ? (
                                  stats.totalRevenue / stats.totalTransactions
                                ).toFixed(2)
                              : "0.00"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <svg
                            className="w-6 h-6 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Today's Sales
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            $
                            {transactions
                              .filter((t) => {
                                const today = new Date().toDateString();
                                return (
                                  t.createdAt &&
                                  new Date(t.createdAt).toDateString() === today
                                );
                              })
                              .reduce((sum, t) => sum + (t.total || 0), 0)
                              .toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Search */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Search transactions by ID, customer name, or amount..."
                          value={transactionSearchTerm}
                          onChange={(e) =>
                            setTransactionSearchTerm(e.target.value)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
                        Search
                      </button>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Recent Transactions
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transaction ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Payment Method
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {transactions
                            .filter(
                              (transaction) =>
                                transaction.transactionId
                                  ?.toLowerCase()
                                  .includes(
                                    transactionSearchTerm.toLowerCase()
                                  ) ||
                                transaction.customerName
                                  ?.toLowerCase()
                                  .includes(
                                    transactionSearchTerm.toLowerCase()
                                  ) ||
                                transaction.total
                                  ?.toString()
                                  .includes(transactionSearchTerm)
                            )
                            .map((transaction) => (
                              <tr
                                key={transaction.id}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {transaction.transactionId}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {transaction.customerName || "Guest"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  ${(transaction.total || 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="capitalize">
                                    {transaction.paymentMethod}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      transaction.status === "completed"
                                        ? "bg-green-100 text-green-800"
                                        : transaction.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : transaction.status === "refunded"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {transaction.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {transaction.createdAt
                                    ? new Date(
                                        transaction.createdAt
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() =>
                                      setSelectedTransaction(transaction)
                                    }
                                    className="text-green-600 hover:text-green-900 mr-4"
                                  >
                                    View
                                  </button>
                                  {transaction.status === "completed" && (
                                    <button className="text-red-600 hover:text-red-900">
                                      Refund
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Cashback Management Content */}
              {activeTab === "cashback" && (
                <div className="space-y-6">
                  {/* Cashback Header */}
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Cashback Management
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Set cashback percentages by category
                          </p>
                        </div>
                        <button
                          onClick={handleAddCashbackRule}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Add Category Cashback
                        </button>
                      </div>
                    </div>

                    {/* Cashback Rules Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Cashback %
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {cashbackRules.length === 0 ? (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-6 py-12 text-center text-gray-500"
                              >
                                <div className="flex flex-col items-center">
                                  <svg
                                    className="w-12 h-12 text-gray-400 mb-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <p className="text-lg font-medium">
                                    No cashback rules configured
                                  </p>
                                  <p className="text-sm">
                                    Add your first cashback rule to get started
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            cashbackRules.map((rule) => (
                              <tr key={rule.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {rule.categoryName}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {rule.percentage}%
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <button
                                    onClick={() =>
                                      handleToggleCashbackRuleStatus(
                                        rule.id,
                                        rule.isActive
                                      )
                                    }
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      rule.isActive
                                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                                        : "bg-red-100 text-red-800 hover:bg-red-200"
                                    } transition-colors cursor-pointer`}
                                  >
                                    {rule.isActive ? "Active" : "Inactive"}
                                  </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={() =>
                                        handleEditCashbackRule(rule)
                                      }
                                      className="text-blue-600 hover:text-blue-900 transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteCashbackRule(rule.id)
                                      }
                                      className="text-red-600 hover:text-red-900 transition-colors"
                                    >
                                      Delete
                                    </button>
                                  </div>
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

              {/* Settings Content */}
              {activeTab === "settings" && (
                <div className="space-y-6">
                  {/* Settings Header */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Settings & Configuration
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Manage system settings and preferences
                    </p>
                  </div>

                  {/* Settings Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Business Settings */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Business Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Name
                          </label>
                          <input
                            type="text"
                            defaultValue="Candy Kush Dispensary"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address
                          </label>
                          <textarea
                            rows="3"
                            defaultValue="123 Cannabis Street, Amsterdam, Netherlands"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            defaultValue="+31 20 123 4567"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                          </label>
                          <input
                            type="email"
                            defaultValue="info@candykush.nl"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* System Settings */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        System Preferences
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Currency
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="EUR">Euro (€)</option>
                            <option value="USD">US Dollar ($)</option>
                            <option value="GBP">British Pound (£)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="Europe/Amsterdam">
                              Europe/Amsterdam
                            </option>
                            <option value="America/New_York">
                              America/New_York
                            </option>
                            <option value="Asia/Tokyo">Asia/Tokyo</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Format
                          </label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </select>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="emailNotifications"
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="emailNotifications"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Enable email notifications
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="autoBackup"
                            defaultChecked
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="autoBackup"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Enable automatic backups
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Tax Settings */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Tax Configuration
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Standard Tax Rate (%)
                          </label>
                          <input
                            type="number"
                            defaultValue="21"
                            step="0.01"
                            min="0"
                            max="100"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tax ID Number
                          </label>
                          <input
                            type="text"
                            defaultValue="NL123456789B01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="includeTax"
                            defaultChecked
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="includeTax"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Include tax in displayed prices
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Security Settings */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Security Settings
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Session Timeout (hours)
                          </label>
                          <input
                            type="number"
                            defaultValue="24"
                            min="1"
                            max="168"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <button className="w-full bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700">
                            Change Admin Password
                          </button>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="twoFactor"
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="twoFactor"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Enable two-factor authentication
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="loginLogs"
                            defaultChecked
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor="loginLogs"
                            className="ml-2 block text-sm text-gray-900"
                          >
                            Log admin login attempts
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Settings Button */}
                  <div className="flex justify-end">
                    <button className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
                      Save All Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Add Customer Modal */}
        {showAddCustomer && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
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
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nationality */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nationality *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search nationality..."
                        value={newCustomer.nationality || countrySearch}
                        onChange={(e) => {
                          if (!newCustomer.nationality) {
                            setCountrySearch(e.target.value);
                          } else {
                            setNewCustomer({
                              ...newCustomer,
                              nationality: "",
                            });
                            setCountrySearch(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      {countrySearch && !newCustomer.nationality && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto">
                          {filteredCountries.slice(0, 10).map((country) => (
                            <button
                              key={country}
                              onClick={() => {
                                setNewCustomer({
                                  ...newCustomer,
                                  nationality: country,
                                });
                                setCountrySearch(""); // Clear to close dropdown
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100"
                            >
                              {country}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newCustomer.name}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={newCustomer.lastName}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          lastName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Nickname */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nickname
                    </label>
                    <input
                      type="text"
                      value={newCustomer.nickname}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          nickname: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Cell */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cell
                    </label>
                    <input
                      type="tel"
                      value={newCustomer.cell}
                      onChange={(e) =>
                        setNewCustomer({ ...newCustomer, cell: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={handleCancelAddCustomer}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewCustomer}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Add Customer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {editingCustomer && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Edit Customer
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editingCustomer.name || ""}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          name: e.target.value,
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
                      value={editingCustomer.email || ""}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={editingCustomer.phone || ""}
                      onChange={(e) =>
                        setEditingCustomer({
                          ...editingCustomer,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setEditingCustomer(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCustomer}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add New Product
                  </h3>
                  <button
                    onClick={() => setShowAddProduct(false)}
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

                <div className="space-y-4">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  {/* Product Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Image
                    </label>
                    <div className="space-y-3">
                      {/* Image Preview */}
                      {productImageFile && (
                        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 p-4 shadow-sm">
                          <div className="flex items-center justify-center">
                            <img
                              src={URL.createObjectURL(productImageFile)}
                              alt="Product preview"
                              className="max-w-full max-h-64 object-contain rounded-lg shadow-md"
                              style={{ aspectRatio: "auto" }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setProductImageFile(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 shadow-lg transition-colors"
                          >
                            ×
                          </button>
                          <div className="mt-3 text-center">
                            <p className="text-sm text-gray-600 font-medium">
                              {productImageFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(productImageFile.size / 1024 / 1024).toFixed(2)}{" "}
                              MB
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Upload Area */}
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setProductImageFile(e.target.files[0])
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="product-image-upload"
                        />
                        <label
                          htmlFor="product-image-upload"
                          className={`block w-full px-6 py-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 ${
                            productImageFile
                              ? "border-green-300 bg-green-50 text-green-700"
                              : "border-gray-300 bg-gray-50 text-gray-600 hover:border-green-400 hover:bg-green-50 hover:text-green-600"
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-3">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                productImageFile
                                  ? "bg-green-100"
                                  : "bg-gray-100"
                              }`}
                            >
                              <svg
                                className={`w-6 h-6 ${
                                  productImageFile
                                    ? "text-green-600"
                                    : "text-gray-400"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {productImageFile
                                  ? "Click to change image"
                                  : "Click to upload product image"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                PNG, JPG, JPEG up to 10MB
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Category and Subcategory */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={newProduct.categoryId}
                        onChange={(e) => {
                          const selectedCategory = categories.find(
                            (cat) => cat.id === e.target.value
                          );
                          setNewProduct({
                            ...newProduct,
                            categoryId: e.target.value,
                            categoryName: selectedCategory
                              ? selectedCategory.name
                              : "",
                            subcategoryId: "", // Reset subcategory when category changes
                            subcategoryName: "",
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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

                    {/* Subcategory */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subcategory
                      </label>
                      <select
                        value={newProduct.subcategoryId}
                        onChange={(e) => {
                          const selectedSubcategory = subcategories.find(
                            (sub) => sub.id === e.target.value
                          );
                          setNewProduct({
                            ...newProduct,
                            subcategoryId: e.target.value,
                            subcategoryName: selectedSubcategory
                              ? selectedSubcategory.name
                              : "",
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={!newProduct.categoryId}
                      >
                        <option value="">Select Subcategory</option>
                        {newProduct.categoryId &&
                          subcategories
                            .filter(
                              (sub) => sub.categoryId === newProduct.categoryId
                            )
                            .map((subcategory) => (
                              <option
                                key={subcategory.id}
                                value={subcategory.id}
                              >
                                {subcategory.name}
                              </option>
                            ))}
                      </select>
                    </div>
                  </div>

                  {/* Product Type Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Product Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="productType"
                          checked={!hasVariants}
                          onChange={() => {
                            setHasVariants(false);
                            setVariants([]);
                          }}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            Simple Product
                          </div>
                          <div className="text-sm text-gray-500">
                            Fixed price & stock
                          </div>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="productType"
                          checked={hasVariants}
                          onChange={() => setHasVariants(true)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            Product with Variants
                          </div>
                          <div className="text-sm text-gray-500">
                            Multiple sizes/options
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Simple Product Fields */}
                  {!hasVariants && (
                    <div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (฿) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newProduct.price}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              price: parseFloat(e.target.value) || "",
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Hierarchical Variants Section */}
                  {hasVariants && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Product Variants * (Step-by-step selection)
                      </label>
                      <p className="text-sm text-gray-600 mb-4">
                        Add variant groups in order. Customers will select
                        variants step-by-step. The last variant must have a
                        price &gt; 0.
                      </p>

                      {/* Current Variant Groups */}
                      {variants.length > 0 && (
                        <div className="mb-4 space-y-4">
                          {variants.map((variantGroup, groupIndex) => (
                            <div
                              key={groupIndex}
                              className="border border-gray-300 rounded-lg p-4 bg-white"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900">
                                  Step {groupIndex + 1}:{" "}
                                  {variantGroup.variantName}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setVariants(
                                      variants.filter(
                                        (_, i) => i !== groupIndex
                                      )
                                    );
                                  }}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Remove Group
                                </button>
                              </div>
                              <div className="space-y-2">
                                {variantGroup.options.map(
                                  (option, optionIndex) => (
                                    <div
                                      key={optionIndex}
                                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                    >
                                      <div className="flex items-center space-x-2">
                                        {option.imageUrl && (
                                          <img
                                            src={option.imageUrl}
                                            alt={option.name}
                                            className="w-6 h-6 object-cover rounded border"
                                          />
                                        )}
                                        <span className="text-sm">
                                          {option.name} - ฿{option.price}
                                          {option.unit && ` (${option.unit})`}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updatedVariants = [...variants];
                                          updatedVariants[groupIndex].options =
                                            updatedVariants[
                                              groupIndex
                                            ].options.filter(
                                              (_, i) => i !== optionIndex
                                            );
                                          setVariants(updatedVariants);
                                        }}
                                        className="text-red-600 hover:text-red-800 text-xs"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add New Variant Group */}
                      <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                        <h4 className="font-medium text-gray-700 mb-3">
                          Add New Variant Group (Step {variants.length + 1})
                        </h4>

                        {/* Variant Group Name */}
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Variant Group Name (e.g., Size, Quality, Type)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Size, Quality, Type"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                            id="variant-group-name"
                          />
                        </div>

                        {/* Options for this variant group */}
                        <div id="variant-options-container">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Add Options to this Variant Group:
                          </label>
                          <div className="space-y-2" id="variant-options-list">
                            {/* Options will be added here dynamically */}
                          </div>

                          {/* Add Option Form */}
                          <div className="border border-gray-200 rounded-lg p-3 bg-white">
                            <div className="grid grid-cols-1 gap-3">
                              {/* Option Details Row */}
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Option Name
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="e.g., Small"
                                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    id="option-name-input"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Price (฿)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    id="option-price-input"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Unit
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="pcs, g, ml"
                                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    id="option-unit-input"
                                  />
                                </div>
                              </div>

                              {/* Option Image Row */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Option Image (optional)
                                </label>
                                <div className="flex gap-3">
                                  {/* Image Preview */}
                                  {optionImageFile && (
                                    <div className="relative">
                                      <img
                                        src={URL.createObjectURL(
                                          optionImageFile
                                        )}
                                        alt="Option preview"
                                        className="w-16 h-16 object-cover rounded border"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setOptionImageFile(null)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  )}

                                  {/* Upload Button */}
                                  <div className="relative flex-1">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) =>
                                        setOptionImageFile(e.target.files[0])
                                      }
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      id="option-image-upload"
                                    />
                                    <label
                                      htmlFor="option-image-upload"
                                      className={`block w-full px-3 py-2 border border-dashed rounded-md text-center cursor-pointer text-xs transition-colors ${
                                        optionImageFile
                                          ? "border-green-300 bg-green-50 text-green-600"
                                          : "border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400"
                                      }`}
                                    >
                                      {optionImageFile
                                        ? "Change image"
                                        : "Click to upload option image"}
                                    </label>
                                  </div>
                                </div>
                              </div>

                              {/* Add Option Button */}
                              <div className="mt-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const optionName = document
                                      .getElementById("option-name-input")
                                      .value.trim();
                                    const optionPrice =
                                      parseFloat(
                                        document.getElementById(
                                          "option-price-input"
                                        ).value
                                      ) || 0;
                                    const optionUnit = document
                                      .getElementById("option-unit-input")
                                      .value.trim();

                                    if (optionName) {
                                      // Handle option image
                                      let optionImageData = null;
                                      if (optionImageFile) {
                                        optionImageData = {
                                          file: optionImageFile,
                                          url: URL.createObjectURL(
                                            optionImageFile
                                          ),
                                          name: optionImageFile.name,
                                        };
                                      }

                                      // Add to temporary options list display
                                      const optionsList =
                                        document.getElementById(
                                          "variant-options-list"
                                        );
                                      const optionDiv =
                                        document.createElement("div");
                                      optionDiv.className =
                                        "flex items-center justify-between bg-white p-2 rounded border";

                                      const imagePreview = optionImageData
                                        ? `<img src="${optionImageData.url}" alt="${optionName}" class="w-8 h-8 object-cover rounded mr-2" />`
                                        : '<div class="w-8 h-8 bg-gray-200 rounded mr-2 flex items-center justify-center"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';

                                      optionDiv.innerHTML = `
                                        <div class="flex items-center">
                                          ${imagePreview}
                                          <span class="text-sm">${optionName} - ฿${optionPrice}${
                                        optionUnit ? ` (${optionUnit})` : ""
                                      }</span>
                                        </div>
                                        <button type="button" onclick="this.parentElement.remove()" class="text-red-600 hover:text-red-800 text-xs">Remove</button>
                                      `;

                                      // Store image data as a property
                                      if (optionImageData) {
                                        optionDiv._imageData = optionImageData;
                                      }

                                      optionsList.appendChild(optionDiv);

                                      // Clear inputs
                                      document.getElementById(
                                        "option-name-input"
                                      ).value = "";
                                      document.getElementById(
                                        "option-price-input"
                                      ).value = "";
                                      document.getElementById(
                                        "option-unit-input"
                                      ).value = "";
                                      setOptionImageFile(null);
                                    } else {
                                      alert("Please enter option name");
                                    }
                                  }}
                                  className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
                                >
                                  + Add Option
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Save Variant Group */}
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              const groupName = document
                                .getElementById("variant-group-name")
                                .value.trim();
                              const optionsList = document.getElementById(
                                "variant-options-list"
                              );
                              const optionElements = optionsList.children;

                              if (!groupName) {
                                alert("Please enter variant group name");
                                return;
                              }

                              if (optionElements.length === 0) {
                                alert(
                                  "Please add at least one option to this variant group"
                                );
                                return;
                              }

                              // Extract options from DOM
                              const options = [];
                              for (let i = 0; i < optionElements.length; i++) {
                                const optionElement = optionElements[i];
                                const optionText =
                                  optionElement.querySelector(
                                    "span"
                                  ).textContent;
                                const parts = optionText.split(" - ฿");
                                const name = parts[0];
                                const priceAndUnit = parts[1];
                                const priceParts = priceAndUnit.split(" (");
                                const price = parseFloat(priceParts[0]) || 0;
                                const unit =
                                  priceParts.length > 1
                                    ? priceParts[1].replace(")", "")
                                    : "";

                                // Get image data if exists
                                const imageData =
                                  optionElement._imageData || null;

                                options.push({
                                  id: Date.now().toString() + i,
                                  name: name,
                                  price: price,
                                  unit: unit,
                                  image: imageData ? imageData.file : null,
                                  imageUrl: imageData ? imageData.url : "",
                                  isActive: true,
                                });
                              }

                              // Create new variant group
                              const newVariantGroup = {
                                id: Date.now().toString(),
                                variantName: groupName,
                                options: options,
                                order: variants.length + 1,
                              };

                              setVariants([...variants, newVariantGroup]);

                              // Clear form
                              document.getElementById(
                                "variant-group-name"
                              ).value = "";
                              document.getElementById(
                                "variant-options-list"
                              ).innerHTML = "";
                              setOptionImageFile(null);
                            }}
                            className="w-full px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Save Variant Group
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAddProduct(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProduct}
                    disabled={isProductSaving}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center space-x-2 ${
                      isProductSaving
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isProductSaving && (
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    )}
                    <span>{isProductSaving ? "Saving..." : "Add Product"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-5xl max-h-5xl overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add New Category
              </h3>

              <div className="space-y-4">
                {/* Category Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Kit, Flower, Edibles"
                    required
                  />
                </div>

                {/* Category Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Image
                  </label>
                  <div className="space-y-3">
                    {/* Image Preview */}
                    {categoryImageFile && (
                      <div className="relative bg-gray-50 rounded-md border border-gray-300 p-2">
                        <img
                          src={URL.createObjectURL(categoryImageFile)}
                          alt="Category preview"
                          className="w-full max-h-48 object-contain rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => setCategoryImageFile(null)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {/* Upload Button/Area */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setCategoryImageFile(e.target.files[0])
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="category-image-upload"
                      />
                      <label
                        htmlFor="category-image-upload"
                        className={`block w-full px-4 py-8 border-2 border-dashed rounded-md text-center cursor-pointer transition-colors ${
                          categoryImageFile
                            ? "border-green-300 bg-green-50 text-green-600"
                            : "border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        <svg
                          className="mx-auto h-8 w-8 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span className="text-sm font-medium">
                          {categoryImageFile
                            ? "Change Image"
                            : "Choose Category Image"}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowAddCategory(false);
                    setNewCategory({
                      name: "",
                      isActive: true,
                    });
                    setCategoryImageFile(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCategory}
                  disabled={isLoadingCategory}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center space-x-2 ${
                    isLoadingCategory
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isLoadingCategory && (
                    <svg
                      className="animate-spin h-4 w-4"
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
                  )}
                  <span>
                    {isLoadingCategory ? "Adding..." : "Add Category"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Subcategory Modal */}
        {showAddSubcategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add New Subcategory
              </h3>

              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={newSubcategory.categoryId}
                    onChange={(e) => {
                      const selectedCategory = categories.find(
                        (cat) => cat.id === e.target.value
                      );
                      setNewSubcategory({
                        ...newSubcategory,
                        categoryId: e.target.value,
                        categoryName: selectedCategory
                          ? selectedCategory.name
                          : "",
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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

                {/* Subcategory Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory Name *
                  </label>
                  <input
                    type="text"
                    value={newSubcategory.name}
                    onChange={(e) =>
                      setNewSubcategory({
                        ...newSubcategory,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Filters, Grinders, Papers"
                    required
                  />
                </div>

                {/* Subcategory Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory Image
                  </label>
                  <div className="space-y-3">
                    {/* Image Preview */}
                    {subcategoryImageFile && (
                      <div className="relative bg-gray-50 rounded-md border border-gray-300 p-2">
                        <img
                          src={URL.createObjectURL(subcategoryImageFile)}
                          alt="Subcategory preview"
                          className="w-full max-h-48 object-contain rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => setSubcategoryImageFile(null)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {/* Upload Button/Area */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setSubcategoryImageFile(e.target.files[0])
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="subcategory-image-upload"
                      />
                      <label
                        htmlFor="subcategory-image-upload"
                        className={`block w-full px-4 py-8 border-2 border-dashed rounded-md text-center cursor-pointer transition-colors ${
                          subcategoryImageFile
                            ? "border-purple-300 bg-purple-50 text-purple-600"
                            : "border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        <svg
                          className="mx-auto h-8 w-8 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span className="text-sm font-medium">
                          {subcategoryImageFile
                            ? "Change Image"
                            : "Choose Subcategory Image"}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowAddSubcategory(false);
                    setNewSubcategory({
                      name: "",
                      categoryId: "",
                      categoryName: "",
                      isActive: true,
                    });
                    setSubcategoryImageFile(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSubcategory}
                  disabled={isLoadingSubcategory}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center space-x-2 ${
                    isLoadingSubcategory
                      ? "bg-purple-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {isLoadingSubcategory && (
                    <svg
                      className="animate-spin h-4 w-4"
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
                  )}
                  <span>
                    {isLoadingSubcategory ? "Adding..." : "Add Subcategory"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product View Modal */}
        {selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Product Details
                </h2>
                <button
                  onClick={() => setSelectedProduct(null)}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Product Image */}
                <div>
                  {selectedProduct.mainImage ? (
                    <img
                      src={selectedProduct.mainImage}
                      alt={selectedProduct.name}
                      className="w-full h-64 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500">No image available</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    {selectedProduct.name}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">
                        Category:{" "}
                      </span>
                      <span>
                        {categories.find(
                          (cat) => cat.id === selectedProduct.categoryId
                        )?.name || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Subcategory:{" "}
                      </span>
                      <span>
                        {subcategories.find(
                          (sub) => sub.id === selectedProduct.subcategoryId
                        )?.name || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Status:{" "}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          (
                            selectedProduct.isActive !== undefined
                              ? selectedProduct.isActive
                              : false
                          )
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {(
                          selectedProduct.isActive !== undefined
                            ? selectedProduct.isActive
                            : false
                        )
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Description:{" "}
                      </span>
                      <span>
                        {selectedProduct.description || "No description"}
                      </span>
                    </div>
                    {!selectedProduct.hasVariants && (
                      <>
                        <div>
                          <span className="font-medium text-gray-700">
                            Price:{" "}
                          </span>
                          <span>
                            ฿{(selectedProduct.price || 0).toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Stock:{" "}
                          </span>
                          <span>{selectedProduct.stock || 0}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Variants Display */}
                  {selectedProduct.hasVariants &&
                    selectedProduct.variants &&
                    selectedProduct.variants.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-3">
                          Product Variants
                        </h4>
                        <div className="space-y-4">
                          {selectedProduct.variants.map(
                            (variantGroup, groupIndex) => (
                              <div
                                key={groupIndex}
                                className="border rounded-lg p-4"
                              >
                                <h5 className="font-medium mb-3">
                                  {variantGroup.variantName}
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {variantGroup.options.map(
                                    (option, optionIndex) => (
                                      <div
                                        key={optionIndex}
                                        className="flex items-center space-x-3 p-2 bg-gray-50 rounded"
                                      >
                                        {option.imageUrl && (
                                          <img
                                            src={option.imageUrl}
                                            alt={option.name}
                                            className="w-8 h-8 object-cover rounded border"
                                          />
                                        )}
                                        <div className="flex-1">
                                          <span className="font-medium">
                                            {option.name}
                                          </span>
                                          {option.price > 0 && (
                                            <span className="text-green-600 ml-2">
                                              ฿{option.price.toFixed(2)}
                                            </span>
                                          )}
                                          {option.unit && (
                                            <span className="text-gray-500 text-sm ml-2">
                                              ({option.unit})
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={() => {
                        setEditingProduct(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Edit Product
                    </button>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Edit Modal */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Edit Product
                </h2>
                <button
                  onClick={() => setEditingProduct(null)}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Product Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={editingProduct.name || ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingProduct.description || ""}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="Enter product description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={editingProduct.categoryId || ""}
                      onChange={(e) => {
                        const selectedCategory = categories.find(
                          (cat) => cat.id === e.target.value
                        );
                        setEditingProduct({
                          ...editingProduct,
                          categoryId: e.target.value,
                          categoryName: selectedCategory?.name || "",
                          subcategoryId: "",
                          subcategoryName: "",
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategory
                    </label>
                    <select
                      value={editingProduct.subcategoryId || ""}
                      onChange={(e) => {
                        const selectedSubcategory = subcategories.find(
                          (sub) => sub.id === e.target.value
                        );
                        setEditingProduct({
                          ...editingProduct,
                          subcategoryId: e.target.value,
                          subcategoryName: selectedSubcategory?.name || "",
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!editingProduct.categoryId}
                    >
                      <option value="">Select Subcategory</option>
                      {subcategories
                        .filter(
                          (sub) => sub.categoryId === editingProduct.categoryId
                        )
                        .map((subcategory) => (
                          <option key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          editingProduct.isActive !== undefined
                            ? editingProduct.isActive
                            : false
                        }
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            isActive: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      Active Product
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingProduct.hasVariants || false}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            hasVariants: e.target.checked,
                          })
                        }
                        className="mr-2"
                      />
                      Has Variants
                    </label>
                  </div>

                  {!editingProduct.hasVariants && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (฿)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingProduct.price || ""}
                        onChange={(e) =>
                          setEditingProduct({
                            ...editingProduct,
                            price: parseFloat(e.target.value) || "",
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>

                {/* Product Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Image
                  </label>
                  {editingProduct.mainImage && (
                    <div className="mb-4">
                      <img
                        src={editingProduct.mainImage}
                        alt="Current product image"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  <div className="text-center text-gray-500">
                    <p>Image editing functionality can be added here</p>
                    <p className="text-sm">
                      Current image:{" "}
                      {editingProduct.mainImage ? "Available" : "None"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProduct}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Cashback Rule Modal */}
        {showAddCashbackRule && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingCashbackRule
                      ? "Edit Cashback Rule"
                      : "Add Cashback Rule"}
                  </h3>
                  <button
                    onClick={handleCancelAddCashbackRule}
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

                <form className="space-y-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={newCashbackRule.categoryId}
                      onChange={(e) => {
                        const selectedCategory = categories.find(
                          (cat) => cat.id === e.target.value
                        );
                        setNewCashbackRule({
                          ...newCashbackRule,
                          categoryId: e.target.value,
                          categoryName: selectedCategory
                            ? selectedCategory.name
                            : "",
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories
                        .filter((category) => {
                          // Filter out categories that already have cashback rules (unless editing)
                          if (
                            editingCashbackRule &&
                            category.id === editingCashbackRule.categoryId
                          ) {
                            return true;
                          }
                          return !cashbackRules.some(
                            (rule) => rule.categoryId === category.id
                          );
                        })
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Cashback Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cashback Percentage *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={newCashbackRule.percentage}
                        onChange={(e) =>
                          setNewCashbackRule({
                            ...newCashbackRule,
                            percentage: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 pr-8"
                        placeholder="0.0"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-gray-500 text-sm">%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Enter percentage between 0 and 100
                    </p>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="cashbackActive"
                      checked={newCashbackRule.isActive}
                      onChange={(e) =>
                        setNewCashbackRule({
                          ...newCashbackRule,
                          isActive: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="cashbackActive"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Active
                    </label>
                  </div>
                </form>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={handleCancelAddCashbackRule}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCashbackRule}
                    disabled={isLoadingCashback}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center space-x-2 ${
                      isLoadingCashback
                        ? "bg-green-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isLoadingCashback && (
                      <svg
                        className="animate-spin h-4 w-4"
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
                    )}
                    <span>
                      {isLoadingCashback
                        ? editingCashbackRule
                          ? "Updating..."
                          : "Creating..."
                        : editingCashbackRule
                        ? "Update Rule"
                        : "Create Rule"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Points History Modal */}
        {showPointsHistory && selectedCustomerForPoints && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Points History - {selectedCustomerForPoints.name}{" "}
                    {selectedCustomerForPoints.lastName}
                  </h3>
                  <button
                    onClick={handleClosePointsHistory}
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

                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">
                        Customer ID: {selectedCustomerForPoints.customerId}
                      </p>
                      <p className="text-sm text-gray-600">
                        Total Points:{" "}
                        {CustomerService.calculateTotalPoints(
                          selectedCustomerForPoints.points || []
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Total Transactions:{" "}
                        {(selectedCustomerForPoints.points || []).length}
                      </p>
                    </div>
                  </div>
                </div>

                {loadingPointsHistory ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">
                      Loading points history...
                    </p>
                  </div>
                ) : customerPointsHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      No Points History
                    </h3>
                    <p className="text-gray-600">
                      This customer hasn't earned or used any points yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {customerPointsHistory.map((transaction, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                transaction.type === "added"
                                  ? "bg-green-100"
                                  : "bg-red-100"
                              }`}
                            >
                              <svg
                                className={`w-4 h-4 ${
                                  transaction.type === "added"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d={
                                    transaction.type === "added"
                                      ? "M12 6v6m0 0v6m0-6h6m-6 0H6"
                                      : "M20 12H4"
                                  }
                                />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">
                                {transaction.reason}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {transaction.details}
                              </p>
                            </div>
                          </div>

                          {transaction.items &&
                            transaction.items.length > 0 && (
                              <div className="mt-3 ml-11 p-3 bg-gray-50 rounded-md">
                                <p className="text-xs font-medium text-gray-700 mb-2">
                                  Items:
                                </p>
                                <div className="space-y-1">
                                  {transaction.items.map((item, itemIndex) => (
                                    <div
                                      key={itemIndex}
                                      className="text-xs text-gray-600"
                                    >
                                      <div className="flex justify-between">
                                        <span className="font-medium">
                                          {item.name} x{item.quantity || 1}
                                        </span>
                                        <span>
                                          ฿
                                          {((item.price || 0) / 100).toFixed(2)}
                                        </span>
                                      </div>
                                      {item.variants &&
                                        Object.keys(item.variants).length >
                                          0 && (
                                          <div className="text-xs text-gray-500 ml-2">
                                            {Object.entries(item.variants).map(
                                              ([key, value]) => (
                                                <span
                                                  key={key}
                                                  className="mr-2"
                                                >
                                                  {key}: {value}
                                                </span>
                                              )
                                            )}
                                          </div>
                                        )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          <div className="flex items-center justify-between mt-3 ml-11">
                            <span className="text-xs text-gray-500">
                              {new Date(
                                transaction.timestamp
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {transaction.transactionId && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                ID:{" "}
                                {transaction.transactionId
                                  .slice(-6)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span
                            className={`font-bold ${
                              transaction.type === "added"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.type === "added" ? "+" : "-"}
                            {transaction.amount} pts
                          </span>
                          <button
                            onClick={() => handleDeletePointTransaction(index)}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            title="Delete Transaction"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleClosePointsHistory}
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
