import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export class PendingPointsService {
  static async createPendingPoints(pendingPointData) {
    try {
      const pendingPointsRef = collection(db, "pendingPoints");
      const docRef = await addDoc(pendingPointsRef, {
        ...pendingPointData,
        status: "pending",
        createdAt: Timestamp.now(),
        processedAt: null,
        processedBy: null,
      });

      console.log("Pending points created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating pending points:", error);
      throw error;
    }
  }

  static async getAllPendingPoints() {
    try {
      const pendingPointsRef = collection(db, "pendingPoints");
      const q = query(
        pendingPointsRef,
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const pendingPoints = [];

      querySnapshot.forEach((doc) => {
        pendingPoints.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return pendingPoints;
    } catch (error) {
      console.error("Error fetching pending points:", error);
      throw error;
    }
  }

  static async approvePendingPoints(pendingPointId, adminId, customerService) {
    try {
      const pendingPointRef = doc(db, "pendingPoints", pendingPointId);

      // Get pending point data
      const pendingPointDoc = await getDoc(pendingPointRef);
      if (!pendingPointDoc.exists()) {
        throw new Error("Pending point not found");
      }

      const pendingData = pendingPointDoc.data();

      // Add points to customer account
      await customerService.addPoints(
        pendingData.customerId,
        pendingData.pointsAmount,
        {
          transactionId: pendingData.transactionId,
          reason: pendingData.reason,
          details: pendingData.details,
          source: "admin_approval",
        }
      );

      // Update pending point status
      await updateDoc(pendingPointRef, {
        status: "approved",
        processedAt: Timestamp.now(),
        processedBy: adminId,
      });

      console.log("Pending points approved:", pendingPointId);
      return true;
    } catch (error) {
      console.error("Error approving pending points:", error);
      throw error;
    }
  }

  static async discardPendingPoints(pendingPointId, adminId) {
    try {
      const pendingPointRef = doc(db, "pendingPoints", pendingPointId);

      await updateDoc(pendingPointRef, {
        status: "discarded",
        processedAt: Timestamp.now(),
        processedBy: adminId,
      });

      console.log("Pending points discarded:", pendingPointId);
      return true;
    } catch (error) {
      console.error("Error discarding pending points:", error);
      throw error;
    }
  }

  static async batchApprovePendingPoints(
    pendingPointIds,
    adminId,
    customerService
  ) {
    try {
      const results = [];

      for (const pendingPointId of pendingPointIds) {
        try {
          await this.approvePendingPoints(
            pendingPointId,
            adminId,
            customerService
          );
          results.push({ id: pendingPointId, status: "approved" });
        } catch (error) {
          console.error(
            `Error approving pending point ${pendingPointId}:`,
            error
          );
          results.push({
            id: pendingPointId,
            status: "error",
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error in batch approve:", error);
      throw error;
    }
  }

  static async batchDiscardPendingPoints(pendingPointIds, adminId) {
    try {
      const results = [];

      for (const pendingPointId of pendingPointIds) {
        try {
          await this.discardPendingPoints(pendingPointId, adminId);
          results.push({ id: pendingPointId, status: "discarded" });
        } catch (error) {
          console.error(
            `Error discarding pending point ${pendingPointId}:`,
            error
          );
          results.push({
            id: pendingPointId,
            status: "error",
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      console.error("Error in batch discard:", error);
      throw error;
    }
  }
}
