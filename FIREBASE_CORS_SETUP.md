# Firebase Storage CORS Configuration Guide

## Problem

The 3D model files (.glb) are returning 200 OK but failing to load in model-viewer due to CORS (Cross-Origin Resource Sharing) restrictions.

## Solution

You need to configure CORS on your Firebase Storage bucket to allow model-viewer to fetch the .glb files.

## Steps to Fix

### Method 1: Using Google Cloud Console (Easiest)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `candy-kush`
3. Navigate to **Cloud Storage** > **Buckets**
4. Find your bucket: `candy-kush.firebasestorage.app`
5. Click on **Permissions** tab
6. Click **Add Principal**
7. Add `allUsers` with role `Storage Object Viewer`
8. Click **Save**

### Method 2: Using gsutil Command Line (Recommended)

1. Install Google Cloud SDK if you haven't already:

   - Download from: https://cloud.google.com/sdk/docs/install

2. Authenticate with Google Cloud:

   ```powershell
   gcloud auth login
   ```

3. Set your project:

   ```powershell
   gcloud config set project candy-kush
   ```

4. Apply the CORS configuration:

   ```powershell
   gsutil cors set cors.json gs://candy-kush.firebasestorage.app
   ```

5. Verify the CORS configuration:
   ```powershell
   gsutil cors get gs://candy-kush.firebasestorage.app
   ```

### Method 3: Using Firebase Console (Alternative)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Storage** in the left sidebar
4. Click on **Rules** tab
5. Make sure your storage rules allow public read access for product models:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{productId}/model_{fileName} {
      allow read: if true;  // Public read for 3D models
      allow write: if request.auth != null;  // Only authenticated users can write
    }
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Verify the Fix

After applying the CORS configuration:

1. Clear your browser cache
2. Refresh the admin page
3. Try to edit a product with a 3D model
4. The model should now display in the preview

## What the CORS Configuration Does

The `cors.json` file allows:

- **origin: ["*"]** - Accepts requests from any domain
- **method: ["GET", "HEAD", "PUT", "POST", "DELETE"]** - Allows all necessary HTTP methods
- **maxAgeSeconds: 3600** - Caches CORS preflight requests for 1 hour
- **responseHeader** - Allows all necessary headers for model-viewer to work

## Troubleshooting

If the model still doesn't load after applying CORS:

1. Check browser console for specific error messages
2. Verify the Storage Rules allow public read access
3. Try accessing the .glb URL directly in a new browser tab
4. Clear browser cache and hard refresh (Ctrl+Shift+R)
5. Check if the file actually exists at the URL

## Notes

- The CORS configuration applies to the entire bucket
- Changes may take a few minutes to propagate
- The configuration persists until you change it
- You only need to do this once per Firebase project
