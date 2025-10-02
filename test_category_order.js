// Test script to verify category ordering
import { CategoryService } from "./src/lib/productService.js";

async function testCategoryOrder() {
  try {
    console.log("Testing category order functionality...");

    // Get all categories
    const categories = await CategoryService.getAllCategories();
    console.log(
      "Current categories:",
      categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        order: cat.order,
      }))
    );

    console.log("Test completed!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testCategoryOrder();
