"""Unusual-spending detection.

This file has no web code, so it is easy to read and to test on its own.
main.py wraps it in a FastAPI endpoint.

How it works (simple version):
1. Group the user's expenses by category (Food, Rent, Shopping, ...).
2. For each category with enough history, train a scikit-learn IsolationForest.
   It learns what a "normal" amount looks like and gives odd amounts a high score.
3. Keep only the expenses the model marks as unusual AND that are at least
   MIN_RATIO times the category's median. The second rule means we never
   warn about a small difference, only about clearly big spends.
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

MIN_SAMPLES = 6      # a category needs at least this many expenses to be analysed
MIN_RATIO = 2.0      # unusual spends must be at least 2x the category median
HIGH_RATIO = 4.0     # 4x the median or more is reported as "high" severity


def _rupees(value):
    return f"₹{value:,.0f}"


def detect_anomalies(expenses):
    """Find unusually large expenses.

    expenses: list of dicts with keys id, date, amount, category, description
    returns:  {"analyzed": int, "anomalies": [...], "skipped_categories": [...]}
    """
    empty = {"analyzed": 0, "anomalies": [], "skipped_categories": []}
    if not expenses:
        return empty

    df = pd.DataFrame(expenses)
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df = df[df["amount"] > 0]  # also drops missing (NaN) amounts
    if df.empty:
        return empty

    anomalies = []
    skipped = []

    for category, group in df.groupby("category"):
        if len(group) < MIN_SAMPLES:
            skipped.append(str(category))
            continue

        amounts = group["amount"].to_numpy(dtype=float).reshape(-1, 1)
        median = float(np.median(amounts))
        if median <= 0:
            continue

        # random_state makes the result the same every time for the same data
        model = IsolationForest(n_estimators=100, contamination="auto", random_state=42)
        model.fit(amounts)
        is_outlier = model.predict(amounts) == -1       # -1 means "unusual"
        scores = -model.score_samples(amounts)          # higher = more unusual

        for row, outlier, score in zip(group.to_dict("records"), is_outlier, scores):
            ratio = row["amount"] / median
            if not outlier or ratio < MIN_RATIO:
                continue
            anomalies.append(
                {
                    "id": str(row["id"]),
                    "date": str(row["date"]),
                    "category": str(category),
                    "amount": float(row["amount"]),
                    "description": str(row.get("description") or ""),
                    "severity": "high" if ratio >= HIGH_RATIO else "medium",
                    "score": round(float(score), 3),
                    "reason": (
                        f"{_rupees(row['amount'])} is {ratio:.1f}x your usual {category} "
                        f"spend (typical: {_rupees(median)})"
                    ),
                }
            )

    # Most unusual first
    anomalies.sort(key=lambda a: a["score"], reverse=True)
    return {
        "analyzed": int(len(df)),
        "anomalies": anomalies,
        "skipped_categories": sorted(skipped),
    }
