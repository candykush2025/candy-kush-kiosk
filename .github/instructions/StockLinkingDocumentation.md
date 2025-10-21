# Stock Linking Feature Documentation

## Overview

The **Stock Linking** feature enables seamless integration between your Loyverse POS inventory system and the Candy Kush Kiosk stock management. This allows you to import real-time stock data from Loyverse and sync it with your local inventory in a controlled, batch-processed manner.

## Location

- **Admin Panel** → **Stock Management** → **Stock Linking**
- File: `src/app/admin/page.js` (Stock Linking section)
- API Route: `src/app/api/loyverse/route.js`
- Service: `src/lib/stockService.js` (LoyverseLinks collection)

## Features

### 3-Step Process

The Stock Linking feature follows a structured 3-step workflow:

#### **Step 1: Fetch from Loyverse**

- Connects to your Loyverse POS via API
- Retrieves all inventory items and categories
- Creates a batch todo list for manual linking
- **API Token**: Configured in `.env.local` as `LOYVERSE_ACCESS_TOKEN`

#### **Step 2: Link Products (Batch Todos)**

- Displays all Loyverse items in a searchable, filterable list
- Allows manual mapping of Loyverse items to local products
- Progress tracking: Total / Linked / Pending
- **Status Types**:
  - 🟡 **Pending**: Not yet linked
  - 🟢 **Linked**: Successfully mapped to local product
  - ⚪ **Skipped**: Intentionally not linked
- **Features**:
  - Search by name or category
  - Filter by status (All / Pending / Linked)
  - Dropdown to select matching local product
  - Skip button for items you don't want to link
  - Visual status indicators with color coding

#### **Step 3: Sync Stock**

- Reviews linked products summary
- Creates stock movement records for all linked items
- Calculates difference between Loyverse stock and local stock
- **Movement Types**:
  - **Stock In**: When Loyverse stock > local stock
  - **Adjustment**: When difference is negative
- **Data Recorded**:
  - Supplier: "Loyverse Sync"
  - Reason: "Initial sync from Loyverse (item name)"
  - Date/Time: Current timestamp
  - Loyverse ID: For reference tracking

## Technical Architecture

### State Management

```javascript
const [loyverseItems, setLoyverseItems] = useState([]); // Items from Loyverse
const [loyverseCategories, setLoyverseCategories] = useState([]); // Categories from Loyverse
const [linkedItems, setLinkedItems] = useState([]); // Linked products
const [linkingProgress, setLinkingProgress] = useState({
  // Progress tracking
  total: 0,
  linked: 0,
  pending: 0,
});
const [batchTodos, setBatchTodos] = useState([]); // Todo list for batch linking
const [fetchingLoyverse, setFetchingLoyverse] = useState(false); // Loading state: fetch
const [syncingStock, setSyncingStock] = useState(false); // Loading state: sync
const [linkingStep, setLinkingStep] = useState(1); // Current step (1-3)
```

### Firebase Collections

#### **LoyverseLinks Collection**

Stores permanent records of linked products for future reference.

**Document Structure**:

```javascript
{
  loyverseId: "abc123",              // Loyverse item ID
  loyverseName: "Indoor Sativa King", // Loyverse item name
  localProductId: "xyz789",           // Local product ID
  localProductName: "Premium Sativa", // Local product name
  linkedAt: "2025-10-21T10:30:00Z",  // Timestamp
  linkedBy: "admin",                  // User who created link
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### **StockMovement Collection**

Stock movements created during sync have a special field:

**Additional Field for Loyverse Sync**:

```javascript
{
  // ... standard movement fields ...
  loyverseId: "abc123",  // Reference to Loyverse item
  supplier: "Loyverse Sync",
  reason: "Initial sync from Loyverse (item name)"
}
```

### API Integration

#### **Route Handler**: `/api/loyverse/route.js`

- **Purpose**: Proxy requests to Loyverse API to avoid CORS issues
- **Method**: GET
- **Query Parameters**:
  - `endpoint`: Loyverse API endpoint (e.g., `/items`, `/categories`)
  - Additional params passed through to Loyverse API
- **Headers**:
  - `Authorization: Bearer {LOYVERSE_ACCESS_TOKEN}`
- **Environment Variable**: `LOYVERSE_ACCESS_TOKEN` in `.env.local`

#### **Loyverse Service**: `src/app/api/loyverse.js`

Provides wrapper methods for Loyverse API:

- `getAllItems()`: Fetch all inventory items (auto-pagination)
- `getAllCategories()`: Fetch all categories (auto-pagination)
- `getItems(params)`: Fetch items with filters
- `getCategories(params)`: Fetch categories with filters

### Key Functions

#### `fetchLoyverseStock()`

```javascript
/**
 * Step 1: Fetch inventory from Loyverse
 * - Calls Loyverse API to get items and categories
 * - Initializes batch todos with fetched data
 * - Moves to Step 2 (linking)
 */
```

#### `linkProductToLoyverse(todoId, localProductId)`

```javascript
/**
 * Step 2: Link a single Loyverse item to local product
 * - Updates todo status to "linked"
 * - Saves link to Firebase (LoyverseLinks collection)
 * - Updates progress tracking
 */
```

#### `skipLoyverseLink(todoId)`

```javascript
/**
 * Mark a Loyverse item as skipped
 * - Updates todo status to "skipped"
 * - Updates progress (reduces pending count)
 */
```

#### `syncStockFromLoyverse()`

```javascript
/**
 * Step 3: Sync stock from Loyverse to Firebase
 * - Processes all linked products
 * - Calculates stock difference (Loyverse - Local)
 * - Creates stock movement records
 * - Skips zero-stock items
 * - Skips already-in-sync items
 * - Moves to Step 3 (complete)
 */
```

#### `resetLinking()`

```javascript
/**
 * Reset entire linking process
 * - Clears all state
 * - Returns to Step 1
 */
```

## User Workflow

### Complete Process Example

1. **Admin Panel** → **Stock Management** → **Stock Linking**

2. **Step 1: Fetch Data**

   - Click "Fetch Inventory from Loyverse"
   - Wait for data to load (shows spinner)
   - Success: Alert shows "Successfully fetched X items from Loyverse!"
   - Automatically moves to Step 2

3. **Step 2: Link Products**

   - Review list of Loyverse items
   - For each item you want to sync:
     - Select matching local product from dropdown
     - System auto-saves the link
     - Status changes to "✓ Linked"
   - For items you don't want to link:
     - Click "Skip" button
     - Status changes to "⊘ Skipped"
   - Use search box to filter items
   - Use status filter to show Pending/Linked/All
   - When done linking, click "Continue to Sync →"

4. **Step 3: Sync Stock**

   - Review summary statistics
   - Click "Sync Stock Now"
   - Confirmation dialog appears
   - System processes all linked products:
     - Compares Loyverse stock with local stock
     - Creates stock movement for differences
     - Marks movements with "Loyverse Sync" supplier
   - Success alert shows: "Stock sync complete! ✓ X products synced"
   - View results in **Stock Movements** tab

5. **Verify Sync**
   - Go to **Stock Management** → **Stock Movements**
   - Filter by Supplier: "Loyverse Sync"
   - Check movement records
   - Go to **Stock Overview** to see updated quantities

## Best Practices

### When to Use Stock Linking

✅ **Use when**:

- Initial inventory import from Loyverse
- Periodic bulk stock synchronization
- Reconciling inventory discrepancies
- Setting up new kiosk with existing Loyverse data

❌ **Don't use when**:

- Making minor stock adjustments (use Stock In/Out instead)
- Real-time POS sync (Loyverse doesn't support webhooks)
- Product doesn't exist in Loyverse

### Linking Strategy

1. **Match by Product Type**:

   - Link Loyverse "Indoor Sativa King" → Local "Indoor Sativa King"
   - Match exact names first

2. **Category Mapping**:

   - Review Loyverse category to ensure it matches
   - Filter local products by category

3. **Skip Items**:

   - Skip promotional items not sold in kiosk
   - Skip discontinued products
   - Skip test/sample items

4. **Batch Processing**:
   - Don't try to link all products at once
   - Link and test in batches of 10-20 items
   - Verify each batch in Stock Movements

### Error Handling

- **API Token Invalid**: Check `.env.local` for correct `LOYVERSE_ACCESS_TOKEN`
- **Network Error**: Retry after checking internet connection
- **Zero Stock Items**: Automatically skipped during sync
- **Already Synced**: Items with matching stock are skipped

## Security

- **API Token**: Stored securely in `.env.local` (never committed to Git)
- **Server-Side Proxy**: API route runs server-side to protect token
- **Admin Only**: Feature requires admin authentication
- **Audit Trail**: All links saved with timestamp and user

## Future Enhancements

🔮 **Planned Features**:

- Auto-match products by SKU or barcode
- Scheduled automatic sync (daily/weekly)
- Conflict resolution for mismatched stock
- Variant support (link Loyverse variants to local variants)
- Bulk link/unlink operations
- Export link mappings to CSV
- Two-way sync (update Loyverse from kiosk sales)

## Troubleshooting

### Problem: "Loyverse access token not configured"

**Solution**: Add `LOYVERSE_ACCESS_TOKEN=your_token_here` to `.env.local` file

### Problem: Fetch returns empty list

**Solution**:

- Verify token has correct permissions
- Check Loyverse account has products
- Check browser console for API errors

### Problem: Link doesn't save

**Solution**:

- Check Firebase permissions
- Verify admin authentication
- Check browser console for errors

### Problem: Stock doesn't sync

**Solution**:

- Verify products are linked (Step 2)
- Check product has variants (not yet supported)
- Review Stock Movements for error messages

## Dependencies

- **Firebase**: Firestore for data persistence
- **Loyverse API**: v1.0 REST API
- **Next.js**: API Routes for proxy
- **React**: State management and UI

## Related Documentation

- [AdminPanelDocumentation.md](./AdminPanelDocumentation.md) - Main admin panel docs
- [Loyverse API Docs](https://developer.loyverse.com/) - Official Loyverse API
- Firebase Firestore documentation

---

**Last Updated**: October 21, 2025  
**Version**: 1.0.0  
**Author**: Candy Kush Development Team
