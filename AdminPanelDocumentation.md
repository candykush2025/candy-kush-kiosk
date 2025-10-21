# Admin Panel Documentation

**File:** `src/app/admin/page.js`  
**Total Lines:** ~19,383 lines  
**Last Updated:** October 21, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Permissions](#authentication--permissions)
3. [State Management](#state-management)
4. [Tab System](#tab-system)
5. [useEffect Hooks Map](#useeffect-hooks-map)
6. [Core Modules](#core-modules)
7. [Product Management](#product-management)
8. [Stock Management](#stock-management)
9. [Customer Management](#customer-management)
10. [Transaction Management](#transaction-management)
11. [Category & Cashback](#category--cashback)
12. [Settings & Configuration](#settings--configuration)

---

## Overview

The Admin Panel is a comprehensive back-office system for managing the entire Candy Kush Kiosk operation. It provides tools for:

- Customer management (registration, points, status)
- Product catalog (products, categories, variants, images, 3D models, **cashback rules**)
- Inventory control (stock in, purchasing, alerts, movements)
- Transaction history and analytics
- Cashback rules configuration
- Admin user management with permissions
- System settings (payment methods, conversion rates)

**Key Technologies:**

- React with Next.js 15
- Firebase Firestore for data
- @dnd-kit for drag-and-drop (category ordering)
- Role-based access control (view/edit/delete permissions)

---

## Authentication & Permissions

### AdminAuthGuard Component

- Wraps the entire admin panel
- Checks for valid admin session
- Redirects to `/admin/login` if not authenticated

### Permission Levels

```javascript
{
  view: boolean,    // Can view data
  edit: boolean,    // Can create/update
  delete: boolean   // Can delete records
}
```

### Permission Check Functions

- `checkViewPermission()` - Shows alert if no view permission
- `checkEditPermission()` - Shows alert if no edit permission
- `checkDeletePermission()` - Shows alert if no delete permission

**Used throughout:** All CRUD operations check permissions before proceeding

---

## State Management

### Core Data States

```javascript
const [customers, setCustomers] = useState([]); // All customers
const [transactions, setTransactions] = useState([]); // All transactions
const [products, setProducts] = useState([]); // All products
const [categories, setCategories] = useState([]); // All categories
const [subcategories, setSubcategories] = useState([]); // All subcategories
const [loading, setLoading] = useState(true); // Initial load state
```

### Selected Items (for viewing/editing)

```javascript
const [selectedCustomer, setSelectedCustomer] = useState(null);
const [selectedTransaction, setSelectedTransaction] = useState(null);
const [selectedProduct, setSelectedProduct] = useState(null);
```

### Dashboard Stats

```javascript
const [stats, setStats] = useState({
  totalCustomers: 0,
  totalTransactions: 0,
  totalProducts: 0,
  totalRevenue: 0,
  todayVisits: 0,
});
```

### Search & Filters

```javascript
const [searchTerm, setSearchTerm] = useState(""); // Customer search
const [transactionSearchTerm, setTransactionSearchTerm] = useState(""); // Transaction search
const [productSearchTerm, setProductSearchTerm] = useState(""); // Product search

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
```

### Editing States

```javascript
const [editingCustomer, setEditingCustomer] = useState(null);
const [editingProduct, setEditingProduct] = useState(null);
const [editingCashback, setEditingCashback] = useState(null);
const [editingCategory, setEditingCategory] = useState(null);
const [editingSubcategory, setEditingSubcategory] = useState(null);
```

### Category Ordering (Drag & Drop)

```javascript
const [orderList, setOrderList] = useState([]); // Array of category IDs
const [orderDirty, setOrderDirty] = useState(false); // Has order changed?
const [savingCategoryOrder, setSavingCategoryOrder] = useState(false);
const [orderingCategories, setOrderingCategories] = useState(false); // DnD active
```

### Non-Member Access Control

```javascript
const [nonMemberCategories, setNonMemberCategories] = useState([]); // Categories visible to non-members
const [savingNonMemberCategories, setSavingNonMemberCategories] =
  useState(false);
```

### Tab System

```javascript
const [activeTab, setActiveTab] = useState("dashboard");
// Tabs: dashboard, customers, transactions, products, categories,
//       subcategories, cashback, admins, settings, stock, stockIn,
//       purchasing, stockAlerts, stockOverview, categoryOrder,
//       nonMemberCategories, cryptoPayments, pendingPoints
```

### Modal States

```javascript
const [showAddCustomer, setShowAddCustomer] = useState(false);
const [showAddProduct, setShowAddProduct] = useState(false);
const [showAddCategory, setShowAddCategory] = useState(false);
const [showAddSubcategory, setShowAddSubcategory] = useState(false);
const [showAddCashback, setShowAddCashback] = useState(false);
const [showPointAdjustmentModal, setShowPointAdjustmentModal] = useState(false);
const [showTransactionDetails, setShowTransactionDetails] = useState(false);
```

### Deletion Confirmation States

```javascript
const [deletingCustomerId, setDeletingCustomerId] = useState(null);
const [deletingTransactionId, setDeletingTransactionId] = useState(null);
const [deletingTransactionIndex, setDeletingTransactionIndex] = useState(null);
```

### Processing States

```javascript
const [addingCustomer, setAddingCustomer] = useState(false);
const [updatingCustomer, setUpdatingCustomer] = useState(false);
const [isProcessingPointAdjustment, setIsProcessingPointAdjustment] =
  useState(false);
const [updatingPaymentMethod, setUpdatingPaymentMethod] = useState(false);
```

### Customer Forms

```javascript
const [newCustomer, setNewCustomer] = useState({
  memberId: "",
  name: "",
  phone: "",
  email: "",
  nationality: "",
  birthdate: "",
  points: 0,
  isActive: true,
});

const [customerForm, setCustomerForm] = useState({
  memberId: "",
  name: "",
  phone: "",
  email: "",
  nationality: "",
  birthdate: "",
  points: 0,
  isActive: true,
});
```

### Product Forms

```javascript
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
  cashbackEnabled: false, // ← Product cashback
  cashbackType: "percentage", // ← "percentage" or "fixed"
  cashbackValue: 0, // ← Cashback value
  cashbackMinPurchase: 0, // ← Minimum purchase
});

const [newProduct, setNewProduct] = useState({
  /* same fields */
});
```

### Variant Management

```javascript
const [variants, setVariants] = useState([]); // Array of variant groups
const [hasVariants, setHasVariants] = useState(false);

// Variant Structure:
// [
//   {
//     id: "timestamp",
//     variantName: "Size",
//     options: [
//       { id, name, price, memberPrice, unit, imageUrl, isActive }
//     ]
//   }
// ]
```

### Image Upload States

```javascript
const [productImageFile, setProductImageFile] = useState(null);
const [productBackgroundImageFile, setProductBackgroundImageFile] =
  useState(null);
const [productModelFile, setProductModelFile] = useState(null);
const [categoryImageFile, setCategoryImageFile] = useState(null);
const [shouldRemoveMainImages, setShouldRemoveMainImages] = useState(false);
```

### Category & Cashback Forms

```javascript
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
  isActive: true,
});

const [cashbackForm, setCashbackForm] = useState({
  categoryId: "",
  categoryName: "",
  percentage: 0,
  isActive: true,
});
```

### Stock Management States

```javascript
// Stock In
const [stockInForm, setStockInForm] = useState({
  date: new Date().toISOString().split("T")[0],
  referenceNumber: "",
  supplier: "",
  notes: "",
  products: [
    {
      productId: "",
      productName: "",
      quantity: 0,
      variantId: "",
      variantName: "",
    },
  ],
});

// Purchasing
const [purchasingForm, setPurchasingForm] = useState({
  date: new Date().toISOString().split("T")[0],
  supplier: "",
  purchaseOrder: "",
  notes: "",
  products: [
    {
      productId: "",
      productName: "",
      quantity: 0,
      unitCost: 0,
      variantId: "",
      variantName: "",
    },
  ],
});

// Stock Data
const [stockMovements, setStockMovements] = useState([]);
const [purchaseOrders, setPurchaseOrders] = useState([]);
const [stockAlerts, setStockAlerts] = useState([]);
const [allStockCalculations, setAllStockCalculations] = useState({});
```

### Admin Management States

```javascript
const [admins, setAdmins] = useState([]);
const [newAdmin, setNewAdmin] = useState({
  username: "",
  password: "",
  name: "",
  permissions: { view: false, edit: false, delete: false },
  isActive: true,
});

const [editingAdmin, setEditingAdmin] = useState(null);
const [changingPassword, setChangingPassword] = useState(null);
const [newPassword, setNewPassword] = useState("");
```

### Settings States

```javascript
const [pointsSettings, setPointsSettings] = useState({
  pointsToMoneyRatio: 1,
  pointsEarnedPerMoney: 1,
  bathToUsdRate: 0.029,
});

const [nonMemberPaymentSettings, setNonMemberPaymentSettings] = useState({
  cash: true,
  card: true,
  crypto: true,
});
```

### Crypto Payments

```javascript
const [cryptoPayments, setCryptoPayments] = useState([]);
const [cryptoPaymentStatusFilter, setCryptoPaymentStatusFilter] =
  useState("all");
// Statuses: waiting, confirming, confirmed, finished, failed, expired
```

### Nationality Dropdown (Customer Form)

```javascript
const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
const [nationalitySearch, setNationalitySearch] = useState("");
const [showEditNationalityDropdown, setShowEditNationalityDropdown] =
  useState(false);
const [editNationalitySearch, setEditNationalitySearch] = useState("");
```

---

## Tab System

The admin panel uses a tabbed interface controlled by `activeTab` state and URL parameter `?tab=`.

### Available Tabs

| Tab Key               | Display Name      | Purpose                         |
| --------------------- | ----------------- | ------------------------------- |
| `dashboard`           | Dashboard         | Overview stats, recent activity |
| `customers`           | Customers         | Customer list, add/edit, points |
| `transactions`        | Transactions      | Transaction history, filters    |
| `products`            | Products          | Product catalog, add/edit       |
| `categories`          | Categories        | Category management             |
| `subcategories`       | Subcategories     | Subcategory management          |
| `cashback`            | Cashback Rules    | Category-level cashback         |
| `categoryOrder`       | Category Order    | Drag-and-drop reordering        |
| `nonMemberCategories` | Non-Member Access | Control what non-members see    |
| `admins`              | Admins            | Admin user management           |
| `settings`            | Settings          | System configuration            |
| `stock`               | Stock Movements   | Stock history                   |
| `stockIn`             | Stock In          | Receive inventory               |
| `purchasing`          | Purchasing        | Purchase orders                 |
| `stockAlerts`         | Stock Alerts      | Low stock warnings              |
| `stockOverview`       | Stock Overview    | Current inventory levels        |
| `cryptoPayments`      | Crypto Payments   | Crypto transaction tracking     |
| `pendingPoints`       | Pending Points    | Points awaiting approval        |

### Tab Navigation

- Click sidebar button → `setActiveTab(tabKey)`
- URL syncs automatically via useEffect
- Browser back/forward buttons supported

---

## useEffect Hooks Map

### 1. **Load Dashboard Data on Mount** (Line ~130)

```javascript
useEffect(() => {
  loadDashboardData();
}, [loadDashboardData]);
```

**Purpose:** Initial data load (customers, transactions, products, categories, etc.)

---

### 2. **Sync Active Tab with URL** (Line ~146)

```javascript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  if (tab) {
    setActiveTab(tab);
  }
}, []);
```

**Purpose:** Load tab from URL on page load

---

### 3. **Load Dashboard When Tab Changes** (Line ~1023)

```javascript
useEffect(() => {
  if (activeTab === "dashboard") {
    loadDashboardData();
  }
}, [activeTab, loadDashboardData]);
```

**Purpose:** Refresh dashboard stats when switching to dashboard tab

---

### 4. **Load Crypto Payments When Tab Active** (Line ~1028)

```javascript
useEffect(() => {
  if (activeTab === "cryptoPayments") {
    loadCryptoPayments();
  }
}, [activeTab, cryptoPaymentStatusFilter]);
```

**Purpose:** Load crypto payment data when viewing crypto tab

---

### 5. **Update URL When Tab Changes** (Line ~1038)

```javascript
useEffect(() => {
  if (typeof window === "undefined") return;
  const current = new URL(window.location.href);
  if (activeTab === "dashboard") {
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
```

**Purpose:** Keep URL in sync with active tab (no page reload)

---

### 6. **Browser Back/Forward Support** (Line ~1056)

```javascript
useEffect(() => {
  const handler = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") || "dashboard";
    setActiveTab(tab);
  };
  window.addEventListener("popstate", handler);
  return () => window.removeEventListener("popstate", handler);
}, []);
```

**Purpose:** Handle browser back/forward navigation

---

### 7. **Load Crypto Payments on Mount** (Line ~1067)

```javascript
useEffect(() => {
  loadCryptoPayments();
}, []);
```

**Purpose:** Initial load of crypto payments

---

### 8. **Load Admins When Tab Active** (Line ~1074)

```javascript
useEffect(() => {
  if (activeTab === "admins") {
    loadAdmins();
  }
}, [activeTab]);
```

**Purpose:** Load admin users when viewing admins tab

---

### 9. **Sync Product Form When Editing** (Line ~1129)

```javascript
useEffect(() => {
  if (editingProduct) {
    setVariants(editingProduct.variants || []);
    setHasVariants(editingProduct.hasVariants || false);
    setProductForm({
      name: editingProduct.name || "",
      // ... all fields including cashback
      cashbackEnabled:
        editingProduct.cashbackEnabled !== undefined
          ? editingProduct.cashbackEnabled
          : false,
      cashbackType: editingProduct.cashbackType || "percentage",
      cashbackValue:
        editingProduct.cashbackValue !== undefined
          ? editingProduct.cashbackValue
          : 0,
      cashbackMinPurchase:
        editingProduct.cashbackMinPurchase !== undefined
          ? editingProduct.cashbackMinPurchase
          : 0,
    });
    setProductImageFile(null);
    setProductBackgroundImageFile(null);
  }
}, [editingProduct]);
```

**Purpose:** Load product data into form when editing
**Critical:** Must include all cashback fields to prevent undefined values in edit mode

---

### 10. **Load Stock Movements When Tab Active** (Line ~3233)

```javascript
useEffect(() => {
  if (activeTab === "stock") {
    loadStockMovementsData();
  }
}, [activeTab]);
```

**Purpose:** Load stock movement history

---

### 11. **Load Purchasing Data When Tab Active** (Line ~3415)

```javascript
useEffect(() => {
  if (activeTab === "purchasing") {
    loadPurchasingData();
  }
}, [activeTab]);
```

**Purpose:** Load purchase orders

---

### 12. **Filter Transactions** (Line ~4058)

```javascript
useEffect(() => {
  applyTransactionFilters();
}, [transactions, transactionFilters, transactionSearchTerm]);
```

**Purpose:** Re-filter transactions when filters change

---

## Core Modules

### Dashboard Module (Lines ~4100-4500)

**Features:**

- Stats cards (customers, transactions, products, revenue)
- Recent transactions list
- Top customers by points
- Quick actions (add customer, add product)
- Today's visits count

**Key Functions:**

- `loadDashboardData()` - Loads all stats

---

### Customer Module (Lines ~4500-8000)

**Features:**

- Customer list with search
- Add new customer (with Member ID validation)
- Edit customer details
- Activate/deactivate customer
- Delete customer
- View points history
- Adjust points (add/reduce)
- Nationality dropdown (searchable)

**Key Functions:**

- `handleAddCustomer()` - Open add customer modal
- `handleSaveCustomer()` - Create new customer
- `handleMemberIdChange()` - Validate unique member ID
- `handleDeleteCustomer()` - Delete customer and all related data
- `handleToggleCustomerStatus()` - Activate/deactivate
- `handleViewPointsHistory()` - Show points transactions
- `handleDeletePointTransaction()` - Remove point entry

**Member ID Validation:**

- Real-time check for duplicates
- Shows checkmark (✓) if available
- Shows X (✗) if taken

---

### Transaction Module (Lines ~8000-10000)

**Features:**

- Transaction list with pagination
- Advanced filters (date range, category, product, customer, payment method, amount range)
- Search by customer name or transaction ID
- View transaction details modal
- Delete transaction (with points rollback)
- Edit payment method (admin only)
- Export transactions

**Key Functions:**

- `loadTransactionsCollection()` - Load from Firebase
- `deleteTransaction()` - Delete and rollback points
- `applyTransactionFilters()` - Filter logic
- `handleStartEditPaymentMethod()` - Edit payment
- `handleUpdatePaymentMethod()` - Save payment change

**Transaction Details Modal:**

- Items purchased
- Total, discount, points used/earned
- Cashback breakdown per item
- Payment method
- Customer info
- Timestamp

---

### Product Module (Lines ~10000-15000)

**Features:**

- Product list with search
- Add new product (simple or variant)
- Edit product
- Delete product
- Toggle active status
- Image upload (main, background)
- 3D model upload (.glb files)
- Variant management
- **Product-level cashback rules** ⭐

**Product Form Fields:**

- Basic: name, description, SKU, barcode, supplier
- Category: categoryId, subcategoryId
- Pricing: price, memberPrice (for non-variant)
- Variants: multi-level variant system
- Media: images, background image, 3D model
- Styling: text color, background fit
- Status: isActive, isFeatured
- Tags & Notes
- **Cashback: enabled, type, value, minimum** ⭐

**Variant System:**

- Variant groups (e.g., "Size", "Color")
- Each group has options (e.g., Small, Medium, Large)
- Each option has: price, memberPrice, unit, image
- Variants added one-by-one, can edit/delete

**Key Functions:**

- `handleSaveProduct()` - Create/update product
  - Validates required fields
  - Uploads images to Firebase Storage
  - Processes variants with imageUrls
  - **Saves cashback fields** ⭐
- `handleDeleteProduct()` - Delete and remove images
- `handleToggleProductStatus()` - Active/inactive
- Image upload handlers for main/background/model files

**Cashback Section (Lines ~14575-14700 & ~15722-15850):**

- Toggle: Enable/disable product cashback
- Type selector: Percentage or Fixed Amount
- Value input: % or ฿ per item
- Minimum purchase: Optional threshold
- **Present in both Add and Edit forms**

---

### Category Module (Lines ~15000-16000)

**Features:**

- Category list
- Add new category
- Edit category
- Delete category (prevents if has products)
- Background image upload
- Text color picker
- Special page designation (e.g., "personalized-joints")

**Key Functions:**

- `handleSaveCategory()` - Create/update
- `handleDeleteCategory()` - Delete with validation
- `handleEditCategory()` - Load for editing

**Category Structure:**

```javascript
{
  id: string,
  name: string,
  description: string,
  specialPage: string,
  backgroundImage: string,
  backgroundFit: "contain" | "cover",
  textColor: "#RRGGBB",
  isActive: boolean,
  order: number  // For drag-and-drop ordering
}
```

---

### Subcategory Module (Lines ~16000-17000)

**Features:**

- Subcategory list (grouped by category)
- Add new subcategory
- Edit subcategory
- Delete subcategory (prevents if has products)

**Key Functions:**

- `handleSaveSubcategory()` - Create/update
- `handleDeleteSubcategory()` - Delete with validation
- `handleEditSubcategory()` - Load for editing

---

### Cashback Module (Lines ~17000-18000)

**Features:**

- Category-level cashback rules
- Add new rule
- Edit rule
- Delete rule
- Toggle rule active/inactive

**Cashback Rule Structure:**

```javascript
{
  id: string,
  categoryId: string,
  categoryName: string,
  percentage: number,    // 0-100
  isActive: boolean
}
```

**Key Functions:**

- `handleAddCashbackRule()` - Open form
- `handleSaveCashback()` - Create/update
- `handleDeleteCashback()` - Delete rule
- `handleToggleCashbackStatus()` - Active/inactive

**Priority System:**

1. **Product-level cashback** (checked first)
2. **Category-level cashback** (fallback)

---

### Category Order Module (Lines ~18000-18300)

**Features:**

- Drag-and-drop category reordering
- Visual feedback while dragging
- Save button (only enabled if order changed)

**Libraries:**

- @dnd-kit/core
- @dnd-kit/sortable

**Key Functions:**

- `handleDragEnd()` - Update order on drop
- `handleSaveCategoryOrder()` - Persist to Firebase

**How It Works:**

1. Categories loaded with `order` field
2. Rendered in sortable list
3. Drag to reorder
4. Order recalculated (0, 1, 2, ...)
5. Save updates all categories in Firebase

---

### Non-Member Categories Module (Lines ~18300-18500)

**Features:**

- Checkbox list of all categories
- Select which categories non-members can see
- Save to Firebase settings

**Key Functions:**

- `handleSaveNonMemberCategories()` - Save selection

**Use Case:** Restrict certain categories (e.g., premium products) to members only

---

### Admin Management Module (Lines ~18500-19000)

**Features:**

- Admin user list
- Add new admin
- Edit permissions
- Delete admin
- Toggle active status
- Change password

**Admin Structure:**

```javascript
{
  id: string,
  username: string,
  password: string,  // Hashed
  name: string,
  permissions: { view, edit, delete },
  isActive: boolean,
  createdAt: timestamp
}
```

**Key Functions:**

- `handleAddAdmin()` - Create admin
- `handleUpdateAdminPermissions()` - Update permissions
- `handleDeleteAdmin()` - Delete admin
- `handleChangeAdminPassword()` - Update password
- `handleToggleAdminStatus()` - Active/inactive

---

### Settings Module (Lines ~19000-19200)

**Features:**

- Points-to-money ratio
- Points earned per money spent
- Bath-to-USD conversion rate
- Non-member payment methods (cash/card/crypto toggles)

**Key Functions:**

- `loadSettings()` - Load from Firebase
- `handleSaveSettings()` - Update Firebase

**Settings Structure:**

```javascript
{
  pointsSettings: {
    pointsToMoneyRatio: 1,      // 1 point = 1 baht
    pointsEarnedPerMoney: 1,    // Earn 1 point per 1 baht spent
    bathToUsdRate: 0.029        // Conversion for crypto
  },
  nonMemberPaymentSettings: {
    cash: true,
    card: true,
    crypto: true
  }
}
```

---

## Product Management

### Product Creation Flow

1. **Open Add Product Modal**

   - Click "Add Product" button
   - `setShowAddProduct(true)`

2. **Fill Basic Info**

   - Name, description
   - Select category & subcategory
   - Enter SKU, barcode, supplier (optional)

3. **Choose Product Type**

   - **Simple Product:**
     - Enter price & member price
     - Upload images
   - **Variant Product:**
     - Toggle "Has Variants"
     - Add variant groups
     - For each group, add options with prices

4. **Upload Media (Optional)**

   - Main image (required)
   - Background image
   - 3D model (.glb file)

5. **Configure Styling**

   - Text color (color picker)
   - Background fit (contain/cover)

6. **Set Cashback Rules** ⭐

   - Toggle "Enable Product Cashback"
   - Select type: Percentage or Fixed Amount
   - Enter value
   - Set minimum purchase (optional)

7. **Save**
   - `handleSaveProduct()` validates and saves to Firebase
   - Uploads images to Firebase Storage
   - Generates product ID (PRD-XXXXX)

---

### Product Edit Flow

1. **Click Edit Button**

   - `setEditingProduct(product)`
   - useEffect loads product into `productForm`

2. **Modify Fields**

   - Any field can be changed
   - **Cashback fields are now properly loaded** ✅

3. **Save Changes**
   - `handleSaveProduct()` in edit mode
   - Updates Firebase document
   - Re-uploads images if changed

**Recent Fix (Oct 21, 2025):**

- Added cashback fields to useEffect that syncs `editingProduct` → `productForm`
- Now correctly loads: `cashbackEnabled`, `cashbackType`, `cashbackValue`, `cashbackMinPurchase`

---

### Variant Product Management

**Structure:**

```javascript
variants: [
  {
    id: "1729512000000",           // Timestamp
    variantName: "Size",            // Group name
    options: [
      {
        id: "17295120000000",      // Unique option ID
        name: "Small",              // Option name
        price: 20,                  // Option price
        memberPrice: 15,            // Member price
        unit: "pcs",                // Unit (g, ml, pcs, etc.)
        imageUrl: "https://...",    // Option image
        isActive: true              // Status
      },
      { /* Medium */ },
      { /* Large */ }
    ]
  },
  {
    id: "1729512100000",
    variantName: "Color",
    options: [...]
  }
]
```

**Adding Variants (New Product):**

1. Click "Add Variant" → opens variant form
2. Enter variant name (e.g., "Size")
3. Add options:
   - Click "Add Option"
   - Fill: name, price, member price, unit
   - Upload image (optional)
4. Click "Add Variant" → adds to `variants` array
5. Repeat for more variant groups

**Editing Variants (Existing Product):**

1. Product form shows existing variants
2. Can edit option details inline
3. Can delete options/variants
4. Can add new options to existing variants

**In Menu/Kiosk:**

- Customer selects one option from each variant
- Price calculated from selected options
- Cart item includes `variants` object with selections

---

### Image Upload System

**Main Image:**

- Single product image
- Shown in kiosk grid view
- Required for new products

**Background Image:**

- Used as product detail background
- Optional
- Can set fit mode (contain/cover)

**3D Model:**

- .glb file upload
- Viewed with model-viewer
- Rotation controls (X, Y, Z)
- Optional

**Storage Path:**

```
products/
  ├── {productId}/
  │   ├── main_image.jpg
  │   ├── background_image.jpg
  │   ├── model_file.glb
  │   └── variants/
  │       └── {variantId}/
  │           └── {optionName}_{optionId}.jpg
```

---

## Stock Management

### Stock In Module

**Purpose:** Record incoming inventory

**Flow:**

1. Click "Add Stock In"
2. Fill details:
   - Date
   - Reference number
   - Supplier
   - Notes
3. Add products:
   - Select product (with variant if applicable)
   - Enter quantity
4. Save → Creates `StockMovement` record with type "stock_in"

---

### Purchasing Module

**Purpose:** Record purchase orders and costs

**Flow:**

1. Click "Add Purchasing"
2. Fill details:
   - Date
   - Supplier
   - Purchase order number
   - Notes
3. Add products:
   - Select product (with variant)
   - Enter quantity & unit cost
4. Save → Creates `StockMovement` record with type "purchase"

**Difference from Stock In:**

- Purchasing tracks costs
- Stock In just tracks quantity received

---

### Stock Alerts Module

**Purpose:** Set low stock warnings

**Features:**

- List of all alerts
- Edit alert message & threshold
- Delete alerts
- Auto-triggered in kiosk when stock low

**Alert Structure:**

```javascript
{
  id: string,
  productId: string,
  productName: string,
  message: string,
  threshold: number,  // Alert when stock ≤ this
  createdAt: timestamp
}
```

---

### Stock Overview Module

**Purpose:** View current inventory levels

**Calculation:**

```
Current Stock = Starting Stock + Purchases + Stock In + Adjustments - Sales
```

**Data Source:**

- Aggregates all `StockMovement` records
- Groups by product/variant
- Shows available quantity

**Display:**

- Searchable product list
- Shows current stock per variant
- Color-coded (red if low, green if good)

---

### Stock Movement History

**Purpose:** Audit trail of all inventory changes

**Movement Types:**

- `stock_in` - Inventory received
- `purchase` - Purchase order
- `sale` - Sold to customer
- `adjustment` - Manual correction
- `return` - Customer return

**Each Record:**

```javascript
{
  id: string,
  type: "stock_in" | "purchase" | "sale" | "adjustment" | "return",
  productId: string,
  productName: string,
  variantId: string,  // Optional
  variantName: string,
  quantity: number,   // Positive or negative
  unitCost: number,   // For purchases
  date: timestamp,
  reference: string,  // PO number, invoice, etc.
  notes: string,
  createdBy: string,
  createdAt: timestamp
}
```

---

## Customer Management

### Customer Structure

```javascript
{
  id: string,                    // Firestore doc ID
  memberId: string,              // Unique member code (e.g., "CK001")
  code: string,                  // QR code value (same as memberId)
  name: string,
  phone: string,
  email: string,
  nationality: string,           // From countries list
  birthdate: string,             // YYYY-MM-DD
  points: [                      // Points history
    {
      amount: number,            // Positive or negative
      type: "earned" | "used" | "adjusted" | "rollback",
      transactionId: string,
      reason: string,
      date: timestamp
    }
  ],
  totalPoints: number,           // Calculated sum
  isActive: boolean,
  isNoMember: boolean,           // Special "No Member" customer
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Customer Operations

**Add Customer:**

- Validates unique member ID
- Creates with initial 0 points
- Generates QR code

**Edit Customer:**

- Can update all fields except member ID
- Points edited separately via adjustment

**Delete Customer:**

- Deletes customer document
- Deletes all transactions
- Deletes points history

**Activate/Deactivate:**

- Inactive customers cannot login to kiosk
- Preserves all data

**Points Adjustment:**

- Add Points: Increases total, records reason
- Reduce Points: Decreases total, records reason
- Type: "adjusted"
- Shows in points history

**Points History:**

- Modal showing all point transactions
- Can delete individual entries
- Recalculates total after deletion

---

## Transaction Management

### Transaction Structure

```javascript
{
  id: string,
  customerId: string,
  customerName: string,
  customerCode: string,
  items: [
    {
      productId: string,
      name: string,
      price: number,
      quantity: number,
      image: string,
      categoryId: string,
      variants: object,          // If variant product
      cashbackEarned: number     // Per-item cashback
    }
  ],
  total: number,
  discount: number,              // From points usage
  pointsUsed: number,
  cashback: number,              // Total cashback earned
  cashbackDetails: [             // Per-item breakdown
    {
      productId: string,
      name: string,
      cashback: number,
      appliedRule: "product" | "category",
      ruleType: "percentage" | "fixed",
      ruleValue: number
    }
  ],
  paymentMethod: "cash" | "card" | "crypto",
  cryptoPaymentId: string,       // If crypto
  createdAt: timestamp
}
```

### Transaction Filters

**Available Filters:**

- Date range (from/to)
- Category
- Product
- Customer
- Payment method
- Amount range (min/max)
- Text search (customer name, transaction ID)

**Filter Logic:**

- All filters are AND-ed together
- Empty filters are ignored
- Real-time filtering (no need to click search)

**Performance:**

- Uses `useMemo` for filtered list
- Debounced search input
- Pagination (if > 100 results)

---

### Deleting Transactions

**Process:**

1. Confirm deletion
2. Load customer record
3. Calculate cashback earned (if any)
4. Find corresponding point entries
5. Remove point entries
6. Recalculate customer total points
7. Update customer in Firebase
8. Delete transaction document
9. Reload data

**Points Rollback:**

- Removes "earned" points from this transaction
- Removes "used" points deduction
- Updates customer's `totalPoints`

---

## Category & Cashback

### Category-Level Cashback

**How It Works:**

1. Admin creates cashback rule for a category
2. Sets percentage (e.g., 5%)
3. When customer purchases item from that category:
   - If product has **product-level cashback** → use that (priority)
   - If no product cashback → use **category cashback** (fallback)
   - If neither → no cashback

**Example:**

```
Category: "Cannabis Flowers"
Cashback: 5%

Product A:
  - Has product cashback: 10%
  - Customer gets: 10% ← Product rule wins

Product B:
  - No product cashback
  - Customer gets: 5% ← Category rule used

Product C (different category):
  - No product cashback
  - No category cashback
  - Customer gets: 0%
```

### Cashback Calculation

**Handled by:** `CashbackService` in `productService.js`

**Function:** `calculateCartCashback(cartItems)`

```javascript
// Returns:
{
  totalCashback: number,
  itemsWithCashback: [
    {
      productId: string,
      productName: string,
      cashback: number,
      appliedRule: "product" | "category",
      ruleType: "percentage" | "fixed",
      ruleValue: number,
      categoryId: string,
      categoryName: string
    }
  ]
}
```

**Logic:**

1. For each cart item:
   - Check `item.cashbackEnabled`
   - If true → apply product cashback
   - If false → query category cashback rule
   - Calculate amount based on type
2. Sum all cashback amounts
3. Return total + breakdown

---

## Settings & Configuration

### Points Settings

**Ratio Configuration:**

- `pointsToMoneyRatio`: How much 1 point is worth in baht
  - Example: 1 (1 point = ฿1)
- `pointsEarnedPerMoney`: Points earned per baht spent
  - Example: 1 (spend ฿100 = earn 100 points)

**Used In:**

- Kiosk: Points-to-money slider
- Admin: Points display

---

### Payment Method Settings

**Non-Member Payment Settings:**

- Controls which payment methods non-members can use
- Toggles for: Cash, Card, Crypto
- Saved in Firebase `settings` collection

**Why?**

- Restrict non-members to cash only
- Or allow all methods for everyone

---

### Currency Settings

**Bath-to-USD Rate:**

- Used for crypto payment conversions
- NOWPayments API works in USD
- Rate updated manually in settings

**Example:**

- Cart total: ฿3,000
- Rate: 0.029
- USD amount: $87 (sent to crypto API)

---

## Important Notes for Future Edits

### ⚠️ When Editing Products

**Always ensure `productForm` initial state and `useEffect` (Line ~1129) include ALL fields:**

```javascript
cashbackEnabled: editingProduct.cashbackEnabled !== undefined ? editingProduct.cashbackEnabled : false,
cashbackType: editingProduct.cashbackType || "percentage",
cashbackValue: editingProduct.cashbackValue !== undefined ? editingProduct.cashbackValue : 0,
cashbackMinPurchase: editingProduct.cashbackMinPurchase !== undefined ? editingProduct.cashbackMinPurchase : 0,
```

**Why?** If missing, Edit Product form will show undefined values and cashback settings won't load.

---

### ⚠️ When Adding New Product Fields

1. Add to `productForm` initial state (Line ~657)
2. Add to `newProduct` initial state
3. Add to `cleanProductData` in `handleSaveProduct()` (Line ~1930)
4. Add to `updateData` in `ProductService.updateProduct()` in `productService.js`
5. Add to UI form (both Add and Edit sections)
6. Add to `useEffect` for editing (Line ~1129)

---

### ⚠️ Variant Images

**Storage:**

- Variant option images stored in `products/{productId}/variants/{variantId}/{optionName}_{optionId}.jpg`
- When editing, can replace images
- Old images are deleted automatically

**In Cart:**

- Cart items have `variants` object with selected options
- Each option includes `imageUrl`

---

### ⚠️ Permission System

**Before any create/update/delete:**

```javascript
if (!checkEditPermission()) return;
if (!checkDeletePermission()) return;
```

**Permission denied shows alert:**

```javascript
alert(
  "You don't have permission to perform this action. Contact an administrator."
);
```

---

### ⚠️ Stock Calculations

**Key:**

- Stock calculated from `StockMovement` collection
- Simple products: `{productId}`
- Variants: `{productId}-{variantId}-{optionId}`

**Update stock:**

- Create `StockMovement` record
- Type: "sale", "stock_in", "purchase", "adjustment"
- Quantity: positive (add) or negative (remove)

---

## Recent Changes (October 21, 2025)

### Product Cashback Fields in Edit Mode

**Problem:** When editing a product with cashback enabled, fields showed as undefined
**Root Cause:** `useEffect` (Line ~1129) that syncs `editingProduct` → `productForm` was missing cashback fields
**Solution:** Added cashback fields with proper undefined checks:

```javascript
cashbackEnabled: editingProduct.cashbackEnabled !== undefined ? editingProduct.cashbackEnabled : false,
cashbackType: editingProduct.cashbackType || "percentage",
cashbackValue: editingProduct.cashbackValue !== undefined ? editingProduct.cashbackValue : 0,
cashbackMinPurchase: editingProduct.cashbackMinPurchase !== undefined ? editingProduct.cashbackMinPurchase : 0,
```

**Result:** Edit Product form now correctly loads and displays cashback settings ✅

---

### ProductService.updateProduct Missing Cashback Fields

**Problem:** Product cashback saved on create but lost on edit
**Root Cause:** `updateData` object in `ProductService.updateProduct()` didn't include cashback fields
**Solution:** Added cashback fields to `updateData` (Line ~898):

```javascript
cashbackEnabled: productData.cashbackEnabled !== undefined ? productData.cashbackEnabled : false,
cashbackType: productData.cashbackType || "percentage",
cashbackValue: productData.cashbackValue !== undefined ? productData.cashbackValue : 0,
cashbackMinPurchase: productData.cashbackMinPurchase !== undefined ? productData.cashbackMinPurchase : 0,
```

**Result:** Product edits now persist cashback settings to Firestore ✅

---

## File Structure Summary

```
admin/page.js (19,383 lines)
├── Imports & Setup (1-55)
├── State Declarations (56-650)
│   ├── Core Data (56-70)
│   ├── Forms (410-650)
│   └── UI States (366-409)
├── useEffect Hooks (130-4100)
│   ├── Data Loading (130-1100)
│   └── Tab Management (1028-1074)
├── Data Loading Functions (860-3900)
│   ├── loadDashboardData() (919)
│   ├── loadTransactionsCollection() (860)
│   ├── loadStockMovementsData() (3243)
│   ├── loadCryptoPayments() (3858)
│   └── loadSettings() (2800)
├── Customer Functions (1174-1750)
│   ├── handleAddCustomer() (1174)
│   ├── handleSaveCustomer() (1265)
│   ├── handleDeleteCustomer() (1351)
│   └── handleToggleCustomerStatus() (1384)
├── Transaction Functions (1594-1800)
│   ├── deleteTransaction() (1594)
│   └── handleUpdatePaymentMethod() (1797)
├── Product Functions (1849-2230)
│   ├── handleSaveProduct() (1849)
│   ├── handleDeleteProduct() (2204)
│   └── handleToggleProductStatus() (2218)
├── Category Functions (2234-2460)
│   ├── handleSaveCategory() (2234)
│   ├── handleSaveSubcategory() (2295)
│   └── handleDeleteCategory() (2272)
├── Cashback Functions (2462-2580)
│   ├── handleSaveCashback() (2472)
│   └── handleDeleteCashback() (2549)
├── Admin Functions (2585-2800)
│   ├── handleSaveAdmin() (2612)
│   ├── handleUpdateAdminPermissions() (2682)
│   └── handleDeleteAdmin() (2726)
├── Stock Functions (2986-3700)
│   ├── handleSaveStockIn() (3029)
│   ├── handleSavePurchasing() (3302)
│   └── loadAllStockCalculations() (3667)
└── JSX Rendering (4100-19383)
    ├── Dashboard (4100-4500)
    ├── Customers (4500-8000)
    ├── Transactions (8000-10000)
    ├── Products (10000-15000)
    ├── Categories (15000-16000)
    ├── Cashback (17000-18000)
    ├── Stock Modules (18500-19000)
    └── Settings (19000-19200)
```

---

## Quick Reference Table

| Task                       | Function                 | Line  |
| -------------------------- | ------------------------ | ----- |
| Load dashboard             | `loadDashboardData()`    | 919   |
| Add customer               | `handleSaveCustomer()`   | 1265  |
| Delete customer            | `handleDeleteCustomer()` | 1351  |
| Delete transaction         | `deleteTransaction()`    | 1594  |
| Save product               | `handleSaveProduct()`    | 1849  |
| Delete product             | `handleDeleteProduct()`  | 2204  |
| Save category              | `handleSaveCategory()`   | 2234  |
| Save cashback rule         | `handleSaveCashback()`   | 2472  |
| Save admin                 | `handleSaveAdmin()`      | 2612  |
| Stock in                   | `handleSaveStockIn()`    | 3029  |
| Purchasing                 | `handleSavePurchasing()` | 3302  |
| Load settings              | `loadSettings()`         | 2800  |
| Edit product form sync     | useEffect                | 1129  |
| Product cashback UI (Add)  | JSX                      | 14575 |
| Product cashback UI (Edit) | JSX                      | 15722 |

---

**End of Documentation**
