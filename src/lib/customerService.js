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
        points: customerData.points || [], // Array to store transaction history
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

  // Get customer by member ID or customer ID
  static async getCustomerByMemberId(memberId) {
    try {
      // First try to find by memberId field
      let q = query(
        collection(db, CUSTOMERS_COLLECTION),
        where("memberId", "==", memberId),
        limit(1)
      );
      let querySnapshot = await getDocs(q);

      // If not found, try by customerId field
      if (querySnapshot.empty) {
        q = query(
          collection(db, CUSTOMERS_COLLECTION),
          where("customerId", "==", memberId),
          limit(1)
        );
        querySnapshot = await getDocs(q);
      }

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

  // Add points to customer with transaction history
  static async addPoints(customerId, points, transactionDetails = {}) {
    try {
      const customer = await this.getCustomerById(customerId);
      if (!customer) throw new Error("Customer not found");

      // Ensure points is an array
      const currentPoints = Array.isArray(customer.points)
        ? customer.points
        : [];

      // Create new point transaction
      const pointTransaction = {
        amount: points,
        type: "added",
        reason: transactionDetails.reason || "Purchase",
        transactionId: transactionDetails.transactionId || null,
        orderId: transactionDetails.orderId || null,
        timestamp: new Date().toISOString(),
        details: transactionDetails.details || "",
        items: transactionDetails.items || [], // Include item details if provided
      };

      // Add new transaction to points array
      const updatedPoints = [...currentPoints, pointTransaction];

      await this.updateCustomer(customerId, { points: updatedPoints });

      return this.calculateTotalPoints(updatedPoints);
    } catch (error) {
      console.error("Error adding points:", error);
      throw error;
    }
  }

  // Subtract points from customer (when using points)
  static async subtractPoints(customerId, points, transactionDetails = {}) {
    try {
      const customer = await this.getCustomerById(customerId);
      if (!customer) throw new Error("Customer not found");

      // Ensure points is an array
      const currentPoints = Array.isArray(customer.points)
        ? customer.points
        : [];
      const currentTotalPoints = this.calculateTotalPoints(currentPoints);

      if (currentTotalPoints < points) {
        throw new Error("Insufficient points");
      }

      // Create new point transaction for subtraction
      const pointTransaction = {
        amount: points,
        type: "minus",
        reason: transactionDetails.reason || "Points Used",
        transactionId: transactionDetails.transactionId || null,
        orderId: transactionDetails.orderId || null,
        timestamp: new Date().toISOString(),
        details: transactionDetails.details || "",
        items: transactionDetails.items || [], // Include item details if provided
      };

      // Add new transaction to points array
      const updatedPoints = [...currentPoints, pointTransaction];

      await this.updateCustomer(customerId, { points: updatedPoints });

      return this.calculateTotalPoints(updatedPoints);
    } catch (error) {
      console.error("Error subtracting points:", error);
      throw error;
    }
  }

  // Calculate total points from transactions array
  static calculateTotalPoints(pointsArray) {
    if (!Array.isArray(pointsArray)) return 0;

    return pointsArray.reduce((total, transaction) => {
      if (transaction.type === "added") {
        return total + (transaction.amount || 0);
      } else if (transaction.type === "minus") {
        return total - (transaction.amount || 0);
      }
      return total;
    }, 0);
  }

  // Get customer's current total points
  static async getCustomerTotalPoints(customerId) {
    try {
      const customer = await this.getCustomerById(customerId);
      if (!customer) throw new Error("Customer not found");

      return this.calculateTotalPoints(customer.points);
    } catch (error) {
      console.error("Error getting customer total points:", error);
      throw error;
    }
  }

  // Get customer's points transaction history
  static async getCustomerPointsHistory(customerId) {
    try {
      const customer = await this.getCustomerById(customerId);
      if (!customer) throw new Error("Customer not found");

      const pointsArray = Array.isArray(customer.points) ? customer.points : [];

      // Sort by timestamp descending (newest first)
      return pointsArray.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
    } catch (error) {
      console.error("Error getting customer points history:", error);
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
          cashbackPoints: transactionData.cashbackPoints || 0,
          createdAt: serverTimestamp(),
        }
      );

      const transactionId = transactionRef.id;

      // Update customer stats
      const customer = await this.getCustomerById(customerId);
      if (customer) {
        const newTotalSpent =
          (customer.totalSpent || 0) + transactionData.amount;

        await this.updateCustomer(customerId, {
          totalSpent: newTotalSpent,
        });

        // Add cashback points with detailed transaction history if any cashback was earned
        if (transactionData.cashbackPoints > 0) {
          // Calculate detailed cashback information for each item
          const itemDetails = transactionData.items
            .filter((item) => item.categoryId)
            .map((item) => {
              let itemName = item.name;
              // Add variant information if available
              if (item.variants && Object.keys(item.variants).length > 0) {
                const variantText = Object.entries(item.variants)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(", ");
                itemName += ` (${variantText})`;
              }
              return `${itemName} (${item.quantity || 1}x)`;
            })
            .join(", ");

          await this.addPoints(customerId, transactionData.cashbackPoints, {
            reason: "Cashback Points",
            transactionId: transactionId,
            orderId: transactionId,
            details: `Earned ${transactionData.cashbackPoints} cashback points from purchase: ${itemDetails}`,
            items: transactionData.items, // Include full item details
          });
        }
      }

      return { id: transactionId, ...transactionData };
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

// Utility functions
export const getTierColor = (tier) => {
  switch (tier) {
    case "Platinum":
      return "text-purple-600 bg-purple-100";
    case "Gold":
      return "text-yellow-600 bg-yellow-100";
    case "Silver":
      return "text-gray-600 bg-gray-100";
    case "Bronze":
      return "text-orange-600 bg-orange-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
};

export const calculateTier = (pointsData) => {
  let totalPoints = 0;

  if (Array.isArray(pointsData)) {
    // New points structure - array of transactions
    totalPoints = CustomerService.calculateTotalPoints(pointsData);
  } else {
    // Legacy points structure - number
    totalPoints = pointsData || 0;
  }

  if (totalPoints >= 2000) return "Platinum";
  if (totalPoints >= 1000) return "Gold";
  if (totalPoints >= 500) return "Silver";
  return "Bronze";
};

export const customerService = new CustomerService();
export const analyticsService = new AnalyticsService();
