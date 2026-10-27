import Transaction from "../models/Transaction.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isMonthKey, lastMonthKeys, monthRange } from "../utils/dates.js";
import { buildSummary } from "../utils/summary.js";

// GET /api/reports/summary?month=2026-10   (month is optional)
// Everything is calculated from the user's real transactions in MongoDB:
//   totals     - all-time income, expenses, balance, savings rate
//   monthly    - income vs expenses for the last 6 months
//   categories - expenses per category (for the chosen month, or all time)
export const getSummary = asyncHandler(async (req, res) => {
  const user = req.user._id;
  const monthKeys = lastMonthKeys(6);
  const { start: chartStart } = monthRange(monthKeys[0]);

  // Optional month filter for the category breakdown
  const categoryMatch = { user, type: "expense" };
  if (isMonthKey(req.query.month)) {
    const { start, end } = monthRange(req.query.month);
    categoryMatch.date = { $gte: start, $lt: end };
  }

  const [typeTotals, monthlyRows, categoryRows] = await Promise.all([
    Transaction.aggregate([
      { $match: { user } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { user, date: { $gte: chartStart } } },
      {
        $group: {
          _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } }, type: "$type" },
          total: { $sum: "$amount" },
        },
      },
    ]),
    Transaction.aggregate([
      { $match: categoryMatch },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
    ]),
  ]);

  res.json(buildSummary({ typeTotals, monthlyRows, categoryRows }, monthKeys));
});
