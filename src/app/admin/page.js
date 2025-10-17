"use client";
import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminAuthGuard from "../../components/AdminAuthGuard";
import ModelViewer from "../../components/ModelViewer";
import { CustomerService } from "../../lib/customerService";
import { TransactionService } from "../../lib/transactionService";
import { AdminService } from "../../lib/adminService";
import { AdminAuth } from "../../lib/adminAuth";
import {
  ProductService,
  CategoryService,
  SubcategoryService,
  CashbackService,
  NonMemberCategoriesService,
} from "../../lib/productService";
import { VisitService } from "../../lib/visitService";
import { StockService } from "../../lib/stockService";
import StockMovementService from "../../lib/stockMovementService";
import { countries } from "../../lib/countries";
import {
  Users,
  ShoppingBag,
  DollarSign,
  BarChart,
  Star,
  User,
  Package,
  Trash2,
  TrendingUp,
  ChevronRight,
  Plus,
  X,
  Clock,
} from "lucide-react";

export default function AdminPage() {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalTransactions: 0,
    totalProducts: 0,
    totalRevenue: 0,
    todayVisits: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [transactionSearchTerm, setTransactionSearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Transaction filter states
  const [transactionFilters, setTransactionFilters] = useState({
    dateFrom: "",
    dateTo: "",
    category: "",
    product: "",
    customer: "",
    paymentMethod: "",
    minAmount: "",
    maxAmount: "",
  });
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  // Inline edit state for variant options (editing existing product)
  const [editingVariantOption, setEditingVariantOption] = useState(null); // { groupIndex, optionIndex }
  const [editingVariantValues, setEditingVariantValues] = useState({
    name: "",
    price: "",
    memberPrice: "",
    unit: "",
    imageUrl: "",
  });
  const [editingCashback, setEditingCashback] = useState(null);
  // Category Order tab state
  const [orderList, setOrderList] = useState([]); // array of category ids
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingCategoryOrder, setSavingCategoryOrder] = useState(false);
  const [orderingCategories, setOrderingCategories] = useState(false);

  // Non-Member Categories state
  const [nonMemberCategories, setNonMemberCategories] = useState([]);
  const [savingNonMemberCategories, setSavingNonMemberCategories] =
    useState(false);

  // Helper function to upload a single variant option image
  const uploadSingleVariantImage = async (
    file,
    productId,
    variantId,
    optionId
  ) => {
    try {
      const imagePath = `products/${productId}/variants/${variantId}/${optionId}_${file.name}`;
      const imageUrl = await CategoryService.uploadImage(file, imagePath);
      console.log(`Uploaded variant option image: ${imagePath} -> ${imageUrl}`);
      return imageUrl;
    } catch (error) {
      console.error("Error uploading variant option image:", error);
      throw error;
    }
  };

  // Load Google Model Viewer script for 3D model preview
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js";
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // Initialize order list when categories loaded
  useEffect(() => {
    if (categories.length && !orderDirty && !orderList.length) {
      setOrderList(categories.map((c) => c.id));
    }
  }, [categories, orderDirty, orderList.length]);

  // DnD Sortable item
  function SortableCategoryItem({
    id,
    cat,
    index,
    totalItems,
    moveUp,
    moveDown,
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm hover:shadow-md transition ${
          isDragging ? "ring-2 ring-indigo-400 opacity-90" : ""
        }`}
      >
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing p-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition"
          title="Drag to reorder"
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
              strokeWidth="2"
              d="M10 6h.01M14 6h.01M10 12h.01M14 12h.01M10 18h.01M14 18h.01"
            />
          </svg>
        </button>
        {cat?.image && (
          <Image
            src={cat.image}
            alt={cat.name}
            width={48}
            height={48}
            className="w-12 h-12 object-cover rounded-lg border border-gray-200"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {cat?.name || id}
          </p>
          <p className="text-xs text-gray-400">{cat?.categoryId}</p>
        </div>
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
          {index + 1}
        </span>

        {/* Up/Down Arrow Buttons */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => moveUp(id)}
            disabled={index === 0}
            className={`p-1 rounded transition ${
              index === 0
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            title="Move up"
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
                strokeWidth="2"
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
          <button
            onClick={() => moveDown(id)}
            disabled={index === totalItems - 1}
            className={`p-1 rounded transition ${
              index === totalItems - 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            title="Move down"
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
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  function CategoryOrderList({
    categories,
    orderList,
    setOrderList,
    setOrderDirty,
    ordering,
  }) {
    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 4 },
      }),
      useSensor(TouchSensor, {
        activationConstraint: { delay: 250, tolerance: 8 },
      }),
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    );
    if (ordering)
      return <div className="text-sm text-gray-500">Loading categories...</div>;
    if (!orderList.length)
      return <div className="text-sm text-gray-500">No categories.</div>;
    const catMap = new Map(categories.map((c) => [c.id, c]));
    function handleDragEnd(event) {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      setOrderList((prev) => {
        const oldIndex = prev.indexOf(active.id);
        const newIndex = prev.indexOf(over.id);
        const reordered = arrayMove(prev, oldIndex, newIndex);
        setOrderDirty(true);
        return reordered;
      });
    }

    function moveItemUp(id) {
      setOrderList((prev) => {
        const currentIndex = prev.indexOf(id);
        if (currentIndex <= 0) return prev; // Already at top
        const newOrder = [...prev];
        [newOrder[currentIndex - 1], newOrder[currentIndex]] = [
          newOrder[currentIndex],
          newOrder[currentIndex - 1],
        ];
        setOrderDirty(true);
        return newOrder;
      });
    }

    function moveItemDown(id) {
      setOrderList((prev) => {
        const currentIndex = prev.indexOf(id);
        if (currentIndex >= prev.length - 1) return prev; // Already at bottom
        const newOrder = [...prev];
        [newOrder[currentIndex], newOrder[currentIndex + 1]] = [
          newOrder[currentIndex + 1],
          newOrder[currentIndex],
        ];
        setOrderDirty(true);
        return newOrder;
      });
    }
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderList}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {orderList.map((id, idx) => (
              <SortableCategoryItem
                key={id}
                id={id}
                cat={catMap.get(id)}
                index={idx}
                totalItems={orderList.length}
                moveUp={moveItemUp}
                moveDown={moveItemDown}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  // Add/Edit states
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);
  const [showAddCashback, setShowAddCashback] = useState(false);

  // Delete loading states
  const [deletingTransactionIndex, setDeletingTransactionIndex] =
    useState(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState(null);

  // Loading states
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [updatingCustomer, setUpdatingCustomer] = useState(false);

  // Point adjustment modal states
  const [showPointAdjustmentModal, setShowPointAdjustmentModal] =
    useState(false);
  const [pointAdjustmentType, setPointAdjustmentType] = useState("add"); // 'add' or 'reduce'
  const [pointAdjustmentAmount, setPointAdjustmentAmount] = useState("");
  const [pointAdjustmentReason, setPointAdjustmentReason] = useState("");
  const [isProcessingPointAdjustment, setIsProcessingPointAdjustment] =
    useState(false);

  // Transaction details modal states
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransactionDetails, setSelectedTransactionDetails] =
    useState(null);

  // Payment method editing states
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [updatingPaymentMethod, setUpdatingPaymentMethod] = useState(false);

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
  const [expandedVariants, setExpandedVariants] = useState(new Set());

  // Product form states for comprehensive management
  const [prefilledCategory, setPrefilledCategory] = useState(null);
  const [prefilledSubcategory, setPrefilledSubcategory] = useState(null);

  // Product status toggle loading state
  const [isTogglingStatus, setIsTogglingStatus] = useState(null);

  // Admin Management states
  const [admins, setAdmins] = useState([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    email: "",
    password: "",
    permissions: {
      edit: false,
      delete: false,
      input: false,
    },
  });
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [editingAdminPermissions, setEditingAdminPermissions] = useState({
    edit: false,
    delete: false,
    input: false,
  });
  const [updatingAdminPermissions, setUpdatingAdminPermissions] =
    useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changingPasswordAdminId, setChangingPasswordAdminId] = useState(null);
  const [changingPasswordAdminEmail, setChangingPasswordAdminEmail] =
    useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Settings states
  const [transactionPrefix, setTransactionPrefix] = useState("");
  const [storeName, setStoreName] = useState("");
  const [bathToUsdRate, setBathToUsdRate] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Old Stock Management states (keeping for compatibility with existing Add Stock In)
  const [showAddStockIn, setShowAddStockIn] = useState(false);
  const [stockInForm, setStockInForm] = useState({
    supplier: "",
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().split(" ")[0].substring(0, 5),
    products: [
      {
        productId: "",
        productName: "",
        variantId: "",
        variantName: "",
        productSearch: "",
        showProductDropdown: false,
        quantity: 0,
        buyPrice: 0,
      },
    ],
  });
  const [isStockSaving, setIsStockSaving] = useState(false);
  const [stockSearchTerm, setStockSearchTerm] = useState("");

  // Stock Alert Management states
  const [stockAlerts, setStockAlerts] = useState([]);
  const [showStockAlertModal, setShowStockAlertModal] = useState(false);

  // Purchase Details Modal states
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
  const [selectedProductForAlert, setSelectedProductForAlert] = useState(null);
  const [alertKioskLevel, setAlertKioskLevel] = useState("");
  const [alertAdminLevel, setAlertAdminLevel] = useState("");
  // Stock Alert searchable dropdown states
  const [alertProductSearch, setAlertProductSearch] = useState("");
  const [showAlertProductDropdown, setShowAlertProductDropdown] =
    useState(false);

  // Edit Alert states
  const [editingAlert, setEditingAlert] = useState(null);
  const [showEditAlertForm, setShowEditAlertForm] = useState(false);
  const [editAlertProductSearch, setEditAlertProductSearch] = useState("");
  const [showEditAlertProductDropdown, setShowEditAlertProductDropdown] =
    useState(false);

  // Crypto Payments states
  const [cryptoPayments, setCryptoPayments] = useState([]);
  const [loadingCryptoPayments, setLoadingCryptoPayments] = useState(false);
  const [selectedCryptoPayment, setSelectedCryptoPayment] = useState(null);
  const [showCryptoPaymentModal, setShowCryptoPaymentModal] = useState(false);
  const [cryptoPaymentStatusFilter, setCryptoPaymentStatusFilter] =
    useState("all");
  const [checkingCryptoStatus, setCheckingCryptoStatus] = useState(false);
  const [refreshingAllPayments, setRefreshingAllPayments] = useState(false);
  const [editSelectedProductForAlert, setEditSelectedProductForAlert] =
    useState(null);
  const [editAlertKioskLevel, setEditAlertKioskLevel] = useState("");
  const [editAlertAdminLevel, setEditAlertAdminLevel] = useState("");
  const [editStockZeroAction, setEditStockZeroAction] = useState("disable");

  // Non Member Payment Settings states
  const [nonMemberPaymentSettings, setNonMemberPaymentSettings] = useState({
    cash: true,
    card: true,
    crypto: true,
  });
  const [savingNonMemberPaymentSettings, setSavingNonMemberPaymentSettings] =
    useState(false);

  // Stock submenu state - updated to include purchasing
  const [stockActiveSubTab, setStockActiveSubTab] = useState("overview");
  const [stockZeroAction, setStockZeroAction] = useState("disable"); // "disable" or "keepVisible"

  // Stock Detail Modal states
  const [showStockDetailModal, setShowStockDetailModal] = useState(false);
  const [selectedStockDetail, setSelectedStockDetail] = useState(null);

  // Stock Movement data state
  const [stockMovements, setStockMovements] = useState([]);
  const [stockCalculations, setStockCalculations] = useState({});
  const [stockCalculationsLoaded, setStockCalculationsLoaded] = useState(false);
  const [stockPurchases, setStockPurchases] = useState([]);

  // Purchasing state (for the new purchasing submenu)
  const [showPurchasingForm, setShowPurchasingForm] = useState(false);
  const [isPurchasingSaving, setIsPurchasingSaving] = useState(false);
  const [purchasingProducts, setPurchasingProducts] = useState([
    {
      productId: "",
      productName: "",
      variantId: "",
      variantName: "",
      productSearch: "",
      quantity: 0,
      buyPrice: 0,
      showProductDropdown: false,
    },
  ]);
  const [purchasingSupplier, setPurchasingSupplier] = useState("");
  const [purchasingNotes, setPurchasingNotes] = useState("");
  const [purchasingDate, setPurchasingDate] = useState(
    new Date().toISOString().split("T")[0]
  ); // YYYY-MM-DD format
  const [purchasingTime, setPurchasingTime] = useState(
    new Date().toTimeString().slice(0, 5)
  ); // HH:MM format

  // Complex Product Form States
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([]);
  const [productUnit, setProductUnit] = useState("pcs");
  const [productImageFile, setProductImageFile] = useState(null);
  const [shouldRemoveMainImages, setShouldRemoveMainImages] = useState(false);
  const [optionImageFile, setOptionImageFile] = useState(null);
  const [editOptionImageFile, setEditOptionImageFile] = useState(null);
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
    dateOfBirth: "",
    customPoints: 0,
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
    memberPrice: 0,
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
    modelUrl: "",
    modelRotationX: 90,
    modelRotationY: 75,
    modelRotationZ: 2.5,
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
    memberId: "",
    isActive: true,
    dateOfBirth: "",
    customPoints: 0,
    allowedCategories: [], // Array of category IDs this customer can see
  });
  const [memberIdError, setMemberIdError] = useState("");

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    specialPage: "",
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
    memberPrice: 0,
    variants: [],
    sku: "",
    barcode: "",
    supplier: "",
    mainImage: "",
    images: [],
    backgroundImage: "",
    backgroundFit: "contain",
    textColor: "#000000",
    modelUrl: "",
    modelRotationX: 90,
    modelRotationY: 75,
    modelRotationZ: 2.5,
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
    specialPage: "",
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
  const [productModelFile, setProductModelFile] = useState(null);

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
    const allTransactions = [];

    customers.forEach((customer) => {
      if (customer.points && Array.isArray(customer.points)) {
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

          const transaction = {
            transactionId: transactionId,
            customerId: customer.customerId,
            customerName: customer.name,
            customerEmail: customer.email,
            customerCell: customer.cell,
            totalSpent: calculatedTotal,
            // Amount is already in baht
            amount: calculatedTotal,
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

    return allTransactions.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  };

  // Permission checking functions
  const checkEditPermission = () => {
    if (!AdminAuth.hasPermission("edit")) {
      alert(
        "You do not have permission to edit. Please contact your administrator."
      );
      return false;
    }
    return true;
  };

  const checkDeletePermission = () => {
    if (!AdminAuth.hasPermission("delete")) {
      alert(
        "You do not have permission to delete. Please contact your administrator."
      );
      return false;
    }
    return true;
  };

  const checkInputPermission = () => {
    if (!AdminAuth.hasPermission("input")) {
      alert(
        "You do not have permission to create new entries. Please contact your administrator."
      );
      return false;
    }
    return true;
  };

  // Helper function to load transactions from the Firebase transactions collection
  const loadTransactionsCollection = async () => {
    try {
      // Import Firestore functions
      const { collection, getDocs, orderBy, query } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../../lib/firebase");

      // Query the transactions collection directly
      const q = query(
        collection(db, "transactions"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      const transactions = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Handle Firestore timestamp conversion
        let createdAt = data.createdAt;
        if (data.createdAt && data.createdAt.toDate) {
          createdAt = data.createdAt.toDate();
        } else if (data.createdAt && data.createdAt.seconds) {
          createdAt = new Date(data.createdAt.seconds * 1000);
        }

        let updatedAt = data.updatedAt;
        if (data.updatedAt && data.updatedAt.toDate) {
          updatedAt = data.updatedAt.toDate();
        } else if (data.updatedAt && data.updatedAt.seconds) {
          updatedAt = new Date(data.updatedAt.seconds * 1000);
        }

        transactions.push({
          id: doc.id, // Firestore document ID
          ...data,
          createdAt: createdAt,
          updatedAt: updatedAt,
          sourceCollection: "transactions",
          // Ensure we have the key fields from your data structure
          transactionId: data.transactionId || doc.id,
          customerName: data.customerName || "Unknown Customer",
          total: data.total || 0,
          amount: data.total || data.amount || 0, // Use total as amount for consistency
          pointsEarned: data.pointsEarned || data.cashbackEarned || 0,
          items: data.items || [],
          paymentMethod: data.paymentMethod || "unknown",
          status: data.status || "completed",
        });
      });

      return transactions;
    } catch (error) {
      console.error("❌ Error loading transactions collection:", error);
      return [];
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      const customersData = await CustomerService.getAllCustomers();
      const productsData = await ProductService.getAllProducts();
      const productStats = await ProductService.getProductStats();
      const categoriesData = await CategoryService.getAllCategories();
      const subcategoriesData = await SubcategoryService.getAllSubcategories();
      const cashbackRulesData = await CashbackService.getAllCashbackRules();
      const adminsData = await AdminService.getAllAdmins();

      // Load transactions ONLY from the transactions collection
      const firebaseTransactions = await loadTransactionsCollection();

      setCustomers(customersData);
      setAdmins(adminsData);

      // Use ONLY Firebase transactions collection - no customer points extraction
      const allTransactions = [...firebaseTransactions];

      // Sort by date (newest first)
      allTransactions.sort((a, b) => {
        const dateA =
          a.createdAt instanceof Date
            ? a.createdAt
            : new Date(a.createdAt || 0);
        const dateB =
          b.createdAt instanceof Date
            ? b.createdAt
            : new Date(b.createdAt || 0);
        return dateB - dateA;
      });

      setTransactions(allTransactions);

      // Populate categoryName and subcategoryName in products
      const enrichedProducts = productsData.map((product) => {
        const category = categoriesData.find(
          (cat) => cat.id === product.categoryId
        );
        const subcategory = subcategoriesData.find(
          (sub) => sub.id === product.subcategoryId
        );

        return {
          ...product,
          categoryName: category?.name || "",
          subcategoryName: subcategory?.name || "",
        };
      });

      setProducts(enrichedProducts);
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
      setCashbackRules(cashbackRulesData);

      // Load non-member categories after categories are set
      if (categoriesData.length > 0) {
        try {
          const categoryIds =
            await NonMemberCategoriesService.getNonMemberCategories();
          if (categoryIds.length === 0) {
            // Initialize with all categories if empty
            const allCategoryIds = categoriesData.map((cat) => cat.id);
            await NonMemberCategoriesService.updateNonMemberCategories(
              allCategoryIds
            );
            setNonMemberCategories(allCategoryIds);
          } else {
            setNonMemberCategories(categoryIds);
          }
        } catch (error) {
          console.error("Error loading non-member categories:", error);
          // Default to all categories on error
          setNonMemberCategories(categoriesData.map((cat) => cat.id));
        }
      }

      // Calculate transaction stats from all transactions
      const totalRevenue = allTransactions.reduce((sum, t) => {
        // Use total, amount, or totalSpent (whichever is available)
        const transactionAmount = t.total || t.amount || t.totalSpent || 0;
        return sum + transactionAmount;
      }, 0);

      // Get today's visits from the new visit tracking system
      const todayVisits = await VisitService.getTodayVisits();

      setStats({
        totalCustomers: customersData.length,
        totalTransactions: allTransactions.length,
        totalProducts: productStats.totalProducts || 0,
        totalRevenue: totalRevenue,
        todayVisits: todayVisits,
      });

      // Load settings
      await loadSettings();
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

  // Load crypto payments when tab is active
  useEffect(() => {
    if (activeTab === "cryptoPayments") {
      loadCryptoPayments();
    }
  }, [activeTab, cryptoPaymentStatusFilter]);

  // Initialize productForm when editing a product
  useEffect(() => {
    if (editingProduct) {
      setVariants(editingProduct.variants || []);
      setHasVariants(editingProduct.hasVariants || false);
      setProductForm({
        name: editingProduct.name || "",
        description: editingProduct.description || "",
        categoryId: editingProduct.categoryId || "",
        subcategoryId: editingProduct.subcategoryId || "",
        price: editingProduct.price || 0,
        memberPrice: editingProduct.memberPrice || 0,
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
        modelUrl: editingProduct.modelUrl || "",
        modelRotationX: editingProduct.modelRotationX || 90,
        modelRotationY: editingProduct.modelRotationY || 75,
        modelRotationZ: editingProduct.modelRotationZ || 2.5,
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
        specialPage: editingCategory.specialPage || "",
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
    if (!checkInputPermission()) return;
    // Initialize with all categories allowed by default
    setCustomerForm({
      nationality: "",
      name: "",
      lastName: "",
      nickname: "",
      email: "",
      cell: "",
      memberId: "",
      isActive: true,
      dateOfBirth: "",
      customPoints: 0,
      allowedCategories: categories.map((cat) => cat.id), // All categories checked by default
    });
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
      memberId: "",
      isActive: true,
      dateOfBirth: "",
      customPoints: 0,
      allowedCategories: [],
    });
    setMemberIdError("");
  };

  // Check if member ID already exists
  const checkMemberIdExists = async (memberId, excludeCustomerId = null) => {
    try {
      if (!memberId.trim()) return false;

      const existingCustomer = await CustomerService.getCustomerByMemberId(
        memberId
      );

      // If editing, exclude the current customer from the check
      if (
        existingCustomer &&
        excludeCustomerId &&
        existingCustomer.id === excludeCustomerId
      ) {
        return false;
      }

      return !!existingCustomer;
    } catch (error) {
      console.error("Error checking member ID:", error);
      return false;
    }
  };

  // Handle member ID change with validation
  const handleMemberIdChange = async (event) => {
    const newMemberId = typeof event === "string" ? event : event.target.value;

    setCustomerForm({
      ...customerForm,
      memberId: newMemberId,
    });

    if (newMemberId.trim()) {
      const exists = await checkMemberIdExists(
        newMemberId,
        editingCustomer?.id
      );

      if (exists) {
        setMemberIdError(
          "This Member ID already exists. Please choose a different one."
        );
      } else {
        setMemberIdError("");
      }
    } else {
      setMemberIdError("");
    }
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();

    // Check permissions based on whether editing or creating
    if (editingCustomer) {
      if (!checkEditPermission()) return;
    } else {
      if (!checkInputPermission()) return;
    }

    // Prevent multiple submissions
    if (isCustomerSaving) {
      return;
    }

    // Check if there's a member ID error
    if (memberIdError) {
      alert("Please fix the Member ID error before saving.");
      return;
    }

    try {
      setIsCustomerSaving(true);

      // Validate required fields
      if (!customerForm.name.trim() || !customerForm.nationality.trim()) {
        alert("Please fill in all required fields (Name and Nationality)");
        return;
      }

      // If member ID is provided, check for duplicates one final time
      if (customerForm.memberId.trim()) {
        const exists = await checkMemberIdExists(
          customerForm.memberId,
          editingCustomer?.id
        );

        if (exists) {
          alert(
            "This Member ID already exists. Please choose a different one."
          );
          return;
        }
      }

      if (editingCustomer) {
        // Create customer data with memberId as customerId
        const customerData = {
          ...customerForm,
          customerId: customerForm.memberId || customerForm.customerId,
        };
        await CustomerService.updateCustomer(editingCustomer.id, customerData);
        setEditingCustomer(null);
        // Reset form after editing
        setCustomerForm({
          nationality: "",
          name: "",
          lastName: "",
          nickname: "",
          email: "",
          cell: "",
          memberId: "",
          isActive: true,
          dateOfBirth: "",
          customPoints: 0,
          allowedCategories: [],
        });
        setMemberIdError("");
      } else {
        // Create customer data with memberId as customerId
        const customerData = {
          ...customerForm,
          customerId: customerForm.memberId,
        };
        await CustomerService.createCustomer(customerData);
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
    if (!checkDeletePermission()) return;

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
    if (!checkEditPermission()) return;

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

  // Calculate potential points for a transaction (for transactions without point data)
  const calculatePotentialPoints = async (transaction) => {
    try {
      if (!transaction.items || transaction.items.length === 0) {
        return { totalPoints: 0, breakdown: [] };
      }

      let totalPoints = 0;
      const breakdown = [];

      for (const item of transaction.items) {
        if (item.categoryId) {
          try {
            const cashbackPercentage =
              await CashbackService.getCashbackPercentage(item.categoryId);
            const itemTotal = (item.price || 0) * (item.quantity || 1);
            const itemPoints = Math.floor(
              (itemTotal * cashbackPercentage) / 100
            );

            breakdown.push({
              productName: item.name,
              quantity: item.quantity || 1,
              price: item.price || 0,
              total: itemTotal,
              cashbackPercentage: cashbackPercentage,
              pointsEarned: itemPoints,
            });

            totalPoints += itemPoints;
          } catch (error) {
            console.error(
              `Error calculating cashback for category ${item.categoryId}:`,
              error
            );
            // If we can't get cashback percentage, assume 0
            breakdown.push({
              productName: item.name,
              quantity: item.quantity || 1,
              price: item.price || 0,
              total: (item.price || 0) * (item.quantity || 1),
              cashbackPercentage: 0,
              pointsEarned: 0,
            });
          }
        } else {
          // No category ID, so no points
          breakdown.push({
            productName: item.name,
            quantity: item.quantity || 1,
            price: item.price || 0,
            total: (item.price || 0) * (item.quantity || 1),
            cashbackPercentage: 0,
            pointsEarned: 0,
          });
        }
      }

      return { totalPoints, breakdown };
    } catch (error) {
      console.error("Error calculating potential points:", error);
      return { totalPoints: 0, breakdown: [] };
    }
  };

  // Point adjustment functions
  const openPointAdjustmentModal = (type) => {
    setPointAdjustmentType(type);
    setPointAdjustmentAmount("");
    setPointAdjustmentReason("");
    setShowPointAdjustmentModal(true);
  };

  const closePointAdjustmentModal = () => {
    setShowPointAdjustmentModal(false);
    setPointAdjustmentAmount("");
    setPointAdjustmentReason("");
  };

  const processPointAdjustment = async () => {
    if (!checkEditPermission()) return;

    if (!selectedCustomerForPoints) {
      alert("No customer selected");
      return;
    }

    const amount = parseInt(pointAdjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid positive number");
      return;
    }

    if (!pointAdjustmentReason.trim()) {
      alert("Please enter a reason for the point adjustment");
      return;
    }

    setIsProcessingPointAdjustment(true);

    try {
      // Generate transaction ID using TransactionService
      const transactionId = await TransactionService.generateTransactionId();

      const transactionDetails = {
        transactionId: transactionId,
        reason: `Manual ${
          pointAdjustmentType === "add" ? "Addition" : "Subtraction"
        }: ${pointAdjustmentReason}`,
        details: `${
          pointAdjustmentType === "add" ? "Added" : "Subtracted"
        } ${amount} points - ${pointAdjustmentReason}`,
        isManualAdjustment: true,
        adjustmentType: pointAdjustmentType,
        adjustmentReason: pointAdjustmentReason,
      };

      if (pointAdjustmentType === "add") {
        await CustomerService.addPoints(
          selectedCustomerForPoints.id,
          amount,
          transactionDetails
        );
      } else {
        await CustomerService.subtractPoints(
          selectedCustomerForPoints.id,
          amount,
          transactionDetails
        );
      }

      // Refresh customer data
      await loadDashboardData();

      // Update the selected customer data
      const updatedCustomer = await CustomerService.getCustomerById(
        selectedCustomerForPoints.id
      );
      setSelectedCustomerForPoints(updatedCustomer);

      alert(
        `Successfully ${
          pointAdjustmentType === "add" ? "added" : "subtracted"
        } ${amount} points`
      );
      closePointAdjustmentModal();
    } catch (error) {
      console.error("Error adjusting points:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessingPointAdjustment(false);
    }
  };

  // Helper function to calculate total spent from transactions
  const calculateTotalSpentFromTransactions = (customer) => {
    if (!customer.id) return 0;

    // Filter transactions that belong to this customer
    const customerTransactions = transactions.filter((transaction) => {
      // Match by customer ID (most reliable)
      if (transaction.customerId === customer.id) {
        return true;
      }

      // Fallback: Match by customer name (for older transactions)
      if (
        transaction.customerName &&
        transaction.customerName.trim() !== "" &&
        transaction.customerName !== "Guest"
      ) {
        const customerFullName = `${customer.name} ${
          customer.lastName || ""
        }`.trim();
        const transactionName = transaction.customerName.trim();

        return (
          transactionName === customerFullName ||
          transactionName === customer.name ||
          transactionName === `${customer.name} ${customer.lastName}`
        );
      }

      return false;
    });

    // Calculate total from transaction data
    const total = customerTransactions.reduce((sum, transaction) => {
      return sum + (transaction.total || 0);
    }, 0);

    return total;
  };

  // Delete transaction function with permission check
  const deleteTransaction = async (transactionId, transaction) => {
    // Check admin permissions
    if (!checkDeletePermission()) {
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete transaction ${transactionId}?\n\nThis action cannot be undone and will:\n- Remove the transaction from the customer's history\n- Remove earned points from the customer\n- Update the customer's total spent amount`
      )
    ) {
      return;
    }

    setDeletingTransactionId(transactionId);

    try {
      // Find the customer who owns this transaction
      const customer = customers.find(
        (c) =>
          c.name === transaction.customerName ||
          c.customerName === transaction.customerName ||
          c.customerId === transaction.customerId
      );

      if (!customer) {
        alert("Customer not found for this transaction.");
        return;
      }

      // Remove the transaction from customer's points array
      if (customer.points && Array.isArray(customer.points)) {
        const transactionIndex = customer.points.findIndex(
          (p) => p.transactionId === transactionId
        );

        if (transactionIndex !== -1) {
          const pointRecord = customer.points[transactionIndex];
          const pointsToSubtract = pointRecord.amount || 0;

          // Remove the transaction from the points array
          const updatedPoints = customer.points.filter(
            (p) => p.transactionId !== transactionId
          );

          // Update customer data
          const updatedCustomer = {
            ...customer,
            points: updatedPoints,
            totalEarned: Math.max(
              0,
              (customer.totalEarned || 0) - pointsToSubtract
            ),
            // Recalculate total points from remaining transactions
            points: (customer.points || 0) - pointsToSubtract,
          };

          // Update the customer in the database
          await CustomerService.updateCustomer(customer.id, updatedCustomer);

          // Also try to delete from TransactionService if it exists there
          try {
            await TransactionService.deleteTransaction(transactionId);
          } catch (transactionServiceError) {
            console.log(
              "Transaction not found in TransactionService (this is okay):",
              transactionServiceError
            );
          }

          // Reload dashboard data to reflect changes
          await loadDashboardData();

          alert("Transaction deleted successfully!");
        } else {
          alert("Transaction not found in customer's records.");
        }
      } else {
        alert("No transaction records found for this customer.");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert(`Error deleting transaction: ${error.message}`);
    } finally {
      setDeletingTransactionId(null);
    }
  };

  // Helper function to calculate total points from customer's points array
  const calculateTotalPoints = (customer) => {
    if (!customer.points || !Array.isArray(customer.points)) {
      return customer.currentPoints || 0;
    }

    return customer.points.reduce((total, point) => {
      if (point.type === "minus") {
        return total - (point.amount || 0);
      } else {
        return total + (point.amount || 0);
      }
    }, 0);
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

  const toggleVariantExpansion = (productId) => {
    setExpandedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Non-Member Categories handlers
  const handleSaveNonMemberCategories = async () => {
    if (!checkEditPermission()) return;

    try {
      setSavingNonMemberCategories(true);
      await NonMemberCategoriesService.updateNonMemberCategories(
        nonMemberCategories
      );
      alert("Non-member categories updated successfully!");
    } catch (error) {
      console.error("Error saving non-member categories:", error);
      alert("Error saving non-member categories. Please try again.");
    } finally {
      setSavingNonMemberCategories(false);
    }
  };

  const toggleNonMemberCategory = (categoryId) => {
    setNonMemberCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const selectAllNonMemberCategories = () => {
    setNonMemberCategories(categories.map((cat) => cat.id));
  };

  const clearAllNonMemberCategories = () => {
    setNonMemberCategories([]);
  };

  // Payment method update handlers
  const handleStartEditPaymentMethod = () => {
    const paymentMethod =
      selectedTransaction?.paymentMethod ||
      selectedTransactionDetails?.paymentMethod ||
      "";
    setNewPaymentMethod(paymentMethod);
    setEditingPaymentMethod(true);
  };

  const handleCancelEditPaymentMethod = () => {
    setEditingPaymentMethod(false);
    setNewPaymentMethod("");
  };

  const handleUpdatePaymentMethod = async () => {
    if (!checkEditPermission()) return;

    try {
      setUpdatingPaymentMethod(true);

      const transactionToUpdate =
        selectedTransaction || selectedTransactionDetails;
      if (!transactionToUpdate) return;

      // Update the transaction in the database
      await TransactionService.updateTransaction(transactionToUpdate.id, {
        paymentMethod: newPaymentMethod,
      });

      // Update the selected transaction in the UI
      if (selectedTransaction) {
        setSelectedTransaction((prev) => ({
          ...prev,
          paymentMethod: newPaymentMethod,
        }));
      }

      if (selectedTransactionDetails) {
        setSelectedTransactionDetails((prev) => ({
          ...prev,
          paymentMethod: newPaymentMethod,
        }));
      }

      // Also update in transactions list if it exists there
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionToUpdate.id
            ? { ...t, paymentMethod: newPaymentMethod }
            : t
        )
      );

      setEditingPaymentMethod(false);
      setNewPaymentMethod("");

      alert("Payment method updated successfully!");
    } catch (error) {
      console.error("Error updating payment method:", error);
      alert("Error updating payment method. Please try again.");
    } finally {
      setUpdatingPaymentMethod(false);
    }
  };

  // Product handlers
  const handleSaveProduct = async (e) => {
    e.preventDefault(); // Prevent form reload

    // Check permissions based on whether editing or creating
    if (editingProduct) {
      if (!checkEditPermission()) return;
    } else {
      if (!checkInputPermission()) return;
    }

    try {
      setIsProductSaving(true);

      // Validate required fields
      const productData = editingProduct ? productForm : newProduct;

      if (!productData.name?.trim()) {
        alert("Product name is required");
        setIsProductSaving(false);
        return;
      }

      if (!productData.categoryId) {
        alert("Please select a category");
        setIsProductSaving(false);
        return;
      }

      // Note: subcategoryId is optional and not validated

      // Helper function to upload variant option images
      const uploadVariantImages = async (variants, productId) => {
        const updatedVariants = [];

        for (const variant of variants) {
          const updatedOptions = [];

          for (const option of variant.options) {
            let imageUrl = option.imageUrl;

            // Check if imageUrl is a blob URL that needs to be uploaded
            if (imageUrl && imageUrl.startsWith("blob:")) {
              try {
                // Convert blob URL to File object
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const file = new File(
                  [blob],
                  `${option.name || "option"}_${option.id}.jpg`,
                  { type: "image/jpeg" }
                );

                // Upload to Firebase Storage
                const imagePath = `products/${productId}/variants/${variant.id}/${file.name}`;
                imageUrl = await CategoryService.uploadImage(file, imagePath);
                console.log(
                  `Uploaded variant image: ${imagePath} -> ${imageUrl}`
                );
              } catch (uploadError) {
                console.error("Error uploading variant image:", uploadError);
                // Keep the blob URL as fallback
              }
            }

            updatedOptions.push({
              ...option,
              imageUrl: imageUrl,
              image: null, // Remove File objects
            });
          }

          updatedVariants.push({
            ...variant,
            options: updatedOptions,
          });
        }

        return updatedVariants;
      };

      if (editingProduct) {
        // Handle editing existing product
        let processedVariants = [];

        if (productForm.hasVariants && variants.length > 0) {
          productForm.hasVariants = true;
          // Upload variant images before saving
          processedVariants = await uploadVariantImages(
            variants,
            editingProduct.productId
          );
          productForm.variants = processedVariants;
        } else {
          productForm.hasVariants = false;
          productForm.variants = [];
        }

        const cleanProductData = {
          name: productForm.name,
          description: productForm.description,
          categoryId: productForm.categoryId,
          categoryName: productForm.categoryName,
          subcategoryId: productForm.subcategoryId,
          subcategoryName: productForm.subcategoryName,
          hasVariants: productForm.hasVariants,
          price: productForm.price || 0,
          // Only include memberPrice for products without variants
          ...(productForm.hasVariants
            ? {}
            : { memberPrice: productForm.memberPrice || 0 }),
          variants: processedVariants,
          sku: productForm.sku,
          barcode: productForm.barcode,
          supplier: productForm.supplier,
          isActive: productForm.isActive,
          isFeatured: productForm.isFeatured,
          tags: productForm.tags || [],
          notes: productForm.notes,
          textColor: productForm.textColor,
          backgroundImage: productForm.backgroundImage,
          backgroundFit: productForm.backgroundFit,
        };

        // Debug: Check file state for edit mode
        console.log("🔍 EDIT MODE FILE DEBUG - State before saving:", {
          productImageFile: productImageFile,
          fileName: productImageFile?.name,
          fileSize: productImageFile?.size,
          fileType: productImageFile?.type,
          isValidFile: productImageFile instanceof File,
          hasImageFile: !!productImageFile,
          editingProductId: editingProduct.id,
        });

        // Prepare image files for update (same as create flow)
        const imageFiles = productImageFile ? [productImageFile] : [];

        console.log("🚀 EDIT MODE SAVE DEBUG - Updating product with data:", {
          productName: cleanProductData.name,
          productId: editingProduct.id,
          categoryId: cleanProductData.categoryId,
          subcategoryId: cleanProductData.subcategoryId,
          hasImageFile: !!productImageFile,
          imageFileName: productImageFile?.name,
          imageFilesCount: imageFiles.length,
        });

        console.log("🚀 EDIT MODE SAVE DEBUG - Image handling:", {
          hasNewImageFile: !!productImageFile,
          shouldRemoveImages: shouldRemoveMainImages,
          imageFilesCount: imageFiles.length,
        });

        await ProductService.updateProduct(
          editingProduct.id,
          cleanProductData,
          imageFiles, // New image files
          productBackgroundImageFile, // Background image
          shouldRemoveMainImages, // Flag to remove existing images
          productModelFile || null // 3D model file
        );

        console.log("✅ EDIT MODE SUCCESS - Product updated successfully:", {
          productId: editingProduct.id,
          productName: cleanProductData.name,
          hadImageFile: !!productImageFile,
          subcategoryId: cleanProductData.subcategoryId,
        });

        setEditingProduct(null);
        setProductImageFile(null); // Clear the image file state
        setShouldRemoveMainImages(false); // Reset removal flag
        setProductBackgroundImageFile(null);
        setProductModelFile(null); // Clear 3D model file state
        setProductForm({
          name: "",
          description: "",
          categoryId: "",
          categoryName: "",
          subcategoryId: "",
          subcategoryName: "",
          hasVariants: false,
          price: 0,
          memberPrice: 0,
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
        // Handle adding new product - generate temporary product ID for image uploads
        const tempProductId = `PRD-${Date.now()}`;
        let processedVariants = [];
        let productDataToSave = { ...newProduct };

        if (hasVariants && variants.length > 0) {
          productDataToSave.hasVariants = true;
          // Upload variant images before saving
          processedVariants = await uploadVariantImages(
            variants,
            tempProductId
          );
          productDataToSave.variants = processedVariants;
        } else {
          productDataToSave.hasVariants = false;
          productDataToSave.variants = [];
        }

        // Debug: Check file state right before saving
        console.log("🔍 FILE DEBUG - State before saving:", {
          productImageFile: productImageFile,
          fileName: productImageFile?.name,
          fileSize: productImageFile?.size,
          fileType: productImageFile?.type,
          isValidFile: productImageFile instanceof File,
          hasImageFile: !!productImageFile,
        });

        // Preserve the file reference to prevent it from being lost
        const imageFileToUpload = productImageFile;

        // Create a clean product data object without File objects
        const cleanProductData = {
          name: productDataToSave.name,
          description: productDataToSave.description,
          categoryId: productDataToSave.categoryId,
          categoryName: productDataToSave.categoryName,
          subcategoryId: productDataToSave.subcategoryId || null,
          subcategoryName: productDataToSave.subcategoryName || null,
          hasVariants: productDataToSave.hasVariants,
          price: productDataToSave.price || 0,
          // Only include memberPrice for products without variants
          ...(productDataToSave.hasVariants
            ? {}
            : { memberPrice: productDataToSave.memberPrice || 0 }),
          variants: processedVariants, // Use already processed variants
          sku: productDataToSave.sku || "",
          barcode: productDataToSave.barcode || "",
          supplier: productDataToSave.supplier || "",
          isActive: productDataToSave.isActive,
          isFeatured: productDataToSave.isFeatured,
          tags: productDataToSave.tags || [],
          notes: productDataToSave.notes || "",
          textColor: productDataToSave.textColor || "#000000",
          backgroundFit: productDataToSave.backgroundFit || "contain",
        };

        // Debug: Product data being sent to service
        console.log("🚀 PRODUCT SAVE DEBUG - Creating product with data:", {
          productName: cleanProductData.name,
          categoryId: cleanProductData.categoryId,
          subcategoryId: cleanProductData.subcategoryId,
          hasImageFile: !!imageFileToUpload,
          imageFileName: imageFileToUpload?.name,
          imageFileSize: imageFileToUpload?.size,
          imageFileType: imageFileToUpload?.type,
          cleanDataKeys: Object.keys(cleanProductData),
          isEditMode: !!editingProduct,
        });

        const imageFiles = imageFileToUpload ? [imageFileToUpload] : [];

        const result = await ProductService.createProduct(
          cleanProductData,
          imageFiles,
          productBackgroundImageFile || null,
          productModelFile || null
        );

        // Debug: Confirm product was saved successfully
        console.log("✅ PRODUCT SAVE SUCCESS - Product created:", {
          resultId: result?.id,
          productId: result?.productId,
          productName: cleanProductData.name,
          hadImageFile: !!imageFileToUpload,
          subcategoryId: cleanProductData.subcategoryId,
        });

        setNewProduct({
          name: "",
          description: "",
          categoryId: "",
          categoryName: "",
          subcategoryId: "",
          subcategoryName: "",
          hasVariants: false,
          price: 0,
          memberPrice: 0,
          variants: [],
          barcode: "",
          supplier: "",
          mainImage: "",
          images: [],
          textColor: "#000000",
          backgroundImage: "",
          backgroundFit: "contain",
          modelUrl: "",
          modelRotationX: 90,
          modelRotationY: 75,
          modelRotationZ: 2.5,
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
        setProductModelFile(null);
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
    if (!checkDeletePermission()) return;

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
    if (!checkEditPermission()) return;

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
    if (!checkInputPermission()) return;
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
        specialPage: "",
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
    if (!checkDeletePermission()) return;
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
    if (!checkInputPermission()) return;
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
    if (!checkDeletePermission()) return;
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
        specialPage: "",
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

    // Check permissions based on whether editing or creating
    if (editingCashback) {
      if (!checkEditPermission()) return;
    } else {
      if (!checkInputPermission()) return;
    }

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
    if (!checkDeletePermission()) return;
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
    if (!checkEditPermission()) return;

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

  // Admin Management Functions
  const handleAddAdmin = () => {
    if (!checkInputPermission()) return;
    setShowAddAdmin(true);
    setNewAdminData({
      email: "",
      password: "",
      permissions: {
        edit: false,
        delete: false,
        input: false,
      },
    });
  };

  const handleCancelAddAdmin = () => {
    setShowAddAdmin(false);
    setNewAdminData({
      email: "",
      password: "",
      permissions: {
        edit: false,
        delete: false,
        input: false,
      },
    });
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();

    if (!checkInputPermission()) return;

    if (!newAdminData.email || !newAdminData.password) {
      alert("Please fill in all required fields");
      return;
    }

    if (newAdminData.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    const hasAnyPermission = Object.values(newAdminData.permissions).some(
      (permission) => permission
    );
    if (!hasAnyPermission) {
      alert("Please select at least one permission");
      return;
    }

    try {
      setAddingAdmin(true);
      await AdminService.createAdmin({
        email: newAdminData.email,
        password: newAdminData.password,
        permissions: newAdminData.permissions,
      });

      setShowAddAdmin(false);
      setNewAdminData({
        email: "",
        password: "",
        permissions: {
          edit: false,
          delete: false,
          input: false,
        },
      });
      await loadDashboardData();
      alert("Admin created successfully!");
    } catch (error) {
      console.error("Error creating admin:", error);
      if (error.code === "auth/email-already-in-use") {
        alert("Email is already in use. Please use a different email.");
      } else {
        alert("Error creating admin. Please try again.");
      }
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleEditAdminPermissions = (admin) => {
    if (!checkEditPermission()) return;
    setEditingAdminId(admin.id);
    setEditingAdminPermissions({ ...admin.permissions });
  };

  const handleCancelEditAdmin = () => {
    setEditingAdminId(null);
    setEditingAdminPermissions({
      edit: false,
      delete: false,
      input: false,
    });
  };

  const handleUpdateAdminPermissions = async () => {
    if (!checkEditPermission()) return;

    try {
      setUpdatingAdminPermissions(true);
      await AdminService.updateAdminPermissions(
        editingAdminId,
        editingAdminPermissions
      );

      setEditingAdminId(null);
      setEditingAdminPermissions({
        edit: false,
        delete: false,
        input: false,
      });
      await loadDashboardData();
      alert("Admin permissions updated successfully!");
    } catch (error) {
      console.error("Error updating admin permissions:", error);
      alert("Error updating admin permissions. Please try again.");
    } finally {
      setUpdatingAdminPermissions(false);
    }
  };

  const handleToggleAdminStatus = async (admin) => {
    if (
      confirm(
        `Are you sure you want to ${
          admin.isActive ? "deactivate" : "activate"
        } this admin?`
      )
    ) {
      try {
        await AdminService.updateAdminStatus(admin.id, !admin.isActive);
        await loadDashboardData();
      } catch (error) {
        console.error("Error updating admin status:", error);
        alert("Error updating admin status. Please try again.");
      }
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (!checkDeletePermission()) return;

    if (
      confirm(
        `Are you sure you want to permanently delete admin "${admin.email}"?\n\nThis action cannot be undone.`
      )
    ) {
      try {
        await AdminService.deleteAdmin(admin.id);
        await loadDashboardData();
        alert("Admin deleted successfully!");
      } catch (error) {
        console.error("Error deleting admin:", error);
        alert("Error deleting admin. Please try again.");
      }
    }
  };

  const handleChangeAdminPassword = (admin) => {
    setChangingPasswordAdminId(admin.id);
    setChangingPasswordAdminEmail(admin.email);
    setShowChangePasswordModal(true);
  };

  const handleCancelChangePassword = () => {
    setShowChangePasswordModal(false);
    setChangingPasswordAdminId(null);
    setChangingPasswordAdminEmail("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSaveNewPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      alert("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setChangingPassword(true);
      await AdminService.changeAdminPassword(
        changingPasswordAdminId,
        newPassword
      );

      setShowChangePasswordModal(false);
      setChangingPasswordAdminId(null);
      setChangingPasswordAdminEmail("");
      setNewPassword("");
      setConfirmPassword("");

      alert("Admin password updated successfully!");
    } catch (error) {
      console.error("Error changing admin password:", error);
      alert("Error changing admin password. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  // Settings Functions
  const loadSettings = async () => {
    try {
      setLoadingSettings(true);
      // Load settings from Firestore
      const { db } = await import("../../lib/firebase");
      const { doc, getDoc } = await import("firebase/firestore");

      const settingsDoc = await getDoc(doc(db, "settings", "general"));
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data();
        setTransactionPrefix(settings.transactionPrefix || "TRX");
        setStoreName(settings.storeName || "Candy Kush Dispensary");
        setBathToUsdRate(settings.bathToUsdRate || "0.029");

        // Load non-member payment settings
        setNonMemberPaymentSettings({
          cash:
            settings.nonMemberPaymentCash !== undefined
              ? settings.nonMemberPaymentCash
              : true,
          card:
            settings.nonMemberPaymentCard !== undefined
              ? settings.nonMemberPaymentCard
              : true,
          crypto:
            settings.nonMemberPaymentCrypto !== undefined
              ? settings.nonMemberPaymentCrypto
              : true,
        });
      } else {
        setTransactionPrefix("TRX");
        setStoreName("Candy Kush Dispensary");
        setBathToUsdRate("0.029");

        // Default non-member payment settings
        setNonMemberPaymentSettings({
          cash: true,
          card: true,
          crypto: true,
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      // Set defaults on error
      setTransactionPrefix("TRX");
      setStoreName("Candy Kush Dispensary");
      setBathToUsdRate("0.029");
      setNonMemberPaymentSettings({
        cash: true,
        card: true,
        crypto: true,
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);

      // Save settings to Firestore
      const { db } = await import("../../lib/firebase");
      const { doc, setDoc } = await import("firebase/firestore");

      const settingsData = {
        transactionPrefix,
        storeName,
        bathToUsdRate: parseFloat(bathToUsdRate) || 0.029,
        nonMemberPaymentCash: nonMemberPaymentSettings.cash,
        nonMemberPaymentCard: nonMemberPaymentSettings.card,
        nonMemberPaymentCrypto: nonMemberPaymentSettings.crypto,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "settings", "general"), settingsData);

      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings: " + error.message);
    } finally {
      setSavingSettings(false);
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
    // Validate that points is an array and pointIndex is valid
    if (
      !Array.isArray(customer.points) ||
      pointIndex < 0 ||
      pointIndex >= customer.points.length
    ) {
      console.error("Invalid points data or index");
      return;
    }

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
      const updatedPoints = Array.isArray(customer.points)
        ? [...customer.points]
        : [];
      updatedPoints.splice(pointIndex, 1);

      console.log(
        "Original points:",
        Array.isArray(customer.points) ? customer.points.length : 0,
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

  // Stock Management handlers

  const handleAddStockIn = () => {
    if (!checkInputPermission()) return;
    setStockInForm({
      supplier: "",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0].substring(0, 5),
      products: [
        {
          productId: "",
          productName: "",
          variantId: "",
          variantName: "",
          productSearch: "",
          showProductDropdown: false,
          quantity: 0,
          buyPrice: 0,
        },
      ],
    });
    setShowAddStockIn(true);
  };

  const handleCancelStockIn = () => {
    setShowAddStockIn(false);
    setStockInForm({
      supplier: "",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0].substring(0, 5),
      products: [
        {
          productId: "",
          productName: "",
          variantId: "",
          variantName: "",
          productSearch: "",
          showProductDropdown: false,
          quantity: 0,
          buyPrice: 0,
        },
      ],
    });
  };

  const handleSaveStockIn = async (e) => {
    e.preventDefault();

    if (!checkInputPermission()) return;

    if (isStockSaving) return;

    try {
      setIsStockSaving(true);

      // Validate required fields
      if (!stockInForm.supplier.trim()) {
        alert("Please enter supplier name");
        return;
      }

      if (!stockInForm.date || !stockInForm.time) {
        alert("Please enter date and time");
        return;
      }

      // Validate products
      for (const product of stockInForm.products) {
        if (!product.productId || !product.productName) {
          alert("Please select all products");
          return;
        }

        // Check if product has variants and validate variant selection
        const selectedProduct = products.find(
          (p) => p.id === product.productId
        );
        if (
          selectedProduct?.hasVariants &&
          selectedProduct?.variants?.length > 0
        ) {
          if (!product.variantId) {
            alert(`Please select a variant for ${product.productName}`);
            return;
          }
        }

        if (product.quantity <= 0) {
          alert("Please enter valid quantities");
          return;
        }
        if (product.buyPrice < 0) {
          alert("Please enter valid buy prices");
          return;
        }
      }

      // Save stock in
      await StockService.addStockIn(stockInForm);

      // Reload stock movements and products data
      await loadStockMovementsData();
      await loadAllStockCalculations(); // Recalculate stock after stock in
      await loadDashboardData(); // This will refresh the products with updated stock quantities

      alert("Stock in added successfully!");
      setShowAddStockIn(false);
    } catch (error) {
      console.error("Error saving stock in:", error);
      alert("Error saving stock in. Please try again.");
    } finally {
      setIsStockSaving(false);
    }
  };

  const addProductToStockIn = () => {
    setStockInForm({
      ...stockInForm,
      products: [
        ...stockInForm.products,
        {
          productId: "",
          productName: "",
          variantId: "",
          variantName: "",
          productSearch: "",
          showProductDropdown: false,
          quantity: 0,
          buyPrice: 0,
        },
      ],
    });
  };

  const removeProductFromStockIn = (index) => {
    const newProducts = stockInForm.products.filter((_, i) => i !== index);
    setStockInForm({
      ...stockInForm,
      products:
        newProducts.length > 0
          ? newProducts
          : [
              {
                productId: "",
                productName: "",
                variantId: "",
                variantName: "",
                productSearch: "",
                showProductDropdown: false,
                quantity: 0,
                buyPrice: 0,
              },
            ],
    });
  };

  const updateStockInProduct = (index, field, value) => {
    console.log("updateStockInProduct called:", { index, field, value });
    const newProducts = [...stockInForm.products];
    newProducts[index] = { ...newProducts[index], [field]: value };

    console.log("Updated product at index", index, ":", newProducts[index]);

    // If productId is selected, auto-fill productName and clear variant selection
    if (field === "productId" && value) {
      const selectedProduct = products.find((p) => p.id === value);
      if (selectedProduct) {
        newProducts[index].productName = selectedProduct.name;
        // Clear variant selection when product changes
        newProducts[index].variantId = "";
        newProducts[index].variantName = "";
      }
    }

    // If variantId is selected, auto-fill variantName
    if (field === "variantId" && value) {
      const selectedProduct = products.find(
        (p) => p.id === newProducts[index].productId
      );
      if (selectedProduct && selectedProduct.variants) {
        // Handle Firebase variant structure with options
        let variantDisplay = "";

        // Check if it's the new format with variant-option combination
        if (value.includes("-")) {
          const [variantId, optionId] = value.split("-");
          const selectedVariant = selectedProduct.variants.find(
            (v) => v.id === variantId
          );
          if (selectedVariant && selectedVariant.options) {
            const selectedOption = selectedVariant.options.find(
              (o) => o.id === optionId
            );
            if (selectedOption) {
              variantDisplay = `${selectedVariant.variantName}: ${selectedOption.name}`;
            }
          }
        } else {
          // Fallback for old variant structure
          const selectedVariant = selectedProduct.variants.find(
            (v) => v.id === value
          );
          if (selectedVariant) {
            variantDisplay =
              selectedProduct.variantGroups
                ?.map((group) => {
                  const selection = selectedVariant.selections?.find(
                    (s) => s.groupId === group.id
                  );
                  return selection
                    ? `${group.variantName}: ${selection.name}`
                    : "";
                })
                .filter(Boolean)
                .join(" | ") ||
              selectedVariant.name ||
              `Variant ${selectedVariant.id}`;
          }
        }

        newProducts[index].variantName = variantDisplay;
      }
    }

    setStockInForm({
      ...stockInForm,
      products: newProducts,
    });
  };

  // New function to update multiple fields at once
  const updateStockInProductMultiple = (index, updates) => {
    console.log("updateStockInProductMultiple called:", { index, updates });
    const newProducts = [...stockInForm.products];

    // Apply all updates at once
    Object.keys(updates).forEach((field) => {
      newProducts[index][field] = updates[field];
    });

    console.log("Updated product at index", index, ":", newProducts[index]);

    setStockInForm({
      ...stockInForm,
      products: newProducts,
    });
  };

  // Load stock movements when tab is accessed
  useEffect(() => {
    if (activeTab === "stockManagement") {
      setStockCalculationsLoaded(false); // Reset loading state
      loadStockMovementsData(); // Use the new service for consistency
      loadStockAlerts();
      loadAllStockCalculations(); // Load proper stock calculations
    }
  }, [activeTab]);

  // Purchasing Management Functions (New StockMovement-based system)
  const loadStockMovementsData = async () => {
    try {
      // Load stock movements
      const movements = await StockMovementService.getAllStockMovements();
      setStockMovements(movements);

      // Load stock purchases
      const purchases = await StockMovementService.getAllStockPurchasing();
      setStockPurchases(purchases);

      // Calculate current stock summary for all products
      const stockSummary = await StockMovementService.getStockSummary();
      setStockCalculations(stockSummary);
    } catch (error) {
      console.error("Error loading stock movements data:", error);
    }
  };

  const handleAddPurchasing = () => {
    if (!checkInputPermission()) return;
    setShowPurchasingForm(true);
    setPurchasingProducts([
      {
        productId: "",
        productName: "",
        variantId: "",
        variantName: "",
        productSearch: "",
        quantity: 0,
        buyPrice: 0,
        showProductDropdown: false,
      },
    ]);
    setPurchasingSupplier("");
    setPurchasingNotes("");
    setPurchasingDate(new Date().toISOString().split("T")[0]);
    setPurchasingTime(new Date().toTimeString().slice(0, 5));
  };

  const handleCancelPurchasing = () => {
    setShowPurchasingForm(false);
    setPurchasingProducts([
      {
        productId: "",
        productName: "",
        variantId: "",
        variantName: "",
        productSearch: "",
        quantity: 0,
        buyPrice: 0,
        showProductDropdown: false,
      },
    ]);
    setPurchasingSupplier("");
    setPurchasingNotes("");
    setPurchasingDate(new Date().toISOString().split("T")[0]);
    setPurchasingTime(new Date().toTimeString().slice(0, 5));
  };

  const handleSavePurchasing = async (e) => {
    e.preventDefault();

    if (!checkInputPermission()) return;

    // Prevent double submission
    if (isPurchasingSaving) return;

    try {
      setIsPurchasingSaving(true);

      // Validate that all products have required fields
      const validProducts = purchasingProducts.filter(
        (p) => p.productId && p.quantity > 0 && p.buyPrice > 0
      );

      if (validProducts.length === 0) {
        alert("Please add at least one valid product with quantity and price.");
        return;
      }

      if (!purchasingSupplier.trim()) {
        alert("Please enter a supplier name.");
        return;
      }

      // Create purchasing data
      const purchasingData = {
        items: validProducts,
        supplier: purchasingSupplier,
        notes: purchasingNotes,
        date: purchasingDate,
        time: purchasingTime,
        createdBy: "admin",
      };

      // Add to StockPurchasing and StockMovement databases
      const result = await StockMovementService.addPurchasing(purchasingData);

      // Reload data
      await loadStockMovementsData();
      await loadAllStockCalculations(); // Recalculate stock after purchase
      await loadDashboardData(); // Refresh products if needed

      // Reset form
      handleCancelPurchasing();

      alert(
        `✅ Purchase Order created successfully!\n\nPO ID: ${
          result.purchaseOrderId
        }\nTotal Items: ${
          result.totalItems
        }\nTotal Amount: ฿${result.totalAmount.toFixed(2)}`
      );
    } catch (error) {
      console.error("Error saving purchasing:", error);
      alert("❌ Failed to save purchasing. Please try again.");
    } finally {
      setIsPurchasingSaving(false);
    }
  };

  const addProductToPurchasing = () => {
    setPurchasingProducts([
      ...purchasingProducts,
      {
        productId: "",
        productName: "",
        variantId: "",
        variantName: "",
        productSearch: "",
        quantity: 0,
        buyPrice: 0,
        showProductDropdown: false,
      },
    ]);
  };

  const removeProductFromPurchasing = (index) => {
    const newProducts = purchasingProducts.filter((_, i) => i !== index);
    setPurchasingProducts(
      newProducts.length > 0
        ? newProducts
        : [
            {
              productId: "",
              productName: "",
              variantId: "",
              variantName: "",
              productSearch: "",
              quantity: 0,
              buyPrice: 0,
              showProductDropdown: false,
            },
          ]
    );
  };

  const updatePurchasingProduct = (index, field, value) => {
    const newProducts = [...purchasingProducts];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setPurchasingProducts(newProducts);
  };

  const updatePurchasingProductMultiple = (index, updates) => {
    console.log("updatePurchasingProductMultiple called:", { index, updates });
    const newProducts = [...purchasingProducts];
    newProducts[index] = { ...newProducts[index], ...updates };
    console.log("Purchasing products after update:", newProducts);
    setPurchasingProducts(newProducts);
  };

  // Load stock movements data when stockActiveSubTab changes
  useEffect(() => {
    if (
      stockActiveSubTab === "overview" ||
      stockActiveSubTab === "movements" ||
      stockActiveSubTab === "purchasing"
    ) {
      loadStockMovementsData();
    }
  }, [stockActiveSubTab]);

  // Stock Alert Management Functions
  const loadStockAlerts = async () => {
    try {
      const { collection, getDocs, query, orderBy } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../../lib/firebase");

      const alertsRef = collection(db, "StockAlert");
      const q = query(alertsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const alerts = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() || {};
        alerts.push({
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt && data.createdAt.toDate
              ? data.createdAt.toDate()
              : data.createdAt || null,
          updatedAt:
            data.updatedAt && data.updatedAt.toDate
              ? data.updatedAt.toDate()
              : data.updatedAt || null,
        });
      });

      setStockAlerts(alerts);
    } catch (error) {
      console.error("Error loading stock alerts:", error);
    }
  };

  const createStockAlert = async () => {
    try {
      if (!selectedProductForAlert || !alertKioskLevel || !alertAdminLevel) {
        alert("Please select a product and set both alert levels");
        return;
      }

      const { collection, addDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../../lib/firebase");

      const alertData = {
        productId: selectedProductForAlert.id,
        productName: selectedProductForAlert.name,
        variantId: selectedProductForAlert.variantId || "",
        variantName: selectedProductForAlert.variantName || "",
        alertKioskLevel: parseInt(alertKioskLevel),
        alertAdminLevel: parseInt(alertAdminLevel),
        stockZeroAction: stockZeroAction, // "disable" or "keepVisible"
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "StockAlert"), alertData);

      // Refresh data
      await loadStockAlerts();

      // Reset form
      setSelectedProductForAlert(null);
      setAlertKioskLevel("");
      setAlertAdminLevel("");
      setStockZeroAction("disable");
      setAlertProductSearch("");
      setShowAlertProductDropdown(false);

      alert("Stock alert created successfully!");
    } catch (error) {
      console.error("Error creating stock alert:", error);
      alert("Failed to create stock alert: " + error.message);
    }
  };

  const deleteStockAlert = async (alertId) => {
    try {
      if (!confirm("Are you sure you want to delete this stock alert?")) {
        return;
      }

      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("../../lib/firebase");

      await deleteDoc(doc(db, "StockAlert", alertId));
      await loadStockAlerts();
      alert("Stock alert deleted successfully!");
    } catch (error) {
      console.error("Error deleting stock alert:", error);
      alert("Failed to delete stock alert: " + error.message);
    }
  };

  // Edit Stock Alert Functions
  const startEditAlert = (alert) => {
    setEditingAlert(alert);
    setShowEditAlertForm(true);

    // Pre-populate edit form with current values
    const product = products.find((p) => p.id === alert.productId);
    if (product) {
      setEditSelectedProductForAlert({
        ...product,
        selectedVariantId: alert.variantId || null,
        selectedVariantName: alert.variantName || "",
      });

      // Set search text
      let searchText = `${product.categoryName || "Uncategorized"} - ${
        product.subcategoryName || "No Subcategory"
      } - ${product.name}`;
      if (alert.variantName) {
        searchText += ` - ${alert.variantName}`;
      }
      setEditAlertProductSearch(searchText);
    }

    setEditAlertKioskLevel(alert.alertKioskLevel.toString());
    setEditAlertAdminLevel(alert.alertAdminLevel.toString());
    setEditStockZeroAction(alert.stockZeroAction);
  };

  const cancelEditAlert = () => {
    setEditingAlert(null);
    setShowEditAlertForm(false);
    setEditAlertProductSearch("");
    setEditSelectedProductForAlert(null);
    setEditAlertKioskLevel("");
    setEditAlertAdminLevel("");
    setEditStockZeroAction("disable");
    setShowEditAlertProductDropdown(false);
  };

  const saveEditAlert = async () => {
    try {
      if (!editSelectedProductForAlert) {
        alert("Please select a product");
        return;
      }

      if (!editAlertKioskLevel || !editAlertAdminLevel) {
        alert("Please enter both kiosk and admin alert levels");
        return;
      }

      const kioskLevel = parseInt(editAlertKioskLevel);
      const adminLevel = parseInt(editAlertAdminLevel);

      if (
        isNaN(kioskLevel) ||
        isNaN(adminLevel) ||
        kioskLevel < 0 ||
        adminLevel < 0
      ) {
        alert("Alert levels must be valid numbers (0 or greater)");
        return;
      }

      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../../lib/firebase");

      const alertData = {
        productId: editSelectedProductForAlert.id,
        productName: editSelectedProductForAlert.name,
        variantId: editSelectedProductForAlert.selectedVariantId || "",
        variantName: editSelectedProductForAlert.selectedVariantName || "",
        alertKioskLevel: kioskLevel,
        alertAdminLevel: adminLevel,
        stockZeroAction: editStockZeroAction,
        isActive: true,
        updatedAt: new Date(),
        updatedBy: "admin",
      };

      await updateDoc(doc(db, "StockAlert", editingAlert.id), alertData);
      await loadStockAlerts();
      cancelEditAlert();
      alert("Stock alert updated successfully!");
    } catch (error) {
      console.error("Error updating stock alert:", error);
      alert("Failed to update stock alert: " + error.message);
    }
  };

  // Get stock alert for a product
  const getProductStockAlert = (productId) => {
    return stockAlerts.find(
      (alert) => alert.productId === productId && alert.isActive
    );
  };

  // Calculate stock directly from StockMovement collection
  const calculateStock = async (productId, variantId = null) => {
    try {
      const { collection, query, where, getDocs } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../../lib/firebase");

      // Create query to get all stock movements for this product
      let stockQuery = query(
        collection(db, "StockMovement"),
        where("productId", "==", productId)
      );

      // If variantId is provided, also filter by variantId
      if (variantId) {
        stockQuery = query(
          collection(db, "StockMovement"),
          where("productId", "==", productId),
          where("variantId", "==", variantId)
        );
      }

      const querySnapshot = await getDocs(stockQuery);
      let totalStock = 0;

      // Calculate stock: add "purchasing", subtract "sales"
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const quantity = data.quantity || 0;

        if (data.status === "purchasing") {
          totalStock += quantity;
        } else if (data.status === "sales") {
          totalStock -= quantity;
        }
      });

      return totalStock;
    } catch (error) {
      console.error("Error calculating stock:", error);
      return 0;
    }
  };

  // Load all stock calculations from StockMovement collection
  const loadAllStockCalculations = async () => {
    try {
      console.log("🔍 Starting stock calculation...");
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("../../lib/firebase");

      // Get all stock movements
      const querySnapshot = await getDocs(collection(db, "StockMovement"));
      const stockSummary = {};

      console.log(
        "📊 Total StockMovement documents found:",
        querySnapshot.size
      );

      // Process each stock movement
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const productId = data.productId;
        const variantId = data.variantId || "";
        const quantity = data.quantity || 0;
        const status = data.status;

        // Create key for this product/variant combination
        const key = variantId ? `${productId}-${variantId}` : productId;

        // Initialize if not exists
        if (!stockSummary[key]) {
          stockSummary[key] = { stock: 0 };
        }

        // Calculate stock: add "purchasing", subtract "sales"
        if (status === "purchasing") {
          stockSummary[key].stock += quantity;
          console.log(
            `➕ PURCHASING: ${key} +${quantity} = ${stockSummary[key].stock}`
          );
        } else if (status === "sales") {
          stockSummary[key].stock -= quantity;
          console.log(
            `➖ SALES: ${key} -${quantity} = ${stockSummary[key].stock}`
          );
        }
      });

      console.log("✅ Final stock calculations:", stockSummary);
      console.log("📈 Stock summary keys:", Object.keys(stockSummary));

      // Update state with calculated stock
      setStockCalculations(stockSummary);
      setStockCalculationsLoaded(true);
      console.log("Stock calculations loaded:", stockSummary);
    } catch (error) {
      console.error("❌ Error loading stock calculations:", error);
      setStockCalculationsLoaded(false);
    }
  };

  // Get current stock level for a product - Updated to use StockMovement system
  const getCurrentStock = (product, variantId = null) => {
    if (!product) {
      console.log("🚫 getCurrentStock: No product provided");
      return 0;
    }

    // Removed excessive logging

    // If stock calculations are not loaded yet, return 0
    if (!stockCalculationsLoaded) {
      return 0;
    }

    // First check if we have stock calculations from StockMovement system
    if (
      stockCalculations &&
      ((typeof stockCalculations === "object" &&
        Object.keys(stockCalculations).length > 0) ||
        Array.isArray(stockCalculations))
    ) {
      // Handle case where stockCalculations might be an array (should be fixed now)
      let calculations = stockCalculations;
      if (Array.isArray(stockCalculations)) {
        console.log(
          "⚠️ WARNING: stockCalculations is an array, converting to object format"
        );
        calculations = {};
        stockCalculations.forEach((item) => {
          const key = item.variantId
            ? `${item.productId}-${item.variantId}`
            : item.productId;
          calculations[key] = { stock: item.totalStock };
        });
      }

      // If variantId is provided, get stock for specific variant
      if (variantId) {
        const key = `${product.id}-${variantId}`;
        const stockData = calculations[key];
        const stock = stockData
          ? stockData.totalStock || stockData.stock || 0
          : 0;
        console.log(
          `🎯 VARIANT LOOKUP - ProductId: "${product.id}" | VariantId: "${variantId}" | Key: "${key}"`
        );
        console.log(`📋 Available keys:`, Object.keys(calculations));
        console.log(`💰 Found stock:`, stock);
        if (stockData) {
          console.log(`✅ Key found! Stock data:`, stockData);
        } else {
          console.log(`❌ Key NOT found! Checking if similar keys exist...`);
          const similarKeys = Object.keys(calculations).filter((k) =>
            k.includes(product.id)
          );
          console.log(
            `🔍 Keys containing productId "${product.id}":`,
            similarKeys
          );
        }
        return stock;
      }

      // Check if product has variants
      if (
        product.variants &&
        Array.isArray(product.variants) &&
        product.variants.length > 0
      ) {
        let totalStock = 0;
        product.variants.forEach((variant) => {
          if (variant.options && Array.isArray(variant.options)) {
            variant.options.forEach((option) => {
              const key = `${product.id}-${variant.id}-${option.id}`;
              const stockData = calculations[key];
              const variantStock = stockData
                ? stockData.totalStock || stockData.stock || 0
                : 0;
              totalStock += variantStock;
            });
          }
        });
        return totalStock;
      } else {
        // Product without variants (or empty variants array)
        const key = product.id;
        const stockData = calculations[key];
        const stock = stockData
          ? stockData.totalStock || stockData.stock || 0
          : 0;
        console.log(
          `📦 SIMPLE PRODUCT - Product: "${product.name}" | Key: "${key}" | Stock: ${stock}`
        );
        return stock;
      }
    }

    // Fallback to old system for backwards compatibility
    if (variantId && product.variants && Array.isArray(product.variants)) {
      // Look for specific variant
      for (const variant of product.variants) {
        if (variant.options && Array.isArray(variant.options)) {
          for (const option of variant.options) {
            if (`${variant.id}-${option.id}` === variantId) {
              return option.quantity || 0;
            }
          }
        }
        if (variant.id === variantId) {
          return variant.quantity || 0;
        }
      }
      return 0;
    }

    // Check if product has variants with stock
    if (product.variants && Array.isArray(product.variants)) {
      let totalStock = 0;
      product.variants.forEach((variant) => {
        if (variant.options && Array.isArray(variant.options)) {
          variant.options.forEach((option) => {
            totalStock += option.quantity || 0;
          });
        }
      });
      return totalStock;
    }

    // Return product quantity or 0
    return product.quantity || 0;
  };

  // Load crypto payments from Firebase
  const loadCryptoPayments = async () => {
    setLoadingCryptoPayments(true);
    try {
      const { collection, getDocs, query, orderBy, where } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../../lib/firebase");

      let paymentsQuery = query(
        collection(db, "crypto_payments"),
        orderBy("created_at", "desc")
      );

      // Apply status filter
      if (cryptoPaymentStatusFilter !== "all") {
        paymentsQuery = query(
          collection(db, "crypto_payments"),
          where("payment_status", "==", cryptoPaymentStatusFilter),
          orderBy("created_at", "desc")
        );
      }

      const querySnapshot = await getDocs(paymentsQuery);
      const payments = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        payments.push({
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate
            ? data.created_at.toDate()
            : new Date(data.created_at),
          updated_at: data.updated_at?.toDate
            ? data.updated_at.toDate()
            : new Date(data.updated_at),
          expiration_date: data.expiration_date?.toDate
            ? data.expiration_date.toDate()
            : data.expiration_date
            ? new Date(data.expiration_date)
            : null,
        });
      });

      setCryptoPayments(payments);
      console.log("Loaded crypto payments:", payments.length);
    } catch (error) {
      console.error("Error loading crypto payments:", error);
    } finally {
      setLoadingCryptoPayments(false);
    }
  };

  // Check crypto payment status via API
  const checkCryptoPaymentStatus = async (paymentId) => {
    setCheckingCryptoStatus(true);
    try {
      const response = await fetch(`/api/crypto/payment/${paymentId}`);

      if (!response.ok) {
        throw new Error("Failed to check payment status");
      }

      const statusData = await response.json();
      console.log("Payment status from API:", statusData);

      // Reload the payments list to get updated data from Firebase
      await loadCryptoPayments();

      return statusData;
    } catch (error) {
      console.error("Error checking crypto payment status:", error);
      throw error;
    } finally {
      setCheckingCryptoStatus(false);
    }
  };

  // Check all crypto payment statuses and update Firebase
  const refreshAllPaymentStatuses = async () => {
    setRefreshingAllPayments(true);
    try {
      const response = await fetch("/api/crypto/payments/refresh-all", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to refresh payment statuses");
      }

      const result = await response.json();
      console.log("Bulk refresh result:", result);

      // Reload the crypto payments list to reflect updated data
      await loadCryptoPayments();

      // Show success message
      alert(
        `✅ Payment Status Refresh Complete!\n\nTotal checked: ${result.results.total}\nUpdated: ${result.results.updated}\nNo changes: ${result.results.skipped}\nErrors: ${result.results.errors}`
      );
    } catch (error) {
      console.error("Error refreshing all payment statuses:", error);
      alert("❌ Failed to refresh payment statuses. Please try again.");
    } finally {
      setRefreshingAllPayments(false);
    }
  };

  // Filter transactions based on selected criteria
  const filterTransactions = useCallback(() => {
    let filtered = [...transactions];

    // Filter by date range
    if (transactionFilters.dateFrom) {
      const fromDate = new Date(transactionFilters.dateFrom);
      filtered = filtered.filter((transaction) => {
        const transactionDate = new Date(
          transaction.createdAt?.toDate
            ? transaction.createdAt.toDate()
            : transaction.createdAt
        );
        return transactionDate >= fromDate;
      });
    }

    if (transactionFilters.dateTo) {
      const toDate = new Date(transactionFilters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      filtered = filtered.filter((transaction) => {
        const transactionDate = new Date(
          transaction.createdAt?.toDate
            ? transaction.createdAt.toDate()
            : transaction.createdAt
        );
        return transactionDate <= toDate;
      });
    }

    // Filter by customer name
    if (transactionFilters.customer) {
      filtered = filtered.filter((transaction) =>
        transaction.customerName
          ?.toLowerCase()
          .includes(transactionFilters.customer.toLowerCase())
      );
    }

    // Filter by payment method
    if (transactionFilters.paymentMethod) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.paymentMethod === transactionFilters.paymentMethod
      );
    }

    // Filter by amount range
    if (transactionFilters.minAmount) {
      const minAmount = parseFloat(transactionFilters.minAmount);
      filtered = filtered.filter(
        (transaction) =>
          (transaction.total || transaction.amount || 0) >= minAmount
      );
    }

    if (transactionFilters.maxAmount) {
      const maxAmount = parseFloat(transactionFilters.maxAmount);
      filtered = filtered.filter(
        (transaction) =>
          (transaction.total || transaction.amount || 0) <= maxAmount
      );
    }

    // Filter by category (check if any item in transaction belongs to the category)
    if (transactionFilters.category) {
      filtered = filtered.filter((transaction) =>
        transaction.items?.some(
          (item) =>
            item.categoryName
              ?.toLowerCase()
              .includes(transactionFilters.category.toLowerCase()) ||
            item.categoryId === transactionFilters.category
        )
      );
    }

    // Filter by product name
    if (transactionFilters.product) {
      filtered = filtered.filter((transaction) =>
        transaction.items?.some((item) =>
          item.name
            ?.toLowerCase()
            .includes(transactionFilters.product.toLowerCase())
        )
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, transactionFilters]);

  // Apply filters whenever filters change or transactions are updated
  useEffect(() => {
    filterTransactions();
  }, [transactions, transactionFilters, filterTransactions]);

  // Reset filters function
  const resetTransactionFilters = () => {
    setTransactionFilters({
      dateFrom: "",
      dateTo: "",
      category: "",
      product: "",
      customer: "",
      paymentMethod: "",
      minAmount: "",
      maxAmount: "",
    });
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
                onClick={() => setActiveTab("pendingPoints")}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "pendingPoints"
                    ? "bg-green-100 text-green-700 border-r-4 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Clock className="w-5 h-5 mr-3" />
                Pending Points
              </button>

              <button
                onClick={() => setActiveTab("categoryOrder")}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "categoryOrder"
                    ? "bg-green-100 text-green-700 border-r-4 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <BarChart className="w-5 h-5 mr-3" />
                Category Order
              </button>

              {AdminAuth.isRootAdmin() && (
                <button
                  onClick={() => setActiveTab("adminManagement")}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "adminManagement"
                      ? "bg-green-100 text-green-700 border-r-4 border-green-500"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <User className="w-5 h-5 mr-3" />
                  Admin Management
                </button>
              )}

              <div>
                <button
                  onClick={() => setActiveTab("stockManagement")}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "stockManagement"
                      ? "bg-green-100 text-green-700 border-r-4 border-green-500"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Package className="w-5 h-5 mr-3" />
                  Stock Management
                  <svg
                    className={`w-4 h-4 ml-auto transition-transform ${
                      activeTab === "stockManagement" ? "rotate-90" : ""
                    }`}
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
                </button>

                {/* Stock Management Submenu */}
                {activeTab === "stockManagement" && (
                  <div className="ml-8 mt-2 space-y-1">
                    <button
                      onClick={() => setStockActiveSubTab("overview")}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                        stockActiveSubTab === "overview"
                          ? "bg-green-50 text-green-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
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
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      Stock Overview
                    </button>
                    <button
                      onClick={() => setStockActiveSubTab("movements")}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                        stockActiveSubTab === "movements"
                          ? "bg-green-50 text-green-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
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
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                      Stock Movements
                    </button>
                    <button
                      onClick={() => setStockActiveSubTab("purchasing")}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                        stockActiveSubTab === "purchasing"
                          ? "bg-green-50 text-green-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
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
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                      Purchasing
                    </button>
                    <button
                      onClick={() => setStockActiveSubTab("alerts")}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                        stockActiveSubTab === "alerts"
                          ? "bg-green-50 text-green-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
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
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      Stock Alerts
                    </button>
                  </div>
                )}
              </div>

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

              <button
                onClick={() => setActiveTab("cryptoPayments")}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "cryptoPayments"
                    ? "bg-green-100 text-green-700 border-r-4 border-green-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Payment Crypto
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
                      : activeTab === "pendingPoints"
                      ? "Pending Points"
                      : activeTab === "categoryOrder"
                      ? "Category Order"
                      : activeTab === "adminManagement"
                      ? "Admin Management"
                      : activeTab === "settings"
                      ? "Settings"
                      : activeTab === "cryptoPayments"
                      ? "Crypto Payments"
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
                      : activeTab === "pendingPoints"
                      ? "Review and approve customer point requests"
                      : activeTab === "categoryOrder"
                      ? "Organize and reorder product categories"
                      : activeTab === "adminManagement"
                      ? "Manage admin accounts and permissions"
                      : activeTab === "settings"
                      ? "System configuration and preferences"
                      : activeTab === "cryptoPayments"
                      ? "Monitor and manage cryptocurrency payments from kiosk"
                      : "Admin management"}
                  </p>
                </div>

                {/* Admin Info and Logout */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {AdminAuth.getCurrentAdmin()?.email || "admin@root.com"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {AdminAuth.isRootAdmin()
                        ? "Root Administrator - Full Access"
                        : `Permissions: ${AdminAuth.getPermissionsList().join(
                            ", "
                          )}`}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/admin/debug")}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Debug
                  </button>
                  <button
                    onClick={() => AdminAuth.logout()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
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
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Logout
                  </button>
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
                      {transactions.length > 0 ? (
                        <div className="space-y-4">
                          {transactions.slice(0, 5).map((transaction) => (
                            <div
                              key={transaction.transactionId}
                              onClick={() => {
                                // Use the transaction object directly first (it should have items)
                                let transactionToShow = {
                                  ...transaction,
                                  customerName: transaction.customerName,
                                  customerEmail:
                                    transaction.customerEmail || "N/A",
                                  customerId: transaction.customerId,
                                };

                                // If transaction doesn't have items, try to find them in customer's points
                                if (
                                  !transaction.items ||
                                  transaction.items.length === 0
                                ) {
                                  const customer = customers.find(
                                    (c) =>
                                      c.name === transaction.customerName ||
                                      c.customerName ===
                                        transaction.customerName ||
                                      c.customerId === transaction.customerId
                                  );

                                  if (customer) {
                                    const transactionDetail =
                                      customer.points?.find(
                                        (p) =>
                                          p.transactionId ===
                                          transaction.transactionId
                                      );

                                    if (transactionDetail) {
                                      // Merge the data from customer points with the original transaction
                                      transactionToShow = {
                                        ...transactionToShow,
                                        ...transactionDetail,
                                        customerName: customer.name,
                                        customerEmail: customer.email || "N/A",
                                        customerId: customer.customerId,
                                        // Keep the items from customer points if available
                                        items:
                                          transactionDetail.items ||
                                          transaction.items ||
                                          [],
                                      };
                                    }
                                  }
                                }

                                setSelectedTransactionDetails(
                                  transactionToShow
                                );
                                setShowTransactionDetails(true);
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
                                      // Try multiple amount fields in order of preference
                                      const amount =
                                        transaction.total ||
                                        transaction.amount ||
                                        transaction.totalSpent ||
                                        0;

                                      // If we have an amount, use it
                                      if (amount > 0) {
                                        return amount.toLocaleString("en-US", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        });
                                      }

                                      // If no direct amount, try to calculate from items
                                      if (
                                        transaction.items &&
                                        transaction.items.length > 0
                                      ) {
                                        const calculatedTotal =
                                          transaction.items.reduce(
                                            (sum, item) => {
                                              const price = item.price || 0;
                                              const quantity =
                                                item.quantity || 1;
                                              return sum + price * quantity;
                                            },
                                            0
                                          );

                                        if (calculatedTotal > 0) {
                                          return calculatedTotal.toLocaleString(
                                            "en-US",
                                            {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2,
                                            }
                                          );
                                        }
                                      }

                                      // Last resort: look in customer points data
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
                                          const total =
                                            transactionDetail.items.reduce(
                                              (sum, item) => {
                                                return (
                                                  sum +
                                                  (item.price || 0) *
                                                    (item.quantity || 1)
                                                );
                                              },
                                              0
                                            );

                                          if (total > 0) {
                                            return total.toLocaleString(
                                              "en-US",
                                              {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              }
                                            );
                                          }
                                        }
                                      }

                                      return "0.00";
                                    })()}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Points: {transaction.pointsEarned || 0}
                                    {!transaction.pointsEarned &&
                                      transaction.items &&
                                      transaction.items.length > 0 && (
                                        <span className="text-orange-500">
                                          {" "}
                                          (Not calculated)
                                        </span>
                                      )}
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
                        <div className="text-center py-8">
                          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg font-medium mb-2">
                            No transactions yet
                          </p>
                          <p className="text-gray-400 text-sm">
                            Transactions will appear here once customers make
                            purchases
                          </p>
                        </div>
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
                    <div className="flex space-x-3">
                      {AdminAuth.hasPermission("input") && (
                        <button
                          onClick={handleAddCustomer}
                          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center"
                        >
                          <Users className="w-5 h-5 mr-2" />
                          Add Customer
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Non Member Categories and Search */}
                  <div className="space-y-6">
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

                    {/* Non Member Categories */}
                    {AdminAuth.hasPermission("edit") && (
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Non Member Categories
                          </h3>
                          <button
                            onClick={handleSaveNonMemberCategories}
                            disabled={savingNonMemberCategories}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-md flex items-center ${
                              savingNonMemberCategories
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                            }`}
                          >
                            {savingNonMemberCategories ? (
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
                                Saving...
                              </>
                            ) : (
                              "Save"
                            )}
                          </button>
                        </div>

                        <div className="max-h-32 overflow-y-auto">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-600">
                              {nonMemberCategories.length} of{" "}
                              {categories.length} selected
                            </span>
                            <div className="space-x-2">
                              <button
                                type="button"
                                onClick={selectAllNonMemberCategories}
                                className="text-xs text-green-600 hover:text-green-800"
                              >
                                All
                              </button>
                              <button
                                type="button"
                                onClick={clearAllNonMemberCategories}
                                className="text-xs text-red-600 hover:text-red-800"
                              >
                                None
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                            {categories.map((category) => (
                              <label
                                key={category.id}
                                className="flex items-center space-x-2 p-1 rounded hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={nonMemberCategories.includes(
                                    category.id
                                  )}
                                  onChange={() =>
                                    toggleNonMemberCategory(category.id)
                                  }
                                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="text-xs text-gray-700">
                                  {category.name}
                                </span>
                              </label>
                            ))}
                          </div>

                          {categories.length === 0 && (
                            <div className="text-center py-2 text-gray-500 text-xs">
                              No categories available
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
                              Total Points
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
                                      const totalFromTransactions =
                                        calculateTotalSpentFromTransactions(
                                          customer
                                        );
                                      return totalFromTransactions.toLocaleString(
                                        "en-US",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      );
                                    })()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  <span className="font-medium text-blue-600">
                                    {calculateTotalPoints(customer)} pts
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
                                  {AdminAuth.hasPermission("edit") && (
                                    <button
                                      onClick={() => {
                                        if (!checkEditPermission()) return;
                                        setCustomerForm({
                                          nationality:
                                            customer.nationality || "",
                                          name: customer.name || "",
                                          lastName: customer.lastName || "",
                                          nickname: customer.nickname || "",
                                          email: customer.email || "",
                                          cell: customer.cell || "",
                                          memberId:
                                            customer.memberId ||
                                            customer.customerId ||
                                            "",
                                          isActive:
                                            customer.isActive !== undefined
                                              ? customer.isActive
                                              : true,
                                          dateOfBirth:
                                            customer.dateOfBirth || "",
                                          customPoints:
                                            customer.customPoints || 0,
                                          allowedCategories:
                                            customer.allowedCategories || [],
                                        });
                                        setMemberIdError("");
                                        setEditingCustomer(customer);
                                      }}
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      Edit
                                    </button>
                                  )}
                                  {AdminAuth.hasPermission("edit") && (
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
                                  )}
                                  {AdminAuth.hasPermission("delete") && (
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
                      {AdminAuth.hasPermission("input") && (
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
                      )}
                      {AdminAuth.hasPermission("input") && (
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
                      )}
                      {AdminAuth.hasPermission("input") && (
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
                      )}
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
                                        <Image
                                          src={category.image}
                                          alt={category.name}
                                          width={64}
                                          height={64}
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
                                    {/* Subcategories Section */}
                                    {categorySubcategories.length > 0 && (
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
                                                      <Image
                                                        src={subcategory.image}
                                                        alt={subcategory.name}
                                                        width={48}
                                                        height={48}
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
                                                            const isVariantExpanded =
                                                              expandedVariants.has(
                                                                product.id
                                                              );

                                                            return (
                                                              <div
                                                                key={product.id}
                                                                className="bg-white rounded-lg border border-gray-200/70 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                                              >
                                                                {/* Product Level */}
                                                                <div
                                                                  className={`flex items-center space-x-3 p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50/30 ${
                                                                    product.hasVariants
                                                                      ? "cursor-pointer"
                                                                      : ""
                                                                  }`}
                                                                  onClick={(
                                                                    e
                                                                  ) => {
                                                                    if (
                                                                      product.hasVariants
                                                                    ) {
                                                                      e.stopPropagation();
                                                                      toggleVariantExpansion(
                                                                        product.id
                                                                      );
                                                                    }
                                                                  }}
                                                                >
                                                                  {/* Expansion Arrow for Products with Variants */}
                                                                  {product.hasVariants && (
                                                                    <div
                                                                      className={`transform transition-transform duration-200 ${
                                                                        isVariantExpanded
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
                                                                  )}
                                                                  <div className="flex items-center space-x-3">
                                                                    <div className="relative">
                                                                      {product.mainImage ? (
                                                                        <Image
                                                                          src={
                                                                            product.mainImage
                                                                          }
                                                                          alt={
                                                                            product.name
                                                                          }
                                                                          width={
                                                                            40
                                                                          }
                                                                          height={
                                                                            40
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
                                                                          {product.memberPrice && (
                                                                            <span className="flex items-center font-medium text-orange-600">
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
                                                                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                                                />
                                                                              </svg>
                                                                              Member:
                                                                              ฿
                                                                              {(
                                                                                product.memberPrice ||
                                                                                0
                                                                              ).toFixed(
                                                                                2
                                                                              )}
                                                                            </span>
                                                                          )}
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

                                                                {/* Variant Expansion Section */}
                                                                {product.hasVariants &&
                                                                  isVariantExpanded &&
                                                                  product.variants &&
                                                                  product
                                                                    .variants
                                                                    .length >
                                                                    0 && (
                                                                    <div className="border-t border-gray-100 bg-gray-50/50 p-4 ml-8">
                                                                      <div className="space-y-3">
                                                                        <div className="flex items-center space-x-2 mb-3">
                                                                          <svg
                                                                            className="w-4 h-4 text-blue-600"
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
                                                                          <span className="text-sm font-medium text-gray-700">
                                                                            Product
                                                                            Variants
                                                                            (
                                                                            {
                                                                              product
                                                                                .variants
                                                                                .length
                                                                            }
                                                                            )
                                                                          </span>
                                                                        </div>

                                                                        <div className="space-y-4">
                                                                          {product.variants.map(
                                                                            (
                                                                              variant,
                                                                              variantIndex
                                                                            ) => {
                                                                              // Debug the variant structure
                                                                              console.log(
                                                                                "Variant data:",
                                                                                variant
                                                                              );

                                                                              // Handle different possible data structures for variant name
                                                                              const variantName =
                                                                                variant.name ||
                                                                                variant.title ||
                                                                                variant.variantName ||
                                                                                `Variant ${
                                                                                  variantIndex +
                                                                                  1
                                                                                }`;

                                                                              return (
                                                                                <div
                                                                                  key={
                                                                                    variantIndex
                                                                                  }
                                                                                  className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                                                                                >
                                                                                  {/* Variant Header */}
                                                                                  <div className="mb-3">
                                                                                    <h6 className="text-sm font-semibold text-gray-800 mb-1">
                                                                                      {
                                                                                        variantName
                                                                                      }
                                                                                    </h6>
                                                                                  </div>

                                                                                  {/* Variant Options Grid */}
                                                                                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                                                    {variant.options &&
                                                                                    variant
                                                                                      .options
                                                                                      .length >
                                                                                      0 ? (
                                                                                      variant.options.map(
                                                                                        (
                                                                                          option,
                                                                                          optionIndex
                                                                                        ) => {
                                                                                          console.log(
                                                                                            "Option data:",
                                                                                            option
                                                                                          );

                                                                                          const optionName =
                                                                                            option.name ||
                                                                                            option.title ||
                                                                                            option.size ||
                                                                                            `Option ${
                                                                                              optionIndex +
                                                                                              1
                                                                                            }`;
                                                                                          const optionPrice =
                                                                                            option.price ||
                                                                                            option.cost ||
                                                                                            option.amount ||
                                                                                            0;
                                                                                          const optionMemberPrice =
                                                                                            option.memberPrice;
                                                                                          const optionImage =
                                                                                            option.image ||
                                                                                            option.imageUrl ||
                                                                                            option.img ||
                                                                                            option.photo;

                                                                                          return (
                                                                                            <div
                                                                                              key={
                                                                                                optionIndex
                                                                                              }
                                                                                              className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-all duration-200"
                                                                                            >
                                                                                              <div className="flex items-center space-x-3">
                                                                                                {optionImage && (
                                                                                                  <Image
                                                                                                    src={
                                                                                                      optionImage
                                                                                                    }
                                                                                                    alt={
                                                                                                      optionName
                                                                                                    }
                                                                                                    width={
                                                                                                      40
                                                                                                    }
                                                                                                    height={
                                                                                                      40
                                                                                                    }
                                                                                                    className="w-10 h-10 object-cover rounded-md border border-gray-200"
                                                                                                  />
                                                                                                )}

                                                                                                <div className="flex-1 min-w-0">
                                                                                                  <div className="flex items-center justify-between">
                                                                                                    <h6 className="text-sm font-medium text-gray-900 truncate">
                                                                                                      {
                                                                                                        optionName
                                                                                                      }
                                                                                                    </h6>
                                                                                                    <div className="text-right">
                                                                                                      <div className="text-sm font-medium text-blue-600">
                                                                                                        ฿
                                                                                                        {(
                                                                                                          optionPrice ||
                                                                                                          0
                                                                                                        ).toFixed(
                                                                                                          2
                                                                                                        )}
                                                                                                      </div>
                                                                                                      {optionMemberPrice !==
                                                                                                        undefined && (
                                                                                                        <div className="text-xs text-green-600">
                                                                                                          Member:
                                                                                                          ฿
                                                                                                          {optionMemberPrice.toFixed(
                                                                                                            2
                                                                                                          )}
                                                                                                        </div>
                                                                                                      )}
                                                                                                    </div>
                                                                                                  </div>
                                                                                                </div>
                                                                                              </div>
                                                                                            </div>
                                                                                          );
                                                                                        }
                                                                                      )
                                                                                    ) : (
                                                                                      // Fallback: show variant itself if no options
                                                                                      <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                                                                        <div className="flex items-center space-x-3">
                                                                                          {variant.image && (
                                                                                            <Image
                                                                                              src={
                                                                                                variant.image
                                                                                              }
                                                                                              alt={
                                                                                                variantName
                                                                                              }
                                                                                              width={
                                                                                                40
                                                                                              }
                                                                                              height={
                                                                                                40
                                                                                              }
                                                                                              className="w-10 h-10 object-cover rounded-md border border-gray-200"
                                                                                            />
                                                                                          )}

                                                                                          <div className="flex-1 min-w-0">
                                                                                            <div className="flex items-center justify-between">
                                                                                              <h6 className="text-sm font-medium text-gray-900 truncate">
                                                                                                {
                                                                                                  variantName
                                                                                                }
                                                                                              </h6>
                                                                                              <span className="text-sm font-medium text-blue-600">
                                                                                                {(
                                                                                                  variant.price ||
                                                                                                  0
                                                                                                ).toFixed(
                                                                                                  2
                                                                                                )}
                                                                                              </span>
                                                                                            </div>
                                                                                          </div>
                                                                                        </div>
                                                                                      </div>
                                                                                    )}
                                                                                  </div>
                                                                                </div>
                                                                              );
                                                                            }
                                                                          )}
                                                                        </div>
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

                                    {/* Products without subcategory section - Independent of subcategories */}
                                    {(() => {
                                      const productsWithoutSubcategory =
                                        products.filter((prod) => {
                                          const hasCategory =
                                            prod.categoryId === category.id;
                                          const hasNoSubcategory =
                                            !prod.subcategoryId ||
                                            prod.subcategoryId === "" ||
                                            prod.subcategoryId === null ||
                                            prod.subcategoryId === undefined ||
                                            (typeof prod.subcategoryId ===
                                              "string" &&
                                              prod.subcategoryId.trim() === "");

                                          return (
                                            hasCategory && hasNoSubcategory
                                          );
                                        });

                                      if (
                                        productsWithoutSubcategory.length === 0
                                      ) {
                                        return null;
                                      }

                                      return (
                                        <div className="bg-white rounded-lg border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ml-8 mt-3">
                                          {/* Direct Category Products Header */}
                                          <div className="flex items-center space-x-4 p-5 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
                                            <div className="flex items-center space-x-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-200 rounded-lg flex items-center justify-center">
                                                <svg
                                                  className="w-4 h-4 text-green-600"
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
                                              <div>
                                                <h6 className="text-base font-semibold text-gray-900">
                                                  Direct Products
                                                </h6>
                                                <p className="text-sm text-gray-600 flex items-center">
                                                  <svg
                                                    className="w-3 h-3 mr-1"
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
                                                    productsWithoutSubcategory.length
                                                  }{" "}
                                                  products (no subcategory)
                                                </p>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Direct Products List */}
                                          <div className="border-t border-gray-200/50 bg-gradient-to-r from-green-50/30 to-emerald-50/30">
                                            <div className="p-3 space-y-2 ml-4">
                                              {productsWithoutSubcategory.map(
                                                (product) => {
                                                  const isProductExpanded =
                                                    expandedProducts.has(
                                                      product.id
                                                    );
                                                  const isVariantExpanded =
                                                    expandedVariants.has(
                                                      product.id
                                                    );

                                                  return (
                                                    <div
                                                      key={product.id}
                                                      className="bg-white rounded-lg border border-gray-200/70 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                                                    >
                                                      {/* Product Level */}
                                                      <div
                                                        className={`flex items-center space-x-3 p-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50/30 ${
                                                          product.hasVariants
                                                            ? "cursor-pointer"
                                                            : ""
                                                        }`}
                                                        onClick={(e) => {
                                                          if (
                                                            product.hasVariants
                                                          ) {
                                                            e.stopPropagation();
                                                            toggleVariantExpansion(
                                                              product.id
                                                            );
                                                          }
                                                        }}
                                                      >
                                                        {/* Expansion Arrow for Products with Variants */}
                                                        {product.hasVariants && (
                                                          <div
                                                            className={`transform transition-transform duration-200 ${
                                                              isVariantExpanded
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
                                                        )}
                                                        <div className="flex items-center space-x-3">
                                                          <div className="relative">
                                                            {product.mainImage ||
                                                            product
                                                              .images?.[0] ||
                                                            product.image ? (
                                                              <Image
                                                                src={
                                                                  product.mainImage ||
                                                                  product
                                                                    .images?.[0] ||
                                                                  product.image
                                                                }
                                                                alt={
                                                                  product.name
                                                                }
                                                                width={48}
                                                                height={48}
                                                                className="w-12 h-12 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                                                                onError={(
                                                                  e
                                                                ) => {
                                                                  console.log(
                                                                    "Image failed to load:",
                                                                    e.target.src
                                                                  );
                                                                  e.target.style.display =
                                                                    "none";
                                                                  e.target.nextSibling.style.display =
                                                                    "flex";
                                                                }}
                                                              />
                                                            ) : null}
                                                            {!(
                                                              product.mainImage ||
                                                              product
                                                                .images?.[0] ||
                                                              product.image
                                                            ) && (
                                                              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                                                                <svg
                                                                  className="w-6 h-6 text-green-600"
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
                                                            <div className="hidden w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg items-center justify-center border-2 border-gray-200">
                                                              <svg
                                                                className="w-6 h-6 text-green-600"
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
                                                            {product.name}
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
                                                                  ).toFixed(2)}
                                                                </span>
                                                                {product.memberPrice && (
                                                                  <span className="flex items-center font-medium text-orange-600">
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
                                                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                                      />
                                                                    </svg>
                                                                    Member: ฿
                                                                    {(
                                                                      product.memberPrice ||
                                                                      0
                                                                    ).toFixed(
                                                                      2
                                                                    )}
                                                                  </span>
                                                                )}
                                                              </>
                                                            )}
                                                          </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                          <button
                                                            onClick={(e) => {
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
                                                                strokeWidth={2}
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                              />
                                                            </svg>
                                                          </button>
                                                          <button
                                                            onClick={(e) => {
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
                                                                strokeWidth={2}
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
                                          </div>
                                        </div>
                                      );
                                    })()}
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
                              Member Price (฿)
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
                                        <Image
                                          className="h-10 w-10 rounded-lg object-cover mr-4"
                                          src={product.mainImage}
                                          alt={product.name}
                                          width={40}
                                          height={40}
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
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {product.hasVariants ? (
                                      <span className="text-blue-600">
                                        Variable
                                      </span>
                                    ) : (
                                      <span className="text-orange-600">
                                        ฿{(product.memberPrice || 0).toFixed(2)}
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
                                        if (!checkEditPermission()) return;
                                        setEditingProduct(product);
                                        setShouldRemoveMainImages(false); // Reset removal flag when starting edit
                                        setVariants(product.variants || []);
                                        setHasVariants(
                                          product.hasVariants || false
                                        );
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
                                    {AdminAuth.hasPermission("edit") && (
                                      <button
                                        onClick={() =>
                                          handleToggleProductStatus(product)
                                        }
                                        disabled={
                                          isTogglingStatus === product.id
                                        }
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
                                    )}
                                    {AdminAuth.hasPermission("delete") && (
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
                                    )}
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

              {/* Stock Detail Modal */}
              {showStockDetailModal && selectedStockDetail && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold">
                            {selectedStockDetail.product.name}
                          </h3>
                          <p className="text-green-100 text-sm opacity-90">
                            Detailed Stock Analysis
                          </p>
                        </div>
                        <button
                          onClick={() => setShowStockDetailModal(false)}
                          className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white/10 transition-colors"
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
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 max-h-[calc(90vh-80px)] overflow-y-auto">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Product Info */}
                        <div className="lg:col-span-1 space-y-6">
                          {/* Product Summary Card */}
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">
                              Product Information
                            </h4>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">
                                  Category:
                                </span>
                                <span className="text-sm text-gray-800">
                                  {selectedStockDetail.product.categoryName ||
                                    "Uncategorized"}
                                </span>
                              </div>
                              {selectedStockDetail.product.subcategoryName && (
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium text-gray-600">
                                    Subcategory:
                                  </span>
                                  <span className="text-sm text-gray-800">
                                    {
                                      selectedStockDetail.product
                                        .subcategoryName
                                    }
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">
                                  Type:
                                </span>
                                <span className="text-sm text-gray-800">
                                  {selectedStockDetail.hasVariants
                                    ? "Variable Product"
                                    : "Simple Product"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Stock Status Card */}
                          {(() => {
                            // Recalculate stock status in modal using the same logic as cards
                            const stockAlert = stockAlerts.find(
                              (alert) =>
                                alert.productId ===
                                  selectedStockDetail.product.id &&
                                alert.isActive
                            );
                            let modalStockStatus = null;

                            if (stockAlert) {
                              if (
                                selectedStockDetail.totalStock <=
                                stockAlert.alertAdminLevel
                              ) {
                                modalStockStatus = "critical";
                              } else if (
                                selectedStockDetail.totalStock <=
                                stockAlert.alertKioskLevel
                              ) {
                                modalStockStatus = "warning";
                              } else {
                                modalStockStatus = "good";
                              }
                            }

                            return modalStockStatus ? (
                              <div
                                className={`rounded-xl p-6 ${
                                  modalStockStatus === "good"
                                    ? "bg-green-50 border border-green-200"
                                    : modalStockStatus === "warning"
                                    ? "bg-yellow-50 border border-yellow-200"
                                    : "bg-red-50 border border-red-200"
                                }`}
                              >
                                <div className="flex items-center space-x-3 mb-4">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      modalStockStatus === "good"
                                        ? "bg-green-500"
                                        : modalStockStatus === "warning"
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                  ></div>
                                  <h4
                                    className={`text-lg font-semibold ${
                                      modalStockStatus === "good"
                                        ? "text-green-800"
                                        : modalStockStatus === "warning"
                                        ? "text-yellow-800"
                                        : "text-red-800"
                                    }`}
                                  >
                                    {modalStockStatus === "good"
                                      ? "Well Stocked"
                                      : modalStockStatus === "warning"
                                      ? "Low Stock"
                                      : "Critical Stock"}
                                  </h4>
                                </div>
                                <div className="text-3xl font-bold mb-2 text-gray-900">
                                  {selectedStockDetail.totalStock} units
                                </div>
                                <p
                                  className={`text-sm ${
                                    modalStockStatus === "good"
                                      ? "text-green-700"
                                      : modalStockStatus === "warning"
                                      ? "text-yellow-700"
                                      : "text-red-700"
                                  }`}
                                >
                                  {modalStockStatus === "good"
                                    ? "Stock levels are healthy"
                                    : modalStockStatus === "warning"
                                    ? "Consider restocking soon"
                                    : "Immediate restocking required"}
                                </p>
                              </div>
                            ) : (
                              <div className="rounded-xl p-6 bg-gray-50 border border-gray-200">
                                <div className="text-center">
                                  <div className="text-3xl font-bold mb-2 text-gray-900">
                                    {selectedStockDetail.totalStock} units
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    No stock alert configured
                                  </p>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Stock Alert Information */}
                          {(() => {
                            const stockAlert = stockAlerts.find(
                              (alert) =>
                                alert.productId ===
                                  selectedStockDetail.product.id &&
                                alert.isActive
                            );
                            return stockAlert ? (
                              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                  Stock Alert Settings
                                </h4>
                                <div className="space-y-3 text-sm">
                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">
                                      Kiosk Alert Level:
                                    </span>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                                      {stockAlert.alertKioskLevel} units
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">
                                      Admin Alert Level:
                                    </span>
                                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                      {stockAlert.alertAdminLevel} units
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-600">
                                      When Stock is Zero:
                                    </span>
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium ${
                                        stockAlert.stockZeroAction === "disable"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {stockAlert.stockZeroAction === "disable"
                                        ? "Disable Product"
                                        : "Keep Visible"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 rounded-xl p-6">
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                  No Stock Alert
                                </h4>
                                <p className="text-sm text-gray-600 mb-3">
                                  This product doesn&apos;t have stock alerts
                                  configured.
                                </p>
                                <button
                                  onClick={() => {
                                    setStockActiveSubTab("alerts");
                                    setShowStockDetailModal(false);
                                  }}
                                  className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                  Set Up Stock Alert
                                </button>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Right Column - Stock Details */}
                        <div className="lg:col-span-2 space-y-6">
                          {/* Variants Table (if has variants) */}
                          {selectedStockDetail.hasVariants && (
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h4 className="text-lg font-semibold text-gray-900">
                                  Stock by Variant
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  Individual stock levels for each product
                                  variant
                                </p>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Variant
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock Level
                                      </th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedStockDetail.product.variants.map(
                                      (variant) => {
                                        if (
                                          variant.options &&
                                          Array.isArray(variant.options)
                                        ) {
                                          return variant.options.map(
                                            (option) => {
                                              const variantId = `${variant.id}-${option.id}`;
                                              const variantStock =
                                                getCurrentStock(
                                                  selectedStockDetail.product,
                                                  variantId
                                                );
                                              const variantStatus =
                                                variantStock > 10
                                                  ? "high"
                                                  : variantStock > 0
                                                  ? "low"
                                                  : "out";

                                              return (
                                                <tr
                                                  key={`${variant.id}-${option.id}`}
                                                  className="hover:bg-gray-50"
                                                >
                                                  <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                      {variant.variantName}:{" "}
                                                      {option.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                      ID: {variantId}
                                                    </div>
                                                  </td>
                                                  <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-2xl font-bold text-gray-900">
                                                      {variantStock}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                      units
                                                    </div>
                                                  </td>
                                                  <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                        variantStatus === "high"
                                                          ? "bg-green-100 text-green-800"
                                                          : variantStatus ===
                                                            "low"
                                                          ? "bg-yellow-100 text-yellow-800"
                                                          : "bg-red-100 text-red-800"
                                                      }`}
                                                    >
                                                      <div
                                                        className={`w-2 h-2 rounded-full mr-1 ${
                                                          variantStatus ===
                                                          "high"
                                                            ? "bg-green-500"
                                                            : variantStatus ===
                                                              "low"
                                                            ? "bg-yellow-500"
                                                            : "bg-red-500"
                                                        }`}
                                                      ></div>
                                                      {variantStatus === "high"
                                                        ? "In Stock"
                                                        : variantStatus ===
                                                          "low"
                                                        ? "Low Stock"
                                                        : "Out of Stock"}
                                                    </span>
                                                  </td>
                                                </tr>
                                              );
                                            }
                                          );
                                        } else {
                                          const variantStock = getCurrentStock(
                                            selectedStockDetail.product,
                                            variant.id
                                          );
                                          const variantStatus =
                                            variantStock > 10
                                              ? "high"
                                              : variantStock > 0
                                              ? "low"
                                              : "out";

                                          return (
                                            <tr
                                              key={variant.id}
                                              className="hover:bg-gray-50"
                                            >
                                              <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                  {variant.name ||
                                                    `Variant ${variant.id}`}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                  ID: {variant.id}
                                                </div>
                                              </td>
                                              <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-2xl font-bold text-gray-900">
                                                  {variantStock}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                  units
                                                </div>
                                              </td>
                                              <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                                    variantStatus === "high"
                                                      ? "bg-green-100 text-green-800"
                                                      : variantStatus === "low"
                                                      ? "bg-yellow-100 text-yellow-800"
                                                      : "bg-red-100 text-red-800"
                                                  }`}
                                                >
                                                  <div
                                                    className={`w-2 h-2 rounded-full mr-1 ${
                                                      variantStatus === "high"
                                                        ? "bg-green-500"
                                                        : variantStatus ===
                                                          "low"
                                                        ? "bg-yellow-500"
                                                        : "bg-red-500"
                                                    }`}
                                                  ></div>
                                                  {variantStatus === "high"
                                                    ? "In Stock"
                                                    : variantStatus === "low"
                                                    ? "Low Stock"
                                                    : "Out of Stock"}
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        }
                                      }
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Simple Product Stock (if no variants) */}
                          {!selectedStockDetail.hasVariants && (
                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                                Stock Information
                              </h4>
                              <div className="text-center py-8">
                                <div className="text-6xl font-bold text-gray-900 mb-2">
                                  {selectedStockDetail.totalStock}
                                </div>
                                <div className="text-lg text-gray-600">
                                  Total Units Available
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Stock Movement Summary */}
                          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                              <h4 className="text-lg font-semibold text-gray-900">
                                Recent Stock Movements
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Last 10 stock transactions for this product
                              </p>
                            </div>
                            <div className="p-6">
                              <div className="space-y-4">
                                {stockMovements
                                  .filter(
                                    (movement) =>
                                      movement.productId ===
                                      selectedStockDetail.product.id
                                  )
                                  .slice(0, 10)
                                  .map((movement) => (
                                    <div
                                      key={movement.id}
                                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div
                                          className={`w-3 h-3 rounded-full ${
                                            movement.status === "purchasing"
                                              ? "bg-green-500"
                                              : "bg-red-500"
                                          }`}
                                        ></div>
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            {movement.status === "purchasing"
                                              ? "Purchase"
                                              : "Sale"}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {movement.variantName &&
                                              `${movement.variantName} • `}
                                            {movement.date} {movement.time}
                                          </div>
                                        </div>
                                      </div>
                                      <div
                                        className={`text-sm font-medium ${
                                          movement.status === "purchasing"
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {movement.status === "purchasing"
                                          ? "+"
                                          : "-"}
                                        {movement.quantity}
                                      </div>
                                    </div>
                                  ))}
                                {stockMovements.filter(
                                  (movement) =>
                                    movement.productId ===
                                    selectedStockDetail.product.id
                                ).length === 0 && (
                                  <div className="text-center py-8 text-gray-500">
                                    <svg
                                      className="mx-auto h-8 w-8 text-gray-400 mb-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                      />
                                    </svg>
                                    <p className="text-sm">
                                      No stock movements recorded yet
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
                      <button
                        onClick={() => setShowStockDetailModal(false)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Close
                      </button>
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
                        {filteredTransactions.length} of {transactions.length})
                      </p>
                    </div>

                    {/* Filter Section */}
                    <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Filters
                        </h3>
                        <div className="flex space-x-2">
                          {/* Quick Date Filters */}
                          <button
                            onClick={() => {
                              const today = new Date();
                              setTransactionFilters((prev) => ({
                                ...prev,
                                dateFrom: today.toISOString().split("T")[0],
                                dateTo: today.toISOString().split("T")[0],
                              }));
                            }}
                            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200"
                          >
                            Today
                          </button>
                          <button
                            onClick={() => {
                              const today = new Date();
                              const lastWeek = new Date(
                                today.getTime() - 7 * 24 * 60 * 60 * 1000
                              );
                              setTransactionFilters((prev) => ({
                                ...prev,
                                dateFrom: lastWeek.toISOString().split("T")[0],
                                dateTo: today.toISOString().split("T")[0],
                              }));
                            }}
                            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200"
                          >
                            Last 7 Days
                          </button>
                          <button
                            onClick={() => {
                              const today = new Date();
                              const lastMonth = new Date(
                                today.getFullYear(),
                                today.getMonth() - 1,
                                today.getDate()
                              );
                              setTransactionFilters((prev) => ({
                                ...prev,
                                dateFrom: lastMonth.toISOString().split("T")[0],
                                dateTo: today.toISOString().split("T")[0],
                              }));
                            }}
                            className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200"
                          >
                            Last 30 Days
                          </button>
                          <button
                            onClick={resetTransactionFilters}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-300 px-3 py-1 rounded-md hover:bg-blue-50"
                          >
                            Reset All Filters
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Date From */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            From Date
                          </label>
                          <input
                            type="date"
                            value={transactionFilters.dateFrom}
                            onChange={(e) =>
                              setTransactionFilters((prev) => ({
                                ...prev,
                                dateFrom: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Date To */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            To Date
                          </label>
                          <input
                            type="date"
                            value={transactionFilters.dateTo}
                            onChange={(e) =>
                              setTransactionFilters((prev) => ({
                                ...prev,
                                dateTo: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Customer */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Name
                          </label>
                          <input
                            type="text"
                            placeholder="Search customer..."
                            value={transactionFilters.customer}
                            onChange={(e) =>
                              setTransactionFilters((prev) => ({
                                ...prev,
                                customer: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Payment Method */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Method
                          </label>
                          <select
                            value={transactionFilters.paymentMethod}
                            onChange={(e) =>
                              setTransactionFilters((prev) => ({
                                ...prev,
                                paymentMethod: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Methods</option>
                            <option value="cash">Cash</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="crypto">Crypto</option>
                          </select>
                        </div>

                        {/* Min Amount */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Min Amount (฿)
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            value={transactionFilters.minAmount}
                            onChange={(e) =>
                              setTransactionFilters((prev) => ({
                                ...prev,
                                minAmount: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Max Amount */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Amount (฿)
                          </label>
                          <input
                            type="number"
                            placeholder="999999"
                            value={transactionFilters.maxAmount}
                            onChange={(e) =>
                              setTransactionFilters((prev) => ({
                                ...prev,
                                maxAmount: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Category */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={transactionFilters.category}
                            onChange={(e) =>
                              setTransactionFilters((prev) => ({
                                ...prev,
                                category: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Product */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Name
                          </label>
                          <input
                            type="text"
                            placeholder="Search product..."
                            value={transactionFilters.product}
                            onChange={(e) =>
                              setTransactionFilters((prev) => ({
                                ...prev,
                                product: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Filter Summary */}
                      {filteredTransactions.length !== transactions.length && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-800">
                              Showing {filteredTransactions.length} of{" "}
                              {transactions.length} transactions
                            </span>
                            <span className="text-blue-600 font-medium">
                              Total: ฿
                              {filteredTransactions
                                .reduce(
                                  (sum, t) => sum + (t.total || t.amount || 0),
                                  0
                                )
                                .toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}
                            </span>
                          </div>
                        </div>
                      )}
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
                          {filteredTransactions.length === 0 ? (
                            <tr>
                              <td
                                colSpan="6"
                                className="px-6 py-5 text-center text-gray-500"
                              >
                                {transactions.length === 0
                                  ? "No transactions found"
                                  : "No transactions match your filters"}
                              </td>
                            </tr>
                          ) : (
                            filteredTransactions.map((transaction) => (
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
                                  <div className="flex space-x-3">
                                    <button
                                      onClick={() => {
                                        setSelectedTransactionDetails(
                                          transaction
                                        );
                                        setShowTransactionDetails(true);
                                      }}
                                      className="text-green-600 hover:text-green-900 transition-colors"
                                    >
                                      View Details
                                    </button>
                                    <button
                                      onClick={() =>
                                        deleteTransaction(
                                          transaction.transactionId,
                                          transaction
                                        )
                                      }
                                      disabled={
                                        deletingTransactionId ===
                                        transaction.transactionId
                                      }
                                      className="flex items-center text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                      title="Delete Transaction"
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      {deletingTransactionId ===
                                      transaction.transactionId
                                        ? "Deleting..."
                                        : "Delete"}
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
                                    if (!checkEditPermission()) return;
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

              {/* Pending Points Tab */}
              {activeTab === "pendingPoints" && (
                <div className="p-6">
                  <iframe
                    src="/admin/pending-points"
                    className="w-full h-[80vh] border-0 rounded-lg"
                    title="Pending Points Management"
                  />
                </div>
              )}

              {/* Category Order Tab */}
              {activeTab === "categoryOrder" && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Category Order
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={async () => {
                            setOrderingCategories(true);
                            try {
                              const latest =
                                await CategoryService.getAllCategories();
                              setOrderList(latest.map((c) => c.id));
                              setOrderDirty(false);
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setOrderingCategories(false);
                            }
                          }}
                          className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                        >
                          Reset
                        </button>
                        <button
                          disabled={savingCategoryOrder || !orderDirty}
                          onClick={async () => {
                            try {
                              setSavingCategoryOrder(true);
                              await CategoryService.saveCategoryOrder(
                                orderList
                              );
                              setOrderDirty(false);
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setSavingCategoryOrder(false);
                            }
                          }}
                          className={`px-4 py-1.5 text-sm rounded-md font-medium text-white transition ${
                            savingCategoryOrder || !orderDirty
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                        >
                          {savingCategoryOrder ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Drag with the ▲ ▼ buttons to reorder categories. Click
                      Save to persist.
                    </p>
                    <CategoryOrderList
                      categories={categories}
                      orderList={orderList}
                      setOrderList={setOrderList}
                      setOrderDirty={setOrderDirty}
                      ordering={orderingCategories}
                    />
                    {orderDirty && (
                      <p className="mt-2 text-xs text-amber-600">
                        Unsaved changes
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Admin Management Tab */}
              {activeTab === "adminManagement" && AdminAuth.isRootAdmin() && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Admin Management
                      </h3>
                      {AdminAuth.hasPermission("input") && (
                        <button
                          onClick={handleAddAdmin}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Admin
                        </button>
                      )}
                    </div>

                    {/* Admin List */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Permissions
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {admins.map((admin) => (
                            <tr key={admin.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {admin.email}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-wrap gap-1">
                                  {admin.permissions?.edit && (
                                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                      Edit
                                    </span>
                                  )}
                                  {admin.permissions?.delete && (
                                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                      Delete
                                    </span>
                                  )}
                                  {admin.permissions?.input && (
                                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                      Input
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    admin.isActive
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {admin.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {admin.createdAt
                                  ? new Date(
                                      admin.createdAt
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  {editingAdminId === admin.id ? (
                                    <>
                                      <button
                                        onClick={handleUpdateAdminPermissions}
                                        disabled={updatingAdminPermissions}
                                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                      >
                                        {updatingAdminPermissions
                                          ? "Saving..."
                                          : "Save"}
                                      </button>
                                      <button
                                        onClick={handleCancelEditAdmin}
                                        disabled={updatingAdminPermissions}
                                        className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleEditAdminPermissions(admin)
                                        }
                                        className="text-indigo-600 hover:text-indigo-900"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleChangeAdminPassword(admin)
                                        }
                                        className="text-blue-600 hover:text-blue-900"
                                      >
                                        Change Password
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleToggleAdminStatus(admin)
                                        }
                                        className={`${
                                          admin.isActive
                                            ? "text-yellow-600 hover:text-yellow-900"
                                            : "text-green-600 hover:text-green-900"
                                        }`}
                                      >
                                        {admin.isActive
                                          ? "Deactivate"
                                          : "Activate"}
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAdmin(admin)}
                                        className="text-red-600 hover:text-red-900"
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {admins.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No admins found. Add your first admin to get started.
                        </div>
                      )}
                    </div>

                    {/* Edit Permissions Inline Form */}
                    {editingAdminId && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                        <h4 className="text-md font-medium text-gray-900 mb-4">
                          Edit Permissions
                        </h4>
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingAdminPermissions.edit}
                              onChange={(e) =>
                                setEditingAdminPermissions({
                                  ...editingAdminPermissions,
                                  edit: e.target.checked,
                                })
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              <strong>Edit:</strong> Can modify customer,
                              product, and category data
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingAdminPermissions.delete}
                              onChange={(e) =>
                                setEditingAdminPermissions({
                                  ...editingAdminPermissions,
                                  delete: e.target.checked,
                                })
                              }
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              <strong>Delete:</strong> Can permanently remove
                              data from the system
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={editingAdminPermissions.input}
                              onChange={(e) =>
                                setEditingAdminPermissions({
                                  ...editingAdminPermissions,
                                  input: e.target.checked,
                                })
                              }
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              <strong>Input:</strong> Can create new customers,
                              products, and categories
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stock Management Tab */}
              {activeTab === "stockManagement" && (
                <div className="space-y-6">
                  {/* Stock Overview Sub-tab - Modern Professional Design */}
                  {stockActiveSubTab === "overview" && (
                    <div className="space-y-6">
                      {/* Header Section */}
                      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-bold mb-2">
                              Stock Overview
                            </h3>
                            <p className="text-green-100 opacity-90">
                              Real-time inventory management dashboard
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-3xl font-bold">
                                {products.length}
                              </div>
                              <div className="text-sm text-green-100 opacity-75">
                                Total Products
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                setStockCalculationsLoaded(false);
                                await loadAllStockCalculations();
                                await loadStockMovementsData();
                                console.log("🔄 Stock data refreshed manually");
                              }}
                              className="bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors duration-200 flex items-center space-x-2"
                              title="Refresh Stock Data"
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
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                              <span>Refresh</span>
                            </button>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        {stockCalculationsLoaded && (
                          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                              <div className="text-2xl font-bold text-green-200">
                                {
                                  products.filter((p) => {
                                    const alert = stockAlerts.find(
                                      (a) => a.productId === p.id && a.isActive
                                    );
                                    return (
                                      alert &&
                                      getCurrentStock(p) > alert.alertKioskLevel
                                    );
                                  }).length
                                }
                              </div>
                              <div className="text-sm text-green-100">
                                Well Stocked
                              </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                              <div className="text-2xl font-bold text-yellow-200">
                                {
                                  products.filter((p) => {
                                    const alert = stockAlerts.find(
                                      (a) => a.productId === p.id && a.isActive
                                    );
                                    return (
                                      alert &&
                                      getCurrentStock(p) <=
                                        alert.alertKioskLevel &&
                                      getCurrentStock(p) > alert.alertAdminLevel
                                    );
                                  }).length
                                }
                              </div>
                              <div className="text-sm text-green-100">
                                Low Stock
                              </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                              <div className="text-2xl font-bold text-red-200">
                                {
                                  products.filter((p) => {
                                    const alert = stockAlerts.find(
                                      (a) => a.productId === p.id && a.isActive
                                    );
                                    return (
                                      alert &&
                                      getCurrentStock(p) <=
                                        alert.alertAdminLevel
                                    );
                                  }).length
                                }
                              </div>
                              <div className="text-sm text-green-100">
                                Critical Stock
                              </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                              <div className="text-2xl font-bold">
                                {products.reduce(
                                  (total, p) => total + getCurrentStock(p),
                                  0
                                )}
                              </div>
                              <div className="text-sm text-green-100">
                                Total Units
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Loading State */}
                      {!stockCalculationsLoaded && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                          <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Loading Stock Data
                            </h3>
                            <p className="text-gray-600">
                              Calculating inventory levels for all products...
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Products Grid */}
                      {stockCalculationsLoaded && (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {products.map((product) => {
                            const totalStock = getCurrentStock(product);
                            const hasVariants =
                              product.variants &&
                              Array.isArray(product.variants) &&
                              product.variants.length > 0;

                            // Find stock alert for this product (if exists)
                            const stockAlert = stockAlerts.find(
                              (alert) =>
                                alert.productId === product.id && alert.isActive
                            );

                            // Determine stock status based on stock alert levels (if configured)
                            let stockStatus = null;
                            if (stockAlert) {
                              if (totalStock <= stockAlert.alertAdminLevel) {
                                stockStatus = "critical";
                              } else if (
                                totalStock <= stockAlert.alertKioskLevel
                              ) {
                                stockStatus = "warning";
                              } else {
                                stockStatus = "good";
                              }
                            }

                            return (
                              <div
                                key={product.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                              >
                                {/* Product Card Header */}
                                <div className="p-6 border-b border-gray-100">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                                        {product.name}
                                      </h4>
                                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                          {product.categoryName ||
                                            "Uncategorized"}
                                        </span>
                                        {product.subcategoryName && (
                                          <span className="px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs">
                                            {product.subcategoryName}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Stock Status Indicator - Only show if stock alert is configured */}
                                    <div className="text-right">
                                      <div className="text-lg font-semibold text-gray-900 mb-1">
                                        {totalStock} units
                                      </div>
                                      {stockStatus && (
                                        <div
                                          className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                                            stockStatus === "good"
                                              ? "bg-green-100 text-green-700"
                                              : stockStatus === "warning"
                                              ? "bg-yellow-100 text-yellow-700"
                                              : "bg-red-100 text-red-700"
                                          }`}
                                        >
                                          <div
                                            className={`w-1.5 h-1.5 rounded-full ${
                                              stockStatus === "good"
                                                ? "bg-green-500"
                                                : stockStatus === "warning"
                                                ? "bg-yellow-500"
                                                : "bg-red-500"
                                            }`}
                                          ></div>
                                          <span>
                                            {stockStatus === "good"
                                              ? "Well Stocked"
                                              : stockStatus === "warning"
                                              ? "Low Stock"
                                              : "Critical"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Product Details */}
                                <div className="p-6">
                                  {/* Product Info */}
                                  {(hasVariants || stockAlert) && (
                                    <div className="space-y-3 mb-4">
                                      {hasVariants && (
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">
                                            Product Type:
                                          </span>
                                          <span className="font-medium">
                                            {product.variants.length} Variant
                                            {product.variants.length > 1
                                              ? "s"
                                              : ""}
                                          </span>
                                        </div>
                                      )}
                                      {stockAlert && (
                                        <div className="flex justify-between text-sm">
                                          <span className="text-gray-600">
                                            Alert Levels:
                                          </span>
                                          <span className="text-xs text-gray-600">
                                            Kiosk: {stockAlert.alertKioskLevel}{" "}
                                            • Admin:{" "}
                                            {stockAlert.alertAdminLevel}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Variants Preview (if any) */}
                                  {hasVariants && (
                                    <div className="mb-4">
                                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                                        Variants:
                                      </h5>
                                      <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {product.variants
                                          .slice(0, 3)
                                          .map((variant) => {
                                            if (
                                              variant.options &&
                                              Array.isArray(variant.options)
                                            ) {
                                              return variant.options
                                                .slice(0, 2)
                                                .map((option) => {
                                                  const variantId = `${variant.id}-${option.id}`;
                                                  const variantStock =
                                                    getCurrentStock(
                                                      product,
                                                      variantId
                                                    );
                                                  return (
                                                    <div
                                                      key={`${variant.id}-${option.id}`}
                                                      className="flex justify-between items-center text-xs bg-gray-50 rounded p-2"
                                                    >
                                                      <span className="text-gray-700 truncate">
                                                        {variant.variantName}:{" "}
                                                        {option.name}
                                                      </span>
                                                      <span
                                                        className={`font-medium ${
                                                          variantStock > 0
                                                            ? "text-green-600"
                                                            : "text-red-600"
                                                        }`}
                                                      >
                                                        {variantStock}
                                                      </span>
                                                    </div>
                                                  );
                                                });
                                            }
                                            return (
                                              <div
                                                key={variant.id}
                                                className="flex justify-between items-center text-xs bg-gray-50 rounded p-2"
                                              >
                                                <span className="text-gray-700 truncate">
                                                  {variant.name ||
                                                    `Variant ${variant.id}`}
                                                </span>
                                                <span
                                                  className={`font-medium ${
                                                    getCurrentStock(
                                                      product,
                                                      variant.id
                                                    ) > 0
                                                      ? "text-green-600"
                                                      : "text-red-600"
                                                  }`}
                                                >
                                                  {getCurrentStock(
                                                    product,
                                                    variant.id
                                                  )}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        {product.variants.length > 3 && (
                                          <div className="text-xs text-gray-500 text-center py-1">
                                            +{product.variants.length - 3} more
                                            variants
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Action Button */}
                                  <button
                                    onClick={() => {
                                      setSelectedStockDetail({
                                        product,
                                        totalStock,
                                        stockStatus,
                                        hasVariants,
                                      });
                                      setShowStockDetailModal(true);
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
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
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                      />
                                    </svg>
                                    <span>View Stock Details</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Empty State */}
                      {stockCalculationsLoaded && products.length === 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                          <div className="text-center">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400 mb-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              No Products Found
                            </h3>
                            <p className="text-gray-600 mb-6">
                              Get started by adding some products to your
                              inventory.
                            </p>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                              Add First Product
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stock Movements Sub-tab - Updated for StockMovement system */}
                  {stockActiveSubTab === "movements" && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Stock Movements
                        </h3>
                        <div className="text-sm text-gray-600">
                          Track all stock transactions (purchasing & sales)
                        </div>
                      </div>

                      {/* Purchase Orders Section */}
                      <div className="mb-8">
                        <h4 className="text-md font-medium text-gray-900 mb-4">
                          Recent Purchase Orders
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-blue-50">
                                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                  PO ID
                                </th>
                                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                  Date & Time
                                </th>
                                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                  Supplier
                                </th>
                                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                  Items
                                </th>
                                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                  Total Qty
                                </th>
                                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                  Total Amount
                                </th>
                                <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {stockPurchases.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan="7"
                                    className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                                  >
                                    No purchase orders found.
                                  </td>
                                </tr>
                              ) : (
                                stockPurchases.slice(0, 10).map((purchase) => (
                                  <tr
                                    key={purchase.id}
                                    className="hover:bg-gray-50"
                                  >
                                    <td className="border border-gray-300 px-4 py-2">
                                      <div className="font-mono text-sm">
                                        {purchase.id.slice(-8)}
                                      </div>
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                      <div className="text-sm">
                                        <div className="font-medium">
                                          {purchase.createdAt
                                            ? new Date(
                                                purchase.createdAt.seconds *
                                                  1000
                                              ).toLocaleDateString()
                                            : "N/A"}
                                        </div>
                                        <div className="text-gray-500">
                                          {purchase.createdAt
                                            ? new Date(
                                                purchase.createdAt.seconds *
                                                  1000
                                              ).toLocaleTimeString()
                                            : "N/A"}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                      <div className="font-medium">
                                        {purchase.supplier}
                                      </div>
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                      <div className="font-medium">
                                        {purchase.totalItems}
                                      </div>
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                      <div className="font-medium text-green-600">
                                        {purchase.totalQuantity}
                                      </div>
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                      <div className="font-medium">
                                        ฿
                                        {purchase.totalAmount
                                          ? purchase.totalAmount.toFixed(2)
                                          : "0.00"}
                                      </div>
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        {purchase.status || "Completed"}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Individual Stock Movements Table */}
                      <div className="mb-4">
                        <h4 className="text-md font-medium text-gray-900 mb-4">
                          Individual Stock Movements
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                Date & Time
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                Product
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                Type
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                Quantity
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                Price
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                Supplier/Source
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                Notes
                              </th>
                              <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                                PO ID
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {stockMovements.length === 0 ? (
                              <tr>
                                <td
                                  colSpan="8"
                                  className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                                >
                                  No stock movements found. Use
                                  &quot;Purchasing&quot; tab to add stock.
                                </td>
                              </tr>
                            ) : (
                              stockMovements.map((movement) => (
                                <tr
                                  key={movement.id}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="border border-gray-300 px-4 py-2">
                                    <div className="text-sm">
                                      <div className="font-medium">
                                        {movement.createdAt
                                          ? new Date(
                                              movement.createdAt.seconds * 1000
                                            ).toLocaleDateString()
                                          : "N/A"}
                                      </div>
                                      <div className="text-gray-500">
                                        {movement.createdAt
                                          ? new Date(
                                              movement.createdAt.seconds * 1000
                                            ).toLocaleTimeString()
                                          : "N/A"}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <div className="text-sm">
                                      <div className="font-medium">
                                        {movement.productName}
                                      </div>
                                      {movement.variantName && (
                                        <div className="text-gray-500">
                                          {movement.variantName}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <span
                                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        movement.status === "purchasing"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {movement.status === "purchasing"
                                        ? "Stock In"
                                        : "Stock Out"}
                                    </span>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <div
                                      className={`font-medium ${
                                        movement.status === "purchasing"
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {movement.status === "purchasing"
                                        ? "+"
                                        : "-"}
                                      {movement.quantity}
                                    </div>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <div className="font-medium">
                                      ฿
                                      {movement.price
                                        ? movement.price.toFixed(2)
                                        : "0.00"}
                                    </div>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <div className="text-sm">
                                      {movement.supplier || "N/A"}
                                    </div>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <div className="text-sm text-gray-600">
                                      {movement.notes || "-"}
                                    </div>
                                  </td>
                                  <td className="border border-gray-300 px-4 py-2">
                                    <div className="text-xs font-mono text-blue-600">
                                      {movement.purchaseOrderId
                                        ? movement.purchaseOrderId.slice(-8)
                                        : "-"}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Summary Statistics */}
                      {stockMovements.length > 0 && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-sm font-medium text-green-800">
                              Total Purchasing
                            </div>
                            <div className="text-lg font-bold text-green-900">
                              {stockMovements
                                .filter((m) => m.status === "purchasing")
                                .reduce(
                                  (sum, m) => sum + (m.quantity || 0),
                                  0
                                )}{" "}
                              items
                            </div>
                          </div>
                          <div className="bg-red-50 p-4 rounded-lg">
                            <div className="text-sm font-medium text-red-800">
                              Total Sales
                            </div>
                            <div className="text-lg font-bold text-red-900">
                              {stockMovements
                                .filter((m) => m.status === "sales")
                                .reduce(
                                  (sum, m) => sum + (m.quantity || 0),
                                  0
                                )}{" "}
                              items
                            </div>
                          </div>
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-sm font-medium text-blue-800">
                              Total Value
                            </div>
                            <div className="text-lg font-bold text-blue-900">
                              ฿
                              {stockMovements
                                .reduce(
                                  (sum, m) =>
                                    sum + (m.quantity || 0) * (m.price || 0),
                                  0
                                )
                                .toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Purchasing Sub-tab */}
                  {stockActiveSubTab === "purchasing" && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Purchasing Management
                        </h3>
                        <button
                          onClick={handleAddPurchasing}
                          disabled={!checkInputPermission()}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
                        >
                          <Package className="w-4 h-4" />
                          Add Purchase
                        </button>
                      </div>

                      {/* Add Purchasing Form */}
                      {showPurchasingForm && (
                        <div className="bg-gray-50 p-6 rounded-lg mb-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">
                              Add New Purchase
                            </h4>
                            <button
                              onClick={handleCancelPurchasing}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <form
                            onSubmit={handleSavePurchasing}
                            className="space-y-6"
                          >
                            {/* Supplier, Notes, Date and Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Supplier Name *
                                </label>
                                <input
                                  type="text"
                                  value={purchasingSupplier}
                                  onChange={(e) =>
                                    setPurchasingSupplier(e.target.value)
                                  }
                                  placeholder="Enter supplier name"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Notes
                                </label>
                                <input
                                  type="text"
                                  value={purchasingNotes}
                                  onChange={(e) =>
                                    setPurchasingNotes(e.target.value)
                                  }
                                  placeholder="Optional notes"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Purchase Date *
                                </label>
                                <input
                                  type="date"
                                  value={purchasingDate}
                                  onChange={(e) =>
                                    setPurchasingDate(e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Purchase Time *
                                </label>
                                <input
                                  type="time"
                                  value={purchasingTime}
                                  onChange={(e) =>
                                    setPurchasingTime(e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                  required
                                />
                              </div>
                            </div>

                            {/* Products */}
                            <div>
                              <div className="flex justify-between items-center mb-4">
                                <h5 className="text-md font-medium text-gray-900">
                                  Products
                                </h5>
                                <button
                                  type="button"
                                  onClick={addProductToPurchasing}
                                  className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                                >
                                  + Add Product
                                </button>
                              </div>

                              <div className="space-y-4">
                                {console.log(
                                  "Rendering purchasing products:",
                                  purchasingProducts
                                )}
                                {purchasingProducts.map((product, index) => (
                                  <div
                                    key={index}
                                    className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-gray-200 rounded-lg bg-white relative"
                                  >
                                    {/* Remove Button */}
                                    {purchasingProducts.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeProductFromPurchasing(index)
                                        }
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}

                                    {/* Product Search */}
                                    <div className="md:col-span-2 relative">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Product
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Search products..."
                                        value={product.productSearch || ""}
                                        onChange={(e) => {
                                          console.log(
                                            "Input onChange - Current product.productSearch:",
                                            product.productSearch
                                          );
                                          console.log(
                                            "Input onChange - New value:",
                                            e.target.value
                                          );
                                          updatePurchasingProductMultiple(
                                            index,
                                            {
                                              productSearch: e.target.value,
                                              showProductDropdown: true,
                                            }
                                          );
                                        }}
                                        onFocus={() => {
                                          console.log(
                                            "Input onFocus - Current product.productSearch:",
                                            product.productSearch
                                          );
                                          updatePurchasingProduct(
                                            index,
                                            "showProductDropdown",
                                            true
                                          );
                                        }}
                                        onBlur={() => {
                                          console.log(
                                            "Input onBlur - Current product.productSearch:",
                                            product.productSearch
                                          );
                                          // Use a longer timeout to ensure clicks register
                                          setTimeout(
                                            () =>
                                              updatePurchasingProduct(
                                                index,
                                                "showProductDropdown",
                                                false
                                              ),
                                            500
                                          );
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                      />

                                      {/* Product Dropdown */}
                                      {product.showProductDropdown && (
                                        <div className="product-dropdown absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                          {products
                                            .filter(
                                              (p) =>
                                                !product.productSearch ||
                                                `${
                                                  p.categoryName ||
                                                  "Uncategorized"
                                                } - ${
                                                  p.subcategoryName ||
                                                  "No Subcategory"
                                                } - ${p.name}`
                                                  .toLowerCase()
                                                  .includes(
                                                    product.productSearch.toLowerCase()
                                                  )
                                            )
                                            .slice(0, 50)
                                            .map((p) => {
                                              if (
                                                p.variants &&
                                                Array.isArray(p.variants) &&
                                                p.variants.length > 0
                                              ) {
                                                return p.variants
                                                  .map((variant) => {
                                                    if (
                                                      variant.options &&
                                                      Array.isArray(
                                                        variant.options
                                                      )
                                                    ) {
                                                      return variant.options.map(
                                                        (option) => (
                                                          <div
                                                            key={`${p.id}-${variant.id}-${option.id}`}
                                                            onMouseDown={(
                                                              e
                                                            ) => {
                                                              e.preventDefault();
                                                              e.stopPropagation();
                                                              console.log(
                                                                "Purchasing: Selecting product variant:",
                                                                p.name,
                                                                variant.variantName,
                                                                option.name
                                                              );
                                                              updatePurchasingProductMultiple(
                                                                index,
                                                                {
                                                                  productId:
                                                                    p.id,
                                                                  productName:
                                                                    p.name,
                                                                  variantId: `${variant.id}-${option.id}`,
                                                                  variantName: `${variant.variantName}: ${option.name}`,
                                                                  productSearch: `${
                                                                    p.categoryName ||
                                                                    "Uncategorized"
                                                                  } - ${
                                                                    p.subcategoryName ||
                                                                    "No Subcategory"
                                                                  } - ${
                                                                    p.name
                                                                  } - ${
                                                                    variant.variantName
                                                                  } - ${
                                                                    option.name
                                                                  }`,
                                                                  showProductDropdown: false,
                                                                }
                                                              );
                                                            }}
                                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100"
                                                          >
                                                            <div className="font-medium text-gray-900">
                                                              {p.categoryName ||
                                                                "Uncategorized"}{" "}
                                                              -{" "}
                                                              {p.subcategoryName ||
                                                                "No Subcategory"}{" "}
                                                              - {p.name}
                                                            </div>
                                                            <div className="text-xs text-blue-600">
                                                              {
                                                                variant.variantName
                                                              }
                                                              : {option.name}
                                                            </div>
                                                          </div>
                                                        )
                                                      );
                                                    }
                                                    return (
                                                      <div
                                                        key={`${p.id}-${variant.id}`}
                                                        onMouseDown={() => {
                                                          console.log(
                                                            "Purchasing: Selecting product variant (no options):",
                                                            p.name,
                                                            variant.name
                                                          );
                                                          updatePurchasingProductMultiple(
                                                            index,
                                                            {
                                                              productId: p.id,
                                                              productName:
                                                                p.name,
                                                              variantId:
                                                                variant.id,
                                                              variantName:
                                                                variant.name ||
                                                                `Variant ${variant.id}`,
                                                              productSearch: `${
                                                                p.categoryName ||
                                                                "Uncategorized"
                                                              } - ${
                                                                p.subcategoryName ||
                                                                "No Subcategory"
                                                              } - ${p.name} - ${
                                                                variant.name ||
                                                                "Variant"
                                                              }`,
                                                              showProductDropdown: false,
                                                            }
                                                          );
                                                        }}
                                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100"
                                                      >
                                                        <div className="font-medium text-gray-900">
                                                          {p.categoryName ||
                                                            "Uncategorized"}{" "}
                                                          -{" "}
                                                          {p.subcategoryName ||
                                                            "No Subcategory"}{" "}
                                                          - {p.name}
                                                        </div>
                                                        <div className="text-xs text-blue-600">
                                                          {variant.name ||
                                                            "Variant"}
                                                        </div>
                                                      </div>
                                                    );
                                                  })
                                                  .flat();
                                              } else {
                                                return (
                                                  <div
                                                    key={p.id}
                                                    onMouseDown={(e) => {
                                                      e.preventDefault();
                                                      e.stopPropagation();
                                                      console.log(
                                                        "Purchasing: Selecting product (no variants):",
                                                        p.name
                                                      );
                                                      updatePurchasingProductMultiple(
                                                        index,
                                                        {
                                                          productId: p.id,
                                                          productName: p.name,
                                                          variantId: "",
                                                          variantName: "",
                                                          productSearch: `${
                                                            p.categoryName ||
                                                            "Uncategorized"
                                                          } - ${
                                                            p.subcategoryName ||
                                                            "No Subcategory"
                                                          } - ${p.name}`,
                                                          showProductDropdown: false,
                                                        }
                                                      );
                                                    }}
                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100"
                                                  >
                                                    <div className="font-medium text-gray-900">
                                                      {p.categoryName ||
                                                        "Uncategorized"}{" "}
                                                      -{" "}
                                                      {p.subcategoryName ||
                                                        "No Subcategory"}{" "}
                                                      - {p.name}
                                                    </div>
                                                  </div>
                                                );
                                              }
                                            })
                                            .flat()}

                                          {product.productSearch &&
                                            products.filter((p) =>
                                              `${
                                                p.categoryName ||
                                                "Uncategorized"
                                              } - ${
                                                p.subcategoryName ||
                                                "No Subcategory"
                                              } - ${p.name}`
                                                .toLowerCase()
                                                .includes(
                                                  product.productSearch.toLowerCase()
                                                )
                                            ).length === 0 && (
                                              <div className="px-3 py-2 text-gray-500 text-sm">
                                                No products found matching
                                                &quot;{product.productSearch}
                                                &quot;
                                              </div>
                                            )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Quantity */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity
                                      </label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={product.quantity}
                                        onChange={(e) =>
                                          updatePurchasingProduct(
                                            index,
                                            "quantity",
                                            parseInt(e.target.value) || 0
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                      />
                                    </div>

                                    {/* Buy Price */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Buy Price (฿)
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={product.buyPrice}
                                        onChange={(e) =>
                                          updatePurchasingProduct(
                                            index,
                                            "buyPrice",
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                      />
                                    </div>

                                    {/* Total */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Total
                                      </label>
                                      <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm font-medium">
                                        ฿
                                        {(
                                          (product.quantity || 0) *
                                          (product.buyPrice || 0)
                                        ).toFixed(2)}
                                      </div>
                                    </div>

                                    {/* Current Stock */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Current Stock
                                      </label>
                                      <div className="px-3 py-2 bg-blue-50 border border-gray-300 rounded-md text-sm font-medium text-blue-700">
                                        {product.productId
                                          ? (() => {
                                              const selectedProduct =
                                                products.find(
                                                  (p) =>
                                                    p.id === product.productId
                                                );
                                              return selectedProduct
                                                ? getCurrentStock(
                                                    selectedProduct
                                                  )
                                                : 0;
                                            })()
                                          : 0}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-4 pt-4 border-t">
                              <button
                                type="button"
                                onClick={handleCancelPurchasing}
                                disabled={isPurchasingSaving}
                                className={`px-4 py-2 rounded-md ${
                                  isPurchasingSaving
                                    ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                                    : "text-gray-700 bg-gray-200 hover:bg-gray-300"
                                }`}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isPurchasingSaving}
                                className={`px-4 py-2 text-white rounded-md flex items-center space-x-2 ${
                                  isPurchasingSaving
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700"
                                }`}
                              >
                                {isPurchasingSaving && (
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
                                <span>
                                  {isPurchasingSaving
                                    ? "Saving..."
                                    : "Save Purchase"}
                                </span>
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Recent Purchases */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">
                          Recent Purchases
                        </h4>
                        <div className="space-y-4">
                          {(() => {
                            // Group purchases by purchase order (orderId or date+supplier+time combination)
                            const purchaseOrders = stockMovements
                              .filter((m) => m.status === "purchasing")
                              .reduce((orders, movement) => {
                                // Use orderId if available, otherwise create a key from date+supplier+time
                                const orderKey =
                                  movement.orderId ||
                                  `${movement.supplier}-${movement.date}-${movement.time}`;

                                if (!orders[orderKey]) {
                                  orders[orderKey] = {
                                    id: orderKey,
                                    orderId: movement.orderId,
                                    supplier: movement.supplier,
                                    date: movement.date,
                                    time: movement.time,
                                    createdAt: movement.createdAt,
                                    items: [],
                                    totalValue: 0,
                                  };
                                }

                                orders[orderKey].items.push(movement);
                                orders[orderKey].totalValue +=
                                  (movement.quantity || 0) *
                                  (movement.price || 0);

                                return orders;
                              }, {});

                            const sortedOrders = Object.values(purchaseOrders)
                              .sort((a, b) => {
                                const dateA = a.createdAt
                                  ? new Date(a.createdAt.seconds * 1000)
                                  : new Date(a.date + " " + a.time);
                                const dateB = b.createdAt
                                  ? new Date(b.createdAt.seconds * 1000)
                                  : new Date(b.date + " " + b.time);
                                return dateB - dateA;
                              })
                              .slice(0, 10);

                            if (sortedOrders.length === 0) {
                              return (
                                <div className="border border-gray-300 rounded-lg p-8 text-center text-gray-500">
                                  No purchases found. Click &quot;Add
                                  Purchase&quot; to get started.
                                </div>
                              );
                            }

                            return sortedOrders.map((order) => (
                              <div
                                key={order.id}
                                className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                              >
                                <div className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-4 mb-2">
                                        <h5 className="font-semibold text-gray-900">
                                          Purchase Order #
                                          {order.orderId ||
                                            order.id.substring(0, 8)}
                                        </h5>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          {order.items.length} item
                                          {order.items.length !== 1 ? "s" : ""}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                        <div>
                                          <span className="font-medium">
                                            Date:
                                          </span>
                                          <br />
                                          {order.createdAt
                                            ? new Date(
                                                order.createdAt.seconds * 1000
                                              ).toLocaleDateString()
                                            : order.date || "N/A"}
                                        </div>
                                        <div>
                                          <span className="font-medium">
                                            Time:
                                          </span>
                                          <br />
                                          {order.createdAt
                                            ? new Date(
                                                order.createdAt.seconds * 1000
                                              ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })
                                            : order.time || "N/A"}
                                        </div>
                                        <div>
                                          <span className="font-medium">
                                            Supplier:
                                          </span>
                                          <br />
                                          {order.supplier}
                                        </div>
                                        <div>
                                          <span className="font-medium">
                                            Total Value:
                                          </span>
                                          <br />
                                          <span className="font-semibold text-green-600">
                                            ฿{order.totalValue.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => {
                                        setSelectedPurchaseOrder(order);
                                        setShowPurchaseDetails(true);
                                      }}
                                      className="ml-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                      View Details
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stock Alerts Sub-tab */}
                  {stockActiveSubTab === "alerts" && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Stock Alerts Management
                        </h3>
                      </div>

                      {/* Create New Alert Form */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4">
                          Create New Stock Alert
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                          {/* Product Selection - Searchable Dropdown */}
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Select Product
                            </label>
                            <input
                              type="text"
                              placeholder="Search products..."
                              value={alertProductSearch}
                              onChange={(e) => {
                                setAlertProductSearch(e.target.value);
                                setShowAlertProductDropdown(true);
                              }}
                              onFocus={() => setShowAlertProductDropdown(true)}
                              onBlur={() => {
                                // Delay hiding to allow click events to register
                                setTimeout(
                                  () => setShowAlertProductDropdown(false),
                                  150
                                );
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />

                            {/* Dropdown List */}
                            {showAlertProductDropdown && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {products
                                  .filter((p) => {
                                    if (!alertProductSearch) return true;
                                    const searchTerm =
                                      alertProductSearch.toLowerCase();
                                    const productMatch = `${
                                      p.categoryName || "Uncategorized"
                                    } - ${
                                      p.subcategoryName || "No Subcategory"
                                    } - ${p.name}`
                                      .toLowerCase()
                                      .includes(searchTerm);

                                    // Also search in variants
                                    let variantMatch = false;
                                    if (
                                      p.variants &&
                                      Array.isArray(p.variants)
                                    ) {
                                      variantMatch = p.variants.some(
                                        (variant) => {
                                          const variantNameMatch = (
                                            variant.variantName || ""
                                          )
                                            .toLowerCase()
                                            .includes(searchTerm);
                                          const optionsMatch =
                                            variant.options &&
                                            Array.isArray(variant.options) &&
                                            variant.options.some((option) =>
                                              (option.name || "")
                                                .toLowerCase()
                                                .includes(searchTerm)
                                            );
                                          return (
                                            variantNameMatch || optionsMatch
                                          );
                                        }
                                      );
                                    }

                                    return productMatch || variantMatch;
                                  })
                                  .slice(0, 50)
                                  .map((p) => {
                                    if (
                                      p.variants &&
                                      Array.isArray(p.variants) &&
                                      p.variants.length > 0
                                    ) {
                                      return p.variants
                                        .map((variant) => {
                                          if (
                                            variant.options &&
                                            Array.isArray(variant.options)
                                          ) {
                                            return variant.options.map(
                                              (option) => (
                                                <div
                                                  key={`${p.id}-${variant.id}-${option.id}`}
                                                  onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    console.log(
                                                      "Stock Alert: Selecting product variant:",
                                                      p.name,
                                                      variant.variantName,
                                                      option.name
                                                    );
                                                    const productWithVariant = {
                                                      ...p,
                                                      variantId: `${variant.id}-${option.id}`,
                                                      variantName: `${variant.variantName}: ${option.name}`,
                                                      selectedVariant: variant,
                                                      selectedOption: option,
                                                    };
                                                    setSelectedProductForAlert(
                                                      productWithVariant
                                                    );
                                                    setAlertProductSearch(
                                                      `${
                                                        p.categoryName ||
                                                        "Uncategorized"
                                                      } - ${
                                                        p.subcategoryName ||
                                                        "No Subcategory"
                                                      } - ${p.name} - ${
                                                        variant.variantName
                                                      } - ${option.name}`
                                                    );
                                                    setShowAlertProductDropdown(
                                                      false
                                                    );
                                                  }}
                                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100"
                                                >
                                                  <div className="font-medium text-gray-900">
                                                    {p.categoryName ||
                                                      "Uncategorized"}{" "}
                                                    -{" "}
                                                    {p.subcategoryName ||
                                                      "No Subcategory"}{" "}
                                                    - {p.name}
                                                  </div>
                                                  <div className="text-xs text-blue-600">
                                                    {variant.variantName}:{" "}
                                                    {option.name}
                                                  </div>
                                                  <div className="text-xs text-gray-500">
                                                    Current Stock:{" "}
                                                    {stockCalculationsLoaded
                                                      ? getCurrentStock(
                                                          p,
                                                          `${variant.id}-${option.id}`
                                                        )
                                                      : "Loading..."}
                                                  </div>
                                                </div>
                                              )
                                            );
                                          }
                                          return (
                                            <div
                                              key={`${p.id}-${variant.id}`}
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                console.log(
                                                  "Stock Alert: Selecting product variant (no options):",
                                                  p.name,
                                                  variant.name
                                                );
                                                const productWithVariant = {
                                                  ...p,
                                                  variantId: variant.id,
                                                  variantName:
                                                    variant.name ||
                                                    `Variant ${variant.id}`,
                                                  selectedVariant: variant,
                                                };
                                                setSelectedProductForAlert(
                                                  productWithVariant
                                                );
                                                setAlertProductSearch(
                                                  `${
                                                    p.categoryName ||
                                                    "Uncategorized"
                                                  } - ${
                                                    p.subcategoryName ||
                                                    "No Subcategory"
                                                  } - ${p.name} - ${
                                                    variant.name || "Variant"
                                                  }`
                                                );
                                                setShowAlertProductDropdown(
                                                  false
                                                );
                                              }}
                                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100"
                                            >
                                              <div className="font-medium text-gray-900">
                                                {p.categoryName ||
                                                  "Uncategorized"}{" "}
                                                -{" "}
                                                {p.subcategoryName ||
                                                  "No Subcategory"}{" "}
                                                - {p.name}
                                              </div>
                                              <div className="text-xs text-blue-600">
                                                {variant.name || "Variant"}
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                Current Stock:{" "}
                                                {stockCalculationsLoaded
                                                  ? getCurrentStock(
                                                      p,
                                                      variant.id
                                                    )
                                                  : "Loading..."}
                                              </div>
                                            </div>
                                          );
                                        })
                                        .flat();
                                    } else {
                                      return (
                                        <div
                                          key={p.id}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log(
                                              "Stock Alert: Selecting product (no variants):",
                                              p.name
                                            );
                                            setSelectedProductForAlert(p);
                                            setAlertProductSearch(
                                              `${
                                                p.categoryName ||
                                                "Uncategorized"
                                              } - ${
                                                p.subcategoryName ||
                                                "No Subcategory"
                                              } - ${p.name}`
                                            );
                                            setShowAlertProductDropdown(false);
                                          }}
                                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100"
                                        >
                                          <div className="font-medium text-gray-900">
                                            {p.categoryName || "Uncategorized"}{" "}
                                            -{" "}
                                            {p.subcategoryName ||
                                              "No Subcategory"}{" "}
                                            - {p.name}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            Current Stock:{" "}
                                            {stockCalculationsLoaded
                                              ? getCurrentStock(p)
                                              : "Loading..."}
                                          </div>
                                        </div>
                                      );
                                    }
                                  })
                                  .flat()}

                                {alertProductSearch &&
                                  products.filter((p) =>
                                    `${p.categoryName || "Uncategorized"} - ${
                                      p.subcategoryName || "No Subcategory"
                                    } - ${p.name}`
                                      .toLowerCase()
                                      .includes(
                                        alertProductSearch.toLowerCase()
                                      )
                                  ).length === 0 && (
                                    <div className="px-3 py-2 text-gray-500 text-sm">
                                      No products found matching &quot;
                                      {alertProductSearch}&quot;
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>

                          {/* Kiosk Alert Level */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Alert at Kiosk (qty)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={alertKioskLevel}
                              onChange={(e) =>
                                setAlertKioskLevel(e.target.value)
                              }
                              placeholder="e.g., 5"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                          </div>

                          {/* Admin Alert Level */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Alert at Admin (qty)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={alertAdminLevel}
                              onChange={(e) =>
                                setAlertAdminLevel(e.target.value)
                              }
                              placeholder="e.g., 2"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            />
                          </div>

                          {/* Stock Zero Action */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              When Stock = 0
                            </label>
                            <select
                              value={stockZeroAction}
                              onChange={(e) =>
                                setStockZeroAction(e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            >
                              <option value="disable">Disable Product</option>
                              <option value="keepVisible">
                                Keep Visible (Can Order)
                              </option>
                            </select>
                          </div>

                          {/* Create Button */}
                          <div className="flex items-end">
                            <button
                              onClick={createStockAlert}
                              disabled={
                                !selectedProductForAlert ||
                                !alertKioskLevel ||
                                !alertAdminLevel
                              }
                              className={`w-full px-4 py-2 text-white text-sm font-medium rounded-md ${
                                !selectedProductForAlert ||
                                !alertKioskLevel ||
                                !alertAdminLevel
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-yellow-600 hover:bg-yellow-700"
                              }`}
                            >
                              Create Alert
                            </button>
                          </div>
                        </div>

                        {/* Current Stock Display */}
                        {selectedProductForAlert && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800">
                              <strong>Current Stock:</strong>{" "}
                              {stockCalculationsLoaded
                                ? getCurrentStock(
                                    selectedProductForAlert,
                                    selectedProductForAlert?.variantId
                                  )
                                : "Loading..."}{" "}
                              units
                              {selectedProductForAlert.variantName && (
                                <span className="block text-xs text-blue-600 mt-1">
                                  Variant: {selectedProductForAlert.variantName}
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Edit Alert Form */}
                      {showEditAlertForm && (
                        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-md font-medium text-gray-900">
                              Edit Stock Alert
                            </h4>
                            <button
                              onClick={cancelEditAlert}
                              className="text-gray-600 hover:text-gray-800"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {/* Product Selection - Searchable Dropdown */}
                            <div className="relative">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Product
                              </label>
                              <input
                                type="text"
                                placeholder="Search products..."
                                value={editAlertProductSearch}
                                onChange={(e) => {
                                  setEditAlertProductSearch(e.target.value);
                                  setShowEditAlertProductDropdown(true);
                                }}
                                onFocus={() =>
                                  setShowEditAlertProductDropdown(true)
                                }
                                onBlur={() => {
                                  setTimeout(
                                    () =>
                                      setShowEditAlertProductDropdown(false),
                                    200
                                  );
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />

                              {/* Dropdown */}
                              {showEditAlertProductDropdown &&
                                editAlertProductSearch && (
                                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                    {products
                                      .filter((p) => {
                                        if (!editAlertProductSearch)
                                          return true;
                                        const searchTerm =
                                          editAlertProductSearch.toLowerCase();
                                        return `${
                                          p.categoryName || "Uncategorized"
                                        } - ${
                                          p.subcategoryName || "No Subcategory"
                                        } - ${p.name}`
                                          .toLowerCase()
                                          .includes(searchTerm);
                                      })
                                      .slice(0, 10)
                                      .map((p) => {
                                        if (
                                          p.variants &&
                                          Array.isArray(p.variants) &&
                                          p.variants.length > 0
                                        ) {
                                          // Product with variants
                                          return p.variants.map((variant) => {
                                            if (
                                              variant.options &&
                                              Array.isArray(variant.options)
                                            ) {
                                              return variant.options.map(
                                                (option) => (
                                                  <div
                                                    key={`${p.id}-${variant.id}-${option.id}`}
                                                    onMouseDown={() => {
                                                      setEditSelectedProductForAlert(
                                                        {
                                                          ...p,
                                                          selectedVariantId: `${variant.id}-${option.id}`,
                                                          selectedVariantName: `${variant.variantName}: ${option.name}`,
                                                        }
                                                      );
                                                      setEditAlertProductSearch(
                                                        `${
                                                          p.categoryName ||
                                                          "Uncategorized"
                                                        } - ${
                                                          p.subcategoryName ||
                                                          "No Subcategory"
                                                        } - ${p.name} - ${
                                                          variant.variantName
                                                        } - ${option.name}`
                                                      );
                                                      setShowEditAlertProductDropdown(
                                                        false
                                                      );
                                                    }}
                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100"
                                                  >
                                                    <div className="font-medium text-gray-900">
                                                      {p.categoryName ||
                                                        "Uncategorized"}{" "}
                                                      -{" "}
                                                      {p.subcategoryName ||
                                                        "No Subcategory"}{" "}
                                                      - {p.name}
                                                    </div>
                                                    <div className="text-xs text-blue-600">
                                                      {variant.variantName}:{" "}
                                                      {option.name}
                                                    </div>
                                                  </div>
                                                )
                                              );
                                            }
                                            return (
                                              <div
                                                key={`${p.id}-${variant.id}`}
                                                onMouseDown={() => {
                                                  setEditSelectedProductForAlert(
                                                    {
                                                      ...p,
                                                      selectedVariantId:
                                                        variant.id,
                                                      selectedVariantName:
                                                        variant.name ||
                                                        `Variant ${variant.id}`,
                                                    }
                                                  );
                                                  setEditAlertProductSearch(
                                                    `${
                                                      p.categoryName ||
                                                      "Uncategorized"
                                                    } - ${
                                                      p.subcategoryName ||
                                                      "No Subcategory"
                                                    } - ${p.name} - ${
                                                      variant.name || "Variant"
                                                    }`
                                                  );
                                                  setShowEditAlertProductDropdown(
                                                    false
                                                  );
                                                }}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100"
                                              >
                                                <div className="font-medium text-gray-900">
                                                  {p.categoryName ||
                                                    "Uncategorized"}{" "}
                                                  -{" "}
                                                  {p.subcategoryName ||
                                                    "No Subcategory"}{" "}
                                                  - {p.name}
                                                </div>
                                                <div className="text-xs text-blue-600">
                                                  {variant.name ||
                                                    `Variant ${variant.id}`}
                                                </div>
                                              </div>
                                            );
                                          });
                                        }

                                        // Product without variants
                                        return (
                                          <div
                                            key={p.id}
                                            onMouseDown={() => {
                                              setEditSelectedProductForAlert({
                                                ...p,
                                                selectedVariantId: null,
                                                selectedVariantName: "",
                                              });
                                              setEditAlertProductSearch(
                                                `${
                                                  p.categoryName ||
                                                  "Uncategorized"
                                                } - ${
                                                  p.subcategoryName ||
                                                  "No Subcategory"
                                                } - ${p.name}`
                                              );
                                              setShowEditAlertProductDropdown(
                                                false
                                              );
                                            }}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                          >
                                            <div className="font-medium text-gray-900">
                                              {p.categoryName ||
                                                "Uncategorized"}{" "}
                                              -{" "}
                                              {p.subcategoryName ||
                                                "No Subcategory"}{" "}
                                              - {p.name}
                                            </div>
                                          </div>
                                        );
                                      })}

                                    {editAlertProductSearch &&
                                      products.filter((p) =>
                                        `${
                                          p.categoryName || "Uncategorized"
                                        } - ${
                                          p.subcategoryName || "No Subcategory"
                                        } - ${p.name}`
                                          .toLowerCase()
                                          .includes(
                                            editAlertProductSearch.toLowerCase()
                                          )
                                      ).length === 0 && (
                                        <div className="px-3 py-2 text-sm text-gray-500">
                                          No products found matching &quot;
                                          {editAlertProductSearch}&quot;
                                        </div>
                                      )}
                                  </div>
                                )}
                            </div>

                            {/* Kiosk Alert Level */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kiosk Alert Level
                              </label>
                              <input
                                type="number"
                                placeholder="e.g., 10"
                                value={editAlertKioskLevel}
                                onChange={(e) =>
                                  setEditAlertKioskLevel(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                              />
                            </div>

                            {/* Admin Alert Level */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Admin Alert Level
                              </label>
                              <input
                                type="number"
                                placeholder="e.g., 5"
                                value={editAlertAdminLevel}
                                onChange={(e) =>
                                  setEditAlertAdminLevel(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                              />
                            </div>

                            {/* Stock Zero Action */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                When Stock is 0
                              </label>
                              <select
                                value={editStockZeroAction}
                                onChange={(e) =>
                                  setEditStockZeroAction(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="disable">Disable Product</option>
                                <option value="keepVisible">
                                  Keep Visible
                                </option>
                              </select>
                            </div>

                            {/* Update Button */}
                            <div className="flex items-end space-x-2">
                              <button
                                onClick={saveEditAlert}
                                disabled={
                                  !editSelectedProductForAlert ||
                                  !editAlertKioskLevel ||
                                  !editAlertAdminLevel
                                }
                                className={`flex-1 px-4 py-2 text-white text-sm font-medium rounded-md ${
                                  !editSelectedProductForAlert ||
                                  !editAlertKioskLevel ||
                                  !editAlertAdminLevel
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                                }`}
                              >
                                Update Alert
                              </button>
                              <button
                                onClick={cancelEditAlert}
                                className="px-4 py-2 text-gray-700 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>

                          {/* Current Stock Display for Edit */}
                          {editSelectedProductForAlert && (
                            <div className="mt-4 p-3 bg-blue-100 rounded-md">
                              <p className="text-sm text-blue-800">
                                <strong>Current Stock:</strong>{" "}
                                {stockCalculationsLoaded
                                  ? getCurrentStock(
                                      editSelectedProductForAlert,
                                      editSelectedProductForAlert?.selectedVariantId
                                    )
                                  : "Loading..."}{" "}
                                units
                                {editSelectedProductForAlert.selectedVariantName && (
                                  <span className="block text-xs text-blue-600 mt-1">
                                    Variant:{" "}
                                    {
                                      editSelectedProductForAlert.selectedVariantName
                                    }
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Existing Alerts List */}
                      <div>
                        <h4 className="text-md font-medium text-gray-900 mb-4">
                          Existing Stock Alerts ({stockAlerts.length})
                        </h4>

                        {stockAlerts.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            No stock alerts configured yet.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Current Stock
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Kiosk Alert
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Admin Alert
                                  </th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Zero Stock Action
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
                                {stockAlerts.map((alert) => {
                                  const product = products.find(
                                    (p) => p.id === alert.productId
                                  );
                                  const currentStock = product
                                    ? getCurrentStock(product, alert.variantId)
                                    : 0;
                                  const isKioskAlert =
                                    currentStock <= alert.alertKioskLevel;
                                  const isAdminAlert =
                                    currentStock <= alert.alertAdminLevel;

                                  return (
                                    <tr
                                      key={alert.id}
                                      className={`${
                                        isKioskAlert || isAdminAlert
                                          ? "bg-red-50"
                                          : ""
                                      }`}
                                    >
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                          {alert.productName ||
                                            "Unknown Product"}
                                        </div>
                                        {alert.variantName && (
                                          <div className="text-xs text-blue-600">
                                            {alert.variantName}
                                          </div>
                                        )}
                                        <div className="text-xs text-gray-500">
                                          ID: {alert.productId}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div
                                          className={`text-sm font-medium ${
                                            isKioskAlert || isAdminAlert
                                              ? "text-red-600"
                                              : "text-gray-900"
                                          }`}
                                        >
                                          {currentStock}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            isKioskAlert
                                              ? "bg-red-100 text-red-800"
                                              : "bg-green-100 text-green-800"
                                          }`}
                                        >
                                          {alert.alertKioskLevel}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            isAdminAlert
                                              ? "bg-red-100 text-red-800"
                                              : "bg-green-100 text-green-800"
                                          }`}
                                        >
                                          {alert.alertAdminLevel}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            alert.stockZeroAction === "disable"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-blue-100 text-blue-800"
                                          }`}
                                        >
                                          {alert.stockZeroAction === "disable"
                                            ? "Disable"
                                            : "Keep Visible"}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        {isKioskAlert || isAdminAlert ? (
                                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                            ⚠️ ALERT
                                          </span>
                                        ) : (
                                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            ✅ OK
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() =>
                                              startEditAlert(alert)
                                            }
                                            className="text-blue-600 hover:text-blue-900 text-sm"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() =>
                                              deleteStockAlert(alert.id)
                                            }
                                            className="text-red-600 hover:text-red-900 text-sm"
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
                        )}
                      </div>
                    </div>
                  )}
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
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          placeholder={
                            loadingSettings ? "Loading..." : "Enter store name"
                          }
                          disabled={loadingSettings}
                          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      {/* Transaction ID Prefix */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Transaction ID Prefix
                        </label>
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={transactionPrefix}
                            onChange={(e) =>
                              setTransactionPrefix(e.target.value.toUpperCase())
                            }
                            placeholder={
                              loadingSettings ? "Loading..." : "Enter prefix"
                            }
                            disabled={loadingSettings}
                            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                          <p className="text-sm text-gray-500">
                            Example: {transactionPrefix || "TRX"}-00001,{" "}
                            {transactionPrefix || "TRX"}-00002, etc.
                          </p>
                        </div>
                      </div>

                      {/* Bath to USD Exchange Rate */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bath to USD Exchange Rate
                        </label>
                        <div className="space-y-2">
                          <input
                            type="number"
                            step="0.001"
                            value={bathToUsdRate}
                            onChange={(e) =>
                              setBathToUsdRate(parseFloat(e.target.value) || 0)
                            }
                            placeholder={
                              loadingSettings
                                ? "Loading..."
                                : "Enter USD value for 1 Bath"
                            }
                            disabled={loadingSettings}
                            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                          <p className="text-sm text-gray-500">
                            How much USD is equal to 1 Thai Bath (e.g., 0.029
                            means 1 Bath = $0.029 USD)
                          </p>
                        </div>
                      </div>

                      {/* Non Member Payment Settings */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Non Member Payment Methods
                        </label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="nonMemberCash"
                              checked={nonMemberPaymentSettings.cash}
                              onChange={(e) =>
                                setNonMemberPaymentSettings((prev) => ({
                                  ...prev,
                                  cash: e.target.checked,
                                }))
                              }
                              disabled={loadingSettings}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                            />
                            <label
                              htmlFor="nonMemberCash"
                              className="text-sm text-gray-700"
                            >
                              💵 Cash Payment
                            </label>
                          </div>

                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="nonMemberCard"
                              checked={nonMemberPaymentSettings.card}
                              onChange={(e) =>
                                setNonMemberPaymentSettings((prev) => ({
                                  ...prev,
                                  card: e.target.checked,
                                }))
                              }
                              disabled={loadingSettings}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                            />
                            <label
                              htmlFor="nonMemberCard"
                              className="text-sm text-gray-700"
                            >
                              💳 Card Payment
                            </label>
                          </div>

                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="nonMemberCrypto"
                              checked={nonMemberPaymentSettings.crypto}
                              onChange={(e) =>
                                setNonMemberPaymentSettings((prev) => ({
                                  ...prev,
                                  crypto: e.target.checked,
                                }))
                              }
                              disabled={loadingSettings}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                            />
                            <label
                              htmlFor="nonMemberCrypto"
                              className="text-sm text-gray-700"
                            >
                              ₿ Crypto Payment
                            </label>
                          </div>

                          <p className="text-sm text-gray-500">
                            Select which payment methods are available for
                            non-members. Members will always have access to all
                            payment methods.
                          </p>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-start">
                        <button
                          onClick={handleSaveSettings}
                          disabled={savingSettings || loadingSettings}
                          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingSettings
                            ? "Loading..."
                            : savingSettings
                            ? "Saving..."
                            : "Save Settings"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Crypto Payments Tab */}
              {activeTab === "cryptoPayments" && (
                <div className="space-y-6">
                  {/* Header with Filters */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Crypto Payment Management
                      </h3>

                      <div className="flex items-center gap-4">
                        {/* Status Filter */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Status
                          </label>
                          <select
                            value={cryptoPaymentStatusFilter}
                            onChange={(e) =>
                              setCryptoPaymentStatusFilter(e.target.value)
                            }
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="all">All Statuses</option>
                            <option value="waiting">Waiting</option>
                            <option value="confirming">Confirming</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="sending">Sending</option>
                            <option value="finished">Finished</option>
                            <option value="failed">Failed</option>
                            <option value="expired">Expired</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>

                        {/* Refresh Buttons */}
                        <div className="flex gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              &nbsp;
                            </label>
                            <button
                              onClick={() => loadCryptoPayments()}
                              disabled={
                                loadingCryptoPayments || refreshingAllPayments
                              }
                              className="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                            >
                              {loadingCryptoPayments ? "🔄" : "↻"} Refresh List
                            </button>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              &nbsp;
                            </label>
                            <button
                              onClick={refreshAllPaymentStatuses}
                              disabled={
                                refreshingAllPayments || loadingCryptoPayments
                              }
                              className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                            >
                              {refreshingAllPayments ? "🔄" : "🔍"} Check All
                              Payments
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Crypto Payments Table */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {loadingCryptoPayments ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">
                          Loading crypto payments...
                        </p>
                      </div>
                    ) : cryptoPayments.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="text-gray-400 text-4xl mb-4">₿</div>
                        <p className="text-gray-600">
                          No crypto payments found
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                          Payments made through the kiosk will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Payment Info
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
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
                            {cryptoPayments.map((payment) => (
                              <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      ID: {payment.payment_id}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Order: {payment.order_id}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {payment.pay_currency?.toUpperCase()}{" "}
                                      Payment
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {payment.customer_name || "No Member"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Items: {payment.cart_items?.length || 0}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      ฿{payment.total_bath?.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      ${payment.total_usd?.toFixed(2)} USD
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {payment.pay_amount}{" "}
                                      {payment.pay_currency?.toUpperCase()}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      payment.payment_status === "finished" ||
                                      payment.payment_status === "confirmed"
                                        ? "bg-green-100 text-green-800"
                                        : payment.payment_status === "waiting"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : payment.payment_status ===
                                            "confirming" ||
                                          payment.payment_status === "sending"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {payment.payment_status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <div>
                                    {payment.created_at?.toLocaleDateString()}
                                  </div>
                                  <div>
                                    {payment.created_at?.toLocaleTimeString()}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedCryptoPayment(payment);
                                      setShowCryptoPaymentModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    View Details
                                  </button>
                                  <button
                                    onClick={() =>
                                      checkCryptoPaymentStatus(
                                        payment.payment_id
                                      )
                                    }
                                    disabled={checkingCryptoStatus}
                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                  >
                                    {checkingCryptoStatus ? "🔄" : "↻"} Check
                                    Status
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Purchase Details Modal */}
        {showPurchaseDetails && selectedPurchaseOrder && (
          <div className="fixed inset-0 bg-gray-600/50 z-50 flex items-start justify-center overflow-y-auto">
            <div className="relative mt-10 mb-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Purchase Order Details - #
                    {selectedPurchaseOrder.orderId ||
                      selectedPurchaseOrder.id.substring(0, 8)}
                  </h3>
                  <button
                    onClick={() => {
                      setShowPurchaseDetails(false);
                      setSelectedPurchaseOrder(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Purchase Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPurchaseOrder.createdAt
                          ? new Date(
                              selectedPurchaseOrder.createdAt.seconds * 1000
                            ).toLocaleDateString()
                          : selectedPurchaseOrder.date || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Time
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPurchaseOrder.createdAt
                          ? new Date(
                              selectedPurchaseOrder.createdAt.seconds * 1000
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : selectedPurchaseOrder.time || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Supplier
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPurchaseOrder.supplier}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Total Items
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPurchaseOrder.items.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Purchase Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                          Product
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                          Variant
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-right font-semibold text-gray-900">
                          Quantity
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-right font-semibold text-gray-900">
                          Buy Price
                        </th>
                        <th className="border border-gray-300 px-4 py-2 text-right font-semibold text-gray-900">
                          Line Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPurchaseOrder.items.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">
                            <div className="font-medium">
                              {item.productName}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <div className="text-sm text-gray-600">
                              {item.variantName || "No variant"}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            <div className="font-medium text-green-600">
                              +{item.quantity}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            <div className="font-medium">
                              ฿{item.price ? item.price.toFixed(2) : "0.00"}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-right">
                            <div className="font-medium text-green-600">
                              ฿
                              {(
                                (item.quantity || 0) * (item.price || 0)
                              ).toFixed(2)}
                            </div>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-semibold">
                        <td
                          colSpan="4"
                          className="border border-gray-300 px-4 py-2 text-right"
                        >
                          Total Purchase Value:
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right text-green-600">
                          ฿{selectedPurchaseOrder.totalValue.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowPurchaseDetails(false);
                      setSelectedPurchaseOrder(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Stock In Modal */}
        {showAddStockIn && (
          <div className="fixed inset-0 bg-gray-600/50 z-50 flex items-start justify-center overflow-y-auto">
            <div className="relative mt-10 mb-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Add Stock In
                  </h3>
                  <button
                    onClick={handleCancelStockIn}
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

                <form onSubmit={handleSaveStockIn} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Supplier *
                      </label>
                      <input
                        type="text"
                        value={stockInForm.supplier}
                        onChange={(e) =>
                          setStockInForm({
                            ...stockInForm,
                            supplier: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter supplier name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={stockInForm.date}
                        onChange={(e) =>
                          setStockInForm({
                            ...stockInForm,
                            date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time *
                      </label>
                      <input
                        type="time"
                        value={stockInForm.time}
                        onChange={(e) =>
                          setStockInForm({
                            ...stockInForm,
                            time: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Products Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-900">
                        Products
                      </h4>
                      <button
                        type="button"
                        onClick={addProductToStockIn}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Add Product
                      </button>
                    </div>

                    <div className="space-y-3">
                      {stockInForm.products.map((product, index) => {
                        const selectedProduct = products.find(
                          (p) => p.id === product.productId
                        );
                        const hasVariants =
                          selectedProduct?.hasVariants &&
                          selectedProduct?.variants?.length > 0;

                        return (
                          <div
                            key={index}
                            className="flex gap-3 items-start p-4 border border-gray-200 rounded-lg"
                          >
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Product *
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Search products..."
                                  value={product.productSearch || ""}
                                  onChange={(e) => {
                                    console.log(
                                      "Input onChange:",
                                      e.target.value
                                    );
                                    updateStockInProduct(
                                      index,
                                      "productSearch",
                                      e.target.value
                                    );
                                  }}
                                  onFocus={() => {
                                    console.log(
                                      "Input onFocus, current product state:",
                                      product
                                    );
                                    updateStockInProduct(
                                      index,
                                      "showProductDropdown",
                                      true
                                    );
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />

                                {/* Debug display */}
                                <div className="mt-1 text-xs text-gray-500">
                                  Debug: productId={product.productId},
                                  productName={product.productName},
                                  productSearch={product.productSearch}
                                </div>

                                {product.showProductDropdown && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        updateStockInProduct(
                                          index,
                                          "showProductDropdown",
                                          false
                                        );
                                      }}
                                    ></div>
                                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                      {products
                                        .filter((p) => {
                                          const searchTerm = (
                                            product.productSearch || ""
                                          ).toLowerCase();
                                          const productName = (
                                            p.name || ""
                                          ).toLowerCase();
                                          const categoryName = (
                                            p.categoryName || ""
                                          ).toLowerCase();
                                          const subcategoryName = (
                                            p.subcategoryName || ""
                                          ).toLowerCase();
                                          return (
                                            productName.includes(searchTerm) ||
                                            categoryName.includes(searchTerm) ||
                                            subcategoryName.includes(searchTerm)
                                          );
                                        })
                                        .slice(0, 20)
                                        .map((p) => {
                                          // For products with variants, show each variant option as a separate entry
                                          if (
                                            p.hasVariants &&
                                            p.variants?.length > 0
                                          ) {
                                            return p.variants
                                              .map((variant) => {
                                                if (
                                                  variant.options &&
                                                  variant.options.length > 0
                                                ) {
                                                  return variant.options.map(
                                                    (option) => (
                                                      <div
                                                        key={`${p.id}-${variant.id}-${option.id}`}
                                                        onClick={(e) => {
                                                          e.preventDefault();
                                                          e.stopPropagation();
                                                          console.log(
                                                            "Clicking product variant:",
                                                            {
                                                              productId: p.id,
                                                              productName:
                                                                p.name,
                                                              variantId: `${variant.id}-${option.id}`,
                                                              variantName: `${variant.variantName}: ${option.name}`,
                                                              productSearch: `${
                                                                p.categoryName ||
                                                                "Uncategorized"
                                                              } - ${
                                                                p.subcategoryName ||
                                                                "No Subcategory"
                                                              } - ${p.name} - ${
                                                                variant.variantName
                                                              } - ${
                                                                option.name
                                                              }`,
                                                            }
                                                          );

                                                          // Update all fields at once to avoid race conditions
                                                          updateStockInProductMultiple(
                                                            index,
                                                            {
                                                              productId: p.id,
                                                              productName:
                                                                p.name,
                                                              variantId: `${variant.id}-${option.id}`,
                                                              variantName: `${variant.variantName}: ${option.name}`,
                                                              productSearch: `${
                                                                p.categoryName ||
                                                                "Uncategorized"
                                                              } - ${
                                                                p.subcategoryName ||
                                                                "No Subcategory"
                                                              } - ${p.name} - ${
                                                                variant.variantName
                                                              } - ${
                                                                option.name
                                                              }`,
                                                              showProductDropdown: false,
                                                            }
                                                          );
                                                        }}
                                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100"
                                                      >
                                                        <div className="font-medium text-gray-900">
                                                          {p.categoryName ||
                                                            "Uncategorized"}{" "}
                                                          -{" "}
                                                          {p.subcategoryName ||
                                                            "No Subcategory"}{" "}
                                                          - {p.name}
                                                        </div>
                                                        <div className="text-blue-600 font-medium">
                                                          {variant.variantName}:{" "}
                                                          {option.name}
                                                          {option.price &&
                                                            ` - ฿${option.price.toFixed(
                                                              2
                                                            )}`}
                                                          {option.memberPrice &&
                                                            ` (Member: ฿${option.memberPrice.toFixed(
                                                              2
                                                            )})`}
                                                        </div>
                                                      </div>
                                                    )
                                                  );
                                                } else {
                                                  return (
                                                    <div
                                                      key={`${p.id}-${variant.id}`}
                                                      onClick={() => {
                                                        updateStockInProductMultiple(
                                                          index,
                                                          {
                                                            productId: p.id,
                                                            productName: p.name,
                                                            variantId:
                                                              variant.id,
                                                            variantName:
                                                              variant.name ||
                                                              `Variant ${variant.id}`,
                                                            productSearch: `${
                                                              p.categoryName ||
                                                              "Uncategorized"
                                                            } - ${
                                                              p.subcategoryName ||
                                                              "No Subcategory"
                                                            } - ${p.name} - ${
                                                              variant.name ||
                                                              "Variant"
                                                            }`,
                                                            showProductDropdown: false,
                                                          }
                                                        );
                                                      }}
                                                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100"
                                                    >
                                                      <div className="font-medium text-gray-900">
                                                        {p.categoryName ||
                                                          "Uncategorized"}{" "}
                                                        -{" "}
                                                        {p.subcategoryName ||
                                                          "No Subcategory"}{" "}
                                                        - {p.name}
                                                      </div>
                                                      <div className="text-blue-600 font-medium">
                                                        {variant.name ||
                                                          `Variant ${variant.id}`}
                                                        {variant.price &&
                                                          ` - ฿${variant.price.toFixed(
                                                            2
                                                          )}`}
                                                      </div>
                                                    </div>
                                                  );
                                                }
                                              })
                                              .flat();
                                          } else {
                                            // For products without variants
                                            return (
                                              <div
                                                key={p.id}
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  updateStockInProductMultiple(
                                                    index,
                                                    {
                                                      productId: p.id,
                                                      productName: p.name,
                                                      variantId: "",
                                                      variantName: "",
                                                      productSearch: `${
                                                        p.categoryName ||
                                                        "Uncategorized"
                                                      } - ${
                                                        p.subcategoryName ||
                                                        "No Subcategory"
                                                      } - ${p.name}`,
                                                      showProductDropdown: false,
                                                    }
                                                  );
                                                }}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100"
                                              >
                                                <div className="font-medium text-gray-900">
                                                  {p.categoryName ||
                                                    "Uncategorized"}{" "}
                                                  -{" "}
                                                  {p.subcategoryName ||
                                                    "No Subcategory"}{" "}
                                                  - {p.name}
                                                </div>
                                                <div className="text-green-600 font-medium">
                                                  Simple Product
                                                  {p.price &&
                                                    ` - ฿${p.price.toFixed(2)}`}
                                                  {p.memberPrice &&
                                                    ` (Member: ฿${p.memberPrice.toFixed(
                                                      2
                                                    )})`}
                                                </div>
                                              </div>
                                            );
                                          }
                                        })
                                        .flat()}

                                      {products.filter((p) => {
                                        const searchTerm = (
                                          product.productSearch || ""
                                        ).toLowerCase();
                                        const productName = (
                                          p.name || ""
                                        ).toLowerCase();
                                        const categoryName = (
                                          p.categoryName || ""
                                        ).toLowerCase();
                                        const subcategoryName = (
                                          p.subcategoryName || ""
                                        ).toLowerCase();
                                        return (
                                          productName.includes(searchTerm) ||
                                          categoryName.includes(searchTerm) ||
                                          subcategoryName.includes(searchTerm)
                                        );
                                      }).length === 0 && (
                                        <div className="px-3 py-2 text-gray-500 text-sm">
                                          No products found
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="w-24">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity *
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) =>
                                  updateStockInProduct(
                                    index,
                                    "quantity",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="0"
                                required
                              />
                            </div>
                            <div className="w-32">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Buy Price (฿) *
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={product.buyPrice}
                                onChange={(e) =>
                                  updateStockInProduct(
                                    index,
                                    "buyPrice",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="0.00"
                                required
                              />
                            </div>
                            <div className="w-32">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total
                              </label>
                              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                                ฿
                                {(
                                  (product.quantity || 0) *
                                  (product.buyPrice || 0)
                                ).toFixed(2)}
                              </div>
                            </div>
                            {stockInForm.products.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeProductFromStockIn(index)}
                                className="text-red-600 hover:text-red-800 p-2 mt-6"
                                title="Remove Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Total Summary */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Products:</span>
                        <span>
                          {stockInForm.products.reduce(
                            (sum, p) => sum + (p.quantity || 0),
                            0
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-medium">Total Value:</span>
                        <span className="text-lg font-bold text-green-600">
                          ฿
                          {stockInForm.products
                            .reduce(
                              (sum, p) =>
                                sum + (p.quantity || 0) * (p.buyPrice || 0),
                              0
                            )
                            .toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancelStockIn}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isStockSaving}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400"
                    >
                      {isStockSaving ? "Saving..." : "Save Stock In"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Customer Modal */}
        {showAddCustomer && (
          <div className="fixed inset-0 bg-gray-600/50 z-50 flex items-start justify-center overflow-y-auto">
            <div className="relative mt-10 mb-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={customerForm.dateOfBirth}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            dateOfBirth: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Points
                        <span className="text-gray-500 text-xs ml-1">
                          (Additional bonus points)
                        </span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={customerForm.customPoints}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            customPoints: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Member ID
                        <span className="text-gray-500 text-xs ml-1">
                          (Optional - auto-generated if empty)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={customerForm.memberId}
                        onChange={(e) => handleMemberIdChange(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          memberIdError
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-green-500"
                        }`}
                        placeholder="e.g., CK-0001 or leave empty for auto-generation"
                      />
                      {memberIdError && (
                        <p className="text-red-500 text-sm mt-1">
                          {memberIdError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Category Permissions Section */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Category Permissions
                      <span className="text-gray-500 text-xs ml-1">
                        (Select which categories this customer can see in the
                        kiosk)
                      </span>
                    </label>
                    <div className="border border-gray-300 rounded-md p-4 max-h-48 overflow-y-auto">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600">
                          {customerForm.allowedCategories.length} of{" "}
                          {categories.length} categories selected
                        </span>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerForm({
                                ...customerForm,
                                allowedCategories: categories.map(
                                  (cat) => cat.id
                                ),
                              });
                            }}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerForm({
                                ...customerForm,
                                allowedCategories: [],
                              });
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <label
                            key={category.id}
                            className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={customerForm.allowedCategories.includes(
                                category.id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCustomerForm({
                                    ...customerForm,
                                    allowedCategories: [
                                      ...customerForm.allowedCategories,
                                      category.id,
                                    ],
                                  });
                                } else {
                                  setCustomerForm({
                                    ...customerForm,
                                    allowedCategories:
                                      customerForm.allowedCategories.filter(
                                        (id) => id !== category.id
                                      ),
                                  });
                                }
                              }}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 flex-1">
                              {category.name}
                            </span>
                          </label>
                        ))}
                      </div>
                      {categories.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No categories available
                        </div>
                      )}
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
                        memberId: "",
                        dateOfBirth: "",
                        customPoints: 0,
                        allowedCategories: [],
                      });
                      setMemberIdError("");
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
                        Member ID *
                      </label>
                      <input
                        type="text"
                        value={customerForm.memberId}
                        onChange={handleMemberIdChange}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          memberIdError
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-green-500"
                        }`}
                        required
                      />
                      {memberIdError && (
                        <p className="mt-1 text-sm text-red-600">
                          {memberIdError}
                        </p>
                      )}
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={customerForm.dateOfBirth}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            dateOfBirth: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Points
                        <span className="text-gray-500 text-xs ml-1">
                          (Additional bonus points)
                        </span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={customerForm.customPoints}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            customPoints: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Category Permissions Section */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Category Permissions
                      <span className="text-gray-500 text-xs ml-1">
                        (Select which categories this customer can see in the
                        kiosk)
                      </span>
                    </label>
                    <div className="border border-gray-300 rounded-md p-4 max-h-48 overflow-y-auto">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-600">
                          {customerForm.allowedCategories.length} of{" "}
                          {categories.length} categories selected
                        </span>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerForm({
                                ...customerForm,
                                allowedCategories: categories.map(
                                  (cat) => cat.id
                                ),
                              });
                            }}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomerForm({
                                ...customerForm,
                                allowedCategories: [],
                              });
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <label
                            key={category.id}
                            className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={customerForm.allowedCategories.includes(
                                category.id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCustomerForm({
                                    ...customerForm,
                                    allowedCategories: [
                                      ...customerForm.allowedCategories,
                                      category.id,
                                    ],
                                  });
                                } else {
                                  setCustomerForm({
                                    ...customerForm,
                                    allowedCategories:
                                      customerForm.allowedCategories.filter(
                                        (id) => id !== category.id
                                      ),
                                  });
                                }
                              }}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 flex-1">
                              {category.name}
                            </span>
                          </label>
                        ))}
                      </div>
                      {categories.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                          No categories available
                        </div>
                      )}
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
                          memberId: "",
                          dateOfBirth: "",
                          customPoints: 0,
                          allowedCategories: [],
                        });
                        setMemberIdError("");
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
                        <Image
                          src={URL.createObjectURL(categoryImageFile)}
                          alt="Category preview"
                          width={400}
                          height={192}
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

                {/* Special Page */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Page (Optional)
                  </label>
                  <select
                    value={newCategory.specialPage || ""}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        specialPage: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">None</option>
                    <option value="Prerolled Page">Prerolled Page</option>
                    <option value="Custom Joint Builder">
                      Custom Joint Builder
                    </option>
                  </select>
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
                        <Image
                          src={URL.createObjectURL(categoryBackgroundImageFile)}
                          alt="Background preview"
                          width={400}
                          height={192}
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
                      specialPage: "",
                      backgroundImage: "",
                      backgroundFit: "contain",
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
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-5xl max-h-[90vh] mt-10 mb-10 overflow-y-auto">
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

                {/* Special Page */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Page (Optional)
                  </label>
                  <select
                    value={categoryForm.specialPage || ""}
                    onChange={(e) =>
                      setCategoryForm({
                        ...categoryForm,
                        specialPage: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">None</option>
                    <option value="Prerolled Page">Prerolled Page</option>
                    <option value="Custom Joint Builder">
                      Custom Joint Builder
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Image
                  </label>
                  <div className="space-y-3">
                    {/* Image Preview (new selection) */}
                    {categoryImageFile && (
                      <div className="relative bg-gray-50 rounded-md border border-gray-300 p-2">
                        <Image
                          src={URL.createObjectURL(categoryImageFile)}
                          alt="Category preview"
                          width={400}
                          height={192}
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
                            <Image
                              src={editingCategory.image}
                              alt="Current category image"
                              width={400}
                              height={192}
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
                        <Image
                          src={URL.createObjectURL(categoryBackgroundImageFile)}
                          alt="Background preview"
                          width={400}
                          height={192}
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
                        specialPage: "",
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
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-5xl max-h-[90vh] mt-10 mb-10 overflow-y-auto">
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

                  {/* 3D Model Upload Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      3D Model (.glb file)
                    </label>
                    <input
                      type="file"
                      accept=".glb,.gltf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setProductModelFile(file);
                          // Create preview URL
                          const modelUrl = URL.createObjectURL(file);
                          setNewProduct({
                            ...newProduct,
                            modelUrl: modelUrl,
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {productModelFile && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-2">
                          File: {productModelFile.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setProductModelFile(null);
                            setNewProduct({
                              ...newProduct,
                              modelUrl: "",
                            });
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove 3D model
                        </button>
                      </div>
                    )}

                    {/* 3D Model Rotation Controls */}
                    {productModelFile && (
                      <div className="mt-4 space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Initial Rotation Settings
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Horizontal (0-360°)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="360"
                              value={newProduct.modelRotationX || 90}
                              onChange={(e) =>
                                setNewProduct({
                                  ...newProduct,
                                  modelRotationX: parseFloat(e.target.value),
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Vertical (0-180°)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="180"
                              value={newProduct.modelRotationY || 75}
                              onChange={(e) =>
                                setNewProduct({
                                  ...newProduct,
                                  modelRotationY: parseFloat(e.target.value),
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Distance (0.1-10m)
                            </label>
                            <input
                              type="number"
                              min="0.1"
                              max="10"
                              step="0.1"
                              value={newProduct.modelRotationZ || 2.5}
                              onChange={(e) =>
                                setNewProduct({
                                  ...newProduct,
                                  modelRotationZ: parseFloat(e.target.value),
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>

                        {/* 3D Model Preview */}
                        <div className="mt-3">
                          <label className="block text-xs text-gray-600 mb-2">
                            Preview (drag to rotate, scroll to zoom)
                          </label>
                          <ModelViewer
                            modelUrl={newProduct.modelUrl}
                            rotationX={newProduct.modelRotationX || 90}
                            rotationY={newProduct.modelRotationY || 75}
                            rotationZ={newProduct.modelRotationZ || 2.5}
                            autoRotate={false}
                            className="w-full h-64 bg-white rounded-lg border-2 border-gray-200"
                          />
                        </div>
                      </div>
                    )}
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
                            onClick={() => {
                              console.log("🗑️ REMOVE IMAGE - Add Product mode");
                              setProductImageFile(null);
                              setShouldRemoveMainImages(false); // For new products, just clear
                            }}
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
                          onChange={(e) => {
                            const file = e.target.files[0];
                            console.log(
                              "📁 IMAGE UPLOAD DEBUG - File selected (Add Product):",
                              {
                                fileName: file?.name,
                                fileSize: file?.size,
                                fileType: file?.type,
                                isValidFile: file instanceof File,
                                timestamp: new Date().toISOString(),
                              }
                            );
                            setProductImageFile(file);
                          }}
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
                        Subcategory (Optional)
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
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Regular Price (฿) *
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Member Price (฿) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newProduct.memberPrice}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              memberPrice: parseFloat(e.target.value) || "",
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
                                          <Image
                                            src={option.imageUrl}
                                            alt={option.name}
                                            width={24}
                                            height={24}
                                            className="w-6 h-6 object-cover rounded border"
                                          />
                                        )}
                                        <span className="text-sm">
                                          {option.name} - ฿{option.price}
                                          {typeof option.memberPrice ===
                                          "number"
                                            ? ` /M ฿${option.memberPrice}`
                                            : ""}
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
                              <div className="grid grid-cols-4 gap-2">
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
                                    Member Price (฿)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    id="option-member-price-input"
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
                                      <Image
                                        src={URL.createObjectURL(
                                          optionImageFile
                                        )}
                                        alt="Option preview"
                                        width={64}
                                        height={64}
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
                                    const memberPriceRaw =
                                      document.getElementById(
                                        "option-member-price-input"
                                      ).value;
                                    const optionMemberPrice =
                                      memberPriceRaw.trim() === ""
                                        ? null
                                        : parseFloat(memberPriceRaw) || 0;
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

                                      const memberSegment =
                                        optionMemberPrice !== null
                                          ? ` /M ฿${optionMemberPrice}`
                                          : "";
                                      optionDiv.innerHTML = `
                                        <div class="flex items-center">
                                          ${imagePreview}
                                          <span class="text-sm">${optionName} - ฿${optionPrice}${memberSegment}${
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
                                      document.getElementById(
                                        "option-member-price-input"
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
                                const remainder = parts[1] || "0";
                                // Pattern may be: price (/M ฿member)? (unit?)
                                let price = 0;
                                let memberPrice = undefined;
                                let unit = "";
                                // Extract unit if present in parentheses at end
                                const unitMatch =
                                  remainder.match(/\(([^)]+)\)$/);
                                if (unitMatch) {
                                  unit = unitMatch[1];
                                }
                                const remainderNoUnit = unitMatch
                                  ? remainder.replace(unitMatch[0], "").trim()
                                  : remainder.trim();
                                const memberMatch =
                                  remainderNoUnit.match(/(.*) \/M ฿(.*)/);
                                if (memberMatch) {
                                  price = parseFloat(memberMatch[1]) || 0;
                                  const mp = parseFloat(memberMatch[2]);
                                  if (!isNaN(mp)) memberPrice = mp;
                                } else {
                                  price = parseFloat(remainderNoUnit) || 0;
                                }

                                // Get image data if exists
                                const imageData =
                                  optionElement._imageData || null;

                                options.push({
                                  id: Date.now().toString() + i,
                                  name: name,
                                  price: price,
                                  ...(memberPrice !== undefined
                                    ? { memberPrice }
                                    : {}),
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
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto mb-10">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Product
                  </h3>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setShouldRemoveMainImages(false); // Reset flag on cancel
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

                  {/* 3D Model Upload Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      3D Model (.glb file)
                    </label>
                    <input
                      type="file"
                      accept=".glb,.gltf"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setProductModelFile(file);
                          // Create preview URL
                          const modelUrl = URL.createObjectURL(file);
                          setProductForm({
                            ...productForm,
                            modelUrl: modelUrl,
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {(productModelFile || productForm.modelUrl) && (
                      <div className="mt-2">
                        {productModelFile && (
                          <p className="text-sm text-gray-600 mb-2">
                            New file: {productModelFile.name}
                          </p>
                        )}
                        {!productModelFile && productForm.modelUrl && (
                          <p className="text-sm text-gray-600 mb-2">
                            Current model uploaded
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setProductModelFile(null);
                            setProductForm({
                              ...productForm,
                              modelUrl: "",
                            });
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remove 3D model
                        </button>
                      </div>
                    )}

                    {/* 3D Model Rotation Controls */}
                    {(productModelFile || productForm.modelUrl) && (
                      <div className="mt-4 space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Initial Rotation Settings
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Horizontal (0-360°)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="360"
                              value={productForm.modelRotationX || 90}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  modelRotationX: parseFloat(e.target.value),
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Vertical (0-180°)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="180"
                              value={productForm.modelRotationY || 75}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  modelRotationY: parseFloat(e.target.value),
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Distance (0.1-10m)
                            </label>
                            <input
                              type="number"
                              min="0.1"
                              max="10"
                              step="0.1"
                              value={productForm.modelRotationZ || 2.5}
                              onChange={(e) =>
                                setProductForm({
                                  ...productForm,
                                  modelRotationZ: parseFloat(e.target.value),
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>

                        {/* 3D Model Preview */}
                        <div className="mt-3">
                          <label className="block text-xs text-gray-600 mb-2">
                            Preview (drag to rotate, scroll to zoom)
                          </label>
                          <ModelViewer
                            modelUrl={productForm.modelUrl}
                            rotationX={productForm.modelRotationX || 90}
                            rotationY={productForm.modelRotationY || 75}
                            rotationZ={productForm.modelRotationZ || 2.5}
                            autoRotate={false}
                            className="w-full h-64 bg-white rounded-lg border-2 border-gray-200"
                          />
                        </div>
                      </div>
                    )}
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
                        Subcategory (Optional)
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
                          onChange={() => {
                            setProductForm({
                              ...productForm,
                              hasVariants: false,
                              variants: [],
                            });
                            setVariants([]); // Clear variants state when switching to simple
                            setHasVariants(false);
                          }}
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
                          onChange={() => {
                            setProductForm({
                              ...productForm,
                              hasVariants: true,
                              price: 0, // Clear simple price when switching to variants
                            });
                            setHasVariants(true); // Sync hasVariants state
                          }}
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
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Regular Price (฿) *
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Member Price (฿) *
                        </label>
                        <input
                          type="number"
                          value={productForm.memberPrice || ""}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              memberPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="0.00"
                          required
                        />
                      </div>
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
                              console.log(
                                "🗑️ REMOVE IMAGE - Edit Product mode:",
                                {
                                  hasLocalFile: !!productImageFile,
                                  hasExistingImage: !!productForm.mainImage,
                                }
                              );
                              setProductImageFile(null);
                              if (!productImageFile && productForm.mainImage) {
                                // Mark existing images for removal
                                setShouldRemoveMainImages(true);
                                setProductForm({
                                  ...productForm,
                                  mainImage: null,
                                });
                                console.log(
                                  "🗑️ Marked existing images for removal"
                                );
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
                          onChange={(e) => {
                            const file = e.target.files[0];
                            console.log(
                              "📁 IMAGE UPLOAD DEBUG - File selected (Edit Product):",
                              {
                                fileName: file?.name,
                                fileSize: file?.size,
                                fileType: file?.type,
                                isValidFile: file instanceof File,
                                timestamp: new Date().toISOString(),
                              }
                            );
                            setProductImageFile(file);
                          }}
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
                                        // Sync with variants state
                                        setVariants(updatedVariants);
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
                                              {typeof option.memberPrice ===
                                              "number"
                                                ? ` /M ฿${option.memberPrice}`
                                                : ""}
                                              {option.unit &&
                                                ` (${option.unit})`}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            {editingVariantOption &&
                                            editingVariantOption.groupIndex ===
                                              groupIndex &&
                                            editingVariantOption.optionIndex ===
                                              optionIndex ? (
                                              <div
                                                className="flex items-center gap-2"
                                                role="group"
                                                aria-label="Edit variant option inline form"
                                              >
                                                <input
                                                  aria-label="Option name"
                                                  title="Option name"
                                                  className="w-24 px-1 py-0.5 text-xs border rounded"
                                                  value={
                                                    editingVariantValues.name
                                                  }
                                                  onChange={(e) =>
                                                    setEditingVariantValues(
                                                      (v) => ({
                                                        ...v,
                                                        name: e.target.value,
                                                      })
                                                    )
                                                  }
                                                  required
                                                />
                                                <div className="flex flex-col">
                                                  <input
                                                    aria-label="Standard price"
                                                    title="Standard price"
                                                    type="number"
                                                    step="0.01"
                                                    className="w-16 px-1 py-0.5 text-xs border rounded"
                                                    value={
                                                      editingVariantValues.price
                                                    }
                                                    onChange={(e) =>
                                                      setEditingVariantValues(
                                                        (v) => ({
                                                          ...v,
                                                          price: e.target.value,
                                                        })
                                                      )
                                                    }
                                                    required
                                                  />
                                                  <span className="text-[10px] text-gray-400">
                                                    Price
                                                  </span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <input
                                                    aria-label="Member price"
                                                    title="Member price (leave blank if none)"
                                                    type="number"
                                                    step="0.01"
                                                    className="w-16 px-1 py-0.5 text-xs border rounded"
                                                    value={
                                                      editingVariantValues.memberPrice
                                                    }
                                                    onChange={(e) =>
                                                      setEditingVariantValues(
                                                        (v) => ({
                                                          ...v,
                                                          memberPrice:
                                                            e.target.value,
                                                        })
                                                      )
                                                    }
                                                    placeholder=""
                                                  />
                                                  <span className="text-[10px] text-gray-400">
                                                    Member
                                                  </span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <input
                                                    aria-label="Unit"
                                                    title="Measurement unit (optional)"
                                                    className="w-14 px-1 py-0.5 text-xs border rounded"
                                                    value={
                                                      editingVariantValues.unit
                                                    }
                                                    onChange={(e) =>
                                                      setEditingVariantValues(
                                                        (v) => ({
                                                          ...v,
                                                          unit: e.target.value,
                                                        })
                                                      )
                                                    }
                                                    placeholder="unit"
                                                  />
                                                  <span className="text-[10px] text-gray-400">
                                                    Unit
                                                  </span>
                                                </div>
                                                <div className="flex flex-col">
                                                  <div className="flex gap-2 items-start">
                                                    {/* Image Preview */}
                                                    {editingVariantValues.imageUrl && (
                                                      <div className="relative">
                                                        <Image
                                                          src={
                                                            editingVariantValues.imageUrl
                                                          }
                                                          alt="Option preview"
                                                          width={48}
                                                          height={48}
                                                          className="w-12 h-12 object-cover rounded border"
                                                        />
                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            setEditingVariantValues(
                                                              (v) => ({
                                                                ...v,
                                                                imageUrl: "",
                                                              })
                                                            )
                                                          }
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
                                                        onChange={async (e) => {
                                                          const file =
                                                            e.target.files[0];
                                                          if (file) {
                                                            try {
                                                              const imageUrl =
                                                                await uploadSingleVariantImage(
                                                                  file,
                                                                  editingProduct.id,
                                                                  variantGroup.id,
                                                                  editingVariantOption.id
                                                                );
                                                              setEditingVariantValues(
                                                                (v) => ({
                                                                  ...v,
                                                                  imageUrl:
                                                                    imageUrl,
                                                                })
                                                              );
                                                            } catch (error) {
                                                              console.error(
                                                                "Error uploading image:",
                                                                error
                                                              );
                                                              alert(
                                                                "Failed to upload image. Please try again."
                                                              );
                                                            }
                                                          }
                                                        }}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        id={`variant-option-image-upload-${editingVariantOption.id}`}
                                                      />
                                                      <label
                                                        htmlFor={`variant-option-image-upload-${editingVariantOption.id}`}
                                                        className={`block w-full px-2 py-1 border border-dashed rounded text-center cursor-pointer text-xs transition-colors ${
                                                          editingVariantValues.imageUrl
                                                            ? "border-green-300 bg-green-50 text-green-600"
                                                            : "border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400"
                                                        }`}
                                                      >
                                                        {editingVariantValues.imageUrl
                                                          ? "Change"
                                                          : "Upload"}
                                                      </label>
                                                    </div>
                                                  </div>
                                                  <span className="text-[10px] text-gray-400 mt-1">
                                                    Image
                                                  </span>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={async () => {
                                                    const updated = [
                                                      ...productForm.variants,
                                                    ];
                                                    updated[groupIndex].options[
                                                      optionIndex
                                                    ] = {
                                                      ...updated[groupIndex]
                                                        .options[optionIndex],
                                                      name: editingVariantValues.name.trim(),
                                                      price:
                                                        parseFloat(
                                                          editingVariantValues.price
                                                        ) || 0,
                                                      memberPrice:
                                                        editingVariantValues.memberPrice ===
                                                        ""
                                                          ? undefined
                                                          : parseFloat(
                                                              editingVariantValues.memberPrice
                                                            ) || 0,
                                                      unit: editingVariantValues.unit.trim(),
                                                      imageUrl:
                                                        editingVariantValues.imageUrl.trim(),
                                                    };
                                                    const updatedProductForm = {
                                                      ...productForm,
                                                      variants: updated,
                                                    };
                                                    setProductForm(
                                                      updatedProductForm
                                                    );
                                                    // Sync with variants state
                                                    setVariants(updated);
                                                    setEditingVariantOption(
                                                      null
                                                    );

                                                    // Auto-save to Firestore
                                                    try {
                                                      setIsProductSaving(true);
                                                      const cleanProductData = {
                                                        name: updatedProductForm.name,
                                                        description:
                                                          updatedProductForm.description,
                                                        categoryId:
                                                          updatedProductForm.categoryId,
                                                        categoryName:
                                                          updatedProductForm.categoryName,
                                                        subcategoryId:
                                                          updatedProductForm.subcategoryId,
                                                        subcategoryName:
                                                          updatedProductForm.subcategoryName,
                                                        hasVariants:
                                                          updatedProductForm.hasVariants,
                                                        price:
                                                          updatedProductForm.price ||
                                                          0,
                                                        variants: updated,
                                                        sku: updatedProductForm.sku,
                                                        barcode:
                                                          updatedProductForm.barcode,
                                                        supplier:
                                                          updatedProductForm.supplier,
                                                        isActive:
                                                          updatedProductForm.isActive,
                                                        isFeatured:
                                                          updatedProductForm.isFeatured,
                                                        tags:
                                                          updatedProductForm.tags ||
                                                          [],
                                                        notes:
                                                          updatedProductForm.notes,
                                                        textColor:
                                                          updatedProductForm.textColor,
                                                        backgroundImage:
                                                          updatedProductForm.backgroundImage,
                                                        backgroundFit:
                                                          updatedProductForm.backgroundFit,
                                                      };
                                                      await ProductService.updateProduct(
                                                        editingProduct.id,
                                                        cleanProductData
                                                      );
                                                      await loadDashboardData();
                                                    } catch (error) {
                                                      console.error(
                                                        "Error saving variant option:",
                                                        error
                                                      );
                                                      alert(
                                                        "Error saving changes. Please try again."
                                                      );
                                                    } finally {
                                                      setIsProductSaving(false);
                                                    }
                                                  }}
                                                  className="text-green-600 hover:text-green-800 text-xs"
                                                >
                                                  Save
                                                </button>
                                                <button
                                                  type="button"
                                                  className="text-gray-500 hover:text-gray-700 text-xs"
                                                  onClick={() =>
                                                    setEditingVariantOption(
                                                      null
                                                    )
                                                  }
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            ) : (
                                              <>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setEditingVariantOption({
                                                      groupIndex,
                                                      optionIndex,
                                                    });
                                                    setEditingVariantValues({
                                                      name: option.name || "",
                                                      price: (
                                                        option.price ?? 0
                                                      ).toString(),
                                                      // Show blank if memberPrice not explicitly set
                                                      memberPrice:
                                                        option.memberPrice ===
                                                          undefined ||
                                                        option.memberPrice ===
                                                          null
                                                          ? ""
                                                          : option.memberPrice.toString(),
                                                      unit: option.unit || "",
                                                      imageUrl:
                                                        option.imageUrl || "",
                                                    });
                                                  }}
                                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                                >
                                                  Edit
                                                </button>
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
                                                      (_, i) =>
                                                        i !== optionIndex
                                                    );
                                                    setProductForm({
                                                      ...productForm,
                                                      variants: updatedVariants,
                                                    });
                                                    // Sync with variants state
                                                    setVariants(
                                                      updatedVariants
                                                    );
                                                  }}
                                                  className="text-red-600 hover:text-red-800 text-xs"
                                                >
                                                  Remove
                                                </button>
                                              </>
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

                        {/* Options for this variant group */}
                        <div id="edit-variant-options-container">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Add Options to this Variant Group:
                          </label>
                          <div
                            className="space-y-2"
                            id="edit-variant-options-list"
                          >
                            {/* Options will be added here dynamically */}
                          </div>

                          {/* Add Option Form */}
                          <div className="border border-gray-200 rounded-lg p-3 bg-white">
                            <div className="grid grid-cols-1 gap-3">
                              {/* Option Details Row */}
                              <div className="grid grid-cols-4 gap-2">
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
                                    Member Price (฿)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    id="edit-option-member-price-input"
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
                                <div className="flex gap-3">
                                  {/* Image Preview */}
                                  {editOptionImageFile && (
                                    <div className="relative">
                                      <img
                                        src={URL.createObjectURL(
                                          editOptionImageFile
                                        )}
                                        alt="Option preview"
                                        className="w-16 h-16 object-cover rounded border"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditOptionImageFile(null)
                                        }
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
                                        setEditOptionImageFile(
                                          e.target.files[0]
                                        )
                                      }
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                      id="edit-option-image-upload"
                                    />
                                    <label
                                      htmlFor="edit-option-image-upload"
                                      className={`block w-full px-3 py-2 border border-dashed rounded-md text-center cursor-pointer text-xs transition-colors ${
                                        editOptionImageFile
                                          ? "border-green-300 bg-green-50 text-green-600"
                                          : "border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400"
                                      }`}
                                    >
                                      {editOptionImageFile
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
                                      .getElementById("edit-option-name-input")
                                      .value.trim();
                                    const optionPrice =
                                      parseFloat(
                                        document.getElementById(
                                          "edit-option-price-input"
                                        ).value
                                      ) || 0;
                                    const memberPriceRaw =
                                      document.getElementById(
                                        "edit-option-member-price-input"
                                      ).value;
                                    const optionMemberPrice =
                                      memberPriceRaw.trim() === ""
                                        ? null
                                        : parseFloat(memberPriceRaw) || 0;
                                    const optionUnit = document
                                      .getElementById("edit-option-unit-input")
                                      .value.trim();

                                    if (optionName) {
                                      // Handle option image
                                      let optionImageData = null;
                                      if (editOptionImageFile) {
                                        optionImageData = {
                                          file: editOptionImageFile,
                                          url: URL.createObjectURL(
                                            editOptionImageFile
                                          ),
                                          name: editOptionImageFile.name,
                                        };
                                      }

                                      // Add to temporary options list display
                                      const optionsList =
                                        document.getElementById(
                                          "edit-variant-options-list"
                                        );
                                      const optionDiv =
                                        document.createElement("div");
                                      optionDiv.className =
                                        "flex items-center justify-between bg-white p-2 rounded border";

                                      const imagePreview = optionImageData
                                        ? `<img src="${optionImageData.url}" alt="${optionName}" class="w-8 h-8 object-cover rounded mr-2" />`
                                        : '<div class="w-8 h-8 bg-gray-200 rounded mr-2 flex items-center justify-center"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';

                                      const memberSegment =
                                        optionMemberPrice !== null
                                          ? ` /M ฿${optionMemberPrice}`
                                          : "";
                                      optionDiv.innerHTML = `
                                        <div class="flex items-center">
                                          ${imagePreview}
                                          <span class="text-sm">${optionName} - ฿${optionPrice}${memberSegment}${
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
                                        "edit-option-name-input"
                                      ).value = "";
                                      document.getElementById(
                                        "edit-option-price-input"
                                      ).value = "";
                                      document.getElementById(
                                        "edit-option-unit-input"
                                      ).value = "";
                                      document.getElementById(
                                        "edit-option-member-price-input"
                                      ).value = "";
                                      setEditOptionImageFile(null);
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

                        {/* Save Variant Group Button */}
                        <div className="mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              const groupName = document
                                .getElementById("edit-variant-group-name")
                                .value.trim();
                              const optionsList = document.getElementById(
                                "edit-variant-options-list"
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
                                const remainder = parts[1] || "0";

                                let price = 0;
                                let memberPrice = undefined;
                                let unit = "";

                                // Extract unit if present in parentheses at end
                                const unitMatch =
                                  remainder.match(/\(([^)]+)\)$/);
                                if (unitMatch) {
                                  unit = unitMatch[1];
                                }
                                const remainderNoUnit = unitMatch
                                  ? remainder.replace(unitMatch[0], "").trim()
                                  : remainder.trim();
                                const memberMatch =
                                  remainderNoUnit.match(/(.*) \/M ฿(.*)/);
                                if (memberMatch) {
                                  price = parseFloat(memberMatch[1]) || 0;
                                  const mp = parseFloat(memberMatch[2]);
                                  if (!isNaN(mp)) memberPrice = mp;
                                } else {
                                  price = parseFloat(remainderNoUnit) || 0;
                                }

                                // Get image data if exists
                                const imageData =
                                  optionElement._imageData || null;

                                options.push({
                                  id: Date.now().toString() + i,
                                  name: name,
                                  price: price,
                                  ...(memberPrice !== undefined
                                    ? { memberPrice }
                                    : {}),
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
                                order: (productForm.variants?.length || 0) + 1,
                              };

                              // Add to product form variants
                              const updatedVariants = [
                                ...(productForm.variants || []),
                                newVariantGroup,
                              ];
                              setProductForm({
                                ...productForm,
                                variants: updatedVariants,
                              });
                              // Sync with variants state
                              setVariants(updatedVariants);

                              // Clear form
                              document.getElementById(
                                "edit-variant-group-name"
                              ).value = "";
                              document.getElementById(
                                "edit-variant-options-list"
                              ).innerHTML = "";
                              setEditOptionImageFile(null);
                            }}
                            className="w-full px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Save Variant Group
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setShouldRemoveMainImages(false); // Reset flag on cancel
                      }}
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
                        (Array.isArray(selectedCustomerForPoints.points)
                          ? selectedCustomerForPoints.points.reduce(
                              (total, point) => total + (point.amount || 0),
                              0
                            )
                          : 0) ||
                        0}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-600">
                      Total Earned
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {selectedCustomerForPoints.totalEarned ||
                        (Array.isArray(selectedCustomerForPoints.points)
                          ? selectedCustomerForPoints.points.reduce(
                              (total, point) => total + (point.amount || 0),
                              0
                            )
                          : 0) ||
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
                          return selectedCustomerForPoints.totalSpent.toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          );
                        }
                        // Otherwise, calculate from points array
                        if (
                          selectedCustomerForPoints.points &&
                          Array.isArray(selectedCustomerForPoints.points)
                        ) {
                          const total = selectedCustomerForPoints.points.reduce(
                            (sum, point) => {
                              // If point has totalSpent and it's > 0, use it (already in baht)
                              if (point.totalSpent && point.totalSpent > 0) {
                                return sum + point.totalSpent;
                              }
                              // Check other possible amount fields
                              if (
                                point.purchaseAmount &&
                                point.purchaseAmount > 0
                              ) {
                                return sum + point.purchaseAmount;
                              }
                              if (
                                point.transactionAmount &&
                                point.transactionAmount > 0
                              ) {
                                return sum + point.transactionAmount;
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
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Transaction History
                    </h4>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => openPointAdjustmentModal("add")}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        <span className="mr-1">+</span>
                        Add Points
                      </button>
                      <button
                        onClick={() => openPointAdjustmentModal("reduce")}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        <span className="mr-1">-</span>
                        Reduce Points
                      </button>
                    </div>
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
                            Point Details
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
                        Array.isArray(selectedCustomerForPoints.points) &&
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
                                    // If totalSpent is available, use it (already in baht)
                                    if (
                                      point.totalSpent &&
                                      point.totalSpent > 0
                                    ) {
                                      return point.totalSpent.toLocaleString(
                                        "en-US",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      );
                                    }
                                    // If totalSpent is 0, try to find the shopping amount from other fields
                                    // Check if there's a purchaseAmount, transactionAmount, or similar field
                                    if (
                                      point.purchaseAmount &&
                                      point.purchaseAmount > 0
                                    ) {
                                      return point.purchaseAmount.toLocaleString(
                                        "en-US",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      );
                                    }
                                    if (
                                      point.transactionAmount &&
                                      point.transactionAmount > 0
                                    ) {
                                      return point.transactionAmount.toLocaleString(
                                        "en-US",
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }
                                      );
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <span
                                    className={
                                      point.type === "minus"
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }
                                  >
                                    {point.type === "minus" ? "-" : "+"}
                                    {point.amount || 0}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {point.pointBreakdown &&
                                  point.pointBreakdown.length > 0 ? (
                                    <div className="space-y-1">
                                      {point.pointBreakdown.map(
                                        (item, itemIndex) => (
                                          <div
                                            key={itemIndex}
                                            className="text-xs bg-gray-50 p-2 rounded"
                                          >
                                            <div className="font-medium">
                                              {item.productName}
                                            </div>
                                            <div className="text-gray-600">
                                              {item.quantity}x ฿{item.price} = ฿
                                              {item.total}
                                            </div>
                                            <div className="text-green-600">
                                              {item.cashbackPercentage}% ={" "}
                                              {item.pointsEarned} pts
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  ) : point.reason ? (
                                    <div className="text-xs text-gray-600">
                                      {point.reason}
                                      {point.details && (
                                        <div className="text-gray-500">
                                          {point.details}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">
                                      No details
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      point.isManualAdjustment
                                        ? point.type === "minus"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-blue-100 text-blue-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {point.isManualAdjustment
                                      ? `Manual ${
                                          point.type === "minus"
                                            ? "Reduction"
                                            : "Addition"
                                        }`
                                      : point.source || "purchase"}
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
                              colSpan="7"
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
                      setEditingPaymentMethod(false);
                      setNewPaymentMethod("");
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
                        {(() => {
                          if (selectedTransactionDetails.createdAt) {
                            let date;
                            if (selectedTransactionDetails.createdAt.seconds) {
                              // Firestore timestamp
                              date = new Date(
                                selectedTransactionDetails.createdAt.seconds *
                                  1000
                              );
                            } else if (
                              selectedTransactionDetails.createdAt instanceof
                              Date
                            ) {
                              date = selectedTransactionDetails.createdAt;
                            } else if (
                              typeof selectedTransactionDetails.createdAt ===
                              "string"
                            ) {
                              date = new Date(
                                selectedTransactionDetails.createdAt
                              );
                            } else if (selectedTransactionDetails.timestamp) {
                              // Fallback to timestamp
                              date = new Date(
                                selectedTransactionDetails.timestamp
                              );
                            } else {
                              return "N/A";
                            }

                            if (isNaN(date.getTime())) {
                              return "N/A";
                            }

                            return date.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                          }
                          return "N/A";
                        })()}
                      </p>
                      <p>
                        <span className="font-medium">Points Earned:</span>{" "}
                        {selectedTransactionDetails.pointsEarned ||
                          selectedTransactionDetails.amount ||
                          0}
                      </p>
                      <p>
                        <span className="font-medium">Phone:</span>{" "}
                        {selectedTransactionDetails.customerCell || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium">Payment Method:</span>{" "}
                        {editingPaymentMethod ? (
                          <div className="inline-flex items-center space-x-2">
                            <select
                              value={newPaymentMethod}
                              onChange={(e) =>
                                setNewPaymentMethod(e.target.value)
                              }
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="cash">Cash</option>
                              <option value="crypto">Crypto</option>
                              <option value="bank_transfer">
                                Bank Transfer
                              </option>
                            </select>
                            <button
                              onClick={handleUpdatePaymentMethod}
                              disabled={updatingPaymentMethod}
                              className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
                            >
                              {updatingPaymentMethod ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancelEditPaymentMethod}
                              className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-2">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                              {selectedTransactionDetails.paymentMethod ||
                                "N/A"}
                            </span>
                            <button
                              onClick={handleStartEditPaymentMethod}
                              className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                            >
                              Change
                            </button>
                          </div>
                        )}
                      </p>
                      <p className="text-lg">
                        <span className="font-medium">Total Amount:</span>
                        <span className="font-bold text-green-600 ml-2">
                          ฿
                          {(() => {
                            // Try different amount fields
                            const amount =
                              selectedTransactionDetails.total ||
                              selectedTransactionDetails.totalSpent ||
                              selectedTransactionDetails.amount ||
                              0;

                            return amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            });
                          })()}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                {selectedTransactionDetails.items &&
                selectedTransactionDetails.items.length > 0 ? (
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
                                    {item.name ||
                                      item.productName ||
                                      "Unknown Product"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ID: {item.productId || item.id || "N/A"}
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
                                            {key}:{" "}
                                            {value?.name ||
                                              (typeof value === "string"
                                                ? value
                                                : JSON.stringify(value))}
                                          </span>
                                        )
                                      )}
                                    {(!item.variants ||
                                      Object.keys(item.variants).length ===
                                        0) && (
                                      <span className="text-gray-400 text-xs">
                                        No variants
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  ฿
                                  {(item.price || 0).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {item.quantity || 1}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  ฿
                                  {(
                                    (item.price || 0) * (item.quantity || 1)
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
                ) : (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                    <div className="flex items-center">
                      <ShoppingBag className="w-6 h-6 text-orange-500 mr-3" />
                      <div>
                        <h4 className="text-md font-semibold text-orange-900">
                          No Item Details Available
                        </h4>
                        <p className="text-sm text-orange-700 mt-1">
                          This transaction was processed but detailed item
                          information is not available. This might be an older
                          transaction or points adjustment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction Details */}
                <div className="bg-yellow-50 rounded-lg p-4 mt-4">
                  <h4 className="text-md font-semibold text-gray-900 mb-2">
                    Transaction Details
                  </h4>
                  <p className="text-sm text-gray-700">
                    {selectedTransactionDetails.details ||
                      selectedTransactionDetails.reason ||
                      `${
                        selectedTransactionDetails.type || "purchase"
                      } transaction - ${
                        selectedTransactionDetails.source || "kiosk purchase"
                      }`}
                  </p>
                  {selectedTransactionDetails.orderId && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Order ID:</span>{" "}
                      {selectedTransactionDetails.orderId}
                    </p>
                  )}
                  {selectedTransactionDetails.paymentMethod && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Payment Method:</span>{" "}
                      {selectedTransactionDetails.paymentMethod}
                    </p>
                  )}
                </div>
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
                  onClick={() => {
                    setSelectedTransaction(null);
                    setEditingPaymentMethod(false);
                    setNewPaymentMethod("");
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
                          Payment Method:{" "}
                        </span>
                        {editingPaymentMethod ? (
                          <div className="inline-flex items-center space-x-2">
                            <select
                              value={newPaymentMethod}
                              onChange={(e) =>
                                setNewPaymentMethod(e.target.value)
                              }
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="cash">Cash</option>
                              <option value="crypto">Crypto</option>
                              <option value="bank_transfer">
                                Bank Transfer
                              </option>
                            </select>
                            <button
                              onClick={handleUpdatePaymentMethod}
                              disabled={updatingPaymentMethod}
                              className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50"
                            >
                              {updatingPaymentMethod ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancelEditPaymentMethod}
                              className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-2">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                              {selectedTransaction.paymentMethod || "N/A"}
                            </span>
                            <button
                              onClick={handleStartEditPaymentMethod}
                              className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                            >
                              Change
                            </button>
                          </div>
                        )}
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
                    onClick={() => {
                      setSelectedTransaction(null);
                      setEditingPaymentMethod(false);
                      setNewPaymentMethod("");
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Admin Modal */}
        {showAddAdmin && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create New Admin
                </h3>
              </div>

              <form onSubmit={handleSaveAdmin}>
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={newAdminData.email}
                      onChange={(e) =>
                        setNewAdminData({
                          ...newAdminData,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="admin@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength="6"
                      value={newAdminData.password}
                      onChange={(e) =>
                        setNewAdminData({
                          ...newAdminData,
                          password: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Permissions *
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newAdminData.permissions.edit}
                          onChange={(e) =>
                            setNewAdminData({
                              ...newAdminData,
                              permissions: {
                                ...newAdminData.permissions,
                                edit: e.target.checked,
                              },
                            })
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          <strong>Edit:</strong> Can modify customer, product,
                          and category data
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newAdminData.permissions.delete}
                          onChange={(e) =>
                            setNewAdminData({
                              ...newAdminData,
                              permissions: {
                                ...newAdminData.permissions,
                                delete: e.target.checked,
                              },
                            })
                          }
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          <strong>Delete:</strong> Can permanently remove data
                          from the system
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newAdminData.permissions.input}
                          onChange={(e) =>
                            setNewAdminData({
                              ...newAdminData,
                              permissions: {
                                ...newAdminData.permissions,
                                input: e.target.checked,
                              },
                            })
                          }
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          <strong>Input:</strong> Can create new customers,
                          products, and categories
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancelAddAdmin}
                    disabled={addingAdmin}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingAdmin}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {addingAdmin ? "Creating..." : "Create Admin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Admin Password Modal */}
        {showChangePasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Change Admin Password
                </h3>
              </div>

              <form onSubmit={handleSaveNewPassword}>
                <div className="px-6 py-4 space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    <p>
                      <strong>Admin Email:</strong> {changingPasswordAdminEmail}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength="6"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new password (minimum 6 characters)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength="6"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new password"
                    />
                  </div>

                  {newPassword &&
                    confirmPassword &&
                    newPassword !== confirmPassword && (
                      <div className="text-red-600 text-sm">
                        Passwords do not match
                      </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancelChangePassword}
                    disabled={changingPassword}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      changingPassword ||
                      !newPassword ||
                      !confirmPassword ||
                      newPassword !== confirmPassword
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {changingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Point Adjustment Modal */}
        {showPointAdjustmentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {pointAdjustmentType === "add"
                    ? "Add Points"
                    : "Reduce Points"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {pointAdjustmentType === "add"
                    ? "Add points to"
                    : "Reduce points from"}{" "}
                  {selectedCustomerForPoints?.name}
                </p>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={pointAdjustmentAmount}
                    onChange={(e) => setPointAdjustmentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={pointAdjustmentReason}
                    onChange={(e) => setPointAdjustmentReason(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter reason for point adjustment"
                  />
                </div>

                {pointAdjustmentType === "reduce" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Current Points:</strong>{" "}
                      {selectedCustomerForPoints?.currentPoints ||
                        (Array.isArray(selectedCustomerForPoints?.points)
                          ? selectedCustomerForPoints.points.reduce(
                              (total, point) => total + (point.amount || 0),
                              0
                            )
                          : 0)}
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Make sure the customer has enough points before reducing.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={closePointAdjustmentModal}
                  disabled={isProcessingPointAdjustment}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={processPointAdjustment}
                  disabled={
                    isProcessingPointAdjustment ||
                    !pointAdjustmentAmount ||
                    !pointAdjustmentReason.trim()
                  }
                  className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                    pointAdjustmentType === "add"
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {isProcessingPointAdjustment
                    ? "Processing..."
                    : pointAdjustmentType === "add"
                    ? "Add Points"
                    : "Reduce Points"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stock Alert Modal */}
        {showStockAlertModal && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Stock Alert Management
                  </h3>
                  <button
                    onClick={() => setShowStockAlertModal(false)}
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

                {/* Create New Alert Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Create New Stock Alert
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Product Selection - Searchable Dropdown */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Product
                      </label>
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={alertProductSearch}
                        onChange={(e) => {
                          setAlertProductSearch(e.target.value);
                          setShowAlertProductDropdown(true);
                        }}
                        onFocus={() => setShowAlertProductDropdown(true)}
                        onBlur={() => {
                          // Delay hiding to allow click events to register
                          setTimeout(
                            () => setShowAlertProductDropdown(false),
                            150
                          );
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />

                      {/* Dropdown List */}
                      {showAlertProductDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {products
                            .filter(
                              (p) =>
                                !alertProductSearch ||
                                `${p.categoryName || "Uncategorized"} - ${
                                  p.subcategoryName || "No Subcategory"
                                } - ${p.name}`
                                  .toLowerCase()
                                  .includes(alertProductSearch.toLowerCase())
                            )
                            .slice(0, 50)
                            .map((p) => {
                              if (
                                p.variants &&
                                Array.isArray(p.variants) &&
                                p.variants.length > 0
                              ) {
                                return p.variants
                                  .map((variant) => {
                                    if (
                                      variant.options &&
                                      Array.isArray(variant.options)
                                    ) {
                                      return variant.options.map((option) => (
                                        <div
                                          key={`${p.id}-${variant.id}-${option.id}`}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log(
                                              "Stock Alert: Selecting product variant:",
                                              p.name,
                                              variant.variantName,
                                              option.name
                                            );
                                            const productWithVariant = {
                                              ...p,
                                              variantId: `${variant.id}-${option.id}`,
                                              variantName: `${variant.variantName}: ${option.name}`,
                                              selectedVariant: variant,
                                              selectedOption: option,
                                            };
                                            setSelectedProductForAlert(
                                              productWithVariant
                                            );
                                            setAlertProductSearch(
                                              `${
                                                p.categoryName ||
                                                "Uncategorized"
                                              } - ${
                                                p.subcategoryName ||
                                                "No Subcategory"
                                              } - ${p.name} - ${
                                                variant.variantName
                                              } - ${option.name}`
                                            );
                                            setShowAlertProductDropdown(false);
                                          }}
                                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100"
                                        >
                                          <div className="font-medium text-gray-900">
                                            {p.categoryName || "Uncategorized"}{" "}
                                            -{" "}
                                            {p.subcategoryName ||
                                              "No Subcategory"}{" "}
                                            - {p.name}
                                          </div>
                                          <div className="text-xs text-blue-600">
                                            {variant.variantName}: {option.name}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            Current Stock:{" "}
                                            {getCurrentStock(
                                              p,
                                              `${variant.id}-${option.id}`
                                            )}
                                          </div>
                                        </div>
                                      ));
                                    }
                                    return (
                                      <div
                                        key={`${p.id}-${variant.id}`}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log(
                                            "Stock Alert: Selecting product variant (no options):",
                                            p.name,
                                            variant.name
                                          );
                                          const productWithVariant = {
                                            ...p,
                                            variantId: variant.id,
                                            variantName:
                                              variant.name ||
                                              `Variant ${variant.id}`,
                                            selectedVariant: variant,
                                          };
                                          setSelectedProductForAlert(
                                            productWithVariant
                                          );
                                          setAlertProductSearch(
                                            `${
                                              p.categoryName || "Uncategorized"
                                            } - ${
                                              p.subcategoryName ||
                                              "No Subcategory"
                                            } - ${p.name} - ${
                                              variant.name || "Variant"
                                            }`
                                          );
                                          setShowAlertProductDropdown(false);
                                        }}
                                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100"
                                      >
                                        <div className="font-medium text-gray-900">
                                          {p.categoryName || "Uncategorized"} -{" "}
                                          {p.subcategoryName ||
                                            "No Subcategory"}{" "}
                                          - {p.name}
                                        </div>
                                        <div className="text-xs text-blue-600">
                                          {variant.name || "Variant"}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          Current Stock:{" "}
                                          {getCurrentStock(p, variant.id)}
                                        </div>
                                      </div>
                                    );
                                  })
                                  .flat();
                              } else {
                                return (
                                  <div
                                    key={p.id}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log(
                                        "Stock Alert: Selecting product (no variants):",
                                        p.name
                                      );
                                      setSelectedProductForAlert(p);
                                      setAlertProductSearch(
                                        `${
                                          p.categoryName || "Uncategorized"
                                        } - ${
                                          p.subcategoryName || "No Subcategory"
                                        } - ${p.name}`
                                      );
                                      setShowAlertProductDropdown(false);
                                    }}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100"
                                  >
                                    <div className="font-medium text-gray-900">
                                      {p.categoryName || "Uncategorized"} -{" "}
                                      {p.subcategoryName || "No Subcategory"} -{" "}
                                      {p.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Current Stock: {getCurrentStock(p)}
                                    </div>
                                  </div>
                                );
                              }
                            })
                            .flat()}

                          {alertProductSearch &&
                            products.filter((p) =>
                              `${p.categoryName || "Uncategorized"} - ${
                                p.subcategoryName || "No Subcategory"
                              } - ${p.name}`
                                .toLowerCase()
                                .includes(alertProductSearch.toLowerCase())
                            ).length === 0 && (
                              <div className="px-3 py-2 text-gray-500 text-sm">
                                No products found matching &quot;
                                {alertProductSearch}&quot;
                              </div>
                            )}
                        </div>
                      )}
                    </div>

                    {/* Kiosk Alert Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alert at Kiosk (qty)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={alertKioskLevel}
                        onChange={(e) => setAlertKioskLevel(e.target.value)}
                        placeholder="e.g., 5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>

                    {/* Admin Alert Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alert at Admin (qty)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={alertAdminLevel}
                        onChange={(e) => setAlertAdminLevel(e.target.value)}
                        placeholder="e.g., 2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>

                    {/* Create Button */}
                    <div className="flex items-end">
                      <button
                        onClick={createStockAlert}
                        disabled={
                          !selectedProductForAlert ||
                          !alertKioskLevel ||
                          !alertAdminLevel
                        }
                        className={`w-full px-4 py-2 text-white text-sm font-medium rounded-md ${
                          !selectedProductForAlert ||
                          !alertKioskLevel ||
                          !alertAdminLevel
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-yellow-600 hover:bg-yellow-700"
                        }`}
                      >
                        Create Alert
                      </button>
                    </div>
                  </div>

                  {/* Current Stock Display */}
                  {selectedProductForAlert && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Current Stock:</strong>{" "}
                        {getCurrentStock(
                          selectedProductForAlert,
                          selectedProductForAlert?.variantId
                        )}{" "}
                        units
                        {selectedProductForAlert.variantName && (
                          <span className="block text-xs text-blue-600 mt-1">
                            Variant: {selectedProductForAlert.variantName}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Existing Alerts List */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Existing Stock Alerts ({stockAlerts.length})
                  </h4>

                  {stockAlerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No stock alerts configured yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Current Stock
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kiosk Alert
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Admin Alert
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
                          {stockAlerts.map((alert) => {
                            const product = products.find(
                              (p) => p.id === alert.productId
                            );
                            const currentStock = product
                              ? getCurrentStock(product, alert.variantId)
                              : 0;
                            const isKioskAlert =
                              currentStock <= alert.alertKioskLevel;
                            const isAdminAlert =
                              currentStock <= alert.alertAdminLevel;

                            return (
                              <tr
                                key={alert.id}
                                className={`${
                                  isKioskAlert || isAdminAlert
                                    ? "bg-red-50"
                                    : ""
                                }`}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {alert.productName || "Unknown Product"}
                                  </div>
                                  {alert.variantName && (
                                    <div className="text-xs text-blue-600">
                                      {alert.variantName}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    ID: {alert.productId}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div
                                    className={`text-sm font-medium ${
                                      isKioskAlert || isAdminAlert
                                        ? "text-red-600"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {currentStock}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      isKioskAlert
                                        ? "bg-red-100 text-red-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {alert.alertKioskLevel}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      isAdminAlert
                                        ? "bg-red-100 text-red-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {alert.alertAdminLevel}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {isKioskAlert || isAdminAlert ? (
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                      ⚠️ ALERT
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                      ✅ OK
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <button
                                    onClick={() => deleteStockAlert(alert.id)}
                                    className="text-red-600 hover:text-red-900 text-sm"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowStockAlertModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Crypto Payment Details Modal */}
      {showCryptoPaymentModal && selectedCryptoPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <svg
                    className="w-6 h-6 mr-3 text-purple-600"
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
                  Crypto Payment Details
                </h3>
                <button
                  onClick={() => {
                    setShowCryptoPaymentModal(false);
                    setSelectedCryptoPayment(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Payment Status Banner */}
              <div
                className={`p-4 rounded-lg border ${
                  selectedCryptoPayment.payment_status === "finished" ||
                  selectedCryptoPayment.payment_status === "confirmed"
                    ? "bg-green-50 border-green-200"
                    : selectedCryptoPayment.payment_status === "waiting"
                    ? "bg-yellow-50 border-yellow-200"
                    : selectedCryptoPayment.payment_status === "confirming" ||
                      selectedCryptoPayment.payment_status === "sending"
                    ? "bg-blue-50 border-blue-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        selectedCryptoPayment.payment_status === "finished" ||
                        selectedCryptoPayment.payment_status === "confirmed"
                          ? "bg-green-500"
                          : selectedCryptoPayment.payment_status === "waiting"
                          ? "bg-yellow-500"
                          : selectedCryptoPayment.payment_status ===
                              "confirming" ||
                            selectedCryptoPayment.payment_status === "sending"
                          ? "bg-blue-500 animate-pulse"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span
                      className={`font-semibold capitalize ${
                        selectedCryptoPayment.payment_status === "finished" ||
                        selectedCryptoPayment.payment_status === "confirmed"
                          ? "text-green-800"
                          : selectedCryptoPayment.payment_status === "waiting"
                          ? "text-yellow-800"
                          : selectedCryptoPayment.payment_status ===
                              "confirming" ||
                            selectedCryptoPayment.payment_status === "sending"
                          ? "text-blue-800"
                          : "text-red-800"
                      }`}
                    >
                      {selectedCryptoPayment.payment_status}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      checkCryptoPaymentStatus(selectedCryptoPayment.payment_id)
                    }
                    disabled={checkingCryptoStatus}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 text-sm"
                  >
                    {checkingCryptoStatus
                      ? "🔄 Checking..."
                      : "↻ Refresh Status"}
                  </button>
                </div>
              </div>

              {/* Payment Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Payment Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Payment Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment ID:</span>
                      <span className="font-mono text-gray-900">
                        {selectedCryptoPayment.payment_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-mono text-gray-900">
                        {selectedCryptoPayment.order_id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="text-gray-900">
                        {selectedCryptoPayment.created_at?.toLocaleString()}
                      </span>
                    </div>
                    {selectedCryptoPayment.expiration_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expires:</span>
                        <span className="text-gray-900">
                          {selectedCryptoPayment.expiration_date?.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Customer Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="text-gray-900">
                        {selectedCryptoPayment.customer_name || "No Member"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span className="text-gray-900">
                        {selectedCryptoPayment.cart_items?.length || 0} items
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Information */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Amount Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-gray-600">Thai Baht</div>
                    <div className="text-2xl font-bold text-green-600">
                      ฿{selectedCryptoPayment.total_bath?.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">USD Amount</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${selectedCryptoPayment.total_usd?.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600">
                      {selectedCryptoPayment.pay_currency?.toUpperCase()}
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedCryptoPayment.pay_amount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Crypto Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Cryptocurrency Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">Payment Address:</div>
                    <div className="font-mono bg-white p-2 rounded border text-xs break-all">
                      {selectedCryptoPayment.pay_address || "N/A"}
                    </div>
                  </div>
                  {selectedCryptoPayment.payin_hash && (
                    <div>
                      <div className="text-gray-600 mb-1">
                        Transaction Hash:
                      </div>
                      <div className="font-mono bg-white p-2 rounded border text-xs break-all">
                        {selectedCryptoPayment.payin_hash}
                      </div>
                    </div>
                  )}
                  {selectedCryptoPayment.actually_paid && (
                    <div>
                      <div className="text-gray-600 mb-1">Actually Paid:</div>
                      <div className="font-mono bg-white p-2 rounded border">
                        {selectedCryptoPayment.actually_paid}{" "}
                        {selectedCryptoPayment.pay_currency?.toUpperCase()}
                      </div>
                    </div>
                  )}
                  {selectedCryptoPayment.outcome_amount && (
                    <div>
                      <div className="text-gray-600 mb-1">Outcome Amount:</div>
                      <div className="font-mono bg-white p-2 rounded border">
                        {selectedCryptoPayment.outcome_amount}{" "}
                        {selectedCryptoPayment.outcome_currency?.toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cart Items */}
              {selectedCryptoPayment.cart_items &&
                selectedCryptoPayment.cart_items.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Order Items
                    </h4>
                    <div className="space-y-2">
                      {selectedCryptoPayment.cart_items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.name}
                            </div>
                            {item.variant && (
                              <div className="text-sm text-gray-600">
                                {item.variant}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-gray-900">
                              Qty: {item.quantity}
                            </div>
                            <div className="text-sm text-gray-600">
                              ฿{(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Raw Payment Data (for debugging) */}
              <details className="border border-gray-200 rounded-lg">
                <summary className="p-3 cursor-pointer bg-gray-50 font-medium text-gray-700 hover:bg-gray-100">
                  Raw Payment Data (Debug)
                </summary>
                <div className="p-3 bg-gray-900 text-green-400 font-mono text-xs overflow-auto max-h-64">
                  <pre>{JSON.stringify(selectedCryptoPayment, null, 2)}</pre>
                </div>
              </details>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() =>
                  checkCryptoPaymentStatus(selectedCryptoPayment.payment_id)
                }
                disabled={checkingCryptoStatus}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {checkingCryptoStatus ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Checking...
                  </>
                ) : (
                  <>
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh Status
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowCryptoPaymentModal(false);
                  setSelectedCryptoPayment(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminAuthGuard>
  );
}
