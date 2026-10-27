// Small helpers for showing money, dates and months.
// Dates are kept as "YYYY-MM-DD" text (or ISO text from the API), so the
// first 7 characters ("YYYY-MM") are the month key.

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

export const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

const pad = (n) => String(n).padStart(2, "0");

export const monthKey = (date) => String(date).slice(0, 7);

export const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
};

export const todayString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

// "2026-10" -> "Oct 2026"
export const monthLabel = (key) => {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
};

// "2026-10" -> "Oct"
export const monthShort = (key) => {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
  });
};
