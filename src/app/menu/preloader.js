"use client";

import { useEffect } from "react";

/**
 * Preloader component to cache images and assets for offline use
 * This will download all menu images when the page loads
 */
export default function MenuPreloader({ categories, products }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const preloadImages = async () => {
      const imageUrls = [];

      // Collect all category images
      categories.forEach((category) => {
        if (category.imageUrl) {
          imageUrls.push(category.imageUrl);
        }
      });

      // Collect all product images
      products.forEach((product) => {
        if (product.imageUrl) {
          imageUrls.push(product.imageUrl);
        }
        // Also collect variant images if they exist
        if (product.variants) {
          product.variants.forEach((variant) => {
            if (variant.imageUrl) {
              imageUrls.push(variant.imageUrl);
            }
          });
        }
      });

      // Add static assets
      const staticAssets = ["/background.jpg", "/logo.png", "/qrlogo.png"];

      const allAssets = [...new Set([...imageUrls, ...staticAssets])]; // Remove duplicates

      console.log(
        `🚀 Preloading ${allAssets.length} assets for offline use...`
      );

      // Use browser cache API to store images
      if ("caches" in window) {
        try {
          const cache = await caches.open("menu-assets-v1");

          // Preload images in batches to avoid overwhelming the browser
          const batchSize = 5;
          for (let i = 0; i < allAssets.length; i += batchSize) {
            const batch = allAssets.slice(i, i + batchSize);
            await Promise.all(
              batch.map(async (url) => {
                try {
                  // Check if already cached
                  const cachedResponse = await cache.match(url);
                  if (!cachedResponse) {
                    // Fetch and cache the asset
                    const response = await fetch(url);
                    if (response.ok) {
                      await cache.put(url, response);
                      console.log(`✅ Cached: ${url}`);
                    }
                  }
                } catch (error) {
                  console.warn(`⚠️ Failed to cache: ${url}`, error);
                }
              })
            );
          }

          console.log("✅ All assets cached for offline use!");
        } catch (error) {
          console.error("❌ Error caching assets:", error);
        }
      } else {
        // Fallback: Just preload images using Image objects
        allAssets.forEach((url) => {
          const img = new window.Image();
          img.src = url;
        });
        console.log("⚠️ Cache API not supported, using fallback preloading");
      }
    };

    // Start preloading after a short delay to not block initial render
    const timeout = setTimeout(() => {
      preloadImages();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [categories, products]);

  return null; // This component doesn't render anything
}
