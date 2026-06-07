import { useEffect, useMemo, useState } from "react";
import TopLayout from "../components/TopLayout";
import api from "../services/api";
import StatCard2 from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// ⭐ ZID: Icons jdad
import { BookOpen, Briefcase, ExternalLink, FileText, Lightbulb, ChevronRight } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function DashboardPage() {
  const [apps, setApps] = useState([]);
  
  // ⭐ ZID: Resources states
  const [resources, setResources] = useState([]);
  const [offers, setOffers] = useState([]);
  const [advice, setAdvice] = useState([]);

  const load = async () => {
    try {
      const token = localStorage.getItem("token");

      // ⭐ ZID: Load ga3 f Promise.all
      const [appsRes, resourcesRes, offersRes, adviceRes] = await Promise.all([
        api.get("/applications"),
        api.get("/resources").catch(() => ({ data: [] })),      // ⭐ catch bach ma y-crashch
        api.get("/resources/offers").catch(() => ({ data: [] })),
        api.get("/resources/advice").catch(() => ({ data: [] }))
      ]);

      setApps(appsRes.data || []);
      setResources(resourcesRes.data.slice(0, 3));  // 3 seulement
      setOffers(offersRes.data.slice(0, 2));        // 2 seulement
      setAdvice(adviceRes.data.slice(0, 2));        // 2 seulement
    } catch (err) {
      console.log("ERROR:", err.response?.data);
      console.log(err.response?.status);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = apps.length;

    const byStatus = apps.reduce((acc, a) => {
      const s = a.status || "En attente";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const pending = byStatus["En attente"] || 0;
    const interview = byStatus["Entretien"] || 0;
    const accepted = byStatus["Acceptée"] || 0;
    const refused = byStatus["Refusée"] || 0;

    const responded = accepted + refused + interview;
    const responseRate = total ? Math.round((responded / total) * 100) : 0;

    const byMonth = {};
    apps.forEach((a) => {
      const d = a.applied_date || a.created_at;
      if (!d) return;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });

    const months = Object.keys(byMonth).sort();
    const values = months.map((m) => byMonth[m]);

    return { total, pending, interview, accepted, refused, responseRate, months, values };
  }, [apps]);

  const barData = {
    labels: stats.months.length ? stats.months : ["Jan", "Feb", "Mar", "Apr"],
    datasets: [{
      label: "Candidatures",
      data: stats.values.length ? stats.values : [4, 7, 3, 9],
      backgroundColor: ["#6366f1", "#8b5cf6", "#06b6d4", "#22c55e"],
      borderRadius: 14,
      borderSkipped: false,
      maxBarThickness: 55,
    }],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#111827", padding: 12, cornerRadius: 10 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#64748b" } },
      y: { beginAtZero: true, ticks: { stepSize: 1, color: "#64748b" }, grid: { color: "#e2e8f0" } },
    },
  };

  // ⭐ HELPER: Get icon by type
  const getResourceIcon = (type) => {
    switch (type) {
      case "video": return <ExternalLink size={14} className="text-rose-500" />;
      case "guide": return <BookOpen size={14} className="text-amber-500" />;
      case "tool": return <Lightbulb size={14} className="text-purple-500" />;
      default: return <FileText size={14} className="text-blue-500" />;
    }
  };

  return (
    <TopLayout>
      <div className="space-y-6">
        
        {/* ===== VUE D'ENSEMBLE (déjà existant) ===== */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-slate-900 font-semibold mb-4">Vue d'ensemble</div>

          {/* Cards row */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard2 label="Candidatures envoyées" value={stats.total} sub="Total enregistrées" />
            <StatCard2 label="En attente" value={stats.pending} sub="Sans réponse" />
            <StatCard2 label="Entretiens programmés" value={stats.interview} sub="À préparer" />
            <StatCard2 label="Taux de réponse" value={`${stats.responseRate}%`} sub="Entretien + Acceptée + Refusée" />
          </div>

          {/* Chart box */}
          <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">📈 Statistiques mensuelles</h2>
            </div>
            <div className="h-[320px]">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          {/* Recent list */}
          <div className="mt-6">
            <div className="font-semibold text-slate-900 mb-3">Candidatures récentes</div>
            <div className="space-y-3">
              {apps.slice(0, 4).map((a) => (
                <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{a.job_title}</div>
                    <div className="text-sm text-slate-500">{a.company}</div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
              {!apps.length && (
                <div className="text-sm text-slate-500">No applications yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* ⭐⭐⭐ NOUVEAU: RESSOURCES & OFFRES ⭐⭐⭐ */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* === RESSOURCES === */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-600" />
                Ressources
              </h3>
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
                {resources.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {resources.map(item => (
                <div key={item.id} className="group flex items-start gap-3 p-3 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-all cursor-pointer border border-transparent hover:border-indigo-200">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                    {getResourceIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {item.description || "Pas de description"}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 mt-1" />
                </div>
              ))}
              {resources.length === 0 && (
                <div className="text-center py-4">
                  <BookOpen size={24} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Aucune ressource</p>
                </div>
              )}
            </div>
          </div>

          {/* === OFFRES D'EMPLOI === */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Briefcase size={18} className="text-emerald-600" />
                Offres récentes
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
                {offers.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {offers.map(item => (
                <div key={item.id} className="group p-3 bg-slate-50 rounded-xl hover:bg-emerald-50 transition-all cursor-pointer border-l-4 border-l-emerald-400 hover:border-l-emerald-500">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                      {item.contract_type || "CDI"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{item.company} • {item.location || "Remote"}</p>
                  {item.salary_range && (
                    <p className="text-xs text-emerald-600 mt-1 font-medium">{item.salary_range}</p>
                  )}
                </div>
              ))}
              {offers.length === 0 && (
                <div className="text-center py-4">
                  <Briefcase size={24} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Aucune offre</p>
                </div>
              )}
            </div>
          </div>

          {/* === CONSEILS === */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-600" />
                Conseils
              </h3>
              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
                {advice.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {advice.map(item => (
                <div key={item.id} className="group p-3 bg-slate-50 rounded-xl hover:bg-amber-50 transition-all cursor-pointer border border-transparent hover:border-amber-200">
                  <h4 className="text-sm font-medium text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {item.content?.substring(0, 80)}...
                  </p>
                  {item.category && (
                    <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                  )}
                </div>
              ))}
              {advice.length === 0 && (
                <div className="text-center py-4">
                  <Lightbulb size={24} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Aucun conseil</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </TopLayout>
  );
}