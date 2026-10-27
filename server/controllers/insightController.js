import Transaction from "../models/Transaction.js";
import asyncHandler from "../utils/asyncHandler.js";
import { fromMlResponse, toMlPayload } from "../utils/insights.js";

const MAX_EXPENSES = 2000;
const ML_TIMEOUT_MS = 10000;

// GET /api/insights
// Sends the logged-in user's last 12 months of expenses to the Python ML
// service and returns the unusual ones. Only this user's data is ever sent.
export const getInsights = asyncHandler(async (req, res) => {
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 12);

  const expenses = await Transaction.find({
    user: req.user._id,
    type: "expense",
    date: { $gte: since },
  })
    .sort({ date: -1 })
    .limit(MAX_EXPENSES)
    .select("amount category date description");

  const generatedAt = new Date().toISOString();

  // Nothing to analyse, so there is no need to call the ML service
  if (expenses.length === 0) {
    return res.json({ analyzed: 0, anomalies: [], skippedCategories: [], generatedAt });
  }

  const mlUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

  let mlResponse;
  try {
    mlResponse = await fetch(`${mlUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toMlPayload(expenses)),
      signal: AbortSignal.timeout(ML_TIMEOUT_MS),
    });
  } catch {
    return res.status(503).json({
      message:
        "The AI service is not running. Start it with: uvicorn main:app --port 8000 (inside the ml-service folder).",
    });
  }

  if (!mlResponse.ok) {
    return res.status(502).json({ message: "The AI service returned an error. Please try again." });
  }

  let result;
  try {
    result = fromMlResponse(await mlResponse.json());
  } catch {
    return res.status(502).json({ message: "The AI service sent an unexpected answer." });
  }

  res.json({ ...result, generatedAt });
});
