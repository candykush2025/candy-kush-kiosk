# Kiosk Customer API Integration

## Overview

This document describes the integration between the **Kiosk System** and the **POS System** for customer data synchronization.

## API Endpoint

**URL:** `https://candy-kush-kiosk.vercel.app/api/customers`  
**Method:** `GET`  
**Purpose:** Fetch all customers from the Kiosk system to import into POS

---

## Expected Response Format

### Success Response

```json
{
  "success": true,
  "data": [
    {
      // === Identifiers ===
      "id": "cust_12345", // Unique customer ID
      "customerId": "CUST-2024-001", // Human-readable customer code
      "memberId": "MEM-001", // Optional: Membership ID

      // === Personal Information ===
      "name": "John", // First name (required)
      "firstName": "John", // Alternative field for first name
      "lastName": "Doe", // Last name
      "nickname": "Johnny", // Nickname/preferred name
      "nationality": "Thai", // Nationality
      "dateOfBirth": "1990-01-15", // ISO date string
      "dob": "1990-01-15", // Alternative DOB field

      // === Contact Information ===
      "email": "john.doe@example.com", // Email address
      "phone": "+66812345678", // Phone number
      "cell": "+66812345678", // Alternative phone field

      // === Member Status ===
      "isNoMember": false, // true = guest, false = member
      "isActive": true, // Account active status

      // === Points & Loyalty ===
      "customPoints": 150, // Loyalty points balance
      "points": 150, // Alternative points field
      "totalSpent": 5000.0, // Lifetime spending (optional)
      "totalVisits": 25, // Total visit count (optional)

      // === Kiosk Permissions ===
      "allowedCategories": [
        // Categories customer can access
        "category-id-1",
        "category-id-2"
      ],

      // === Metadata ===
      "createdAt": "2024-01-15T10:30:00Z", // ISO timestamp (optional)
      "updatedAt": "2024-11-05T14:20:00Z" // ISO timestamp (optional)
    }
  ],
  "count": 1, // Total number of customers (optional)
  "message": "Customers fetched successfully" // Optional message
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message description",
  "message": "User-friendly error message"
}
```

---

## Field Mapping (Kiosk → POS)

| Kiosk Field                | POS Field           | Type    | Required | Default | Notes                |
| -------------------------- | ------------------- | ------- | -------- | ------- | -------------------- |
| `id` or `customerId`       | `id`                | string  | ✅       | -       | Primary identifier   |
| `customerId`               | `customerId`        | string  | ✅       | -       | Human-readable code  |
| `memberId`                 | `memberId`          | string  | ❌       | `""`    | Membership number    |
| `name` or `firstName`      | `name`              | string  | ✅       | -       | First name           |
| `lastName`                 | `lastName`          | string  | ❌       | `""`    | Last name            |
| `nickname`                 | `nickname`          | string  | ❌       | `""`    | Preferred name       |
| `nationality`              | `nationality`       | string  | ❌       | `""`    | Nationality          |
| `dateOfBirth` or `dob`     | `dateOfBirth`       | string  | ❌       | `""`    | ISO date format      |
| `email`                    | `email`             | string  | ❌       | `""`    | Email address        |
| `phone` or `cell`          | `phone` / `cell`    | string  | ❌       | `""`    | Contact number       |
| `isNoMember`               | `isNoMember`        | boolean | ❌       | `false` | Guest status         |
| `isActive`                 | `isActive`          | boolean | ❌       | `true`  | Account status       |
| `customPoints` or `points` | `customPoints`      | number  | ❌       | `0`     | Loyalty points       |
| `totalSpent`               | `totalSpent`        | number  | ❌       | `0`     | Lifetime spending    |
| `totalVisits`              | `totalVisits`       | number  | ❌       | `0`     | Visit count          |
| `allowedCategories`        | `allowedCategories` | array   | ❌       | `[]`    | Category permissions |
| `createdAt`                | `createdAt`         | string  | ❌       | auto    | ISO timestamp        |
| `updatedAt`                | `updatedAt`         | string  | ❌       | auto    | ISO timestamp        |

---

## Data Transformation

### Automatic Fields Added by POS

When importing from Kiosk, the POS system automatically adds:

```javascript
{
  source: "kiosk",                    // Identifies data origin
  lastSyncedAt: "2024-11-05T...",    // Last import timestamp
  syncedToFirebase: true             // Saved to Firebase flag
}
```

### Validation Rules

1. **Required Fields:**

   - `id` or `customerId` must be present
   - `name` or `firstName` must be present

2. **Data Types:**

   - Numeric fields (`customPoints`, `totalSpent`, `totalVisits`) default to `0`
   - Boolean fields (`isNoMember`, `isActive`) default to `false` and `true`
   - Arrays (`allowedCategories`) default to empty array `[]`

3. **Date Formats:**
   - All dates should be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
   - If only date is needed: `YYYY-MM-DD`

---

## Import Process Flow

```
┌─────────────────┐
│  Click "Import  │
│  from Kiosk"    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Fetch from Kiosk API           │
│  GET /api/customers             │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Transform Data                 │
│  - Map fields                   │
│  - Set defaults                 │
│  - Add metadata                 │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Save to Firebase               │
│  - Check if exists (by ID)      │
│  - Update or Create             │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Sync to IndexedDB              │
│  (Local browser storage)        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Update UI                      │
│  Show success message           │
└─────────────────────────────────┘
```

---

## Example Usage

### Minimal Required Data

```json
{
  "success": true,
  "data": [
    {
      "id": "cust_001",
      "customerId": "CUST-001",
      "name": "John"
    }
  ]
}
```

### Full Customer Data

```json
{
  "success": true,
  "data": [
    {
      "id": "cust_12345",
      "customerId": "CUST-2024-001",
      "memberId": "MEM-001",
      "name": "John",
      "lastName": "Doe",
      "nickname": "Johnny",
      "nationality": "Thai",
      "dateOfBirth": "1990-01-15",
      "email": "john.doe@example.com",
      "phone": "+66812345678",
      "cell": "+66812345678",
      "isNoMember": false,
      "isActive": true,
      "customPoints": 150,
      "totalSpent": 5000.0,
      "totalVisits": 25,
      "allowedCategories": ["cat-001", "cat-002"],
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-11-05T14:20:00Z"
    }
  ],
  "count": 1
}
```

---

## Error Handling

### Kiosk API Errors

- **Network Error:** Shows toast with network failure message
- **Invalid Response:** Shows toast with invalid format message
- **Empty Data:** Shows success but indicates 0 customers imported

### Individual Customer Errors

- If a customer fails to save, the error is logged but doesn't stop the import
- Successfully imported customers are still saved
- Error details are logged to console

---

## Testing

### Manual Testing Checklist

1. ✅ Click "Import from Kiosk" button
2. ✅ Verify loading state (button shows "Importing...")
3. ✅ Check console logs for fetched data
4. ✅ Verify customers appear in the list
5. ✅ Check Firebase to confirm data saved
6. ✅ Verify IndexedDB has synced data
7. ✅ Test with duplicate customers (should update)
8. ✅ Test with new customers (should create)

### Expected Console Logs

```
🏪 Kiosk API Response: {success: true, data: [...]}
🏪 Fetched customers from Kiosk: [...]
🏪 Number of customers: 5
✅ Created customer: John Doe
✅ Updated customer: Jane Smith
💾 Synced customers to IndexedDB
```

---

## UI Features

### Button States

- **Normal:** "Import from Kiosk" with Download icon
- **Loading:** "Importing..." with bouncing Download icon
- **Disabled:** When already importing

### Toast Notifications

- **Info:** "Fetching customers from Kiosk..."
- **Success:** "Successfully imported X customers from Kiosk to POS"
- **Error:** "Failed to fetch from Kiosk: [error message]"

---

## Future Enhancements

### Potential Improvements

1. **Incremental Sync:** Only fetch customers updated since last sync
2. **Conflict Resolution:** Handle cases where customer edited in both systems
3. **Batch Import:** Process customers in batches for better performance
4. **Validation:** Pre-import validation of customer data
5. **Rollback:** Ability to rollback failed imports
6. **Scheduling:** Automatic periodic syncing from Kiosk

### Additional Fields to Consider

- `address` - Customer address
- `city`, `state`, `zipCode` - Address components
- `preferences` - Customer preferences (JSON)
- `tags` - Customer tags/categories
- `notes` - Admin notes about customer
- `loyaltyTier` - VIP/Gold/Silver tier status

---

## Security Considerations

### Current Implementation

- No authentication required for GET endpoint
- Data transmitted over HTTPS
- No sensitive data filtering

### Recommendations

1. **API Authentication:** Add API key or JWT token
2. **Rate Limiting:** Prevent abuse of the endpoint
3. **Data Validation:** Server-side validation of customer data
4. **Audit Logging:** Log all data import operations
5. **Data Encryption:** Encrypt sensitive fields (email, phone)

---

## Contact & Support

For issues or questions about the Kiosk API integration:

- **Kiosk System:** https://candy-kush-kiosk.vercel.app
- **POS System:** Current application
- **Documentation:** This file

---

**Last Updated:** November 5, 2024  
**Version:** 1.0.0
