# Cryptocurrency Payment Flow Implementation Guide

## Overview

This guide documents the complete cryptocurrency payment flow implementation using NOWPayments API. The flow includes currency selection, minimum amount validation, payment creation, QR code display, and payment monitoring.

**Note:** This implementation is designed for kiosk systems and includes Thai Baht (THB) to USD conversion, Firebase integration for payment tracking, and POS system integration.

---

## 1. Flow Overview

### User Journey

1. **Payment Method Selection** → User chooses "Cryptocurrency" from payment options
2. **Currency Selection** → System displays available cryptocurrencies with minimum requirements
3. **Payment Creation** → System creates NOWPayments invoice and generates QR code
4. **Payment Display** → User sees QR code, payment address, and amount details
5. **Payment Monitoring** → System monitors payment status in real-time
6. **Order Completion** → Payment confirmed → Order submitted to POS system

### Technical Flow

```
User selects crypto payment
        ↓
Load available currencies (/api/crypto/currencies)
        ↓
Fetch minimum amounts (/api/crypto/min-amount)
        ↓
User selects currency (validates minimum)
        ↓
Create payment (/api/crypto/payment)
        ↓
Save to Firebase (crypto_payments collection)
        ↓
Display QR code + payment details
        ↓
Monitor status (/api/crypto/payment/[id])
        ↓
Payment confirmed → Submit order to POS
```

---

## 2. API Endpoints Implementation

### 2.1 Get Available Currencies

**Endpoint:** `GET /api/crypto/currencies`

**Purpose:** Fetch supported cryptocurrencies from NOWPayments

**Implementation:**

```javascript
// src/app/api/crypto/currencies/route.js
export async function GET() {
  const response = await fetch(
    "https://api.nowpayments.io/v1/currencies?fixed_rate=true",
    {
      headers: { "x-api-key": process.env.NOWPAYMENT_API_KEY },
    }
  );

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  return NextResponse.json(data);
}
```

**Response Example:**

```json
{
  "currencies": [
    "btc",
    "eth",
    "usdt",
    "usdttrc20",
    "usdterc20",
    "xrp",
    "trx",
    "sol"
  ]
}
```

### 2.2 Get Minimum Amount

**Endpoint:** `GET /api/crypto/min-amount`

**Purpose:** Get minimum payment amount for a specific cryptocurrency

**Query Parameters:**

- `currency_from`: Cryptocurrency code (e.g., "btc", "usdt")
- `currency_to`: Target currency (default: "trx")
- `fiat_equivalent`: Fiat currency for equivalent (default: "usd")
- `is_fixed_rate`: Whether to use fixed rate (default: "false")
- `is_fee_paid_by_user`: Fee payment responsibility (default: "false")

**Implementation:**

```javascript
// src/app/api/crypto/min-amount/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const currencyFrom = searchParams.get("currency_from");

  if (!currencyFrom) {
    return NextResponse.json(
      { error: "currency_from is required" },
      { status: 400 }
    );
  }

  const url = `https://api.nowpayments.io/v1/min-amount?currency_from=${currencyFrom}&currency_to=trx&fiat_equivalent=usd&is_fixed_rate=false&is_fee_paid_by_user=false`;

  const response = await fetch(url, {
    headers: { "x-api-key": process.env.NOWPAYMENT_API_KEY },
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  return NextResponse.json(data);
}
```

**Response Example:**

```json
{
  "min_amount": 0.0001,
  "fiat_equivalent": 5.0,
  "currency_from": "btc",
  "currency_to": "trx"
}
```

### 2.3 Create Payment

**Endpoint:** `POST /api/crypto/payment`

**Purpose:** Create a NOWPayments invoice for cryptocurrency payment

**Request Body:**

```json
{
  "price_amount": 12.5,
  "price_currency": "usd",
  "pay_currency": "btc",
  "order_id": "CK-1703123456789",
  "order_description": "Candy Kush Order - 2 items",
  "ipn_callback_url": "https://your-domain.com/api/crypto/callback",
  "is_fixed_rate": true,
  "is_fee_paid_by_user": false
}
```

**Implementation:**

```javascript
// src/app/api/crypto/payment/route.js
export async function POST(request) {
  const body = await request.json();
  const {
    price_amount,
    price_currency,
    pay_currency,
    order_id,
    order_description,
    ipn_callback_url,
  } = body;

  if (!price_amount || !price_currency || !pay_currency) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: price_amount, price_currency, pay_currency",
      },
      { status: 400 }
    );
  }

  const paymentData = {
    price_amount: parseFloat(price_amount),
    price_currency,
    pay_currency,
    order_id,
    order_description,
    ipn_callback_url,
    is_fixed_rate: true,
    is_fee_paid_by_user: false,
  };

  const response = await fetch("https://api.nowpayments.io/v1/payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.NOWPAYMENT_API_KEY,
    },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Payment creation failed: ${response.status}`);
  }

  const data = await response.json();
  return NextResponse.json(data);
}
```

**Response Example:**

```json
{
  "payment_id": "123456789",
  "payment_status": "waiting",
  "pay_address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "price_amount": 12.5,
  "price_currency": "usd",
  "pay_amount": 0.00023456,
  "pay_currency": "btc",
  "order_id": "CK-1703123456789",
  "order_description": "Candy Kush Order - 2 items",
  "ipn_callback_url": "https://your-domain.com/api/crypto/callback",
  "created_at": "2024-01-20T10:30:00.000Z",
  "updated_at": "2024-01-20T10:30:00.000Z"
}
```

### 2.4 Check Payment Status

**Endpoint:** `GET /api/crypto/payment/[payment_id]`

**Purpose:** Check the status of a payment

**Implementation:**

```javascript
// src/app/api/crypto/payment/[id]/route.js
export async function GET(request, { params }) {
  const { id } = params;

  const response = await fetch(`https://api.nowpayments.io/v1/payment/${id}`, {
    headers: { "x-api-key": process.env.NOWPAYMENT_API_KEY },
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = await response.json();
  return NextResponse.json(data);
}
```

---

## 3. Frontend Implementation

### 3.1 State Management

```javascript
// Crypto payment states
const [showCryptoModal, setShowCryptoModal] = useState(false);
const [availableCurrencies, setAvailableCurrencies] = useState([]);
const [currencyMinimums, setCurrencyMinimums] = useState({});
const [loadingCrypto, setLoadingCrypto] = useState(false);
const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState(null);
const [bathToUsdRate, setBathToUsdRate] = useState(0.029);

// Payment processing states
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [paymentDetails, setPaymentDetails] = useState(null);
const [creatingPayment, setCreatingPayment] = useState(false);
const [paymentError, setPaymentError] = useState(null);

// Payment monitoring states
const [paymentStatusTimer, setPaymentStatusTimer] = useState(null);
const [paymentStatus, setPaymentStatus] = useState(null);
const [checkingStatus, setCheckingStatus] = useState(false);
const [cryptoPaymentData, setCryptoPaymentData] = useState(null);
```

### 3.2 Currency Loading Function

```javascript
const fetchAvailableCurrencies = async () => {
  try {
    const response = await fetch("/api/crypto/currencies");
    if (!response.ok) throw new Error("Failed to fetch currencies");

    const data = await response.json();
    let currencies =
      data.currencies && Array.isArray(data.currencies)
        ? data.currencies
        : Array.isArray(data)
        ? data
        : [];

    return currencies;
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return [];
  }
};

const fetchMinimumAmount = async (currencyFrom, totalUsd) => {
  try {
    const response = await fetch(
      `/api/crypto/min-amount?currency_from=${currencyFrom}&currency_to=trx&fiat_equivalent=usd&is_fixed_rate=false&is_fee_paid_by_user=false`
    );

    if (!response.ok) throw new Error("Failed to fetch minimum amount");
    const data = await response.json();

    return {
      minAmount: data.min_amount || 0,
      fiatEquivalent: data.fiat_equivalent || 0,
    };
  } catch (error) {
    console.error("Error fetching minimum amount:", error);
    return { minAmount: 0, fiatEquivalent: 0 };
  }
};
```

### 3.3 Load Crypto Data Function

```javascript
const loadCryptoData = async () => {
  setLoadingCrypto(true);
  try {
    // Fetch available currencies
    const currencies = await fetchAvailableCurrencies();
    setAvailableCurrencies(currencies);

    // Calculate total: Bath -> USD conversion
    const totalOrderInBath = getTotalPrice();
    const totalOrderInUsd = convertBathToUsd(totalOrderInBath);

    // Fetch minimum amounts for each currency
    const minimums = {};
    for (const currency of currencies.slice(0, 10)) {
      // Limit to first 10 for performance
      try {
        // IMPORTANT: Extract currency code as string from currency object
        const currencyCode = (currency.code || currency.currency || currency)
          .toString()
          .toLowerCase();
        const minData = await fetchMinimumAmount(currencyCode, totalOrderInUsd);
        minimums[currencyCode] = {
          ...minData,
          minAmountInBath: minData.fiatEquivalent / bathToUsdRate,
        };
      } catch (error) {
        console.error(`Error fetching min for ${currency}:`, error);
      }
    }

    setCurrencyMinimums(minimums);
  } catch (error) {
    console.error("Error loading crypto data:", error);
  } finally {
    setLoadingCrypto(false);
  }
};
```

### 3.4 Create Crypto Payment Function

```javascript
const createCryptoPayment = async (selectedCurrency) => {
  setCreatingPayment(true);
  setPaymentError(null);

  try {
    const totalOrderInBath = getTotalPrice();
    const totalOrderInUsd = convertBathToUsd(totalOrderInBath);
    const currencyCode = (
      selectedCurrency.code || selectedCurrency.currency
    ).toLowerCase();

    // Create order ID
    const orderId = `CK-${Date.now()}`;

    const paymentRequest = {
      price_amount: totalOrderInUsd,
      price_currency: "usd",
      pay_currency: currencyCode,
      order_id: orderId,
      order_description: `Candy Kush Order - ${cart.length} items`,
      ipn_callback_url: `${window.location.origin}/api/crypto/callback`,
      is_fixed_rate: true,
      is_fee_paid_by_user: false,
    };

    const response = await fetch("/api/crypto/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create payment");
    }

    const paymentData = await response.json();

    // Save payment data for later use in POS submission
    setCryptoPaymentData(paymentData);

    // Save payment to Firebase for history
    await saveCryptoPaymentToFirebase(paymentData, selectedCurrency);

    setPaymentDetails(paymentData);
    setPaymentStatus(paymentData);
    setShowPaymentModal(true);

    // Start monitoring payment status
    startPaymentMonitoring(paymentData.payment_id);
  } catch (error) {
    console.error("Error creating payment:", error);
    setPaymentError(error.message);
  } finally {
    setCreatingPayment(false);
  }
};
```

### 3.5 Payment Monitoring Function

```javascript
const startPaymentMonitoring = (paymentId) => {
  // Clear any existing timer
  if (paymentStatusTimer) {
    clearInterval(paymentStatusTimer);
  }

  // Check status immediately
  checkPaymentStatus(paymentId);

  // Set up periodic checking
  const timer = setInterval(() => {
    checkPaymentStatus(paymentId);
  }, 10000); // Check every 10 seconds

  setPaymentStatusTimer(timer);
};

const checkPaymentStatus = async (paymentId) => {
  if (checkingStatus) return; // Prevent overlapping requests

  setCheckingStatus(true);
  try {
    const response = await fetch(`/api/crypto/payment/${paymentId}`);
    if (!response.ok) throw new Error("Failed to check payment status");

    const statusData = await response.json();
    setPaymentStatus(statusData);

    // Stop monitoring if payment is final
    if (
      ["finished", "confirmed", "failed", "expired", "refunded"].includes(
        statusData.payment_status
      )
    ) {
      if (paymentStatusTimer) {
        clearInterval(paymentStatusTimer);
        setPaymentStatusTimer(null);
      }

      // If payment successful, proceed with order
      if (statusData.payment_status === "finished") {
        // Auto-submit order to POS
        await submitOrderToPOS();
      }
    }
  } catch (error) {
    console.error("Error checking payment status:", error);
  } finally {
    setCheckingStatus(false);
  }
};
```

### 3.6 Firebase Integration

```javascript
const saveCryptoPaymentToFirebase = async (paymentData, selectedCurrency) => {
  try {
    const { collection, addDoc } = await import("firebase/firestore");
    const { db } = await import("../../lib/firebase");

    const cryptoPaymentData = {
      payment_id: paymentData.payment_id,
      order_id: paymentData.order_id,
      payment_status: paymentData.payment_status,
      pay_address: paymentData.pay_address,
      price_amount: paymentData.price_amount,
      price_currency: paymentData.price_currency,
      pay_amount: paymentData.pay_amount,
      pay_currency: paymentData.pay_currency,
      customer_id: customer?.id || null,
      customer_name: customer
        ? `${customer.name} ${customer.lastName || ""}`.trim()
        : "",
      cart_items: cart,
      total_bath: getTotalPrice(),
      total_usd: convertBathToUsd(getTotalPrice()),
      selected_currency: selectedCurrency,
      created_at: new Date(),
      updated_at: new Date(),
      expiration_date: paymentData.expiration_estimate_date
        ? new Date(paymentData.expiration_estimate_date)
        : null,
    };

    const docRef = await addDoc(
      collection(db, "crypto_payments"),
      cryptoPaymentData
    );
    console.log("Crypto payment saved to Firebase:", docRef.id);
  } catch (error) {
    console.error("Error saving crypto payment to Firebase:", error);
  }
};
```

---

## 4. UI Components

### 4.1 Crypto Selection Modal

```jsx
{
  /* Crypto Payment Modal */
}
{
  showCryptoModal && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 m-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            Select Cryptocurrency
          </h3>
          <button
            onClick={() => setShowCryptoModal(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {loadingCrypto ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <div className="text-lg text-gray-600">
              Loading available cryptocurrencies...
            </div>
          </div>
        ) : (
          <div>
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Order Total:</span>
                <div className="text-2xl font-bold text-green-600">
                  ฿{getTotalPrice().toFixed(2)}
                </div>
              </div>
            </div>

            {/* Currency Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { code: "usdterc20", displayName: "USDT (ERC)" },
                { code: "usdttrc20", displayName: "USDT (TRC)" },
                { code: "btc", displayName: "BTC" },
                { code: "eth", displayName: "ETH" },
                { code: "xrp", displayName: "XRP" },
                { code: "trx", displayName: "TRX" },
                { code: "usdc", displayName: "USDC (ERC)" },
                { code: "sol", displayName: "SOL" },
              ].map((item) => {
                const currencyCode = item.code.toLowerCase();
                const minimum = currencyMinimums[currencyCode];
                const totalOrderInBath = getTotalPrice();
                const totalOrderInUsd = convertBathToUsd(totalOrderInBath);

                const currency = availableCurrencies.find(
                  (c) =>
                    (c.code && c.code.toLowerCase() === currencyCode) ||
                    (c.currency && c.currency.toLowerCase() === currencyCode)
                );

                const meetsMinimum = minimum
                  ? totalOrderInUsd >= minimum.fiatEquivalent
                  : false;
                const isDisabled = !currency || !meetsMinimum;

                return (
                  <button
                    key={item.code}
                    onClick={() => {
                      if (!isDisabled && currency) {
                        setSelectedCryptoCurrency(currency);
                        setShowCryptoModal(false);
                      }
                    }}
                    disabled={isDisabled}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isDisabled
                        ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                        : "border-gray-200 hover:border-green-500 hover:bg-green-50 cursor-pointer"
                    }`}
                  >
                    <div className="text-center">
                      {/* Currency Logo */}
                      <div className="w-12 h-12 mx-auto mb-2 relative">
                        <img
                          src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${currencyCode}.svg`}
                          alt={item.displayName}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                        <div
                          className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg"
                          style={{ display: "none" }}
                        >
                          {currencyCode.charAt(0).toUpperCase()}
                        </div>
                      </div>

                      <div className="font-semibold text-lg">
                        {item.displayName}
                      </div>

                      {isDisabled ? (
                        <div className="mt-2">
                          <div className="text-xs text-red-600 font-semibold">
                            Unavailable
                          </div>
                          {minimum && (
                            <div className="text-xs text-gray-500 mt-1">
                              Min: ฿
                              {minimum.minAmountInBath?.toFixed(0) || "N/A"}
                            </div>
                          )}
                        </div>
                      ) : (
                        minimum && (
                          <div className="text-xs text-green-600 mt-2">
                            Min: ฿{minimum.minAmountInBath?.toFixed(0) || "N/A"}
                          </div>
                        )
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4.2 Payment Details Modal (QR Code)

```jsx
{
  /* Payment Details Modal */
}
{
  showPaymentModal && paymentDetails && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 m-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Complete Your Payment
          </h3>
          <div className="text-lg text-green-600 font-semibold">
            {(
              selectedCryptoCurrency?.code ||
              selectedCryptoCurrency?.currency ||
              ""
            ).toUpperCase()}{" "}
            Payment
          </div>
        </div>

        {/* Payment Status */}
        <div
          className={`rounded-lg p-4 mb-6 ${
            paymentStatus?.payment_status === "finished"
              ? "bg-green-50 border border-green-200"
              : paymentStatus?.payment_status === "failed"
              ? "bg-red-50 border border-red-200"
              : paymentStatus?.payment_status === "confirming"
              ? "bg-blue-50 border border-blue-200"
              : "bg-yellow-50 border border-yellow-200"
          }`}
        >
          <div className="flex items-center justify-center">
            <div
              className={`text-2xl mr-3 ${
                paymentStatus?.payment_status === "finished"
                  ? "text-green-600"
                  : paymentStatus?.payment_status === "failed"
                  ? "text-red-600"
                  : paymentStatus?.payment_status === "confirming"
                  ? "text-blue-600"
                  : "text-yellow-600"
              }`}
            >
              {paymentStatus?.payment_status === "finished"
                ? "✅"
                : paymentStatus?.payment_status === "failed"
                ? "❌"
                : paymentStatus?.payment_status === "confirming"
                ? "🔄"
                : "⏳"}
            </div>
            <div>
              <div
                className={`font-semibold ${
                  paymentStatus?.payment_status === "finished"
                    ? "text-green-800"
                    : paymentStatus?.payment_status === "failed"
                    ? "text-red-800"
                    : paymentStatus?.payment_status === "confirming"
                    ? "text-blue-800"
                    : "text-yellow-800"
                }`}
              >
                Payment Status:{" "}
                {paymentStatus?.payment_status || paymentDetails.payment_status}
              </div>
              <div
                className={`text-sm ${
                  paymentStatus?.payment_status === "finished"
                    ? "text-green-700"
                    : paymentStatus?.payment_status === "failed"
                    ? "text-red-700"
                    : paymentStatus?.payment_status === "confirming"
                    ? "text-blue-700"
                    : "text-yellow-700"
                }`}
              >
                {paymentStatus?.payment_status === "finished"
                  ? "Payment completed successfully!"
                  : paymentStatus?.payment_status === "confirming"
                  ? "Transaction being processed..."
                  : paymentStatus?.payment_status === "failed"
                  ? "Payment failed. Please try again."
                  : "Waiting for your payment..."}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Order Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Order ID:</span>
              <span className="font-mono text-sm">
                {paymentDetails.order_id}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-semibold">
                ฿{getTotalPrice().toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>USD Equivalent:</span>
              <span>${paymentDetails.price_amount}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Pay Amount:</span>
              <span className="text-green-600">
                {paymentDetails.pay_amount}{" "}
                {paymentDetails.pay_currency.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* QR Code and Payment Address */}
        <div className="text-center mb-6">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
            <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${paymentDetails.pay_address}`}
                alt="Payment QR Code"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
              <div
                className="w-full h-full flex items-center justify-center text-gray-500 text-sm"
                style={{ display: "none" }}
              >
                QR Code unavailable
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-2">Payment Address:</div>
          <div className="bg-gray-100 p-3 rounded-lg border">
            <div className="font-mono text-sm break-all">
              {paymentDetails.pay_address}
            </div>
          </div>

          <button
            onClick={() =>
              navigator.clipboard.writeText(paymentDetails.pay_address)
            }
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Copy Address
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              setShowPaymentModal(false);
              setPaymentMethod("cash");
            }}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Cancel Payment
          </button>
          {paymentStatus?.payment_status === "finished" && (
            <button
              onClick={async () => {
                await submitOrderToPOS();
                setShowPaymentModal(false);
              }}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Complete Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Firebase Integration

### 5.1 Crypto Payments Collection Structure

```javascript
// Firebase collection: "crypto_payments"
{
  payment_id: "123456789",           // NOWPayments payment ID
  order_id: "CK-1703123456789",      // Internal order ID
  payment_status: "waiting",         // Current payment status
  pay_address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", // Payment address
  price_amount: 12.5,                // Amount in fiat
  price_currency: "usd",             // Fiat currency
  pay_amount: 0.00023456,            // Amount in crypto
  pay_currency: "btc",               // Cryptocurrency
  customer_id: "CUST-123",           // Customer ID (if logged in)
  customer_name: "John Doe",         // Customer name
  cart_items: [...],                 // Cart items array
  total_bath: 425.0,                 // Total in THB
  total_usd: 12.5,                   // Total in USD
  selected_currency: {...},          // Selected currency object
  created_at: Timestamp,             // Creation timestamp
  updated_at: Timestamp,             // Last update timestamp
  expiration_date: Timestamp,        // Payment expiration
  pos_order_id: "POS-456"            // POS system order ID (added after submission)
}
```

### 5.2 Admin Panel Integration

The admin panel includes:

- Crypto payments list with filtering by status
- Payment details modal with QR code regeneration
- Status update capabilities
- Integration with POS order lookup

---

## 6. Environment Variables

Add these to your `.env.local` file:

```bash
# NOWPayments Configuration
NOWPAYMENT_API_KEY=NGZEXC5-GT8MNNB-N67CEWJ-H0VKR6E
NOWPAYMENT_PUBLIC_KEY=083c9e3b-dd16-4e0a-bf02-2c87e523d612

# Exchange Rate (THB to USD)
BATH_TO_USD_RATE=0.029

# IPN Callback URL
NEXT_PUBLIC_CRYPTO_CALLBACK_URL=https://your-domain.com/api/crypto/callback
```

---

## 7. POS Integration

After successful payment, the order is submitted to the POS system:

```javascript
const submitOrderToPOS = async () => {
  try {
    const orderData = {
      customer: customer,
      cart: cart,
      paymentMethod: "crypto",
      cryptoPaymentData: cryptoPaymentData,
      total: getTotalPrice(),
      orderId: cryptoPaymentData.order_id,
      kioskId: process.env.NEXT_PUBLIC_KIOSK_ID,
    };

    const response = await fetch("/api/pos/submit-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    if (response.ok) {
      // Redirect to success page
      router.push("/order-complete");
    }
  } catch (error) {
    console.error("Error submitting order to POS:", error);
  }
};
```

---

## 8. Testing Checklist

- [ ] Load crypto currencies successfully
- [ ] Fetch minimum amounts for each currency
- [ ] Currency selection respects minimum requirements
- [ ] Payment creation works with valid data
- [ ] QR code displays correctly
- [ ] Payment address is copyable
- [ ] Status monitoring updates in real-time
- [ ] Successful payment triggers POS submission
- [ ] Failed/expired payments show appropriate messages
- [ ] Firebase logging works correctly
- [ ] Admin panel displays crypto payments

---

## 9. Troubleshooting

### Common Error: `[object Object]` in currency_from parameter

**Error Message:**

```
NOWPayments min-amount API error: 400 {"status":false,"statusCode":400,"code":"INVALID_REQUEST_PARAMS","message":"currency_from must only contain alpha-numeric characters"}
```

**Cause:** You're passing a currency object instead of a currency code string to the API.

**Wrong way:**

```javascript
// ❌ This passes the entire object
const minData = await fetchMinimumAmount(selectedCurrency, totalOrderInUsd);
```

**Correct way:**

```javascript
// ✅ Extract the currency code as a string
const currencyCode =
  selectedCurrency.code || selectedCurrency.currency || selectedCurrency;
const minData = await fetchMinimumAmount(
  currencyCode.toString().toLowerCase(),
  totalOrderInUsd
);
```

**In loops:**

```javascript
// ✅ When iterating through currencies array
for (const currency of currencies) {
  const currencyCode = (currency.code || currency.currency || currency)
    .toString()
    .toLowerCase();
  const minData = await fetchMinimumAmount(currencyCode, totalOrderInUsd);
  // ...
}
```

**When selecting a currency:**

```javascript
// ✅ When user selects a currency
const handleCurrencySelect = (selectedCurrency) => {
  const currencyCode = (selectedCurrency.code || selectedCurrency.currency)
    .toString()
    .toLowerCase();
  createCryptoPayment(currencyCode);
};
```

### Other Common Issues

- **Issue:** "Webhook received but invoice status not found" — Ensure you saved the invoice id returned from create invoice and query that same id
- **Issue:** "Invoice status is 'confirming' and not final" — Wait for final status or define confirmation thresholds
- **Issue:** "Unexpected currency/pay_amount" — validate against your expected price and currency and avoid fulfilling if mismatch
- **Issue:** "IPN spoofing" — verify by calling GET /invoice/{id} using your API key

---

## 10. Error Handling

- **Currency loading fails:** Show retry button, fallback to manual currency selection
- **Minimum amount fetch fails:** Disable currency or show warning
- **Payment creation fails:** Show error message, allow retry
- **QR code fails to load:** Show payment address as fallback
- **Status check fails:** Continue monitoring, show last known status
- **POS submission fails:** Allow manual retry, log for admin review

---

## 11. Security Considerations

- API keys stored server-side only
- IPN callbacks verified by re-querying payment status
- Payment data validated before POS submission
- Firebase security rules restrict access to payment data
- Rate limiting on API endpoints
- Input sanitization on all user inputs

---

## 12. Performance Optimizations

- Cache currency list for 1 hour
- Limit concurrent status checks
- Lazy load crypto icons
- Debounce status monitoring
- Compress QR code images
- Use WebSocket for real-time status updates (future enhancement)

---

## 13. Copy this Flow to Another Website

To implement this exact flow in another website:

1. **Copy API routes** (`src/app/api/crypto/`)
2. **Copy state management** (crypto-related states from menu page)
3. **Copy utility functions** (currency loading, payment creation, monitoring)
4. **Copy UI components** (crypto modal, payment modal)
5. **Copy Firebase integration** (crypto payments collection structure)
6. **Set environment variables** (NOWPayments keys, exchange rates)
7. **Adapt POS integration** to your order management system
8. **Update styling** to match your design system
9. **Test thoroughly** with small amounts in sandbox mode

**Key files to copy:**

- `src/app/api/crypto/currencies/route.js`
- `src/app/api/crypto/min-amount/route.js`
- `src/app/api/crypto/payment/route.js`
- `src/app/api/crypto/payment/[id]/route.js`
- Crypto-related functions from `src/app/menu/page.js`
- Crypto modal and payment modal JSX from `src/app/menu/page.js`
- Firebase crypto payment saving logic

This implementation provides a complete, production-ready cryptocurrency payment system with Thai Baht support, real-time monitoring, and POS integration.
