import Category from "../models/Category.js";
import { fileUrl } from "../middleware/upload.js";

function map(c) {
  const o = c.toObject ? c.toObject() : c;
  return { ...o, id: String(o._id) };
}

export async function getCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories.map(map));
  } catch (err) {
    next(err);
  }
}

export async function getCategory(req, res, next) {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(map(category));
  } catch (err) {
    next(err);
  }
}

function normalizeCategoryBody(body) {
  const next = { ...body };
  if (typeof next.attributeCodes === "string") {
    try {
      const parsed = JSON.parse(next.attributeCodes);
      next.attributeCodes = Array.isArray(parsed)
        ? parsed
        : String(next.attributeCodes)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    } catch {
      next.attributeCodes = String(next.attributeCodes)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  if (typeof next.productCount === "string") next.productCount = Number(next.productCount);
  if (typeof next.sortOrder === "string") next.sortOrder = Number(next.sortOrder);
  return next;
}

export async function createCategory(req, res, next) {
  try {
    const body = normalizeCategoryBody({ ...req.body });
    if (req.file) body.img = fileUrl(req.file.filename);
    const category = await Category.create(body);
    res.status(201).json(map(category));
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const body = normalizeCategoryBody({ ...req.body });
    if (req.file) body.img = fileUrl(req.file.filename);
    const category = await Category.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(map(category));
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (err) {
    next(err);
  }
}
