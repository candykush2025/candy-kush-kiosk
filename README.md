# Cannabis Kiosk System

A modern cannabis dispensary kiosk application built with Next.js 15 and Firebase, featuring customer management, product catalog, cashback points system, and thermal receipt printing.

## 🚀 Features

- **Customer Management**: QR code scanning and customer profiles
- **Product Catalog**: Categories, subcategories, and product variants
- **Shopping Cart**: Add to cart with quantity controls
- **Cashback System**: Category-based percentage rewards
- **Admin Dashboard**: Product management and customer analytics
- **Thermal Receipts**: 80mm thermal printer support
- **Points History**: Detailed transaction tracking
- **Thai Baht Currency**: Full ฿THB support

## 🔧 Quick Start

1. **Clone and Install:**

   ```bash
   git clone https://github.com/candykush2025/candy-kush-kiosk.git
   cd candy-kush-kiosk
   npm install
   ```

2. **Environment Setup:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase configuration
   ```

3. **Run Development Server:**

   ```bash
   npm run dev
   ```

4. **Open in Browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## 🌐 Deploy to Vercel

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

**Quick Deploy:**

1. Import repository to Vercel
2. Add Firebase environment variables
3. Deploy!

## 🔥 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Styling**: Tailwind CSS
- **State**: React Hooks
- **Currency**: Thai Baht (฿)

## 📱 Application Flow

1. **Scanner**: Customer scans QR code or enters member ID
2. **Categories**: Browse product categories
3. **Products**: Select items with variants and quantities
4. **Checkout**: Review cart, select payment method
5. **Receipt**: Thermal receipt with cashback points
6. **Admin**: Manage products, customers, and analytics

## 🔒 Admin Access

Access the admin dashboard at `/admin` with proper authentication.

## 📄 License

Private project for cannabis dispensary management.
