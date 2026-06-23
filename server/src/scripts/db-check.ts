import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from '../config/mongodb';
import { Product } from '../models/Product';
import { Lens } from '../models/Lens';
import { LensType } from '../models/LensType';

function getMappedLensTypesFromProduct(prod: any, lensesList: any[]) {
  if (!prod || !prod.lensTypes) return [];
  
  const minPrices: Record<string, number> = {};
  lensesList.forEach((lens: any) => {
    const typeId = typeof lens.lensType === 'object' ? lens.lensType?._id?.toString() : lens.lensType?.toString();
    if (typeId) {
      if (minPrices[typeId] === undefined || lens.basePrice < minPrices[typeId]) {
        minPrices[typeId] = lens.basePrice;
      }
    }
  });

  return prod.lensTypes.map((t: any) => {
    const id = typeof t === 'object' ? t._id?.toString() : t?.toString();
    const name = typeof t === 'object' ? t.name : '';
    
    const lowercaseName = name.toLowerCase();
    let type = 'zero_power';
    let description = 'Clear lenses for everyday wear with no prescription.';
    let displayName = name;
    
    if (lowercaseName.includes('single vision')) {
      type = 'single_vision';
      description = 'Single vision lenses corrected for distance or reading.';
    } else if (lowercaseName.includes('progressive')) {
      type = 'progressive';
      description = 'Multifocal lenses for clear vision at all distances.';
    } else if (lowercaseName.includes('blue cut') || lowercaseName.includes('bluecut')) {
      type = 'bluecut';
      description = 'Protects eyes from harmful blue light emitted by digital screens.';
    } else if (lowercaseName.includes('photochromic')) {
      type = 'photochromic';
      description = 'Lenses that darken automatically in sunlight and stay clear indoors.';
    } else if (lowercaseName.includes('with power')) {
      type = 'single_vision';
      description = 'Prescription lenses tailored to your power requirements.';
    }

    return {
      _id: id,
      kind: 'type',
      type,
      displayName,
      name,
      description,
      price: minPrices[id] || 999,
      startingPrice: minPrices[id] || 999,
      features: [],
      isBestseller: lowercaseName.includes('with power') || lowercaseName.includes('zero power')
    };
  }).filter((t: any) => t.name);
}

async function run() {
  await connectDB();
  console.log("CONNECTED TO MONGO");

  const product = await Product.findById('6a39ffe5798a092662d5c5e2').populate('lensTypes');
  if (!product) {
    console.log("Product not found");
    process.exit(1);
  }

  // Fetch active lenses associated with the product's lens types
  const lensTypeIds = product.lensTypes || [];
  const lenses = await Lens.find({ lensType: { $in: lensTypeIds }, status: 'Active' }).populate('lensType');

  // Fetch all active lens types to map product-specific custom lenses
  const allLensTypes = await LensType.find({ status: 'Active' });

  // Apply product-specific price overrides if present in dynamicLensPricing
  const overriddenLenses = lenses.map(lensDoc => {
    const lensObj = lensDoc.toObject();
    if (product.dynamicLensPricing && Array.isArray(product.dynamicLensPricing)) {
      const override = product.dynamicLensPricing.find(
        (o: any) => o.lensName === lensObj.name
      );
      if (override) {
        if (override.status === 'Inactive') {
          lensObj.status = 'Inactive';
        } else {
          lensObj.basePrice = override.regularPrice;
          if (override.goldPrice !== undefined) {
            lensObj.memberPrice = override.goldPrice;
          }
        }
      }
    }
    return lensObj;
  }).filter(lens => lens.status === 'Active');

  // Find any product-specific custom lenses in dynamicLensPricing that do not match global lenses
  const customLenses: any[] = [];
  if (product.dynamicLensPricing && Array.isArray(product.dynamicLensPricing)) {
    const unmatchedPricing = product.dynamicLensPricing.filter((o: any) => {
      return o.status === 'Active' && !lenses.some(lensDoc => lensDoc.name === o.lensName);
    });

    unmatchedPricing.forEach((o: any) => {
      const matchingType = allLensTypes.find(t => t.name.toLowerCase() === o.lensCategory.toLowerCase());
      customLenses.push({
        _id: `custom-${o._id || new mongoose.Types.ObjectId()}`,
        name: o.lensName,
        basePrice: o.regularPrice,
        memberPrice: o.goldPrice,
        status: o.status || 'Active',
        isProductSpecific: true,
        lensType: matchingType ? { _id: matchingType._id, name: matchingType.name } : undefined
      });
    });
  }

  const finalLensesList = [...overriddenLenses, ...customLenses];
  const mappedTypes = getMappedLensTypesFromProduct(product.toObject(), finalLensesList);
  console.log("MAPPED LENS TYPES IN CLIENT STATE:");
  console.log(JSON.stringify(mappedTypes, null, 2));

  process.exit(0);
}

run();
