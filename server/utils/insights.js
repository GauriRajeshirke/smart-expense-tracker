// Converts data between Express (MongoDB records) and the Python ML service.
// Kept free of database and network code so it can be unit tested.

// What we send to the ML service: only the fields it needs.
// (Never the user id, name or email.)
export function toMlPayload(transactions) {
  return {
    expenses: transactions.map((t) => ({
      id: String(t._id),
      date: new Date(t.date).toISOString().slice(0, 10),
      amount: t.amount,
      category: t.category,
      description: t.description || "",
    })),
  };
}

const isText = (value) => typeof value === "string";
const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

// Check what the ML service sent back before passing it on to the browser.
// Throws if the shape is wrong, so a broken service can't send junk to users.
export function fromMlResponse(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.anomalies) || !isNumber(data.analyzed)) {
    throw new Error("Unexpected response from the ML service");
  }

  const anomalies = data.anomalies.map((a) => {
    if (!a || !isText(a.id) || !isText(a.category) || !isNumber(a.amount)) {
      throw new Error("Unexpected anomaly format from the ML service");
    }
    return {
      id: a.id,
      date: isText(a.date) ? a.date : "",
      category: a.category,
      amount: a.amount,
      description: isText(a.description) ? a.description : "",
      severity: a.severity === "high" ? "high" : "medium",
      score: isNumber(a.score) ? a.score : 0,
      reason: isText(a.reason) ? a.reason : "",
    };
  });

  return {
    analyzed: data.analyzed,
    anomalies,
    skippedCategories: Array.isArray(data.skipped_categories)
      ? data.skipped_categories.filter(isText)
      : [],
  };
}
