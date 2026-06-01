export default function StatusBadge({ status }) {
  const map = {
    "En attente": "bg-amber-50 text-amber-700 border-amber-200",
    "Entretien": "bg-blue-50 text-blue-700 border-blue-200",
    "Acceptée": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Refusée": "bg-rose-50 text-rose-700 border-rose-200",
  };

  const cls = map[status] || "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${cls}`}>
      {status || "En attente"}
    </span>
  );
}