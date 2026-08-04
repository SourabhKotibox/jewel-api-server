import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import User from "./models/User.js";
import Product from "./models/Product.js";
import Category from "./models/Category.js";
import Inventory from "./models/Inventory.js";
import Attribute from "./models/Attribute.js";
import Customer from "./models/Customer.js";
import Order from "./models/Order.js";
import Coupon from "./models/Coupon.js";
import Faq from "./models/Faq.js";
import Role from "./models/Role.js";
import Locale from "./models/Locale.js";
import Channel from "./models/Channel.js";
import StoreLocation from "./models/StoreLocation.js";
import TaxRate from "./models/TaxRate.js";
import Setting from "./models/Setting.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/madhu_jewellery";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected:", MONGO_URI);

  const adminEmail = "admin@madhujewellery.com";
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: "Madhu Admin",
      email: adminEmail,
      password: "admin123",
      role: "superadmin",
      phone: "+91 98765 00000",
    });
    console.log("✅ Superadmin created:", adminEmail, "/ admin123");
  } else {
    console.log("• Superadmin exists:", adminEmail);
  }

  const demoEmail = "customer@madhujewellery.com";
  let customer = await User.findOne({ email: demoEmail });
  if (!customer) {
    customer = await User.create({
      name: "Priya Sharma",
      email: demoEmail,
      password: "customer123",
      role: "customer",
      phone: "+91 98765 43210",
      city: "Mumbai",
    });
    await Customer.create({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      user: customer._id,
      orders: 1,
      spent: 1125500,
    });
    console.log("✅ Demo customer:", demoEmail, "/ customer123");
  }

  if ((await Category.countDocuments()) === 0) {
    await Category.insertMany([
      { name: "Necklaces", slug: "necklaces", productCount: 4 },
      { name: "Earrings", slug: "earrings", productCount: 3 },
      { name: "Rings", slug: "rings", productCount: 2 },
      { name: "Bracelets", slug: "bracelets", productCount: 2 },
    ]);
    console.log("✅ Categories seeded");
  }

  if ((await Product.countDocuments()) === 0) {
    await Product.insertMany([
      {
        sku: "dn00366",
        name: "Amiel Polki And Diamond Choker",
        slug: "amiel-polki-diamond-choker",
        price: 1125500,
        category: "Necklaces",
        tag: "Ready to Ship",
        stock: 2,
        status: "Active",
        isPolki: true,
        isDiamond: true,
        isBridal: true,
        images: [],
      },
      {
        sku: "er00122",
        name: "Royal Polki Chandbalis",
        slug: "royal-polki-chandbalis",
        price: 485000,
        category: "Earrings",
        stock: 5,
        status: "Active",
        isPolki: true,
        images: [],
      },
    ]);
    console.log("✅ Products seeded");
  }

  if ((await Inventory.countDocuments()) === 0) {
    await Inventory.insertMany([
      { name: "Amiel Polki And Diamond Choker", sku: "dn00366", source: "Mumbai WH", qty: 2, reserved: 1, status: "In Stock" },
      { name: "Royal Polki Chandbalis", sku: "er00122", source: "Jaipur WH", qty: 5, reserved: 0, status: "In Stock" },
      { name: "Alyssa Polki Necklace", sku: "tn30123", source: "Mumbai WH", qty: 0, reserved: 0, status: "Out of Stock" },
    ]);
    console.log("✅ Inventory seeded");
  }

  if ((await Attribute.countDocuments()) === 0) {
    await Attribute.insertMany([
      { code: "metal", name: "Metal", type: "Select", values: "Gold,Rose Gold,Platinum", required: true },
      { code: "purity", name: "Purity", type: "Select", values: "18K,22K,24K", required: true },
    ]);
  }

  if ((await Role.countDocuments()) === 0) {
    await Role.insertMany([
      { name: "Super Admin", users: 1, permissions: "All", status: "Active" },
      { name: "Store Manager", users: 0, permissions: "Catalog, Orders, Stores", status: "Active" },
      { name: "Sales", users: 0, permissions: "Orders, Customers", status: "Active" },
    ]);
  }

  if ((await Locale.countDocuments()) === 0) {
    await Locale.insertMany([
      { code: "en", name: "English", status: "Active" },
      { code: "hi", name: "Hindi", status: "Draft" },
    ]);
  }

  if ((await Channel.countDocuments()) === 0) {
    await Channel.insertMany([
      { name: "Web Store", hostname: "madhujewellery.com", status: "Active" },
    ]);
  }

  if ((await Coupon.countDocuments()) === 0) {
    await Coupon.insertMany([
      { code: "BRIDAL10", type: "Percent", value: 10, minOrder: 200000, usage: 0, limit: 100, status: "Active", ends: "2026-12-31" },
    ]);
  }

  if ((await Faq.countDocuments()) === 0) {
    await Faq.insertMany([
      { q: "Do you offer worldwide shipping?", a: "Yes, complimentary insured shipping outside India on orders above INR 200,000.", status: "Published" },
      { q: "Are diamonds certified?", a: "All diamonds are SGL certified; gold is BIS hallmarked.", status: "Published" },
    ]);
  }

  if ((await TaxRate.countDocuments()) === 0) {
    await TaxRate.insertMany([
      { name: "GST Jewellery", rate: "3%", country: "India", status: "Active" },
    ]);
  }

  if ((await StoreLocation.countDocuments()) === 0) {
    await StoreLocation.insertMany([
      {
        city: "Mumbai",
        state: "Maharashtra",
        address: "Bandra West, Linking Road",
        phone: "+91 22 2640 0000",
        hours: "Mon–Sun 11:00 AM – 08:00 PM",
      },
    ]);
  }

  if ((await Order.countDocuments()) === 0 && customer) {
    await Order.create({
      orderNumber: "ORD-7842",
      customer: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: "12 Palm Grove, Bandra West, Mumbai 400050",
      items: [{ productId: "dn00366", name: "Amiel Polki And Diamond Choker", qty: 1, price: 1125500 }],
      total: 1125500,
      shipping: 0,
      status: "Processing",
      payment: "Paid",
      paymentMethod: "UPI",
      user: customer._id,
    });
    console.log("✅ Sample order seeded");
  }

  await Setting.findOneAndUpdate(
    { key: "business" },
    {
      value: {
        businessName: "Madhu Jewellery",
        tagline: "Polki & Diamond Couture",
      },
    },
    { upsert: true }
  );

  console.log("Seed complete.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
