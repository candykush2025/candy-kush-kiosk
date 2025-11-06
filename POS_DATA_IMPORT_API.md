# Kiosk to POS Data Export API

## Overview

These API endpoints allow the **POS system** to fetch customer and category data from the **Kiosk system** for import and synchronization.

**Base URL (Production):** `https://candy-kush-kiosk.vercel.app`  
**Base URL (Development):** `http://localhost:3000`

---

## API Endpoints

### 1. Get Customers for POS

Fetch all customers from Kiosk in the format expected by POS system.

**Endpoint:** `GET /api/pos/customers`

**Query Parameters:**

| Parameter      | Type    | Description                                      |
| -------------- | ------- | ------------------------------------------------ |
| `active`       | boolean | Filter only active customers (default: all)      |
| `updatedSince` | string  | ISO timestamp - get customers updated since date |

**Request Examples:**

```bash
# Get all customers
GET /api/pos/customers

# Get only active customers
GET /api/pos/customers?active=true

# Get customers updated since specific date (incremental sync)
GET /api/pos/customers?updatedSince=2025-11-01T00:00:00Z
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      // === Identifiers ===
      "id": "abc123def456",
      "customerId": "CK-0001",
      "memberId": "CK-0001",

      // === Personal Information ===
      "name": "John",
      "firstName": "John",
      "lastName": "Doe",
      "nickname": "Johnny",
      "nationality": "Thai",
      "dateOfBirth": "1990-01-15",
      "dob": "1990-01-15",

      // === Contact Information ===
      "email": "john@example.com",
      "phone": "+66812345678",
      "cell": "+66812345678",

      // === Member Status ===
      "isNoMember": false,
      "isActive": true,

      // === Points & Loyalty ===
      "customPoints": 150,
      "points": 150,
      "totalSpent": 5000,
      "totalVisits": 25,

      // === Kiosk Permissions ===
      "allowedCategories": ["cat-001", "cat-002"],

      // === Metadata ===
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-11-05T14:20:00Z"
    }
  ],
  "count": 1,
  "message": "Customers fetched successfully from Kiosk",
  "timestamp": "2025-11-05T15:30:00Z"
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "success": false,
  "error": "Error details",
  "message": "Failed to fetch customers from Kiosk",
  "timestamp": "2025-11-05T15:30:00Z"
}
```

---

### 2. Get Categories for POS

Fetch all categories from Kiosk to understand customer permissions.

**Endpoint:** `GET /api/pos/categories`

**Query Parameters:**

| Parameter | Type    | Description                              |
| --------- | ------- | ---------------------------------------- |
| `active`  | boolean | Filter only active categories (optional) |

**Request Examples:**

```bash
# Get all categories
GET /api/pos/categories

# Get only active categories
GET /api/pos/categories?active=true
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "cat-001",
      "categoryId": "CAT-001",
      "name": "Indoor Flower",
      "description": "Premium indoor grown cannabis",
      "isActive": true,
      "order": 1
    },
    {
      "id": "cat-002",
      "categoryId": "CAT-002",
      "name": "Outdoor Flower",
      "description": "High quality outdoor grown",
      "isActive": true,
      "order": 2
    }
  ],
  "count": 2,
  "message": "Categories fetched successfully from Kiosk",
  "timestamp": "2025-11-05T15:30:00Z"
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "success": false,
  "error": "Error details",
  "message": "Failed to fetch categories from Kiosk",
  "timestamp": "2025-11-05T15:30:00Z"
}
```

---

## Customer Data Field Mapping

### Field Reference

| Kiosk Field               | Type    | Description                      | Default |
| ------------------------- | ------- | -------------------------------- | ------- |
| `id`                      | string  | Firebase document ID             | auto    |
| `customerId`              | string  | Customer ID (CK-0001)            | auto    |
| `memberId`                | string  | Member ID                        | `""`    |
| `name` / `firstName`      | string  | First name (**required**)        | `""`    |
| `lastName`                | string  | Last name                        | `""`    |
| `nickname`                | string  | Nickname                         | `""`    |
| `nationality`             | string  | Nationality                      | `""`    |
| `dateOfBirth` / `dob`     | string  | Date of birth (YYYY-MM-DD)       | `""`    |
| `email`                   | string  | Email address                    | `""`    |
| `phone` / `cell`          | string  | Phone number                     | `""`    |
| `isNoMember`              | boolean | Is guest (non-member)            | `false` |
| `isActive`                | boolean | Account active                   | `true`  |
| `customPoints` / `points` | number  | Loyalty points balance           | `0`     |
| `totalSpent`              | number  | Lifetime spending                | `0`     |
| `totalVisits`             | number  | Total visits count               | `0`     |
| `allowedCategories`       | array   | Category IDs customer can access | `[]`    |
| `createdAt`               | string  | Creation timestamp (ISO)         | auto    |
| `updatedAt`               | string  | Last update timestamp (ISO)      | auto    |

### Dual Field Names

For compatibility, the following fields are provided in two formats:

- `name` = `firstName` (both contain first name)
- `dateOfBirth` = `dob` (both contain date of birth)
- `customPoints` = `points` (both contain points balance)
- `phone` = `cell` (both contain phone number)

---

## POS Integration Guide

### Step 1: Fetch Customers from Kiosk

```javascript
// In POS system
const response = await fetch(
  "https://candy-kush-kiosk.vercel.app/api/pos/customers",
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }
);

const { success, data: customers, count } = await response.json();

if (success) {
  console.log(`Fetched ${count} customers from Kiosk`);
  // Process customers...
}
```

### Step 2: Fetch Categories (Optional)

```javascript
const categoryResponse = await fetch(
  "https://candy-kush-kiosk.vercel.app/api/pos/categories?active=true",
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }
);

const { data: categories } = await categoryResponse.json();
```

### Step 3: Import to POS Database

```javascript
for (const customer of customers) {
  // Transform to POS format if needed
  const posCustomer = {
    id: customer.customerId,
    name: customer.name,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.cell,
    points: customer.customPoints,
    totalSpent: customer.totalSpent,
    isActive: customer.isActive,
    allowedCategories: customer.allowedCategories,
    source: "kiosk", // Mark as imported from kiosk
    lastSyncedAt: new Date().toISOString(),
  };

  // Save to POS database (Firebase/IndexedDB)
  await saveToPOSDatabase(posCustomer);
}
```

### Step 4: Incremental Sync (Recommended)

Instead of fetching all customers every time, fetch only updated ones:

```javascript
// Get last sync timestamp from POS database
const lastSync = await getLastSyncTimestamp();

// Fetch only updated customers
const response = await fetch(
  `https://candy-kush-kiosk.vercel.app/api/pos/customers?updatedSince=${lastSync}`,
  {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }
);

const { data: updatedCustomers } = await response.json();

// Update only changed customers in POS
for (const customer of updatedCustomers) {
  await updateCustomerInPOS(customer);
}

// Update last sync timestamp
await saveLastSyncTimestamp(new Date().toISOString());
```

---

## CORS Configuration

Both endpoints support CORS for:

- ✅ **All origins** (`*`)
- ✅ **Methods:** GET, OPTIONS
- ✅ **Headers:** Content-Type, Authorization

No authentication required for GET requests.

---

## Testing

### Test with cURL

```bash
# Test customers endpoint
curl https://candy-kush-kiosk.vercel.app/api/pos/customers

# Test with active filter
curl "https://candy-kush-kiosk.vercel.app/api/pos/customers?active=true"

# Test categories endpoint
curl https://candy-kush-kiosk.vercel.app/api/pos/categories
```

### Test with JavaScript

```javascript
// Test in browser console or Node.js
fetch("https://candy-kush-kiosk.vercel.app/api/pos/customers")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## Expected Console Logs

When POS fetches data from Kiosk:

**On Kiosk Server:**

```
🏪 POS requesting customer data from Kiosk
🏪 Sending 25 customers to POS
```

**On POS Client:**

```
🏪 Kiosk API Response: {success: true, data: [...], count: 25}
🏪 Fetched customers from Kiosk: 25
✅ Successfully imported 25 customers from Kiosk
```

---

## Error Handling

### Network Errors

```javascript
try {
  const response = await fetch(
    "https://candy-kush-kiosk.vercel.app/api/pos/customers"
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || "Failed to fetch customers");
  }

  // Process data...
} catch (error) {
  console.error("Error fetching from Kiosk:", error.message);
  // Show error toast to user
}
```

### Empty Data

```javascript
const { success, data, count } = await response.json();

if (success && count === 0) {
  console.warn("No customers found in Kiosk");
  // Show info message to user
}
```

---

## Performance Considerations

### Pagination (Future Enhancement)

For large customer databases, consider adding pagination:

```javascript
// Future implementation
GET /api/pos/customers?page=1&limit=100
```

### Caching

POS system should cache fetched data and use incremental sync:

- Store last sync timestamp
- Only fetch customers updated since last sync
- Reduces bandwidth and improves speed

---

## Security Recommendations

### Current Implementation

- ✅ CORS enabled
- ✅ HTTPS in production
- ❌ No authentication required

### Recommended Improvements

1. **API Key Authentication**

   ```javascript
   GET /api/pos/customers
   Headers: {
     'X-API-Key': 'your-secret-key'
   }
   ```

2. **Rate Limiting**

   - Limit requests to prevent abuse
   - Example: 100 requests per hour per IP

3. **Data Encryption**
   - Sensitive fields (email, phone) should be encrypted

---

## Related Documentation

- **KIOSK_CUSTOMER_API.md** - Detailed customer data format specification
- **CUSTOMER_MANAGEMENT_API.md** - API for POS to manage customers in Kiosk

---

## Changelog

### Version 1.0.0 (2025-11-05)

- Initial release
- GET /api/pos/customers endpoint
- GET /api/pos/categories endpoint
- CORS support
- Incremental sync support (updatedSince parameter)
- Active-only filtering

---

## Support

**Kiosk System URL:** https://candy-kush-kiosk.vercel.app  
**API Base URL:** https://candy-kush-kiosk.vercel.app/api/pos

For issues or questions, check the console logs on both Kiosk and POS systems.
