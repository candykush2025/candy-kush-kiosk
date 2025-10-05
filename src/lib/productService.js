// Product management service using Firestore and Firebase Storage
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
const CATEGORY_ORDER_COLLECTION = "CategoryOrder"; // holds single doc 'current' with array field 'order'

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
  static async createCategory(
    categoryData,
    imageFile = null,
    backgroundImageFile = null
  ) {
    try {
      const categoryId = await this.generateCategoryId();

      let imageUrl = "";
      let imagePath = "";
      let backgroundImageUrl = "";
      let backgroundImagePath = "";

      if (imageFile) {
        imagePath = `categories/${categoryId}/${imageFile.name}`;
        imageUrl = await this.uploadImage(imageFile, imagePath);
      }

      if (backgroundImageFile) {
        backgroundImagePath = `categories/${categoryId}/background_${backgroundImageFile.name}`;
        backgroundImageUrl = await this.uploadImage(
          backgroundImageFile,
          backgroundImagePath
        );
      }

      const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
        categoryId: categoryId,
        name: categoryData.name,
        description: categoryData.description || "",
        textColor: categoryData.textColor || "#000000",
        image: imageUrl,
        imagePath: imagePath,
        backgroundImage: backgroundImageUrl,
        backgroundImagePath: backgroundImagePath,
        backgroundFit: categoryData.backgroundFit || "contain",
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
      // Apply CategoryOrder if exists
      try {
        const orderIds = await this.getCategoryOrder();
        if (orderIds.length) {
          const position = new Map(orderIds.map((id, idx) => [id, idx]));
          categories.sort((a, b) => {
            const pa = position.has(a.id)
              ? position.get(a.id)
              : Number.MAX_SAFE_INTEGER;
            const pb = position.has(b.id)
              ? position.get(b.id)
              : Number.MAX_SAFE_INTEGER;
            if (pa !== pb) return pa - pb;
            return (a.name || "").localeCompare(b.name || "");
          });
        }
      } catch (orderErr) {
        console.warn("CategoryOrder not applied:", orderErr?.message);
      }
      return categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw error;
    }
  }

  // Get saved category order (array of category document ids)
  static async getCategoryOrder() {
    try {
      const orderDoc = await getDoc(
        doc(db, CATEGORY_ORDER_COLLECTION, "current")
      );
      if (!orderDoc.exists()) return [];
      const data = orderDoc.data();
      return Array.isArray(data.order) ? data.order : [];
    } catch (e) {
      console.error("Failed to get category order", e);
      return [];
    }
  }

  // Save category order
  static async saveCategoryOrder(orderIds = []) {
    try {
      const refDoc = doc(db, CATEGORY_ORDER_COLLECTION, "current");
      // Upsert document using setDoc (import add if needed) - reuse updateDoc fallback
      // Prefer setDoc to ensure creation
      const { setDoc } = await import("firebase/firestore");
      await setDoc(
        refDoc,
        { order: orderIds, updatedAt: serverTimestamp() },
        { merge: true }
      );
      return true;
    } catch (e) {
      console.error("Failed to save category order", e);
      throw e;
    }
  }

  // Update category
  static async updateCategory(
    id,
    categoryData,
    imageFile = null,
    backgroundImageFile = null,
    removeExistingImage = false,
    removeExistingBackgroundImage = false
  ) {
    try {
      const docRef = doc(db, CATEGORIES_COLLECTION, id);
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error("Category not found");
      }

      const currentData = currentDoc.data();
      let updateData = {
        name: categoryData.name,
        description: categoryData.description,
        textColor: categoryData.textColor || currentData.textColor || "#000000",
        backgroundFit: categoryData.backgroundFit || "contain",
        isActive: categoryData.isActive,
        updatedAt: serverTimestamp(),
      };

      // Handle main image removal
      if (removeExistingImage && currentData.imagePath) {
        await this.deleteImage(currentData.imagePath);
        updateData.image = null;
        updateData.imagePath = null;
      }
      // Handle new main image upload
      else if (imageFile) {
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

      // Handle background image removal
      if (removeExistingBackgroundImage && currentData.backgroundImagePath) {
        await this.deleteImage(currentData.backgroundImagePath);
        updateData.backgroundImage = "";
        updateData.backgroundImagePath = "";
      }
      // Handle new background image upload
      else if (backgroundImageFile) {
        // Delete old background image if exists
        if (currentData.backgroundImagePath) {
          await this.deleteImage(currentData.backgroundImagePath);
        }

        // Upload new background image
        const backgroundImagePath = `categories/${currentData.categoryId}/background_${backgroundImageFile.name}`;
        const backgroundImageUrl = await this.uploadImage(
          backgroundImageFile,
          backgroundImagePath
        );

        updateData.backgroundImage = backgroundImageUrl;
        updateData.backgroundImagePath = backgroundImagePath;
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
  static async createSubcategory(
    subcategoryData,
    imageFile = null,
    backgroundImageFile = null
  ) {
    try {
      const subcategoryId = await this.generateSubcategoryId();

      let imageUrl = "";
      let imagePath = "";
      let backgroundImageUrl = "";
      let backgroundImagePath = "";

      if (imageFile) {
        imagePath = `subcategories/${subcategoryId}/${imageFile.name}`;
        imageUrl = await CategoryService.uploadImage(imageFile, imagePath);
      }

      if (backgroundImageFile) {
        backgroundImagePath = `subcategories/${subcategoryId}/background_${backgroundImageFile.name}`;
        backgroundImageUrl = await CategoryService.uploadImage(
          backgroundImageFile,
          backgroundImagePath
        );
      }

      const docRef = await addDoc(collection(db, SUBCATEGORIES_COLLECTION), {
        subcategoryId: subcategoryId,
        name: subcategoryData.name,
        description: subcategoryData.description || "",
        categoryId: subcategoryData.categoryId,
        image: imageUrl,
        imagePath: imagePath,
        backgroundImage: backgroundImageUrl,
        backgroundImagePath: backgroundImagePath,
        backgroundFit: subcategoryData.backgroundFit || "contain",
        textColor: subcategoryData.textColor || "#000000",
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
  static async updateSubcategory(
    id,
    subcategoryData,
    imageFile = null,
    backgroundImageFile = null,
    removeExistingImage = false,
    removeExistingBackgroundImage = false
  ) {
    try {
      const docRef = doc(db, SUBCATEGORIES_COLLECTION, id);
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error("Subcategory not found");
      }

      const currentData = currentDoc.data();
      let updateData = {
        name: subcategoryData.name,
        description: subcategoryData.description,
        categoryId: subcategoryData.categoryId,
        backgroundFit: subcategoryData.backgroundFit || "contain",
        textColor:
          subcategoryData.textColor || currentData.textColor || "#000000",
        isActive: subcategoryData.isActive,
        updatedAt: serverTimestamp(),
      };

      // Handle main image removal
      if (removeExistingImage && currentData.imagePath) {
        await CategoryService.deleteImage(currentData.imagePath);
        updateData.image = null;
        updateData.imagePath = null;
      }
      // Handle new main image upload
      else if (imageFile) {
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

      // Handle background image removal
      if (removeExistingBackgroundImage && currentData.backgroundImagePath) {
        await CategoryService.deleteImage(currentData.backgroundImagePath);
        updateData.backgroundImage = "";
        updateData.backgroundImagePath = "";
      }
      // Handle new background image upload
      else if (backgroundImageFile) {
        // Delete old background image if exists
        if (currentData.backgroundImagePath) {
          await CategoryService.deleteImage(currentData.backgroundImagePath);
        }

        // Upload new background image
        const backgroundImagePath = `subcategories/${currentData.subcategoryId}/background_${backgroundImageFile.name}`;
        const backgroundImageUrl = await CategoryService.uploadImage(
          backgroundImageFile,
          backgroundImagePath
        );

        updateData.backgroundImage = backgroundImageUrl;
        updateData.backgroundImagePath = backgroundImagePath;
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
  static async createProduct(
    productData,
    imageFiles = [],
    backgroundImageFile = null
  ) {
    try {
      console.log("ProductService.createProduct called with:", {
        productData: { ...productData },
        imageFilesCount: imageFiles?.length || 0,
        imageFileNames: imageFiles?.map(f => f.name) || [],
        hasBackgroundImage: !!backgroundImageFile
      });
      
      const productId = await this.generateProductId();

      let images = [];
      let mainImage = "";

      if (imageFiles && imageFiles.length > 0) {
        console.log("Processing image files...");
        for (let i = 0; i < imageFiles.length; i++) {
          const imagePath = `products/${productId}/${imageFiles[i].name}`;
          console.log(`Uploading image ${i}: ${imagePath}`);
          
          const imageUrl = await CategoryService.uploadImage(
            imageFiles[i],
            imagePath
          );
          
          console.log(`Image ${i} uploaded successfully: ${imageUrl}`);

          if (i === 0) {
            mainImage = imageUrl;
          }

          images.push({
            url: imageUrl,
            path: imagePath,
            name: imageFiles[i].name,
          });
        }
      } else {
        console.log("No image files to process");
      }

      // Handle background image upload if provided
      let backgroundImageUrl = "";
      if (backgroundImageFile) {
        const bgPath = `products/${productId}/background_${backgroundImageFile.name}`;
        backgroundImageUrl = await CategoryService.uploadImage(
          backgroundImageFile,
          bgPath
        );
      }

      const documentData = {
        productId: productId,
        name: productData.name,
        description: productData.description || "",
        categoryId: productData.categoryId,
        subcategoryId: productData.subcategoryId || null,

        // Variants structure
        hasVariants: productData.hasVariants || false,
        variants: productData.variants || [],

        // For products without variants
        price: productData.price || 0,
        memberPrice: productData.memberPrice || 0,

        // Images
        mainImage: mainImage,
        images: images,

        // Common fields
        sku: productData.sku || "",
        backgroundImage:
          backgroundImageUrl || productData.backgroundImage || "",
        backgroundFit: productData.backgroundFit || "contain",
        textColor: productData.textColor || "#000000",
        isActive:
          productData.isActive !== undefined ? productData.isActive : true,
        isFeatured: productData.isFeatured || false,
        notes: productData.notes || "",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log("Saving product to database with data:", {
        productId: documentData.productId,
        name: documentData.name,
        mainImage: documentData.mainImage,
        imagesCount: documentData.images.length,
        subcategoryId: documentData.subcategoryId,
        categoryId: documentData.categoryId
      });

      const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), documentData);

      console.log("Product saved successfully with ID:", docRef.id, "and main image:", documentData.mainImage);
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
  static async updateProduct(id, productData, imageFiles = [], backgroundImageFile = null, removeMainImages = false) {
    try {
      console.log("ProductService.updateProduct called with:", {
        productId: id,
        productData: { ...productData },
        imageFilesCount: imageFiles?.length || 0,
        imageFileNames: imageFiles?.map(f => f.name) || [],
        hasBackgroundImage: !!backgroundImageFile,
        removeMainImages: removeMainImages
      });

      const docRef = doc(db, PRODUCTS_COLLECTION, id);
      const currentDoc = await getDoc(docRef);

      if (!currentDoc.exists()) {
        throw new Error("Product not found");
      }

      const currentData = currentDoc.data();
      let updateData = {
        name: productData.name,
        description: productData.description || "",
        categoryId: productData.categoryId,
        subcategoryId: productData.subcategoryId,
        hasVariants: productData.hasVariants || false,
        variants: productData.variants || [],
        price: productData.price || 0,
        memberPrice: productData.memberPrice || 0,
        sku: productData.sku || "",
        backgroundImage: productData.backgroundImage || "",
        backgroundFit: productData.backgroundFit || "contain",
        textColor: productData.textColor || currentData.textColor || "#000000",
        isActive:
          productData.isActive !== undefined ? productData.isActive : true,
        isFeatured: productData.isFeatured || false,
        notes: productData.notes || "",
        updatedAt: serverTimestamp(),
      };

      if (imageFiles && imageFiles.length > 0) {
        // Delete old images before uploading new ones
        console.log("Deleting old images before uploading new ones...");
        if (currentData.images && currentData.images.length > 0) {
          for (const image of currentData.images) {
            console.log(`Deleting old image: ${image.path}`);
            try {
              await CategoryService.deleteImage(image.path);
              console.log(`Successfully deleted: ${image.path}`);
            } catch (deleteError) {
              console.warn(`Failed to delete old image ${image.path}:`, deleteError);
            }
          }
        }

        // Upload new images
        let images = [];
        let mainImage = "";

        console.log("Processing main image files for update...");
        for (let i = 0; i < imageFiles.length; i++) {
          const imagePath = `products/${currentData.productId}/${imageFiles[i].name}`;
          console.log(`Uploading main image ${i}: ${imagePath}`);
          
          const imageUrl = await CategoryService.uploadImage(
            imageFiles[i],
            imagePath
          );
          
          console.log(`Main image ${i} uploaded successfully: ${imageUrl}`);

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
        console.log("Main images updated:", { mainImage, imagesCount: images.length });
      } else if (removeMainImages) {
        // User wants to completely remove all main images
        console.log("Removing all main images from product...");
        if (currentData.images && currentData.images.length > 0) {
          for (const image of currentData.images) {
            console.log(`Deleting image for removal: ${image.path}`);
            try {
              await CategoryService.deleteImage(image.path);
              console.log(`Successfully deleted: ${image.path}`);
            } catch (deleteError) {
              console.warn(`Failed to delete image ${image.path}:`, deleteError);
            }
          }
        }
        // Clear the image fields
        updateData.mainImage = "";
        updateData.images = [];
        console.log("All main images removed from product");
      } else {
        console.log("No main image files to update");
      }

      // Handle background image upload if provided
      if (backgroundImageFile) {
        console.log("Processing background image...");
        const bgPath = `products/${currentData.productId}/background_${backgroundImageFile.name}`;
        const backgroundImageUrl = await CategoryService.uploadImage(
          backgroundImageFile,
          bgPath
        );
        updateData.backgroundImage = backgroundImageUrl;
        console.log("Background image uploaded:", backgroundImageUrl);
      }

      console.log("Updating product in database:", {
        productId: id,
        mainImage: updateData.mainImage,
        imagesCount: updateData.images?.length || 0,
        hasBackgroundImage: !!updateData.backgroundImage
      });

      await updateDoc(docRef, updateData);
      
      console.log("✅ Product updated successfully in database:", {
        productId: id,
        mainImage: updateData.mainImage,
        imagesCount: updateData.images?.length || 0
      });
      
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
      console.log(
        "🔍 getCashbackRuleByCategory searching for categoryId:",
        categoryId
      );
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where("categoryId", "==", categoryId),
        where("isActive", "==", true)
      );
      const querySnapshot = await getDocs(q);
      console.log(
        "📊 Query result - number of docs found:",
        querySnapshot.size
      );

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const ruleData = {
          id: doc.id,
          ...doc.data(),
        };
        console.log("✅ Found cashback rule:", ruleData);
        return ruleData;
      } else {
        console.log("❌ No cashback rule found for categoryId:", categoryId);
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
      console.log(
        "🔍 CashbackService.getCashbackPercentage called with categoryId:",
        categoryId
      );
      const rule = await this.getCashbackRuleByCategory(categoryId);
      console.log("📋 Retrieved cashback rule:", rule);

      if (rule && rule.isActive) {
        console.log(
          "✅ Rule is active, returning percentage:",
          rule.percentage
        );
        return rule.percentage;
      } else {
        console.log("❌ No active rule found, details:", {
          ruleExists: !!rule,
          isActive: rule?.isActive,
          percentage: rule?.percentage,
        });
      }
      return 0;
    } catch (error) {
      console.error("Error getting cashback percentage:", error);
      return 0;
    }
  }
}

// Non-Member Categories Service
export class NonMemberCategoriesService {
  static COLLECTION_NAME = "NonMemberCategories";
  static DOC_ID = "current";

  // Get non-member categories (returns array of category IDs)
  static async getNonMemberCategories() {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, this.DOC_ID);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.categories || [];
      } else {
        // Document doesn't exist, return empty array
        return [];
      }
    } catch (error) {
      console.error("Error getting non-member categories:", error);
      return []; // Return empty array on error
    }
  }

  // Update non-member categories (always use setDoc to ensure single document)
  static async updateNonMemberCategories(categoryIds) {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, this.DOC_ID);
      
      // Always use setDoc to ensure we only have one document with ID "current"
      await setDoc(docRef, {
        categories: categoryIds || [],
        updatedAt: serverTimestamp(),
      }, { merge: true }); // Merge to preserve any other fields if they exist
      
      return true;
    } catch (error) {
      console.error("Error updating non-member categories:", error);
      throw error;
    }
  }

  // Helper method to initialize if needed (rarely used)
  static async initializeWithAllCategories(allCategoryIds) {
    try {
      const existing = await this.getNonMemberCategories();
      if (existing.length === 0) {
        await this.updateNonMemberCategories(allCategoryIds);
        return allCategoryIds;
      }
      return existing;
    } catch (error) {
      console.error("Error initializing non-member categories:", error);
      throw error;
    }
  }
}
