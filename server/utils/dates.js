// Month helpers. A "month key" is text like "2026-10".
// Everything is done in UTC so the server behaves the same on any computer.

export const isMonthKey = (value) =>
  typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

// "2026-10" -> { start: 1 Oct 2026, end: 1 Nov 2026 }  (end is NOT included)
export function monthRange(key) {
  const [year, month] = key.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

// The last N month keys, oldest first. Example: ["2026-05", ..., "2026-10"]
export function lastMonthKeys(count = 6, now = new Date()) {
  const keys = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export const currentMonthKey = (now = new Date()) => lastMonthKeys(1, now)[0];
