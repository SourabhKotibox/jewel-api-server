import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "madhu_dev_secret_change_me";

export const ADMIN_ROLES = ["admin", "superadmin", "manager", "sales", "editor"];
export const STAFF_WRITE_ROLES = ["admin", "superadmin", "manager"];
/** Orders / customers / support mutations */
export const SALES_WRITE_ROLES = ["admin", "superadmin", "manager", "sales"];
/** CMS / catalogue content mutations */
export const EDITOR_WRITE_ROLES = ["admin", "superadmin", "manager", "editor"];

export function signToken(user, portal = "user") {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      portal, // "admin" | "user"
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function publicUser(user) {
  const joined = user.createdAt
    ? new Date(user.createdAt).toISOString().slice(0, 10)
    : "";
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || "",
    avatar: user.avatar || "",
    address: user.address || "",
    city: user.city || "",
    isActive: user.isActive,
    createdAt: user.createdAt || null,
    joined,
    status: user.isActive === false ? "Draft" : "Active",
  };
}

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Not authorized — no token" });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }
    req.user = user;
    req.portal = decoded.portal || (ADMIN_ROLES.includes(user.role) ? "admin" : "user");
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized — invalid token" });
  }
}

/** Attach user if token present; continue as guest otherwise */
export async function optionalProtect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (user && user.isActive) {
      req.user = user;
      req.portal = decoded.portal || (ADMIN_ROLES.includes(user.role) ? "admin" : "user");
    }
    next();
  } catch {
    next();
  }
}

/** Admin panel JWT — staff roles only */
export function adminOnly(req, res, next) {
  if (!req.user || !ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ message: "Admin access required" });
  }
  if (req.portal && req.portal !== "admin") {
    return res.status(403).json({ message: "Use admin login for this resource" });
  }
  next();
}

/** Staff who can mutate catalog/sales data (full ops) */
export function staffWrite(req, res, next) {
  if (!req.user || !STAFF_WRITE_ROLES.includes(req.user.role)) {
    return res.status(403).json({ message: "Insufficient admin privileges" });
  }
  next();
}

/** Sales + managers can update orders / support */
export function salesWrite(req, res, next) {
  if (!req.user || !SALES_WRITE_ROLES.includes(req.user.role)) {
    return res.status(403).json({ message: "Sales privileges required" });
  }
  next();
}

/** Editors + managers can update CMS / content */
export function editorWrite(req, res, next) {
  if (!req.user || !EDITOR_WRITE_ROLES.includes(req.user.role)) {
    return res.status(403).json({ message: "Content editor privileges required" });
  }
  next();
}

/** Storefront customer JWT */
export function customerOnly(req, res, next) {
  if (!req.user) {
    return res.status(403).json({ message: "Customer access required" });
  }
  if (req.portal === "admin" && !ADMIN_ROLES.includes(req.user.role)) {
    return res.status(403).json({ message: "Customer access required" });
  }
  if (req.user.role !== "customer" && req.portal !== "user") {
    // Allow customers; also allow any user token issued from user portal
  }
  if (req.user.role !== "customer" && req.portal === "admin") {
    return res.status(403).json({ message: "Customer portal access required" });
  }
  next();
}

export function superadminOnly(req, res, next) {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Superadmin access required" });
  }
  next();
}
