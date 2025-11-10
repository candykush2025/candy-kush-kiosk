import { NextResponse } from "next/server";
import { collection, getDocs, query, doc, getDoc } from "firebase/firestore";
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
 * GET /api/categories
 * Get all categories for POS admin to show in customer form
 * This allows POS to populate category permissions checkboxes
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id"); // Firestore document id support
    const activeOnly = searchParams.get("active") === "true";

    // If an id is provided, return that single category (by document id)
    if (id) {
      try {
        const docRef = doc(db, CATEGORIES_COLLECTION, id);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          return NextResponse.json(
            {
              success: false,
              error: "Not Found",
              message: "Category not found",
            },
            { status: 404, headers: corsHeaders }
          );
        }

        const data = snap.data();
        const category = {
          id: snap.id,
          categoryId: data.categoryId || snap.id,
          name: data.name,
          description: data.description || "",
        };

        return NextResponse.json(
          { success: true, data: category },
          { headers: corsHeaders }
        );
      } catch (err) {
        console.error("Error fetching category by id:", err);
        return NextResponse.json(
          {
            success: false,
            error: "Internal server error",
            message: err.message,
          },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Build query - simplified to avoid Firestore index requirements
    const q = query(collection(db, CATEGORIES_COLLECTION));

    const querySnapshot = await getDocs(q);
    // Include isActive and order temporarily for filtering/sorting, then strip them
    let categoriesWithMeta = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      categoryId: doc.data().categoryId || doc.id,
      name: doc.data().name,
      description: doc.data().description || "",
      _isActive: doc.data().isActive !== false,
      _order: doc.data().order || 0,
    }));

    // Filter active only if requested (client-side filtering)
    if (activeOnly) {
      categoriesWithMeta = categoriesWithMeta.filter(
        (cat) => cat._isActive === true
      );
    }

    // Sort by order field (client-side sorting)
    categoriesWithMeta.sort((a, b) => a._order - b._order);

    // Strip internal fields before returning to caller
    const categories = categoriesWithMeta.map(
      ({ id, categoryId, name, description }) => ({
        id,
        categoryId,
        name,
        description,
      })
    );

    console.log("📂 Categories fetched for POS:", categories.length);

    return NextResponse.json(
      {
        success: true,
        data: categories,
        count: categories.length,
      },
      { headers: corsHeaders }
    );
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
