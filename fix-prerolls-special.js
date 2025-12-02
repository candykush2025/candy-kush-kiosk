// Script to update prerollsSpecial image paths
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

function fixImagePath(path) {
  if (!path) return path;
  if (path.startsWith("/Product/")) {
    return path.replace(/ /g, "-");
  }
  return path;
}

async function updatePrerollsSpecial() {
  console.log("Checking prerollsSpecial/data/products...\n");

  const productsRef = db.collection("prerollsSpecial").doc("data").collection("products");
  const snapshot = await productsRef.get();
  
  console.log(`Found ${snapshot.size} products\n`);

  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`\n${doc.id}: ${data.quality} ${data.strain}`);
    console.log(`  Current mainImage: ${data.mainImage}`);
    
    const updates = {};
    let needsUpdate = false;

    // Fix mainImage
    if (data.mainImage && data.mainImage.includes(" ")) {
      updates.mainImage = fixImagePath(data.mainImage);
      console.log(`  -> Fixing to: ${updates.mainImage}`);
      needsUpdate = true;
    }

    // Fix variants
    if (data.variants) {
      const newVariants = JSON.parse(JSON.stringify(data.variants));
      let variantsChanged = false;

      for (const size of ["small", "normal", "king"]) {
        if (newVariants[size]?.image && newVariants[size].image.includes(" ")) {
          const oldPath = newVariants[size].image;
          newVariants[size].image = fixImagePath(oldPath);
          console.log(`  -> Fixing variants.${size}.image: ${oldPath} -> ${newVariants[size].image}`);
          variantsChanged = true;
        }
      }

      if (variantsChanged) {
        updates.variants = newVariants;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await productsRef.doc(doc.id).update(updates);
      console.log(`  ✅ Updated!`);
      updatedCount++;
    } else {
      console.log(`  (no changes needed)`);
    }
  }

  console.log(`\n\n🎉 Done! Updated ${updatedCount} of ${snapshot.size} products`);
  process.exit(0);
}

updatePrerollsSpecial().catch((err) => {
  console.error(err);
  process.exit(1);
});
