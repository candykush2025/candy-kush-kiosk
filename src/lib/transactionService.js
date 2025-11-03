// Transaction management service using Firestore
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Collection names
const TRANSACTIONS_COLLECTION = "transactions";
const ORDERS_COLLECTION = "orders";

// Helper function to remove undefined values from objects and arrays
function cleanUndefinedValues(obj) {
  if (obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj
      .map((item) => cleanUndefinedValues(item))
      .filter((item) => item !== undefined);
  } else if (obj !== null && typeof obj === "object") {
    const cleaned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value !== undefined) {
          const cleanedValue = cleanUndefinedValues(value);
          if (cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
      }
    }
    return cleaned;
  }
  return obj;
}

// Transaction Service
export class TransactionService {
  // Generate next transaction ID
  static async generateTransactionId() {
    try {
      console.log("🆔 Starting transaction ID generation...");

      // Get transaction prefix from settings
      const settingsDoc = await getDoc(doc(db, "settings", "general"));
      let prefix = "TRX";
      if (settingsDoc.exists()) {
        const settingsData = settingsDoc.data();
        prefix = settingsData.transactionPrefix || "TRX";
        console.log("📋 Settings loaded:", settingsData);
        console.log("🏷️ Using transaction prefix:", prefix);
      } else {
        console.log(
          "⚠️ No settings document found, using default prefix:",
          prefix
        );
      }

      // Use a simple counter approach
      let nextNumber = 1;
      try {
        // Try to get the counter document for this prefix
        const counterDocRef = doc(db, "counters", `transaction_${prefix}`);
        const counterDoc = await getDoc(counterDocRef);

        if (counterDoc.exists()) {
          nextNumber = (counterDoc.data().count || 0) + 1;
        }

        // Update the counter (this will create the document if it doesn't exist)
        await setDoc(counterDocRef, { count: nextNumber }, { merge: true });

        console.log(
          `🔢 Generated transaction number ${nextNumber} for prefix '${prefix}'`
        );
      } catch (counterError) {
        console.warn(
          "⚠️ Counter method failed, falling back to timestamp:",
          counterError
        );
        // Fallback to timestamp-based numbering if counter fails
        nextNumber = Date.now() % 100000; // Use last 5 digits of timestamp
      }

      // Format with leading zeros (5 digits)
      const formattedNumber = nextNumber.toString().padStart(5, "0");
      const generatedId = `${prefix}-${formattedNumber}`;
      console.log("🆔 Generated transaction ID:", generatedId);
      return generatedId;
    } catch (error) {
      console.error("Error generating transaction ID:", error);
      // Fallback to timestamp-based ID with TRX prefix
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const fallbackId = `TRX-${timestamp}-${randomSuffix}`;
      console.log("🆔 Using fallback transaction ID:", fallbackId);
      return fallbackId;
    }
  }

  // Create a new transaction
  static async createTransaction(transactionData) {
    try {
      console.log(
        "🚀 Starting transaction creation with data:",
        transactionData
      );

      const transactionId = await this.generateTransactionId();
      console.log("🆔 Generated transaction ID:", transactionId);

      // Clean and validate items array
      const cleanedItems = (transactionData.items || []).map((item) => ({
        id: item.id || "",
        name: item.name || "",
        price: item.price || 0,
        quantity: item.quantity || 0,
        image: item.image || "",
        productId: item.productId || item.id || "",
        categoryId: item.categoryId || "",
        cashbackEnabled: item.cashbackEnabled || false,
        cashbackType: item.cashbackType || "",
        cashbackValue: item.cashbackValue || 0,
        cashbackMinPurchase: item.cashbackMinPurchase || 0,
      }));

      // Build transaction document with only defined values
      const transactionDocument = {
        transactionId: transactionId,
        customerId: transactionData.customerId || null,
        customerName: transactionData.customerName || "",
        orderNumber: transactionData.orderNumber || transactionId, // Use transactionId as fallback
        items: cleanedItems,
        subtotal:
          transactionData.subtotal ||
          transactionData.originalTotal ||
          transactionData.total ||
          0,
        tax: transactionData.tax || 0,
        discount: transactionData.discount || 0,
        total: transactionData.total || 0,
        paymentMethod: transactionData.paymentMethod || "cash",
        paymentStatus: transactionData.paymentStatus || "completed",
        transactionType: transactionData.transactionType || "sale", // sale, refund, exchange
        status: transactionData.status || "completed", // pending, completed, cancelled, refunded
        cashier: transactionData.cashier || "Admin",
        location: transactionData.location || "Main Store",
        notes: transactionData.notes || "",
        refundReason: transactionData.refundReason || "",
        // Add point calculation fields
        pointsEarned: transactionData.pointsEarned || 0,
        pointDetails: transactionData.pointDetails || [],
        cashbackEarned: transactionData.cashbackEarned || 0,
        // Points usage information
        pointsUsed: transactionData.pointsUsed || 0,
        pointsUsedValue: transactionData.pointsUsedValue || 0,
        pointsUsagePercentage: transactionData.pointsUsagePercentage || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add optional fields if they have actual values (not null/undefined)
      if (transactionData.originalTransactionId) {
        transactionDocument.originalTransactionId =
          transactionData.originalTransactionId;
      }
      if (
        transactionData.pointCalculation &&
        typeof transactionData.pointCalculation === "object"
      ) {
        // Clean the pointCalculation object
        transactionDocument.pointCalculation = {
          totalPointsEarned:
            transactionData.pointCalculation.totalPointsEarned || 0,
          calculationMethod:
            transactionData.pointCalculation.calculationMethod || "none",
          items: Array.isArray(transactionData.pointCalculation.items)
            ? transactionData.pointCalculation.items.map((item) => ({
                productId: item.productId || "",
                productName: item.productName || "",
                categoryId: item.categoryId || "",
                categoryName: item.categoryName || "",
                subtotal: item.subtotal || 0,
                cashbackType: item.cashbackType || "",
                cashbackValue: item.cashbackValue || 0,
                cashbackAmount: item.cashbackAmount || 0,
                points: item.points || 0,
              }))
            : [],
        };
      }

      console.log("📄 Transaction document to save:", transactionDocument);

      // Clean undefined values from the document
      const cleanedDocument = cleanUndefinedValues(transactionDocument);
      console.log("🧹 Cleaned transaction document:", cleanedDocument);
      console.log(
        "🔍 Cleaned document as JSON:",
        JSON.stringify(cleanedDocument, null, 2)
      );

      const docRef = await addDoc(
        collection(db, TRANSACTIONS_COLLECTION),
        cleanedDocument
      );

      console.log(
        "✅ Transaction successfully saved to Firestore with ID:",
        docRef.id
      );

      const returnData = { id: docRef.id, transactionId };
      console.log("🔄 Returning transaction data:", returnData);
      return returnData;
    } catch (error) {
      console.error("❌ Error creating transaction:", error);
      console.error("❌ Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Test function to verify Firebase connectivity and write permissions
  static async testFirebaseWrite() {
    try {
      console.log("🧪 Testing Firebase write capability...");

      const testDoc = {
        test: true,
        timestamp: new Date().toISOString(),
        message: "Test document from TransactionService",
      };

      const docRef = await addDoc(collection(db, "test_collection"), testDoc);
      console.log("✅ Test write successful! Document ID:", docRef.id);

      // Clean up the test document
      await deleteDoc(doc(db, "test_collection", docRef.id));
      console.log("🧹 Test document cleaned up");

      return { success: true, documentId: docRef.id };
    } catch (error) {
      console.error("❌ Test write failed:", error);
      return { success: false, error: error.message };
    }
  }

  // Simple test transaction creation
  static async createTestTransaction() {
    try {
      console.log("🧪 Creating test transaction...");

      const testTransactionData = {
        customerId: null,
        customerName: "Test Customer",
        items: [{ name: "Test Item", price: 10, quantity: 1 }],
        subtotal: 10,
        total: 10,
        paymentMethod: "cash",
      };

      const result = await this.createTransaction(testTransactionData);
      console.log("✅ Test transaction created:", result);
      return result;
    } catch (error) {
      console.error("❌ Test transaction failed:", error);
      throw error;
    }
  }

  // Get all transactions with pagination
  static async getAllTransactions(limitCount = 50, orderByField = "createdAt") {
    try {
      const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        orderBy(orderByField, "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const transactions = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      return transactions;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }

  // Get transaction by ID
  static async getTransactionById(transactionId) {
    try {
      const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
      throw error;
    }
  }

  // Search transactions
  static async searchTransactions(searchTerm, searchField = "transactionId") {
    try {
      const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where(searchField, ">=", searchTerm),
        where(searchField, "<=", searchTerm + "\uf8ff"),
        orderBy(searchField),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const transactions = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      return transactions;
    } catch (error) {
      console.error("Error searching transactions:", error);
      throw error;
    }
  }

  // Update transaction
  static async updateTransaction(id, updateData) {
    try {
      const docRef = doc(db, TRANSACTIONS_COLLECTION, id);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  }

  // Delete transaction
  static async deleteTransaction(id) {
    try {
      const docRef = doc(db, TRANSACTIONS_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      throw error;
    }
  }

  // Get transactions by date range
  static async getTransactionsByDateRange(startDate, endDate) {
    try {
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));

      const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where("createdAt", ">=", startTimestamp),
        where("createdAt", "<=", endTimestamp),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const transactions = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      return transactions;
    } catch (error) {
      console.error("Error fetching transactions by date range:", error);
      throw error;
    }
  }

  // Get transactions by customer
  static async getTransactionsByCustomer(customerId) {
    try {
      const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where("customerId", "==", customerId),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const transactions = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      return transactions;
    } catch (error) {
      console.error("Error fetching customer transactions:", error);
      throw error;
    }
  }

  // Get transaction statistics
  static async getTransactionStats() {
    try {
      const transactionsSnapshot = await getDocs(
        collection(db, TRANSACTIONS_COLLECTION)
      );
      let totalRevenue = 0;
      let totalTransactions = 0;
      let completedTransactions = 0;
      let refundedTransactions = 0;

      transactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        totalTransactions++;

        if (data.status === "completed") {
          completedTransactions++;
          totalRevenue += data.total || 0;
        }

        if (data.status === "refunded") {
          refundedTransactions++;
        }
      });

      return {
        totalRevenue,
        totalTransactions,
        completedTransactions,
        refundedTransactions,
        averageTransactionValue:
          totalTransactions > 0 ? totalRevenue / completedTransactions : 0,
      };
    } catch (error) {
      console.error("Error getting transaction stats:", error);
      throw error;
    }
  }

  // Process refund
  static async processRefund(
    originalTransactionId,
    refundAmount,
    refundReason
  ) {
    try {
      const refundTransactionId = await this.generateTransactionId();

      const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
        transactionId: refundTransactionId,
        originalTransactionId: originalTransactionId,
        total: -Math.abs(refundAmount), // Negative amount for refund
        paymentMethod: "refund",
        paymentStatus: "completed",
        transactionType: "refund",
        status: "completed",
        refundReason: refundReason,
        cashier: "Admin",
        location: "Main Store",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update original transaction status
      const originalDocRef = doc(
        db,
        TRANSACTIONS_COLLECTION,
        originalTransactionId
      );
      await updateDoc(originalDocRef, {
        status: "refunded",
        refundTransactionId: refundTransactionId,
        updatedAt: serverTimestamp(),
      });

      return { id: docRef.id, transactionId: refundTransactionId };
    } catch (error) {
      console.error("Error processing refund:", error);
      throw error;
    }
  }
}

// Order Service
export class OrderService {
  // Generate next order ID
  static async generateOrderId() {
    try {
      const ordersSnapshot = await getDocs(collection(db, ORDERS_COLLECTION));
      const orderCount = ordersSnapshot.size + 1;
      return `ORD-${orderCount.toString().padStart(6, "0")}`;
    } catch (error) {
      console.error("Error generating order ID:", error);
      throw error;
    }
  }

  // Create a new order
  static async createOrder(orderData) {
    try {
      const orderId = await this.generateOrderId();

      const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
        orderId: orderId,
        customerId: orderData.customerId || null,
        customerName: orderData.customerName || "",
        customerEmail: orderData.customerEmail || "",
        customerPhone: orderData.customerPhone || "",
        items: orderData.items || [],
        subtotal: orderData.subtotal || 0,
        tax: orderData.tax || 0,
        discount: orderData.discount || 0,
        total: orderData.total || 0,
        orderType: orderData.orderType || "pickup", // pickup, delivery, in-store
        orderStatus: orderData.orderStatus || "pending", // pending, confirmed, preparing, ready, completed, cancelled
        paymentStatus: orderData.paymentStatus || "pending", // pending, paid, refunded
        paymentMethod: orderData.paymentMethod || "",
        deliveryAddress: orderData.deliveryAddress || "",
        deliveryDate: orderData.deliveryDate || null,
        deliveryTime: orderData.deliveryTime || "",
        specialInstructions: orderData.specialInstructions || "",
        estimatedCompletion: orderData.estimatedCompletion || null,
        assignedStaff: orderData.assignedStaff || "",
        priority: orderData.priority || "normal", // low, normal, high, urgent
        source: orderData.source || "admin", // admin, kiosk, online, phone
        notes: orderData.notes || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { id: docRef.id, orderId };
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  // Get all orders with pagination
  static async getAllOrders(limitCount = 50, orderByField = "createdAt") {
    try {
      const q = query(
        collection(db, ORDERS_COLLECTION),
        orderBy(orderByField, "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const orders = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          deliveryDate: data.deliveryDate?.toDate(),
          estimatedCompletion: data.estimatedCompletion?.toDate(),
        });
      });

      return orders;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  }

  // Update order status
  static async updateOrderStatus(id, status, notes = "") {
    try {
      const docRef = doc(db, ORDERS_COLLECTION, id);
      await updateDoc(docRef, {
        orderStatus: status,
        notes: notes,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  // Get orders by status
  static async getOrdersByStatus(status) {
    try {
      const q = query(
        collection(db, ORDERS_COLLECTION),
        where("orderStatus", "==", status),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const orders = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          deliveryDate: data.deliveryDate?.toDate(),
          estimatedCompletion: data.estimatedCompletion?.toDate(),
        });
      });

      return orders;
    } catch (error) {
      console.error("Error fetching orders by status:", error);
      throw error;
    }
  }

  // Delete order
  static async deleteOrder(id) {
    try {
      const docRef = doc(db, ORDERS_COLLECTION, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
  }
}
