import { NextResponse } from "next/server";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CATEGORIES_COLLECTION = "categories";

// CORS headers for POS system access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/categories
 * Get all categories for POS admin to show in customer form
 * This allows POS to populate category permissions checkboxes
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    // Build query
    let q = query(
      collection(db, CATEGORIES_COLLECTION),
      orderBy("order", "asc")
    );

    // Filter active only if requested
    if (activeOnly) {
      q = query(
        collection(db, CATEGORIES_COLLECTION),
        where("isActive", "==", true),
        orderBy("order", "asc")
      );
    }

    const querySnapshot = await getDocs(q);
    const categories = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      categoryId: doc.data().categoryId || doc.id,
      name: doc.data().name,
      description: doc.data().description || "",
      isActive: doc.data().isActive !== false,
      order: doc.data().order || 0,
    }));

    console.log("📂 Categories fetched for POS:", categories.length);

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
