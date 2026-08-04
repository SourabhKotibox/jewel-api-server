/**
 * Generic CRUD controller + router factory for admin entities.
 */
import { Router } from "express";
import { protect, adminOnly, staffWrite } from "../middleware/auth.js";

export function createCrudController(Model, { searchFields = [], mapDoc, idField, lookupFields = [], publicStatus } = {}) {
  const toJson = (doc) => {
    const o = doc.toObject ? doc.toObject() : doc;
    const mapped = mapDoc ? mapDoc(o) : o;
    return {
      ...mapped,
      id: String(mapped.id || mapped[idField] || mapped._id),
    };
  };

  const normalizeBody = (body) => {
    const next = { ...body };
    if (idField && next.id && !next[idField]) next[idField] = next.id;
    // coerce booleans/numbers from multipart
    Object.keys(next).forEach((k) => {
      if (next[k] === "true") next[k] = true;
      if (next[k] === "false") next[k] = false;
      if (typeof next[k] === "string" && next[k] !== "" && !Number.isNaN(Number(next[k])) && /^-?\d+(\.\d+)?$/.test(next[k])) {
        // only coerce known numeric-looking pure numbers when field names suggest it
        if (
          [
            "qty",
            "reserved",
            "amount",
            "value",
            "minOrder",
            "usage",
            "limit",
            "sent",
            "rating",
            "users",
            "productCount",
            "price",
            "stock",
            "shipping",
            "total",
            "rateValue",
            "priority",
          ].includes(k)
        ) {
          next[k] = Number(next[k]);
        }
      }
    });
    return next;
  };

  return {
    async list(req, res, next) {
      try {
        const q = (req.query.q || "").trim();
        const filter = {};
        if (q && searchFields.length) {
          filter.$or = searchFields.map((f) => ({
            [f]: { $regex: q, $options: "i" },
          }));
        }
        if (req.query.status && req.query.status !== "All") {
          filter.status = req.query.status;
        } else if (publicStatus && !req.headers.authorization) {
          filter.status = publicStatus;
        }
        const rows = await Model.find(filter).sort({ createdAt: -1, _id: -1 });
        res.json(rows.map(toJson));
      } catch (err) {
        next(err);
      }
    },

    async getOne(req, res, next) {
      try {
        const key = req.params.id;
        let row = null;
        if (idField) row = await Model.findOne({ [idField]: key });
        if (!row) row = await Model.findById(key).catch(() => null);
        if (!row && lookupFields.length) {
          for (const f of lookupFields) {
            row = await Model.findOne({ [f]: key });
            if (row) break;
          }
        }
        if (!row) return res.status(404).json({ message: "Not found" });
        res.json(toJson(row));
      } catch (err) {
        next(err);
      }
    },

    async create(req, res, next) {
      try {
        const body = normalizeBody(req.body);
        if (req.file) {
          body[req.uploadField || "url"] = `/uploads/${req.file.filename}`;
          if (!body.name) body.name = req.file.originalname;
        }
        if (req.files?.length) {
          body.images = req.files.map((f) => `/uploads/${f.filename}`);
        }
        const row = await Model.create(body);
        res.status(201).json(toJson(row));
      } catch (err) {
        next(err);
      }
    },

    async update(req, res, next) {
      try {
        const body = normalizeBody(req.body);
        if (req.file) {
          body[req.uploadField || "url"] = `/uploads/${req.file.filename}`;
        }
        if (req.files?.length) {
          body.images = req.files.map((f) => `/uploads/${f.filename}`);
        }
        let row = null;
        if (idField) {
          row = await Model.findOneAndUpdate({ [idField]: req.params.id }, body, {
            new: true,
            runValidators: true,
          });
        }
        if (!row) {
          row = await Model.findByIdAndUpdate(req.params.id, body, {
            new: true,
            runValidators: true,
          }).catch(() => null);
        }
        if (!row) return res.status(404).json({ message: "Not found" });
        res.json(toJson(row));
      } catch (err) {
        next(err);
      }
    },

    async remove(req, res, next) {
      try {
        let row = null;
        if (idField) row = await Model.findOneAndDelete({ [idField]: req.params.id });
        if (!row) row = await Model.findByIdAndDelete(req.params.id).catch(() => null);
        if (!row) return res.status(404).json({ message: "Not found" });
        res.json({ message: "Deleted", id: req.params.id });
      } catch (err) {
        next(err);
      }
    },
  };
}

export function createCrudRouter(Model, options = {}) {
  const ctrl = createCrudController(Model, options);
  const router = Router();
  const { publicList = false, publicGet = false } = options;

  if (publicList) router.get("/", ctrl.list);
  else router.get("/", protect, adminOnly, ctrl.list);

  if (publicGet) router.get("/:id", ctrl.getOne);
  else router.get("/:id", protect, adminOnly, ctrl.getOne);

  router.post("/", protect, adminOnly, staffWrite, ctrl.create);
  router.put("/:id", protect, adminOnly, staffWrite, ctrl.update);
  router.delete("/:id", protect, adminOnly, staffWrite, ctrl.remove);

  return router;
}
