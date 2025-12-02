// Quick script to verify Firebase preroll data
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkPrerollData() {
  console.log("Checking ALL Prerolls collections...\n");

  // Check main products collection
  const productsRef = db.collection("Prerolls").doc("data").collection("products");
  const snapshot = await productsRef.get();
  
  console.log(`Prerolls/data/products: ${snapshot.size} documents\n`);

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`  quality: ${data.quality}, strain: ${data.strain}`);
    console.log(`  mainImage: ${data.mainImage}`);
    console.log();
  });

  // Also check if there's data at root level
  const rootPrerolls = db.collection("Prerolls");
  const rootSnap = await rootPrerolls.get();
  console.log(`\nRoot Prerolls collection: ${rootSnap.size} documents`);
  rootSnap.docs.forEach((doc) => {
    console.log(`  - ${doc.id}`);
    const data = doc.data();
    if (data.products && Array.isArray(data.products)) {
      console.log(`    Has products array with ${data.products.length} items`);
      data.products.forEach((p, i) => {
        console.log(`      [${i}] ${p.quality} ${p.strain}: ${p.mainImage}`);
      });
    }
  });

  // Check PrerollProducts collection (different name)
  const altProducts = db.collection("PrerollProducts");
  const altSnap = await altProducts.get();
  console.log(`\nPrerollProducts collection: ${altSnap.size} documents`);

  process.exit(0);
}

checkPrerollData().catch((err) => {
  console.error(err);
  process.exit(1);
});
