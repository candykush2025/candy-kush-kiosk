# Prerolls Special Page - Dynamic Implementation Documentation

## Overview

The Prerolls Special page has been converted from hardcoded static data to a fully dynamic system powered by Firebase. Admins can now manage all aspects of the prerolls page through the Admin Panel.

## What Changed

### 1. **Firebase Data Structure** (Firestore Collection: `prerollsSpecial`)

#### Collection Structure:

```
prerollsSpecial/
├── configuration (document)
│   ├── backgroundImage: URL
│   ├── backgroundFit: "cover" | "contain" | "fill"
│   └── isActive: boolean
│
├── data/
│   ├── qualityTypes/ (subcollection)
│   │   └── [documents]
│   │       ├── key: "outdoor" | "indoor" | "top"
│   │       ├── name: "Outdoor" | "Indoor" | "Top Quality"
│   │       ├── color: "#06B6D4" (hex color)
│   │       ├── order: number
│   │       ├── image: URL (optional)
│   │       ├── imagePath: string
│   │       └── isActive: boolean
│   │
│   ├── strainTypes/ (subcollection)
│   │   └── [documents]
│   │       ├── key: "sativa" | "hybrid" | "indica"
│   │       ├── name: "Sativa" | "Hybrid" | "Indica"
│   │       ├── color: "#FDE047" (hex color)
│   │       ├── order: number
│   │       ├── image: URL (optional)
│   │       ├── imagePath: string
│   │       └── isActive: boolean
│   │
│   ├── products/ (subcollection)
│   │   └── [documents]
│   │       ├── qualityKey: "outdoor" | "indoor" | "top"
│   │       ├── strainKey: "sativa" | "hybrid" | "indica"
│   │       ├── image: URL (king size product image)
│   │       ├── imagePath: string
│   │       └── isActive: boolean
│   │
│   └── settings/
│       └── sizePrices (document)
│           ├── small: 100 (price in ฿)
│           ├── normal: 150
│           └── king: 200
```

---

## Files Created/Modified

### New Files:

1. **`src/lib/prerollService.js`** - Complete CRUD service for prerolls

   - `getConfiguration()` - Get page config (background, etc.)
   - `updateConfiguration()` - Update page settings
   - `getAllQualityTypes()` - Get outdoor/indoor/top types
   - `getAllStrainTypes()` - Get sativa/hybrid/indica types
   - `getAllPrerolls()` - Get all product combinations
   - `getSizePrices()` - Get small/normal/king prices
   - `updateSizePrices()` - Update prices
   - `createQualityType()` - Add new quality type
   - `updateQualityType()` - Edit quality type
   - `deleteQualityType()` - Remove quality type
   - `createStrainType()` - Add new strain type
   - `updateStrainType()` - Edit strain type
   - `deleteStrainType()` - Remove strain type
   - `createPrerollProduct()` - Add new product (quality + strain combo)
   - `updatePrerollProduct()` - Edit product
   - `deletePrerollProduct()` - Remove product
   - `uploadImage()` - Upload to Firebase Storage
   - `deleteImage()` - Delete from Firebase Storage
   - `initializeDefaultData()` - One-click setup of default data

2. **`src/components/admin/PrerollsManagement.js`** - Admin UI component
   - 5 Sub-tabs: Configuration, Size Prices, Quality Types, Strain Types, Products
   - Full CRUD interface for all data types
   - Image upload/preview
   - Color picker for labels
   - Order management
   - One-click default initialization

### Modified Files:

1. **`src/app/menu/page.js`**

   - Added `PrerollService` import
   - Added states for dynamic prerolls data:
     - `prerollsConfig` - Background image settings
     - `prerollsQualityTypes` - Outdoor/Indoor/Top types
     - `prerollsStrainTypes` - Sativa/Hybrid/Indica types
     - `prerollsProducts` - Product images matrix
     - `prerollsSizePrices` - Dynamic pricing
   - Added `loadPrerollsData()` function
   - Updated grid rendering to be dynamic
   - Updated background image to use config
   - Updated prices to use dynamic values

2. **`src/app/admin/page.js`**
   - Added `PrerollService` import
   - Added `PrerollsManagement` component import
   - Added "Prerolls Special" navigation button
   - Added prerolls states
   - Added `loadPrerollsData()` function
   - Added useEffect to load data when tab active
   - Added prerolls tab content section

---

## How to Use

### Initial Setup (First Time Only):

1. **Go to Admin Panel** → Login
2. **Click "Prerolls Special"** tab in sidebar
3. **Click "Initialize Default Data"** button
   - This creates:
     - 3 Quality Types: Outdoor (Cyan), Indoor (Gray), Top Quality (Black)
     - 3 Strain Types: Sativa (Yellow), Hybrid (Green), Indica (Blue)
     - Default prices: Small ฿100, Normal ฿150, King ฿200
     - Default background: /background.jpg

### Managing Prerolls:

#### **Configuration Tab:**

- **Background Image**: Upload custom background image
- **Background Fit**: Choose cover/contain/fill
- **Active Status**: Enable/disable the page
- **Initialize Defaults**: One-click setup button

#### **Size Prices Tab:**

- Set prices for Small, Normal, King sizes
- All prices in Thai Baht (฿)
- Changes reflect immediately in menu

#### **Quality Types Tab:**

- **Add New**: Create custom quality types (e.g., "Premium", "Organic")
  - Key: Unique identifier (lowercase, no spaces)
  - Name: Display name
  - Color: Background color for label
  - Order: Display order (0, 1, 2, ...)
  - Image: Optional icon/image
- **Edit**: Modify existing types
- **Delete**: Remove types (warning: affects products!)

#### **Strain Types Tab:**

- **Add New**: Create custom strain types
  - Same fields as Quality Types
  - Used for columns in grid
- **Edit/Delete**: Modify existing strains

#### **Products Tab:**

- **Add New Product**:
  - Select Quality + Strain combination
  - Upload king size product image
  - System uses this for grid display
- **View**: Grid preview of all products
- **Delete**: Remove product images

---

## Customer View (Kiosk Menu)

### Dynamic Features:

1. **Grid adapts** to number of quality types and strain types
2. **Colors** from Firebase show in labels
3. **Images** from products display in grid
4. **Prices** show dynamic values
5. **Background** changes based on configuration

### Grid Rendering:

- Columns = Number of Strain Types + 1 (for quality labels)
- Rows = Number of Quality Types + 1 (for strain headers)
- Auto-adjusts to admin changes

---

## Technical Details

### Data Flow:

```
Admin Panel → PrerollService → Firebase Firestore
↓
Menu Page → PrerollService → Firebase Firestore
↓
Dynamic Grid Rendering
```

### Image Storage:

All images stored in Firebase Storage:

- `/prerolls/background/` - Background images
- `/prerolls/qualities/{key}/` - Quality type icons
- `/prerolls/strains/{key}/` - Strain type icons
- `/prerolls/products/{quality}_{strain}/` - Product images

### Fallback Handling:

- If Firebase data fails to load, uses default hardcoded values
- Product images fallback to old path: `/Product/{quality} {strain} king.png`
- Prices fallback: Small ฿100, Normal ฿150, King ฿200

---

## API Reference

### PrerollService Methods:

```javascript
// Configuration
await PrerollService.getConfiguration();
await PrerollService.updateConfiguration(configData, backgroundImageFile);

// Quality Types
await PrerollService.getAllQualityTypes();
await PrerollService.createQualityType(qualityData, imageFile);
await PrerollService.updateQualityType(id, qualityData, imageFile, removeImage);
await PrerollService.deleteQualityType(id);

// Strain Types
await PrerollService.getAllStrainTypes();
await PrerollService.createStrainType(strainData, imageFile);
await PrerollService.updateStrainType(id, strainData, imageFile, removeImage);
await PrerollService.deleteStrainType(id);

// Products
await PrerollService.getAllPrerolls();
await PrerollService.createPrerollProduct(productData, imageFile);
await PrerollService.updatePrerollProduct(
  id,
  productData,
  imageFile,
  removeImage
);
await PrerollService.deletePrerollProduct(id);

// Size Prices
await PrerollService.getSizePrices();
await PrerollService.updateSizePrices({ small: 100, normal: 150, king: 200 });

// Utilities
await PrerollService.uploadImage(file, path);
await PrerollService.deleteImage(path);
await PrerollService.initializeDefaultData();
```

---

## Example Workflows

### Adding a New Quality Type:

1. Go to Admin → Prerolls Special → Quality Types
2. Fill form:
   - Key: `greenhouse`
   - Name: `Greenhouse`
   - Color: `#10B981` (green)
   - Order: `3`
3. Upload icon image (optional)
4. Click "Create Quality Type"
5. New row appears in kiosk grid automatically

### Changing Prices:

1. Go to Admin → Prerolls Special → Size Prices
2. Update values:
   - Small: `120`
   - Normal: `180`
   - King: `250`
3. Click "Save Size Prices"
4. Prices update in menu immediately

### Uploading Product Images:

1. Go to Admin → Prerolls Special → Products
2. Click "Create New Product"
3. Select Quality: `Outdoor`
4. Select Strain: `Sativa`
5. Upload image (king size product photo)
6. Click "Create Product"
7. Image shows in menu grid

---

## Troubleshooting

### Images not showing:

- Check Firebase Storage rules allow read access
- Verify image uploaded successfully
- Check browser console for errors
- Fallback images at `/Product/` should still work

### Grid looks broken:

- Ensure at least 1 quality type exists
- Ensure at least 1 strain type exists
- Check order values are sequential
- Try re-initializing default data

### Prices not updating:

- Verify admin saved changes
- Refresh menu page
- Check Firebase connection
- Check browser console for errors

### Background image not changing:

- Verify image uploaded successfully
- Check backgroundFit setting (cover/contain)
- Clear browser cache
- Check Firebase Storage permissions

---

## Migration Notes

### Old System (Hardcoded):

- 3 quality types: outdoor, indoor, top (fixed)
- 3 strain types: sativa, hybrid, indica (fixed)
- Images in `/public/Product/`
- Prices hardcoded in menu/page.js

### New System (Dynamic):

- Unlimited quality types
- Unlimited strain types
- Images in Firebase Storage
- Prices in Firestore
- Fully manageable from admin

### Backward Compatibility:

- Old product images still work as fallback
- Default prices preserved
- No data migration required
- Initialize Default Data creates structure

---

## Security Considerations

- **Firebase Rules**: Ensure read access for public, write for admin only
- **Image Upload**: Validate file types in service
- **Input Validation**: Check keys are valid (no spaces, lowercase)
- **Delete Confirmation**: Prompts before deleting

---

## Future Enhancements

### Potential Features:

1. Bulk upload products
2. Product descriptions
3. Multiple images per product (small/normal/king)
4. Custom grid layouts
5. Discounts/promotions per product
6. Stock management integration
7. Analytics (most popular combinations)
8. Multi-language support

---

## Build Status

✅ **Build Successful**

- No compilation errors
- All TypeScript checks passed
- ESLint warnings only (non-critical)
- Total bundle size optimized

---

## Summary

The Prerolls Special page is now **100% dynamic**:

- ✅ All data from Firebase
- ✅ Full admin control
- ✅ Unlimited customization
- ✅ Image management
- ✅ Price flexibility
- ✅ Background customization
- ✅ One-click initialization
- ✅ Fallback support
- ✅ Production ready

**No code changes needed** for future updates - everything manageable through Admin Panel!
