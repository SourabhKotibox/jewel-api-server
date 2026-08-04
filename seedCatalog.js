/**
 * Seed jewellery categories + attributes (safe upsert) including subtypes.
 * Run: node seedCatalog.js
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import Attribute from "./models/Attribute.js";
import Category from "./models/Category.js";
import Setting from "./models/Setting.js";
import { JEWELLERY_ATTRIBUTES, JEWELLERY_CATEGORIES } from "./data/jewelleryCatalog.js";
import { DEFAULT_METAL_RATES } from "./utils/metalPricing.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/madhu_jewellery";

async function upsertCategory(payload) {
  const existing =
    (await Category.findOne({ slug: payload.slug })) ||
    (await Category.findOne({ name: new RegExp(`^${payload.name}$`, "i") }));
  if (existing) {
    await Category.findByIdAndUpdate(existing._id, payload);
    return await Category.findById(existing._id);
  }
  return Category.create(payload);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected", MONGO_URI);

  for (let i = 0; i < JEWELLERY_ATTRIBUTES.length; i++) {
    const a = JEWELLERY_ATTRIBUTES[i];
    await Attribute.findOneAndUpdate(
      { code: a.code },
      {
        code: a.code,
        name: a.name,
        type: a.type,
        values: a.values,
        required: !!a.required,
        group: a.group || "general",
        usedForVariants: !!a.usedForVariants,
        sortOrder: i,
        status: "Active",
      },
      { upsert: true, new: true }
    );
  }
  console.log(`✓ ${JEWELLERY_ATTRIBUTES.length} attributes`);

  const keepSlugs = [];
  for (let i = 0; i < JEWELLERY_CATEGORIES.length; i++) {
    const c = JEWELLERY_CATEGORIES[i];
    const parent = await upsertCategory({
      name: c.name,
      slug: c.slug,
      jewelryType: c.jewelryType,
      attributeCodes: c.attributeCodes,
      primaryAttributeCodes: c.primaryAttributeCodes || c.attributeCodes.slice(0, 6),
      variantAttribute: c.variantAttribute || "",
      img: c.img || "",
      status: "Active",
      sortOrder: i,
      parent: null,
    });
    keepSlugs.push(c.slug);

    for (const child of c.children || []) {
      await upsertCategory({
        name: child.name,
        slug: child.slug,
        jewelryType: c.jewelryType,
        attributeCodes: c.attributeCodes,
        primaryAttributeCodes: c.primaryAttributeCodes || c.attributeCodes.slice(0, 6),
        variantAttribute: c.variantAttribute || "",
        img: "",
        status: "Active",
        sortOrder: child.sortOrder ?? 0,
        parent: parent._id,
      });
      keepSlugs.push(child.slug);
    }
  }

  console.log(`✓ categories + subtypes (${keepSlugs.length} total)`);

  await Setting.findOneAndUpdate(
    { key: "metalRates" },
    {
      key: "metalRates",
      value: {
        ...DEFAULT_METAL_RATES,
        updatedAt: new Date().toISOString().slice(0, 10),
      },
    },
    { upsert: true, new: true }
  );
  console.log("✓ metalRates settings");

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
