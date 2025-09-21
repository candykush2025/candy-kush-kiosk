// Customer management service using Firestore
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
const CUSTOMERS_COLLECTION = "customers";
const TRANSACTIONS_COLLECTION = "transactions";
const VISITS_COLLECTION = "visits";

// Customer Service
export class CustomerService {
  // Generate next customer ID
  static async generateCustomerId() {
    try {
      const customersSnapshot = await getDocs(
        collection(db, CUSTOMERS_COLLECTION)
      );
      const customerCount = customersSnapshot.size + 1;
      return `CK-${customerCount.toString().padStart(4, "0")}`;
    } catch (error) {
      console.error("Error generating customer ID:", error);
      throw error;
    }
  }

  // Create a new customer
  static async createCustomer(customerData) {
    try {
      const customerId = await this.generateCustomerId();

      const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), {
        customerId: customerId,
        nationality: customerData.nationality || "",
        name: customerData.name,
        lastName: customerData.lastName || "",
        nickname: customerData.nickname || "",
        email: customerData.email || "",
        cell: customerData.cell || "",
        memberId: customerData.memberId || customerId, // Use customerId as fallback
        points: customerData.points || 0,
        totalSpent: 0,
        visitCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      });

      return { id: docRef.id, customerId, ...customerData };
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  }

  // Get all customers
  static async getAllCustomers() {
    try {
      const q = query(
        collection(db, CUSTOMERS_COLLECTION),
        orderBy("updatedAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));
    } catch (error) {
      console.error("Error getting customers:", error);
      throw error;
    }
  }

  // Get customer by ID
  static async getCustomerById(customerId) {
    try {
      const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
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
      console.error("Error getting customer:", error);
      throw error;
    }
  }

  // Get customer by member ID
  static async getCustomerByMemberId(memberId) {
    try {
      const q = query(
        collection(db, CUSTOMERS_COLLECTION),
        where("memberId", "==", memberId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting customer by member ID:", error);
      throw error;
    }
  }

  // Update customer
  static async updateCustomer(customerId, updates) {
    try {
      const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return await this.getCustomerById(customerId);
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  }

  // Delete customer
  static async deleteCustomer(customerId) {
    try {
      const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw error;
    }
  }

  // Add points to customer
  static async addPoints(customerId, points) {
    try {
      const customer = await this.getCustomerById(customerId);
      if (!customer) throw new Error("Customer not found");

      const newPoints = (customer.points || 0) + points;
      await this.updateCustomer(customerId, { points: newPoints });

      return newPoints;
    } catch (error) {
      console.error("Error adding points:", error);
      throw error;
    }
  }

  // Record a transaction
  static async recordTransaction(customerId, transactionData) {
    try {
      // Add transaction record
      const transactionRef = await addDoc(
        collection(db, TRANSACTIONS_COLLECTION),
        {
          customerId,
          amount: transactionData.amount,
          items: transactionData.items,
          paymentMethod: transactionData.paymentMethod || "cash",
          pointsEarned: transactionData.pointsEarned || 0,
          createdAt: serverTimestamp(),
        }
      );

      // Update customer stats
      const customer = await this.getCustomerById(customerId);
      if (customer) {
        const newTotalSpent =
          (customer.totalSpent || 0) + transactionData.amount;
        const newPoints =
          (customer.points || 0) + (transactionData.pointsEarned || 0);

        await this.updateCustomer(customerId, {
          totalSpent: newTotalSpent,
          points: newPoints,
        });
      }

      return { id: transactionRef.id, ...transactionData };
    } catch (error) {
      console.error("Error recording transaction:", error);
      throw error;
    }
  }

  // Record a visit
  static async recordVisit(customerId) {
    try {
      // Add visit record
      await addDoc(collection(db, VISITS_COLLECTION), {
        customerId,
        timestamp: serverTimestamp(),
      });

      // Update customer visit count
      const customer = await this.getCustomerById(customerId);
      if (customer) {
        const newVisitCount = (customer.visitCount || 0) + 1;
        await this.updateCustomer(customerId, {
          visitCount: newVisitCount,
        });
      }

      return true;
    } catch (error) {
      console.error("Error recording visit:", error);
      throw error;
    }
  }
}

// Analytics Service
export class AnalyticsService {
  // Get total customers
  static async getTotalCustomers() {
    try {
      const querySnapshot = await getDocs(collection(db, CUSTOMERS_COLLECTION));
      return querySnapshot.size;
    } catch (error) {
      console.error("Error getting total customers:", error);
      return 0;
    }
  }

  // Get total revenue
  static async getTotalRevenue() {
    try {
      const querySnapshot = await getDocs(
        collection(db, TRANSACTIONS_COLLECTION)
      );
      let total = 0;

      querySnapshot.forEach((doc) => {
        total += doc.data().amount || 0;
      });

      return total;
    } catch (error) {
      console.error("Error getting total revenue:", error);
      return 0;
    }
  }

  // Get top customers by spending
  static async getTopCustomers(limitCount = 10) {
    try {
      const q = query(
        collection(db, CUSTOMERS_COLLECTION),
        orderBy("totalSpent", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));
    } catch (error) {
      console.error("Error getting top customers:", error);
      return [];
    }
  }

  // Get recent transactions
  static async getRecentTransactions(limitCount = 20) {
    try {
      const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const transactions = [];

      for (const doc of querySnapshot.docs) {
        const transactionData = doc.data();
        const customer = await CustomerService.getCustomerById(
          transactionData.customerId
        );

        transactions.push({
          id: doc.id,
          ...transactionData,
          createdAt: transactionData.createdAt?.toDate(),
          customerName: customer?.name || "Unknown",
        });
      }

      return transactions;
    } catch (error) {
      console.error("Error getting recent transactions:", error);
      return [];
    }
  }

  // Get total visits today
  static async getVisitsToday() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, VISITS_COLLECTION),
        where("timestamp", ">=", Timestamp.fromDate(today))
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error("Error getting visits today:", error);
      return 0;
    }
  }

  // Get revenue trends (last 30 days)
  static async getRevenueTrends(days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(
        collection(db, TRANSACTIONS_COLLECTION),
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(endDate)),
        orderBy("createdAt", "asc")
      );

      const querySnapshot = await getDocs(q);
      const dailyRevenue = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.createdAt?.toDate().toDateString();
        if (date) {
          dailyRevenue[date] = (dailyRevenue[date] || 0) + (data.amount || 0);
        }
      });

      return dailyRevenue;
    } catch (error) {
      console.error("Error getting revenue trends:", error);
      return {};
    }
  }
}

export const customerService = new CustomerService();
export const analyticsService = new AnalyticsService();
