/**
 * Upsert published blog posts + FAQs with rich HTML + SEO.
 * Run: node seedBlogFaq.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import BlogPost from "./models/BlogPost.js";
import Faq from "./models/Faq.js";

const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/madhu";

const posts = [
  {
    title: "The Art of Jadau: Gold, Lac & Uncut Diamonds",
    slug: "art-of-jadau",
    date: "2026-07-10",
    status: "Published",
    excerpt:
      "Inside the Rajasthani technique that sets uncut diamonds into 22K gold without claws — and why Madhu still handcrafts every piece.",
    metaTitle: "The Art of Jadau Jewellery | Madhu Journal",
    metaDescription:
      "Discover Jadau craftsmanship: gold, lac, and uncut diamonds. How Madhu artisans preserve a royal Rajasthani technique for modern bridal wear.",
    metaKeywords: "Jadau jewellery, uncut diamonds, Rajasthani craft, bridal Jadau, Madhu jewellery blog",
    body: `<p>Jadau is more than a setting style — it is a living craft that travelled from Persian courts into the ateliers of Rajasthan. At Madhu, every Jadau piece still begins on the bench, not on a machine line.</p>
<h2>What makes Jadau unique</h2>
<p>Unlike claw-set diamonds, Jadau seats uncut (Polki) stones into 22K gold using a traditional lac and foil method. The result is a soft, candlelit sparkle that flatters Indian skin tones and bridal textiles.</p>
<h3>Gold, lac, and patience</h3>
<p>Artisans carve a cavity, line it with silver foil for fire, then lock the stone with heated lac. There are no prongs to catch on silk — only a seamless golden cradle.</p>
<blockquote>A single bridal necklace can take weeks of handwork across setters, polishers, and stringers.</blockquote>
<h2>How to wear Jadau today</h2>
<p>Pair a classic Rani haar with a modern blouse, or choose lighter chokers for daytime functions. Ask our stylists for weight guidance so the piece feels as graceful as it looks.</p>
<p>Visit a Madhu boutique to see Jadau under natural light — the difference is unmistakable.</p>`,
  },
  {
    title: "Bridal Trunk Show Diary: What Brides Asked Us",
    slug: "bridal-trunk-show",
    date: "2026-06-22",
    status: "Published",
    excerpt:
      "Notes from our latest trunk show — colour stories, stacking rules, and the three questions every bride should ask before locking a set.",
    metaTitle: "Bridal Trunk Show Diary | Madhu Jewellery Blog",
    metaDescription:
      "Behind the scenes of a Madhu bridal trunk show: styling tips, Polki vs diamond choices, and how to build a heirloom set.",
    metaKeywords: "bridal jewellery, trunk show, Polki bridal set, Madhu bridal, wedding jewellery tips",
    body: `<p>Our summer trunk show brought together bridal sets from Lumina, Aurora, and Noor — and a long queue of thoughtful questions. Here is what we heard most often.</p>
<h2>Polki or diamond — which first?</h2>
<p>Many brides choose Polki for the wedding day (it photographs warmly under mandap light) and keep a diamond tennis or studs for reception and travel. You do not have to choose only one path.</p>
<h2>Building a set that grows with you</h2>
<ul>
<li>Start with earrings and a mangalsutra or choker you will wear again.</li>
<li>Add a longer haar for the pheras if your blouse neckline allows.</li>
<li>Keep maang tikka weight balanced with your hair style.</li>
</ul>
<h3>Book a private hour</h3>
<p>Trunk shows are lively; private appointments let you try looks without rush. Message us on WhatsApp or visit the store to reserve a bridal hour.</p>`,
  },
  {
    title: "Caring for Polki: A Simple At-Home Ritual",
    slug: "caring-for-polki",
    date: "2026-07-28",
    status: "Published",
    excerpt:
      "Gentle cleaning, storage, and what never to do with lac-set Polki — so your heirloom pieces stay luminous for decades.",
    metaTitle: "How to Care for Polki Jewellery | Madhu Guide",
    metaDescription:
      "Learn how to clean and store Polki jewellery safely. Avoid chemicals, protect lac settings, and keep Madhu pieces heirloom-ready.",
    metaKeywords: "Polki care, clean Polki jewellery, jewellery care guide, Madhu care tips",
    body: `<p>Polki’s beauty is delicate. A few careful habits protect the foil, lac, and gold that hold each stone.</p>
<h2>After every wear</h2>
<p>Wipe gently with a soft, dry cloth. Remove pieces before perfume, hair spray, or swimming. Moisture and chemicals dull the foil behind the stone.</p>
<h2>Deep clean — only when needed</h2>
<ol>
<li>Use a barely damp soft cloth — never soak lac-set Polki.</li>
<li>Avoid ultrasonic cleaners and harsh jewellery dips.</li>
<li>For stubborn residue, bring the piece to a Madhu boutique; our workshop will clean it safely.</li>
</ol>
<h3>Storage</h3>
<p>Keep each piece in its pouch or a lined box, separate from harder diamonds that can scratch gold. Store flat so chains do not kink.</p>
<blockquote>When in doubt, ask us — we would rather clean a piece ourselves than see an heirloom damaged at home.</blockquote>`,
  },
];

const faqs = [
  {
    q: "Do you offer worldwide shipping?",
    a: "<p>Yes. We offer complimentary insured shipping outside India on orders above INR 200,000. Domestic deliveries are tracked and fully insured.</p>",
    status: "Published",
  },
  {
    q: "Are diamonds certified?",
    a: "<p>All diamonds are SGL certified, and gold is BIS hallmarked. Certificates ship with your order.</p>",
    status: "Published",
  },
  {
    q: "Can I customise bridal sets?",
    a: "<p>Yes — book a private consultation via WhatsApp or a store visit. Our atelier can tailor weight, stones, and motifs.</p>",
    status: "Published",
  },
  {
    q: "How do I care for Polki jewellery?",
    a: "<p>Wipe gently after wear, avoid chemicals and ultrasonic cleaners, and store pieces separately. Read our <a href=\"/blog/caring-for-polki\">Polki care guide</a> for a full ritual.</p>",
    status: "Published",
  },
];

async function main() {
  await mongoose.connect(MONGO);
  console.log("Connected", MONGO);

  for (const p of posts) {
    await BlogPost.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
    console.log("Upserted blog:", p.slug);
  }

  for (const f of faqs) {
    await Faq.findOneAndUpdate({ q: f.q }, f, { upsert: true, new: true });
    console.log("Upserted FAQ:", f.q.slice(0, 40));
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
