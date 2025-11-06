import { NextResponse } from "next/server";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CATEGORIES_COLLECTION = "categories";

// CORS headers for POS system access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/pos/categories
 * Send all categories from Kiosk to POS for reference
 *
 * This helps POS understand the allowedCategories field in customer data
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    console.log("🏪 POS requesting category data from Kiosk");

    const q = query(collection(db, CATEGORIES_COLLECTION));
    const querySnapshot = await getDocs(q);

    let categories = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      categoryId: doc.data().categoryId || doc.id,
      name: doc.data().name,
      description: doc.data().description || "",
      isActive: doc.data().isActive !== false,
      order: doc.data().order || 0,
    }));

    // Filter active only if requested
    if (activeOnly) {
      categories = categories.filter((cat) => cat.isActive === true);
    }

    // Sort by order
    categories.sort((a, b) => a.order - b.order);

    console.log(`🏪 Sending ${categories.length} categories to POS`);

    return NextResponse.json(
      {
        success: true,
        data: categories,
        count: categories.length,
        message: "Categories fetched successfully from Kiosk",
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("❌ Error fetching categories for POS:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Failed to fetch categories from Kiosk",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
