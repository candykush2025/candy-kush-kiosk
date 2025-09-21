// Transaction management service using Firestore
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
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

// Transaction Service
export class TransactionService {
  // Generate next transaction ID
  static async generateTransactionId() {
    try {
      const transactionsSnapshot = await getDocs(
        collection(db, TRANSACTIONS_COLLECTION)
      );
      const transactionCount = transactionsSnapshot.size + 1;
      return `TXN-${transactionCount.toString().padStart(6, "0")}`;
    } catch (error) {
      console.error("Error generating transaction ID:", error);
      throw error;
    }
  }

  // Create a new transaction
  static async createTransaction(transactionData) {
    try {
      const transactionId = await this.generateTransactionId();

      const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
        transactionId: transactionId,
        customerId: transactionData.customerId || null,
        customerName: transactionData.customerName || "",
        orderNumber: transactionData.orderNumber || "",
        items: transactionData.items || [],
        subtotal: transactionData.subtotal || 0,
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
        originalTransactionId: transactionData.originalTransactionId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { id: docRef.id, transactionId };
    } catch (error) {
      console.error("Error creating transaction:", error);
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
