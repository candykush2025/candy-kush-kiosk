# 3D Model Integration for Products

## Overview

This implementation adds the ability to upload and display 3D models (.glb files) for products in the Candy Kush kiosk system.

## Features Implemented

### 1. Database Schema Updates

Added the following fields to products in Firebase:

- `modelUrl` (string) - URL to the .glb model file in Firebase Storage
- `modelRotationX` (number) - Horizontal rotation angle (0-360 degrees), default: 90
- `modelRotationY` (number) - Vertical rotation angle (0-180 degrees), default: 75
- `modelRotationZ` (number) - Camera distance (0.1-10 meters), default: 2.5

### 2. Admin Panel - Add Product Form

**Location:** `src/app/admin/page.js` (after Text Color section)

**Features:**

- File upload for .glb/.gltf files
- Real-time 3D model preview
- Rotation controls (X, Y, Z axes)
- Interactive preview with drag-to-rotate and scroll-to-zoom
- File removal option

**Fields Added:**

```javascript
modelUrl: "";
modelRotationX: 90;
modelRotationY: 75;
modelRotationZ: 2.5;
```

### 3. Firebase Storage Integration

**Location:** `src/lib/productService.js`

**Updates to `ProductService.createProduct()`:**

- Added `modelFile` parameter
- Uploads .glb files to `products/{productId}/model_{filename}`
- Stores model URL and rotation settings in Firestore
- Saves model data alongside other product information

### 4. Menu Page Display

**Location:** `src/app/menu/page.js`

**Features:**

- Displays 3D model in background of quantity popup
- Only shows if product has `modelUrl`
- Uses product-specific rotation settings
- Blurred background with 50% opacity
- Interactive controls (auto-rotate, camera controls)
- Close button to exit popup

**User Experience:**

1. Customer clicks product
2. If product has 3D model, it displays in background
3. Quantity popup slides up from bottom
4. Model rotates automatically
5. Customer can interact with model (rotate, zoom)
6. Close with X button or clicking outside

### 5. Model Preview Component

**Location:** `src/components/ModelPreview.jsx`

Reusable component for displaying 3D models with:

- Camera controls
- Custom rotation angles
- Optional auto-rotate
- Responsive sizing

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   └── page.js          # Admin form with 3D upload
│   └── menu/
│       └── page.js          # Customer view with 3D display
├── components/
│   └── ModelPreview.jsx     # Reusable 3D preview component
└── lib/
    └── productService.js    # Firebase Storage upload logic

public/
└── models/                  # Local .glb files (for testing)
```

## Usage Instructions

### For Administrators:

1. **Upload a 3D Model:**

   - Go to Admin Panel > Products
   - Click "Add Product" or edit existing product
   - Scroll to "3D Model (.glb file)" section
   - Click "Choose File" and select a .glb file
   - Model preview will appear automatically

2. **Adjust Initial Rotation:**

   - Use the three rotation sliders:
     - **Horizontal (X)**: 0-360° - Rotates model left/right
     - **Vertical (Y)**: 0-180° - Changes viewing angle up/down
     - **Distance (Z)**: 0.1-10m - Zoom level
   - Preview updates in real-time
   - Drag on preview to test different angles

3. **Save Product:**
   - Fill in other product details
   - Click "Add Product" or "Update Product"
   - Model is uploaded to Firebase Storage
   - Settings saved to Firestore

### For Customers:

1. Browse products in menu
2. Click on any product
3. If product has a 3D model:
   - Model appears in background (blurred)
   - Can rotate by dragging
   - Can zoom with scroll wheel
   - Auto-rotates by default
4. Select quantity/options in popup
5. Click X to close

## Technical Details

### Model Viewer Attributes:

```html
<model-viewer
  src="product.modelUrl"
  camera-orbit="{X}deg {Y}deg {Z}m"
  auto-rotate
  camera-controls
  interaction-prompt="none"
  shadow-intensity="1"
  environment-image="neutral"
  exposure="1"
/>
```

### Firebase Storage Path:

```
products/
  └── {productId}/
      ├── model_{filename}.glb
      ├── background_{filename}
      └── {image_files}
```

### Data Structure in Firestore:

```javascript
{
  productId: "PRD-0001",
  name: "Product Name",
  modelUrl: "https://firebasestorage.../model_file.glb",
  modelRotationX: 90,
  modelRotationY: 75,
  modelRotationZ: 2.5,
  // ... other product fields
}
```

## Supported File Formats

- `.glb` (recommended) - Binary GLTF
- `.gltf` - GLTF with external textures

## Browser Compatibility

- Uses Google's Model Viewer web component
- Works in all modern browsers
- Automatically loads required scripts
- Fallback: Shows regular product image if 3D not supported

## Performance Considerations

- Models only load when product is selected
- Lazy loading with `loading="eager"`
- Models cached by browser
- Conditional rendering (only if modelUrl exists)

## Future Enhancements (Optional)

- [ ] Add 3D model editing in Edit Product form
- [ ] Support for multiple models per product variant
- [ ] Model thumbnail generation
- [ ] AR (Augmented Reality) view on mobile
- [ ] Model file size optimization tools
- [ ] Batch model upload
- [ ] Model animation support

## Testing Checklist

- [ ] Upload .glb file in admin
- [ ] Adjust rotation settings
- [ ] Save product successfully
- [ ] View product in menu
- [ ] 3D model displays correctly
- [ ] Model rotates with correct initial angle
- [ ] Interactive controls work (drag, zoom)
- [ ] Close button works
- [ ] Model loads from Firebase Storage
- [ ] Works with and without 3D model (backwards compatible)

## Notes

- 3D models are optional - products without models work normally
- Menu page only shows 3D viewer if `product.modelUrl` exists
- Admin preview does NOT auto-rotate (for easier positioning)
- Customer view DOES auto-rotate (for better presentation)
- File size recommendations: Keep models under 10MB for best performance
