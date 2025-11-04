import { NextResponse } from "next/server";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const CUSTOMERS_COLLECTION = "customers";

// CORS headers for POS system access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow all origins (localhost + production)
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/customers
 * Get all customers with optional filters
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get("limit")) || 100;
    const activeOnly = searchParams.get("active") === "true";
    const hasPoints = searchParams.get("hasPoints") === "true";
    const searchQuery = searchParams.get("search") || "";

    let q = query(
      collection(db, CUSTOMERS_COLLECTION),
      orderBy("updatedAt", "desc"),
      limit(limitParam)
    );

    // Apply active filter if specified
    if (activeOnly) {
      q = query(
        collection(db, CUSTOMERS_COLLECTION),
        where("isActive", "==", true),
        orderBy("updatedAt", "desc"),
        limit(limitParam)
      );
    }

    const querySnapshot = await getDocs(q);
    let customers = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString(),
    }));

    // Apply points filter
    if (hasPoints) {
      customers = customers.filter((c) => c.customPoints > 0);
    }

    // Apply search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name?.toLowerCase().includes(search) ||
          c.lastName?.toLowerCase().includes(search) ||
          c.email?.toLowerCase().includes(search) ||
          c.cell?.toLowerCase().includes(search) ||
          c.customerId?.toLowerCase().includes(search)
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: customers,
        count: customers.length,
        total: customers.length,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching customers:", error);
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

/**
 * POST /api/customers
 * Create new customer with category permissions
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message: "Name is required",
          validationErrors: [{ field: "name", message: "Name is required" }],
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Generate customerId (sequential: CK-0001, CK-0002, etc.)
    const customersSnapshot = await getDocs(
      collection(db, CUSTOMERS_COLLECTION)
    );
    const customerCount = customersSnapshot.size + 1;
    const customerId = `CK-${customerCount.toString().padStart(4, "0")}`;

    // Create customer document with category permissions
    const customerData = {
      customerId: customerId,
      name: body.name,
      lastName: body.lastName || "",
      nickname: body.nickname || "",
      nationality: body.nationality || "",
      dateOfBirth: body.dateOfBirth || "",
      email: body.email || "",
      cell: body.cell || "",
      memberId: body.memberId || customerId,
      customPoints: body.customPoints || 0,
      points: [],
      totalSpent: 0,
      visitCount: 0,
      isNoMember: body.isNoMember || false,
      isActive: body.isActive !== false,

      // ✅ CATEGORY PERMISSIONS - what customer can see on kiosk
      allowedCategories: body.allowedCategories || [], // Array of category IDs

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, CUSTOMERS_COLLECTION),
      customerData
    );

    console.log("✅ Customer created:", {
      id: docRef.id,
      customerId: customerId,
      name: body.name,
      allowedCategories: customerData.allowedCategories,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Customer created successfully",
        data: {
          id: docRef.id,
          ...customerData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error creating customer:", error);
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
