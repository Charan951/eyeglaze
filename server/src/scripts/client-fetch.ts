async function run() {
  const url = 'http://localhost:5000/api/products/6a39ffe5798a092662d5c5e2';
  console.log(`Fetching from: ${url}`);
  try {
    const res = await fetch(url);
    const data = await res.json() as any;
    console.log("STATUS:", res.status);
    console.log("PRODUCT LENS TYPES:", JSON.stringify(data.product?.lensTypes, null, 2));
    console.log("LENSES:", JSON.stringify(data.lenses, null, 2));
  } catch (err) {
    console.error("Fetch failed:", err);
  }
  process.exit(0);
}

run();
