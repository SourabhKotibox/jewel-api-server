/**
 * Full demo seed for end-to-end testing:
 * categories + attributes, products with variants,
 * coupons, taxes, inventory sync.
 *
 * Run: node seedDemo.js
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import Attribute from "./models/Attribute.js";
import Category from "./models/Category.js";
import Product from "./models/Product.js";
import Coupon from "./models/Coupon.js";
import TaxRate from "./models/TaxRate.js";
import { JEWELLERY_ATTRIBUTES, JEWELLERY_CATEGORIES } from "./data/jewelleryCatalog.js";
import { syncProductInventory } from "./utils/inventorySync.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/madhu_jewellery";

async function seedCatalog() {
  for (let i = 0; i < JEWELLERY_ATTRIBUTES.length; i++) {
    const a = JEWELLERY_ATTRIBUTES[i];
    await Attribute.findOneAndUpdate(
      { code: a.code },
      { ...a, sortOrder: i, status: "Active" },
      { upsert: true }
    );
  }
  const cats = {};
  for (let i = 0; i < JEWELLERY_CATEGORIES.length; i++) {
    const c = JEWELLERY_CATEGORIES[i];
    const doc = await Category.findOneAndUpdate(
      { slug: c.slug },
      {
        name: c.name,
        slug: c.slug,
        jewelryType: c.jewelryType,
        attributeCodes: c.attributeCodes,
        primaryAttributeCodes: c.primaryAttributeCodes || [],
        variantAttribute: c.variantAttribute || "",
        status: "Active",
        sortOrder: i,
      },
      { upsert: true, new: true }
    );
    cats[c.slug] = doc;
  }
  console.log("✓ Catalog attributes & categories");
  return cats;
}

function ringVariants(sku, sizes) {
  return sizes.map(([size, stock]) => ({
    sku: `${sku}-sz${size}`,
    label: String(size),
    options: { ring_size: String(size) },
    price: null,
    stock,
    status: stock > 0 ? "Active" : "Out of Stock",
  }));
}

function lengthVariants(sku, attr, rows) {
  return rows.map(([label, stock]) => ({
    sku: `${sku}-${label.replace(/\s+/g, "").toLowerCase()}`,
    label,
    options: { [attr]: label },
    price: null,
    stock,
    status: stock > 0 ? "Active" : "Out of Stock",
  }));
}

async function seedProducts(cats) {
  const demo = [
    {
      sku: "rng-polki-classic",
      name: "Classic Polki Cocktail Ring",
      slug: "classic-polki-cocktail-ring",
      price: 328000,
      category: "Rings",
      categoryId: cats.rings?._id,
      jewelryType: "rings",
      tag: "Ready to Ship",
      celeb: "Kiara Advani",
      description: "Bold cocktail ring with natural Polki centre in 18K gold.",
      images: [
        "https://i.pinimg.com/736x/44/7a/d7/447ad7022c2e3978555f99211a783773.jpg",
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop",
      ],
      isPolki: true,
      isDiamond: false,
      isBridal: false,
      allowSplit: true,
      splitType: "percent",
      splitValue: 40,
      manageStock: true,
      hasVariants: true,
      variantAttribute: "ring_size",
      attributes: {
        metal_type: "Yellow Gold",
        metal_purity: "18K",
        gemstone_type: "Polki",
        stone_origin: "Natural",
        ring_style: "Cocktail",
        setting_type: "Cluster",
        occasion: "Party",
        certification: "BIS Hallmark",
        gross_weight: "8.2",
      },
      variants: ringVariants("rng-polki-classic", [
        [10, 1],
        [12, 2],
        [14, 1],
        [16, 0],
        [18, 1],
      ]),
      status: "Active",
    },
    {
      sku: "rng-solitaire-lab",
      name: "Solitaire Lab Diamond Ring",
      slug: "solitaire-lab-diamond-ring",
      price: 185000,
      category: "Rings",
      categoryId: cats.rings?._id,
      jewelryType: "rings",
      tag: "Made to Order",
      description: "1.02 ct lab-grown solitaire, G-VS1, 14K white gold.",
      images: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop",
      ],
      isDiamond: true,
      allowSplit: true,
      splitType: "amount",
      splitValue: 75000,
      manageStock: true,
      hasVariants: true,
      variantAttribute: "ring_size",
      attributes: {
        metal_type: "White Gold",
        metal_purity: "14K",
        gemstone_type: "Diamond",
        stone_origin: "Lab-Grown",
        center_shape: "Round",
        carat_weight: "1.02",
        diamond_color: "G",
        diamond_clarity: "VS1",
        diamond_cut: "Excellent",
        certification: "IGI",
        ring_style: "Solitaire",
        setting_type: "Prong",
        occasion: "Engagement",
      },
      variants: ringVariants("rng-solitaire-lab", [
        [8, 1],
        [10, 2],
        [12, 2],
        [14, 1],
      ]),
      status: "Active",
    },
    {
      sku: "nck-amiel-choker",
      name: "Amiel Polki And Diamond Choker",
      slug: "amiel-polki-diamond-choker",
      price: 1125500,
      category: "Necklaces",
      categoryId: cats.necklaces?._id,
      jewelryType: "necklaces",
      tag: "Ready to Ship",
      celeb: "Deepika Padukone",
      description: "Bridal choker with cascading Polki and diamond motifs.",
      images: [
        "https://i.pinimg.com/1200x/9c/20/7d/9c207d05ca45af599dc196782810306f.jpg",
        "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=800&auto=format&fit=crop",
      ],
      isPolki: true,
      isDiamond: true,
      isBridal: true,
      allowSplit: true,
      splitType: "percent",
      splitValue: 50,
      manageStock: true,
      hasVariants: true,
      variantAttribute: "necklace_length",
      attributes: {
        metal_type: "Yellow Gold",
        metal_purity: "22K",
        gemstone_type: "Polki",
        stone_origin: "Natural",
        chain_type: "Link",
        clasp_type: "Box",
        occasion: "Bridal",
        certification: "BIS Hallmark",
        total_carat: "12.5",
      },
      variants: lengthVariants("nck-amiel-choker", "necklace_length", [
        ["16 in", 1],
        ["18 in", 2],
      ]),
      status: "Active",
    },
    {
      sku: "ear-royal-chandbali",
      name: "Royal Polki Chandbalis",
      slug: "royal-polki-chandbalis",
      price: 485000,
      category: "Earrings",
      categoryId: cats.earrings?._id,
      jewelryType: "earrings",
      tag: "Ready to Ship",
      description: "Traditional chandbali earrings with Polki petals.",
      images: [
        "https://i.pinimg.com/736x/2c/4c/8d/2c4c8d231d25044cc13c8cf835ffc781.jpg",
      ],
      isPolki: true,
      isBridal: true,
      manageStock: true,
      hasVariants: true,
      variantAttribute: "earring_size",
      attributes: {
        metal_type: "Yellow Gold",
        metal_purity: "22K",
        gemstone_type: "Polki",
        earring_type: "Chandeliers",
        earring_back: "Push Back",
        occasion: "Festive",
      },
      variants: lengthVariants("ear-royal-chandbali", "earring_size", [
        ["Medium", 2],
        ["Large", 1],
      ]),
      status: "Active",
    },
    {
      sku: "brc-tennis-diamond",
      name: "Diamond Tennis Bracelet",
      slug: "diamond-tennis-bracelet",
      price: 275000,
      category: "Bracelets",
      categoryId: cats.bracelets?._id,
      jewelryType: "bracelets",
      tag: "Made to Order",
      description: "Line bracelet with round brilliant diamonds in white gold.",
      images: [
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop",
      ],
      isDiamond: true,
      allowSplit: true,
      splitType: "percent",
      splitValue: 30,
      manageStock: true,
      hasVariants: true,
      variantAttribute: "bracelet_size",
      attributes: {
        metal_type: "White Gold",
        metal_purity: "18K",
        gemstone_type: "Diamond",
        stone_origin: "Natural",
        bracelet_style: "Tennis",
        clasp_type: "Box",
        total_carat: "3.20",
        diamond_clarity: "VS2",
        diamond_color: "H",
        certification: "IGI",
        occasion: "Everyday",
      },
      variants: lengthVariants("brc-tennis-diamond", "bracelet_size", [
        ["6.5 in", 1],
        ["7 in", 2],
        ["7.5 in", 1],
      ]),
      status: "Active",
    },
    {
      sku: "pnd-lotus-diamond",
      name: "Lotus Diamond Pendant",
      slug: "lotus-diamond-pendant",
      price: 98000,
      category: "Pendants",
      categoryId: cats.pendants?._id,
      jewelryType: "pendants",
      tag: "Ready to Ship",
      description: "Delicate lotus pendant with pave diamonds.",
      images: [
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop",
      ],
      isDiamond: true,
      manageStock: true,
      hasVariants: false,
      stock: 4,
      attributes: {
        metal_type: "Rose Gold",
        metal_purity: "14K",
        gemstone_type: "Diamond",
        bail_type: "Fixed",
        chain_type: "Cable",
        occasion: "Gift",
        total_carat: "0.35",
      },
      variants: [],
      status: "Active",
    },
    {
      sku: "acc-matha-patti",
      name: "Heritage Polki Matha Patti",
      slug: "heritage-polki-matha-patti",
      price: 890000,
      category: "Accessories",
      categoryId: cats.accessories?._id,
      jewelryType: "accessories",
      tag: "Made to Order",
      celeb: "Deepika Padukone",
      description: "Bridal matha patti with cascading Polki motifs.",
      images: [
        "https://i.pinimg.com/736x/01/08/7b/01087bb840b2bab2447dfbc4fbc288d3.jpg",
      ],
      isPolki: true,
      isBridal: true,
      allowSplit: true,
      splitType: "percent",
      splitValue: 50,
      manageStock: true,
      stock: 1,
      attributes: {
        metal_type: "Yellow Gold",
        metal_purity: "22K",
        gemstone_type: "Polki",
        accessory_type: "Matha Patti",
        occasion: "Bridal",
        certification: "BIS Hallmark",
      },
      variants: [],
      status: "Active",
    },
  ];

  for (const p of demo) {
    const attrs = p.attributes || {};
    const body = {
      ...p,
      specifications: attrs,
      stock:
        p.hasVariants && p.variants?.length
          ? p.variants.reduce((s, v) => s + (v.stock || 0), 0)
          : p.stock || 0,
    };
    // Prefer sku match; if another doc owns the slug, update that doc instead
    let product = await Product.findOne({ sku: p.sku });
    if (!product) product = await Product.findOne({ slug: p.slug });
    if (product) {
      Object.assign(product, body);
      product.sku = p.sku;
      product.slug = p.slug;
      await product.save();
    } else {
      product = await Product.create(body);
    }
    await syncProductInventory(product);
    if (p.categoryId) {
      await Category.findByIdAndUpdate(p.categoryId, {
        $set: { productCount: await Product.countDocuments({ categoryId: p.categoryId }) },
      });
    }
  }
  console.log(`✓ ${demo.length} demo products (+ inventory)`);
}

async function seedCoupons() {
  const coupons = [
    {
      code: "WELCOME10",
      name: "Welcome 10% off",
      type: "Percent",
      value: 10,
      maxDiscount: 25000,
      minOrder: 50000,
      limit: 500,
      usage: 0,
      ends: "2027-12-31",
      status: "Active",
    },
    {
      code: "FLAT5000",
      name: "Flat ₹5,000 off",
      type: "Fixed",
      value: 5000,
      minOrder: 100000,
      limit: 200,
      usage: 0,
      ends: "2027-06-30",
      status: "Active",
    },
    {
      code: "FREESHIP",
      name: "Free shipping",
      type: "FreeShipping",
      value: 0,
      minOrder: 25000,
      limit: 1000,
      usage: 0,
      ends: "2027-12-31",
      status: "Active",
    },
    {
      code: "BRIDAL15",
      name: "Bridal 15% (cap ₹1L)",
      type: "Custom",
      value: 15,
      maxDiscount: 100000,
      minOrder: 200000,
      customFormula: "percent:15",
      limit: 50,
      usage: 0,
      ends: "2027-12-31",
      status: "Active",
    },
  ];
  for (const c of coupons) {
    await Coupon.findOneAndUpdate({ code: c.code }, c, { upsert: true, new: true });
  }
  console.log(`✓ ${coupons.length} coupons (WELCOME10, FLAT5000, FREESHIP, BRIDAL15)`);
}

async function seedTaxes() {
  const taxes = [
    {
      name: "GST Jewellery",
      rate: "3%",
      rateValue: 3,
      inclusive: true,
      country: "India",
      status: "Active",
    },
    {
      name: "Export Zero",
      rate: "0%",
      rateValue: 0,
      inclusive: true,
      country: "International",
      status: "Active",
    },
  ];
  for (const t of taxes) {
    await TaxRate.findOneAndUpdate({ name: t.name }, t, { upsert: true, new: true });
  }
  console.log(`✓ ${taxes.length} tax rates (GST 3% inclusive)`);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected", MONGO_URI);
  const cats = await seedCatalog();
  await seedProducts(cats);
  await seedCoupons();
  await seedTaxes();
  await mongoose.disconnect();
  console.log("\nDemo ready. Test flow:");
  console.log("  1. Storefront → Rings → pick size → Add to cart");
  console.log("  2. Checkout → coupon WELCOME10 or FLAT5000");
  console.log("  3. Pay Razorpay (demo) or COD → Thank you → Track");
  console.log("  4. Account orders / Admin inventory & coupons");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
