/**
 * Jewellery attribute families — research-based sets for rings, necklaces, etc.
 * Used by seed + API meta endpoint.
 */

export const JEWELLERY_ATTRIBUTES = [
  // Shared
  {
    code: "metal_type",
    name: "Metal Type",
    type: "Select",
    values: "Yellow Gold,White Gold,Rose Gold,Platinum,Silver,Polki Mixed Metal",
    required: true,
    group: "metal",
  },
  {
    code: "metal_purity",
    name: "Metal Purity",
    type: "Select",
    values: "9K,14K,18K,22K,24K,PT950,PT900,925 Silver",
    required: true,
    group: "metal",
  },
  {
    code: "finish",
    name: "Finish",
    type: "Select",
    values: "High Polish,Matte,Brushed,Antique,Two-Tone",
    required: false,
    group: "metal",
  },
  {
    code: "gemstone_type",
    name: "Gemstone Type",
    type: "Select",
    values: "Diamond,Polki,Uncut Diamond,Ruby,Emerald,Sapphire,Pearl,Moissanite,None,Mixed",
    required: false,
    group: "stone",
  },
  {
    code: "stone_origin",
    name: "Stone Origin",
    type: "Select",
    values: "Natural,Lab-Grown,Mixed",
    required: false,
    group: "stone",
  },
  {
    code: "center_shape",
    name: "Center Stone Shape",
    type: "Select",
    values: "Round,Oval,Cushion,Emerald,Pear,Marquise,Princess,Heart,Radiant,Asscher,Baguette",
    required: false,
    group: "stone",
  },
  {
    code: "carat_weight",
    name: "Center Carat (ct)",
    type: "Number",
    values: "",
    required: false,
    group: "stone",
  },
  {
    code: "total_carat",
    name: "Total Carat Weight (ct)",
    type: "Number",
    values: "",
    required: false,
    group: "stone",
  },
  {
    code: "diamond_color",
    name: "Diamond Color",
    type: "Select",
    values: "D,E,F,G,H,I,J,K,L,M,Fancy",
    required: false,
    group: "stone",
  },
  {
    code: "diamond_clarity",
    name: "Diamond Clarity",
    type: "Select",
    values: "FL,IF,VVS1,VVS2,VS1,VS2,SI1,SI2,I1,I2,I3",
    required: false,
    group: "stone",
  },
  {
    code: "diamond_cut",
    name: "Cut Grade",
    type: "Select",
    values: "Excellent,Very Good,Good,Fair,Ideal",
    required: false,
    group: "stone",
  },
  {
    code: "certification",
    name: "Certification",
    type: "Select",
    values: "GIA,IGI,SGL,BIS Hallmark,None",
    required: false,
    group: "stone",
  },
  {
    code: "setting_type",
    name: "Setting Type",
    type: "Select",
    values: "Prong,Bezel,Halo,Pave,Channel,Tension,Cluster,Cocktail",
    required: false,
    group: "style",
  },
  {
    code: "occasion",
    name: "Occasion",
    type: "Select",
    values: "Bridal,Engagement,Everyday,Festive,Party,Gift",
    required: false,
    group: "style",
  },
  {
    code: "gender",
    name: "Gender",
    type: "Select",
    values: "Women,Men,Unisex",
    required: false,
    group: "style",
  },
  {
    code: "gross_weight",
    name: "Gross Weight (g)",
    type: "Number",
    values: "",
    required: false,
    group: "specs",
  },
  {
    code: "net_weight",
    name: "Net Metal Weight (g)",
    type: "Number",
    values: "",
    required: false,
    group: "specs",
  },
  // Rings
  {
    code: "ring_size",
    name: "Ring Size (IN)",
    type: "Select",
    values: "5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26",
    required: false,
    group: "sizing",
    usedForVariants: true,
  },
  {
    code: "ring_style",
    name: "Ring Style",
    type: "Select",
    values: "Solitaire,Halo,Eternity,Band,Cocktail,Stackable,Statement",
    required: false,
    group: "style",
  },
  {
    code: "band_width",
    name: "Band Width (mm)",
    type: "Number",
    values: "",
    required: false,
    group: "specs",
  },
  // Necklaces
  {
    code: "necklace_length",
    name: "Necklace Length",
    type: "Select",
    values: "14 in,16 in,18 in,20 in,22 in,24 in,28 in,30 in,Custom",
    required: false,
    group: "sizing",
    usedForVariants: true,
  },
  {
    code: "chain_type",
    name: "Chain Type",
    type: "Select",
    values: "Box,Cable,Rope,Snake,Figaro,Link,Bead,None",
    required: false,
    group: "style",
  },
  {
    code: "clasp_type",
    name: "Clasp Type",
    type: "Select",
    values: "Lobster,Spring Ring,Toggle,Box,Hook,Magnetic,None",
    required: false,
    group: "specs",
  },
  // Earrings
  {
    code: "earring_type",
    name: "Earring Type",
    type: "Select",
    values: "Studs,Hoops,Drops,Chandeliers,Jhumkas,Climbers,Huggies,Cuffs",
    required: false,
    group: "style",
  },
  {
    code: "earring_back",
    name: "Earring Back",
    type: "Select",
    values: "Push Back,Screw Back,Lever Back,Hook,Clip-On",
    required: false,
    group: "specs",
  },
  {
    code: "earring_size",
    name: "Earring Size / Drop",
    type: "Select",
    values: "Small,Medium,Large,Extra Large",
    required: false,
    group: "sizing",
    usedForVariants: true,
  },
  // Bracelets
  {
    code: "bracelet_size",
    name: "Bracelet Size",
    type: "Select",
    values: "5.5 in,6 in,6.5 in,7 in,7.5 in,8 in,8.5 in,Adjustable",
    required: false,
    group: "sizing",
    usedForVariants: true,
  },
  {
    code: "bracelet_style",
    name: "Bracelet Style",
    type: "Select",
    values: "Bangle,Tennis,Cuff,Chain,Charm,Kada",
    required: false,
    group: "style",
  },
  // Pendants
  {
    code: "pendant_height",
    name: "Pendant Height (mm)",
    type: "Number",
    values: "",
    required: false,
    group: "specs",
  },
  {
    code: "bail_type",
    name: "Bail Type",
    type: "Select",
    values: "Fixed,Hidden,Open,None",
    required: false,
    group: "specs",
  },
  // Accessories / Sets
  {
    code: "set_pieces",
    name: "Pieces in Set",
    type: "Number",
    values: "",
    required: false,
    group: "specs",
  },
  {
    code: "accessory_type",
    name: "Accessory Type",
    type: "Select",
    values: "Matha Patti,Nose Ring,Armlet,Brooch,Anklet,Hair Pin,Waist Belt",
    required: false,
    group: "style",
  },
];

const SHARED = [
  "metal_type",
  "metal_purity",
  "finish",
  "gemstone_type",
  "stone_origin",
  "center_shape",
  "carat_weight",
  "total_carat",
  "diamond_color",
  "diamond_clarity",
  "diamond_cut",
  "certification",
  "setting_type",
  "occasion",
  "gender",
  "gross_weight",
  "net_weight",
];

/** Fields shown by default on product form (rest under “More details”) */
const CORE_SHARED = ["metal_type", "metal_purity", "gemstone_type", "occasion"];

export const JEWELLERY_CATEGORIES = [
  {
    name: "Rings",
    slug: "rings",
    jewelryType: "rings",
    variantAttribute: "ring_size",
    primaryAttributeCodes: [...CORE_SHARED, "ring_style", "setting_type"],
    attributeCodes: [...SHARED, "ring_size", "ring_style", "band_width"],
    img: "",
    children: [
      { name: "Diamond Rings", slug: "diamond-rings", sortOrder: 1 },
      { name: "Polki Rings", slug: "polki-rings", sortOrder: 2 },
      { name: "Gold Rings", slug: "gold-rings", sortOrder: 3 },
      { name: "Solitaire Rings", slug: "solitaire-rings", sortOrder: 4 },
      { name: "Engagement Rings", slug: "engagement-rings", sortOrder: 5 },
      { name: "Cocktail Rings", slug: "cocktail-rings", sortOrder: 6 },
    ],
  },
  {
    name: "Necklaces",
    slug: "necklaces",
    jewelryType: "necklaces",
    variantAttribute: "necklace_length",
    primaryAttributeCodes: [...CORE_SHARED, "chain_type", "clasp_type"],
    attributeCodes: [...SHARED, "necklace_length", "chain_type", "clasp_type"],
    img: "",
    children: [
      { name: "Diamond Necklaces", slug: "diamond-necklaces", sortOrder: 1 },
      { name: "Polki Necklaces", slug: "polki-necklaces", sortOrder: 2 },
      { name: "Gold Necklaces", slug: "gold-necklaces", sortOrder: 3 },
      { name: "Chokers", slug: "chokers", sortOrder: 4 },
    ],
  },
  {
    name: "Earrings",
    slug: "earrings",
    jewelryType: "earrings",
    variantAttribute: "earring_size",
    primaryAttributeCodes: [...CORE_SHARED, "earring_type", "earring_back"],
    attributeCodes: [...SHARED, "earring_type", "earring_back", "earring_size"],
    img: "",
    children: [
      { name: "Diamond Earrings", slug: "diamond-earrings", sortOrder: 1 },
      { name: "Polki Earrings", slug: "polki-earrings", sortOrder: 2 },
      { name: "Jhumkas", slug: "jhumkas", sortOrder: 3 },
      { name: "Chandbalis", slug: "chandbalis", sortOrder: 4 },
    ],
  },
  {
    name: "Bracelets",
    slug: "bracelets",
    jewelryType: "bracelets",
    variantAttribute: "bracelet_size",
    primaryAttributeCodes: [...CORE_SHARED, "bracelet_style", "clasp_type"],
    attributeCodes: [...SHARED, "bracelet_size", "bracelet_style", "clasp_type"],
    img: "",
    children: [
      { name: "Diamond Bracelets", slug: "diamond-bracelets", sortOrder: 1 },
      { name: "Gold Bracelets", slug: "gold-bracelets", sortOrder: 2 },
      { name: "Bangles", slug: "bangles", sortOrder: 3 },
    ],
  },
  {
    name: "Pendants",
    slug: "pendants",
    jewelryType: "pendants",
    variantAttribute: "",
    primaryAttributeCodes: [...CORE_SHARED, "bail_type", "chain_type"],
    attributeCodes: [...SHARED, "pendant_height", "bail_type", "chain_type"],
    img: "",
    children: [
      { name: "Diamond Pendants", slug: "diamond-pendants", sortOrder: 1 },
      { name: "Polki Pendants", slug: "polki-pendants", sortOrder: 2 },
    ],
  },
  {
    name: "Accessories",
    slug: "accessories",
    jewelryType: "accessories",
    variantAttribute: "",
    primaryAttributeCodes: [...CORE_SHARED, "accessory_type"],
    attributeCodes: [...SHARED, "accessory_type"],
    img: "",
    children: [
      { name: "Maang Tikkas", slug: "maang-tikkas", sortOrder: 1 },
      { name: "Nose Rings", slug: "nose-rings", sortOrder: 2 },
    ],
  },
  {
    name: "Sets",
    slug: "sets",
    jewelryType: "sets",
    variantAttribute: "",
    primaryAttributeCodes: [...CORE_SHARED, "set_pieces", "earring_type"],
    attributeCodes: [...SHARED, "set_pieces", "necklace_length", "earring_type"],
    img: "",
    children: [
      { name: "Bridal Sets", slug: "bridal-sets", sortOrder: 1 },
      { name: "Polki Sets", slug: "polki-sets", sortOrder: 2 },
      { name: "Diamond Sets", slug: "diamond-sets", sortOrder: 3 },
    ],
  },
];

/** Human labels for storefront specs */
export const ATTR_LABELS = Object.fromEntries(
  JEWELLERY_ATTRIBUTES.map((a) => [a.code, a.name])
);

export function parseAttrValues(values) {
  if (Array.isArray(values)) return values.map(String).filter(Boolean);
  return String(values || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
