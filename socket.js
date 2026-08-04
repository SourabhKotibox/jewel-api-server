import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import { ADMIN_ROLES } from "./middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "madhu_dev_secret_change_me";

export function attachSocket(httpServer, app) {
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    path: "/socket.io",
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Auth required"));
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user || !user.isActive) return next(new Error("Invalid user"));
      socket.user = user;
      socket.portal = decoded.portal || "user";
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const isAdmin = ADMIN_ROLES.includes(socket.user.role) && socket.portal === "admin";
    if (isAdmin) socket.join("admin_inbox");

    socket.on("join_order", (orderNumber) => {
      if (!orderNumber) return;
      socket.join(`order:${orderNumber}`);
    });

    socket.on("leave_order", (orderNumber) => {
      if (!orderNumber) return;
      socket.leave(`order:${orderNumber}`);
    });
  });

  app.set("io", io);
  return io;
}
