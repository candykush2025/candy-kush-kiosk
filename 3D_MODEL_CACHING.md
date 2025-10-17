# 3D Model Caching System

## Overview

The application now features an advanced caching system for 3D model files (.glb) using IndexedDB. This significantly improves loading times and reduces bandwidth usage.

## Features

### 🚀 Fast Loading

- **First Load**: Model is downloaded from Firebase Storage and cached locally
- **Subsequent Loads**: Model loads instantly from browser cache
- **Smart Caching**: Automatic cache management with IndexedDB

### 🎨 Beautiful Loading Animation

- 3D rotating cube loader
- Progress bar with percentage
- Smooth animations and transitions
- Error handling with user-friendly messages

### 💾 IndexedDB Storage

- Models stored in browser's IndexedDB
- Persistent across sessions
- Automatic cleanup of old models
- No server storage required

## Components

### ModelViewer Component

Location: `src/components/ModelViewer.js`

**Props:**

- `modelUrl` (string): Firebase Storage URL of the .glb file
- `rotationX` (number): Initial horizontal rotation (0-360°)
- `rotationY` (number): Initial vertical rotation (0-180°)
- `rotationZ` (number): Initial distance (0.1-10m)
- `autoRotate` (boolean): Enable auto-rotation
- `className` (string): Additional CSS classes
- `style` (object): Additional inline styles

**Usage:**

```jsx
import ModelViewer from "@/components/ModelViewer";

<ModelViewer
  modelUrl="https://firebasestorage.googleapis.com/..."
  rotationX={90}
  rotationY={75}
  rotationZ={2.5}
  autoRotate={true}
  className="w-full h-64"
/>;
```

### ModelCache Library

Location: `src/lib/modelCache.js`

**Methods:**

- `getCachedModel(url)`: Get model with automatic caching
- `getModel(url)`: Get from cache only
- `saveModel(url, blob)`: Save to cache
- `downloadAndCache(url)`: Download and cache
- `clearOldModels(daysOld)`: Clear old cached models
- `getCacheStats()`: Get cache statistics
- `clearAll()`: Clear all cached models

**Usage:**

```javascript
import { modelCache } from "@/lib/modelCache";

// Get model (auto-caches if not present)
const cachedUrl = await modelCache.getCachedModel(firebaseUrl);

// Get cache stats
const stats = await modelCache.getCacheStats();
console.log(
  `Cached models: ${stats.count}, Total size: ${stats.totalSizeMB} MB`
);

// Clear old models
await modelCache.clearOldModels(7); // Clear models older than 7 days
```

### ModelCacheManager Component

Location: `src/components/ModelCacheManager.js`

Admin utility component for managing the cache:

- View cache statistics
- Clear old models (7+ days)
- Clear all cache
- See list of cached models

## How It Works

### 1. First Load

```
User views product → Check IndexedDB → Not found →
Download from Firebase → Save to IndexedDB → Display model
```

### 2. Subsequent Loads

```
User views product → Check IndexedDB → Found →
Create Blob URL → Display model instantly
```

### 3. Cache Management

- Models are cached when first loaded
- Cache persists across browser sessions
- Old models can be cleared manually or automatically
- Cache survives page refreshes

## Implementation Details

### IndexedDB Structure

```
Database: CandyKush3DModels
Store: models
Schema:
  - url (keyPath): Firebase Storage URL
  - blob: Binary model data
  - timestamp: Cache time
  - size: File size in bytes
```

### Loading States

1. **Loading**: Shows animated loader with progress
2. **Success**: Displays 3D model
3. **Error**: Shows error message with fallback

### Performance Benefits

- **Bandwidth Savings**: Models downloaded once, reused forever
- **Speed**: Instant loading from local cache
- **Offline Support**: Cached models work offline
- **Reduced Firebase Costs**: Fewer Storage API calls

## Browser Compatibility

- ✅ Chrome/Edge (100%)
- ✅ Firefox (100%)
- ✅ Safari (100%)
- ✅ Mobile browsers (iOS/Android)

IndexedDB is supported in all modern browsers.

## Cache Management

### User Perspective

- Automatic caching (no user action needed)
- Models load faster after first view
- No manual cache management required

### Admin Perspective

- View cache statistics in admin panel
- Clear old models to free space
- Monitor cached model list
- See total cache size

### Developer Perspective

```javascript
// Get cache stats
const stats = await modelCache.getCacheStats();

// Clear cache programmatically
await modelCache.clearAll();

// Clear old models
await modelCache.clearOldModels(7);
```

## Troubleshooting

### Model Not Loading

1. Check browser console for errors
2. Verify Firebase Storage CORS configuration
3. Try clearing cache: `modelCache.clearAll()`
4. Hard refresh browser (Ctrl+Shift+R)

### Cache Too Large

1. Clear old models (7+ days)
2. Clear all cache
3. IndexedDB typically has 50+ MB limit per domain

### Loading Animation Issues

1. Verify CSS animations loaded
2. Check globals.css for animation definitions
3. Ensure Tailwind CSS compiled correctly

## Files Modified

### Created:

- `src/lib/modelCache.js` - Cache management library
- `src/components/ModelViewer.js` - Reusable viewer component
- `src/components/ModelCacheManager.js` - Admin cache manager
- `src/app/globals.css` - Loading animations

### Updated:

- `src/app/admin/page.js` - Import and use ModelViewer
- `src/app/menu/page.js` - Import and use ModelViewer

## Configuration

### Custom Cache Duration

Edit `modelCache.clearOldModels()` parameter:

```javascript
// Clear models older than 30 days
await modelCache.clearOldModels(30);
```

### Disable Caching

To disable caching (not recommended):

```jsx
<model-viewer src={firebaseUrl} ... />
```

Use raw `model-viewer` instead of `ModelViewer` component.

## Future Enhancements

- [ ] Automatic cache cleanup on app start
- [ ] Cache size limits
- [ ] Preload frequently used models
- [ ] Background cache updates
- [ ] Service Worker integration
- [ ] PWA offline support

## Support

For issues or questions about the caching system:

1. Check browser console logs
2. Verify IndexedDB support
3. Test with cache cleared
4. Contact development team

---

**Last Updated**: October 17, 2025
**Version**: 1.0.0
