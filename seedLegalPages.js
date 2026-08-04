/**
 * Seed Privacy Policy + Terms & Conditions CMS pages.
 * Usage: node seedLegalPages.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import CmsPage from "./models/CmsPage.js";

const MONGO = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/madhu_jewellery";

const pages = [
  {
    title: "Terms & Conditions",
    slug: "terms-conditions",
    status: "Published",
    type: "static",
    metaTitle: "Terms & Conditions | Madhu Jewellery",
    metaDescription: "Terms of use, orders, payments, and returns for Madhu Jewellery.",
    body: `<p>Welcome to Madhu Jewellery. By browsing or placing an order on this website, you agree to these terms.</p>
<h2>Orders &amp; payments</h2>
<p>All prices are shown in INR unless stated otherwise. Orders are confirmed after successful payment (or advance payment, when split payment applies). We reserve the right to cancel orders in case of pricing errors, stock issues, or suspected fraud — in which case any amount paid will be refunded.</p>
<h2>Shipping &amp; delivery</h2>
<p>Delivery timelines are estimates. Made-to-order pieces may take longer. Risk of loss passes to you upon delivery to the address provided at checkout.</p>
<h2>Returns &amp; exchanges</h2>
<p>Custom, engraved, and made-to-order jewellery may not be returnable. Eligible returns must be unused and in original packaging, subject to our return policy and approval.</p>
<h2>Intellectual property</h2>
<p>All designs, images, and content on this site are owned by Madhu Jewellery and may not be reused without written permission.</p>
<p>For questions, contact us via the Contact page or WhatsApp.</p>`,
  },
  {
    title: "Privacy Policy",
    slug: "privacy-policy",
    status: "Published",
    type: "static",
    metaTitle: "Privacy Policy | Madhu Jewellery",
    metaDescription: "How Madhu Jewellery collects, uses, and protects your personal information.",
    body: `<p>Madhu Jewellery (“we”, “us”) respects your privacy. This policy explains what we collect and how we use it.</p>
<h2>Information we collect</h2>
<p>We collect details you provide when creating an account, checking out, joining our newsletter, or contacting us — such as name, email, phone, shipping address, and order history. Payment card data is processed by our payment partner (e.g. Razorpay); we do not store full card numbers.</p>
<h2>How we use information</h2>
<ul>
<li>To fulfil and support your orders</li>
<li>To send order updates and (with consent) marketing / membership updates</li>
<li>To improve our website and prevent fraud</li>
</ul>
<h2>Sharing</h2>
<p>We share data with logistics, payment, and email providers only as needed to run the store. We do not sell your personal information.</p>
<h2>Your choices</h2>
<p>You may unsubscribe from marketing emails anytime. To update or delete account data, contact us or use your account profile where available.</p>
<p>Last updated: ${new Date().toISOString().slice(0, 10)}</p>`,
  },
];

async function run() {
  await mongoose.connect(MONGO);
  for (const p of pages) {
    const existing = await CmsPage.findOne({ slug: p.slug });
    if (existing) {
      Object.assign(existing, p, { updated: new Date().toISOString().slice(0, 10) });
      await existing.save();
      console.log("Updated", p.slug);
    } else {
      await CmsPage.create({ ...p, updated: new Date().toISOString().slice(0, 10) });
      console.log("Created", p.slug);
    }
  }
  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
