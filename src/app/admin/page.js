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
  // Active tab synced with URL (?tab=) so refresh restores last visited section
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

  // Product hierarchy expansion states
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState(new Set());
  const [expandedProducts, setExpandedProducts] = useState(new Set());

  // Product form states for comprehensive management
  const [prefilledCategory, setPrefilledCategory] = useState(null);
  const [prefilledSubcategory, setPrefilledSubcategory] = useState(null);

  // Product status toggle loading state
  const [isTogglingStatus, setIsTogglingStatus] = useState(null);

  // Complex Product Form States
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([]);
  const [productUnit, setProductUnit] = useState("pcs");
  const [productImageFile, setProductImageFile] = useState(null);
  const [optionImageFile, setOptionImageFile] = useState(null);
  const [isProductSaving, setIsProductSaving] = useState(false);

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
    // For products without variants
    price: 0,
    // For products with variants
    variants: [],
    // Common fields
    sku: "",
    barcode: "",
    supplier: "",
    mainImage: "",
    images: [],
    textColor: "#000000",
    backgroundImage: "",
    backgroundFit: "contain",
    isActive: true,
    isFeatured: false,
    tags: [],
    notes: "",
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

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    backgroundImage: "",
    backgroundFit: "contain",
    textColor: "#000000",
    isActive: true,
  });

  const [newSubcategory, setNewSubcategory] = useState({
    name: "",
    description: "",
    categoryId: "",
    categoryName: "",
    backgroundImage: "",
    backgroundFit: "contain",
    textColor: "#000000",
    isActive: true,
  });

  // Product form for editing
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    categoryName: "",
    subcategoryId: "",
    subcategoryName: "",
    hasVariants: false,
    price: 0,
    variants: [],
    sku: "",
    barcode: "",
    supplier: "",
    mainImage: "",
    images: [],
    backgroundImage: "",
    backgroundFit: "contain",
    textColor: "#000000",
    isActive: true,
    isFeatured: false,
    tags: [],
    notes: "",
  });

  // Category and subcategory editing states
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    backgroundImage: "",
    backgroundFit: "contain",
    textColor: "#000000",
    isActive: true,
  });
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: "",
    description: "",
    categoryId: "",
    categoryName: "",
    backgroundImage: "",
    backgroundFit: "contain",
    isActive: true,
  });

  // Image removal tracking states
  const [removeExistingCategoryImage, setRemoveExistingCategoryImage] =
    useState(false);
  const [removeExistingSubcategoryImage, setRemoveExistingSubcategoryImage] =
    useState(false);
  const [
    removeExistingCategoryBackground,
    setRemoveExistingCategoryBackground,
  ] = useState(false);
  const [
    removeExistingSubcategoryBackground,
    setRemoveExistingSubcategoryBackground,
  ] = useState(false);

  const [cashbackForm, setCashbackForm] = useState({
    categoryId: "",
    categoryName: "",
    percentage: 0,
    isActive: true,
  });

  // Image upload states
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  const [subcategoryImageFile, setSubcategoryImageFile] = useState(null);
  const [categoryBackgroundImageFile, setCategoryBackgroundImageFile] =
    useState(null);
  const [subcategoryBackgroundImageFile, setSubcategoryBackgroundImageFile] =
    useState(null);
  const [productBackgroundImageFile, setProductBackgroundImageFile] =
    useState(null);

  // Loading states
  const [isCustomerSaving, setIsCustomerSaving] = useState(false);
  const [isLoadingCategory, setIsLoadingCategory] = useState(false);
  const [isLoadingSubcategory, setIsLoadingSubcategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isDeletingSubcategory, setIsDeletingSubcategory] = useState(false);
  const [isDeletingCashback, setIsDeletingCashback] = useState(false);
  const [isCashbackSaving, setIsCashbackSaving] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(null);
  const [isTogglingCustomerStatus, setIsTogglingCustomerStatus] =
    useState(null);
  const [isTogglingCashbackStatus, setIsTogglingCashbackStatus] =
    useState(null);
  const [isDeletingPointTransaction, setIsDeletingPointTransaction] =
    useState(null);

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

          // CALCULATE total from items array (quantity * price)
          let calculatedTotal = 0;
          if (pointRecord.items && Array.isArray(pointRecord.items)) {
            calculatedTotal = pointRecord.items.reduce((sum, item) => {
              return sum + (item.quantity || 1) * (item.price || 0);
            }, 0);
          }

          console.log(
            `Transaction ${transactionId}: calculated total = ${calculatedTotal} cents = ฿${
              calculatedTotal / 100
            }`
          );

          const transaction = {
            transactionId: transactionId,
            customerId: customer.customerId,
            customerName: customer.name,
            customerEmail: customer.email,
            customerCell: customer.cell,
            totalSpent: calculatedTotal,
            // Convert from cents to baht for display
            amount: calculatedTotal / 100,
            pointsEarned: pointRecord.amount || 0,
            items: pointRecord.items || [],
            details: pointRecord.details || "",
            orderId: pointRecord.orderId,
            createdAt: pointRecord.timestamp
              ? new Date(pointRecord.timestamp)
              : pointRecord.createdAt,
            status: "completed",
            source: pointRecord.reason || "purchase",
            type: pointRecord.type || "purchase",
          };

          console.log("Transaction created:", {
            transactionId,
            totalSpent: pointRecord.totalSpent,
            amount: transaction.amount,
            pointsEarned: transaction.pointsEarned,
          });
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

  // Initialize activeTab from URL on mount (only client side)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  // Keep URL in sync when activeTab changes (replace state so history not polluted)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = new URL(window.location.href);
    if (activeTab === "dashboard") {
      // Remove param when default tab to keep URL clean
      current.searchParams.delete("tab");
    } else {
      current.searchParams.set("tab", activeTab);
    }
    const newUrl =
      current.pathname +
      (current.search ? `?${current.searchParams.toString()}` : "");
    if (newUrl !== window.location.pathname + window.location.search) {
      window.history.replaceState({}, "", newUrl);
    }
  }, [activeTab]);

  // Optional: respond to browser back/forward navigation altering ?tab=
  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") || "dashboard";
      setActiveTab(tab);
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  // Initialize productForm when editing a product
  useEffect(() => {
    if (editingProduct) {
      setProductForm({
        name: editingProduct.name || "",
        description: editingProduct.description || "",
        categoryId: editingProduct.categoryId || "",
        subcategoryId: editingProduct.subcategoryId || "",
        price: editingProduct.price || 0,
        hasVariants: editingProduct.hasVariants || false,
        variants: editingProduct.variants || [],
        mainImage: editingProduct.mainImage || "",
        sku: editingProduct.sku || "",
        barcode: editingProduct.barcode || "",
        supplier: editingProduct.supplier || "",
        isActive:
          editingProduct.isActive !== undefined
            ? editingProduct.isActive
            : true,
        isFeatured: editingProduct.isFeatured || false,
        notes: editingProduct.notes || "",
        tags: editingProduct.tags || [],
        images: editingProduct.images || [],
        backgroundImage: editingProduct.backgroundImage || "",
        backgroundFit: editingProduct.backgroundFit || "contain",
        categoryName: editingProduct.categoryName || "",
        subcategoryName: editingProduct.subcategoryName || "",
        textColor: editingProduct.textColor || "#000000",
      });
      // Reset image file when starting to edit a different product
      setProductImageFile(null);
      setProductBackgroundImageFile(null);
    }
  }, [editingProduct]);

  // Initialize categoryForm when editing a category
  useEffect(() => {
    if (editingCategory) {
      setCategoryForm({
        name: editingCategory.name || "",
        description: editingCategory.description || "",
        backgroundImage: editingCategory.backgroundImage || "",
        backgroundFit: editingCategory.backgroundFit || "contain",
        textColor: editingCategory.textColor || "#000000",
        isActive:
          editingCategory.isActive !== undefined
            ? editingCategory.isActive
            : true,
      });
      // Reset image file when starting to edit a different category
      setCategoryImageFile(null);
      setCategoryBackgroundImageFile(null);
      setRemoveExistingCategoryImage(false);
    }
  }, [editingCategory]);

  // Initialize subcategoryForm when editing a subcategory
  useEffect(() => {
    if (editingSubcategory) {
      setSubcategoryForm({
        name: editingSubcategory.name || "",
        description: editingSubcategory.description || "",
        categoryId: editingSubcategory.categoryId || "",
        categoryName: editingSubcategory.categoryName || "",
        backgroundImage: editingSubcategory.backgroundImage || "",
        backgroundFit: editingSubcategory.backgroundFit || "contain",
        textColor: editingSubcategory.textColor || "#000000",
        isActive:
          editingSubcategory.isActive !== undefined
            ? editingSubcategory.isActive
            : true,
      });
      // Reset image file when starting to edit a different subcategory
      setSubcategoryImageFile(null);
      setSubcategoryBackgroundImageFile(null);
      setRemoveExistingSubcategoryImage(false);
    }
  }, [editingSubcategory]);

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
      setIsTogglingCustomerStatus(customer.id);
      const updatedCustomer = { ...customer, isActive: !customer.isActive };
      await CustomerService.updateCustomer(customer.id, updatedCustomer);
      await loadDashboardData();
    } catch (error) {
      console.error("Error updating customer status:", error);
    } finally {
      setIsTogglingCustomerStatus(null);
    }
  };

  // Product hierarchy expansion handlers
  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleSubcategoryExpansion = (subcategoryId) => {
    setExpandedSubcategories((prev) => {
      const next = new Set(prev);
      if (next.has(subcategoryId)) {
        next.delete(subcategoryId);
      } else {
        next.add(subcategoryId);
      }
      return next;
    });
  };

  const toggleProductExpansion = (productId) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Product handlers
  const handleSaveProduct = async (e) => {
    e.preventDefault(); // Prevent form reload
    try {
      setIsProductSaving(true);

      if (editingProduct) {
        // Handle editing existing product
        if (productForm.hasVariants && variants.length > 0) {
          productForm.hasVariants = true;
          productForm.variants = variants;
        } else {
          productForm.hasVariants = false;
          productForm.variants = [];
        }

        await ProductService.updateProduct(
          editingProduct.id,
          productForm,
          productBackgroundImageFile
        );
        setEditingProduct(null);
        setProductBackgroundImageFile(null);
        setProductForm({
          name: "",
          description: "",
          categoryId: "",
          categoryName: "",
          subcategoryId: "",
          subcategoryName: "",
          hasVariants: false,
          price: 0,
          variants: [],
          sku: "",
          barcode: "",
          supplier: "",
          mainImage: "",
          images: [],
          isActive: true,
          isFeatured: false,
          tags: [],
          notes: "",
          backgroundImage: "",
          backgroundFit: "cover",
          textColor: "#000000",
        });
      } else {
        // Handle adding new product
        if (hasVariants && variants.length > 0) {
          newProduct.hasVariants = true;
          newProduct.variants = variants;
        } else {
          newProduct.hasVariants = false;
          newProduct.variants = [];
        }

        const imageFiles = productImageFile ? [productImageFile] : [];
        await ProductService.createProduct(
          newProduct,
          imageFiles,
          productBackgroundImageFile || null
        );
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
          textColor: "#000000",
          backgroundImage: "",
          backgroundFit: "contain",
          isActive: true,
          isFeatured: false,
          tags: [],
          notes: "",
        });
        setHasVariants(false);
        setVariants([]);
        setProductImageFile(null);
        setOptionImageFile(null);
        setProductBackgroundImageFile(null);
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
      setIsDeletingProduct(productId);
      await ProductService.deleteProduct(productId);
      await loadDashboardData();
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setIsDeletingProduct(null);
    }
  };

  const handleToggleProductStatus = async (product) => {
    try {
      setIsTogglingStatus(product.id);
      const updatedProduct = { ...product, isActive: !product.isActive };
      await ProductService.updateProduct(product.id, updatedProduct);
      await loadDashboardData();
    } catch (error) {
      console.error("Error updating product status:", error);
    } finally {
      setIsTogglingStatus(null);
    }
  };

  // Category handlers (restored stable version)
  const handleSaveCategory = async () => {
    if (isLoadingCategory) return; // Prevent double submission

    try {
      setIsLoadingCategory(true);

      if (!newCategory.name.trim()) {
        alert("Category name is required");
        return;
      }

      await CategoryService.createCategory(
        newCategory,
        categoryImageFile,
        categoryBackgroundImageFile
      );
      await loadDashboardData();
      setNewCategory({
        name: "",
        description: "",
        backgroundImage: "",
        backgroundFit: "contain",
        textColor: "#000000",
        isActive: true,
      });
      setCategoryImageFile(null);
      setCategoryBackgroundImageFile(null);
      setShowAddCategory(false);
    } catch (error) {
      console.error("Failed to create category:", error);
      alert("Failed to create category. Please try again.");
    } finally {
      setIsLoadingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (isDeletingCategory) return; // Prevent double submission

    if (
      confirm(
        "Are you sure you want to delete this category? All products in this category will need to be reassigned."
      )
    ) {
      try {
        setIsDeletingCategory(true);
        await CategoryService.deleteCategory(categoryId);
        await loadDashboardData();
      } catch (error) {
        console.error("Failed to delete category:", error);
        alert("Failed to delete category. Please try again.");
      } finally {
        setIsDeletingCategory(false);
      }
    }
  };

  // Subcategory handlers (restored stable version)
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
        subcategoryImageFile,
        subcategoryBackgroundImageFile
      );
      await loadDashboardData();
      setNewSubcategory({
        name: "",
        description: "",
        categoryId: "",
        categoryName: "",
        backgroundImage: "",
        backgroundFit: "contain",
        textColor: "#000000",
        isActive: true,
      });
      setSubcategoryImageFile(null);
      setSubcategoryBackgroundImageFile(null);
      setShowAddSubcategory(false);
    } catch (error) {
      console.error("Failed to create subcategory:", error);
      alert("Failed to create subcategory. Please try again.");
    } finally {
      setIsLoadingSubcategory(false);
    }
  };

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (isDeletingSubcategory) return; // Prevent double submission

    if (
      confirm(
        "Are you sure you want to delete this subcategory? All products in this subcategory will need to be reassigned."
      )
    ) {
      try {
        setIsDeletingSubcategory(true);
        await SubcategoryService.deleteSubcategory(subcategoryId);
        await loadDashboardData();
      } catch (error) {
        console.error("Failed to delete subcategory:", error);
        alert("Failed to delete subcategory. Please try again.");
      } finally {
        setIsDeletingSubcategory(false);
      }
    }
  };

  // Category edit handlers
  const handleEditCategory = async () => {
    try {
      setIsLoadingCategory(true);

      if (!categoryForm.name.trim()) {
        alert("Category name is required");
        return;
      }

      await CategoryService.updateCategory(
        editingCategory.id,
        categoryForm,
        categoryImageFile,
        categoryBackgroundImageFile,
        removeExistingCategoryImage,
        removeExistingCategoryBackground
      );
      await loadDashboardData();
      setEditingCategory(null);
      setCategoryForm({
        name: "",
        description: "",
        backgroundImage: "",
        backgroundFit: "contain",
        textColor: "#000000",
        isActive: true,
      });
      setCategoryImageFile(null);
      setCategoryBackgroundImageFile(null);
      setRemoveExistingCategoryImage(false);
      setRemoveExistingCategoryBackground(false);
    } catch (error) {
      console.error("Failed to update category:", error);
      alert("Failed to update category. Please try again.");
    } finally {
      setIsLoadingCategory(false);
    }
  };

  // Subcategory edit handlers
  const handleEditSubcategory = async () => {
    try {
      setIsLoadingSubcategory(true);

      if (!subcategoryForm.name.trim()) {
        alert("Subcategory name is required");
        return;
      }

      if (!subcategoryForm.categoryId) {
        alert("Please select a category");
        return;
      }

      const selectedCategory = categories.find(
        (cat) => cat.id === subcategoryForm.categoryId
      );
      if (selectedCategory) {
        subcategoryForm.categoryName = selectedCategory.name;
      }

      await SubcategoryService.updateSubcategory(
        editingSubcategory.id,
        subcategoryForm,
        subcategoryImageFile,
        subcategoryBackgroundImageFile,
        removeExistingSubcategoryImage,
        removeExistingSubcategoryBackground
      );
      await loadDashboardData();
      setEditingSubcategory(null);
      setSubcategoryForm({
        name: "",
        description: "",
        categoryId: "",
        categoryName: "",
        backgroundImage: "",
        backgroundFit: "contain",
        isActive: true,
      });
      setSubcategoryImageFile(null);
      setSubcategoryBackgroundImageFile(null);
      setRemoveExistingSubcategoryImage(false);
      setRemoveExistingSubcategoryBackground(false);
    } catch (error) {
      console.error("Failed to update subcategory:", error);
      alert("Failed to update subcategory. Please try again.");
    } finally {
      setIsLoadingSubcategory(false);
    }
  };

  // Cashback handlers
  const handleAddCashbackRule = () => {
    setCashbackForm({
      categoryId: "",
      categoryName: "",
      percentage: 0,
      isActive: true,
    });
    setShowAddCashback(true);
  };

  const handleSaveCashback = async (e) => {
    e.preventDefault();
    setIsCashbackSaving(true);

    try {
      if (!cashbackForm.categoryId || !cashbackForm.percentage) {
        alert("Please select a category and enter percentage");
        return;
      }

      // Check if category already exists (only for new rules, not editing)
      if (!editingCashback) {
        const existingRule = cashbackRules.find(
          (rule) => rule.categoryId === cashbackForm.categoryId
        );
        if (existingRule) {
          alert(
            "This category already has a cashback rule. Each category can only have one rule."
          );
          return;
        }
      }

      // Find category name from selected categoryId
      const selectedCategory = categories.find(
        (cat) => cat.id === cashbackForm.categoryId
      );
      const cashbackData = {
        ...cashbackForm,
        categoryName: selectedCategory?.name || "",
      };

      if (editingCashback?.id) {
        await CashbackService.updateCashbackRule(
          editingCashback.id,
          cashbackData
        );
      } else {
        await CashbackService.createCashbackRule(cashbackData);
      }

      setShowAddCashback(false);
      setEditingCashback(null);
      setCashbackForm({
        categoryId: "",
        categoryName: "",
        percentage: 0,
        isActive: true,
      });
      await loadDashboardData();
    } catch (error) {
      console.error("Error saving cashback rule:", error);
      alert("Error saving cashback rule. Please try again.");
    } finally {
      setIsCashbackSaving(false);
    }
  };

  const handleCancelCashback = () => {
    setShowAddCashback(false);
    setEditingCashback(null);
    setCashbackForm({
      categoryId: "",
      categoryName: "",
      percentage: 0,
      isActive: true,
    });
  };

  const handleDeleteCashback = async (ruleId) => {
    if (isDeletingCashback) return; // Prevent double submission

    if (confirm("Are you sure you want to delete this cashback rule?")) {
      try {
        setIsDeletingCashback(true);
        await CashbackService.deleteCashbackRule(ruleId);
        await loadDashboardData();
      } catch (error) {
        console.error("Error deleting cashback rule:", error);
        alert("Failed to delete cashback rule. Please try again.");
      } finally {
        setIsDeletingCashback(false);
      }
    }
  };

  const handleToggleCashbackStatus = async (rule) => {
    try {
      setIsTogglingCashbackStatus(rule.id);
      await CashbackService.updateCashbackRule(rule.id, {
        ...rule,
        isActive: !rule.isActive,
      });
      await loadDashboardData();
    } catch (error) {
      console.error("Error updating cashback rule:", error);
    } finally {
      setIsTogglingCashbackStatus(null);
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
                                    disabled={
                                      isTogglingCustomerStatus === customer.id
                                    }
                                    className={`${
                                      isTogglingCustomerStatus === customer.id
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-yellow-600 hover:text-yellow-900"
                                    }`}
                                  >
                                    {isTogglingCustomerStatus ===
                                    customer.id ? (
                                      <div className="flex items-center space-x-1">
                                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                        <span>Updating...</span>
                                      </div>
                                    ) : (
                                      <span>
                                        {customer.isActive
                                          ? "Deactivate"
                                          : "Activate"}
                                      </span>
                                    )}
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
                        Manage your product inventory and pricing
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

                  {/* Enhanced Product Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl shadow-lg border border-blue-200/60">
                      <div className="flex items-center">
                        <div className="p-3 bg-white rounded-lg shadow-md border border-blue-200">
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
                          <p className="text-sm font-medium text-blue-700">
                            Total Products
                          </p>
                          <p className="text-2xl font-bold text-blue-900">
                            {stats.totalProducts}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl shadow-lg border border-green-200/60">
                      <div className="flex items-center">
                        <div className="p-3 bg-white rounded-lg shadow-md border border-green-200">
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
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-700">
                            Categories
                          </p>
                          <p className="text-2xl font-bold text-green-900">
                            {stats.totalCategories}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-violet-100 p-6 rounded-xl shadow-lg border border-purple-200/60">
                      <div className="flex items-center">
                        <div className="p-3 bg-white rounded-lg shadow-md border border-purple-200">
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
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-purple-700">
                            Subcategories
                          </p>
                          <p className="text-2xl font-bold text-purple-900">
                            {stats.totalSubcategories}
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
                            products. Build a structured hierarchy for better
                            management.
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
                                    {category.description && (
                                      <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                                        {category.description}
                                      </p>
                                    )}
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
                                        setEditingCategory(category);
                                      }}
                                      className="p-2 rounded-lg transition-colors duration-200 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
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
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCategory(category.id);
                                      }}
                                      disabled={isDeletingCategory}
                                      className={`p-2 rounded-lg transition-colors duration-200 ${
                                        isDeletingCategory
                                          ? "text-gray-300 cursor-not-allowed"
                                          : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                      }`}
                                    >
                                      {isDeletingCategory ? (
                                        <svg
                                          className="w-5 h-5 animate-spin"
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
                                      ) : (
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
                                      )}
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
                                                    {subcategory.description && (
                                                      <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                                                        {
                                                          subcategory.description
                                                        }
                                                      </p>
                                                    )}
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
                                                        setEditingSubcategory(
                                                          subcategory
                                                        );
                                                      }}
                                                      className="p-1.5 rounded-lg transition-colors duration-200 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
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
                                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        />
                                                      </svg>
                                                    </button>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteSubcategory(
                                                          subcategory.id
                                                        );
                                                      }}
                                                      disabled={
                                                        isDeletingSubcategory
                                                      }
                                                      className={`p-1.5 rounded-lg transition-colors duration-200 ${
                                                        isDeletingSubcategory
                                                          ? "text-gray-300 cursor-not-allowed"
                                                          : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                      }`}
                                                    >
                                                      {isDeletingSubcategory ? (
                                                        <svg
                                                          className="w-4 h-4 animate-spin"
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
                                                      ) : (
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
                                                      )}
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
                                                                <div className="flex items-center space-x-3 p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50/30">
                                                                  <div className="flex items-center space-x-3">
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
                                                                    {product.description && (
                                                                      <p className="text-xs text-gray-600 mb-2 leading-relaxed truncate">
                                                                        {
                                                                          product.description
                                                                        }
                                                                      </p>
                                                                    )}
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
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Products Table */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
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
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                    {product.productId || product.id}
                                  </td>
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
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    <div className="max-w-xs">
                                      <div className="truncate">
                                        {product.description || "-"}
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
                                      onClick={() => {
                                        setEditingProduct(product);
                                        setProductForm({
                                          name: product.name || "",
                                          description:
                                            product.description || "",
                                          categoryId: product.categoryId || "",
                                          categoryName:
                                            product.categoryName || "",
                                          subcategoryId:
                                            product.subcategoryId || "",
                                          subcategoryName:
                                            product.subcategoryName || "",
                                          hasVariants:
                                            product.hasVariants || false,
                                          price: product.price || 0,
                                          variants: product.variants || [],
                                          sku: product.sku || "",
                                          barcode: product.barcode || "",
                                          supplier: product.supplier || "",
                                          mainImage: product.mainImage || "",
                                          images: product.images || [],
                                          isActive:
                                            product.isActive !== undefined
                                              ? product.isActive
                                              : true,
                                          isFeatured:
                                            product.isFeatured || false,
                                          tags: product.tags || [],
                                          notes: product.notes || "",
                                          backgroundImage:
                                            product.backgroundImage || "",
                                          backgroundFit:
                                            product.backgroundFit || "cover",
                                        });
                                      }}
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleToggleProductStatus(product)
                                      }
                                      disabled={isTogglingStatus === product.id}
                                      className={`${
                                        isTogglingStatus === product.id
                                          ? "text-gray-400 cursor-not-allowed"
                                          : "text-yellow-600 hover:text-yellow-900"
                                      }`}
                                    >
                                      {isTogglingStatus === product.id ? (
                                        <div className="flex items-center space-x-1">
                                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                          <span>Updating...</span>
                                        </div>
                                      ) : (
                                        <span>
                                          {product.isActive
                                            ? "Deactivate"
                                            : "Activate"}
                                        </span>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `Are you sure you want to delete "${product.name}"? This action cannot be undone.`
                                          )
                                        ) {
                                          handleDeleteProduct(product.id);
                                        }
                                      }}
                                      disabled={
                                        isDeletingProduct === product.id
                                      }
                                      className={`${
                                        isDeletingProduct === product.id
                                          ? "text-gray-400 cursor-not-allowed"
                                          : "text-red-600 hover:text-red-900"
                                      }`}
                                    >
                                      {isDeletingProduct === product.id ? (
                                        <div className="flex items-center space-x-1">
                                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                          <span>Deleting...</span>
                                        </div>
                                      ) : (
                                        "Delete"
                                      )}
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
                                  {(transaction.amount || 0).toLocaleString(
                                    "en-US",
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    }
                                  )}
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-base font-semibold text-blue-600">
                                  +{transaction.pointsEarned || 0}
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
                                    onClick={() => {
                                      setSelectedTransactionDetails(
                                        transaction
                                      );
                                      setShowTransactionDetails(true);
                                    }}
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
                    {categories.filter(
                      (cat) =>
                        !cashbackRules.find(
                          (rule) => rule.categoryId === cat.id
                        )
                    ).length > 0 ? (
                      <button
                        onClick={handleAddCashbackRule}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Cashback Rule
                      </button>
                    ) : (
                      <div className="text-gray-500 px-6 py-3">
                        All categories already have cashback rules
                      </div>
                    )}
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
                              Category
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Percentage
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
                                  {rule.categoryName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {rule.categoryId}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {rule.percentage}%
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
                                  onClick={() => {
                                    setEditingCashback(rule);
                                    setCashbackForm({
                                      categoryId: rule.categoryId,
                                      categoryName: rule.categoryName,
                                      percentage: rule.percentage,
                                      isActive: rule.isActive,
                                    });
                                    setShowAddCashback(true);
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleToggleCashbackStatus(rule)
                                  }
                                  disabled={
                                    isTogglingCashbackStatus === rule.id
                                  }
                                  className={`${
                                    isTogglingCashbackStatus === rule.id
                                      ? "text-gray-400 cursor-not-allowed"
                                      : "text-yellow-600 hover:text-yellow-900"
                                  }`}
                                >
                                  {isTogglingCashbackStatus === rule.id ? (
                                    <div className="flex items-center space-x-1">
                                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                      <span>Updating...</span>
                                    </div>
                                  ) : (
                                    <span>
                                      {rule.isActive
                                        ? "Deactivate"
                                        : "Activate"}
                                    </span>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteCashback(rule.id)}
                                  disabled={isDeletingCashback}
                                  className={`${
                                    isDeletingCashback
                                      ? "text-gray-400 cursor-not-allowed"
                                      : "text-red-600 hover:text-red-900"
                                  }`}
                                >
                                  {isDeletingCashback
                                    ? "Deleting..."
                                    : "Delete"}
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
                      {/* Store Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Store Name
                        </label>
                        <input
                          type="text"
                          defaultValue="Candy Kush Dispensary"
                          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-start">
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
          <div className="fixed inset-0 bg-gray-600/50 z-50 flex items-start justify-center overflow-y-auto">
            <div className="relative mt-10 mb-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
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
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-5xl max-h-[90vh] mt-10 mb-10 overflow-y-auto">
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
                          ✕
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

                {/* Category Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Description
                  </label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter category description"
                  />
                </div>

                {/* Background Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Image (Optional)
                  </label>
                  <div className="space-y-3">
                    {/* Background Image Preview */}
                    {categoryBackgroundImageFile && (
                      <div className="relative bg-gray-50 rounded-md border border-gray-300 p-2">
                        <img
                          src={URL.createObjectURL(categoryBackgroundImageFile)}
                          alt="Background preview"
                          className="w-full max-h-48 object-contain rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => setCategoryBackgroundImageFile(null)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Upload Button/Area */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setCategoryBackgroundImageFile(e.target.files[0])
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="category-background-image-upload"
                      />
                      <label
                        htmlFor="category-background-image-upload"
                        className={`block w-full px-4 py-8 border-2 border-dashed rounded-md text-center cursor-pointer transition-colors ${
                          categoryBackgroundImageFile
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
                          {categoryBackgroundImageFile
                            ? "Change Background Image"
                            : "Choose Background Image"}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Background Fit Option */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Image Fit
                  </label>
                  <select
                    value={newCategory.backgroundFit}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        backgroundFit: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="contain">Contain (fit entire image)</option>
                    <option value="cover">Cover (stretch to fill)</option>
                  </select>
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={newCategory.textColor}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          textColor: e.target.value,
                        })
                      }
                      className="h-10 w-16 p-1 border border-gray-300 rounded cursor-pointer bg-white"
                      title="Pick text color"
                    />
                    <input
                      type="text"
                      value={newCategory.textColor}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          textColor: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      placeholder="#000000"
                    />
                    <div
                      className="px-3 py-2 rounded text-sm border"
                      style={{
                        backgroundColor: newCategory.textColor,
                        color: "#fff",
                      }}
                    >
                      Aa
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This color will be used for category text in the kiosk.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowAddCategory(false);
                    setNewCategory({
                      name: "",
                      description: "",
                      backgroundImage: "",
                      backgroundFit: "contain",
                      textColor: "#000000",
                      textColor: "#000000",
                      isActive: true,
                    });
                    setCategoryImageFile(null);
                    setCategoryBackgroundImageFile(null);
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

        {/* Edit Category Modal */}
        {editingCategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-5xl max-h-5xl overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Category
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditCategory();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Description
                  </label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter category description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Image
                  </label>
                  <div className="space-y-3">
                    {/* Image Preview (new selection) */}
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
                          ✕
                        </button>
                      </div>
                    )}
                    {/* Existing image (when not replacing or removing) */}
                    {editingCategory.image &&
                      !categoryImageFile &&
                      !removeExistingCategoryImage && (
                        <div className="space-y-2">
                          <div className="relative bg-gray-50 rounded-md border border-gray-300 p-2">
                            <img
                              src={editingCategory.image}
                              alt="Current category image"
                              className="w-full max-h-48 object-contain rounded-md"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setRemoveExistingCategoryImage(true)}
                            className="text-sm text-red-600 hover:text-red-700 underline"
                          >
                            Remove existing image
                          </button>
                        </div>
                      )}
                    {removeExistingCategoryImage && !categoryImageFile && (
                      <div className="p-3 border border-yellow-300 bg-yellow-50 rounded">
                        <p className="text-sm text-yellow-700 mb-2">
                          ⚠️ Existing image will be removed when you save
                        </p>
                        <button
                          type="button"
                          onClick={() => setRemoveExistingCategoryImage(false)}
                          className="text-sm text-blue-600 hover:text-blue-700 underline"
                        >
                          Cancel removal
                        </button>
                      </div>
                    )}
                    {/* Upload Area */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setCategoryImageFile(e.target.files[0])
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="edit-category-image-upload"
                      />
                      <label
                        htmlFor="edit-category-image-upload"
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
                            : editingCategory.image
                            ? "Replace Current Image"
                            : "Choose Category Image"}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Background Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Image (Optional)
                  </label>
                  <div className="space-y-3">
                    {categoryBackgroundImageFile && (
                      <div className="relative bg-gray-50 rounded-md border border-gray-300 p-2">
                        <img
                          src={URL.createObjectURL(categoryBackgroundImageFile)}
                          alt="Background preview"
                          className="w-full max-h-48 object-contain rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => setCategoryBackgroundImageFile(null)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {editingCategory.backgroundImage &&
                      !categoryBackgroundImageFile &&
                      !removeExistingCategoryBackground && (
                        <div className="space-y-2">
                          <div className="relative bg-gray-50 rounded-md border border-gray-300 p-2">
                            <img
                              src={editingCategory.backgroundImage}
                              alt="Current background image"
                              className="w-full max-h-48 object-contain rounded-md"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setRemoveExistingCategoryBackground(true)
                            }
                            className="text-sm text-red-600 hover:text-red-700 underline"
                          >
                            Remove existing background
                          </button>
                        </div>
                      )}
                    {removeExistingCategoryBackground &&
                      !categoryBackgroundImageFile && (
                        <div className="p-3 border border-yellow-300 bg-yellow-50 rounded">
                          <p className="text-sm text-yellow-700 mb-2">
                            ⚠️ Existing background will be removed when you save
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setRemoveExistingCategoryBackground(false)
                            }
                            className="text-sm text-blue-600 hover:text-blue-700 underline"
                          >
                            Cancel removal
                          </button>
                        </div>
                      )}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setCategoryBackgroundImageFile(e.target.files[0])
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="edit-category-background-image-upload"
                      />
                      <label
                        htmlFor="edit-category-background-image-upload"
                        className={`block w-full px-4 py-8 border-2 border-dashed rounded-md text-center cursor-pointer transition-colors ${
                          categoryBackgroundImageFile
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
                          {categoryBackgroundImageFile
                            ? "Change Background Image"
                            : editingCategory.backgroundImage
                            ? "Replace Current Background"
                            : "Choose Background Image"}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {categoryBackgroundImageFile
                      ? "New background image selected"
                      : removeExistingCategoryBackground
                      ? "Background scheduled for removal"
                      : editingCategory.backgroundImage
                      ? "Current background will be replaced if you select a new one"
                      : "No background image uploaded"}
                  </p>
                </div>

                {/* Background Fit Option */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Image Fit
                  </label>
                  <select
                    value={categoryForm.backgroundFit}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        backgroundFit: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="contain">Contain (fit entire image)</option>
                    <option value="cover">Cover (stretch to fill)</option>
                  </select>
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={categoryForm.textColor}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          textColor: e.target.value,
                        })
                      }
                      className="h-10 w-16 p-1 border border-gray-300 rounded cursor-pointer bg-white"
                      title="Pick text color"
                    />
                    <input
                      type="text"
                      value={categoryForm.textColor}
                      onChange={(e) =>
                        setCategoryForm({
                          ...categoryForm,
                          textColor: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      placeholder="#000000"
                    />
                    <div
                      className="px-3 py-2 rounded text-sm border"
                      style={{
                        backgroundColor: categoryForm.textColor,
                        color: "#fff",
                      }}
                    >
                      Aa
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This color will be used for category text in the kiosk.
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="editCategoryActive"
                    checked={categoryForm.isActive}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        isActive: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="editCategoryActive"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Active
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({
                        name: "",
                        description: "",
                        backgroundImage: "",
                        backgroundFit: "contain",
                        textColor: "#000000",
                        isActive: true,
                      });
                      setCategoryImageFile(null);
                      setCategoryBackgroundImageFile(null);
                      setRemoveExistingCategoryImage(false);
                      setRemoveExistingCategoryBackground(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
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
                      {isLoadingCategory ? "Updating..." : "Update Category"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Subcategory Modal */}
        {showAddSubcategory && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-5xl max-h-[90vh] mt-10 mb-10 overflow-y-auto">
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

                {/* Subcategory Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newSubcategory.description}
                    onChange={(e) =>
                      setNewSubcategory({
                        ...newSubcategory,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Enter subcategory description"
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
                          ✕
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

                {/* Background Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Image (Optional)
                  </label>
                  <div className="space-y-3">
                    {/* Background Image Preview */}
                    {subcategoryBackgroundImageFile && (
                      <div className="relative bg-gray-50 rounded-md border border-gray-300 p-2">
                        <img
                          src={URL.createObjectURL(
                            subcategoryBackgroundImageFile
                          )}
                          alt="Background preview"
                          className="w-full max-h-48 object-contain rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setSubcategoryBackgroundImageFile(null)
                          }
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Upload Button/Area */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setSubcategoryBackgroundImageFile(e.target.files[0])
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        id="subcategory-background-image-upload"
                      />
                      <label
                        htmlFor="subcategory-background-image-upload"
                        className={`block w-full px-4 py-8 border-2 border-dashed rounded-md text-center cursor-pointer transition-colors ${
                          subcategoryBackgroundImageFile
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
                          {subcategoryBackgroundImageFile
                            ? "Change Background Image"
                            : "Choose Background Image"}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Background Fit Option */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Image Fit
                  </label>
                  <select
                    value={newSubcategory.backgroundFit}
                    onChange={(e) =>
                      setNewSubcategory({
                        ...newSubcategory,
                        backgroundFit: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="contain">Contain (fit entire image)</option>
                    <option value="cover">Cover (stretch to fill)</option>
                  </select>
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={newSubcategory.textColor}
                      onChange={(e) =>
                        setNewSubcategory({
                          ...newSubcategory,
                          textColor: e.target.value,
                        })
                      }
                      className="h-10 w-16 p-1 border border-gray-300 rounded cursor-pointer bg-white"
                      title="Pick text color"
                    />
                    <input
                      type="text"
                      value={newSubcategory.textColor}
                      onChange={(e) =>
                        setNewSubcategory({
                          ...newSubcategory,
                          textColor: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      placeholder="#000000"
                    />
                    <div
                      className="px-3 py-2 rounded text-sm border"
                      style={{
                        backgroundColor: newSubcategory.textColor,
                        color: "#fff",
                      }}
                    >
                      Aa
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This color will be used for subcategory text in the kiosk.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowAddSubcategory(false);
                    setNewSubcategory({
                      name: "",
                      description: "",
                      categoryId: "",
                      categoryName: "",
                      backgroundImage: "",
                      backgroundFit: "contain",
                      textColor: "#000000",
                      isActive: true,
                    });
                    setSubcategoryImageFile(null);
                    setSubcategoryBackgroundImageFile(null);
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
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
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

        {/* Edit Subcategory Modal */}
        {editingSubcategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-5xl max-h-5xl overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Subcategory
              </h3>

              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={subcategoryForm.categoryId}
                    onChange={(e) => {
                      const selectedCategory = categories.find(
                        (cat) => cat.id === e.target.value
                      );
                      setSubcategoryForm({
                        ...subcategoryForm,
                        categoryId: e.target.value,
                        categoryName: selectedCategory?.name || "",
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select a category</option>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Filters, Grinders, Papers"
                    required
                  />
                </div>

                {/* Subcategory Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                    placeholder="Enter subcategory description"
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
                          ✕
                        </button>
                      </div>
                    )}
                    {editingSubcategory.image &&
                      !subcategoryImageFile &&
                      !removeExistingSubcategoryImage && (
                        <div className="space-y-2">
                          <div className="relative bg-gray-50 rounded-md border border-gray-300 p-2">
                            <img
                              src={editingSubcategory.image}
                              alt="Current subcategory image"
                              className="w-full max-h-48 object-contain rounded-md"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setRemoveExistingSubcategoryImage(true)
                            }
                            className="text-sm text-red-600 hover:text-red-700 underline"
                          >
                            Remove existing image
                          </button>
                        </div>
                      )}
                    {removeExistingSubcategoryImage &&
                      !subcategoryImageFile && (
                        <div className="p-3 border border-yellow-300 bg-yellow-50 rounded">
                          <p className="text-sm text-yellow-700 mb-2">
                            ⚠️ Existing image will be removed when you save
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setRemoveExistingSubcategoryImage(false)
                            }
                            className="text-sm text-blue-600 hover:text-blue-700 underline"
                          >
                            Cancel removal
                          </button>
                        </div>
                      )}

                    {/* Upload Button */}
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setSubcategoryImageFile(e.target.files[0])
                        }
                        className="hidden"
                        id="edit-subcategory-image-upload"
                      />
                      <label
                        htmlFor="edit-subcategory-image-upload"
                        className="cursor-pointer flex flex-col items-center justify-center text-gray-500 hover:text-gray-700"
                      >
                        <svg
                          className="w-8 h-8 mb-2"
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
                            : editingSubcategory.image
                            ? "Replace Current Image"
                            : "Choose Subcategory Image"}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Background Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Image
                  </label>
                  <div className="space-y-3">
                    {editingSubcategory.backgroundImage &&
                      !subcategoryBackgroundImageFile &&
                      !removeExistingSubcategoryBackground && (
                        <div className="mb-2 space-y-2">
                          <div className="relative inline-block">
                            <img
                              src={editingSubcategory.backgroundImage}
                              alt="Current background image"
                              className="h-20 w-20 object-cover rounded border"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setRemoveExistingSubcategoryBackground(true)
                            }
                            className="text-sm text-red-600 hover:text-red-700 underline"
                          >
                            Remove existing background
                          </button>
                        </div>
                      )}
                    {removeExistingSubcategoryBackground &&
                      !subcategoryBackgroundImageFile && (
                        <div className="mb-2 p-3 border border-yellow-300 bg-yellow-50 rounded">
                          <p className="text-sm text-yellow-700 mb-2">
                            ⚠️ Existing background will be removed when you save
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              setRemoveExistingSubcategoryBackground(false)
                            }
                            className="text-sm text-blue-600 hover:text-blue-700 underline"
                          >
                            Cancel removal
                          </button>
                        </div>
                      )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setSubcategoryBackgroundImageFile(e.target.files[0])
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500">
                      {subcategoryBackgroundImageFile
                        ? "New background image selected"
                        : removeExistingSubcategoryBackground
                        ? "Background scheduled for removal"
                        : editingSubcategory.backgroundImage
                        ? "Current background will be replaced if you select a new one"
                        : "No background image uploaded"}
                    </p>
                  </div>
                </div>

                {/* Background Fit (aligned with Category modal) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Image Fit
                  </label>
                  <select
                    value={subcategoryForm.backgroundFit || "contain"}
                    onChange={(e) =>
                      setSubcategoryForm({
                        ...subcategoryForm,
                        backgroundFit: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="contain">Contain (fit entire image)</option>
                    <option value="cover">Cover (stretch to fill)</option>
                  </select>
                </div>

                {/* Text Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Text Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={subcategoryForm.textColor || "#000000"}
                      onChange={(e) =>
                        setSubcategoryForm({
                          ...subcategoryForm,
                          textColor: e.target.value,
                        })
                      }
                      className="h-10 w-16 p-1 border border-gray-300 rounded cursor-pointer bg-white"
                      title="Pick text color"
                    />
                    <input
                      type="text"
                      value={subcategoryForm.textColor || "#000000"}
                      onChange={(e) =>
                        setSubcategoryForm({
                          ...subcategoryForm,
                          textColor: e.target.value,
                        })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="#000000"
                    />
                    <div
                      className="px-3 py-2 rounded text-sm border"
                      style={{
                        backgroundColor: subcategoryForm.textColor || "#000000",
                        color: "#fff",
                      }}
                    >
                      Aa
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This color will be used for subcategory text in the kiosk.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setEditingSubcategory(null);
                    setSubcategoryForm({
                      name: "",
                      description: "",
                      categoryId: "",
                      categoryName: "",
                      backgroundImage: "",
                      backgroundFit: "contain",
                      textColor: "#000000",
                      isActive: true,
                    });
                    setSubcategoryImageFile(null);
                    setSubcategoryBackgroundImageFile(null);
                    setRemoveExistingSubcategoryImage(false);
                    setRemoveExistingSubcategoryBackground(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubcategory}
                  disabled={isLoadingSubcategory}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center space-x-2 ${
                    isLoadingSubcategory
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
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
                    {isLoadingSubcategory
                      ? "Updating..."
                      : "Update Subcategory"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Product Modal - Complex Form */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-gray-600/50 z-50 flex items-start justify-center overflow-y-auto">
            <div className="relative mt-20 mb-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
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

                  {/* Product Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Description
                    </label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter product description"
                      rows="3"
                    />
                  </div>

                  {/* Background Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setProductBackgroundImageFile(e.target.files[0])
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {productBackgroundImageFile && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(productBackgroundImageFile)}
                          alt="Background preview"
                          className="w-32 h-20 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => setProductBackgroundImageFile(null)}
                          className="mt-2 text-xs text-red-600 hover:underline"
                        >
                          Remove background image
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Background Fit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Fit
                    </label>
                    <select
                      value={newProduct.backgroundFit || "contain"}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          backgroundFit: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                    </select>
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Color
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={newProduct.textColor || "#000000"}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            textColor: e.target.value,
                          })
                        }
                        className="w-12 h-10 p-1 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={newProduct.textColor || "#000000"}
                        onChange={(e) => {
                          const val = e.target.value.startsWith("#")
                            ? e.target.value
                            : `#${e.target.value}`;
                          if (
                            /^#?[0-9A-Fa-f]{0,6}$/.test(
                              e.target.value.replace("#", "")
                            )
                          ) {
                            setNewProduct({ ...newProduct, textColor: val });
                          }
                        }}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                        placeholder="#000000"
                        maxLength={7}
                      />
                      <div
                        className="w-10 h-10 rounded border"
                        style={{
                          backgroundColor: newProduct.textColor || "#000000",
                        }}
                        title="Preview"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Choose the text color for this product.
                    </p>
                  </div>

                  {/* Product Image - Complex Upload Section */}
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

                  {/* Category and Subcategory - Complex Selection */}
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

                  {/* Product Type Toggle - Complex Radio Selection */}
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
                            Fixed price
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
                            Variable Product
                          </div>
                          <div className="text-sm text-gray-500">
                            Multiple variations
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

                  {/* Hierarchical Variants Section - Complete Implementation */}
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

                      {/* Add New Variant Group - Complex Form */}
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

                          {/* Add Option Form - Complete Implementation */}
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

                              {/* Add Option Button with Complex Logic */}
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

                        {/* Save Variant Group with Complex Logic */}
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

                {/* Complete Form Actions */}
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

        {/* Edit Product Modal - Complete Form */}
        {editingProduct && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Product
                  </h3>
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
                <form onSubmit={handleSaveProduct} className="space-y-4">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  {/* Product Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Description
                    </label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter product description"
                    />
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Color
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={productForm.textColor || "#000000"}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            textColor: e.target.value,
                          })
                        }
                        className="w-12 h-10 p-1 border border-gray-300 rounded"
                      />
                      <input
                        type="text"
                        value={productForm.textColor || "#000000"}
                        onChange={(e) => {
                          const val = e.target.value.startsWith("#")
                            ? e.target.value
                            : `#${e.target.value}`;
                          if (
                            /^#?[0-9A-Fa-f]{0,6}$/.test(
                              e.target.value.replace("#", "")
                            )
                          ) {
                            setProductForm({ ...productForm, textColor: val });
                          }
                        }}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                        placeholder="#000000"
                        maxLength={7}
                      />
                      <div
                        className="w-10 h-10 rounded border"
                        style={{
                          backgroundColor: productForm.textColor || "#000000",
                        }}
                        title="Preview"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Choose the text color for this product.
                    </p>
                  </div>

                  {/* Background Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setProductBackgroundImageFile(e.target.files[0])
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {productForm.backgroundImage && (
                      <div className="mt-2">
                        <img
                          src={productForm.backgroundImage}
                          alt="Current background"
                          className="w-32 h-20 object-cover rounded border"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Current background image
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Background Fit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Fit
                    </label>
                    <select
                      value={productForm.backgroundFit || "cover"}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          backgroundFit: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                      <option value="stretch">Stretch</option>
                    </select>
                  </div>

                  {/* Category and Subcategory */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={productForm.categoryId}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            categoryId: e.target.value,
                            subcategoryId: "", // Reset subcategory when category changes
                          })
                        }
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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

                  {/* Product Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Product Type *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="editProductType"
                          value="simple"
                          checked={productForm.hasVariants === false}
                          onChange={() =>
                            setProductForm({
                              ...productForm,
                              hasVariants: false,
                              variants: [],
                            })
                          }
                          className="mr-2"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            Simple Product
                          </div>
                          <div className="text-sm text-gray-500">
                            Fixed price
                          </div>
                        </div>
                      </label>
                      <label className="flex items-center p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="editProductType"
                          value="variable"
                          checked={productForm.hasVariants === true}
                          onChange={() =>
                            setProductForm({
                              ...productForm,
                              hasVariants: true,
                              price: 0, // Clear simple price when switching to variants
                            })
                          }
                          className="mr-2"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            Variable Product
                          </div>
                          <div className="text-sm text-gray-500">
                            Multiple options with different prices
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Simple Product Price */}
                  {!productForm.hasVariants && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (฿) *
                      </label>
                      <input
                        type="number"
                        value={productForm.price || ""}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  )}

                  {/* Product Main Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Main Image
                    </label>
                    <div className="space-y-3">
                      {/* Current Image or Preview */}
                      {(productImageFile || productForm.mainImage) && (
                        <div className="relative bg-gray-50 rounded-md border border-gray-300 p-2">
                          <img
                            src={
                              productImageFile
                                ? URL.createObjectURL(productImageFile)
                                : productForm.mainImage
                            }
                            alt="Product preview"
                            className="w-full max-h-48 object-contain rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setProductImageFile(null);
                              if (!productImageFile) {
                                setProductForm({
                                  ...productForm,
                                  mainImage: null,
                                });
                              }
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      {/* Upload Button/Area */}
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setProductImageFile(e.target.files[0])
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="editProductImageInput"
                        />
                        <label
                          htmlFor="editProductImageInput"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg
                              className="w-8 h-8 mb-2 text-gray-400"
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
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">
                                Click to upload
                              </span>{" "}
                              or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, JPEG up to 10MB
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Variable Product Variants */}
                  {productForm.hasVariants && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="text-md font-semibold text-gray-900">
                        Product Variants
                      </h4>
                      <p className="text-sm text-gray-600">
                        Configure the product variants step-by-step. The last
                        variant must have a price &gt; 0.
                      </p>

                      {/* Current Variant Groups */}
                      {productForm.variants &&
                        productForm.variants.length > 0 && (
                          <div className="mb-4 space-y-4">
                            {productForm.variants.map(
                              (variantGroup, groupIndex) => (
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
                                        const updatedVariants =
                                          productForm.variants.filter(
                                            (_, i) => i !== groupIndex
                                          );
                                        setProductForm({
                                          ...productForm,
                                          variants: updatedVariants,
                                        });
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
                                              {option.unit &&
                                                ` (${option.unit})`}
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedVariants = [
                                                ...productForm.variants,
                                              ];
                                              updatedVariants[
                                                groupIndex
                                              ].options = updatedVariants[
                                                groupIndex
                                              ].options.filter(
                                                (_, i) => i !== optionIndex
                                              );
                                              setProductForm({
                                                ...productForm,
                                                variants: updatedVariants,
                                              });
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
                              )
                            )}
                          </div>
                        )}

                      {/* Add New Variant Group */}
                      <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                        <h4 className="font-medium text-gray-700 mb-3">
                          Add New Variant Group (Step{" "}
                          {(productForm.variants?.length || 0) + 1})
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
                            id="edit-variant-group-name"
                          />
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
                                  id="edit-option-name-input"
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
                                  id="edit-option-price-input"
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
                                  id="edit-option-unit-input"
                                />
                              </div>
                            </div>

                            {/* Option Image Row */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Option Image (optional)
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                id="edit-option-image-input"
                              />
                            </div>

                            {/* Add Option Button */}
                            <button
                              type="button"
                              onClick={async () => {
                                const nameEl = document.getElementById(
                                  "edit-option-name-input"
                                );
                                const priceEl = document.getElementById(
                                  "edit-option-price-input"
                                );
                                const unitEl = document.getElementById(
                                  "edit-option-unit-input"
                                );
                                const imageEl = document.getElementById(
                                  "edit-option-image-input"
                                );

                                const optionName = nameEl.value.trim();
                                const optionPrice =
                                  parseFloat(priceEl.value) || 0;
                                const optionUnit = unitEl.value.trim();
                                const optionImageFile = imageEl.files[0];

                                if (!optionName) {
                                  alert("Please enter an option name");
                                  return;
                                }

                                let optionImageUrl = null;
                                if (optionImageFile) {
                                  optionImageUrl =
                                    URL.createObjectURL(optionImageFile);
                                }

                                const variantGroupName = document
                                  .getElementById("edit-variant-group-name")
                                  .value.trim();

                                if (!variantGroupName) {
                                  alert(
                                    "Please enter a variant group name first"
                                  );
                                  return;
                                }

                                const newOption = {
                                  name: optionName,
                                  price: optionPrice,
                                  unit: optionUnit,
                                  imageUrl: optionImageUrl,
                                  imageFile: optionImageFile,
                                };

                                const updatedVariants = [
                                  ...(productForm.variants || []),
                                ];

                                const existingGroupIndex =
                                  updatedVariants.findIndex(
                                    (group) =>
                                      group.variantName === variantGroupName
                                  );

                                if (existingGroupIndex >= 0) {
                                  updatedVariants[
                                    existingGroupIndex
                                  ].options.push(newOption);
                                } else {
                                  updatedVariants.push({
                                    variantName: variantGroupName,
                                    options: [newOption],
                                  });
                                }

                                setProductForm({
                                  ...productForm,
                                  variants: updatedVariants,
                                });

                                nameEl.value = "";
                                priceEl.value = "";
                                unitEl.value = "";
                                imageEl.value = "";
                              }}
                              className="px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              Add Option to Group
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      disabled={isProductSaving}
                      className={`px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md ${
                        isProductSaving
                          ? "bg-gray-100 cursor-not-allowed"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProductSaving}
                      className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md flex items-center ${
                        isProductSaving
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {isProductSaving && (
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
                      )}
                      {isProductSaving ? "Updating..." : "Update Product"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Cashback Rule Modal */}
        {showAddCashback && (
          <div className="fixed inset-0 bg-gray-600/50 z-50 flex items-start justify-center overflow-y-auto">
            <div className="relative mt-20 mb-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingCashback ? "Edit Cashback Rule" : "Add Cashback Rule"}
                </h3>
                <form onSubmit={handleSaveCashback} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      value={cashbackForm.categoryId}
                      onChange={(e) => {
                        const selectedCategory = categories.find(
                          (cat) => cat.id === e.target.value
                        );
                        setCashbackForm({
                          ...cashbackForm,
                          categoryId: e.target.value,
                          categoryName: selectedCategory?.name || "",
                        });
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      required
                      disabled={isCashbackSaving}
                    >
                      <option value="">Select Category</option>
                      {categories
                        .filter((category) => {
                          // If editing, allow current category
                          if (
                            editingCashback &&
                            editingCashback.categoryId === category.id
                          ) {
                            return true;
                          }
                          // For new rules, only show categories not already used
                          return !cashbackRules.find(
                            (rule) => rule.categoryId === category.id
                          );
                        })
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                    </select>
                    {!editingCashback &&
                      categories.filter(
                        (cat) =>
                          !cashbackRules.find(
                            (rule) => rule.categoryId === cat.id
                          )
                      ).length === 0 && (
                        <p className="mt-1 text-sm text-red-600">
                          All categories already have cashback rules.
                        </p>
                      )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Percentage (%)
                    </label>
                    <input
                      type="number"
                      value={cashbackForm.percentage}
                      onChange={(e) =>
                        setCashbackForm({
                          ...cashbackForm,
                          percentage: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      min="0"
                      max="100"
                      step="1"
                      required
                      disabled={isCashbackSaving}
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancelCashback}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300"
                      disabled={isCashbackSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 flex items-center"
                      disabled={isCashbackSaving}
                    >
                      {isCashbackSaving && (
                        <svg
                          className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                      )}
                      {isCashbackSaving
                        ? editingCashback
                          ? "Updating..."
                          : "Adding..."
                        : editingCashback
                        ? "Update Rule"
                        : "Add Rule"}
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
                        {selectedTransactionDetails.createdAt
                          ? new Date(
                              selectedTransactionDetails.createdAt
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Points Earned:</span>{" "}
                        {selectedTransactionDetails.pointsEarned || 0}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span>{" "}
                        {selectedTransactionDetails.customerCell || "N/A"}
                      </p>
                      <p className="text-lg">
                        <span className="font-medium">Total Amount:</span>
                        <span className="font-bold text-green-600 ml-2">
                          ฿
                          {selectedTransactionDetails.amount?.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || "0.00"}
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
