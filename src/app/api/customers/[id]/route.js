import { NextResponse } from "next/server";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const CUSTOMERS_COLLECTION = "customers";

// CORS headers for POS system access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
 * GET /api/customers/[id]
 * Get customer by ID or customerId
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;

    let customerDoc;

    // Try to get by document ID first
    try {
      const docRef = doc(db, CUSTOMERS_COLLECTION, id);
      customerDoc = await getDoc(docRef);
    } catch (e) {
      // If fails, try to search by customerId
      const q = query(
        collection(db, CUSTOMERS_COLLECTION),
        where("customerId", "==", id)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        customerDoc = querySnapshot.docs[0];
      }
    }

    if (!customerDoc || !customerDoc.exists()) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer not found",
          message: `No customer found with ID: ${id}`,
        },
        { status: 404, headers: corsHeaders }
      );
    }

    const customerData = {
      id: customerDoc.id,
      ...customerDoc.data(),
      createdAt: customerDoc.data().createdAt?.toDate()?.toISOString(),
      updatedAt: customerDoc.data().updatedAt?.toDate()?.toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: customerData,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching customer:", error);
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
 * PUT/PATCH /api/customers/[id]
 * Update customer including category permissions
 */
export async function PUT(request, { params }) {
  return PATCH(request, { params });
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Find customer document
    let customerRef;
    try {
      customerRef = doc(db, CUSTOMERS_COLLECTION, id);
      const customerDoc = await getDoc(customerRef);
      if (!customerDoc.exists()) throw new Error("Not found by doc ID");
    } catch (e) {
      // Try by customerId
      const q = query(
        collection(db, CUSTOMERS_COLLECTION),
        where("customerId", "==", id)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return NextResponse.json(
          {
            success: false,
            error: "Customer not found",
            message: `No customer found with ID: ${id}`,
          },
          { status: 404, headers: corsHeaders }
        );
      }

      customerRef = doc(db, CUSTOMERS_COLLECTION, querySnapshot.docs[0].id);
    }

    // Prepare update data (exclude system fields)
    const updateData = {
      updatedAt: serverTimestamp(),
    };

    // Only include fields that are provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.lastName !== undefined) updateData.lastName = body.lastName;
    if (body.nickname !== undefined) updateData.nickname = body.nickname;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.cell !== undefined) updateData.cell = body.cell;
    if (body.nationality !== undefined)
      updateData.nationality = body.nationality;
    if (body.dateOfBirth !== undefined)
      updateData.dateOfBirth = body.dateOfBirth;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.customPoints !== undefined)
      updateData.customPoints = body.customPoints;

    // ✅ CATEGORY PERMISSIONS - update what customer can see on kiosk
    if (body.allowedCategories !== undefined) {
      updateData.allowedCategories = body.allowedCategories;
      console.log("🔐 Updating category permissions:", body.allowedCategories);
    }

    await updateDoc(customerRef, updateData);

    console.log("✅ Customer updated:", id, updateData);

    return NextResponse.json({
      success: true,
      message: "Customer updated successfully",
      data: {
        id: customerRef.id,
        ...updateData,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customers/[id]
 * Delete customer (soft or hard delete)
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    // Find customer document
    let customerRef;
    let customerData;

    try {
      customerRef = doc(db, CUSTOMERS_COLLECTION, id);
      const customerDoc = await getDoc(customerRef);
      if (!customerDoc.exists()) throw new Error("Not found by doc ID");
      customerData = customerDoc.data();
    } catch (e) {
      // Try by customerId
      const q = query(
        collection(db, CUSTOMERS_COLLECTION),
        where("customerId", "==", id)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return NextResponse.json(
          {
            success: false,
            error: "Customer not found",
            message: `No customer found with ID: ${id}`,
          },
          { status: 404, headers: corsHeaders }
        );
      }

      customerRef = doc(db, CUSTOMERS_COLLECTION, querySnapshot.docs[0].id);
      customerData = querySnapshot.docs[0].data();
    }

    if (hardDelete) {
      // Permanent deletion
      await deleteDoc(customerRef);
      console.log("🗑️ Customer permanently deleted:", id);
    } else {
      // Soft delete
      await updateDoc(customerRef, {
        isActive: false,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("✅ Customer soft deleted:", id);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Customer deleted successfully",
        data: {
          id: customerRef.id,
          customerId: customerData.customerId,
          deleted: true,
          deletedAt: new Date().toISOString(),
          hardDelete: hardDelete,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error deleting customer:", error);
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
