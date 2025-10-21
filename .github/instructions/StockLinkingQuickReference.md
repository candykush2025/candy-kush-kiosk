# Stock Linking Quick Reference

## Quick Start (5 Minutes)

### Prerequisites

1. Add Loyverse API token to `.env.local`:

   ```bash
   LOYVERSE_ACCESS_TOKEN=your_access_token_here
   ```

2. Restart Next.js dev server:
   ```powershell
   npm run dev
   ```

### 3-Step Process

#### 📥 Step 1: Fetch (30 seconds)

```
Admin Panel → Stock Management → Stock Linking
↓
Click "Fetch Inventory from Loyverse"
↓
Wait for success message
↓
Automatically moves to Step 2
```

#### 🔗 Step 2: Link (3-4 minutes)

```
For each Loyverse item:
  1. Read the product name and category
  2. Select matching local product from dropdown
  3. System saves automatically (status → ✓ Linked)

OR click "Skip" for items you don't want

Tips:
- Use search box to find products faster
- Filter by status to see pending items only
- Link in batches of 10-20 products
```

#### 🔄 Step 3: Sync (1 minute)

```
Review summary stats
↓
Click "Sync Stock Now"
↓
Confirm in dialog
↓
Wait for success message
↓
Check Stock Movements tab to verify
```

## Common Tasks

### View Synced Products

```
Stock Management → Stock Movements
Filter by Supplier = "Loyverse Sync"
```

### Re-sync After Changes

```
Stock Linking → Reset Process → Start from Step 1
```

### Check Link Status

```
Linking Progress bar shows:
- Total: All Loyverse items
- Linked: Successfully mapped
- Pending: Not yet linked
```

## Keyboard Shortcuts

- **Tab**: Navigate between dropdowns
- **Enter**: Confirm selection
- **Esc**: Close modal/dialog

## Status Icons

- 🟡 **Pending**: Not yet linked
- 🟢 **Linked**: Successfully mapped
- ⚪ **Skipped**: Intentionally ignored

## Troubleshooting (30 seconds)

| Problem                    | Quick Fix                        |
| -------------------------- | -------------------------------- |
| Empty list after fetch     | Check `.env.local` token         |
| Can't click buttons        | Check admin permissions          |
| Link doesn't save          | Refresh page and try again       |
| No stock change after sync | Check Stock Movements for errors |

## Best Practices

1. ✅ Link exact name matches first
2. ✅ Verify 5-10 products before bulk linking
3. ✅ Skip test/promotional items
4. ✅ Check Stock Movements after each sync
5. ❌ Don't link all products at once (batch processing)

## Data Safety

- Links are saved permanently in Firebase
- Stock movements create audit trail
- Can reset and re-link anytime
- Original Loyverse data unchanged

## Quick Stats Location

```
Stock Linking UI → Step 3 → Summary Cards:
┌─────────────┬─────────────┬─────────────┐
│ Total Items │   Linked    │   Skipped   │
│     50      │     42      │      8      │
└─────────────┴─────────────┴─────────────┘
```

---

**Time to Complete**: 5-10 minutes for 50 products  
**Frequency**: As needed (weekly/monthly recommended)  
**Impact**: Updates local inventory to match Loyverse
