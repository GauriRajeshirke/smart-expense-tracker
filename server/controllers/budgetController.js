import Budget from "../models/Budget.js";
import Transaction from "../models/Transaction.js";
import asyncHandler from "../utils/asyncHandler.js";
import { currentMonthKey, isMonthKey, monthRange } from "../utils/dates.js";
import { round2 } from "../utils/summary.js";

// GET /api/budgets?month=2026-10   (month is optional)
export const getBudgets = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (isMonthKey(req.query.month)) filter.month = req.query.month;

  const budgets = await Budget.find(filter).sort({ category: 1 });
  res.json(budgets);
});

// POST /api/budgets   { category, month, limit }
// Creates the budget, or updates it if that category already has one that month.
export const saveBudget = asyncHandler(async (req, res) => {
  const { category, month, limit } = req.body;

  const budget = await Budget.findOneAndUpdate(
    { user: req.user._id, category, month },
    { limit },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.json(budget);
});

// DELETE /api/budgets/:id
export const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!budget) return res.status(404).json({ message: "Budget not found" });
  res.json({ message: "Budget deleted", id: budget._id });
});

// GET /api/budgets/progress?month=2026-10
// Each budget plus how much has really been spent, calculated from the database.
export const getBudgetProgress = asyncHandler(async (req, res) => {
  const month = isMonthKey(req.query.month) ? req.query.month : currentMonthKey();
  const { start, end } = monthRange(month);

  const [budgets, spentRows] = await Promise.all([
    Budget.find({ user: req.user._id, month }).sort({ category: 1 }),
    Transaction.aggregate([
      { $match: { user: req.user._id, type: "expense", date: { $gte: start, $lt: end } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]),
  ]);

  const progress = budgets.map((b) => {
    const spent = round2(spentRows.find((row) => row._id === b.category)?.total || 0);
    return {
      _id: b._id,
      category: b.category,
      month: b.month,
      limit: b.limit,
      spent,
      percent: Math.round((spent / b.limit) * 100),
      remaining: round2(b.limit - spent),
    };
  });

  res.json(progress);
});
