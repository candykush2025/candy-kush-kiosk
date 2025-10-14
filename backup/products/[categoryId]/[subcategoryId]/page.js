"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  CustomerService,
  calculateTier,
} from "../../../../lib/customerService";
import { ProductService } from "../../../../lib/productService";
import CustomerSection from "../../../../components/CustomerSection";
import KioskHeader from "../../../../components/KioskHeader";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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

        // Preload product images (main/legacy + background + variant option images) before showing UI
        if (
          typeof window !== "undefined" &&
          productsData &&
          productsData.length > 0
        ) {
          const preloadPromises = [];
          productsData.forEach((p) => {
            [p.mainImage || p.image, p.backgroundImage]
              .filter(Boolean)
              .forEach((src) => {
                preloadPromises.push(
                  new Promise((resolve) => {
                    const img = new window.Image();
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                    img.src = src;
                  })
                );
              });
            // Variant option images
            if (p.variants) {
              p.variants.forEach((v) => {
                v.options?.forEach((opt) => {
                  if (opt.image) {
                    preloadPromises.push(
                      new Promise((resolve) => {
                        const img = new window.Image();
                        img.onload = () => resolve();
                        img.onerror = () => resolve();
                        img.src = opt.image;
                      })
                    );
                  }
                });
              });
            }
          });

          // Allow up to 4s fallback so UI isn't blocked too long
          await Promise.race([
            Promise.all(preloadPromises),
            new Promise((resolve) => setTimeout(resolve, 4000)),
          ]);
        }

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

  // (Removed separate skeleton control; products page now mirrors categories/subcategories pattern.)

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
      // Remove from cart (exclude the matching simple product item)
      setCart((prevCart) => {
        const newCart = prevCart.filter(
          (item) =>
            !(
              item.productId === product.id &&
              (!item.variants || Object.keys(item.variants).length === 0)
            )
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

    return t("priceVaries");
  };

  // Full-page skeleton (match categories & subcategories) while loading
  if (loading) {
    return (
      <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
        <div
          className="min-h-screen bg-gray-50 flex flex-col animate-pulse"
          style={{
            backgroundImage: "url(/background.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Header skeleton */}
          <div className="p-4 flex items-center justify-between">
            {/* Back button skeleton */}
            <div className="bg-gray-200 px-5 py-5 rounded-lg">
              <div className="w-12 h-12 bg-gray-300 rounded" />
            </div>
            {/* Logo skeleton */}
            <div className="relative">
              <div className="w-32 h-32 bg-gray-200 rounded-lg" />
            </div>
            {/* Cart button skeleton */}
            <div className="bg-gray-200 px-5 py-5 rounded-lg">
              <div className="w-12 h-12 bg-gray-300 rounded" />
            </div>
          </div>
          {/* Customer card skeleton */}
          <div className="bg-white p-6 m-4 rounded-lg shadow-sm space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-10 w-full bg-gray-100 rounded" />
          </div>
          {/* Products grid skeleton */}
          <div className="flex-1 p-6">
            <div className="grid gap-6 max-w-2xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="border-2 border-gray-200 rounded-lg p-8 shadow-sm bg-white relative overflow-hidden"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <div className="h-6 w-2/3 bg-gray-200 rounded" />
                      <div className="h-4 w-5/6 bg-gray-200 rounded" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded" />
                    </div>
                    <div className="w-8 h-8 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-container min-h-screen bg-white portrait:max-w-md mx-auto">
      <div
        className="min-h-screen bg-gray-50 flex flex-col"
        style={{
          backgroundImage: "url(/background.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Header */}
        <KioskHeader onBack={handleBack} cart={cart} />

        {/* Customer Info Section */}
        <CustomerSection customer={customer} />

        {/* Products Grid */}
        <div className="flex-1 p-6">
          <div className="grid gap-6 max-w-2xl mx-auto">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-gray-600">{t("noProducts")}</p>
                <p className="text-gray-500 mt-2">{t("noProductsDesc")}</p>
              </div>
            ) : (
              products.map((product) => {
                const cartQuantity = getCartQuantity(product);
                const hasVariants =
                  product.variants && product.variants.length > 0;
                return (
                  <div
                    key={product.id}
                    className="bg-white border-2 border-gray-200 hover:border-green-500 rounded-lg p-6 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden"
                    style={{
                      backgroundImage: product.backgroundImage
                        ? `url(${product.backgroundImage})`
                        : "none",
                      backgroundSize: product.backgroundImage
                        ? product.backgroundFit === "stretch"
                          ? "100% 100%"
                          : product.backgroundFit || "contain"
                        : "auto",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    {product.backgroundImage && (
                      <div className="absolute inset-0 bg-white/30 rounded-lg"></div>
                    )}
                    <div className="flex items-center space-x-2 relative z-10">
                      {product.mainImage || product.image ? (
                        <div className="w-24 h-24 relative overflow-hidden rounded-lg">
                          <Image
                            src={product.mainImage || product.image}
                            alt={product.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24"></div>
                      )}
                      <button
                        onClick={() => handleProductSelect(product)}
                        className="flex-1 text-left"
                      >
                        <h3
                          className="text-xl font-bold mb-2"
                          style={{ color: product.textColor || "#000000" }}
                        >
                          {product.name}
                        </h3>
                        {product.description && (
                          <p
                            className="text-sm mb-2 leading-relaxed"
                            style={{ color: product.textColor || "#000000" }}
                          >
                            {product.description}
                          </p>
                        )}
                        <p
                          className="font-bold text-lg"
                          style={{ color: product.textColor || "#000000" }}
                        >
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
                            <span
                              className="w-8 text-center font-semibold"
                              style={{ color: product.textColor || "#000000" }}
                            >
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
                      {t("variantSelect", {
                        variantName:
                          selectedProduct.variants[currentVariantStep]
                            .variantName,
                      })}
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
