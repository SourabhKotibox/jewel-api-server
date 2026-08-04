import Customer from "../models/Customer.js";

function map(c) {
  const o = c.toObject ? c.toObject() : c;
  const joined = o.joined || (o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : "");
  return {
    ...o,
    id: o.id || String(o._id),
    joined,
  };
}

export async function getCustomers(req, res, next) {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers.map(map));
  } catch (err) {
    next(err);
  }
}

export async function getCustomer(req, res, next) {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(map(customer));
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req, res, next) {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(map(customer));
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(map(customer));
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req, res, next) {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer deleted" });
  } catch (err) {
    next(err);
  }
}
