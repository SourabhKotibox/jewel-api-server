import { Router } from "express";
import path from "path";
import fs from "fs";
import { protect, adminOnly } from "../middleware/auth.js";
import { upload, UPLOAD_DIR, fileUrl } from "../middleware/upload.js";
import MediaAsset from "../models/MediaAsset.js";

const router = Router();

router.post("/", protect, adminOnly, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const url = fileUrl(req.file.filename);
    const type = req.file.mimetype.startsWith("video")
      ? "Video"
      : req.file.mimetype === "application/pdf"
        ? "Document"
        : "Image";
    const asset = await MediaAsset.create({
      name: req.body.name || req.file.originalname,
      url,
      type,
      size: `${(req.file.size / 1024).toFixed(0)} KB`,
      used: req.body.used || "",
    });
    res.status(201).json({
      id: String(asset._id),
      url,
      name: asset.name,
      type: asset.type,
      size: asset.size,
      absoluteUrl: `${req.protocol}://${req.get("host")}${url}`,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/multiple", protect, adminOnly, upload.array("files", 12), async (req, res, next) => {
  try {
    if (!req.files?.length) return res.status(400).json({ message: "No files uploaded" });
    const files = await Promise.all(
      req.files.map(async (f) => {
        const url = fileUrl(f.filename);
        const asset = await MediaAsset.create({
          name: f.originalname,
          url,
          type: f.mimetype.startsWith("video") ? "Video" : "Image",
          size: `${(f.size / 1024).toFixed(0)} KB`,
        });
        return { id: String(asset._id), url, name: asset.name };
      })
    );
    res.status(201).json({ files });
  } catch (err) {
    next(err);
  }
});

router.delete("/:filename", protect, adminOnly, (req, res) => {
  const file = path.join(UPLOAD_DIR, path.basename(req.params.filename));
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ message: "File removed" });
});

export default router;
