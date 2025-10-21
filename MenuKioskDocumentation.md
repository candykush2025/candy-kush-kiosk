# Menu/Kiosk Page Documentation

**File:** `src/app/menu/page.js`  
**Total Lines:** ~6,338 lines  
**Last Updated:** October 21, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [State Management](#state-management)
3. [useEffect Hooks Map](#useeffect-hooks-map)
4. [Core Functions](#core-functions)
5. [Payment Processing](#payment-processing)
6. [Cashback System](#cashback-system)
7. [Stock Management](#stock-management)
8. [Cart Management](#cart-management)
9. [Session & Timers](#session--timers)
10. [Component Sections](#component-sections)

---

## Overview

The Menu/Kiosk page is the main customer-facing interface where customers:

- Browse categories and products
- Add items to cart (regular products, variants, personalized joints)
- Apply loyalty points
- Complete purchases with multiple payment methods (cash, card, crypto)
- Earn cashback points

**Key Features:**

- Multi-language support (EN, TH, ZH)
- Session timeout management (5 min idle, 60 sec cart timeout)
- Real-time stock checking
- Product-level and category-level cashback
- Crypto payment integration
- 3D product model viewing
- Variant product support

---

## State Management

### Customer & Authentication

```javascript
const [customer, setCustomer] = useState(null);
```

- Loaded from sessionStorage on mount
- Can be regular member or "No Member"
- Affects pricing (member vs regular) and cashback eligibility

### Product Data

```javascript
const [categories, setCategories] = useState([]); // All categories
const [subcategories, setSubcategories] = useState([]); // All subcategories
const [products, setProducts] = useState([]); // All products
const [filteredSubcategories, setFilteredSubcategories] = useState([]); // Current category's subcategories
const [filteredProducts, setFilteredProducts] = useState([]); // Current subcategory's products
const [selectedCategory, setSelectedCategory] = useState(null);
const [selectedProduct, setSelectedProduct] = useState(null);
```

### Cart & Shopping

```javascript
const [cart, setCart] = useState([]); // Cart items with cashback fields
const [quantity, setQuantity] = useState(1); // For non-variant products
const [showCart, setShowCart] = useState(false); // Cart modal visibility
```

**Cart Item Structure:**

```javascript
{
  id: string,                    // Unique ID
  productId: string,             // Product SKU
  name: string,                  // Display name
  price: number,                 // Price (member or regular)
  quantity: number,              // Quantity
  image: string,                 // Product image URL
  categoryId: string,            // For cashback calculation
  cashbackEnabled: boolean,      // Product-level cashback flag
  cashbackType: string,          // "percentage" or "fixed"
  cashbackValue: number,         // Cashback value
  cashbackMinPurchase: number,   // Minimum purchase for cashback
  variants?: object,             // For variant products
  isVariant?: boolean            // Flag for variant products
}
```

### Variant Products

```javascript
const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
const [selectedVariantOptions, setSelectedVariantOptions] = useState({});
```

- Customers select one option from each variant (e.g., Size: Small, Color: Red)
- Price is calculated from selected options

### Payment & Checkout

```javascript
const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash", "card", "crypto"
const [processing, setProcessing] = useState(false);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [paymentDetails, setPaymentDetails] = useState(null);
```

### Cashback & Points

```javascript
const [cashbackPoints, setCashbackPoints] = useState(0); // Points to earn this order
const [itemCashbackDetails, setItemCashbackDetails] = useState([]); // Per-item cashback breakdown
const [pointsUsagePercentage, setPointsUsagePercentage] = useState(0); // 0, 25, 50, 75, 100
const [pointsToUse, setPointsToUse] = useState(0); // Points to redeem
const [pointsValue, setPointsValue] = useState(0); // Baht value of points
const [categoryPercentages, setCategoryPercentages] = useState({}); // Category cashback %
```

### Stock Management

```javascript
const [stockAlerts, setStockAlerts] = useState([]); // Low stock alerts
const [stockCalculations, setStockCalculations] = useState({}); // Current stock levels
const [stockCalculationsLoaded, setStockCalculationsLoaded] = useState(false);
```

### Session & Timers

```javascript
const [cartTimer, setCartTimer] = useState(60); // 60 sec cart timeout
const [sessionTimer, setSessionTimer] = useState(60); // 5 min idle timeout (60 sec default shown)
const [showSessionExpiryModal, setShowSessionExpiryModal] = useState(false);
const [sessionModalCountdown, setSessionModalCountdown] = useState(60);
```

### Crypto Payments

```javascript
const [showCryptoModal, setShowCryptoModal] = useState(false);
const [availableCurrencies, setAvailableCurrencies] = useState([]);
const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState(null);
const [bathToUsdRate, setBathToUsdRate] = useState(0.029);
const [paymentStatus, setPaymentStatus] = useState(null);
```

### UI States

```javascript
const [showQuantityPopup, setShowQuantityPopup] = useState(false); // Product detail popup
const [isPopupClosing, setIsPopupClosing] = useState(false);
const [isPopupOpening, setIsPopupOpening] = useState(false);
const [showCartAnimation, setShowCartAnimation] = useState(false); // Add to cart animation
const [animationProduct, setAnimationProduct] = useState(null);
const [show3DView, setShow3DView] = useState(false); // 3D model viewer
const [selectedLanguage, setSelectedLanguage] = useState("en");
const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
```

### Personalized Joints (Special Feature)

```javascript
const [showPersonalizedJoints, setShowPersonalizedJoints] = useState(false);
const [selectedJointType, setSelectedJointType] = useState(null);
const [showCustomJointBuilder, setShowCustomJointBuilder] = useState(false);
```

---

## useEffect Hooks Map

### 1. **Dev Mode Detection** (Lines 765-768)

```javascript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  setIsDev(params.get("dev") === "true");
}, []);
```

**Purpose:** Enable dev features (Personalized Joints button) via `?dev=true` URL param

---

### 2. **Language Initialization** (Lines 772-777)

```javascript
useEffect(() => {
  const savedLanguage = localStorage.getItem("i18nextLng");
  if (savedLanguage && savedLanguage !== selectedLanguage) {
    setSelectedLanguage(savedLanguage);
  }
}, []);
```

**Purpose:** Load saved language preference from localStorage

---

### 3. **Load Bath to USD Rate** (Lines 781-782)

```javascript
useEffect(() => {
  loadBathToUsdRate();
}, []);
```

**Purpose:** Fetch conversion rate and non-member payment settings from Firebase

---

### 4. **Set Default Payment Method** (Lines 786-787)

```javascript
useEffect(() => {
  setDefaultPaymentMethod();
}, [customer, nonMemberPaymentSettings]);
```

**Purpose:** Auto-select first available payment method based on customer type and settings

---

### 5. **Record Visit** (Lines 791-804)

```javascript
useEffect(() => {
  if (!visitRecorded && customer) {
    VisitService.recordVisit(customer.id, "menu")
      .then(() => setVisitRecorded(true))
      .catch((err) => console.error("Error recording visit:", err));
  }
}, [visitRecorded]);
```

**Purpose:** Track customer visit analytics (once per session)

---

### 6. **Load Categories, Products, Stock** (Lines 807-966)

```javascript
useEffect(() => {
  // Massive data loading effect
  const loadData = async () => {
    // 1. Load customer from sessionStorage
    // 2. Load categories (active only, sorted by order)
    // 3. Load subcategories (active only)
    // 4. Load products (active only)
    // 5. Load cart from sessionStorage
    // 6. Load stock alerts
    // 7. Load stock calculations
    // 8. Check for special "Personalized Joints" category
  };
  loadData();
}, [router]);
```

**Purpose:** Main data initialization on page load
**Key Actions:**

- Redirects to `/` if no customer in session
- Loads all categories, subcategories, products from Firestore
- Restores cart from sessionStorage
- Loads stock data
- Sets up Personalized Joints special category

---

### 7. **Measure First Window Height** (Lines 970-974)

```javascript
useEffect(() => {
  if (firstWindowRef.current && categories.length > 0) {
    setFirstWindowHeight(firstWindowRef.current.offsetHeight);
  }
}, [categories]);
```

**Purpose:** Measure category section height for layout calculations

---

### 8. **Load 3D Model Viewer Script** (Lines 978-988)

```javascript
useEffect(() => {
  if (!document.querySelector('script[src*="model-viewer"]')) {
    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://ajax.googleapis.com/ajax/libs/model-viewer/3.0.1/model-viewer.min.js";
    document.head.appendChild(script);
  }
}, []);
```

**Purpose:** Dynamically load Google's model-viewer for 3D product models

---

### 9. **Calculate Cashback When Cart Changes** (Lines 1967-1968)

```javascript
useEffect(() => {
  calculateCashbackPoints();
}, [cart, customer, calculateCashbackPoints]);
```

**Purpose:** Recalculate cashback whenever cart or customer changes
**Triggers:** Cart add/remove/update, customer login/change

---

### 10. **Load Category Cashback Percentages** (Lines 1972-1987)

```javascript
useEffect(() => {
  const loadPercentages = async () => {
    const percentages = {};
    for (const category of categories) {
      const percentage = await getCashbackPercentageForCategory(category.id);
      percentages[category.id] = percentage;
    }
    setCategoryPercentages(percentages);
  };
  if (categories.length > 0 && customer && !customer.isNoMember) {
    loadPercentages();
  }
}, [categories, customer]);
```

**Purpose:** Load category-level cashback rules for all categories
**Only runs for:** Regular members (not "No Member")

---

### 11. **Cart Timer - 60 Second Timeout** (Lines 1991-2046)

```javascript
useEffect(() => {
  if (showCart) {
    setCartTimer(60);
    cartTimerRef.current = setInterval(() => {
      setCartTimer((prev) => {
        if (prev <= 1) {
          // Time's up! Cancel order
          clearInterval(cartTimerRef.current);
          handleCancelOrder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  } else {
    // Clear timer when cart closes
    if (cartTimerRef.current) {
      clearInterval(cartTimerRef.current);
      cartTimerRef.current = null;
    }
    setCartTimer(60);
  }
  return () => {
    if (cartTimerRef.current) clearInterval(cartTimerRef.current);
  };
}, [showCart]);
```

**Purpose:** 60-second countdown when cart is open, auto-cancel if expired
**Reset by:** Closing cart modal

---

### 12. **Session Timer - 5 Minute Idle Timeout** (Lines 2050-2151)

```javascript
useEffect(() => {
  if (!showCart) {
    // Start 5-minute session timer for main menu
    sessionTimerRef.current = setTimeout(() => {
      setShowSessionExpiryModal(true);
      setSessionModalCountdown(60);

      // 60-second countdown modal
      sessionCountdownRef.current = setInterval(() => {
        setSessionModalCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(sessionCountdownRef.current);
            handleSessionTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 300000); // 5 minutes = 300,000ms
  } else {
    // Clear session timer when cart is open
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    if (sessionCountdownRef.current) {
      clearInterval(sessionCountdownRef.current);
      sessionCountdownRef.current = null;
    }
  }

  return () => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (sessionCountdownRef.current) clearInterval(sessionCountdownRef.current);
  };
}, [showCart, router]);
```

**Purpose:** 5-minute idle timer on main menu → shows 60-second warning modal → timeout
**Paused when:** Cart is open
**Reset by:** User interaction (via `resetSessionTimer()`)

---

### 13. **Session Expiry Modal Countdown** (Lines 2155-2176)

```javascript
useEffect(() => {
  if (showSessionExpiryModal) {
    sessionCountdownRef.current = setInterval(() => {
      setSessionModalCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(sessionCountdownRef.current);
          handleSessionTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return () => {
    if (sessionCountdownRef.current) {
      clearInterval(sessionCountdownRef.current);
    }
  };
}, [showSessionExpiryModal]);
```

**Purpose:** 60-second countdown in session expiry warning modal

---

### 14. **Cleanup Payment Monitoring** (Lines 2245-2250)

```javascript
useEffect(() => {
  return () => {
    if (paymentStatusTimer) {
      clearInterval(paymentStatusTimer);
    }
  };
}, [paymentStatusTimer]);
```

**Purpose:** Clean up crypto payment status polling on unmount

---

## Core Functions

### Navigation & Selection

#### `handleCategorySelect(category)` (Lines 992-1038)

**Purpose:** Navigate into a category to view subcategories/products
**Actions:**

- Resets session timer
- Filters subcategories and products for selected category
- Sets `selectedCategory`
- Logs category permission check

#### `handleBack()` (Lines 1041-1046)

**Purpose:** Navigate back from products → categories
**Shows:** Confirmation modal if cart has items

#### `confirmBack()` (Lines 1049-1067)

**Purpose:** Confirmed back action
**Actions:**

- Clears selected category/product
- Resets filters
- Closes modals

#### `handleCancelOrder()` (Lines 1070-1072)

**Purpose:** Show cancel order confirmation modal

#### `confirmCancelOrder()` (Lines 1075-1093)

**Purpose:** Cancel order and clear cart
**Actions:**

- Clears cart and sessionStorage
- Resets timers
- Redirects to homepage

---

### Product Selection & Cart

#### `handleProductSelect(product)` (Lines 1189-1211)

**Purpose:** Open product detail popup
**Actions:**

- Resets session timer
- Opens quantity popup with animation
- Resets variant selections
- Sets initial quantity

#### `handleAddToCart()` (Lines 2275-2340)

**Purpose:** Add non-variant product to cart
**Process:**

1. Check stock availability via `canAddToCart()`
2. Show add-to-cart animation
3. Determine price (member vs regular)
4. Create cart item with **cashback fields**:
   ```javascript
   {
     id,
       name,
       price,
       quantity,
       image,
       productId,
       categoryId,
       cashbackEnabled, // ← Product cashback flag
       cashbackType, // ← "percentage" or "fixed"
       cashbackValue, // ← Cashback value
       cashbackMinPurchase; // ← Minimum purchase amount
   }
   ```
5. Update cart state and sessionStorage
6. Close popup after animation

#### `handleAddVariantToCart()` (Lines 1319-1381)

**Purpose:** Add variant product to cart
**Process:**

1. Validate all variant options selected
2. Check stock for specific variant
3. Calculate total price from selected options
4. Create variant description (e.g., "Small, Red")
5. Create cart item with **cashback fields** + variants:
   ```javascript
   {
     id, name, price, quantity: 1, image, productId, categoryId,
     cashbackEnabled,      // ← Product cashback flag
     cashbackType,         // ← "percentage" or "fixed"
     cashbackValue,        // ← Cashback value
     cashbackMinPurchase,  // ← Minimum purchase amount
     variants: selectedVariantOptions,
     isVariant: true
   }
   ```
6. Add to cart (always quantity 1 for variants)

#### `updateQuantity(productId, newQuantity)` (Lines 1398-1408)

**Purpose:** Update cart item quantity
**Actions:**

- If quantity ≤ 0, removes item
- Updates cart state and sessionStorage

#### `removeFromCart(itemIdToRemove)` (Lines 1392-1395)

**Purpose:** Remove item from cart

---

### Session & Timer Management

#### `resetSessionTimer()` (Lines 2180-2241)

**Purpose:** Reset 5-minute idle timer on user interaction
**Called by:**

- Product clicks
- Cart actions
- Navigation
- Language changes
- Any user input

**Actions:**

- Clears existing session timer
- Clears session expiry modal if showing
- Restarts 5-minute countdown (if not in cart)

---

## Payment Processing

### Payment Method Selection

#### `getAvailablePaymentMethods()` (Lines 1553-1564)

**Purpose:** Get list of allowed payment methods based on customer type
**Logic:**

- **Regular members:** All methods (cash, card, crypto)
- **No Member:** Controlled by `nonMemberPaymentSettings` from Firebase

#### `setDefaultPaymentMethod()` (Lines 1568-1580)

**Purpose:** Auto-select first available payment method
**Priority:** cash → card → crypto

---

### Main Payment Processing

#### `processPayment()` (Lines 1594-1860)

**Purpose:** Complete the order transaction
**Process:**

1. **Validation:**

   - Customer must exist
   - Cart must have items
   - Total must be > 0 (after points deduction)

2. **Crypto Payment Path:**

   - Load crypto currencies
   - Show crypto modal
   - Wait for currency selection
   - Create payment via NOWPayments API
   - Save to Firebase `cryptoPayments` collection
   - Start payment status monitoring

3. **Cash/Card Payment Path:**

   - Calculate totals (subtotal, points discount, final total)
   - Calculate cashback earned (from `calculateCashbackPoints`)
   - Create transaction object:
     ```javascript
     {
       customerId, customerName, customerCode,
       items: [...],
       total, discount, pointsUsed, cashback,
       paymentMethod,
       createdAt: serverTimestamp(),
       // ... cashback details
     }
     ```
   - Save to Firebase `transactions` collection
   - **Update customer points:**
     - Deduct used points
     - Add earned cashback
   - **Update product stock:**
     - Create StockMovement records for each item
   - Clear cart and sessionStorage
   - Show order complete screen

4. **Error Handling:**
   - Stock unavailable → show alert
   - Transaction error → show error message
   - Crypto payment error → show error

---

### Crypto Payment Functions

#### `fetchAvailableCurrencies()` (Lines 259-285)

**Purpose:** Get list of available crypto currencies from NOWPayments API

#### `createCryptoPayment(selectedCurrency)` (Lines 395-452)

**Purpose:** Create payment request with NOWPayments
**Returns:** Payment details (address, amount, QR code, etc.)

#### `saveCryptoPaymentToFirebase(paymentData, selectedCurrency)` (Lines 456-494)

**Purpose:** Save crypto payment to Firestore for tracking

#### `startPaymentMonitoring(paymentId)` (Lines 498-512)

**Purpose:** Poll NOWPayments API every 10 seconds to check payment status

#### `checkPaymentStatus(paymentId)` (Lines 516-564)

**Purpose:** Check current status of crypto payment
**Statuses:** waiting, confirming, confirmed, sending, partially_paid, finished, failed, refunded, expired

#### `completeCryptoTransaction(statusData)` (Lines 568-670)

**Purpose:** Complete order when crypto payment is confirmed
**Similar to cash/card:** Creates transaction, updates points, updates stock

---

## Cashback System

### Overview

The cashback system supports **two levels of rules**:

1. **Product-level cashback** (priority)
2. **Category-level cashback** (fallback)

### Data Flow

```
Cart Item → calculateCashbackPoints() → CashbackService.calculateCartCashback()
                                              ↓
                                    For each item:
                                    1. Check product.cashbackEnabled
                                    2. If yes → use product cashback
                                    3. If no → check category cashback
                                    4. Calculate cashback amount
                                              ↓
                                    Return total + per-item details
```

---

### Key Functions

#### `calculateCashbackPoints()` (Lines 1864-1963)

**Purpose:** Calculate total cashback for current cart
**Process:**

1. Check if customer is eligible (not "No Member")
2. Call `CashbackService.calculateCartCashback(cart)`
3. Transform results to UI format
4. **Log detailed cashback breakdown:**
   ```
   🎁 CASHBACK CALCULATION SUMMARY
   📋 CASHBACK DETAILS BY ITEM:
      1. Product Name
         • Quantity: X
         • Price: ฿Y
         • Rule Applied: 🎯 PRODUCT CASHBACK / 📂 CATEGORY CASHBACK
         • Type: Percentage / Fixed Amount
         • Value: X% / ฿X per item
         • Cashback Earned: ฿X
   ```
5. Set `cashbackPoints` and `itemCashbackDetails`
6. Store in `window.menuCashbackDetails` for transaction

**Dependencies:**

- `CashbackService` from `productService.js`
- Cart items must include cashback fields

#### `getCashbackPercentageForCategory(categoryId)` (Lines 1536-1549)

**Purpose:** Load category-level cashback percentage from Firestore
**Returns:** Percentage (0-100) or 0 if none

#### `getItemCashbackInfo(cartItem)` (Lines 2532-2554)

**Purpose:** Get cashback details for a specific cart item (for UI display)
**Returns:**

```javascript
{
  points: number,
  appliedRule: "product" | "category" | "none",
  type: "percentage" | "fixed",
  value: number
}
```

---

### Product Cashback Fields

When adding to cart, these fields are copied from the product:

```javascript
cashbackEnabled: boolean,        // Is product cashback enabled?
cashbackType: "percentage" | "fixed",  // Type of cashback
cashbackValue: number,           // Value (% or ฿)
cashbackMinPurchase: number      // Minimum purchase amount (฿)
```

**Validation in CashbackService:**

- If `cashbackEnabled && cashbackValue > 0` → use product cashback
- Check minimum purchase: `totalAmount >= cashbackMinPurchase`
- Calculate based on type:
  - **Percentage:** `(totalAmount * cashbackValue) / 100`
  - **Fixed:** `cashbackValue * quantity`

---

## Stock Management

### Stock Data Sources

1. **Stock Alerts** (Low Stock Warnings)

   - Collection: `stockAlerts`
   - Fields: `productId`, `message`, `threshold`
   - Loaded by: `loadStockAlerts()` (Lines 674-706)

2. **Stock Calculations** (Current Inventory)
   - Collection: `StockMovement`
   - Aggregated by product/variant
   - Loaded by: `loadStockCalculations()` (Lines 710-761)

---

### Stock Functions

#### `loadStockAlerts()` (Lines 674-706)

**Purpose:** Load low stock warnings from Firebase

#### `loadStockCalculations()` (Lines 710-761)

**Purpose:** Calculate current stock from stock movements
**Process:**

- Group movements by product ID and variant ID
- Sum: `startingStock + purchases + adjustments - sales`
- Store in `stockCalculations` object with key format:
  - Simple product: `{productId}`
  - Variant: `{productId}-{variantId}-{optionId}`

#### `getCurrentStock(product, variantId)` (Lines 2564-2627)

**Purpose:** Get current stock level for a product/variant
**Returns:** Stock quantity or `null` if unlimited

#### `getProductStockAlert(productId)` (Lines 2558-2561)

**Purpose:** Get low stock alert for a product
**Returns:** Alert object or `null`

#### `getStockWarningText(product)` (Lines 2630-2644)

**Purpose:** Get warning text for display
**Returns:**

- If low stock alert exists: Alert message
- If stock ≤ 10: "Only X left in stock"
- Otherwise: `null`

#### `canAddToCart(product, requestedQuantity, variantId)` (Lines 2647-2670)

**Purpose:** Validate if product can be added to cart
**Checks:**

1. Current cart quantity for this product
2. Current stock level
3. If `(cartQty + requestedQty) > stock` → cannot add

**Returns:**

```javascript
{
  canAdd: boolean,
  reason?: string  // Error message if canAdd = false
}
```

---

## Cart Management

### Cart State

- Stored in React state: `cart`
- Persisted in `sessionStorage.setItem("cart", JSON.stringify(cart))`
- Restored on page load

### Cart Item Structure (Full)

```javascript
{
  // Basic info
  id: string,              // Unique ID (product ID or variant combo ID)
  productId: string,       // Product SKU (e.g., "PRD-0030")
  name: string,            // Display name
  price: number,           // Unit price (member or regular)
  quantity: number,        // Quantity
  image: string,           // Product image URL

  // Cashback fields (NEW)
  categoryId: string,              // Category ID for fallback cashback
  cashbackEnabled: boolean,        // Product cashback enabled?
  cashbackType: "percentage" | "fixed",
  cashbackValue: number,           // Cashback value
  cashbackMinPurchase: number,     // Min purchase for cashback

  // Variant fields (if variant product)
  variants?: {                     // Selected variant options
    [variantId]: {
      id, name, price, imageUrl, ...
    }
  },
  isVariant?: boolean              // Flag for variant products
}
```

### Cart Operations

#### Add to Cart

- **Simple products:** `handleAddToCart()` → includes cashback fields
- **Variant products:** `handleAddVariantToCart()` → includes cashback fields
- **Stock check:** via `canAddToCart()`
- **Animation:** Shows flying product to cart icon

#### Update Quantity

- `updateQuantity(productId, newQuantity)` → updates cart and sessionStorage

#### Remove from Cart

- `removeFromCart(itemId)` → filters out item

#### Get Total

- `getTotalPrice()` → sums all items (price × quantity)
- `getTotalPriceAfterPoints()` → total - points value

---

## Session & Timers

### 1. **Cart Timer (60 seconds)**

- **Starts:** When cart opens (`showCart = true`)
- **Stops:** When cart closes
- **Action on expiry:** Auto-cancel order → redirect to homepage
- **UI:** Shows countdown in cart header

### 2. **Session Timer (5 minutes)**

- **Starts:** On page load, when browsing main menu
- **Pauses:** When cart is open
- **Resets:** On any user interaction (`resetSessionTimer()`)
- **Action on expiry:**
  1. Show session expiry modal with 60-second countdown
  2. User can click "Continue" to reset
  3. If no action after 60 sec → redirect to homepage

### 3. **Session Expiry Modal (60 seconds)**

- **Starts:** After 5-minute idle timeout
- **Action:** Countdown 60 → 0 → `handleSessionTimeout()`
- **User can:** Click "Continue Shopping" to dismiss and reset

### Timer References

```javascript
cartTimerRef.current; // Cart timeout interval
sessionTimerRef.current; // 5-min session timeout
sessionCountdownRef.current; // 60-sec expiry modal countdown
```

---

## Component Sections

### 1. **Loading Screen** (Lines 2675-2746)

Shows while loading categories, products, stock data

### 2. **Personalized Joints Page** (Lines 2750-3272)

Special layout for custom joint builder (if `showPersonalizedJoints = true`)

### 3. **Main Layout** (Lines 3273+)

Three-pane layout:

- **Left:** Categories (scrollable)
- **Center:** Subcategories & Products (scrollable)
- **Right:** Cart summary (fixed)

### 4. **Product Detail Popup**

Modal showing:

- Product image (or 3D model)
- Name, description, price
- Quantity selector (for non-variants)
- Variant selectors (multi-step for variant products)
- Add to Cart button
- Stock warning

### 5. **Cart Modal**

Shows when clicking cart icon:

- List of cart items
- Quantity controls
- Points usage slider (0%, 25%, 50%, 75%, 100%)
- Payment method selector
- Cashback display
- Complete Order button
- 60-second countdown timer

### 6. **Payment Modals**

- **Crypto Payment Modal:** Currency selection, payment details, QR code
- **Order Complete Modal:** Success message, receipt print option

### 7. **Session Modals**

- **Session Expiry Modal:** 60-second warning with "Continue" button
- **Cancel Order Confirmation**
- **Back Confirmation** (if cart has items)

---

## Important Notes for Future Edits

### ⚠️ When Adding Products to Cart

**ALWAYS** include these cashback fields:

```javascript
{
  cashbackEnabled: selectedProduct.cashbackEnabled,
  cashbackType: selectedProduct.cashbackType,
  cashbackValue: selectedProduct.cashbackValue,
  cashbackMinPurchase: selectedProduct.cashbackMinPurchase,
}
```

**Locations to update:**

- `handleAddToCart()` (Line ~2296)
- `handleAddVariantToCart()` (Line ~1351)
- Any other cart item creation

---

### ⚠️ When Modifying Cashback Calculation

**Files involved:**

- `src/app/menu/page.js` → `calculateCashbackPoints()`
- `src/lib/productService.js` → `CashbackService` class

**Testing checklist:**

- [ ] Product with product-level cashback
- [ ] Product with category-level cashback only
- [ ] Product with no cashback
- [ ] Mixed cart with different cashback rules
- [ ] Minimum purchase validation

---

### ⚠️ When Adding New Payment Methods

1. Update `getAvailablePaymentMethods()`
2. Add UI button in cart modal
3. Add processing logic in `processPayment()`
4. Update transaction record structure
5. Update admin panel to handle new payment type

---

### ⚠️ When Modifying Stock Checking

**Key functions:**

- `canAddToCart()` → Validation before adding
- `getCurrentStock()` → Get available stock
- Stock is checked per variant for variant products

**Stock key format:**

- Simple: `{productId}`
- Variant: `{productId}-{variantId}-{optionId}`

---

## Recent Changes (October 21, 2025)

### Cashback Fields Added to Cart Items

**Problem:** Product cashback rules not loading in kiosk
**Solution:** Added cashback fields when creating cart items

**Modified:**

- `handleAddToCart()` (Line ~2296-2303)
- `handleAddVariantToCart()` (Line ~1351-1363)

**Added fields:**

```javascript
cashbackEnabled: selectedProduct.cashbackEnabled,
cashbackType: selectedProduct.cashbackType,
cashbackValue: selectedProduct.cashbackValue,
cashbackMinPurchase: selectedProduct.cashbackMinPurchase,
```

---

## File Structure Summary

```
menu/page.js (6,338 lines)
├── Imports & Setup (1-30)
├── State Declarations (31-160)
├── Helper Functions (161-670)
│   ├── Language (173-213)
│   ├── Crypto API (217-564)
│   └── Stock Loading (674-761)
├── useEffect Hooks (765-2250)
│   ├── Initialization (765-988)
│   ├── Data Loading (807-966)
│   ├── Cashback Calculation (1967-1987)
│   └── Timers (1991-2176)
├── Core Functions (992-2670)
│   ├── Navigation (992-1093)
│   ├── Product Selection (1189-1464)
│   ├── Points Management (1468-1532)
│   ├── Payment Methods (1553-1590)
│   ├── Payment Processing (1594-1860)
│   ├── Cashback (1864-1963)
│   ├── Cart Management (2270-2412)
│   └── Stock Checking (2558-2670)
└── JSX Rendering (2675-6338)
    ├── Loading Screen (2675-2746)
    ├── Personalized Joints (2750-3272)
    └── Main Layout (3273-6338)
```

---

## Quick Reference

| Task                     | Function                    | Line |
| ------------------------ | --------------------------- | ---- |
| Add product to cart      | `handleAddToCart()`         | 2275 |
| Add variant to cart      | `handleAddVariantToCart()`  | 1319 |
| Calculate cashback       | `calculateCashbackPoints()` | 1864 |
| Process payment          | `processPayment()`          | 1594 |
| Check stock              | `canAddToCart()`            | 2647 |
| Reset session timer      | `resetSessionTimer()`       | 2180 |
| Load categories/products | useEffect                   | 807  |
| Cart timeout             | useEffect                   | 1991 |
| Session timeout          | useEffect                   | 2050 |

---

**End of Documentation**
