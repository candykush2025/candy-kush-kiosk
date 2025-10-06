"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AdminAuthGuard from "../../../components/AdminAuthGuard";
import { ProductService, CategoryService, SubcategoryService } from "../../../lib/productService";

export default function DebugProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [showUnassignedCategory, setShowUnassignedCategory] = useState(false);
  const [showUnassignedSubcategory, setShowUnassignedSubcategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [showStockAlertModal, setShowStockAlertModal] = useState(false);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [selectedProductForAlert, setSelectedProductForAlert] = useState(null);
  const [alertKioskLevel, setAlertKioskLevel] = useState("");
  const [alertAdminLevel, setAlertAdminLevel] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [productsData, categoriesData, subcategoriesData, stockAlertsData] = await Promise.all([
        ProductService.getAllProducts(1000), // Increase limit to get all products
        CategoryService.getAllCategories(),
        SubcategoryService.getAllSubcategories(),
        loadStockAlerts()
      ]);

      setProducts(productsData || []);
      setCategories(categoriesData || []);
      setSubcategories(subcategoriesData || []);
      setStockAlerts(stockAlertsData || []);
    } catch (error) {
      console.error("Error loading debug data:", error);
      setError("Failed to load product data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || "Unknown Category";
  };

  // Helper function to get subcategory name by ID
  const getSubcategoryName = (subcategoryId) => {
    const subcategory = subcategories.find(sub => sub.id === subcategoryId);
    return subcategory?.name || "Unknown Subcategory";
  };

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    // Improved search functionality
    const matchesSearch = !searchTerm || (() => {
      const searchLower = searchTerm.toLowerCase().trim();
      
      // Search in basic product fields
      const name = (product.name || "").toLowerCase();
      const description = (product.description || "").toLowerCase();
      const id = (product.id || "").toLowerCase();
      const productId = (product.productId || "").toLowerCase();
      const sku = (product.sku || "").toLowerCase();
      const notes = (product.notes || "").toLowerCase();
      
      // Search in category and subcategory names
      const categoryName = getCategoryName(product.categoryId).toLowerCase();
      const subcategoryName = getSubcategoryName(product.subcategoryId).toLowerCase();
      
      // Search in variant information
      let variantText = "";
      if (product.variants && Array.isArray(product.variants)) {
        variantText = product.variants.map(variant => {
          const variantName = variant.variantName || variant.name || "";
          const options = variant.options || [];
          const optionNames = options.map(opt => opt.name || "").join(" ");
          return `${variantName} ${optionNames}`;
        }).join(" ").toLowerCase();
      }
      
      // Search in price information
      let priceText = "";
      if (typeof product.price === 'object') {
        priceText = Object.keys(product.price).join(" ").toLowerCase();
      } else {
        priceText = String(product.price || "").toLowerCase();
      }
      
      // Search in THC/CBD values
      const thc = String(product.thc || "").toLowerCase();
      const cbd = String(product.cbd || "").toLowerCase();
      
      // Check if search term matches any field
      return (
        name.includes(searchLower) ||
        description.includes(searchLower) ||
        id.includes(searchLower) ||
        productId.includes(searchLower) ||
        sku.includes(searchLower) ||
        notes.includes(searchLower) ||
        categoryName.includes(searchLower) ||
        subcategoryName.includes(searchLower) ||
        variantText.includes(searchLower) ||
        priceText.includes(searchLower) ||
        thc.includes(searchLower) ||
        cbd.includes(searchLower)
      );
    })();
    
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || product.subcategoryId === selectedSubcategory;
    
    // Filter for unassigned category
    const matchesUnassignedCategory = !showUnassignedCategory || (
      getCategoryName(product.categoryId) === "Unknown Category"
    );
    
    // Filter for unassigned subcategory
    const matchesUnassignedSubcategory = !showUnassignedSubcategory || (
      getSubcategoryName(product.subcategoryId) === "Unknown Subcategory"
    );
    
    return matchesSearch && matchesCategory && matchesSubcategory && matchesUnassignedCategory && matchesUnassignedSubcategory;
  });

  const formatPrice = (price) => {
    if (typeof price === 'object') {
      return Object.entries(price).map(([size, amount]) => 
        `${size}: $${amount}`
      ).join(", ");
    }
    return price ? `$${price}` : "No price";
  };

  const formatVariants = (variants) => {
    if (!variants) return "No variants";
    
    // Handle if variants is not an array
    if (!Array.isArray(variants)) {
      if (typeof variants === 'object') {
        return JSON.stringify(variants);
      }
      return String(variants);
    }
    
    // Handle array of variant objects with Firebase structure
    return variants.map(variant => {
      if (!variant || typeof variant !== 'object') {
        return String(variant);
      }
      
      // Extract variant information from Firebase structure
      const variantName = variant.variantName || variant.name || variant.type || "Unknown";
      const options = variant.options || [];
      
      if (Array.isArray(options)) {
        // Format options with name and price
        const optionsList = options.map(option => {
          if (option && typeof option === 'object') {
            const name = option.name || "Unknown";
            const price = option.price ? `$${option.price}` : "";
            const memberPrice = option.memberPrice ? ` (Member: $${option.memberPrice})` : "";
            return `${name}${price ? ` - ${price}` : ""}${memberPrice}`;
          }
          return String(option);
        }).join(", ");
        
        return `${variantName}: [${optionsList}]`;
      } else {
        return `${variantName}: No options`;
      }
    }).join(" | ");
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "No date";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    }
    return new Date(timestamp).toLocaleString();
  };

  // Handle updating product category/subcategory
  const handleUpdateProduct = async (productId, field, newValue) => {
    try {
      // Validate the new value - category is required, subcategory is optional
      if (field === 'categoryId' && (!newValue || newValue.trim() === "")) {
        alert("Please select a valid category (category is required)");
        return;
      }

      // Import Firebase functions directly for simple updates
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase');

      // Create update data with only the field we want to change
      // For subcategory, allow empty string (optional field)
      const updateData = {
        [field]: newValue || "", // Use empty string if no value for subcategory
        updatedAt: serverTimestamp()
      };

      // Update the document directly
      const docRef = doc(db, 'products', productId);
      await updateDoc(docRef, updateData);
      
      // Refresh data to show changes
      await loadData();
      setEditingProduct(null);
      setEditingField(null);
      setTempValue("");
      
      console.log(`Successfully updated ${field} to "${newValue || 'empty'}" for product ${productId}`);
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product: " + error.message);
    }
  };

  // Handle deleting product
  const handleDeleteProduct = async (productId) => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    try {
      await ProductService.deleteProduct(productId);
      await loadData(); // Refresh data
      alert("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product: " + error.message);
    }
  };

  // Start editing
  const startEditing = (productId, field, currentValue) => {
    setEditingProduct(productId);
    setEditingField(field);
    // Set current value, but use empty string if undefined/null
    setTempValue(currentValue || "");
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingProduct(null);
    setEditingField(null);
    setTempValue("");
  };

  // Stock Alert Management Functions
  const loadStockAlerts = async () => {
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase');
      
      const alertsRef = collection(db, 'StockAlert');
      const q = query(alertsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const alerts = [];
      querySnapshot.forEach((doc) => {
        alerts.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        });
      });
      
      return alerts;
    } catch (error) {
      console.error("Error loading stock alerts:", error);
      return [];
    }
  };

  const createStockAlert = async () => {
    try {
      if (!selectedProductForAlert || !alertKioskLevel || !alertAdminLevel) {
        alert("Please select a product and set both alert levels");
        return;
      }

      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase');

      const alertData = {
        productId: selectedProductForAlert.id,
        productName: selectedProductForAlert.name,
        alertKioskLevel: parseInt(alertKioskLevel),
        alertAdminLevel: parseInt(alertAdminLevel),
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'StockAlert'), alertData);
      
      // Refresh data
      await loadData();
      
      // Reset form
      setShowStockAlertModal(false);
      setSelectedProductForAlert(null);
      setAlertKioskLevel("");
      setAlertAdminLevel("");
      
      alert("Stock alert created successfully!");
    } catch (error) {
      console.error("Error creating stock alert:", error);
      alert("Failed to create stock alert: " + error.message);
    }
  };

  const deleteStockAlert = async (alertId) => {
    try {
      if (!confirm("Are you sure you want to delete this stock alert?")) {
        return;
      }

      const { doc, deleteDoc } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase');

      await deleteDoc(doc(db, 'StockAlert', alertId));
      await loadData();
      alert("Stock alert deleted successfully!");
    } catch (error) {
      console.error("Error deleting stock alert:", error);
      alert("Failed to delete stock alert: " + error.message);
    }
  };

  // Get stock alert for a product
  const getProductStockAlert = (productId) => {
    return stockAlerts.find(alert => alert.productId === productId && alert.isActive);
  };

  // Get current stock level for a product
  const getCurrentStock = (product) => {
    // Check if product has variants with stock
    if (product.variants && Array.isArray(product.variants)) {
      let totalStock = 0;
      product.variants.forEach(variant => {
        if (variant.options && Array.isArray(variant.options)) {
          variant.options.forEach(option => {
            totalStock += option.quantity || 0;
          });
        }
      });
      return totalStock;
    }
    
    // Return product quantity or 0
    return product.quantity || 0;
  };

  if (loading) {
    return (
      <AdminAuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600">Loading product debug data...</p>
          </div>
        </div>
      </AdminAuthGuard>
    );
  }

  if (error) {
    return (
      <AdminAuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">Error Loading Data</p>
              <p>{error}</p>
              <button 
                onClick={loadData}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </AdminAuthGuard>
    );
  }

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-full mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Product Debug Console</h1>
                <p className="text-gray-600">Comprehensive view of all product data from Firebase</p>
              </div>
              <button
                onClick={() => router.push("/admin")}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Back to Admin
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white shadow-sm border-b p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search by name, description, ID, category, subcategory, variants, THC, CBD..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter */}
            <div>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Subcategories</option>
                {subcategories.map(subcategory => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unassigned Category Filter */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="unassigned-category-filter"
                checked={showUnassignedCategory}
                onChange={(e) => setShowUnassignedCategory(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="unassigned-category-filter" className="ml-2 text-sm text-gray-700">
                No category
              </label>
            </div>

            {/* Unassigned Subcategory Filter */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="unassigned-subcategory-filter"
                checked={showUnassignedSubcategory}
                onChange={(e) => setShowUnassignedSubcategory(e.target.checked)}
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
              />
              <label htmlFor="unassigned-subcategory-filter" className="ml-2 text-sm text-gray-700">
                No subcategory
              </label>
            </div>

            {/* Stats */}
            <div className="text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.length} products
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Refresh Data
            </button>

            {/* Stock Alert Button */}
            <button
              onClick={() => setShowStockAlertModal(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
            >
              Stock Alerts
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="p-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subcategory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Timestamps
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Raw Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      {/* Image */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-16 h-16 relative">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name || "Product"}
                              fill
                              className="rounded-lg object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-500"
                            style={{display: product.imageUrl ? 'none' : 'flex'}}
                          >
                            No Image
                          </div>
                        </div>
                      </td>

                      {/* Product Info */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name || "No Name"}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {product.id}
                          </div>
                          <div className="text-xs text-gray-600 max-w-xs">
                            {product.description || "No description"}
                          </div>
                          {product.thc && (
                            <div className="text-xs text-green-600">
                              THC: {product.thc}%
                            </div>
                          )}
                          {product.cbd && (
                            <div className="text-xs text-blue-600">
                              CBD: {product.cbd}%
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {editingProduct === product.id && editingField === 'categoryId' ? (
                            <div className="space-y-2">
                              <select
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                              >
                                <option value="">Select Category</option>
                                {categories.map(category => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleUpdateProduct(product.id, 'categoryId', tempValue)}
                                  disabled={!tempValue || tempValue.trim() === ""}
                                  className={`px-2 py-1 text-white text-xs rounded ${
                                    !tempValue || tempValue.trim() === ""
                                      ? "bg-gray-400 cursor-not-allowed"
                                      : "bg-green-600 hover:bg-green-700"
                                  }`}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className={`text-sm cursor-pointer ${
                                getCategoryName(product.categoryId) === "Unknown Category" 
                                ? "text-red-600 hover:text-red-800 font-medium" 
                                : "text-gray-900 hover:text-blue-600"
                              }`}
                              onClick={() => startEditing(product.id, 'categoryId', product.categoryId)}
                              title="Click to edit category"
                            >
                              {getCategoryName(product.categoryId)}
                              {getCategoryName(product.categoryId) === "Unknown Category" && (
                                <span className="ml-1 text-xs">(Click to assign)</span>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {product.categoryId || "None"}
                          </div>
                        </div>
                      </td>

                      {/* Subcategory */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {editingProduct === product.id && editingField === 'subcategoryId' ? (
                            <div className="space-y-2">
                              <select
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                              >
                                <option value="">Select Subcategory</option>
                                {subcategories
                                  .filter(sub => !selectedCategory || sub.categoryId === selectedCategory || sub.categoryId === product.categoryId)
                                  .map(subcategory => (
                                  <option key={subcategory.id} value={subcategory.id}>
                                    {subcategory.name}
                                  </option>
                                ))}
                              </select>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleUpdateProduct(product.id, 'subcategoryId', tempValue)}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className={`text-sm cursor-pointer ${
                                getSubcategoryName(product.subcategoryId) === "Unknown Subcategory" 
                                ? "text-red-600 hover:text-red-800 font-medium" 
                                : "text-gray-900 hover:text-blue-600"
                              }`}
                              onClick={() => startEditing(product.id, 'subcategoryId', product.subcategoryId)}
                              title="Click to edit subcategory"
                            >
                              {getSubcategoryName(product.subcategoryId)}
                              {getSubcategoryName(product.subcategoryId) === "Unknown Subcategory" && (
                                <span className="ml-1 text-xs">(Click to assign)</span>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 font-mono">
                            ID: {product.subcategoryId || "None"}
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatPrice(product.price)}
                        </div>
                        {product.originalPrice && (
                          <div className="text-xs text-gray-500 line-through">
                            Original: ${product.originalPrice}
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className={`text-sm ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                            {product.inStock ? 'In Stock' : 'Out of Stock'}
                          </div>
                          
                          {/* Current Stock Level */}
                          <div className="text-xs text-gray-600">
                            Current: {getCurrentStock(product)}
                          </div>
                          
                          {/* Stock Alert Information */}
                          {(() => {
                            const alert = getProductStockAlert(product.id);
                            const currentStock = getCurrentStock(product);
                            
                            if (alert) {
                              const isKioskAlert = currentStock <= alert.alertKioskLevel;
                              const isAdminAlert = currentStock <= alert.alertAdminLevel;
                              
                              return (
                                <div className="space-y-1">
                                  <div className="text-xs">
                                    <span className={`inline-block px-2 py-1 rounded text-white ${
                                      isKioskAlert ? 'bg-red-500' : 'bg-green-500'
                                    }`}>
                                      Kiosk: {alert.alertKioskLevel}
                                    </span>
                                  </div>
                                  <div className="text-xs">
                                    <span className={`inline-block px-2 py-1 rounded text-white ${
                                      isAdminAlert ? 'bg-red-500' : 'bg-green-500'
                                    }`}>
                                      Admin: {alert.alertAdminLevel}
                                    </span>
                                  </div>
                                  {(isKioskAlert || isAdminAlert) && (
                                    <div className="text-xs text-red-600 font-medium">
                                      ⚠️ Alert Active
                                    </div>
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <div className="text-xs text-gray-400">
                                  No alerts set
                                </div>
                              );
                            }
                          })()}
                          
                          {/* Legacy stock info */}
                          {product.quantity !== undefined && (
                            <div className="text-xs text-gray-500">
                              Legacy Qty: {product.quantity}
                            </div>
                          )}
                          {product.lowStockThreshold && (
                            <div className="text-xs text-orange-600">
                              Old Threshold: {product.lowStockThreshold}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Variants */}
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600 max-w-xs">
                          {formatVariants(product.variants)}
                        </div>
                      </td>

                      {/* Status & Timestamps */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.active ? 'Active' : 'Inactive'}
                          </div>
                          {product.featured && (
                            <div className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 ml-1">
                              Featured
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            Created: {formatTimestamp(product.createdAt)}
                          </div>
                          {product.updatedAt && (
                            <div className="text-xs text-gray-500">
                              Updated: {formatTimestamp(product.updatedAt)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Raw Data */}
                      <td className="px-6 py-4">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            View JSON
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-w-xs max-h-32">
                            {JSON.stringify(product, null, 2)}
                          </pre>
                        </details>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            title="Delete product"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          
                          {/* Quick assign buttons for unassigned items */}
                          {getCategoryName(product.categoryId) === "Unknown Category" && (
                            <button
                              onClick={() => startEditing(product.id, 'categoryId', product.categoryId)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                              title="Assign category"
                            >
                              Cat
                            </button>
                          )}
                          
                          {getSubcategoryName(product.subcategoryId) === "Unknown Subcategory" && (
                            <button
                              onClick={() => startEditing(product.id, 'subcategoryId', product.subcategoryId)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                              title="Assign subcategory"
                            >
                              Sub
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {products.length === 0 ? 
                  "No products found in the database." : 
                  "No products match your search criteria."
                }
              </div>
            </div>
          )}
        </div>

        {/* Stock Alert Modal */}
        {showStockAlertModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Stock Alert Management</h3>
                  <button
                    onClick={() => setShowStockAlertModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Create New Alert Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Create New Stock Alert</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Product Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Product
                      </label>
                      <select
                        value={selectedProductForAlert?.id || ""}
                        onChange={(e) => {
                          const product = products.find(p => p.id === e.target.value);
                          setSelectedProductForAlert(product);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="">Choose a product...</option>
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name || `Product ${product.id}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Kiosk Alert Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alert at Kiosk (qty)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={alertKioskLevel}
                        onChange={(e) => setAlertKioskLevel(e.target.value)}
                        placeholder="e.g., 5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>

                    {/* Admin Alert Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alert at Admin (qty)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={alertAdminLevel}
                        onChange={(e) => setAlertAdminLevel(e.target.value)}
                        placeholder="e.g., 2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>

                    {/* Create Button */}
                    <div className="flex items-end">
                      <button
                        onClick={createStockAlert}
                        disabled={!selectedProductForAlert || !alertKioskLevel || !alertAdminLevel}
                        className={`w-full px-4 py-2 text-white text-sm font-medium rounded-md ${
                          !selectedProductForAlert || !alertKioskLevel || !alertAdminLevel
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-yellow-600 hover:bg-yellow-700"
                        }`}
                      >
                        Create Alert
                      </button>
                    </div>
                  </div>

                  {/* Current Stock Display */}
                  {selectedProductForAlert && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Current Stock:</strong> {getCurrentStock(selectedProductForAlert)} units
                      </p>
                    </div>
                  )}
                </div>

                {/* Existing Alerts List */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Existing Stock Alerts ({stockAlerts.length})
                  </h4>
                  
                  {stockAlerts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No stock alerts configured yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Product
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Current Stock
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kiosk Alert
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Admin Alert
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stockAlerts.map((alert) => {
                            const product = products.find(p => p.id === alert.productId);
                            const currentStock = product ? getCurrentStock(product) : 0;
                            const isKioskAlert = currentStock <= alert.alertKioskLevel;
                            const isAdminAlert = currentStock <= alert.alertAdminLevel;
                            
                            return (
                              <tr key={alert.id} className={`${(isKioskAlert || isAdminAlert) ? 'bg-red-50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {alert.productName || 'Unknown Product'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {alert.productId}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className={`text-sm font-medium ${
                                    (isKioskAlert || isAdminAlert) ? 'text-red-600' : 'text-gray-900'
                                  }`}>
                                    {currentStock}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    isKioskAlert ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {alert.alertKioskLevel}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    isAdminAlert ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {alert.alertAdminLevel}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {(isKioskAlert || isAdminAlert) ? (
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                      ⚠️ ALERT
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                      ✅ OK
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <button
                                    onClick={() => deleteStockAlert(alert.id)}
                                    className="text-red-600 hover:text-red-900 text-sm"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowStockAlertModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminAuthGuard>
  );
}