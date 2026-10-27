// Shown only while the logged-in account contains records created by
// "npm run seed" (they are flagged isDemo in the database).
export default function DemoBanner() {
  return (
    <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
      <strong>Demo data:</strong> this account contains fake sample records for development and
      demonstration. Nothing here is real.
    </div>
  );
}
