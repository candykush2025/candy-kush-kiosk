"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  CustomerService,
  calculateTier,
} from "../../../../lib/customerService";
import { ProductService } from "../../../../lib/productService";

export default function Products() {
  const [customer, setCustomer] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [currentVariantStep, setCurrentVariantStep] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const { categoryId, subcategoryId } = useParams();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get customer info from session storage
        const customerCode = sessionStorage.getItem("customerCode");
        if (customerCode) {
          const customerData = await CustomerService.getCustomerByMemberId(
            customerCode
          );
          if (customerData) {
            // Calculate tier if not present
            if (!customerData.tier) {
              customerData.tier = calculateTier(customerData.points || 0);
            }
            // Calculate total points from transactions array
            customerData.totalPoints = CustomerService.calculateTotalPoints(
              customerData.points
            );
            setCustomer(customerData);
          }
        } else {
          // No customer data, redirect to scanner
          router.push("/scanner");
          return;
        }

        // Load products from Firebase
        console.log("🔍 Loading products for subcategoryId:", subcategoryId);
        const productsData = await ProductService.getProductsBySubcategory(
          subcategoryId
        );
        console.log("📦 Products data received:", productsData);

        setProducts(productsData);

        // Load cart from session storage
        const savedCart = sessionStorage.getItem("cart");
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId && subcategoryId) {
      loadData();
    }
  }, [router, categoryId, subcategoryId]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSelectedVariants({});
    setCurrentVariantStep(0);

    // Check if product has variants
    if (product.variants && product.variants.length > 0) {
      // Open modal for variant selection
      setIsModalOpen(true);
    } else {
      // Add directly to cart
      addToCart(product, {}, 1);
    }
  };

  const addToCart = (product, variants, qty) => {
    const cartItem = {
      id: `${product.id}_${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: getSelectedPrice(product, variants),
      quantity: qty,
      variants: variants,
      image: product.mainImage || product.image,
      categoryId: categoryId, // Add categoryId for cashback calculation
      subcategoryId: subcategoryId,
    };

    const newCart = [...cart, cartItem];
    setCart(newCart);
    sessionStorage.setItem("cart", JSON.stringify(newCart));

    // Show success message or close modal
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const getSelectedPrice = (product, variants) => {
    if (product.variants && Object.keys(variants).length > 0) {
      // Find the price based on selected variants
      for (const variant of product.variants) {
        const selectedOption = variants[variant.variantName];
        if (selectedOption && variant.options) {
          const option = variant.options.find(
            (opt) => opt.name === selectedOption
          );
          if (option && option.price) {
            return option.price;
          }
        }
      }
    }
    return product.price || 0;
  };

  // Helper function to get the current variant image
  const getCurrentVariantImage = (product, variants) => {
    if (product.variants && Object.keys(variants).length > 0) {
      // Find the image based on selected variants
      for (const variant of product.variants) {
        const selectedOption = variants[variant.variantName];
        if (selectedOption && variant.options) {
          const option = variant.options.find(
            (opt) => opt.name === selectedOption
          );
          if (option && option.image) {
            return option.image;
          }
        }
      }
    }
    // Fallback to product main image
    return product.mainImage || product.image;
  };

  const handleVariantSelect = (variantName, optionName) => {
    const newSelectedVariants = {
      ...selectedVariants,
      [variantName]: optionName,
    };
    setSelectedVariants(newSelectedVariants);

    // Move to next variant step or add to cart if this is the last variant
    if (
      selectedProduct.variants &&
      currentVariantStep < selectedProduct.variants.length - 1
    ) {
      setCurrentVariantStep(currentVariantStep + 1);
    } else {
      // This is the last variant, check if all variants are now selected
      const allVariantsSelected = selectedProduct.variants.every(
        (variant) => newSelectedVariants[variant.variantName]
      );

      if (allVariantsSelected) {
        // Automatically add to cart with quantity 1
        addToCart(selectedProduct, newSelectedVariants, 1);
      }
    }
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      // Check if all variants are selected
      const allVariantsSelected = selectedProduct.variants.every(
        (variant) => selectedVariants[variant.variantName]
      );

      if (allVariantsSelected) {
        addToCart(selectedProduct, selectedVariants, quantity);
      }
    }
  };

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  // Get quantity of a specific product in cart (only for products without variants)
  const getCartQuantity = (product) => {
    // Only show quantity for products without variants
    if (product.variants && product.variants.length > 0) {
      return 0; // Don't show quantity controls for products with variants
    }

    const cartItem = cart.find(
      (item) =>
        item.productId === product.id &&
        (!item.variants || Object.keys(item.variants).length === 0)
    );
    return cartItem ? cartItem.quantity : 0;
  };

  // Update quantity of a specific product in cart (only for products without variants)
  const updateCartQuantity = (product, newQuantity) => {
    // Only allow quantity updates for products without variants
    if (product.variants && product.variants.length > 0) {
      return; // Don't allow direct quantity updates for products with variants
    }

    if (newQuantity <= 0) {
      // Remove from cart
      setCart((prevCart) => {
        const newCart = prevCart.filter(
          (item) =>
            item.productId === product.id &&
            (!item.variants || Object.keys(item.variants).length === 0)
        );
        sessionStorage.setItem("cart", JSON.stringify(newCart));
        return newCart;
      });
    } else {
      const existingItemIndex = cart.findIndex(
        (item) =>
          item.productId === product.id &&
          (!item.variants || Object.keys(item.variants).length === 0)
      );
      if (existingItemIndex >= 0) {
        // Update existing item
        setCart((prevCart) => {
          const newCart = [...prevCart];
          newCart[existingItemIndex] = {
            ...newCart[existingItemIndex],
            quantity: newQuantity,
          };
          sessionStorage.setItem("cart", JSON.stringify(newCart));
          return newCart;
        });
      } else {
        // Add new item to cart
        const cartItem = {
          id: `${product.id}_${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: newQuantity,
          variants: {},
          image: product.mainImage || product.image,
          categoryId: categoryId, // Add categoryId for cashback calculation
          subcategoryId: subcategoryId,
        };
        setCart((prevCart) => {
          const newCart = [...prevCart, cartItem];
          sessionStorage.setItem("cart", JSON.stringify(newCart));
          return newCart;
        });
      }
    }
  };

  const handleBack = () => {
    // Go back to subcategories
    router.push(`/subcategories/${categoryId}`);
  };

  const handleCheckout = () => {
    if (cart.length > 0) {
      // Save cart to session storage
      sessionStorage.setItem("cart", JSON.stringify(cart));
      router.push("/checkout");
    }
  };

  const getCartTotalQuantity = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  // Helper function to get price range for products with variants
  const getProductPriceDisplay = (product) => {
    if (product.variants && product.variants.length > 0) {
      // Get all variant option prices
      const prices = [];
      product.variants.forEach((variant) => {
        if (variant.options) {
          variant.options.forEach((option) => {
            if (option.price && option.price > 0) {
              prices.push(option.price);
            }
          });
        }
      });

      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        if (minPrice === maxPrice) {
          return `฿${minPrice.toLocaleString()}`;
        } else {
          return `฿${minPrice.toLocaleString()} - ฿${maxPrice.toLocaleString()}`;
        }
      }
    }

    // Fallback to product base price
    if (product.price && product.price > 0) {
      return `฿${product.price.toLocaleString()}`;
    }

    return "Price varies";
  };

  if (!customer || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">
            {loading
              ? "Loading products..."
              : "Loading customer information..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Select Products</h1>
          <button
            onClick={handleCheckout}
            className="relative bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-bold transition-colors flex items-center"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                {getCartTotalQuantity()}
              </span>
            )}
          </button>
        </div>

        {/* Customer Info Section */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 m-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                Welcome, {customer.name}!
              </h2>
              <p className="text-green-100 mb-2">
                Member ID: {customer.customerId}
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-green-100 text-sm">Points Balance</p>
                <p className="text-3xl font-bold">
                  {(customer.totalPoints || 0).toLocaleString()}
                </p>
                <p className="text-green-100 text-sm">pts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-6">
          <div className="grid gap-6 max-w-2xl mx-auto">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">No products found</p>
                <p className="text-gray-500 mt-2">
                  This subcategory may not have products yet.
                </p>
              </div>
            ) : (
              products.map((product) => {
                const cartQuantity = getCartQuantity(product);
                const hasVariants =
                  product.variants && product.variants.length > 0;
                return (
                  <div
                    key={product.id}
                    className="bg-white border-2 border-gray-200 hover:border-green-500 
                    rounded-lg p-6 transition-all duration-200 transform hover:scale-105 
                    shadow-lg hover:shadow-xl relative overflow-hidden"
                    style={{
                      backgroundImage: product.backgroundImage
                        ? `url(${product.backgroundImage})`
                        : "none",
                      backgroundSize: product.backgroundImage
                        ? product.backgroundFit || "contain"
                        : "auto",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    {/* Overlay for better text readability when background image is present */}
                    {product.backgroundImage && (
                      <div className="absolute inset-0 bg-white/30 rounded-lg"></div>
                    )}
                    <div className="flex items-center space-x-2 relative z-10">
                      {product.mainImage || product.image ? (
                        // Use uploaded product image - updated for proper fit
                        <div className="w-24 h-24 relative overflow-hidden rounded-lg bg-gray-100">
                          <Image
                            src={product.mainImage || product.image}
                            alt={product.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        // Empty space to maintain layout consistency
                        <div className="w-24 h-24"></div>
                      )}
                      <button
                        onClick={() => handleProductSelect(product)}
                        className="flex-1 text-left"
                      >
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-gray-600 text-sm mb-2 leading-relaxed">
                            {product.description}
                          </p>
                        )}
                        <p className="text-green-600 font-bold text-lg">
                          {getProductPriceDisplay(product)}
                        </p>
                      </button>
                      <div className="flex items-center gap-2">
                        {!hasVariants && cartQuantity > 0 ? (
                          <>
                            <button
                              onClick={() =>
                                updateCartQuantity(product, cartQuantity - 1)
                              }
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-semibold text-gray-700">
                              {cartQuantity}
                            </span>
                            <button
                              onClick={() =>
                                updateCartQuantity(product, cartQuantity + 1)
                              }
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
                            >
                              +
                            </button>
                          </>
                        ) : (
                          <div className="text-gray-400">
                            <svg
                              className="w-8 h-8"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Variant Selection Modal */}
        {isModalOpen && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 m-4 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedProduct.name}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Product Image */}
              {getCurrentVariantImage(selectedProduct, selectedVariants) && (
                <div className="w-full aspect-square relative overflow-hidden rounded-lg bg-gray-100 mb-4">
                  <Image
                    src={getCurrentVariantImage(
                      selectedProduct,
                      selectedVariants
                    )}
                    alt={selectedProduct.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              {/* Current Variant Step */}
              {selectedProduct.variants &&
                selectedProduct.variants[currentVariantStep] && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                      Select{" "}
                      {selectedProduct.variants[currentVariantStep].variantName}
                      :
                    </h3>
                    <div className="grid gap-2">
                      {selectedProduct.variants[
                        currentVariantStep
                      ].options?.map((option) => (
                        <button
                          key={option.name}
                          onClick={() =>
                            handleVariantSelect(
                              selectedProduct.variants[currentVariantStep]
                                .variantName,
                              option.name
                            )
                          }
                          className={`p-3 rounded-lg border-2 text-left transition-colors ${
                            selectedVariants[
                              selectedProduct.variants[currentVariantStep]
                                .variantName
                            ] === option.name
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-green-300"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{option.name}</span>
                            {option.price && Number(option.price) > 0 ? (
                              <span className="text-green-600 font-bold">
                                ฿{Number(option.price).toLocaleString()}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
