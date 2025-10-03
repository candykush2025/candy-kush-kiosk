import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  getAuth,
  updatePassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

export class AdminService {
  static collection = "admins";

  // Create a new admin
  static async createAdmin({ email, password, permissions }) {
    try {
      const auth = getAuth();

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Create admin document in Firestore
      const adminData = {
        uid: user.uid,
        email: email,
        permissions: permissions, // { edit: boolean, delete: boolean, input: boolean }
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
      };

      const docRef = await addDoc(collection(db, this.collection), adminData);

      return {
        id: docRef.id,
        ...adminData,
        uid: user.uid,
      };
    } catch (error) {
      console.error("Error creating admin:", error);
      throw error;
    }
  }

  // Get all admins
  static async getAllAdmins() {
    try {
      const q = query(
        collection(db, this.collection),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));
    } catch (error) {
      console.error("Error getting admins:", error);
      throw error;
    }
  }

  // Get admin by ID
  static async getAdminById(id) {
    try {
      const docRef = doc(db, this.collection, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting admin:", error);
      throw error;
    }
  }

  // Get admin by UID (Firebase Auth UID)
  static async getAdminByUid(uid) {
    try {
      const q = query(collection(db, this.collection), where("uid", "==", uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting admin by UID:", error);
      throw error;
    }
  }

  // Update admin permissions
  static async updateAdminPermissions(id, permissions) {
    try {
      const docRef = doc(db, this.collection, id);
      await updateDoc(docRef, {
        permissions: permissions,
        updatedAt: serverTimestamp(),
      });

      // Return updated admin
      return await this.getAdminById(id);
    } catch (error) {
      console.error("Error updating admin permissions:", error);
      throw error;
    }
  }

  // Update admin status (activate/deactivate)
  static async updateAdminStatus(id, isActive) {
    try {
      const docRef = doc(db, this.collection, id);
      await updateDoc(docRef, {
        isActive: isActive,
        updatedAt: serverTimestamp(),
      });

      // Return updated admin
      return await this.getAdminById(id);
    } catch (error) {
      console.error("Error updating admin status:", error);
      throw error;
    }
  }

  // Delete admin
  static async deleteAdmin(id) {
    try {
      const docRef = doc(db, this.collection, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting admin:", error);
      throw error;
    }
  }

  // Check if admin has specific permission
  static hasPermission(admin, permission) {
    if (!admin || !admin.permissions) return false;
    return admin.permissions[permission] === true;
  }

  // Check if admin can perform action
  static canEdit(admin) {
    return this.hasPermission(admin, "edit");
  }

  static canDelete(admin) {
    return this.hasPermission(admin, "delete");
  }

  static canInput(admin) {
    return this.hasPermission(admin, "input");
  }

  // Change admin password
  static async changeAdminPassword(adminId, newPassword) {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Update the admin document with the new password hash
      // Note: In a real-world scenario, you'd want to hash the password
      const docRef = doc(db, this.collection, adminId);
      await updateDoc(docRef, {
        password: newPassword, // In production, this should be hashed
        lastPasswordChange: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        method: "direct_change",
        message: "Password updated successfully",
      };
    } catch (error) {
      console.error("Error changing admin password:", error);
      throw error;
    }
  }

  // Send password reset email to admin
  static async sendPasswordResetEmail(email) {
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  }
}
