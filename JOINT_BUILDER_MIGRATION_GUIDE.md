# Joint Builder - Firebase Migration Guide

## Overview

This guide explains the dynamic Joint Builder system where all options can be managed by admins through Firebase.

## 📁 Files Created

### 1. `jointBuilderData.js`

- Contains all current joint builder data extracted and formatted for Firebase
- Includes: steps, papers, filters, fillings, externals, compatibility rules
- Ready to upload to Firebase

### 2. `uploadJointBuilderData.js`

- Migration script to upload all data to Firebase
- Run once to initialize the Firebase collections

### 3. `jointBuilderService.js`

- Service layer for fetching data from Firebase
- Functions for admin CRUD operations (Create, Read, Update, Delete)

## 🗄️ Firebase Collections Structure

### `jointBuilderSteps`

Defines the workflow steps

```javascript
{
  id: "step1",
  order: 1,
  name: "Select Rolling Paper",
  description: "Choose your paper type and capacity",
  stepType: "paper",
  active: true
}
```

### `jointBuilderPapers`

Paper options with two selection types:

1. **Variant-based** (choose from predefined options)
2. **Slider-based** (adjust value on a slider)

```javascript
{
  id: "pre-rolled-ck",
  name: "Pre-Rolled Cone",
  description: "Classic cone shape, ready to fill",
  stepId: "step1",
  order: 1,
  selectionType: "variant", // or "slider"
  hasBuiltInFilter: true,
  variants: [
    { id: "small", capacity: 0.4, price: 1, label: "Small (0.4g)" }
  ]
}
```

For slider-based:

```javascript
{
  id: "rolling-paper-custom",
  selectionType: "slider",
  sliderConfig: {
    minValue: 7,
    maxValue: 20,
    step: 1,
    unit: "cm",
    basePrice: 20,
    pricePerUnit: 3,
    capacityFormula: "(value / 7) * 2"
  }
}
```

### `jointBuilderFilters`

Filter options (paper filters with sizes, glass filters)

```javascript
{
  id: "paper-filter",
  name: "Paper Filter",
  selectionType: "variant", // or "direct"
  variants: [
    { id: "small", name: "Small", price: 5 }
  ]
}
```

### `jointBuilderFillings`

Worm, flower, and hash options

```javascript
{
  id: "hash-worm",
  name: "Hash Worm",
  category: "worm", // or "flower", "hash"
  stepId: "step3",
  basePrice: 100,
  pricePerGram: 150 // for flower/hash
}
```

### `jointBuilderExternals`

Coating and wrap options

```javascript
{
  id: "kief-coating",
  name: "Kief Coating",
  category: "coating", // or "wrap"
  price: 100,
  color: "linear-gradient(...)"
}
```

### `jointBuilderRules`

Compatibility rules (which filters work with which papers)

```javascript
{
  id: "rule1",
  paperType: "pre-rolled-ck",
  allowedFilters: [],
  skipFilterStep: true
}
```

## 🚀 Migration Steps

### Step 1: Upload Data to Firebase

```bash
cd src/app/menu/personalizedJoint/utils
node uploadJointBuilderData.js
```

This will create all collections and upload the current data.

### Step 2: Verify in Firebase Console

1. Go to Firebase Console → Firestore Database
2. Check that these collections exist:
   - `jointBuilderSteps`
   - `jointBuilderPapers`
   - `jointBuilderFilters`
   - `jointBuilderFillings`
   - `jointBuilderExternals`
   - `jointBuilderRules`

### Step 3: Update Components to Use Firebase (Next Phase)

Components will be updated to fetch data from Firebase instead of hardcoded arrays.

## 🎛️ Admin Features (To Be Built)

### Admin Panel: Joint Builder Menu

Location: `/admin/joint-builder`

#### Sections:

1. **Steps Management**

   - Add/Edit/Delete steps
   - Reorder steps
   - Activate/Deactivate steps

2. **Paper Options**

   - Add new paper type
   - Edit name, description, price
   - Choose selection type: Variant or Slider
   - For variants: Add/edit/delete variants
   - For sliders: Configure min/max, pricing formula
   - Toggle built-in filter flag

3. **Filter Options**

   - Add/Edit/Delete filters
   - Configure sizes for paper filters
   - Set prices

4. **Filling Options**

   - Manage worm options
   - Manage flower strains (with type: Sativa/Indica/Hybrid)
   - Manage hash types
   - Set prices per gram

5. **External Options**

   - Manage coatings
   - Manage wraps
   - Set prices and visual properties

6. **Compatibility Rules**
   - Define which filters work with which papers
   - Set conditional rules (e.g., based on custom length)

## 📋 Selection Types Explained

### 1. Variant Selection

User chooses from a list of predefined options.

- Example: Pre-rolled cones (Small/Medium/Big)
- Admin can add/edit/delete variants
- Each variant has: name, price, capacity

### 2. Slider Selection

User adjusts a value on a slider.

- Example: Custom rolling paper (7-20cm)
- Admin configures: min, max, step, unit, pricing formula
- Formula examples:
  - Capacity: `(value / 7) * 2`
  - Price: `basePrice + (value * pricePerUnit)`

### 3. Direct Selection

User selects the option directly (no variants).

- Example: Glass filters
- Just one price, one configuration

## 🔄 Data Flow

```
Firebase Collections
        ↓
jointBuilderService.js (Fetch functions)
        ↓
Component State (useState/useEffect)
        ↓
UI Renders Dynamic Options
        ↓
User Selection
        ↓
Cart/Order
```

## 🎨 Admin UI Components Needed

1. **StepEditor** - Edit step details
2. **PaperEditor** - Manage papers with variant/slider toggle
3. **FilterEditor** - Manage filters
4. **FillingEditor** - Manage fillings by category
5. **ExternalEditor** - Manage coatings/wraps
6. **RuleEditor** - Manage compatibility rules
7. **VariantEditor** - Add/edit variants for an option
8. **SliderConfigurator** - Configure slider settings

## 🧪 Testing Checklist

- [ ] Upload data to Firebase successfully
- [ ] Fetch papers from Firebase in PaperStep
- [ ] Fetch filters from Firebase in FilterStep
- [ ] Fetch fillings from Firebase in FillingStep
- [ ] Fetch externals from Firebase in ExternalStep
- [ ] Compatibility rules work correctly
- [ ] Admin can add new paper
- [ ] Admin can edit existing paper
- [ ] Admin can delete paper
- [ ] Admin can toggle active/inactive
- [ ] Slider-based selection works
- [ ] Variant-based selection works
- [ ] Price calculations correct

## 📝 Next Steps

1. ✅ Extract data to jointBuilderData.js
2. ✅ Create upload script
3. ✅ Create service layer
4. ⏳ Run upload script to populate Firebase
5. ⏳ Update components to fetch from Firebase
6. ⏳ Build admin panel
7. ⏳ Test and deploy

## 🎯 Benefits

- **Dynamic**: Change options without code deployment
- **Scalable**: Easy to add new papers, filters, etc.
- **Manageable**: Admin can manage everything from UI
- **Flexible**: Support multiple selection types (variant/slider)
- **Real-time**: Changes reflect immediately
- **No Code Changes**: Add/remove products without developer
