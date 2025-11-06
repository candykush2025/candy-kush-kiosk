import { NextResponse } from "next/server";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

const CUSTOMERS_COLLECTION = "customers";

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
 * GET /api/pos/customers
 * Send all customers from Kiosk to POS for import
 *
 * This endpoint provides customer data in the format expected by the POS system
 * as documented in KIOSK_CUSTOMER_API.md
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const updatedSince = searchParams.get("updatedSince"); // ISO timestamp for incremental sync

    console.log("🏪 POS requesting customer data from Kiosk");

    // Build query
    let q = query(
      collection(db, CUSTOMERS_COLLECTION),
      orderBy("updatedAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    let customers = querySnapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        // === Identifiers ===
        id: doc.id,
        customerId: data.customerId || doc.id,
        memberId: data.memberId || data.customerId || "",

        // === Personal Information ===
        name: data.name || "",
        firstName: data.name || "", // Alternative field
        lastName: data.lastName || "",
        nickname: data.nickname || "",
        nationality: data.nationality || "",
        dateOfBirth: data.dateOfBirth || "",
        dob: data.dateOfBirth || "", // Alternative field

        // === Contact Information ===
        email: data.email || "",
        phone: data.cell || "",
        cell: data.cell || "",

        // === Member Status ===
        isNoMember: data.isNoMember || false,
        isActive: data.isActive !== false,

        // === Points & Loyalty ===
        customPoints: data.customPoints || 0,
        points: data.customPoints || 0, // Alternative field
        totalSpent: data.totalSpent || 0,
        totalVisits: data.visitCount || 0,

        // === Kiosk Permissions ===
        allowedCategories: data.allowedCategories || [],

        // === Metadata ===
        createdAt:
          data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt:
          data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // Filter active only if requested
    if (activeOnly) {
      customers = customers.filter((c) => c.isActive === true);
    }

    // Filter by updated since timestamp (for incremental sync)
    if (updatedSince) {
      const sinceDate = new Date(updatedSince);
      customers = customers.filter((c) => new Date(c.updatedAt) > sinceDate);
    }

    console.log(`🏪 Sending ${customers.length} customers to POS`);

    return NextResponse.json(
      {
        success: true,
        data: customers,
        count: customers.length,
        message: "Customers fetched successfully from Kiosk",
        timestamp: new Date().toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("❌ Error fetching customers for POS:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "Failed to fetch customers from Kiosk",
        timestamp: new Date().toISOString(),
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
