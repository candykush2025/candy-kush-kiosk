"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  CustomerService,
  getTierColor,
  calculateTier,
} from "../../../lib/customerService";
import { ProductService } from "../../../lib/productService";

export default function ProductDetails() {
  const [customer, setCustomer] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [currentVariantStep, setCurrentVariantStep] = useState(0);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const router = useRouter();
  const { productId } = useParams();

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
            setCustomer(customerData);
          }
        } else {
          // No customer data, redirect to scanner
          router.push("/scanner");
          return;
        }

        // Load product from Firebase
        console.log("🔍 Loading product with ID:", productId);
        const productData = await ProductService.getProductById(productId);
        console.log("📦 Product data received:", productData);

        setProduct(productData);

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

    if (productId) {
      loadData();
    }
  }, [router, productId]);

  const handleBack = () => {
    // Go back to previous page
    router.back();
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

  const handleAddToCart = () => {
    if (!product) return;

    // Check if product has variants
    if (product.variants && product.variants.length > 0) {
      // Show variant selection modal
      setShowVariantModal(true);
      setCurrentVariantStep(0);
      setSelectedVariants({});
    } else {
      // Add product directly to cart
      addProductToCart();
    }
  };

  const addProductToCart = (variants = null) => {
    const cartItem = {
      id: product.id,
      productId: product.productId,
      name: product.name,
      price: product.price,
      image: product.mainImage || product.image,
      quantity: quantity,
      variants: variants,
      addedAt: new Date().toISOString(),
    };

    const updatedCart = [...cart, cartItem];
    setCart(updatedCart);
    sessionStorage.setItem("cart", JSON.stringify(updatedCart));

    // Show success message or animation
    alert(`Added ${product.name} to cart!`);

    // Close modal if it was open
    setShowVariantModal(false);
  };

  const handleVariantSelection = (variantGroupId, variantOptionId) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [variantGroupId]: variantOptionId,
    }));
  };

  const handleNextVariantStep = () => {
    if (currentVariantStep < product.variants.length - 1) {
      setCurrentVariantStep(currentVariantStep + 1);
    } else {
      // All variants selected, add to cart
      addProductToCart(selectedVariants);
    }
  };

  const handlePrevVariantStep = () => {
    if (currentVariantStep > 0) {
      setCurrentVariantStep(currentVariantStep - 1);
    }
  };

  const isCurrentVariantSelected = () => {
    if (!product.variants || currentVariantStep >= product.variants.length) {
      return false;
    }
    const currentGroup = product.variants[currentVariantStep];
    return selectedVariants[currentGroup.id] !== undefined;
  };

  const getVariantStepText = () => {
    if (!product.variants) return "";
    return `Step ${currentVariantStep + 1} of ${product.variants.length}`;
  };

  const getCurrentVariantGroup = () => {
    if (!product.variants || currentVariantStep >= product.variants.length) {
      return null;
    }
    return product.variants[currentVariantStep];
  };

  if (!customer || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">
            {loading ? "Loading product..." : "Loading customer information..."}
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Product not found</p>
          <button
            onClick={handleBack}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg"
          >
            Go Back
          </button>
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
          <h1 className="text-2xl font-bold text-gray-800">Product Details</h1>
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

        {/* Product Details */}
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            {/* Product Image */}
            <div className="w-full h-64 relative mb-6">
              {product.mainImage || product.image ? (
                <Image
                  src={product.mainImage || product.image}
                  alt={product.name}
                  fill
                  className="object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-6xl">🌿</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                {product.name}
              </h2>
              {product.description && (
                <p className="text-gray-600 text-lg mb-4">
                  {product.description}
                </p>
              )}
              <p className="text-green-600 font-bold text-2xl">
                ฿{(product.price || 0).toLocaleString()}
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-xl font-bold"
                >
                  -
                </button>
                <span className="text-2xl font-bold w-16 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center text-xl font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors duration-200 shadow-lg"
            >
              Add to Cart - ฿
              {((product.price || 0) * quantity).toLocaleString()}
            </button>
          </div>
        </div>

        {/* Variant Selection Modal */}
        {showVariantModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Select Options
                </h3>
                <button
                  onClick={() => setShowVariantModal(false)}
                  className="text-gray-400 hover:text-gray-600"
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

              <p className="text-sm text-gray-500 mb-4">
                {getVariantStepText()}
              </p>

              {getCurrentVariantGroup() && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">
                    {getCurrentVariantGroup().variantName}
                  </h4>
                  <div className="space-y-2">
                    {getCurrentVariantGroup().options?.map((option) => (
                      <button
                        key={option.id}
                        onClick={() =>
                          handleVariantSelection(
                            getCurrentVariantGroup().id,
                            option.id
                          )
                        }
                        className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${
                          selectedVariants[getCurrentVariantGroup().id] ===
                          option.id
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {option.imageUrl && (
                              <div className="w-12 h-12 relative">
                                <Image
                                  src={option.imageUrl}
                                  alt={option.name}
                                  fill
                                  className="object-cover rounded-lg"
                                />
                              </div>
                            )}
                            <span className="font-medium">{option.name}</span>
                          </div>
                          {option.price > 0 && (
                            <span className="text-green-600 font-bold">
                              ฿{option.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Navigation */}
              <div className="flex justify-between">
                <button
                  onClick={handlePrevVariantStep}
                  disabled={currentVariantStep === 0}
                  className={`px-4 py-2 rounded-lg ${
                    currentVariantStep === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-gray-500 hover:bg-gray-600 text-white"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextVariantStep}
                  disabled={!isCurrentVariantSelected()}
                  className={`px-4 py-2 rounded-lg ${
                    !isCurrentVariantSelected()
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                >
                  {currentVariantStep === product.variants.length - 1
                    ? "Add to Cart"
                    : "Next"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
