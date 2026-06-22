
import 'dotenv/config';
import { connectDB } from '../config/mongodb';
import { Product } from '../models/Product';

const sampleProduct = {
  "name": "Aero Square Blue Light Glasses",
  "description": "Stylish square blue light glasses for everyday use",
  "sku": "EG-AERO-SQ-001",
  "slug": "aero-square-blue-light-glasses",
  "status": "Active",
  "isActive": true,

  "category": "prescription",
  "categories": ["prescription", "blue_light"],
  "gender": "unisex",
  "brand": "Eyeglaze",

  // Pricing
  "price": {
    "original": 2499,
    "selling": 1999
  },
  "mrp": 2499,
  "sellingPrice": 1999,

  // Member & Non-Member Pricing
  "memberPrice": 1799,
  "nonMemberPrice": 1999,

  // Offers
  "buy1Get1": true,
  "oneRupeeFrameOffer": true,
  "offerBadges": ["1+1 Offer", "₹1 Frame Eligible", "Member Exclusive"],

  // ₹1 Frame Conditions
  "oneRupeeOfferConditions": {
    "membershipRequired": true,
    "premiumLensRequired": false,
    "minCartValue": 0
  },

  // Media
  "images": [
    "/images/men_eyeglasses.png",
    "/images/women_eyeglasses.png",
    "/images/cat_blue_light.png"
  ],
  "thumbnail": "/images/men_eyeglasses.png",
  "frontView": "/images/men_eyeglasses.png",
  "leftView": "/images/women_eyeglasses.png",
  "rightView": "/images/women_eyeglasses.png",
  "topView": "/images/cat_blue_light.png",
  "threeSixtyImages": [],
  "lifestyleImages": [],

  // Frame Details
  "frame": {
    "type": "Square",
    "material": "Acetate",
    "width": 140,
    "lensWidth": 52,
    "bridgeWidth": 18,
    "templeLength": 142,
    "featureTags": ["Lightweight", "Durable", "Blue Light Protection"]
  },
  "frameType": "Square",
  "frameShape": "Square",
  "material": "Acetate",
  "warranty": "1 Year",
  "availableSizes": ["Small", "Medium", "Large"],
  "frameSize": "Medium",

  // Colors
  "colors": [
    {
      "name": "Black",
      "hex": "#131314",
      "stock": 50,
      "images": ["/images/men_eyeglasses.png"]
    },
    {
      "name": "Blue",
      "hex": "#0066cc",
      "stock": 30,
      "images": ["/images/women_eyeglasses.png"]
    }
  ],

  // Lens Compatibility
  "compatible": {
    "prescription": true,
    "bluecut": true,
    "zeropower": true,
    "progressive": true
  }
};

async function addSampleProduct() {
  try {
    await connectDB();
    console.log('Connected to DB');

    const existing = await Product.findOne({ sku: sampleProduct.sku });
    if (existing) {
      console.log('Updating existing product...');
      await Product.findByIdAndUpdate(existing._id, sampleProduct, { new: true });
      console.log('Product updated successfully!');
      console.log('Product ID:', existing._id);
    } else {
      const product = new Product(sampleProduct);
      await product.save();
      console.log('Product added successfully!');
      console.log('Product ID:', product._id);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error adding product:', error);
    process.exit(1);
  }
}

addSampleProduct();
