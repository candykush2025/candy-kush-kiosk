import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  where,
  Timestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";

export class StockService {
  static async addStockIn(stockData) {
    try {
      // First, add the stock movement record
      const docRef = await addDoc(collection(db, "StockManagement"), {
        ...stockData,
        type: "stock_in",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Then, update the actual product stock quantities
      for (const product of stockData.products) {
        try {
          const productDocRef = doc(db, "products", product.productId);

          if (product.variantId) {
            // Handle variant stock update
            const [variantId, optionId] = product.variantId.split("-");
            console.log(
              `Updating variant stock for product ${product.productId}, variant ${variantId}, option ${optionId}, quantity +${product.quantity}`
            );

            // Get the current product data to update the specific variant option
            const productDoc = await getDoc(productDocRef);
            if (productDoc.exists()) {
              const productData = productDoc.data();
              const updatedVariants = [...(productData.variants || [])];

              // Find and update the specific variant option
              let variantFound = false;
              let optionFound = false;
              for (let i = 0; i < updatedVariants.length; i++) {
                if (updatedVariants[i].id === variantId) {
                  variantFound = true;
                  const updatedOptions = [
                    ...(updatedVariants[i].options || []),
                  ];
                  for (let j = 0; j < updatedOptions.length; j++) {
                    if (updatedOptions[j].id === optionId) {
                      optionFound = true;
                      const oldQuantity = updatedOptions[j].quantity || 0;
                      const newQuantity = oldQuantity + product.quantity;
                      console.log(
                        `Variant option stock update: ${oldQuantity} + ${product.quantity} = ${newQuantity}`
                      );
                      updatedOptions[j] = {
                        ...updatedOptions[j],
                        quantity: newQuantity,
                      };
                      break;
                    }
                  }
                  updatedVariants[i] = {
                    ...updatedVariants[i],
                    options: updatedOptions,
                  };
                  break;
                }
              }

              if (!variantFound) {
                console.warn(
                  `Variant ${variantId} not found in product ${product.productId}`
                );
              } else if (!optionFound) {
                console.warn(
                  `Option ${optionId} not found in variant ${variantId} of product ${product.productId}`
                );
              }

              // Update the product with the new variants
              await updateDoc(productDocRef, {
                variants: updatedVariants,
                updatedAt: Timestamp.now(),
              });
              console.log(
                `Successfully updated variant stock for product ${product.productId}`
              );
            } else {
              console.warn(`Product ${product.productId} not found`);
            }
          } else {
            // Handle simple product stock update
            console.log(
              `Updating simple product stock for ${product.productId}, quantity +${product.quantity}`
            );
            await updateDoc(productDocRef, {
              quantity: increment(product.quantity),
              updatedAt: Timestamp.now(),
            });
            console.log(
              `Successfully updated simple product stock for ${product.productId}`
            );
          }
        } catch (productError) {
          console.error(
            `Error updating stock for product ${product.productId}:`,
            productError
          );
          // Continue with other products even if one fails
        }
      }

      console.log("Stock in added with ID: ", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error adding stock in: ", error);
      throw error;
    }
  }

  static async getAllStockMovements() {
    try {
      const q = query(
        collection(db, "StockManagement"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const movements = [];

      querySnapshot.forEach((doc) => {
        movements.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        });
      });

      return movements;
    } catch (error) {
      console.error("Error getting stock movements: ", error);
      throw error;
    }
  }

  static async getStockMovementsByProduct(productId) {
    try {
      const q = query(
        collection(db, "StockManagement"),
        where("products.productId", "==", productId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const movements = [];

      querySnapshot.forEach((doc) => {
        movements.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        });
      });

      return movements;
    } catch (error) {
      console.error("Error getting stock movements by product: ", error);
      throw error;
    }
  }

  static async updateStockMovement(movementId, updateData) {
    try {
      const movementRef = doc(db, "StockManagement", movementId);
      await updateDoc(movementRef, {
        ...updateData,
        updatedAt: Timestamp.now(),
      });

      console.log("Stock movement updated successfully");
    } catch (error) {
      console.error("Error updating stock movement: ", error);
      throw error;
    }
  }

  static async deleteStockMovement(movementId) {
    try {
      await deleteDoc(doc(db, "StockManagement", movementId));
      console.log("Stock movement deleted successfully");
    } catch (error) {
      console.error("Error deleting stock movement: ", error);
      throw error;
    }
  }

  static async getStockSummary() {
    try {
      const movements = await this.getAllStockMovements();
      const stockSummary = {};

      movements.forEach((movement) => {
        if (movement.products && Array.isArray(movement.products)) {
          movement.products.forEach((product) => {
            if (!stockSummary[product.productId]) {
              stockSummary[product.productId] = {
                productId: product.productId,
                productName: product.productName,
                totalStockIn: 0,
                totalStockOut: 0,
                currentStock: 0,
                averageBuyPrice: 0,
                totalValue: 0,
              };
            }

            if (movement.type === "stock_in") {
              stockSummary[product.productId].totalStockIn +=
                product.quantity || 0;
              stockSummary[product.productId].currentStock +=
                product.quantity || 0;
              // Calculate weighted average buy price
              const currentTotal =
                stockSummary[product.productId].averageBuyPrice *
                stockSummary[product.productId].totalStockIn;
              const newTotal =
                currentTotal + product.buyPrice * product.quantity;
              stockSummary[product.productId].averageBuyPrice =
                newTotal / stockSummary[product.productId].totalStockIn;
            } else if (movement.type === "stock_out") {
              stockSummary[product.productId].totalStockOut +=
                product.quantity || 0;
              stockSummary[product.productId].currentStock -=
                product.quantity || 0;
            }

            stockSummary[product.productId].totalValue =
              stockSummary[product.productId].currentStock *
              stockSummary[product.productId].averageBuyPrice;
          });
        }
      });

      return Object.values(stockSummary);
    } catch (error) {
      console.error("Error getting stock summary: ", error);
      throw error;
    }
  }

  /**
   * Save Loyverse product link for future reference
   */
  static async saveLoyverseLink(linkData) {
    try {
      const docRef = await addDoc(collection(db, "LoyverseLinks"), {
        ...linkData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log("Loyverse link saved with ID: ", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error saving Loyverse link: ", error);
      throw error;
    }
  }

  /**
   * Get all Loyverse links
   */
  static async getLoyverseLinks() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, "LoyverseLinks"), orderBy("createdAt", "desc"))
      );

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting Loyverse links: ", error);
      throw error;
    }
  }

  /**
   * Get current stock for a product (considering variants)
   */
  static async getCurrentStock(productId, variantId = null) {
    try {
      const productDocRef = doc(db, "products", productId);
      const productDoc = await getDoc(productDocRef);

      if (!productDoc.exists()) {
        return 0;
      }

      const productData = productDoc.data();

      // If no variant specified, return simple product quantity
      if (!variantId) {
        return productData.quantity || 0;
      }

      // If variant specified, find the variant option quantity
      if (productData.variants && Array.isArray(productData.variants)) {
        const [vId, oId] = variantId.split("-");

        for (const variant of productData.variants) {
          if (variant.id === vId && variant.options) {
            for (const option of variant.options) {
              if (option.id === oId) {
                return option.quantity || 0;
              }
            }
          }
        }
      }

      return 0;
    } catch (error) {
      console.error("Error getting current stock: ", error);
      return 0;
    }
  }
}
