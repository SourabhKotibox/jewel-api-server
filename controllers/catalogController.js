import Attribute from "../models/Attribute.js";
import Category from "../models/Category.js";
import { JEWELLERY_ATTRIBUTES, JEWELLERY_CATEGORIES, parseAttrValues } from "../data/jewelleryCatalog.js";

function mapAttr(a) {
  const o = a.toObject ? a.toObject() : a;
  return {
    ...o,
    id: String(o._id || o.code),
    options: parseAttrValues(o.values),
  };
}

function mapCat(c, attrByCode) {
  const o = c.toObject ? c.toObject() : c;
  const codes = o.attributeCodes || [];
  const primary = o.primaryAttributeCodes?.length
    ? o.primaryAttributeCodes
    : codes.slice(0, 6);
  return {
    ...o,
    id: String(o._id),
    primaryAttributeCodes: primary,
    attributes: codes.map((code) => attrByCode[code]).filter(Boolean),
    primaryAttributes: primary.map((code) => attrByCode[code]).filter(Boolean),
    variantAttr: o.variantAttribute
      ? attrByCode[o.variantAttribute] || null
      : null,
  };
}

/** Full catalogue meta for admin product form + storefront */
export async function getCatalogMeta(req, res, next) {
  try {
    let attrs = await Attribute.find({ status: { $ne: "Draft" } }).sort({ sortOrder: 1 });
    let cats = await Category.find({ status: { $ne: "Draft" } }).sort({ sortOrder: 1, name: 1 });

    // Auto-seed if empty
    if (!attrs.length) {
      for (let i = 0; i < JEWELLERY_ATTRIBUTES.length; i++) {
        const a = JEWELLERY_ATTRIBUTES[i];
        await Attribute.findOneAndUpdate(
          { code: a.code },
          { ...a, sortOrder: i, status: "Active" },
          { upsert: true }
        );
      }
      attrs = await Attribute.find().sort({ sortOrder: 1 });
    }
    if (!cats.length) {
      for (let i = 0; i < JEWELLERY_CATEGORIES.length; i++) {
        const c = JEWELLERY_CATEGORIES[i];
        const parent = await Category.findOneAndUpdate(
          { slug: c.slug },
          {
            name: c.name,
            slug: c.slug,
            jewelryType: c.jewelryType,
            attributeCodes: c.attributeCodes,
            primaryAttributeCodes: c.primaryAttributeCodes || [],
            variantAttribute: c.variantAttribute || "",
            img: c.img || "",
            sortOrder: i,
            status: "Active",
            parent: null,
          },
          { upsert: true, new: true }
        );
        for (const child of c.children || []) {
          await Category.findOneAndUpdate(
            { slug: child.slug },
            {
              name: child.name,
              slug: child.slug,
              jewelryType: c.jewelryType,
              attributeCodes: c.attributeCodes,
              primaryAttributeCodes: c.primaryAttributeCodes || [],
              variantAttribute: c.variantAttribute || "",
              img: "",
              sortOrder: child.sortOrder ?? 0,
              status: "Active",
              parent: parent._id,
            },
            { upsert: true, new: true }
          );
        }
      }
      cats = await Category.find().sort({ sortOrder: 1, name: 1 });
    }

    const mappedAttrs = attrs.map(mapAttr);
    const attrByCode = Object.fromEntries(mappedAttrs.map((a) => [a.code, a]));

    // Prefer categories that have attribute families configured
    const mappedCats = cats.map((c) => mapCat(c, attrByCode));
    const byId = Object.fromEntries(mappedCats.map((c) => [c.id, c]));
    const labeled = mappedCats.map((c) => {
      const parentId = c.parent ? String(c.parent) : "";
      const parent = parentId ? byId[parentId] : null;
      return {
        ...c,
        parentId,
        parentName: parent?.name || "",
        label: parent ? `${parent.name} › ${c.name}` : c.name,
      };
    });
    const bySlug = new Map();
    for (const c of labeled) {
      const key = (c.slug || c.name || "").toLowerCase();
      const prev = bySlug.get(key);
      if (!prev || (c.attributeCodes?.length || 0) > (prev.attributeCodes?.length || 0)) {
        bySlug.set(key, c);
      }
    }

    res.json({
      attributes: mappedAttrs,
      categories: [...bySlug.values()].sort(
        (a, b) =>
          (a.parentName || a.name).localeCompare(b.parentName || b.name) ||
          (a.sortOrder || 0) - (b.sortOrder || 0) ||
          a.name.localeCompare(b.name)
      ),
      groups: [
        { id: "metal", label: "Metal" },
        { id: "stone", label: "Gemstone / Diamond" },
        { id: "sizing", label: "Sizing" },
        { id: "style", label: "Style" },
        { id: "specs", label: "Specifications" },
        { id: "general", label: "General" },
      ],
    });
  } catch (err) {
    next(err);
  }
}
