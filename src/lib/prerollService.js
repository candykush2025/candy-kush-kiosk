import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";

const PREROLLS_COLLECTION = "prerollsSpecial";
const PREROLLS_CONFIG_DOC = "configuration"; // For background image and global settings

/**
 * Preroll Service
 * Manages the dynamic prerolls special page data
 */
export class PrerollService {
  /**
   * Get prerolls configuration (background image, etc.)
   */
  static async getConfiguration() {
    try {
      const docRef = doc(db, PREROLLS_COLLECTION, PREROLLS_CONFIG_DOC);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }

      // Return default configuration if not exists
      return {
        id: PREROLLS_CONFIG_DOC,
        backgroundType: "image", // "image" or "color"
        backgroundColor: "#ffffff",
        backgroundImage: "/background.jpg",
        backgroundFit: "cover",
        isActive: true,
      };
    } catch (error) {
      console.error("Error getting prerolls configuration:", error);
      throw error;
    }
  }

  /**
   * Update prerolls configuration
   */
  static async updateConfiguration(configData, backgroundImageFile = null) {
    try {
      const docRef = doc(db, PREROLLS_COLLECTION, PREROLLS_CONFIG_DOC);
      let updateData = {
        backgroundType: configData.backgroundType || "image",
        backgroundColor: configData.backgroundColor || "#ffffff",
        backgroundFit: configData.backgroundFit || "cover",
        isActive:
          configData.isActive !== undefined ? configData.isActive : true,
        updatedAt: serverTimestamp(),
      };

      // Handle background image upload (only if type is "image")
      if (backgroundImageFile) {
        const imagePath = `prerolls/background/${backgroundImageFile.name}`;
        const imageUrl = await this.uploadImage(backgroundImageFile, imagePath);
        updateData.backgroundImage = imageUrl;
        updateData.backgroundImagePath = imagePath;
      } else if (configData.backgroundImage) {
        updateData.backgroundImage = configData.backgroundImage;
      }

      await setDoc(docRef, updateData, { merge: true });
      return true;
    } catch (error) {
      console.error("Error updating prerolls configuration:", error);
      throw error;
    }
  }

  /**
   * Get all quality types (outdoor, indoor, top)
   */
  static async getAllQualityTypes() {
    try {
      const qualityCollection = collection(
        db,
        PREROLLS_COLLECTION,
        "data",
        "qualityTypes"
      );
      const snapshot = await getDocs(qualityCollection);

      const qualities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by order
      qualities.sort((a, b) => (a.order || 0) - (b.order || 0));

      return qualities;
    } catch (error) {
      console.error("Error getting quality types:", error);
      throw error;
    }
  }

  /**
   * Get all strain types (sativa, hybrid, indica)
   */
  static async getAllStrainTypes() {
    try {
      const strainCollection = collection(
        db,
        PREROLLS_COLLECTION,
        "data",
        "strainTypes"
      );
      const snapshot = await getDocs(strainCollection);

      const strains = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by order
      strains.sort((a, b) => (a.order || 0) - (b.order || 0));

      return strains;
    } catch (error) {
      console.error("Error getting strain types:", error);
      throw error;
    }
  }

  /**
   * Get all preroll products (combinations of quality + strain)
   */
  static async getAllPrerolls() {
    try {
      const prerollsCollection = collection(
        db,
        PREROLLS_COLLECTION,
        "data",
        "products"
      );
      const snapshot = await getDocs(prerollsCollection);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting prerolls:", error);
      throw error;
    }
  }

  /**
   * Get size prices (small, normal, king)
   */
  static async getSizePrices() {
    try {
      const docRef = doc(
        db,
        PREROLLS_COLLECTION,
        "data",
        "settings",
        "sizePrices"
      );
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data();
      }

      // Return default prices
      return {
        small: 100,
        normal: 150,
        king: 200,
      };
    } catch (error) {
      console.error("Error getting size prices:", error);
      // Return defaults on error
      return {
        small: 100,
        normal: 150,
        king: 200,
      };
    }
  }

  /**
   * Update size prices
   */
  static async updateSizePrices(prices) {
    try {
      const docRef = doc(
        db,
        PREROLLS_COLLECTION,
        "data",
        "settings",
        "sizePrices"
      );
      await setDoc(
        docRef,
        {
          small: prices.small || 100,
          normal: prices.normal || 150,
          king: prices.king || 200,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    } catch (error) {
      console.error("Error updating size prices:", error);
      throw error;
    }
  }

  /**
   * Create quality type
   */
  static async createQualityType(qualityData, imageFile = null) {
    try {
      let imageUrl = "";
      let imagePath = "";

      if (imageFile) {
        imagePath = `prerolls/qualities/${qualityData.key}/${imageFile.name}`;
        imageUrl = await this.uploadImage(imageFile, imagePath);
      }

      const qualityCollection = collection(
        db,
        PREROLLS_COLLECTION,
        "data",
        "qualityTypes"
      );
      const docRef = await addDoc(qualityCollection, {
        key: qualityData.key,
        name: qualityData.name,
        color: qualityData.color || "#000000",
        order: qualityData.order || 0,
        image: imageUrl,
        imagePath: imagePath,
        isActive:
          qualityData.isActive !== undefined ? qualityData.isActive : true,
        createdAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating quality type:", error);
      throw error;
    }
  }

  /**
   * Update quality type
   */
  static async updateQualityType(
    id,
    qualityData,
    imageFile = null,
    removeImage = false
  ) {
    try {
      const docRef = doc(db, PREROLLS_COLLECTION, "data", "qualityTypes", id);
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error("Quality type not found");
      }

      const currentData = currentDoc.data();
      let updateData = {
        key: qualityData.key,
        name: qualityData.name,
        color: qualityData.color || "#000000",
        order: qualityData.order || 0,
        isActive:
          qualityData.isActive !== undefined ? qualityData.isActive : true,
        updatedAt: serverTimestamp(),
      };

      // Handle image removal
      if (removeImage && currentData.imagePath) {
        await this.deleteImage(currentData.imagePath);
        updateData.image = "";
        updateData.imagePath = "";
      }

      // Handle new image upload
      if (imageFile) {
        // Delete old image if exists
        if (currentData.imagePath) {
          await this.deleteImage(currentData.imagePath);
        }

        const imagePath = `prerolls/qualities/${qualityData.key}/${imageFile.name}`;
        const imageUrl = await this.uploadImage(imageFile, imagePath);
        updateData.image = imageUrl;
        updateData.imagePath = imagePath;
      }

      await updateDoc(docRef, updateData);
      return true;
    } catch (error) {
      console.error("Error updating quality type:", error);
      throw error;
    }
  }

  /**
   * Delete quality type
   */
  static async deleteQualityType(id) {
    try {
      const docRef = doc(db, PREROLLS_COLLECTION, "data", "qualityTypes", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Delete image if exists
        if (data.imagePath) {
          await this.deleteImage(data.imagePath);
        }
      }

      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting quality type:", error);
      throw error;
    }
  }

  /**
   * Create strain type
   */
  static async createStrainType(strainData, imageFile = null) {
    try {
      let imageUrl = "";
      let imagePath = "";

      if (imageFile) {
        imagePath = `prerolls/strains/${strainData.key}/${imageFile.name}`;
        imageUrl = await this.uploadImage(imageFile, imagePath);
      }

      const strainCollection = collection(
        db,
        PREROLLS_COLLECTION,
        "data",
        "strainTypes"
      );
      const docRef = await addDoc(strainCollection, {
        key: strainData.key,
        name: strainData.name,
        color: strainData.color || "#000000",
        order: strainData.order || 0,
        image: imageUrl,
        imagePath: imagePath,
        isActive:
          strainData.isActive !== undefined ? strainData.isActive : true,
        createdAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating strain type:", error);
      throw error;
    }
  }

  /**
   * Update strain type
   */
  static async updateStrainType(
    id,
    strainData,
    imageFile = null,
    removeImage = false
  ) {
    try {
      const docRef = doc(db, PREROLLS_COLLECTION, "data", "strainTypes", id);
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error("Strain type not found");
      }

      const currentData = currentDoc.data();
      let updateData = {
        key: strainData.key,
        name: strainData.name,
        color: strainData.color || "#000000",
        order: strainData.order || 0,
        isActive:
          strainData.isActive !== undefined ? strainData.isActive : true,
        updatedAt: serverTimestamp(),
      };

      // Handle image removal
      if (removeImage && currentData.imagePath) {
        await this.deleteImage(currentData.imagePath);
        updateData.image = "";
        updateData.imagePath = "";
      }

      // Handle new image upload
      if (imageFile) {
        // Delete old image if exists
        if (currentData.imagePath) {
          await this.deleteImage(currentData.imagePath);
        }

        const imagePath = `prerolls/strains/${strainData.key}/${imageFile.name}`;
        const imageUrl = await this.uploadImage(imageFile, imagePath);
        updateData.image = imageUrl;
        updateData.imagePath = imagePath;
      }

      await updateDoc(docRef, updateData);
      return true;
    } catch (error) {
      console.error("Error updating strain type:", error);
      throw error;
    }
  }

  /**
   * Delete strain type
   */
  static async deleteStrainType(id) {
    try {
      const docRef = doc(db, PREROLLS_COLLECTION, "data", "strainTypes", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Delete image if exists
        if (data.imagePath) {
          await this.deleteImage(data.imagePath);
        }
      }

      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting strain type:", error);
      throw error;
    }
  }

  /**
   * Create preroll product (quality + strain combination with variants)
   */
  static async createPrerollProduct(productData, mainImageFile = null) {
    try {
      let mainImageUrl = "";
      let mainImagePath = "";

      if (mainImageFile) {
        mainImagePath = `prerolls/products/${productData.quality}_${productData.strain}/main_${mainImageFile.name}`;
        mainImageUrl = await this.uploadImage(mainImageFile, mainImagePath);
      }

      const productsCollection = collection(
        db,
        PREROLLS_COLLECTION,
        "data",
        "products"
      );
      const docRef = await addDoc(productsCollection, {
        quality: productData.quality, // outdoor, indoor, top
        strain: productData.strain, // sativa, hybrid, indica
        mainImage: mainImageUrl,
        mainImagePath: mainImagePath,
        variants: {
          small: {
            price: productData.variants?.small?.price || 100,
            image: productData.variants?.small?.image || "",
            imagePath: productData.variants?.small?.imagePath || "",
          },
          normal: {
            price: productData.variants?.normal?.price || 150,
            image: productData.variants?.normal?.image || "",
            imagePath: productData.variants?.normal?.imagePath || "",
          },
          king: {
            price: productData.variants?.king?.price || 200,
            image: productData.variants?.king?.image || "",
            imagePath: productData.variants?.king?.imagePath || "",
          },
        },
        isActive:
          productData.isActive !== undefined ? productData.isActive : true,
        createdAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creating preroll product:", error);
      throw error;
    }
  }

  /**
   * Update preroll product
   */
  static async updatePrerollProduct(
    id,
    productData,
    mainImageFile = null,
    removeMainImage = false
  ) {
    try {
      const docRef = doc(db, PREROLLS_COLLECTION, "data", "products", id);
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error("Preroll product not found");
      }

      const currentData = currentDoc.data();
      let updateData = {
        quality: productData.quality,
        strain: productData.strain,
        variants: productData.variants || currentData.variants,
        isActive:
          productData.isActive !== undefined ? productData.isActive : true,
        updatedAt: serverTimestamp(),
      };

      // Handle main image removal
      if (removeMainImage && currentData.mainImagePath) {
        await this.deleteImage(currentData.mainImagePath);
        updateData.mainImage = "";
        updateData.mainImagePath = "";
      }

      // Handle new main image upload
      if (mainImageFile) {
        // Delete old main image if exists
        if (currentData.mainImagePath) {
          await this.deleteImage(currentData.mainImagePath);
        }

        const imagePath = `prerolls/products/${productData.quality}_${productData.strain}/main_${mainImageFile.name}`;
        const imageUrl = await this.uploadImage(mainImageFile, imagePath);
        updateData.mainImage = imageUrl;
        updateData.mainImagePath = imagePath;
      }

      await updateDoc(docRef, updateData);
      return true;
    } catch (error) {
      console.error("Error updating preroll product:", error);
      throw error;
    }
  }

  /**
   * Update variant image for a specific product and size
   */
  static async updateVariantImage(
    productId,
    size, // 'small', 'normal', or 'king'
    imageFile,
    removeImage = false
  ) {
    try {
      const docRef = doc(
        db,
        PREROLLS_COLLECTION,
        "data",
        "products",
        productId
      );
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error("Preroll product not found");
      }

      const currentData = currentDoc.data();
      const variants = { ...currentData.variants };

      if (removeImage && variants[size]?.imagePath) {
        // Delete old image
        await this.deleteImage(variants[size].imagePath);
        variants[size].image = "";
        variants[size].imagePath = "";
      } else if (imageFile) {
        // Delete old image if exists
        if (variants[size]?.imagePath) {
          await this.deleteImage(variants[size].imagePath);
        }

        // Upload new image
        const imagePath = `prerolls/products/${currentData.quality}_${currentData.strain}/${size}_${imageFile.name}`;
        const imageUrl = await this.uploadImage(imageFile, imagePath);

        variants[size] = {
          ...variants[size],
          image: imageUrl,
          imagePath: imagePath,
        };
      }

      await updateDoc(docRef, {
        variants,
        updatedAt: serverTimestamp(),
      });

      return true;
    } catch (error) {
      console.error("Error updating variant image:", error);
      throw error;
    }
  }

  /**
   * Update cell background for a product
   */
  static async updateCellBackground(
    productId,
    backgroundType,
    backgroundColor = null,
    backgroundImageFile = null,
    textColor = null
  ) {
    try {
      const docRef = doc(
        db,
        PREROLLS_COLLECTION,
        "data",
        "products",
        productId
      );
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Product not found");
      }

      const currentData = docSnap.data();
      let updateData = {
        cellBackgroundType: backgroundType,
        updatedAt: serverTimestamp(),
      };

      // Update text color if provided
      if (textColor !== null) {
        updateData.cellTextColor = textColor;
      }

      if (backgroundType === "color") {
        // Set color background
        updateData.cellBackgroundColor = backgroundColor || "#ffffff";

        // Delete background image if exists
        if (currentData.cellBackgroundImagePath) {
          await this.deleteImage(currentData.cellBackgroundImagePath);
          updateData.cellBackgroundImage = "";
          updateData.cellBackgroundImagePath = "";
        }
      } else if (backgroundType === "image" && backgroundImageFile) {
        // Delete old background image if exists
        if (currentData.cellBackgroundImagePath) {
          await this.deleteImage(currentData.cellBackgroundImagePath);
        }

        // Upload new background image
        const imagePath = `prerolls/products/${currentData.quality}_${currentData.strain}/cell_background_${backgroundImageFile.name}`;
        const imageUrl = await this.uploadImage(backgroundImageFile, imagePath);

        updateData.cellBackgroundImage = imageUrl;
        updateData.cellBackgroundImagePath = imagePath;
      }

      await updateDoc(docRef, updateData);
      return true;
    } catch (error) {
      console.error("Error updating cell background:", error);
      throw error;
    }
  }

  /**
   * Delete preroll product
   */
  static async deletePrerollProduct(id) {
    try {
      const docRef = doc(db, PREROLLS_COLLECTION, "data", "products", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Delete image if exists
        if (data.imagePath) {
          await this.deleteImage(data.imagePath);
        }
      }

      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting preroll product:", error);
      throw error;
    }
  }

  /**
   * Upload image to Firebase Storage
   */
  static async uploadImage(file, path) {
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  /**
   * Delete image from Firebase Storage
   */
  static async deleteImage(path) {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error("Error deleting image:", error);
      // Don't throw error if image doesn't exist
    }
  }

  /**
   * Delete background image from configuration (storage + firestore fields)
   */
  static async deleteBackgroundImage() {
    try {
      const docRef = doc(db, PREROLLS_COLLECTION, PREROLLS_CONFIG_DOC);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.backgroundImagePath) {
          await this.deleteImage(data.backgroundImagePath);
        }
        await updateDoc(docRef, {
          backgroundImage: "",
          backgroundImagePath: "",
          updatedAt: serverTimestamp(),
        });
      }

      return true;
    } catch (error) {
      console.error("Error deleting background image:", error);
      throw error;
    }
  }

  /**
   * Initialize default data (call this once to populate initial data)
   * Creates all 9 products (3 qualities × 3 strains) with default prices
   */
  static async initializeDefaultData() {
    try {
      const defaultQualities = ["outdoor", "indoor", "top"];
      const defaultStrains = ["sativa", "hybrid", "indica"];

      // Default prices for each quality level
      const qualityPrices = {
        outdoor: { small: 100, normal: 150, king: 200 },
        indoor: { small: 150, normal: 200, king: 250 },
        top: { small: 200, normal: 250, king: 300 },
      };

      // Create all 9 products (quality × strain combinations)
      for (const quality of defaultQualities) {
        for (const strain of defaultStrains) {
          // Special naming for "top" quality images
          let imageQuality = quality;
          let imageStrain = strain;

          if (quality === "top" && strain === "hybrid") {
            // top hybrid uses uppercase HYBRID in filename
            imageStrain = "HYBRID";
          }

          const productData = {
            quality: quality,
            strain: strain,
            mainImage: `/Product/${imageQuality} ${imageStrain} king.png`, // Use king size as default main image
            mainImagePath: "",
            cellBackgroundType: "color", // "color" or "image"
            cellBackgroundColor: "#ffffff", // White by default
            cellBackgroundImage: "",
            cellBackgroundImagePath: "",
            cellTextColor: "#000000", // Black text by default
            variants: {
              small: {
                price: qualityPrices[quality].small,
                // Top quality products don't have small size images, use normal as fallback
                image:
                  quality === "top"
                    ? `/Product/${imageQuality} ${imageStrain} normal.png`
                    : `/Product/${imageQuality} ${imageStrain} small.png`,
                imagePath: "",
              },
              normal: {
                price: qualityPrices[quality].normal,
                image: `/Product/${imageQuality} ${imageStrain} normal.png`,
                imagePath: "",
              },
              king: {
                price: qualityPrices[quality].king,
                image: `/Product/${imageQuality} ${imageStrain} king.png`,
                imagePath: "",
              },
            },
            isActive: true,
          };

          await this.createPrerollProduct(productData, null);
          console.log(`✅ Created product: ${quality} ${strain}`);
        }
      }

      // Create default configuration
      await this.updateConfiguration({
        backgroundType: "image",
        backgroundColor: "#ffffff",
        backgroundImage: "/background.jpg",
        backgroundFit: "cover",
        isActive: true,
      });

      console.log("✅ Default prerolls data initialized - 9 products created");
      return true;
    } catch (error) {
      console.error("Error initializing default data:", error);
      throw error;
    }
  }

  /**
   * Reset all prerolls data - deletes all existing products and recreates defaults
   */
  static async resetToDefaultData() {
    try {
      console.log("🔄 Resetting prerolls data...");

      // Get all existing products
      const existingProducts = await this.getAllPrerolls();

      // Delete all existing products
      console.log(`Deleting ${existingProducts.length} existing products...`);
      for (const product of existingProducts) {
        await this.deletePrerollProduct(product.id);
        console.log(`✅ Deleted product: ${product.quality} ${product.strain}`);
      }

      // Now initialize fresh data
      await this.initializeDefaultData();

      console.log("✅ All data reset to default successfully!");
      return true;
    } catch (error) {
      console.error("Error resetting to default data:", error);
      throw error;
    }
  }
}
