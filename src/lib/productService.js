// Product management service using Firestore and Firebase Storage
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
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "./firebase";

// Collection names
const CATEGORIES_COLLECTION = "categories";
const SUBCATEGORIES_COLLECTION = "subcategories";
const PRODUCTS_COLLECTION = "products";

// Category Service
export class CategoryService {
  // Upload image to Firebase Storage
  static async uploadImage(file, path) {
    try {
      const imageRef = ref(storage, path);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  // Delete image from Firebase Storage
  static async deleteImage(imagePath) {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      console.error("Error deleting image:", error);
      // Don't throw error as image might not exist
    }
  }

  // Generate next category ID
  static async generateCategoryId() {
    try {
      const categoriesSnapshot = await getDocs(
        collection(db, CATEGORIES_COLLECTION)
      );
      const categoryCount = categoriesSnapshot.size + 1;
      return `CAT-${categoryCount.toString().padStart(3, "0")}`;
    } catch (error) {
      console.error("Error generating category ID:", error);
      throw error;
    }
  }

  // Create a new category
  static async createCategory(categoryData, imageFile = null) {
    try {
      const categoryId = await this.generateCategoryId();

      let imageUrl = "";
      let imagePath = "";

      if (imageFile) {
        imagePath = `categories/${categoryId}/${imageFile.name}`;
        imageUrl = await this.uploadImage(imageFile, imagePath);
      }

      const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
        categoryId: categoryId,
        name: categoryData.name,
        image: imageUrl,
        imagePath: imagePath,
        isActive:
          categoryData.isActive !== undefined ? categoryData.isActive : true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { id: docRef.id, categoryId };
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  // Get all categories
  static async getAllCategories() {
    try {
      const q = query(
        collection(db, CATEGORIES_COLLECTION),
        orderBy("name", "asc")
      );

      const querySnapshot = await getDocs(q);
      const categories = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        categories.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      return categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  // Update category
  static async updateCategory(id, categoryData, imageFile = null) {
    try {
      const docRef = doc(db, CATEGORIES_COLLECTION, id);
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error("Category not found");
      }

      const currentData = currentDoc.data();
      let updateData = {
        name: categoryData.name,
        isActive: categoryData.isActive,
        updatedAt: serverTimestamp(),
      };

      if (imageFile) {
        // Delete old image if exists
        if (currentData.imagePath) {
          await this.deleteImage(currentData.imagePath);
        }

        // Upload new image
        const imagePath = `categories/${currentData.categoryId}/${imageFile.name}`;
        const imageUrl = await this.uploadImage(imageFile, imagePath);

        updateData.image = imageUrl;
        updateData.imagePath = imagePath;
      }

      await updateDoc(docRef, updateData);
      return true;
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  }

  // Delete category
  static async deleteCategory(id) {
    try {
      const docRef = doc(db, CATEGORIES_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Delete image if exists
        if (data.imagePath) {
          await this.deleteImage(data.imagePath);
        }

        await deleteDoc(docRef);
      }

      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  }
}

// Subcategory Service
export class SubcategoryService {
  // Generate next subcategory ID
  static async generateSubcategoryId() {
    try {
      const subcategoriesSnapshot = await getDocs(
        collection(db, SUBCATEGORIES_COLLECTION)
      );
      const subcategoryCount = subcategoriesSnapshot.size + 1;
      return `SUB-${subcategoryCount.toString().padStart(3, "0")}`;
    } catch (error) {
      console.error("Error generating subcategory ID:", error);
      throw error;
    }
  }

  // Create a new subcategory
  static async createSubcategory(subcategoryData, imageFile = null) {
    try {
      const subcategoryId = await this.generateSubcategoryId();

      let imageUrl = "";
      let imagePath = "";

      if (imageFile) {
        imagePath = `subcategories/${subcategoryId}/${imageFile.name}`;
        imageUrl = await CategoryService.uploadImage(imageFile, imagePath);
      }

      const docRef = await addDoc(collection(db, SUBCATEGORIES_COLLECTION), {
        subcategoryId: subcategoryId,
        name: subcategoryData.name,
        categoryId: subcategoryData.categoryId,
        image: imageUrl,
        imagePath: imagePath,
        isActive:
          subcategoryData.isActive !== undefined
            ? subcategoryData.isActive
            : true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { id: docRef.id, subcategoryId };
    } catch (error) {
      console.error("Error creating subcategory:", error);
      throw error;
    }
  }

  // Get all subcategories
  static async getAllSubcategories() {
    try {
      const q = query(
        collection(db, SUBCATEGORIES_COLLECTION),
        orderBy("name", "asc")
      );

      const querySnapshot = await getDocs(q);
      const subcategories = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        subcategories.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      return subcategories;
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      throw error;
    }
  }

  // Get subcategories by category
  static async getSubcategoriesByCategory(categoryId) {
    try {
      console.log(
        "🔎 SubcategoryService: Searching for categoryId:",
        categoryId
      );

      // First, let's try to get all subcategories to debug
      const allSubcategoriesQuery = query(
        collection(db, SUBCATEGORIES_COLLECTION)
      );
      const allSubcategoriesSnapshot = await getDocs(allSubcategoriesQuery);
      console.log(
        "📊 Total subcategories in database:",
        allSubcategoriesSnapshot.size
      );

      allSubcategoriesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(
          "🔍 All subcategory:",
          doc.id,
          "categoryId:",
          data.categoryId,
          "isActive:",
          data.isActive,
          "name:",
          data.name
        );
      });

      // Now try the filtered query
      const q = query(
        collection(db, SUBCATEGORIES_COLLECTION),
        where("categoryId", "==", categoryId)
      );

      const querySnapshot = await getDocs(q);
      console.log("📊 Filtered query snapshot size:", querySnapshot.size);

      const subcategories = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("📄 Filtered document data:", doc.id, data);
        // Filter by isActive manually for now
        if (data.isActive === true) {
          subcategories.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          });
        }
      });

      console.log("✅ Final subcategories array:", subcategories);
      return subcategories;
    } catch (error) {
      console.error("Error fetching subcategories by category:", error);
      throw error;
    }
  }

  // Update subcategory
  static async updateSubcategory(id, subcategoryData, imageFile = null) {
    try {
      const docRef = doc(db, SUBCATEGORIES_COLLECTION, id);
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error("Subcategory not found");
      }

      const currentData = currentDoc.data();
      let updateData = {
        name: subcategoryData.name,
        categoryId: subcategoryData.categoryId,
        isActive: subcategoryData.isActive,
        updatedAt: serverTimestamp(),
      };

      if (imageFile) {
        // Delete old image if exists
        if (currentData.imagePath) {
          await CategoryService.deleteImage(currentData.imagePath);
        }

        // Upload new image
        const imagePath = `subcategories/${currentData.subcategoryId}/${imageFile.name}`;
        const imageUrl = await CategoryService.uploadImage(
          imageFile,
          imagePath
        );

        updateData.image = imageUrl;
        updateData.imagePath = imagePath;
      }

      await updateDoc(docRef, updateData);
      return true;
    } catch (error) {
      console.error("Error updating subcategory:", error);
      throw error;
    }
  }

  // Delete subcategory
  static async deleteSubcategory(id) {
    try {
      const docRef = doc(db, SUBCATEGORIES_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Delete image if exists
        if (data.imagePath) {
          await CategoryService.deleteImage(data.imagePath);
        }

        await deleteDoc(docRef);
      }

      return true;
    } catch (error) {
      console.error("Error deleting subcategory:", error);
      throw error;
    }
  }
}

// Product Service
export class ProductService {
  // Generate next product ID
  static async generateProductId() {
    try {
      const productsSnapshot = await getDocs(
        collection(db, PRODUCTS_COLLECTION)
      );
      const productCount = productsSnapshot.size + 1;
      return `PRD-${productCount.toString().padStart(4, "0")}`;
    } catch (error) {
      console.error("Error generating product ID:", error);
      throw error;
    }
  }

  // Create a new product
  static async createProduct(productData, imageFiles = []) {
    try {
      const productId = await this.generateProductId();

      let images = [];
      let mainImage = "";

      if (imageFiles && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const imagePath = `products/${productId}/${imageFiles[i].name}`;
          const imageUrl = await CategoryService.uploadImage(
            imageFiles[i],
            imagePath
          );

          if (i === 0) {
            mainImage = imageUrl;
          }

          images.push({
            url: imageUrl,
            path: imagePath,
            name: imageFiles[i].name,
          });
        }
      }

      const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
        productId: productId,
        name: productData.name,
        categoryId: productData.categoryId,
        subcategoryId: productData.subcategoryId,

        // Variants structure
        hasVariants: productData.hasVariants || false,
        variants: productData.variants || [],

        // For products without variants
        price: productData.price || 0,

        // Images
        mainImage: mainImage,
        images: images,

        // Common fields
        sku: productData.sku || "",
        isActive:
          productData.isActive !== undefined ? productData.isActive : true,
        isFeatured: productData.isFeatured || false,
        notes: productData.notes || "",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { id: docRef.id, productId };
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  // Get all products
  static async getAllProducts(limitCount = 100) {
    try {
      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        orderBy("name", "asc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const products = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        products.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        });
      });

      return products;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  // Get products by subcategory
  static async getProductsBySubcategory(subcategoryId) {
    try {
      console.log(
        "🔎 ProductService: Searching for subcategoryId:",
        subcategoryId
      );

      // First, let's try to get all products to debug
      const allProductsQuery = query(collection(db, PRODUCTS_COLLECTION));
      const allProductsSnapshot = await getDocs(allProductsQuery);
      console.log("📊 Total products in database:", allProductsSnapshot.size);

      allProductsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(
          "🔍 All product:",
          doc.id,
          "subcategoryId:",
          data.subcategoryId,
          "isActive:",
          data.isActive,
          "name:",
          data.name
        );
      });

      // Now try the filtered query
      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where("subcategoryId", "==", subcategoryId)
      );

      const querySnapshot = await getDocs(q);
      console.log("📊 Filtered query snapshot size:", querySnapshot.size);

      const products = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("📄 Filtered product data:", doc.id, data);
        // Filter by isActive manually for now
        if (data.isActive === true) {
          products.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          });
        }
      });

      console.log("✅ Final products array:", products);
      return products;
    } catch (error) {
      console.error("Error fetching products by subcategory:", error);
      throw error;
    }
  }

  // Get product by ID
  static async getProductById(productId) {
    try {
      console.log("🔎 ProductService: Getting product by ID:", productId);

      const docRef = doc(db, PRODUCTS_COLLECTION, productId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("📦 Product data found:", data);

        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        };
      } else {
        console.log("❌ Product not found with ID:", productId);
        return null;
      }
    } catch (error) {
      console.error("Error fetching product by ID:", error);
      throw error;
    }
  }

  // Update product
  static async updateProduct(id, productData, imageFiles = []) {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, id);
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error("Product not found");
      }

      const currentData = currentDoc.data();
      let updateData = {
        name: productData.name,
        categoryId: productData.categoryId,
        subcategoryId: productData.subcategoryId,
        hasVariants: productData.hasVariants,
        variants: productData.variants,
        price: productData.price,
        sku: productData.sku,
        isActive: productData.isActive,
        isFeatured: productData.isFeatured,
        notes: productData.notes,
        updatedAt: serverTimestamp(),
      };

      if (imageFiles && imageFiles.length > 0) {
        // Delete old images
        if (currentData.images) {
          for (const image of currentData.images) {
            await CategoryService.deleteImage(image.path);
          }
        }

        // Upload new images
        let images = [];
        let mainImage = "";

        for (let i = 0; i < imageFiles.length; i++) {
          const imagePath = `products/${currentData.productId}/${imageFiles[i].name}`;
          const imageUrl = await CategoryService.uploadImage(
            imageFiles[i],
            imagePath
          );

          if (i === 0) {
            mainImage = imageUrl;
          }

          images.push({
            url: imageUrl,
            path: imagePath,
            name: imageFiles[i].name,
          });
        }

        updateData.mainImage = mainImage;
        updateData.images = images;
      }

      await updateDoc(docRef, updateData);
      return true;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  }

  // Delete product
  static async deleteProduct(id) {
    try {
      const docRef = doc(db, PRODUCTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // Delete images if exist
        if (data.images) {
          for (const image of data.images) {
            await CategoryService.deleteImage(image.path);
          }
        }

        await deleteDoc(docRef);
      }

      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  // Get product statistics
  static async getProductStats() {
    try {
      const products = await this.getAllProducts();

      const totalProducts = products.length;
      const activeProducts = products.filter((p) => p.isActive).length;

      return {
        totalProducts,
        activeProducts,
      };
    } catch (error) {
      console.error("Error getting product stats:", error);
      throw error;
    }
  }
}

// Cashback Service
export class CashbackService {
  static COLLECTION_NAME = "cashbackRules";

  // Get all cashback rules
  static async getAllCashbackRules() {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy("categoryName", "asc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting cashback rules:", error);
      throw error;
    }
  }

  // Get cashback rule by category ID
  static async getCashbackRuleByCategory(categoryId) {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where("categoryId", "==", categoryId),
        where("isActive", "==", true)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data(),
        };
      }
      return null;
    } catch (error) {
      console.error("Error getting cashback rule by category:", error);
      throw error;
    }
  }

  // Create new cashback rule
  static async createCashbackRule(cashbackData) {
    try {
      // Check if rule already exists for this category
      const existingRule = await this.getCashbackRuleByCategory(
        cashbackData.categoryId
      );
      if (existingRule) {
        throw new Error("Cashback rule already exists for this category");
      }

      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...cashbackData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating cashback rule:", error);
      throw error;
    }
  }

  // Update cashback rule
  static async updateCashbackRule(ruleId, updates) {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, ruleId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating cashback rule:", error);
      throw error;
    }
  }

  // Delete cashback rule
  static async deleteCashbackRule(ruleId) {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, ruleId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting cashback rule:", error);
      throw error;
    }
  }

  // Toggle cashback rule status
  static async toggleCashbackRuleStatus(ruleId, isActive) {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, ruleId);
      await updateDoc(docRef, {
        isActive,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error toggling cashback rule status:", error);
      throw error;
    }
  }

  // Calculate cashback for a purchase
  static async calculateCashback(categoryId, purchaseAmount) {
    try {
      const rule = await this.getCashbackRuleByCategory(categoryId);
      if (rule && rule.isActive) {
        return (purchaseAmount * rule.percentage) / 100;
      }
      return 0;
    } catch (error) {
      console.error("Error calculating cashback:", error);
      return 0;
    }
  }

  // Get cashback percentage for a category
  static async getCashbackPercentage(categoryId) {
    try {
      const rule = await this.getCashbackRuleByCategory(categoryId);
      if (rule && rule.isActive) {
        return rule.percentage;
      }
      return 0;
    } catch (error) {
      console.error("Error getting cashback percentage:", error);
      return 0;
    }
  }
}
