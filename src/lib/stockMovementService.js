import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';

class StockMovementService {
  // Add a stock movement record
  static async addStockMovement(movementData) {
    try {
      // Create timestamp from custom date/time if provided, otherwise use current time
      let timestamp;
      if (movementData.customDate && movementData.customTime) {
        const dateTimeString = `${movementData.customDate}T${movementData.customTime}:00`;
        const customDateTime = new Date(dateTimeString);
        timestamp = Timestamp.fromDate(customDateTime);
      } else {
        timestamp = Timestamp.now();
      }

      const movement = {
        productId: movementData.productId,
        productName: movementData.productName || '',
        variantId: movementData.variantId || '',
        variantName: movementData.variantName || '',
        quantity: parseInt(movementData.quantity),
        price: parseFloat(movementData.price),
        supplier: movementData.supplier || '',
        status: movementData.status, // 'purchasing' or 'sales'
        notes: movementData.notes || '',
        createdAt: timestamp,
        createdBy: movementData.createdBy || 'admin'
      };

      const docRef = await addDoc(collection(db, 'StockMovement'), movement);
      console.log('Stock movement added with ID:', docRef.id);
      
      // Update product stock quantity (skip if explicitly disabled)
      if (!movementData.skipStockUpdate) {
        try {
          const productRef = doc(db, 'products', movementData.productId);
          if (movementData.status === 'purchasing') {
            await updateDoc(productRef, {
              quantity: increment(parseInt(movementData.quantity))
            });
            console.log(`Updated product ${movementData.productId} stock: +${movementData.quantity}`);
          } else if (movementData.status === 'sales') {
            await updateDoc(productRef, {
              quantity: increment(-parseInt(movementData.quantity))
            });
            console.log(`Updated product ${movementData.productId} stock: -${movementData.quantity}`);
          }
        } catch (productUpdateError) {
          console.error('Error updating product stock:', productUpdateError);
          // Don't throw here - the stock movement was still recorded
        }
      } else {
        console.log('Skipping product stock update as requested');
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding stock movement:', error);
      throw error;
    }
  }

  // Get all stock movements
  static async getAllStockMovements() {
    try {
      const q = query(
        collection(db, 'StockMovement'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const movements = [];
      snapshot.forEach(doc => {
        movements.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return movements;
    } catch (error) {
      console.error('Error getting stock movements:', error);
      throw error;
    }
  }

  // Get stock movements for a specific product
  static async getProductStockMovements(productId) {
    try {
      const q = query(
        collection(db, 'StockMovement'),
        where('productId', '==', productId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const movements = [];
      snapshot.forEach(doc => {
        movements.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return movements;
    } catch (error) {
      console.error('Error getting product stock movements:', error);
      throw error;
    }
  }

  // Calculate current stock for a product based on movements
  static async calculateProductStock(productId, variantId = null) {
    try {
      let q;
      if (variantId) {
        q = query(
          collection(db, 'StockMovement'),
          where('productId', '==', productId),
          where('variantId', '==', variantId)
        );
      } else {
        q = query(
          collection(db, 'StockMovement'),
          where('productId', '==', productId),
          where('variantId', '==', '')
        );
      }
      
      const snapshot = await getDocs(q);
      let totalStock = 0;
      
      snapshot.forEach(doc => {
        const movement = doc.data();
        if (movement.status === 'purchasing') {
          totalStock += movement.quantity;
        } else if (movement.status === 'sales') {
          totalStock -= movement.quantity;
        }
      });
      
      return Math.max(0, totalStock); // Don't allow negative stock
    } catch (error) {
      console.error('Error calculating product stock:', error);
      throw error;
    }
  }

  // Get stock summary for all products
  static async getStockSummary() {
    try {
      const movements = await this.getAllStockMovements();
      const summary = {};
      
      movements.forEach(movement => {
        const key = movement.variantId ? 
          `${movement.productId}-${movement.variantId}` : 
          movement.productId;
          
        if (!summary[key]) {
          summary[key] = {
            productId: movement.productId,
            productName: movement.productName,
            variantId: movement.variantId,
            variantName: movement.variantName,
            totalStock: 0,
            totalPurchased: 0,
            totalSold: 0
          };
        }
        
        if (movement.status === 'purchasing') {
          summary[key].totalStock += movement.quantity;
          summary[key].totalPurchased += movement.quantity;
        } else if (movement.status === 'sales') {
          summary[key].totalStock -= movement.quantity;
          summary[key].totalSold += movement.quantity;
        }
      });
      
      // Ensure no negative stock
      Object.keys(summary).forEach(key => {
        summary[key].totalStock = Math.max(0, summary[key].totalStock);
      });
      
      return summary;
    } catch (error) {
      console.error('Error getting stock summary:', error);
      throw error;
    }
  }

  // Add purchasing movement (stock in)
  static async addPurchasing(purchasingData) {
    try {
      // Create timestamp for the purchase
      let timestamp;
      if (purchasingData.date && purchasingData.time) {
        const dateTimeString = `${purchasingData.date}T${purchasingData.time}:00`;
        const customDateTime = new Date(dateTimeString);
        timestamp = Timestamp.fromDate(customDateTime);
      } else {
        timestamp = Timestamp.now();
      }

      // 1. Create the main StockPurchasing record
      const stockPurchasingData = {
        supplier: purchasingData.supplier,
        notes: purchasingData.notes || '',
        totalItems: purchasingData.items.length,
        totalQuantity: purchasingData.items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: purchasingData.items.reduce((sum, item) => sum + (item.quantity * item.buyPrice), 0),
        createdAt: timestamp,
        createdBy: purchasingData.createdBy || 'admin',
        status: 'completed'
      };

      const stockPurchasingRef = await addDoc(collection(db, 'StockPurchasing'), stockPurchasingData);
      console.log('StockPurchasing record created with ID:', stockPurchasingRef.id);

      // 2. Create individual StockMovement records for each item
      const movements = [];
      
      for (const item of purchasingData.items) {
        const movementData = {
          productId: item.productId,
          productName: item.productName,
          variantId: item.variantId,
          variantName: item.variantName,
          quantity: item.quantity,
          price: item.buyPrice,
          supplier: purchasingData.supplier,
          status: 'purchasing',
          notes: purchasingData.notes || `Purchase Order: ${stockPurchasingRef.id}`,
          purchaseOrderId: stockPurchasingRef.id, // Reference to the main purchase order
          createdBy: purchasingData.createdBy || 'admin',
          customDate: purchasingData.date,
          customTime: purchasingData.time
        };
        
        const movementId = await this.addStockMovement(movementData);
        movements.push(movementId);
      }

      return {
        purchaseOrderId: stockPurchasingRef.id,
        movementIds: movements,
        totalItems: stockPurchasingData.totalItems,
        totalAmount: stockPurchasingData.totalAmount
      };
    } catch (error) {
      console.error('Error adding purchasing movements:', error);
      throw error;
    }
  }

  // Add sales movement (stock out) - for future use
  static async addSales(salesData) {
    try {
      const movementData = {
        productId: salesData.productId,
        productName: salesData.productName,
        variantId: salesData.variantId || '',
        variantName: salesData.variantName || '',
        quantity: salesData.quantity,
        price: salesData.price,
        supplier: '', // No supplier for sales
        status: 'sales',
        notes: salesData.notes || `Sale - ${new Date().toLocaleDateString()}`,
        createdBy: salesData.createdBy || 'system'
      };
      
      const movementId = await this.addStockMovement(movementData);
      return movementId;
    } catch (error) {
      console.error('Error adding sales movement:', error);
      throw error;
    }
  }

  // Get all stock purchasing records
  static async getAllStockPurchasing() {
    try {
      const q = query(
        collection(db, 'StockPurchasing'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const purchases = [];
      snapshot.forEach(doc => {
        purchases.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return purchases;
    } catch (error) {
      console.error('Error getting stock purchasing records:', error);
      throw error;
    }
  }

  // Get stock movements for a specific purchase order
  static async getStockMovementsByPurchaseOrder(purchaseOrderId) {
    try {
      const q = query(
        collection(db, 'StockMovement'),
        where('purchaseOrderId', '==', purchaseOrderId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const movements = [];
      snapshot.forEach(doc => {
        movements.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return movements;
    } catch (error) {
      console.error('Error getting stock movements by purchase order:', error);
      throw error;
    }
  }

  // Add stock out movement (manual adjustment)
  static async addStockOut(stockOutData) {
    try {
      const movements = [];
      
      for (const item of stockOutData.items) {
        const movementData = {
          productId: item.productId,
          productName: item.productName,
          variantId: item.variantId,
          variantName: item.variantName,
          quantity: item.quantity,
          price: 0, // No price for stock out adjustments
          supplier: '', // No supplier for stock out
          status: 'stock_out',
          notes: stockOutData.notes || `Manual stock adjustment - ${new Date().toLocaleDateString()}`,
          createdBy: stockOutData.createdBy || 'admin'
        };
        
        const movementId = await this.addStockMovement(movementData);
        movements.push(movementId);
      }
      
      return movements;
    } catch (error) {
      console.error('Error adding stock out movements:', error);
      throw error;
    }
  }
}

export default StockMovementService;