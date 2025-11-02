/**
 * Joint Builder Service
 * Handles all Firebase operations for the Joint Builder
 */

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

// ==================== FETCH DATA ====================

/**
 * Get all joint builder steps
 */
export async function getJointBuilderSteps() {
  try {
    const stepsRef = collection(db, "jointBuilderSteps");
    const q = query(
      stepsRef,
      where("active", "==", true),
      orderBy("sortOrder")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching joint builder steps:", error);
    return [];
  }
}

/**
 * Get all paper options
 */
export async function getPaperOptions() {
  try {
    const papersRef = collection(db, "jointBuilderPapers");
    const q = query(
      papersRef,
      where("active", "==", true),
      orderBy("sortOrder")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching paper options:", error);
    return [];
  }
}

/**
 * Get all filter options
 */
export async function getFilterOptions() {
  try {
    const filtersRef = collection(db, "jointBuilderFilters");
    const q = query(
      filtersRef,
      where("active", "==", true),
      orderBy("sortOrder")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return [];
  }
}

/**
 * Get filling options by category (worm, flower, hash)
 */
export async function getFillingOptions(category = null) {
  try {
    const fillingsRef = collection(db, "jointBuilderFillings");
    let q;

    if (category) {
      q = query(
        fillingsRef,
        where("active", "==", true),
        where("category", "==", category),
        orderBy("sortOrder")
      );
    } else {
      q = query(fillingsRef, where("active", "==", true), orderBy("sortOrder"));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching filling options:", error);
    return [];
  }
}

/**
 * Get external options by category (coating, wrap)
 */
export async function getExternalOptions(category = null) {
  try {
    const externalsRef = collection(db, "jointBuilderExternals");
    let q;

    if (category) {
      q = query(
        externalsRef,
        where("active", "==", true),
        where("category", "==", category),
        orderBy("sortOrder")
      );
    } else {
      q = query(
        externalsRef,
        where("active", "==", true),
        orderBy("sortOrder")
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching external options:", error);
    return [];
  }
}

/**
 * Get compatibility rules for a specific paper type
 */
export async function getCompatibilityRules(paperType = null) {
  try {
    const rulesRef = collection(db, "jointBuilderRules");
    let q;

    if (paperType) {
      q = query(rulesRef, where("paperType", "==", paperType));
    } else {
      q = query(rulesRef);
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching compatibility rules:", error);
    return [];
  }
}

// ==================== ADMIN: FETCH ALL (INCLUDING INACTIVE) ====================

/**
 * Get all paper options (including inactive) for admin
 */
export async function getAllPaperOptions() {
  try {
    const papersRef = collection(db, "jointBuilderPapers");
    const q = query(papersRef, orderBy("sortOrder"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all paper options:", error);
    return [];
  }
}

/**
 * Get all filter options (including inactive) for admin
 */
export async function getAllFilterOptions() {
  try {
    const filtersRef = collection(db, "jointBuilderFilters");
    const q = query(filtersRef, orderBy("sortOrder"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all filter options:", error);
    return [];
  }
}

/**
 * Get all filling options (including inactive) for admin
 */
export async function getAllFillingOptions(category = null) {
  try {
    const fillingsRef = collection(db, "jointBuilderFillings");
    let q;

    if (category) {
      q = query(
        fillingsRef,
        where("category", "==", category),
        orderBy("sortOrder")
      );
    } else {
      q = query(fillingsRef, orderBy("sortOrder"));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all filling options:", error);
    return [];
  }
}

/**
 * Get all external options (including inactive) for admin
 */
export async function getAllExternalOptions(category = null) {
  try {
    const externalsRef = collection(db, "jointBuilderExternals");
    let q;

    if (category) {
      q = query(
        externalsRef,
        where("category", "==", category),
        orderBy("sortOrder")
      );
    } else {
      q = query(externalsRef, orderBy("sortOrder"));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all external options:", error);
    return [];
  }
}

// ==================== ADMIN: CREATE/UPDATE/DELETE ====================

/**
 * Add or update a paper option
 */
export async function savePaperOption(paperData) {
  try {
    const paperId = paperData.id;
    const { id, ...dataToSave } = paperData;
    const paperRef = doc(db, "jointBuilderPapers", paperId);
    await setDoc(paperRef, dataToSave, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving paper option:", error);
    throw error;
  }
}

/**
 * Delete a paper option
 */
export async function deletePaperOption(paperId) {
  try {
    const paperRef = doc(db, "jointBuilderPapers", paperId);
    await deleteDoc(paperRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting paper option:", error);
    throw error;
  }
}

/**
 * Add or update a filter option
 */
export async function saveFilterOption(filterData) {
  try {
    const filterId = filterData.id;
    const { id, ...dataToSave } = filterData;
    const filterRef = doc(db, "jointBuilderFilters", filterId);
    await setDoc(filterRef, dataToSave, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving filter option:", error);
    throw error;
  }
}

/**
 * Delete a filter option
 */
export async function deleteFilterOption(filterId) {
  try {
    const filterRef = doc(db, "jointBuilderFilters", filterId);
    await deleteDoc(filterRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting filter option:", error);
    throw error;
  }
}

/**
 * Add or update a filling option
 */
export async function saveFillingOption(fillingData) {
  try {
    const fillingId = fillingData.id;
    const { id, ...dataToSave } = fillingData;
    const fillingRef = doc(db, "jointBuilderFillings", fillingId);
    await setDoc(fillingRef, dataToSave, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving filling option:", error);
    throw error;
  }
}

/**
 * Delete a filling option
 */
export async function deleteFillingOption(fillingId) {
  try {
    const fillingRef = doc(db, "jointBuilderFillings", fillingId);
    await deleteDoc(fillingRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting filling option:", error);
    throw error;
  }
}

/**
 * Add or update an external option
 */
export async function saveExternalOption(externalData) {
  try {
    const externalId = externalData.id;
    const { id, ...dataToSave } = externalData;
    const externalRef = doc(db, "jointBuilderExternals", externalId);
    await setDoc(externalRef, dataToSave, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving external option:", error);
    throw error;
  }
}

/**
 * Delete an external option
 */
export async function deleteExternalOption(externalId) {
  try {
    const externalRef = doc(db, "jointBuilderExternals", externalId);
    await deleteDoc(externalRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting external option:", error);
    throw error;
  }
}

/**
 * Add or update a compatibility rule
 */
export async function saveCompatibilityRule(ruleId, ruleData) {
  try {
    const ruleRef = doc(db, "jointBuilderRules", ruleId);
    await setDoc(ruleRef, ruleData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving compatibility rule:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a compatibility rule
 */
export async function deleteCompatibilityRule(ruleId) {
  try {
    const ruleRef = doc(db, "jointBuilderRules", ruleId);
    await deleteDoc(ruleRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting compatibility rule:", error);
    return { success: false, error: error.message };
  }
}
