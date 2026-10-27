import Transaction from "../models/Transaction.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ALL_CATEGORIES } from "../utils/constants.js";
import { isMonthKey, monthRange } from "../utils/dates.js";
import { escapeRegex } from "../utils/escapeRegex.js";

// Copy only the fields a user is allowed to set. This stops someone from
// sending "user" or "isDemo" in the request body to change who owns a record.
const editableFields = (body) => ({
  type: body.type,
  amount: body.amount,
  category: body.category,
  date: body.date,
  description: body.description ?? "",
});

// GET /api/transactions?type=&category=&month=2026-10&search=
export const getTransactions = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id }; // always limited to the logged-in user
  const { type, category, month, search } = req.query;

  if (type === "income" || type === "expense") filter.type = type;
  if (typeof category === "string" && ALL_CATEGORIES.includes(category)) filter.category = category;
  if (isMonthKey(month)) {
    const { start, end } = monthRange(month);
    filter.date = { $gte: start, $lt: end };
  }
  if (typeof search === "string" && search.trim()) {
    const pattern = new RegExp(escapeRegex(search.trim().slice(0, 50)), "i");
    filter.$or = [{ description: pattern }, { category: pattern }];
  }

  const items = await Transaction.find(filter).sort({ date: -1, createdAt: -1 }).limit(5000);
  res.json(items);
});

// POST /api/transactions
export const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.create({
    ...editableFields(req.body),
    user: req.user._id,
  });
  res.status(201).json(transaction);
});

// PUT /api/transactions/:id
export const updateTransaction = asyncHandler(async (req, res) => {
  // The filter has BOTH the id and the user, so nobody can edit someone else's record
  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    editableFields(req.body),
    { new: true, runValidators: true }
  );
  if (!transaction) return res.status(404).json({ message: "Transaction not found" });
  res.json(transaction);
});

// DELETE /api/transactions/:id
export const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!transaction) return res.status(404).json({ message: "Transaction not found" });
  res.json({ message: "Transaction deleted", id: transaction._id });
});
