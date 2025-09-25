import { db } from "./firebase";
import { doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";

export class VisitService {
  static async recordVisit(sessionId = null) {
    try {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
      const visitDocRef = doc(db, "dailyVisits", today);

      // Check if today's document exists
      const visitDoc = await getDoc(visitDocRef);

      if (visitDoc.exists()) {
        // Update existing document
        await updateDoc(visitDocRef, {
          count: increment(1),
          lastVisit: new Date(),
          sessions: increment(1),
        });
      } else {
        // Create new document for today
        await setDoc(visitDocRef, {
          date: today,
          count: 1,
          lastVisit: new Date(),
          sessions: 1,
          createdAt: new Date(),
        });
      }

      console.log("Visit recorded successfully for date:", today);
      return true;
    } catch (error) {
      console.error("Error recording visit:", error);
      return false;
    }
  }

  static async recordOrderStart(sessionId = null) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const visitDocRef = doc(db, "dailyVisits", today);

      // Get current document
      const visitDoc = await getDoc(visitDocRef);

      if (visitDoc.exists()) {
        // Update order starts count
        await updateDoc(visitDocRef, {
          orderStarts: increment(1),
          lastOrderStart: new Date(),
        });
      } else {
        // Create new document if it doesn't exist
        await setDoc(visitDocRef, {
          date: today,
          count: 1,
          orderStarts: 1,
          lastVisit: new Date(),
          lastOrderStart: new Date(),
          sessions: 1,
          createdAt: new Date(),
        });
      }

      console.log("Order start recorded successfully for date:", today);
      return true;
    } catch (error) {
      console.error("Error recording order start:", error);
      return false;
    }
  }

  static async getTodayVisits() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const visitDocRef = doc(db, "dailyVisits", today);
      const visitDoc = await getDoc(visitDocRef);

      if (visitDoc.exists()) {
        return visitDoc.data().count || 0;
      }

      return 0;
    } catch (error) {
      console.error("Error getting today visits:", error);
      return 0;
    }
  }

  static async getVisitStats(dateRange = 7) {
    try {
      const stats = [];
      const today = new Date();

      for (let i = 0; i < dateRange; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const visitDocRef = doc(db, "dailyVisits", dateStr);
        const visitDoc = await getDoc(visitDocRef);

        if (visitDoc.exists()) {
          stats.push({
            date: dateStr,
            ...visitDoc.data(),
          });
        } else {
          stats.push({
            date: dateStr,
            count: 0,
            orderStarts: 0,
            sessions: 0,
          });
        }
      }

      return stats.reverse(); // Return in chronological order
    } catch (error) {
      console.error("Error getting visit stats:", error);
      return [];
    }
  }
}
