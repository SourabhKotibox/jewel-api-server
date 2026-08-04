import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";
import crypto from "crypto";
import { signToken, publicUser, ADMIN_ROLES } from "../middleware/auth.js";
import { fileUrl } from "../middleware/upload.js";
import { sendMail, getMailConfig } from "../services/mail.js";

async function claimGuestOrders(user) {
  if (!user?._id || !user.email) return 0;
  const result = await Order.updateMany(
    {
      email: String(user.email).toLowerCase(),
      $or: [{ user: null }, { user: { $exists: false } }],
    },
    { $set: { user: user._id } }
  );
  return result.modifiedCount || 0;
}

/** Storefront — customers only */
export async function userRegister(req, res, next) {
  try {
    const { name, email, password, phone, city, address, state, pinCode } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const fullAddress = [address, state, pinCode].filter(Boolean).join(", ");

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || "",
      city: city || "",
      address: fullAddress || address || "",
      role: "customer",
      avatar: req.file ? fileUrl(req.file.filename) : "",
    });

    await Customer.create({
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      user: user._id,
      orders: 0,
      spent: 0,
    });

    await claimGuestOrders(user);

    const token = signToken(user, "user");
    res.status(201).json({ token, user: publicUser(user), portal: "user" });
  } catch (err) {
    next(err);
  }
}

export async function userLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isActive) return res.status(403).json({ message: "Account disabled" });
    if (user.role !== "customer") {
      return res.status(403).json({
        message: "This account is staff. Please use the Admin login.",
      });
    }

    await claimGuestOrders(user);

    const token = signToken(user, "user");
    res.json({ token, user: publicUser(user), portal: "user" });
  } catch (err) {
    next(err);
  }
}

/** Admin panel — staff roles only */
export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isActive) return res.status(403).json({ message: "Account disabled" });
    if (!ADMIN_ROLES.includes(user.role)) {
      return res.status(403).json({
        message: "Not an admin account. Use the storefront login instead.",
      });
    }

    const token = signToken(user, "admin");
    res.json({ token, user: publicUser(user), portal: "admin" });
  } catch (err) {
    next(err);
  }
}

/** Superadmin creates staff accounts */
export async function adminRegister(req, res, next) {
  try {
    const { name, email, password, role = "manager", phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password required" });
    }
    if (!ADMIN_ROLES.includes(role) || role === "customer") {
      return res.status(400).json({ message: "Invalid staff role" });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone: phone || "",
      avatar: req.file ? fileUrl(req.file.filename) : "",
    });

    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user), portal: req.portal });
}

export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.address !== undefined) user.address = req.body.address;
    if (req.body.city !== undefined) user.city = req.body.city;

    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      if (req.body.currentPassword) {
        const ok = await user.matchPassword(req.body.currentPassword);
        if (!ok) return res.status(400).json({ message: "Current password is incorrect" });
      } else if (user.role === "customer") {
        return res.status(400).json({ message: "Current password required to change password" });
      }
      user.password = req.body.password;
    }

    if (req.file) user.avatar = fileUrl(req.file.filename);
    await user.save();

    if (user.role === "customer") {
      await Customer.findOneAndUpdate(
        { user: user._id },
        { name: user.name, phone: user.phone, city: user.city, email: user.email }
      );
    }

    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email, role: "customer" });
    if (!user) {
      return res.json({
        ok: true,
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const raw = crypto.randomBytes(32).toString("hex");
    user.resetToken = crypto.createHash("sha256").update(raw).digest("hex");
    user.resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const origin =
      process.env.STOREFRONT_URL ||
      req.headers.origin ||
      "http://localhost:5173";
    const link = `${String(origin).replace(/\/$/, "")}/reset-password?token=${raw}&email=${encodeURIComponent(email)}`;

    const mailResult = await sendMail({
      to: email,
      subject: "Reset your Madhu Jewellery password",
      html: `<p>Hello ${user.name || ""},</p>
        <p>Reset your password using this link (valid 1 hour):</p>
        <p><a href="${link}">${link}</a></p>
        <p>If you did not request this, ignore this email.</p>`,
    });

    res.json({
      ok: true,
      message: "If that email exists, a reset link has been sent.",
      ...(mailResult.skipped ? { resetLink: link, demo: true } : {}),
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const token = String(req.body.token || "").trim();
    const password = String(req.body.password || "");
    if (!email || !token || !password) {
      return res.status(400).json({ message: "Email, token and new password required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email,
      role: "customer",
      resetToken: hashed,
      resetExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    user.password = password;
    user.resetToken = "";
    user.resetExpires = undefined;
    await user.save();

    res.json({ ok: true, message: "Password updated. You can sign in now." });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const role = req.query.role;
    const filter = role ? { role } : { role: { $in: ADMIN_ROLES } };
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json(users.map(publicUser));
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.role && ADMIN_ROLES.includes(req.body.role)) user.role = req.body.role;
    if (req.body.isActive !== undefined) user.isActive = !!req.body.isActive;
    if (req.body.password) user.password = req.body.password;
    if (req.file) user.avatar = fileUrl(req.file.filename);
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req, res, next) {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

/** Legacy aliases — prefer portal-specific routes */
export const register = userRegister;
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isActive) return res.status(403).json({ message: "Account disabled" });
    if (ADMIN_ROLES.includes(user.role)) {
      const token = signToken(user, "admin");
      return res.json({ token, user: publicUser(user), portal: "admin" });
    }
    await claimGuestOrders(user);
    const token = signToken(user, "user");
    res.json({ token, user: publicUser(user), portal: "user" });
  } catch (err) {
    next(err);
  }
};
