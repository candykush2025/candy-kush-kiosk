# Cannabis Kiosk - Vercel Deployment Guide

This project is ready for deployment to Vercel with Firebase backend.

## 🚀 Quick Deploy to Vercel

### Prerequisites

- A Vercel account
- Firebase project set up

### Environment Variables Required

Add these environment variables in your Vercel dashboard:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyArHqBGN9IO3xdVozIkCEXaoygtC2qkuwU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=candy-kush.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=candy-kush
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=candy-kush.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=728690751973
NEXT_PUBLIC_FIREBASE_APP_ID=1:728690751973:web:69fda734bdf22bccfe970c
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-4JZJ6PGWP5
```

### Deploy Steps

1. **Connect to Vercel:**

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Or use Vercel CLI: `vercel --prod`

2. **Add Environment Variables:**

   - Go to Project Settings → Environment Variables
   - Add all Firebase configuration variables listed above
   - Set Environment to "Production" and "Development"

3. **Deploy:**
   - Vercel will automatically deploy when you push to main branch
   - Or trigger manual deployment from dashboard

## 🔧 Local Development

1. **Clone and Install:**

   ```bash
   git clone <your-repo>
   cd candy-kush-kiosk
   npm install
   ```

2. **Environment Setup:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase config
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

## 📱 Features

- Customer management with QR code scanning
- Product catalog with categories and variants
- Shopping cart and checkout system
- Cashback points system
- Admin dashboard for inventory management
- Thermal receipt printing
- Thai Baht currency support

## 🔥 Firebase Services Used

- **Firestore**: Customer data, products, transactions
- **Storage**: Product images
- **Analytics**: Usage tracking

## 📄 License

Private project for Cannabis Dispensary Management.
