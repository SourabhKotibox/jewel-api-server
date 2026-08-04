/**
 * Seed rich catalogue + home content so the storefront home page is fully API-driven.
 * Run: node seedHome.js
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import Product from "./models/Product.js";
import Category from "./models/Category.js";
import StoreLocation from "./models/StoreLocation.js";
import Testimonial from "./models/Testimonial.js";
import Setting from "./models/Setting.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/madhu_jewellery";

const cmsHome = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "cmsHomeDefault.json"), "utf8")
);
const cmsAbout = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "cmsAboutDefault.json"), "utf8")
);
const cmsStores = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "cmsStoresDefault.json"), "utf8")
);
const cmsLayout = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "cmsLayoutDefault.json"), "utf8")
);
const cmsCollection = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "cmsCollectionDefault.json"), "utf8")
);
const cmsProduct = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "cmsProductDefault.json"), "utf8")
);
const cmsCart = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "cmsCartDefault.json"), "utf8")
);
const cmsCheckout = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "cmsCheckoutDefault.json"), "utf8")
);
const cmsWishlist = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "cmsWishlistDefault.json"), "utf8")
);
const cmsSearch = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "cmsSearchDefault.json"), "utf8")
);
const cmsAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "cmsAccountDefault.json"), "utf8")
);
const cmsContact = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "cmsContactDefault.json"), "utf8")
);

const categories = [
  { name: "Necklaces", slug: "all-necklaces", img: "https://i.pinimg.com/vwebp/1200x/3b/62/a1/3b62a1d25021e8c773adbe14633aed0a.webp", productCount: 4 },
  { name: "Earrings", slug: "polki-earrings", img: "https://i.pinimg.com/736x/c8/f9/98/c8f9982932822606c0857cf690cde1aa.jpg", productCount: 2 },
  { name: "Bracelets", slug: "bracelets-for-women", img: "https://i.pinimg.com/736x/4b/f6/e8/4bf6e8b4c04a52f86a4d46d5fb8f8fe5.jpg", productCount: 1 },
  { name: "Accessories", slug: "polki-accessories", img: "https://i.pinimg.com/736x/01/08/7b/01087bb840b2bab2447dfbc4fbc288d3.jpg", productCount: 1 },
  { name: "Sets", slug: "polki-diamond-jewellery-sets", img: "https://i.pinimg.com/736x/92/b8/31/92b831020e5d62d07ba3bf04bff90199.jpg", productCount: 1 },
];

const products = [
  {
    sku: "dn00366",
    slug: "amiel-polki-diamond-choker",
    name: "Amiel Polki And Diamond Choker",
    celeb: "Kusha Kapila",
    price: 1125500,
    tag: "Ready to Ship",
    category: "Necklaces",
    isPolki: true,
    isDiamond: true,
    isBridal: true,
    stock: 2,
    status: "Active",
    images: [
      "https://i.pinimg.com/1200x/9c/20/7d/9c207d05ca45af599dc196782810306f.jpg",
      "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=800&auto=format&fit=crop",
    ],
    description:
      "An opulent statement of royal aesthetics. The Amiel Polki Choker features hand-set uncut diamonds nested in solid 22KT gold.",
  },
  {
    sku: "on30079",
    slug: "reem-polki-diamond-bead-pendant",
    name: "Reem Polki And Diamond Bead Pendant",
    celeb: "Maheep Kapoor",
    price: 1009100,
    tag: "Made to Order",
    category: "Necklaces",
    isPolki: true,
    isDiamond: true,
    stock: 1,
    status: "Active",
    images: ["https://i.pinimg.com/736x/44/7a/d7/447ad7022c2e3978555f99211a783773.jpg"],
    description: "The Reem Bead Pendant bridges ancestral legacy and modern glamour.",
  },
  {
    sku: "tn30123",
    slug: "alyssa-polki-necklace",
    name: "Alyssa Polki Necklace",
    celeb: "Shalini Pandey",
    price: 474100,
    tag: "Made to Order",
    category: "Necklaces",
    isPolki: true,
    stock: 3,
    status: "Active",
    images: ["https://i.pinimg.com/736x/2c/4c/8d/2c4c8d231d25044cc13c8cf835ffc781.jpg"],
    description: "Delicate yet regal, designed for contemporary brides.",
  },
  {
    sku: "on30084",
    slug: "heena-polki-diamond-necklace",
    name: "Heena Polki And Diamond Necklace",
    celeb: "Kalki Koechlin",
    price: 1020800,
    tag: "Made to Order",
    category: "Necklaces",
    isPolki: true,
    isDiamond: true,
    isBridal: true,
    stock: 1,
    status: "Active",
    images: ["https://i.pinimg.com/vwebp/736x/0f/91/77/0f9177d65eabc190838aab1fa999189c.webp"],
    description: "Floral arrays of syndicate Polki diamonds framed by brilliant diamonds.",
  },
  {
    sku: "er00122",
    slug: "royal-polki-chandbalis",
    name: "Royal Polki Chandbalis",
    celeb: "Ananya Panday",
    price: 485000,
    tag: "Ready to Ship",
    category: "Earrings",
    isPolki: true,
    stock: 5,
    status: "Active",
    images: ["https://i.pinimg.com/736x/c8/f9/98/c8f9982932822606c0857cf690cde1aa.jpg"],
    description: "Statement chandbalis in 22KT gold with uncut Polki.",
  },
  {
    sku: "rg00912",
    slug: "classic-polki-cocktail-ring",
    name: "Classic Polki Cocktail Ring",
    celeb: "Kiara Advani",
    price: 328000,
    tag: "Ready to Ship",
    category: "Rings",
    isPolki: true,
    stock: 8,
    status: "Active",
    images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop"],
    description: "Bold cocktail ring with natural Polki centre.",
  },
  {
    sku: "br00501",
    slug: "kundan-polki-kara-bracelets",
    name: "Kundan Polki Kara Bracelets",
    celeb: "Alia Bhatt",
    price: 612000,
    tag: "Made to Order",
    category: "Bracelets",
    isPolki: true,
    isBridal: true,
    stock: 3,
    status: "Active",
    images: ["https://i.pinimg.com/736x/4b/f6/e8/4bf6e8b4c04a52f86a4d46d5fb8f8fe5.jpg"],
    description: "Heirloom kara bracelets in Kundan and Polki.",
  },
  {
    sku: "ac00801",
    slug: "polki-matha-patti",
    name: "Heritage Polki Matha Patti",
    celeb: "Deepika Padukone",
    price: 890000,
    tag: "Made to Order",
    category: "Accessories",
    isPolki: true,
    isBridal: true,
    stock: 2,
    status: "Active",
    images: ["https://i.pinimg.com/736x/01/08/7b/01087bb840b2bab2447dfbc4fbc288d3.jpg"],
    description: "Bridal matha patti with cascading Polki motifs.",
  },
];

const stores = [
  {
    city: "Jammu",
    state: "Jammu & Kashmir",
    address: "Channi Himat, Jammu, Jammu and Kashmir 180015",
    hours: "Mon–Sun 11:00 AM – 08:00 PM",
    phone: "+91 96193 87006",
    mapUrl: "https://maps.app.goo.gl/29RCKxmt3N4jemfo7",
    img: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=800&auto=format&fit=crop",
  },
  {
    city: "Surat",
    state: "Gujarat",
    address: "Dasani Plaza, Opp. Sarela Shopping Center, Ghod Dod Rd, Surat 395001",
    hours: "Mon–Sun 11:00 AM – 08:00 PM",
    phone: "+91 96197 46253",
    mapUrl: "https://maps.app.goo.gl/ZEPTZU5Eik6UYchF6",
    img: "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=800&auto=format&fit=crop",
  },
  {
    city: "Jalandhar",
    state: "Punjab",
    address: "Central Arc Building, New Jawahar Nagar, Jalandhar 144001",
    hours: "Mon–Sat 11:00 AM – 08:00 PM",
    phone: "+91 82915 00394",
    mapUrl: "https://maps.app.goo.gl/yTemNvCakW2bAzNaA",
    img: "https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=800&auto=format&fit=crop",
  },
  {
    city: "Bandra, Mumbai",
    state: "Maharashtra",
    address: "190 Turner Road, Bandra West, Mumbai 400050",
    hours: "Mon–Sat 11:00 AM – 06:00 PM",
    phone: "+91 84229 18035",
    mapUrl: "https://maps.app.goo.gl/9Sh8czjjbbee5DyV7",
    img: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=800&auto=format&fit=crop",
  },
  {
    city: "Kolkata",
    state: "West Bengal",
    address: "4, Woodburn Park Road, Elgin Rd, Kolkata 700020",
    hours: "Mon–Sun 11:00 AM – 08:00 PM",
    phone: "+91 84228 34581",
    mapUrl: "https://maps.app.goo.gl/",
    img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop",
  },
  {
    city: "New Delhi",
    state: "Delhi",
    address: "M-Block Market, Greater Kailash 1, New Delhi 110048",
    hours: "Mon–Sun 11:00 AM – 08:00 PM",
    phone: "+91 98100 22345",
    mapUrl: "https://maps.app.goo.gl/",
    img: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop",
  },
  {
    city: "Jaipur",
    state: "Rajasthan",
    address: "C-Scheme, Near Central Park, Jaipur 302001",
    hours: "Mon–Sun 10:30 AM – 08:30 PM",
    phone: "+91 94140 55678",
    mapUrl: "https://maps.app.goo.gl/",
    img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop",
  },
  {
    city: "Ahmedabad",
    state: "Gujarat",
    address: "SG Highway, Near Iscon Cross Road, Ahmedabad 380015",
    hours: "Mon–Sun 11:00 AM – 08:00 PM",
    phone: "+91 99988 76543",
    mapUrl: "https://maps.app.goo.gl/",
    img: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=800&auto=format&fit=crop",
  },
];

const testimonials = [
  {
    name: "Neha",
    location: "New Zealand",
    text: "The piece I purchased feels like a work of art. The shine, detailing, and authenticity are remarkable.",
    img: "https://images.unsplash.com/photo-1594744803329-92b0a3fca7a3?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Zarin",
    location: "Bangladesh",
    text: "The craftsmanship is exceptional, with intricate designs that truly elevate the overall look.",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Priya Patel",
    location: "USA",
    text: "Custom designed my wedding jewellery — it turned out phenomenal. Easy to communicate with, on time delivery.",
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Nitya Tazrain",
    location: "Bangladesh",
    text: "An amazing experience. As an international client it met my expectations perfectly.",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop",
  },
];

async function upsertSetting(key, value) {
  await Setting.findOneAndUpdate({ key }, { value }, { upsert: true });
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected:", MONGO_URI);

  await Category.deleteMany({});
  await Category.insertMany(categories);
  console.log("✅ Categories:", categories.length);

  for (const p of products) {
    await Product.findOneAndUpdate({ sku: p.sku }, p, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  console.log("✅ Products upserted:", products.length);

  await StoreLocation.deleteMany({});
  await StoreLocation.insertMany(stores);
  console.log("✅ Stores:", stores.length);

  await Testimonial.deleteMany({});
  await Testimonial.insertMany(testimonials);
  console.log("✅ Testimonials:", testimonials.length);

  await upsertSetting("cmsHome", cmsHome);
  await upsertSetting("cmsAbout", cmsAbout);
  await upsertSetting("cmsStores", cmsStores);
  await upsertSetting("cmsLayout", {
    ...cmsLayout,
    sectionLayout: cmsLayout.sectionLayout || {
      hidden: [],
      order: ["announcement", "nav", "footer"],
      customSections: [],
    },
  });
  await upsertSetting("cmsCollection", {
    ...cmsCollection,
    sectionLayout: cmsCollection.sectionLayout || {
      hidden: [],
      order: ["hero", "toolbar", "grid"],
      customSections: [],
    },
  });
  await upsertSetting("cmsProduct", cmsProduct);
  await upsertSetting("cmsCart", cmsCart);
  await upsertSetting("cmsCheckout", cmsCheckout);
  await upsertSetting("cmsWishlist", cmsWishlist);
  await upsertSetting("cmsSearch", cmsSearch);
  await upsertSetting("cmsAccount", cmsAccount);
  await upsertSetting("cmsContact", cmsContact);
  await upsertSetting("business", {
    businessName: "Madhu Jewellery",
    tagline: "Polki & Diamond Couture",
    whatsapp: "919619587978",
    instagram: "https://www.instagram.com/madhujewellery/",
  });
  console.log("✅ Settings: all cms* pages + business");

  console.log("Home seed complete.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
