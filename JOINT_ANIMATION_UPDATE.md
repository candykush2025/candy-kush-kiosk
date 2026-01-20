# Joint Animation System Update - Combined Wrap & Filter Joint Images

## Overview

Updated the Custom Joint Builder's animation system to display wrap and filter images combined side by side to form a complete joint visualization. The new system uses the updated images in the `public/CustomJoint` folder with proper sizing and positioning to create a full joint appearance.

## Changes Made

### 1. Image Assets Organization

Located in: `public/CustomJoint/`

#### Wrap Images (750x150px → 320x64px in joint, maintains 5:1 aspect ratio, scaled 80% for better centering)

- `kief_coating.png` - Kief coating visualization
- `hemp_wrap.png` - Hemp/Oil wrap visualization
- `paper_wrap.png` - Paper wrap visualization
- `preroll_wrap.png` - Preroll/Rosin wrap visualization

#### Filter Images (200x150px → 200x64px in joint, maintains original width for proper proportion with 750px wrap)

- `tip_paper_filter.png` - Paper filter tip
- `slim_glass_filter.png` - Slim glass filter (10mm)
- `tip_glass_filter.png` - Wide glass filter (12mm)
- `candykush_filter.png` - Candy Kush branded filter (default)

#### Decorative Wrap Images

- `tip-spiral.png` - Rosin spiral decorative wrap
- `tip-M.png` - Hash/Rosin "M" letter decoration

### 2. Updated Files

#### `src/app/menu/personalizedJoint/components/JointVisualizer.js`

**New Functions Added:**

```javascript
getCoatingImage();
```

- Dynamically maps coating selection to appropriate image
- Dynamically maps coating selection to appropriate wrap image
- **Always returns an image** (defaults to `hemp_wrap.png` when no coating selected)
- Updated Mapping:
  - `kief-coating` → `kief_coating.png`
  - `oil-coating` → `hemp_wrap.png`
  - `rosin-full-dip` → `preroll_wrap.png`
  - `rosin-kief-combo` → `kief_coating.png`
  - **Default**: `hemp_wrap.png`

```javascript
getFilterImage();
```

- Dynamically maps filter selection to appropriate image
- **Always returns an image** (defaults to `candykush_filter.png` when no filter selected)
- Mapping:
  - `paper-filter`, `paper-small/medium/large` → `tip_paper_filter.png`
  - `slim-glass`, `glass-10mm` → `slim_glass_filter.png`
  - `wide-glass`, `glass-12mm` → `tip_glass_filter.png`
  - `candykush-filter` → `candykush_filter.png`
  - **Default**: `candykush_filter.png`

**Visual Layout Changes:**

1. **Combined Joint Structure:**
   - Wrap image (left side): 320x64px (maintains 750:150 aspect ratio from original 750x150px, scaled down for better centering)
   - Filter image (right side): 86x64px (maintains 200:150 aspect ratio from original 200x150px, scaled down for better centering)
   - Side-by-side positioning creates complete joint appearance
   - Subtle glow effects on each side of the joint

2. **Dynamic Joint Formation:**
   - **Always shows**: Wrap + Filter = Complete joint
   - Wrap changes based on coating selection (or defaults to hemp_wrap.png)
   - Filter changes based on filter selection (or defaults to candykush_filter.png)
   - Images are positioned to form seamless joint visualization

3. **Decorative Wraps (Spiral & M):**
   - Position: Outside main joint structure (right side)
   - Adjusted positioning for new joint layout
   - Z-index: 30 (top layer)

4. **Smoke Effect Positioning:**
   - Repositioned from end of component to be directly in front of the wrap image
   - Positioned at 25% from left (centered on wrap area) with z-index 20
   - Smoke now appears as a layer between the joint images and decorative elements

#### `src/app/menu/personalizedJoint/utils/jointBuilderData.js`

**Added `image` property to coating options:**

```javascript
externalCoatingOptions = [
  {
    id: "kief-coating",
    image: "/CustomJoint/kief_coating.png",
    // ... other properties
  },
  {
    id: "oil-coating",
    image: "/CustomJoint/hemp_wrap.png",
    // ... other properties
  },
  {
    id: "rosin-full-dip",
    image: "/CustomJoint/preroll_wrap.png",
    // ... other properties
  },
  {
    id: "rosin-kief-combo",
    image: "/CustomJoint/kief_coating.png",
    // ... other properties
  },
];
```

**Added `image` property to filter options:**

```javascript
filterOptions = [
  {
    id: "paper-filter",
    image: "/CustomJoint/tip_paper_filter.png",
    // ... other properties
  },
  {
    id: "slim-glass",
    image: "/CustomJoint/slim_glass_filter.png",
    // ... other properties
  },
  {
    id: "wide-glass",
    image: "/CustomJoint/tip_glass_filter.png",
    // ... other properties
  },
];
```

## How It Works

### Dynamic Image Selection Flow

1. **User selects a coating** (e.g., "Kief Coating")
   - Config updates: `config.external.coating = { id: "kief-coating", ... }`
   - `getCoatingImage()` returns `/CustomJoint/kief_coating.png`
   - Image displays centered over the joint with glow effect

2. **User selects a filter** (e.g., "Slim Glass Filter")
   - Config updates: `config.filter = { id: "slim-glass", ... }`
   - `getFilterImage()` returns `/CustomJoint/slim_glass_filter.png`
   - Image displays at left end of joint with blue glow

3. **User adds decorative wrap** (e.g., "Rosin Spiral")
   - Config updates: `config.external.wrap = { id: "rosin-spiral", ... }`
   - Displays existing `tip-spiral.png` at top-right with orange glow

### Visual Layering (Z-Index)

- Background: z-0 (ambient effects)
- Joint base image: z-10
- Coating wrap: z-10
- Filter tip: z-10
- Smoke effect: z-20 (positioned in front of wrap)
- Decorative wraps: z-30
- Smoke effects: z-40

## Testing Checklist

- [ ] Kief coating displays correctly when selected
- [ ] Oil coating displays correctly when selected
- [ ] Rosin Full Dip coating displays correctly when selected
- [ ] Rosin + Kief Combo coating displays correctly when selected
- [ ] Paper filter displays correctly when selected
- [ ] Slim glass filter displays correctly when selected
- [ ] Wide glass filter displays correctly when selected
- [ ] Coating image changes dynamically when switching coatings
- [ ] Filter image changes dynamically when switching filters
- [ ] Decorative wraps (Spiral, M) still display correctly
- [ ] Images are properly positioned and scaled
- [ ] Glow effects render correctly
- [ ] No image overlap issues
- [ ] Responsive layout maintained

## Future Enhancements

1. **Add More Coating Variations:**
   - Create additional coating images for different effects
   - Add animation transitions when changing coatings

2. **Enhanced Filter Animations:**
   - Add rotation or glow animations for glass filters
   - Implement texture variations for different filter types

3. **Interactive Preview:**
   - Allow users to rotate/zoom the joint preview
   - Add hover effects on coating/filter areas

4. **Custom Image Upload:**
   - Allow admin to upload new coating/filter images
   - Dynamic image management through admin panel

## Notes for Developers

- All coating images should be 750x150px for consistency
- All filter images should be 200x150px for consistency
- Images are scaled proportionally in the component
- Use Next.js Image component for optimization
- Add `priority` prop for above-the-fold images
- Maintain z-index hierarchy for proper layering

## Image Naming Convention

### Coating Images:

- Format: `[type]_coating.png`
- Examples: `kief_coating.png`, `hemp_coating.png`, `preroll_coating.png`

### Filter Images:

- Format: `tip_[type]_filter.png` or `[size]_glass_filter.png`
- Examples: `tip_paper_filter.png`, `slim_glass_filter.png`, `tip_glass_filter.png`

### Decorative Wraps:

- Format: `tip-[name].png`
- Examples: `tip-spiral.png`, `tip-M.png`

---

**Last Updated:** January 20, 2026
**Updated By:** AI Assistant
**Version:** 1.0.0
