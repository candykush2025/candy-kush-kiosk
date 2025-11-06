import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

// CORS configuration - only allow your POS app
const ALLOWED_ORIGINS = [
  "https://pos-candy-kush.vercel.app",
  "http://localhost:3000", // For local POS development
  "http://localhost:3001", // For local POS development
];

function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request) {
  const origin = request.headers.get("origin") || "";
  return NextResponse.json({}, { headers: corsHeaders(origin) });
}

/**
 * GET /api/products
 *
 * Fetch all products from the products collection
 *
 * Query Parameters:
 * - categoryId: string (optional) - Filter by category ID
 * - subcategoryId: string (optional) - Filter by subcategory ID
 * - isActive: boolean (optional) - Filter by active status
 * - search: string (optional) - Search in product name
 *
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     products: [...],
 *     categories: [...],
 *     subcategories: [...]
 *   },
 *   meta: {
 *     total: number,
 *     filtered: number,
 *     timestamp: string
 *   }
 * }
 */
export async function GET(request) {
  const origin = request.headers.get("origin") || "";

  try {
    // Check if origin is allowed
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized origin",
          message: "This API can only be accessed from authorized domains",
        },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get("categoryId");
    const subcategoryFilter = searchParams.get("subcategoryId");
    const isActiveFilter = searchParams.get("isActive");
    const searchQuery = searchParams.get("search")?.toLowerCase();

    // Fetch products
    const productsRef = collection(db, "products");
    let productsQuery = productsRef;

    // Apply filters if provided
    const constraints = [];

    if (categoryFilter) {
      constraints.push(where("categoryId", "==", categoryFilter));
    }

    if (subcategoryFilter) {
      constraints.push(where("subcategoryId", "==", subcategoryFilter));
    }

    if (isActiveFilter !== null) {
      const isActive = isActiveFilter === "true";
      constraints.push(where("isActive", "==", isActive));
    }

    if (constraints.length > 0) {
      productsQuery = query(productsRef, ...constraints);
    }

    const productsSnapshot = await getDocs(productsQuery);
    let products = productsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply search filter in memory (Firestore doesn't support text search)
    if (searchQuery) {
      products = products.filter((product) =>
        product.name?.toLowerCase().includes(searchQuery)
      );
    }

    // Fetch categories
    const categoriesRef = collection(db, "categories");
    const categoriesSnapshot = await getDocs(categoriesRef);
    const categories = categoriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch subcategories
    const subcategoriesRef = collection(db, "subcategories");
    const subcategoriesSnapshot = await getDocs(subcategoriesRef);
    const subcategories = subcategoriesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Format products with complete information
    const formattedProducts = products.map((product) => {
      const category = categories.find((c) => c.id === product.categoryId);
      const subcategory = subcategories.find(
        (s) => s.id === product.subcategoryId
      );

      return {
        id: product.id,
        name: product.name,
        description: product.description || "",

        // Category information
        categoryId: product.categoryId,
        categoryName: category?.name || "",
        categoryImage: category?.image || "",

        // Subcategory information
        subcategoryId: product.subcategoryId,
        subcategoryName: subcategory?.name || "",
        subcategoryImage: subcategory?.image || "",

        // Pricing
        price: product.price || 0,
        thbPrice: product.thbPrice || product.price || 0,
        memberPrice: product.memberPrice || product.price || 0,

        // Stock
        stock: product.stock || 0,
        stockUnit: product.stockUnit || "g",
        minStock: product.minStock || 0,

        // Images
        image: product.image || "",
        images: product.images || [],

        // THC/CBD info
        thcPercentage: product.thcPercentage || 0,
        cbdPercentage: product.cbdPercentage || 0,

        // Product details
        strain: product.strain || "",
        effects: product.effects || [],
        flavors: product.flavors || [],

        // Status
        isActive: product.isActive !== false,
        isFeatured: product.isFeatured || false,

        // Metadata
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,

        // Loyverse integration
        loyverseId: product.loyverseId || null,
        loyverseVariantId: product.loyverseVariantId || null,
      };
    });

    // Sort products by name
    formattedProducts.sort((a, b) => a.name.localeCompare(b.name));

    // Build response
    const response = {
      success: true,
      data: {
        products: formattedProducts,
        categories: categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          image: cat.image || "",
          backgroundImage: cat.backgroundImage || "",
          backgroundFit: cat.backgroundFit || "cover",
          displayOrder: cat.displayOrder || 0,
          isActive: cat.isActive !== false,
        })),
        subcategories: subcategories.map((sub) => ({
          id: sub.id,
          name: sub.name,
          categoryId: sub.categoryId,
          image: sub.image || "",
          backgroundImage: sub.backgroundImage || "",
          backgroundFit: sub.backgroundFit || "cover",
          displayOrder: sub.displayOrder || 0,
          isActive: sub.isActive !== false,
        })),
      },
      meta: {
        total: productsSnapshot.docs.length,
        filtered: formattedProducts.length,
        timestamp: new Date().toISOString(),
        filters: {
          categoryId: categoryFilter,
          subcategoryId: subcategoryFilter,
          isActive: isActiveFilter,
          search: searchQuery,
        },
      },
    };

    return NextResponse.json(response, {
      headers: corsHeaders(origin),
    });
  } catch (error) {
    console.error("Error fetching products:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error.message || "Failed to fetch products",
      },
      {
        status: 500,
        headers: corsHeaders(origin),
      }
    );
  }
}
