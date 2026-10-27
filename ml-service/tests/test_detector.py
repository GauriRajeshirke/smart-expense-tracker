"""Tests for detector.py. Run from the ml-service folder with:
    python -m unittest discover -s tests -v
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from detector import detect_anomalies  # noqa: E402

VARIATION = [1, 1.1, 0.9, 1.05, 0.95, 1.15]


def demo_expenses():
    """The same fake expenses that `npm run seed` puts in MongoDB (6 months)."""
    rows = []

    def add(month, category, amount, description):
        rows.append(
            {
                "id": f"e{len(rows)}",
                "date": f"2026-{month + 1:02d}-10",
                "amount": round(amount),
                "category": category,
                "description": description,
            }
        )

    for m in range(6):
        v = VARIATION[m]
        add(m, "Rent", 18000, "House rent (demo)")
        add(m, "Food", 3200 * v, "Groceries (demo)")
        add(m, "Food", 1800 * v, "Dining out (demo)")
        add(m, "Food", 2400 * v, "Weekend food (demo)")
        add(m, "Transport", 1500 * v, "Fuel and metro (demo)")
        add(m, "Transport", 900 * v, "Cab rides (demo)")
        add(m, "Bills", 2200 * v, "Electricity and internet (demo)")
        add(m, "Entertainment", 1200 * v, "Movies and OTT (demo)")
        add(m, "Shopping", 2500 * v, "Clothes and accessories (demo)")
    # The three deliberately unusual expenses
    add(4, "Shopping", 24500, "Festival shopping spree (demo)")
    add(3, "Entertainment", 9800, "Concert tickets (demo)")
    add(5, "Food", 7800, "Party catering (demo)")
    return rows


class DetectorTests(unittest.TestCase):
    def test_finds_the_three_planted_anomalies_and_nothing_else(self):
        result = detect_anomalies(demo_expenses())
        found = {a["description"] for a in result["anomalies"]}
        self.assertEqual(
            found,
            {
                "Festival shopping spree (demo)",
                "Concert tickets (demo)",
                "Party catering (demo)",
            },
        )

    def test_severity_and_reason_text(self):
        by_desc = {a["description"]: a for a in detect_anomalies(demo_expenses())["anomalies"]}
        shopping = by_desc["Festival shopping spree (demo)"]
        self.assertEqual(shopping["severity"], "high")
        self.assertEqual(shopping["category"], "Shopping")
        self.assertIn("₹24,500", shopping["reason"])
        self.assertIn("Shopping", shopping["reason"])

    def test_sorted_most_unusual_first(self):
        scores = [a["score"] for a in detect_anomalies(demo_expenses())["anomalies"]]
        self.assertEqual(scores, sorted(scores, reverse=True))

    def test_counts_analysed_expenses(self):
        expenses = demo_expenses()
        self.assertEqual(detect_anomalies(expenses)["analyzed"], len(expenses))

    def test_same_input_gives_same_output(self):
        self.assertEqual(detect_anomalies(demo_expenses()), detect_anomalies(demo_expenses()))

    def test_steady_spending_has_no_anomalies(self):
        rows = [
            {"id": str(i), "date": "2026-10-01", "amount": 1000 + (i % 3) * 50,
             "category": "Food", "description": ""}
            for i in range(20)
        ]
        self.assertEqual(detect_anomalies(rows)["anomalies"], [])

    def test_identical_amounts_are_never_flagged(self):
        rows = [{"id": str(i), "date": "2026-10-01", "amount": 18000,
                 "category": "Rent", "description": ""} for i in range(8)]
        self.assertEqual(detect_anomalies(rows)["anomalies"], [])

    def test_two_big_spends_in_one_category_are_both_found(self):
        rows = [{"id": f"n{i}", "date": "2026-10-01", "amount": 1000 + (i % 4) * 100,
                 "category": "Shopping", "description": "normal"} for i in range(20)]
        rows.append({"id": "big1", "date": "2026-10-02", "amount": 15000,
                     "category": "Shopping", "description": "big one"})
        rows.append({"id": "big2", "date": "2026-10-03", "amount": 16000,
                     "category": "Shopping", "description": "big two"})
        found = {a["id"] for a in detect_anomalies(rows)["anomalies"]}
        self.assertEqual(found, {"big1", "big2"})

    def test_small_extra_spend_is_not_flagged(self):
        # 1.5x the usual amount is not worth a warning
        rows = [{"id": f"n{i}", "date": "2026-10-01", "amount": 1000,
                 "category": "Food", "description": ""} for i in range(15)]
        rows.append({"id": "slightly-more", "date": "2026-10-02", "amount": 1500,
                     "category": "Food", "description": ""})
        self.assertEqual(detect_anomalies(rows)["anomalies"], [])

    def test_unusually_cheap_spend_is_not_flagged(self):
        rows = [{"id": f"n{i}", "date": "2026-10-01", "amount": 5000,
                 "category": "Food", "description": ""} for i in range(15)]
        rows.append({"id": "tiny", "date": "2026-10-02", "amount": 5,
                     "category": "Food", "description": ""})
        self.assertEqual(detect_anomalies(rows)["anomalies"], [])

    def test_categories_with_too_little_history_are_skipped(self):
        rows = [{"id": str(i), "date": "2026-10-01", "amount": 100 * (i + 1),
                 "category": "Health", "description": ""} for i in range(3)]
        result = detect_anomalies(rows)
        self.assertEqual(result["skipped_categories"], ["Health"])
        self.assertEqual(result["anomalies"], [])

    def test_empty_and_bad_input(self):
        self.assertEqual(
            detect_anomalies([]), {"analyzed": 0, "anomalies": [], "skipped_categories": []}
        )
        bad = [{"id": "1", "date": "2026-10-01", "amount": "abc", "category": "Food", "description": ""},
               {"id": "2", "date": "2026-10-01", "amount": -5, "category": "Food", "description": ""}]
        self.assertEqual(detect_anomalies(bad)["analyzed"], 0)

    def test_missing_description_is_ok(self):
        rows = [{"id": str(i), "date": "2026-10-01", "amount": 1000 + i,
                 "category": "Food"} for i in range(8)]
        self.assertEqual(detect_anomalies(rows)["analyzed"], 8)


if __name__ == "__main__":
    unittest.main()
