import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  deleteDoc,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export class StockService {
  static async addStockIn(stockData) {
    try {
      const docRef = await addDoc(collection(db, 'StockManagement'), {
        ...stockData,
        type: 'stock_in',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log('Stock in added with ID: ', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding stock in: ', error);
      throw error;
    }
  }

  static async getAllStockMovements() {
    try {
      const q = query(
        collection(db, 'StockManagement'), 
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const movements = [];
      
      querySnapshot.forEach((doc) => {
        movements.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });
      
      return movements;
    } catch (error) {
      console.error('Error getting stock movements: ', error);
      throw error;
    }
  }

  static async getStockMovementsByProduct(productId) {
    try {
      const q = query(
        collection(db, 'StockManagement'),
        where('products.productId', '==', productId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const movements = [];
      
      querySnapshot.forEach((doc) => {
        movements.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        });
      });
      
      return movements;
    } catch (error) {
      console.error('Error getting stock movements by product: ', error);
      throw error;
    }
  }

  static async updateStockMovement(movementId, updateData) {
    try {
      const movementRef = doc(db, 'StockManagement', movementId);
      await updateDoc(movementRef, {
        ...updateData,
        updatedAt: Timestamp.now()
      });
      
      console.log('Stock movement updated successfully');
    } catch (error) {
      console.error('Error updating stock movement: ', error);
      throw error;
    }
  }

  static async deleteStockMovement(movementId) {
    try {
      await deleteDoc(doc(db, 'StockManagement', movementId));
      console.log('Stock movement deleted successfully');
    } catch (error) {
      console.error('Error deleting stock movement: ', error);
      throw error;
    }
  }

  static async getStockSummary() {
    try {
      const movements = await this.getAllStockMovements();
      const stockSummary = {};

      movements.forEach(movement => {
        if (movement.products && Array.isArray(movement.products)) {
          movement.products.forEach(product => {
            if (!stockSummary[product.productId]) {
              stockSummary[product.productId] = {
                productId: product.productId,
                productName: product.productName,
                totalStockIn: 0,
                totalStockOut: 0,
                currentStock: 0,
                averageBuyPrice: 0,
                totalValue: 0
              };
            }

            if (movement.type === 'stock_in') {
              stockSummary[product.productId].totalStockIn += product.quantity || 0;
              stockSummary[product.productId].currentStock += product.quantity || 0;
              // Calculate weighted average buy price
              const currentTotal = stockSummary[product.productId].averageBuyPrice * stockSummary[product.productId].totalStockIn;
              const newTotal = currentTotal + (product.buyPrice * product.quantity);
              stockSummary[product.productId].averageBuyPrice = newTotal / stockSummary[product.productId].totalStockIn;
            } else if (movement.type === 'stock_out') {
              stockSummary[product.productId].totalStockOut += product.quantity || 0;
              stockSummary[product.productId].currentStock -= product.quantity || 0;
            }

            stockSummary[product.productId].totalValue = 
              stockSummary[product.productId].currentStock * stockSummary[product.productId].averageBuyPrice;
          });
        }
      });

      return Object.values(stockSummary);
    } catch (error) {
      console.error('Error getting stock summary: ', error);
      throw error;
    }
  }
}