import Address from "../models/Address.js";

function map(a) {
  const o = a.toObject ? a.toObject() : a;
  return { ...o, id: String(o._id) };
}

export async function listAddresses(req, res, next) {
  try {
    const rows = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json(rows.map(map));
  } catch (err) {
    next(err);
  }
}

export async function createAddress(req, res, next) {
  try {
    const body = { ...req.body, user: req.user._id };
    if (body.isDefault || (await Address.countDocuments({ user: req.user._id })) === 0) {
      await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
      body.isDefault = true;
    }
    const doc = await Address.create(body);
    res.status(201).json(map(doc));
  } catch (err) {
    next(err);
  }
}

export async function updateAddress(req, res, next) {
  try {
    const doc = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ message: "Address not found" });
    Object.assign(doc, req.body);
    if (req.body.isDefault) {
      await Address.updateMany(
        { user: req.user._id, _id: { $ne: doc._id } },
        { $set: { isDefault: false } }
      );
      doc.isDefault = true;
    }
    await doc.save();
    res.json(map(doc));
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(req, res, next) {
  try {
    const doc = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ message: "Address not found" });
    if (doc.isDefault) {
      const nextDefault = await Address.findOne({ user: req.user._id });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

export async function setDefaultAddress(req, res, next) {
  try {
    const doc = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ message: "Address not found" });
    await Address.updateMany({ user: req.user._id }, { $set: { isDefault: false } });
    doc.isDefault = true;
    await doc.save();
    res.json(map(doc));
  } catch (err) {
    next(err);
  }
}
