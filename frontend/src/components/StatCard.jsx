export default function StatCard2({ label, value, sub }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="text-slate-600 text-sm font-medium">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-2">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}